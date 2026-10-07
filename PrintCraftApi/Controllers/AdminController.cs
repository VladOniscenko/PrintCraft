using System.Security.Claims;
using System.Net.Mail;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql.EntityFrameworkCore.PostgreSQL;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using System.IO;
using PrintCraftApi.Services;

namespace PrintCraftApi.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
public class AdminController : ControllerBase
{
    private const string DefaultQuoteConfirmationMessage = "Thank you for your quote request. We reviewed your files and determined the production cost based on materials, print time, and finishing. You can now confirm and pay for your quote in your personal portal.";
    private static readonly HashSet<string> KnownStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "pending",
        "pending_quote",
        "quoted",
        "expired_quote",
        "pending_payment",
        "printing",
        "completed",
        "paid",
        "shipped",
        "sent",
        "delivered",
        "failed",
        "cancelled",
        "returned",
        "refunded"
    };

    private static readonly HashSet<string> PostPaymentStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "paid",
        "printing",
        "sent",
        "shipped",
        "delivered",
        "completed",
        "returned",
        "refunded"
    };

    private static readonly HashSet<string> AllowedNoteVisibilities = new(StringComparer.OrdinalIgnoreCase)
    {
        "internal",
        "customer",
    };

    private readonly PrintCraftDb _db;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly IInvoiceService _invoiceService;

    public AdminController(
        PrintCraftDb db,
        IEmailService emailService,
        IConfiguration configuration,
        IInvoiceService invoiceService)
    {
        _db = db;
        _emailService = emailService;
        _configuration = configuration;
        _invoiceService = invoiceService;
    }

    private static bool IsPendingStatus(string? status)
    {
        return !string.IsNullOrWhiteSpace(status)
            && status.StartsWith("pending", StringComparison.OrdinalIgnoreCase);
    }

    private static string NormalizeStatus(string? status)
        => string.IsNullOrWhiteSpace(status) ? string.Empty : status.Trim().ToLowerInvariant();

    private static string NormalizePaymentFlow(string? paymentFlow)
    {
        var normalized = string.IsNullOrWhiteSpace(paymentFlow)
            ? string.Empty
            : paymentFlow.Trim().ToLowerInvariant();

        return normalized is "bank_transfer" or "manual" or "invoice"
            ? "bank_transfer"
            : "bank_transfer";
    }

    private static bool IsBankTransferFlow(string? paymentFlow)
        => string.Equals(NormalizePaymentFlow(paymentFlow), "bank_transfer", StringComparison.OrdinalIgnoreCase);

    private static bool IsKnownStatus(string? status)
        => KnownStatuses.Contains(NormalizeStatus(status));

    private static string NormalizeNoteVisibility(string? visibility)
        => string.IsNullOrWhiteSpace(visibility) ? "internal" : visibility.Trim().ToLowerInvariant();

    private static bool IsAllowedNoteVisibility(string? visibility)
        => AllowedNoteVisibilities.Contains(NormalizeNoteVisibility(visibility));

    private static bool IsPricingLocked(Order order)
    {
        if (order.IsPaid) return true;

        var status = NormalizeStatus(order.Status);
        return status is "paid" or "printing" or "sent" or "shipped" or "delivered" or "completed";
    }

    private static bool CanTransitionStatus(string? currentStatus, string? nextStatus, bool isPaid)
    {
        var current = NormalizeStatus(currentStatus);
        var next = NormalizeStatus(nextStatus);

        if (string.IsNullOrWhiteSpace(next)) return false;
        if (!IsKnownStatus(next)) return false;
        if (string.Equals(current, next, StringComparison.OrdinalIgnoreCase)) return true;

        // Allow jumping to cancelled, returned, or refunded from almost anywhere
        if (next is "cancelled" || next is "returned" || next is "refunded") return true;

        return true;
    }

    private static decimal CalculateSubtotal(Order order)
    {
        return order.Items.Sum(i => (decimal)i.Price * (i.Count <= 0 ? 1 : i.Count));
    }

    private static void RecalculateQuotedPrice(Order order)
    {
        var normalizedDelivery = Math.Max(order.DeliveryPrice, 0m);
        var normalizedServiceFee = Math.Max(order.ServiceFeePrice, 0m);
        var normalizedDiscount = Math.Max(order.OrderDiscountAmount, 0m);
        var subtotal = CalculateSubtotal(order);
        var total = Math.Max(subtotal + normalizedDelivery + normalizedServiceFee - normalizedDiscount, 0m);

        order.DeliveryPrice = normalizedDelivery;
        order.ServiceFeePrice = normalizedServiceFee;
        order.OrderDiscountAmount = normalizedDiscount;
        order.QuotedPrice = total > 0 ? total : null;
    }

    [HttpPost("orders/{orderId:guid}/items/{itemId:guid}/calculate-price")]
    public async Task<IActionResult> CalculateItemPrice([FromRoute] Guid orderId, [FromRoute] Guid itemId, [FromServices] IPrintPricingService pricingService)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .ThenInclude(i => i.Attachments)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) return NotFound(new { message = "Order not found" });

        var item = order.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null) return NotFound(new { message = "Item not found" });

        var fileUrl = item.FileUrl;
        if (string.IsNullOrWhiteSpace(fileUrl) && item.Attachments != null && item.Attachments.Count > 0)
        {
            var modelAttachment = item.Attachments.FirstOrDefault(a => 
                a.Url.EndsWith(".stl", StringComparison.OrdinalIgnoreCase) ||
                a.Url.EndsWith(".obj", StringComparison.OrdinalIgnoreCase) ||
                a.Url.EndsWith(".3mf", StringComparison.OrdinalIgnoreCase) ||
                a.Url.EndsWith(".step", StringComparison.OrdinalIgnoreCase) ||
                a.Url.EndsWith(".stp", StringComparison.OrdinalIgnoreCase));
            fileUrl = modelAttachment?.Url ?? item.Attachments[0].Url;
        }

        if (string.IsNullOrWhiteSpace(fileUrl))
        {
            return BadRequest(new { message = "Item does not have a 3D model file." });
        }

        var fileName = ExtractFileNameFromAssetUrl(fileUrl);
        if (string.IsNullOrWhiteSpace(fileName))
        {
            return BadRequest(new { message = "Invalid model file URL." });
        }

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        var filePath = Path.Combine(uploadsFolder, fileName);
        if (!System.IO.File.Exists(filePath))
        {
            var altPath = Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads", fileName);
            if (System.IO.File.Exists(altPath))
            {
                filePath = altPath;
            }
        }

        if (!System.IO.File.Exists(filePath) && string.IsNullOrWhiteSpace(item.Size))
        {
            return NotFound(new { message = $"File '{fileName}' was not found on server." });
        }

        double scaleFactor = PrintPricingService.ResolveScaleFactor(item);

        await pricingService.CalculatePricingAsync(
            item.Id,
            System.IO.File.Exists(filePath) ? filePath : string.Empty,
            scaleFactor,
            item.InfillPercent,
            item.PrintQuality,
            item.SupportsNeeded
        );

        // Reload item to get updated values
        await _db.Entry(item).ReloadAsync();
        RecalculateQuotedPrice(order);
        await _db.SaveChangesAsync();

        return Ok(item);
    }

    [HttpPost("orders/{id:guid}/process-quote")]
    public async Task<IActionResult> ProcessFullQuote([FromRoute] Guid id, [FromBody] ProcessFullQuoteRequest payload)
    {
        var order = await _db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (IsPricingLocked(order))
            return BadRequest(new { message = "Pricing cannot be changed after payment." });

        // 1. Update all prices
        foreach (var item in order.Items)
        {
            if (payload.ItemPrices.TryGetValue(item.Id, out var price))
            {
                item.Price = price >= 0 ? price : 0;
            }
        }

        order.DeliveryPrice = payload.DeliveryPrice >= 0 ? payload.DeliveryPrice : 0;
        order.ServiceFeePrice = payload.ServiceFeePrice >= 0 ? payload.ServiceFeePrice : 0;
        order.OrderDiscountAmount = payload.OrderDiscountAmount >= 0 ? payload.OrderDiscountAmount : 0;

        RecalculateQuotedPrice(order);

        if ((order.QuotedPrice ?? 0m) <= 0)
            return BadRequest(new { message = "Quote total must be greater than zero." });

        // 2. Set Status & Details
        var paymentFlow = NormalizePaymentFlow(payload.PaymentFlow);
        var previousStatus = order.Status;

        order.QuoteMessage = string.IsNullOrWhiteSpace(payload.QuoteMessage) ? DefaultQuoteConfirmationMessage : payload.QuoteMessage;
        order.PaymentFlow = paymentFlow;
        order.Status = IsBankTransferFlow(paymentFlow) ? "pending_payment" : "quoted";
        QuoteLifecycle.MarkQuoteConfirmed(order, DateTime.UtcNow);
        order.UpdatedAt = DateTime.UtcNow;

        // 3. Handle Bank Transfer Payment Generation
        Payment? manualPayment = null;
        if (IsBankTransferFlow(paymentFlow))
        {
            manualPayment = await EnsureBankTransferPaymentAsync(order, order.QuotedPrice ?? 0m);
        }

        await _db.SaveChangesAsync();
        await LogStatusHistoryAsync(order.Id, previousStatus, order.Status, "admin", "Full quote processed and sent.");

        // 4. Send the Email
        var recipient = await ResolveOrderEmailRecipientAsync(order);
        if (recipient != null)
        {
            if (IsBankTransferFlow(paymentFlow))
            {
                await _emailService.SendQuoteConfirmationBankTransferEmailAsync(
                    recipient.Value.Email, recipient.Value.Name, order.Id, order.QuotedPrice ?? 0m, order.QuoteMessage, manualPayment!.Reference);
            }
            else
            {
                await _emailService.SendQuoteConfirmationEmailAsync(
                    recipient.Value.Email, recipient.Value.Name, order.Id, order.QuotedPrice ?? 0m, order.QuoteMessage);
            }
            await LogOrderCommunicationAsync(order.Id, "quote_confirmation", "Your quote is ready", recipient.Value.Email);
        }

        return Ok(order);
    }

    [HttpPut("orders/{id:guid}/paid")]
    public async Task<IActionResult> MarkPaid([FromRoute] Guid id)
    {
        var order = await _db.Orders
            .Include(o => o.Payments)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (!CanTransitionStatus(order.Status, "paid", order.IsPaid))
            return BadRequest(new { message = "Paid status is not allowed from the current state." });

        var previousStatus = order.Status;
        order.Status = "paid";
        order.IsPaid = true;
        order.UpdatedAt = DateTime.UtcNow;

        var paymentRecord = order.Payments
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefault();

        if (paymentRecord != null)
        {
            paymentRecord.Status = "paid";
            paymentRecord.PaidAt ??= DateTime.UtcNow;
            paymentRecord.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        await LogStatusHistoryAsync(order.Id, previousStatus, order.Status, "admin", "Marked as paid");

        return Ok(order);
    }


    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var totalUsers = await _db.Users.CountAsync();
        var totalOrders = await _db.Orders.CountAsync();
        var pendingOrders = await _db.Orders.CountAsync(o => o.Status == "pending_quote" || o.Status == "pending" || o.Status == "quoted");

        return Ok(new
        {
            totalUsers,
            totalOrders,
            pendingOrders
        });
    }

    [HttpGet("orders/{id:guid}/invoice")]
    public async Task<IActionResult> DownloadInvoice([FromRoute] Guid id, [FromQuery] string? language = "en")
    {
        var order = await _db.Orders.Include(o => o.Items).Include(o => o.Payments).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        var customer = order.UserId.HasValue ? await _db.Users.FindAsync(order.UserId.Value) : null;
        var pdf = _invoiceService.Generate(order, customer, language);
        return File(pdf, "application/pdf", $"invoice-{order.Id:N}.pdf");
    }

    [HttpGet("analytics/visits")]
    public async Task<IActionResult> GetVisitAnalytics()
    {
        var now = DateTime.UtcNow;

        var dayStart = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc).AddDays(-13);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-11);
        var yearStart = new DateTime(now.Year - 4, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var dayRaw = await _db.VisitEvents
            .AsNoTracking()
            .Where(v => v.VisitedAt >= dayStart && v.EventType == "pageview")
            .GroupBy(v => v.VisitedAt.Date)
            .Select(g => new
            {
                Day = g.Key,
                Views = g.Sum(x => x.Views),
                UniqueVisitors = g.Select(x => x.VisitorKey).Distinct().Count()
            })
            .ToListAsync();

        var dayMap = dayRaw.ToDictionary(x => x.Day, x => x);
        var viewsByDay = Enumerable.Range(0, 14)
            .Select(offset => dayStart.AddDays(offset))
            .Select(day =>
            {
                if (dayMap.TryGetValue(day, out var row))
                {
                    return new
                    {
                        label = day.ToString("yyyy-MM-dd"),
                        views = row.Views,
                        uniqueVisitors = row.UniqueVisitors
                    };
                }

                return new
                {
                    label = day.ToString("yyyy-MM-dd"),
                    views = 0,
                    uniqueVisitors = 0
                };
            })
            .ToList();

        var monthRaw = await _db.VisitEvents
            .AsNoTracking()
            .Where(v => v.VisitedAt >= monthStart && v.EventType == "pageview")
            .GroupBy(v => new { v.VisitedAt.Year, v.VisitedAt.Month })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                Views = g.Sum(x => x.Views),
                UniqueVisitors = g.Select(x => x.VisitorKey).Distinct().Count()
            })
            .ToListAsync();

        var monthMap = monthRaw.ToDictionary(x => (x.Year, x.Month), x => x);
        var viewsByMonth = Enumerable.Range(0, 12)
            .Select(offset => monthStart.AddMonths(offset))
            .Select(month =>
            {
                var key = (month.Year, month.Month);
                if (monthMap.TryGetValue(key, out var row))
                {
                    return new
                    {
                        label = month.ToString("yyyy-MM"),
                        views = row.Views,
                        uniqueVisitors = row.UniqueVisitors
                    };
                }

                return new
                {
                    label = month.ToString("yyyy-MM"),
                    views = 0,
                    uniqueVisitors = 0
                };
            })
            .ToList();

        var yearRaw = await _db.VisitEvents
            .AsNoTracking()
            .Where(v => v.VisitedAt >= yearStart && v.EventType == "pageview")
            .GroupBy(v => v.VisitedAt.Year)
            .Select(g => new
            {
                Year = g.Key,
                Views = g.Sum(x => x.Views),
                UniqueVisitors = g.Select(x => x.VisitorKey).Distinct().Count()
            })
            .ToListAsync();

        var yearMap = yearRaw.ToDictionary(x => x.Year, x => x);
        var viewsByYear = Enumerable.Range(now.Year - 4, 5)
            .Select(year =>
            {
                if (yearMap.TryGetValue(year, out var row))
                {
                    return new
                    {
                        label = year.ToString(),
                        views = row.Views,
                        uniqueVisitors = row.UniqueVisitors
                    };
                }

                return new
                {
                    label = year.ToString(),
                    views = 0,
                    uniqueVisitors = 0
                };
            })
            .ToList();

        var liveWindowStart = now.AddMinutes(-5);
        var liveVisitorsNow = await _db.VisitEvents
            .AsNoTracking()
            .Where(v => v.VisitedAt >= liveWindowStart)
            .Select(v => v.VisitorKey)
            .Distinct()
            .CountAsync();

        var locationWindowStart = now.AddDays(-30);
        var topCountries = await _db.VisitEvents
            .AsNoTracking()
            .Where(v => v.VisitedAt >= locationWindowStart && v.EventType == "pageview")
            .GroupBy(v => string.IsNullOrWhiteSpace(v.CountryCode) ? "UN" : v.CountryCode!)
            .Select(g => new
            {
                countryCode = g.Key,
                views = g.Sum(x => x.Views),
                uniqueVisitors = g.Select(x => x.VisitorKey).Distinct().Count()
            })
            .OrderByDescending(x => x.views)
            .Take(10)
            .ToListAsync();

        var topCities = await _db.VisitEvents
            .AsNoTracking()
            .Where(v => v.VisitedAt >= locationWindowStart
                && v.EventType == "pageview"
                && !string.IsNullOrWhiteSpace(v.City))
            .GroupBy(v => new { CountryCode = string.IsNullOrWhiteSpace(v.CountryCode) ? "UN" : v.CountryCode!, City = v.City! })
            .Select(g => new
            {
                countryCode = g.Key.CountryCode,
                city = g.Key.City,
                views = g.Sum(x => x.Views),
                uniqueVisitors = g.Select(x => x.VisitorKey).Distinct().Count()
            })
            .OrderByDescending(x => x.views)
            .Take(10)
            .ToListAsync();

        return Ok(new
        {
            generatedAtUtc = now,
            liveVisitorsNow,
            viewsByDay,
            viewsByMonth,
            viewsByYear,
            topCountries,
            topCities
        });
    }

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments(
        [FromQuery] Guid? orderId,
        [FromQuery] string? provider,
        [FromQuery] string? status,
        [FromQuery] string? reference,
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0) pageSize = 50;
        if (pageSize > 200) pageSize = 200;

        var query = _db.Payments
            .AsNoTracking()
            .Include(p => p.Order)
            .AsQueryable();

        if (orderId.HasValue)
            query = query.Where(p => p.OrderId == orderId.Value);

        if (!string.IsNullOrWhiteSpace(provider))
        {
            var providerNorm = provider.Trim().ToLower();
            query = query.Where(p => EF.Functions.ILike(p.Provider, providerNorm));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            var statusNorm = status.Trim().ToLower();
            query = query.Where(p => EF.Functions.ILike(p.Status, statusNorm));
        }

        if (!string.IsNullOrWhiteSpace(reference))
        {
            var referenceNorm = reference.Trim().ToLower();
            query = query.Where(p => EF.Functions.ILike(p.Reference, $"%{referenceNorm}%"));
        }

        if (fromUtc.HasValue)
            query = query.Where(p => p.CreatedAt >= fromUtc.Value);

        if (toUtc.HasValue)
            query = query.Where(p => p.CreatedAt <= toUtc.Value);

        var totalCount = await query.CountAsync();

        var results = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                p.Id,
                p.OrderId,
                p.Provider,
                p.Reference,
                p.Currency,
                p.Amount,
                p.Status,
                p.Method,
                p.FailureReason,
                p.PaidAt,
                p.CanceledAt,
                p.ExpiredAt,
                p.FailedAt,
                p.CreatedAt,
                p.UpdatedAt,
                Order = p.Order == null
                    ? null
                    : new
                    {
                        p.Order.Id,
                        p.Order.Status,
                        p.Order.UserId,
                        p.Order.FullName,
                        p.Order.OrderType
                    }
            })
            .ToListAsync();

        return Ok(new { results, totalCount, page, pageSize });
    }

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] string? sortBy,
        [FromQuery] string? sortDir,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0) pageSize = 20;

        var query = _db.Orders
            .Include(o => o.Items)
            .Include(o => o.Payments)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            var q = search.Trim();
            if (Guid.TryParse(q, out var searchId))
            {
                query = query.Where(o => o.Id == searchId);
            }
            else
            {
                query = query.Where(o => EF.Functions.ILike(o.FullName, $"%{q}%")
                    || EF.Functions.ILike(o.AddressLine1, $"%{q}%")
                    || EF.Functions.ILike(o.City, $"%{q}%")
                    || EF.Functions.ILike(o.PhoneNumber, $"%{q}%")
                    || EF.Functions.ILike(o.Status, $"%{q}%")
                    || (!string.IsNullOrEmpty(o.QuoteMessage) && EF.Functions.ILike(o.QuoteMessage, $"%{q}%"))
                );
            }
        }

        if (!string.IsNullOrEmpty(status) && status != "All")
            query = query.Where(o => o.Status == status);

        query = sortBy?.ToLower() switch
        {
            "createdat" => sortDir?.ToLower() == "desc"
                ? query.OrderByDescending(o => o.CreatedAt)
                : query.OrderBy(o => o.CreatedAt),
            "status" => sortDir?.ToLower() == "desc"
                ? query.OrderByDescending(o => o.Status)
                : query.OrderBy(o => o.Status),
            "quotedprice" => sortDir?.ToLower() == "desc"
                ? query.OrderByDescending(o => o.QuotedPrice)
                : query.OrderBy(o => o.QuotedPrice),
            _ => query.OrderByDescending(o => o.CreatedAt),
        };

        var totalCount = await query.CountAsync();
        var results = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        await RefreshQuoteStatusesAsync(results, "system");

        return Ok(new { results, totalCount, page, pageSize });
    }

    [HttpGet("orders/{id:guid}")]
    public async Task<IActionResult> GetOrderById([FromRoute] Guid id)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .ThenInclude(i => i.Attachments)
            .Include(o => o.Payments)
            .Include(o => o.Notes)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order != null)
            await RefreshQuoteStatusesAsync(new[] { order }, "system");

        return order == null ? NotFound(new { message = "Order not found" }) : Ok(order);
    }

    [HttpGet("orders/{id:guid}/communications")]
    public async Task<IActionResult> GetOrderCommunications([FromRoute] Guid id)
    {
        var exists = await _db.Orders.AnyAsync(o => o.Id == id);
        if (!exists) return NotFound(new { message = "Order not found" });

        var entries = await _db.OrderCommunications
            .Where(c => c.OrderId == id)
            .OrderByDescending(c => c.SentAt)
            .ToListAsync();

        return Ok(entries);
    }

    [HttpGet("orders/{id:guid}/status-history")]
    public async Task<IActionResult> GetOrderStatusHistory([FromRoute] Guid id)
    {
        var exists = await _db.Orders.AnyAsync(o => o.Id == id);
        if (!exists) return NotFound(new { message = "Order not found" });

        var entries = await _db.OrderStatusHistory
            .Where(s => s.OrderId == id)
            .OrderByDescending(s => s.ChangedAt)
            .ToListAsync();

        return Ok(entries);
    }

    [HttpGet("orders/{id:guid}/notes")]
    public async Task<IActionResult> GetOrderNotes([FromRoute] Guid id, [FromQuery] string? visibility)
    {
        var exists = await _db.Orders.AnyAsync(o => o.Id == id);
        if (!exists) return NotFound(new { message = "Order not found" });

        var normalizedVisibility = NormalizeNoteVisibility(visibility);
        var query = _db.OrderNotes
            .Where(n => n.OrderId == id)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(visibility))
        {
            if (!IsAllowedNoteVisibility(normalizedVisibility))
                return BadRequest(new { message = "Visibility must be one of: internal, customer." });

            query = query.Where(n => EF.Functions.ILike(n.Visibility, normalizedVisibility));
        }

        var notes = await query
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return Ok(notes);
    }

    [HttpGet("orders/{id:guid}/payments")]
    public async Task<IActionResult> GetOrderPayments([FromRoute] Guid id)
    {
        var exists = await _db.Orders.AnyAsync(o => o.Id == id);
        if (!exists) return NotFound(new { message = "Order not found" });

        var payments = await _db.Payments
            .Where(p => p.OrderId == id)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(payments);
    }

    [HttpPatch("orders/{id:guid}/status")]
    public async Task<IActionResult> UpdateOrderStatus([FromRoute] Guid id, [FromBody] UpdateOrderStatusRequest payload)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (!CanTransitionStatus(order.Status, payload.Status, order.IsPaid))
            return BadRequest(new { message = "Invalid status transition for this order." });

        var nextStatus = NormalizeStatus(payload.Status);
        var previousStatus = order.Status;
        order.Status = nextStatus;
        if (string.Equals(nextStatus, "quoted", StringComparison.OrdinalIgnoreCase))
        {
            QuoteLifecycle.MarkQuoteConfirmed(order, DateTime.UtcNow);
        }
        else if (string.Equals(nextStatus, "pending_quote", StringComparison.OrdinalIgnoreCase))
        {
            QuoteLifecycle.ClearQuoteWindow(order);
        }

        if (string.Equals(nextStatus, "paid", StringComparison.OrdinalIgnoreCase))
            order.IsPaid = true;

        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await LogStatusHistoryAsync(order.Id, previousStatus, order.Status, "admin", "Status updated");

        return Ok(order);
    }

    [HttpPatch("orders/{id:guid}/customer")]
    public async Task<IActionResult> UpdateOrderCustomer([FromRoute] Guid id, [FromBody] UpdateOrderCustomerRequest payload)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        order.FullName = payload.FullName;
        order.AddressLine1 = payload.AddressLine1;
        order.AddressLine2 = payload.AddressLine2;
        order.City = payload.City;
        order.PostalCode = payload.PostalCode;
        order.PhoneNumber = payload.PhoneNumber;
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await LogAdminActionAsync(order, "Updated customer shipping details");
        return Ok(order);
    }

    [HttpDelete("orders/{id:guid}")]
    public async Task<IActionResult> DeleteOrder([FromRoute] Guid id)
    {
        var order = await _db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (!IsPendingStatus(order.Status))
            return BadRequest(new { message = "Only pending orders can be deleted." });

        // Delete associated files
        foreach (var item in order.Items)
        {
            if (!string.IsNullOrEmpty(item.FileUrl))
            {
                DeleteUploadFileIfExists(item.FileUrl);
            }

            if (!string.IsNullOrEmpty(item.ImageUrl))
            {
                DeleteUploadFileIfExists(item.ImageUrl);
            }

            foreach (var attachment in item.Attachments)
            {
                if (!string.IsNullOrWhiteSpace(attachment.Url))
                {
                    DeleteUploadFileIfExists(attachment.Url);
                }
            }
        }

        _db.Orders.Remove(order);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0) pageSize = 20;

        var query = _db.Users.AsQueryable();
        if (!string.IsNullOrEmpty(search))
        {
            var q = search.ToLower();
            query = query.Where(u => EF.Functions.ILike(u.Name, $"%{q}%") || EF.Functions.ILike(u.Email, $"%{q}%") || EF.Functions.ILike(u.Role, $"%{q}%"));
        }

        var totalCount = await query.CountAsync();
        var results = await query
            .OrderBy(u => u.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserDto(u.Id, u.Name, u.Email, u.Role))
            .ToListAsync();
        return Ok(new { results, totalCount, page, pageSize });
    }

    [HttpGet("users/{id:guid}")]
    public async Task<IActionResult> GetUserById([FromRoute] Guid id)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound(new { message = "User not found" });

        var orders = await _db.Orders.AsNoTracking()
            .Where(o => o.UserId == id)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new
            {
                o.Id,
                o.Status,
                o.OrderType,
                o.PaymentFlow,
                o.IsPaid,
                o.QuotedPrice,
                o.FinalTotalAmount,
                o.CreatedAt,
                o.UpdatedAt,
                Payments = o.Payments.OrderByDescending(p => p.CreatedAt).Select(p => new { p.Id, p.Provider, p.Reference, p.Amount, p.Currency, p.Status, p.PaidAt, p.CreatedAt })
            }).ToListAsync();
        var addresses = await _db.UserAddresses.AsNoTracking().Where(a => a.UserId == id).OrderByDescending(a => a.IsDefault).ThenByDescending(a => a.LastUsedAt).ToListAsync();

        return Ok(new
        {
            user = new AdminUserDto(user.Id, user.Name, user.Email, user.Role),
            orders,
            addresses,
            payments = orders.SelectMany(o => o.Payments).OrderByDescending(p => p.CreatedAt)
        });
    }


    [HttpPut("users/{id:guid}")]
    public async Task<IActionResult> UpdateUser([FromRoute] Guid id, [FromBody] UpdateUserRequest updated)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "User not found" });

        var name = updated.Name?.Trim();
        var email = updated.Email?.Trim().ToLowerInvariant();
        var role = updated.Role?.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(name) || name.Length < 2 || name.Length > 80)
            return BadRequest(new { message = "Name must be between 2 and 80 characters." });

        if (!IsValidEmail(email))
            return BadRequest(new { message = "A valid email is required." });

        if (role is not ("customer" or "admin"))
            return BadRequest(new { message = "Role must be customer or admin." });

        var duplicateEmail = await _db.Users.AnyAsync(u => u.Email == email && u.Id != id);
        if (duplicateEmail)
            return BadRequest(new { message = "Email already exists." });

        var normalizedName = name ?? string.Empty;
        var normalizedEmail = email ?? string.Empty;
        var normalizedRole = role ?? "customer";

        user.Name = normalizedName;
        user.Email = normalizedEmail;
        user.Role = normalizedRole;

        await _db.SaveChangesAsync();
        return Ok(new AdminUserDto(user.Id, user.Name, user.Email, user.Role));
    }

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser([FromRoute] Guid id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "User not found" });

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("orders/{id:guid}/items/{itemId:guid}")]
    public async Task<IActionResult> UpdateOrderItem([FromRoute] Guid id, [FromRoute] Guid itemId, [FromBody] UpdateItemRequest payload)
    {
        var order = await _db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (IsPricingLocked(order))
            return BadRequest(new { message = "Pricing cannot be changed after payment or production progress." });

        var item = order.Items.FirstOrDefault(i => i.Id == itemId);
        if (item == null) return NotFound(new { message = "Item not found" });

        if (payload.Price < 0)
            return BadRequest(new { message = "Item price cannot be negative." });

        item.Price = payload.Price;
        RecalculateQuotedPrice(order);
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await LogAdminActionAsync(order, $"Updated order item price for item {item.Id}");

        return Ok(order);
    }

    [HttpPatch("orders/{id:guid}/service-fee")] // PATCH for partial update
    public async Task<IActionResult> UpdateFeePrice([FromRoute] Guid id, [FromBody] FeePriceRequest payload)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (IsPricingLocked(order))
            return BadRequest(new { message = "Pricing cannot be changed after payment or production progress." });

        if (payload.ServiceFeePrice < 0)
            return BadRequest(new { message = "Fee price cannot be negative." });

        order.ServiceFeePrice = payload.ServiceFeePrice;
        RecalculateQuotedPrice(order);
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await LogAdminActionAsync(order, $"Updated service fee to {order.ServiceFeePrice:F2}");
        return Ok(order);
    }

    [HttpPatch("orders/{id:guid}/delivery-price")] // PATCH for partial update
    public async Task<IActionResult> UpdateDeliveryPrice([FromRoute] Guid id, [FromBody] DeliveryPriceRequest payload)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (IsPricingLocked(order))
            return BadRequest(new { message = "Pricing cannot be changed after payment or production progress." });

        if (payload.DeliveryPrice < 0)
            return BadRequest(new { message = "Delivery price cannot be negative." });

        order.DeliveryPrice = payload.DeliveryPrice;
        RecalculateQuotedPrice(order);
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await LogAdminActionAsync(order, $"Updated delivery fee to {order.DeliveryPrice:F2}");
        return Ok(order);
    }

    [HttpPatch("orders/{id:guid}/order-discount")]
    public async Task<IActionResult> UpdateOrderDiscount([FromRoute] Guid id, [FromBody] OrderDiscountRequest payload)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (IsPricingLocked(order))
            return BadRequest(new { message = "Pricing cannot be changed after payment or production progress." });

        if (payload.OrderDiscountAmount < 0)
            return BadRequest(new { message = "Order discount cannot be negative." });

        order.OrderDiscountAmount = payload.OrderDiscountAmount;
        RecalculateQuotedPrice(order);
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await LogAdminActionAsync(order, $"Updated order discount to {order.OrderDiscountAmount:F2}");
        return Ok(order);
    }

    [HttpPatch("orders/{id:guid}/tracking")]
    public async Task<IActionResult> UpdateTracking([FromRoute] Guid id, [FromBody] TrackingRequest payload)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        order.TrackingCode = string.IsNullOrWhiteSpace(payload.TrackingCode)
            ? null
            : payload.TrackingCode.Trim();
        order.TrackingUrl = string.IsNullOrWhiteSpace(payload.TrackingUrl)
            ? null
            : payload.TrackingUrl.Trim();
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await LogAdminActionAsync(order, "Updated tracking information");
        return Ok(order);
    }

    [HttpPost("orders/{id:guid}/notes")]
    public async Task<IActionResult> AddOrderNote([FromRoute] Guid id, [FromBody] CreateOrderNoteRequest payload)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (string.IsNullOrWhiteSpace(payload.Content))
            return BadRequest(new { message = "Note content is required." });

        var visibility = NormalizeNoteVisibility(payload.Visibility);
        if (!IsAllowedNoteVisibility(visibility))
            return BadRequest(new { message = "Visibility must be one of: internal, customer." });

        var note = new OrderNote
        {
            OrderId = id,
            Content = payload.Content.Trim(),
            Visibility = visibility,
            CreatedBy = "admin",
            CreatedAt = DateTime.UtcNow,
        };

        _db.OrderNotes.Add(note);
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await LogAdminActionAsync(order, $"Added {visibility} note");

        return Ok(note);
    }

    [HttpDelete("orders/{id:guid}/notes/{noteId}")]
    public async Task<IActionResult> DeleteOrderNote([FromRoute] Guid id, [FromRoute] string noteId)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        var normalizedNoteId = string.IsNullOrWhiteSpace(noteId)
            ? string.Empty
            : noteId.Trim().ToLowerInvariant();

        if (normalizedNoteId == "legacy-internal")
        {
            order.InternalNotes = null;
            order.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await LogAdminActionAsync(order, "Deleted legacy internal note");
            return NoContent();
        }

        if (normalizedNoteId == "legacy-customer")
        {
            order.CustomerNotes = null;
            order.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await LogAdminActionAsync(order, "Deleted legacy customer note");
            return NoContent();
        }

        if (!Guid.TryParse(noteId, out var parsedNoteId))
            return NotFound(new { message = "Note not found" });

        var note = await _db.OrderNotes.FirstOrDefaultAsync(n => n.Id == parsedNoteId && n.OrderId == id);
        if (note == null) return NotFound(new { message = "Note not found" });

        _db.OrderNotes.Remove(note);
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await LogAdminActionAsync(order, $"Deleted note {note.Id}");

        return NoContent();
    }

    [HttpPost("orders/{id:guid}/email")]
    public async Task<IActionResult> SendOrderEmail([FromRoute] Guid id, [FromBody] SendOrderEmailRequest payload)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        var recipient = await ResolveOrderEmailRecipientAsync(order);
        if (recipient == null)
            return BadRequest(new { message = "No customer email found for this order." });

        var recipientEmail = recipient.Value.Email;
        var recipientName = recipient.Value.Name;

        var type = payload.Type?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(type))
            return BadRequest(new { message = "Email type is required." });

        switch (type)
        {
            case "quote_requested":
                await _emailService.SendQuoteRequestedEmailAsync(recipientEmail, recipientName, order.Id);
                await LogOrderCommunicationAsync(order.Id, "quote_requested", "Quote request received", recipientEmail);
                return Ok(new { message = "Quote requested email sent." });

            case "quote_confirmation":
                RecalculateQuotedPrice(order);
                var quotePrice = order.QuotedPrice ?? 0m;
                if (quotePrice <= 0)
                    return BadRequest(new { message = "Quote total must be greater than zero. Set item and delivery prices first." });

                var quoteMessage = string.IsNullOrWhiteSpace(payload.Message)
                    ? DefaultQuoteConfirmationMessage
                    : payload.Message.Trim();

                var paymentFlow = NormalizePaymentFlow(payload.PaymentFlow ?? order.PaymentFlow);

                order.QuoteMessage = quoteMessage;
                order.PaymentFlow = paymentFlow;
                if (!string.Equals(order.Status, "paid", StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(order.Status, "cancelled", StringComparison.OrdinalIgnoreCase))
                {
                    var previousStatus = order.Status;
                    order.Status = IsBankTransferFlow(paymentFlow) ? "pending_payment" : "quoted";
                    QuoteLifecycle.MarkQuoteConfirmed(order, DateTime.UtcNow);
                    await LogStatusHistoryAsync(order.Id, previousStatus, order.Status, "admin", IsBankTransferFlow(paymentFlow)
                        ? "Quote confirmation email sent with bank transfer instructions"
                        : "Quote confirmation email sent");
                }
                order.UpdatedAt = DateTime.UtcNow;

                Payment? manualPayment = null;

                if (IsBankTransferFlow(paymentFlow))
                {
                    manualPayment = await EnsureBankTransferPaymentAsync(order, quotePrice);
                }

                await _db.SaveChangesAsync();

                if (IsBankTransferFlow(paymentFlow))
                {
                    await _emailService.SendQuoteConfirmationBankTransferEmailAsync(
                        recipientEmail,
                        recipientName,
                        order.Id,
                        quotePrice,
                        quoteMessage,
                        manualPayment!.Reference);
                    await LogOrderCommunicationAsync(order.Id, "quote_confirmation_bank_transfer", "Your quote is ready", recipientEmail);
                }
                else
                {
                    await _emailService.SendQuoteConfirmationEmailAsync(
                        recipientEmail,
                        recipientName,
                        order.Id,
                        quotePrice,
                        quoteMessage);
                    await LogOrderCommunicationAsync(order.Id, "quote_confirmation", "Your quote is ready", recipientEmail);
                }
                return Ok(new { message = "Quote confirmation email sent." });

            case "order_sent_tracking":
                var trackingCode = string.IsNullOrWhiteSpace(payload.TrackingCode)
                    ? order.TrackingCode
                    : payload.TrackingCode.Trim();
                var trackingUrl = string.IsNullOrWhiteSpace(payload.TrackingUrl)
                    ? order.TrackingUrl
                    : payload.TrackingUrl.Trim();

                if (string.IsNullOrWhiteSpace(trackingCode))
                    return BadRequest(new { message = "Tracking code is required." });

                if (!string.IsNullOrWhiteSpace(payload.TrackingCode) || !string.IsNullOrWhiteSpace(payload.TrackingUrl))
                {
                    order.TrackingCode = trackingCode;
                    order.TrackingUrl = trackingUrl;
                    order.UpdatedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync();
                }

                await _emailService.SendOrderSentTrackingEmailAsync(
                    recipientEmail,
                    recipientName,
                    order.Id,
                    trackingCode,
                    trackingUrl);
                await LogOrderCommunicationAsync(order.Id, "order_sent_tracking", "Your order has been sent", recipientEmail);
                return Ok(new { message = "Order sent email sent." });

            case "custom":
                if (string.IsNullOrWhiteSpace(payload.Subject) || string.IsNullOrWhiteSpace(payload.Body))
                    return BadRequest(new { message = "Custom email requires a subject and body." });

                await _emailService.SendCustomEmailAsync(
                    recipientEmail,
                    recipientName,
                    payload.Subject.Trim(),
                    payload.Body.Trim());

                await LogOrderCommunicationAsync(
                    order.Id,
                    string.IsNullOrWhiteSpace(payload.Template) ? "custom_email" : $"custom_email:{payload.Template.Trim().ToLowerInvariant()}",
                    payload.Subject.Trim(),
                    recipientEmail);

                return Ok(new { message = "Custom email sent." });

            default:
                return BadRequest(new { message = "Unsupported email type." });
        }
    }

    private async Task<(string Email, string Name)?> ResolveOrderEmailRecipientAsync(Order order)
    {
        if (order.UserId.HasValue)
        {
            var user = await _db.Users.FindAsync(order.UserId.Value);
            if (user != null && !string.IsNullOrWhiteSpace(user.Email))
            {
                var name = string.IsNullOrWhiteSpace(user.Name) ? user.Email : user.Name;
                return (user.Email.Trim(), name.Trim());
            }
        }

        var recentEmail = await _db.OrderCommunications
            .Where(c => c.OrderId == order.Id && !string.IsNullOrWhiteSpace(c.RecipientEmail))
            .OrderByDescending(c => c.SentAt)
            .Select(c => c.RecipientEmail)
            .FirstOrDefaultAsync();

        if (!string.IsNullOrWhiteSpace(recentEmail))
        {
            var name = string.IsNullOrWhiteSpace(order.FullName) ? "Customer" : order.FullName.Trim();
            return (recentEmail.Trim(), name);
        }

        return null;
    }

    public record CreateOrderNoteRequest(string Content, string Visibility);
    public record UpdateItemRequest(double Price);
    public record DeliveryPriceRequest(decimal DeliveryPrice);
    public record FeePriceRequest(decimal ServiceFeePrice);
    public record OrderDiscountRequest(decimal OrderDiscountAmount);
    public record UpdateOrderStatusRequest(string Status);
    public record UpdateOrderCustomerRequest(
        string FullName,
        string AddressLine1,
        string? AddressLine2,
        string City,
        string PostalCode,
        string PhoneNumber);
    public record TrackingRequest(string? TrackingCode, string? TrackingUrl);
    public record SendOrderEmailRequest(string Type, decimal? Price, string? Message, string? TrackingCode, string? TrackingUrl, string? PaymentFlow, string? Subject, string? Body, string? Template);
    public record AdminUserDto(Guid Id, string Name, string Email, string Role);
    public record UpdateUserRequest(string Name, string Email, string Role);

    public record ProcessFullQuoteRequest(
        Dictionary<Guid, double> ItemPrices,
        decimal DeliveryPrice,
        decimal ServiceFeePrice,
        decimal OrderDiscountAmount,
        string QuoteMessage,
        string PaymentFlow
    );

    private static bool IsValidEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;

        try
        {
            _ = new MailAddress(email);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private async Task RefreshQuoteStatusesAsync(IEnumerable<Order> orders, string changedBy)
    {
        var transitions = new List<(Guid OrderId, string PreviousStatus, string NewStatus, string Note)>();
        var changed = false;

        foreach (var order in orders)
        {
            var previousStatus = order.Status;
            var result = QuoteLifecycle.ApplyQuoteExpiration(order, DateTime.UtcNow);
            if (!result.HasChanges)
                continue;

            changed = true;

            if (result.StatusChanged)
            {
                transitions.Add((
                    order.Id,
                    previousStatus,
                    order.Status,
                    "Quote expired after 7 days without payment"));
            }
        }

        if (!changed)
            return;

        await _db.SaveChangesAsync();

        foreach (var transition in transitions)
        {
            await LogStatusHistoryAsync(
                transition.OrderId,
                transition.PreviousStatus,
                transition.NewStatus,
                changedBy,
                transition.Note);
        }
    }

    private async Task LogOrderCommunicationAsync(Guid orderId, string type, string subject, string recipientEmail)
    {
        _db.OrderCommunications.Add(new OrderCommunication
        {
            OrderId = orderId,
            Channel = "email",
            CommunicationType = type,
            Subject = subject,
            RecipientEmail = recipientEmail,
            SentAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync();
    }

    private async Task LogStatusHistoryAsync(Guid orderId, string? previousStatus, string? newStatus, string changedBy, string? note)
    {
        if (string.IsNullOrWhiteSpace(newStatus)) return;
        if (string.Equals(previousStatus, newStatus, StringComparison.OrdinalIgnoreCase)) return;

        _db.OrderStatusHistory.Add(new OrderStatusHistory
        {
            OrderId = orderId,
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            ChangedAt = DateTime.UtcNow,
            ChangedBy = changedBy,
            Note = note,
        });

        await _db.SaveChangesAsync();
    }

    private async Task LogAdminActionAsync(Order order, string note)
    {
        var status = string.IsNullOrWhiteSpace(order.Status) ? "pending_quote" : order.Status;

        _db.OrderStatusHistory.Add(new OrderStatusHistory
        {
            OrderId = order.Id,
            PreviousStatus = status,
            NewStatus = status,
            ChangedAt = DateTime.UtcNow,
            ChangedBy = "admin_action",
            Note = note,
        });

        await _db.SaveChangesAsync();
    }

    private async Task<Payment> EnsureBankTransferPaymentAsync(Order order, decimal amount)
    {
        var payment = await _db.Payments
            .Where(p => p.OrderId == order.Id && p.Provider == "bank_transfer")
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();

        if (payment == null)
        {
            payment = new Payment
            {
                OrderId = order.Id,
                Provider = "bank_transfer",
                Reference = BuildPaymentReference(order.Id),
                Currency = string.IsNullOrWhiteSpace(_configuration["CurrencyCode"]) ? "EUR" : _configuration["CurrencyCode"]!.Trim().ToUpperInvariant(),
                Amount = amount,
                Status = "pending",
                Method = "bank_transfer",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _db.Payments.Add(payment);
            return payment;
        }

        payment.Amount = amount;
        payment.Currency = string.IsNullOrWhiteSpace(_configuration["CurrencyCode"]) ? payment.Currency : _configuration["CurrencyCode"]!.Trim().ToUpperInvariant();
        payment.Status = string.Equals(payment.Status, "paid", StringComparison.OrdinalIgnoreCase) ? payment.Status : "pending";
        payment.Method = "bank_transfer";
        payment.FailureReason = null;
        payment.CanceledAt = null;
        payment.ExpiredAt = null;
        payment.FailedAt = null;
        payment.UpdatedAt = DateTime.UtcNow;

        return payment;
    }

    private static string BuildPaymentReference(Guid orderId)
        => $"PC-{orderId.ToString("N")[..8]}-{Guid.NewGuid().ToString("N")[..12]}";

    private static string? ExtractFileNameFromAssetUrl(string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl)) return null;

        var path = rawUrl.Trim();
        if (Uri.TryCreate(path, UriKind.Absolute, out var absoluteUri))
        {
            path = absoluteUri.AbsolutePath;
        }

        var normalizedPath = path.Replace('\\', '/');
        var withoutQuery = normalizedPath.Split('?', '#')[0];
        var fileName = Path.GetFileName(withoutQuery);
        if (string.IsNullOrWhiteSpace(fileName)) return null;
        if (fileName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0) return null;

        return fileName;
    }

    private static void DeleteUploadFileIfExists(string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl)) return;

        var path = rawUrl.Trim();
        if (Uri.TryCreate(path, UriKind.Absolute, out var absoluteUri))
        {
            path = absoluteUri.AbsolutePath;
        }

        var normalizedPath = path.Replace('\\', '/');
        if (!normalizedPath.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase))
            return;

        var fileName = Path.GetFileName(normalizedPath);
        if (string.IsNullOrWhiteSpace(fileName)) return;
        if (fileName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0) return;

        var uploadsRoot = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads"));
        var filePath = Path.GetFullPath(Path.Combine(uploadsRoot, fileName));

        if (!filePath.StartsWith(uploadsRoot + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            return;

        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
        }
    }
}
