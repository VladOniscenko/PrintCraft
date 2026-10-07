using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Mail;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PrintCraftApi.Configuration;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using PrintCraftApi.Validation;
using PrintCraftApi.Services;

namespace PrintCraftApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private static readonly HashSet<string> ModelFileExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".stl",
        ".obj",
        ".3mf",
        ".step",
        ".stp"
    };

    private readonly PrintCraftDb _db;
    private readonly IWebHostEnvironment _env;
    private readonly IEmailService _emailService;
    private readonly IDiscordWebhookService _discordWebhookService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OrdersController> _logger;
    private readonly IPricingQueue _pricingQueue;

    public OrdersController(
        PrintCraftDb db,
        IWebHostEnvironment env,
        IEmailService emailService,
        IDiscordWebhookService discordWebhookService,
        IConfiguration configuration,
        ILogger<OrdersController> logger,
        IPricingQueue pricingQueue)
    {
        _db = db;
        _env = env;
        _emailService = emailService;
        _discordWebhookService = discordWebhookService;
        _configuration = configuration;
        _logger = logger;
        _pricingQueue = pricingQueue;
    }

    private static bool IsPendingStatus(string? status)
    {
        return !string.IsNullOrWhiteSpace(status)
            && status.StartsWith("pending", StringComparison.OrdinalIgnoreCase);
    }

    private static bool CanCustomerCancelOrder(string? status)
    {
        if (IsPendingStatus(status)) return true;
        return string.Equals(status, "quoted", StringComparison.OrdinalIgnoreCase);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userIdStr = User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

        var userId = Guid.Parse(userIdStr);
        var userExists = await _db.Users.AnyAsync(u => u.Id == userId);
        if (!userExists)
            return Unauthorized(new { message = "User account no longer exists. Please log in again." });

        var orders = await _db.Orders
            .Where(o => o.UserId == userId)
            .Include(o => o.Items)
            .ThenInclude(i => i.Attachments)
            .Include(o => o.Payments)
            .Include(o => o.Notes)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        await RefreshQuoteStatusesAsync(orders, "system");

        return Ok(orders.Select(MapOrderForCustomer));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById([FromRoute] Guid id)
    {
        var userIdStr = User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

        var userId = Guid.Parse(userIdStr);
        var userExists = await _db.Users.AnyAsync(u => u.Id == userId);
        if (!userExists)
            return Unauthorized(new { message = "User account no longer exists. Please log in again." });

        var order = await _db.Orders
            .Include(o => o.Items)
            .ThenInclude(i => i.Attachments)
            .Include(o => o.Payments)
            .Include(o => o.Notes)
            .FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);

        if (order != null)
            await RefreshQuoteStatusesAsync(new[] { order }, "system");

        return order != null ? Ok(MapOrderForCustomer(order)) : NotFound(new { message = "Order not found or access denied." });
    }

    [HttpGet("{id:guid}/payments")]
    public async Task<IActionResult> GetPayments([FromRoute] Guid id)
    {
        var userIdStr = User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

        var userId = Guid.Parse(userIdStr);
        var userExists = await _db.Users.AnyAsync(u => u.Id == userId);
        if (!userExists)
            return Unauthorized(new { message = "User account no longer exists. Please log in again." });

        var orderExists = await _db.Orders.AnyAsync(o => o.Id == id && o.UserId == userId);
        if (!orderExists)
            return NotFound(new { message = "Order not found or access denied." });

        var payments = await _db.Payments
            .Where(p => p.OrderId == id)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(payments);
    }

    [HttpPost("quote")]
    [AllowAnonymous]
    [EnableRateLimiting("QuoteLimit")]
    public async Task<IActionResult> CreateQuote([FromBody] QuoteRequest request)
    {
        if (!request.AgreementAccepted)
            return BadRequest(new { message = "You must accept the service agreement and conditions before submitting a quote." });
        var isAuthenticated = User?.Identity?.IsAuthenticated == true;
        var userIdStr = User?.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? userId = null;
        User? user = null;
        string? guestEmail = null;
        string? guestName = null;
        string? guestPhone = null;
        var accountCreated = false;

        if (isAuthenticated)
        {
            if (string.IsNullOrWhiteSpace(userIdStr) || !Guid.TryParse(userIdStr, out var parsedUserId))
                return Unauthorized();

            userId = parsedUserId;
            user = await _db.Users.FindAsync(parsedUserId);
            if (user == null)
                return Unauthorized(new { message = "User account no longer exists. Please log in again." });
        }
        else
        {
            guestName = request.GuestName?.Trim();
            guestEmail = request.GuestEmail?.Trim().ToLowerInvariant();
            guestPhone = request.GuestPhone?.Trim();

            if (string.IsNullOrWhiteSpace(guestName) || guestName.Length < 2 || guestName.Length > 80)
                return BadRequest(new { message = "Guest full name must be between 2 and 80 characters." });

            if (!IsValidEmail(guestEmail))
                return BadRequest(new { message = "A valid guest email is required." });

            user = await _db.Users.FirstOrDefaultAsync(u => u.Email == guestEmail);
        }

        var shippingValidation = ShippingInfoValidator.Validate(
            request.ShippingFullName,
            request.ShippingPhoneNumber,
            request.ShippingAddressLine1,
            request.ShippingCity,
            request.ShippingPostalCode);

        if (!shippingValidation.IsValid)
        {
            return BadRequest(new
            {
                message = "Please provide valid shipping details for the quote.",
                errors = shippingValidation.Errors
            });
        }

        if (request.Items == null || request.Items.Count == 0)
        {
            return BadRequest(new { message = "At least one model is required for a quote." });
        }

        if (request.Items.Any(i => i.Count <= 0))
        {
            return BadRequest(new { message = "Each quote item must include a valid quantity." });
        }

        if (request.Items.Any(i => string.IsNullOrWhiteSpace(i.FileUrl)
            && string.IsNullOrWhiteSpace(i.ImageUrl)
            && string.IsNullOrWhiteSpace(i.Notes)))
        {
            return BadRequest(new { message = "Each quote item must include either a model, reference image, or description." });
        }

        if (request.Items.Any(i => i.Count > AppLimits.MaxItemQuantity))
        {
            return BadRequest(new { message = $"Item quantity cannot exceed {AppLimits.MaxItemQuantity} per model." });
        }

        foreach (var item in request.Items)
        {
            var urls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var modelUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var file in item.Files ?? Enumerable.Empty<QuoteItemFileRequest>())
            {
                if (string.IsNullOrWhiteSpace(file.Url)) continue;

                var url = file.Url.Trim();
                urls.Add(url);

                if (IsModelFileKindOrExtension(file.Kind, url))
                    modelUrls.Add(url);
            }

            if (!string.IsNullOrWhiteSpace(item.FileUrl))
            {
                var fileUrl = item.FileUrl.Trim();
                urls.Add(fileUrl);

                // Legacy fileUrl is expected to be the model attachment.
                if (IsModelFileKindOrExtension("model", fileUrl))
                    modelUrls.Add(fileUrl);
            }

            if (!string.IsNullOrWhiteSpace(item.ImageUrl))
                urls.Add(item.ImageUrl.Trim());

            if (urls.Count > 3)
            {
                return BadRequest(new { message = "Each item can contain at most 3 files." });
            }

            if (modelUrls.Count > 1)
            {
                return BadRequest(new { message = "Only one 3D model file is allowed per item." });
            }

            if (urls.Any(InputSanitizer.ContainsDirectoryTraversal))
                return BadRequest(new { message = "Invalid file URL." });

            if (InputSanitizer.ContainsSqlInjection(item.Notes) ||
                InputSanitizer.ContainsSqlInjection(item.FileName) ||
                InputSanitizer.ContainsSqlInjection(item.Material) ||
                InputSanitizer.ContainsSqlInjection(item.Color))
            {
                return BadRequest(new { message = "Invalid input detected." });
            }
        }

        if (!isAuthenticated && user == null)
        {
            user = new User
            {
                Name = guestName!,
                Email = guestEmail!,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N")),
                Role = "customer",
            };

            _db.Users.Add(user);
            accountCreated = true;
        }

        if (user != null)
        {
            userId = user.Id;
        }

        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Status = "pending_quote",
            OrderType = "quote",
            IsPaid = false,
            AgreementAccepted = true,
            AgreementVersion = string.IsNullOrWhiteSpace(request.AgreementVersion) ? "2026-09-23" : request.AgreementVersion.Trim(),
            AgreementAcceptedAt = DateTime.UtcNow,
            QuotedPrice = null,
            QuoteMessage = null,
            FullName = shippingValidation.FullName,
            PhoneNumber = shippingValidation.PhoneNumber,
            AddressLine1 = shippingValidation.AddressLine1,
            City = shippingValidation.City,
            PostalCode = shippingValidation.PostalCode,
            Items = request.Items.Select(item =>
            {
                var files = (item.Files ?? new List<QuoteItemFileRequest>())
                    .Where(f => !string.IsNullOrWhiteSpace(f.Url))
                    .Select(f => new QuoteItemFileRequest(
                        f.Url.Trim(),
                        string.IsNullOrWhiteSpace(f.Name) ? string.Empty : f.Name.Trim(),
                        string.IsNullOrWhiteSpace(f.Kind) ? "other" : f.Kind.Trim().ToLowerInvariant()))
                    .ToList();

                var firstModelFile = files.FirstOrDefault(f => string.Equals(f.Kind, "model", StringComparison.OrdinalIgnoreCase));
                var firstImageFile = files.FirstOrDefault(f => string.Equals(f.Kind, "image", StringComparison.OrdinalIgnoreCase));
                var fallbackFile = files.FirstOrDefault();

                var fileUrl = firstModelFile?.Url
                    ?? (string.IsNullOrWhiteSpace(item.FileUrl) ? null : item.FileUrl.Trim())
                    ?? fallbackFile?.Url;

                var imageUrl = firstImageFile?.Url
                    ?? (string.IsNullOrWhiteSpace(item.ImageUrl) ? null : item.ImageUrl.Trim());

                var fileName = firstModelFile?.Name
                    ?? (string.IsNullOrWhiteSpace(item.FileName) ? null : item.FileName.Trim())
                    ?? fallbackFile?.Name;

                var orderItem = new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = Guid.Empty,
                    FileUrl = fileUrl,
                    ImageUrl = imageUrl,
                    fileName = InputSanitizer.SanitizeFileName(fileName),
                    Notes = InputSanitizer.SanitizeText(item.Notes),
                    Size = InputSanitizer.SanitizeText(item.Size, 100),
                    Material = InputSanitizer.SanitizeText(item.Material) ?? "Custom",
                    Color = InputSanitizer.SanitizeText(item.Color) ?? "Custom",
                    Count = item.Count,
                    Price = 0,
                    ScaleFactor = item.ScaleFactor is > 0 ? item.ScaleFactor.Value : 1.0,
                    InfillPercent = item.InfillPercent is > 0 and <= 100 ? item.InfillPercent.Value : 20,
                    PrintQuality = InputSanitizer.SanitizeText(item.PrintQuality, 50) ?? "Standard (0.20mm)",
                    SupportsNeeded = item.SupportsNeeded ?? false,
                    Attachments = files.Select(f => new OrderItemAttachment
                    {
                        Id = Guid.NewGuid(),
                        OrderItemId = Guid.Empty,
                        Url = f.Url,
                        FileName = InputSanitizer.SanitizeFileName(f.Name) ?? f.Name ?? string.Empty,
                        Kind = f.Kind ?? "other",
                    }).ToList(),
                };

                return orderItem;
            }).ToList(),
        };

        if (order.Items != null)
        {
            foreach (var item in order.Items)
            {
                item.OrderId = order.Id;
                if (item.Attachments != null)
                {
                    foreach (var attachment in item.Attachments)
                    {
                        attachment.OrderItemId = item.Id;
                    }
                }
            }
        }

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();
        
        // Queue items for pricing
        if (order.Items != null)
        {
            foreach (var item in order.Items)
            {
                await _pricingQueue.QueueOrderItemAsync(item.Id);
            }
        }

        await LogStatusHistoryAsync(
            order.Id,
            null,
            order.Status,
            isAuthenticated ? "customer" : "guest",
            "Quote requested");

        if (!isAuthenticated && accountCreated && user != null)
        {
            var resetToken = GeneratePasswordResetToken(user);
            var frontendBaseUrl = GetRequiredConfig("FrontendBaseUrl").TrimEnd('/');
            var resetLink = $"{frontendBaseUrl}/reset-password?token={Uri.EscapeDataString(resetToken)}";

            try
            {
                await _emailService.SendResetPasswordEmailAsync(user.Email, user.Name, resetLink);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed sending password setup email for newly created quote account {UserId}", user.Id);
            }
        }

        _logger.LogInformation("About to send Discord quote notification for order {OrderId}", order.Id);
        try
        {
            _logger.LogInformation("Discord webhook service is available, calling SendQuoteRequestedAsync");
            await _discordWebhookService.SendQuoteRequestedAsync(order, user);
            _logger.LogInformation("Discord webhook call completed for order {OrderId}", order.Id);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed sending quote Discord notification for order {OrderId}", order.Id);
        }

        try
        {
            var recipientEmail = user?.Email;
            var recipientName = string.IsNullOrWhiteSpace(user?.Name)
                ? (recipientEmail ?? guestName ?? "Customer")
                : user!.Name;

            if (!string.IsNullOrWhiteSpace(recipientEmail))
            {
                await _emailService.SendQuoteRequestedEmailAsync(recipientEmail, recipientName, order.Id);
                await LogOrderCommunicationAsync(
                    order.Id,
                    "quote_requested",
                    "Quote request received",
                    recipientEmail);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed sending quote-requested email for order {OrderId}", order.Id);
        }

        return CreatedAtAction(nameof(GetById), new { id = order.Id }, new { id = order.Id, order = MapOrderForCustomer(order), accountCreated });
    }

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

    private static bool IsModelFileKindOrExtension(string? kind, string? url)
    {
        if (string.Equals(kind, "model", StringComparison.OrdinalIgnoreCase))
            return true;

        if (string.IsNullOrWhiteSpace(url))
            return false;

        var sanitizedUrl = url.Split('?', '#')[0];
        var extension = Path.GetExtension(sanitizedUrl);
        return !string.IsNullOrWhiteSpace(extension) && ModelFileExtensions.Contains(extension);
    }

    private string GeneratePasswordResetToken(User user)
    {
        var key = GetJwtSigningKey();
        var tokenHandler = new JwtSecurityTokenHandler();
        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("purpose", "password_reset"),
            }),
            Expires = DateTime.UtcNow.AddMinutes(30),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature),
        };

        var token = tokenHandler.CreateToken(descriptor);
        return tokenHandler.WriteToken(token);
    }

    private byte[] GetJwtSigningKey()
    {
        var secret = _configuration["JwtSecret"];
        if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32)
            throw new InvalidOperationException("JwtSecret must be configured and at least 32 characters long.");

        return Encoding.ASCII.GetBytes(secret);
    }

    private string GetRequiredConfig(string key)
    {
        var value = _configuration[key];
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException($"{key} must be configured via environment variables.");

        return value;
    }

    [HttpPut("{id:guid}/shipping")]
    public async Task<IActionResult> SaveQuoteShipping([FromRoute] Guid id, [FromBody] SaveQuoteShippingRequest request)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

        var userId = Guid.Parse(userIdStr);
        var userExists = await _db.Users.AnyAsync(u => u.Id == userId);
        if (!userExists)
            return Unauthorized(new { message = "User account no longer exists. Please log in again." });

        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);
        if (order == null)
            return NotFound(new { message = "Order not found." });

        if (!string.Equals(order.OrderType, "quote", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Shipping can only be updated for quote orders." });

        if (order.IsPaid)
            return BadRequest(new { message = "Paid orders cannot be updated." });

        var shippingValidation = ShippingInfoValidator.Validate(
            request.FullName,
            request.PhoneNumber,
            request.AddressLine1,
            request.City,
            request.PostalCode);

        if (!shippingValidation.IsValid)
        {
            return BadRequest(new
            {
                message = "Please correct shipping info and try again.",
                errors = shippingValidation.Errors
            });
        }

        order.FullName = shippingValidation.FullName;
        order.PhoneNumber = shippingValidation.PhoneNumber;
        order.AddressLine1 = shippingValidation.AddressLine1;
        order.City = shippingValidation.City;
        order.PostalCode = shippingValidation.PostalCode;
        order.UpdatedAt = DateTime.UtcNow;

        await UpsertSavedAddressAsync(userId, request, shippingValidation);

        await _db.SaveChangesAsync();

        return Ok(MapOrderForCustomer(order));
    }

    [HttpPut("{id:guid}/cancel")]
    public async Task<IActionResult> CancelOrder([FromRoute] Guid id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

        var userId = Guid.Parse(userIdStr);
        var userExists = await _db.Users.AnyAsync(u => u.Id == userId);
        if (!userExists)
            return Unauthorized(new { message = "User account no longer exists. Please log in again." });

        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);

        if (order == null)
            return NotFound(new { message = "Order not found." });

        if (!CanCustomerCancelOrder(order.Status))
            return BadRequest(new { message = "Only pending or quoted orders can be cancelled." });

        var previousStatus = order.Status;
        order.Status = "cancelled";
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await LogStatusHistoryAsync(order.Id, previousStatus, order.Status, "user", "Order cancelled by user");

        return Ok(new { message = "Order cancelled.", orderId = id });
    }

    [HttpPost("{id:guid}/request-new-quote")]
    public async Task<IActionResult> RequestNewQuote([FromRoute] Guid id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

        var userId = Guid.Parse(userIdStr);
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId);

        if (order == null)
            return NotFound(new { message = "Order not found." });

        if (!string.Equals(order.OrderType, "quote", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Only quote orders can request a new quote." });

        if (order.IsPaid)
            return BadRequest(new { message = "Paid orders cannot request a new quote." });

        var statusBeforeLifecycle = order.Status;
        var lifecycle = QuoteLifecycle.ApplyQuoteExpiration(order, DateTime.UtcNow);
        if (lifecycle.HasChanges)
        {
            await _db.SaveChangesAsync();
            if (lifecycle.StatusChanged)
            {
                await LogStatusHistoryAsync(
                    order.Id,
                    statusBeforeLifecycle,
                    order.Status,
                    "system",
                    "Quote expired after 7 days without payment");
            }
        }

        if (!string.Equals(order.Status, "expired_quote", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "A new quote can be requested only after the previous quote expires." });

        var previousStatus = order.Status;
        order.Status = "pending_quote";
        order.QuotedPrice = null;
        order.QuoteMessage = null;
        QuoteLifecycle.ClearQuoteWindow(order);
        order.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await LogStatusHistoryAsync(order.Id, previousStatus, order.Status, "customer", "Customer requested a new quote after expiration");

        return Ok(MapOrderForCustomer(order));
    }

    [HttpPost("{id:guid}/manual-payment-notification")]
    [EnableRateLimiting("AuthBurst")]
    public async Task<IActionResult> NotifyManualPayment([FromRoute] Guid id, [FromBody] ManualPaymentNotificationRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userId, out var parsedUserId)) return Unauthorized();

        var order = await _db.Orders.Include(o => o.Payments).FirstOrDefaultAsync(o => o.Id == id && o.UserId == parsedUserId);
        if (order == null) return NotFound(new { message = "Order not found." });
        if (!string.Equals(order.PaymentFlow, "bank_transfer", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "This order does not use manual payment." });
        if (order.IsPaid) return BadRequest(new { message = "This order is already marked as paid." });

        var cooldownUntil = DateTime.UtcNow.AddHours(-1);
        var recent = await _db.ManualPaymentNotifications
            .Where(n => n.OrderId == id)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => (DateTime?)n.CreatedAt)
            .FirstOrDefaultAsync();
        if (recent.HasValue && recent.Value > cooldownUntil)
            return Conflict(new { message = "Please wait before sending another payment notification.", nextAllowedAt = recent.Value.AddHours(1) });

        var notification = new ManualPaymentNotification { OrderId = id, Message = string.IsNullOrWhiteSpace(request.Message) ? null : request.Message.Trim() };
        _db.ManualPaymentNotifications.Add(notification);
        _db.OrderNotes.Add(new OrderNote { OrderId = id, Visibility = "internal", CreatedBy = "customer", Content = $"Customer reported manual payment.{(string.IsNullOrWhiteSpace(notification.Message) ? string.Empty : $" Message: {notification.Message}")}" });
        await _db.SaveChangesAsync();

        try
        {
            var user = await _db.Users.FindAsync(parsedUserId);
            var payment = order.Payments.OrderByDescending(p => p.CreatedAt).FirstOrDefault();
            await _discordWebhookService.SendPaymentIssueAsync(order, user, payment?.Amount ?? order.FinalTotalAmount, "manual_payment_reported", payment?.Reference, notification.Message);
        }
        catch (Exception ex) { _logger.LogWarning(ex, "Manual payment notification alert failed for order {OrderId}", id); }

        return Ok(new { message = "Payment notification received. We will verify your transfer shortly." });
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

    private async Task UpsertSavedAddressAsync(
        Guid userId,
        SaveQuoteShippingRequest request,
        ShippingInfoValidationResult shippingValidation)
    {
        const string? normalizedAddressLine2 = null;

        var existing = await _db.UserAddresses.FirstOrDefaultAsync(a =>
            a.UserId == userId
            && a.FullName == shippingValidation.FullName
            && a.PhoneNumber == shippingValidation.PhoneNumber
            && a.AddressLine1 == shippingValidation.AddressLine1
            && a.AddressLine2 == normalizedAddressLine2
            && a.City == shippingValidation.City
            && a.PostalCode == shippingValidation.PostalCode);

        if (existing != null)
        {
            existing.LastUsedAt = DateTime.UtcNow;
            existing.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return;
        }

        var hasDefault = await _db.UserAddresses.AnyAsync(a => a.UserId == userId && a.IsDefault);
        _db.UserAddresses.Add(new UserAddress
        {
            UserId = userId,
            FullName = shippingValidation.FullName,
            PhoneNumber = shippingValidation.PhoneNumber,
            AddressLine1 = shippingValidation.AddressLine1,
            AddressLine2 = normalizedAddressLine2,
            City = shippingValidation.City,
            PostalCode = shippingValidation.PostalCode,
            IsDefault = !hasDefault,
            LastUsedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync();
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

    private object MapOrderForCustomer(Order order)
    {
        var noteItems = new List<object>();
        var bankTransferAccountName = _configuration["BankTransfer:AccountName"]?.Trim();
        var bankTransferIban = _configuration["BankTransfer:Iban"]?.Trim();
        var bankTransferBic = _configuration["BankTransfer:Bic"]?.Trim();
        var hasBankTransferDetails =
            !string.IsNullOrWhiteSpace(bankTransferAccountName)
            || !string.IsNullOrWhiteSpace(bankTransferIban)
            || !string.IsNullOrWhiteSpace(bankTransferBic);

        if (order.Notes != null)
        {
            noteItems.AddRange(order.Notes
                .Where(n => string.Equals(n.Visibility, "customer", StringComparison.OrdinalIgnoreCase))
                .OrderBy(n => n.CreatedAt)
                .Select(n => new
                {
                    n.Id,
                    n.Content,
                    n.Visibility,
                    n.CreatedBy,
                    n.CreatedAt,
                }));
        }

        // Backward-compatibility for older orders that only used the single CustomerNotes field.
        if (string.IsNullOrWhiteSpace(order.CustomerNotes) == false
            && noteItems.Count == 0)
        {
            noteItems.Add(new
            {
                Id = Guid.Empty,
                Content = order.CustomerNotes,
                Visibility = "customer",
                CreatedBy = "admin",
                CreatedAt = order.UpdatedAt,
            });
        }

        var orderItems = (order.Items ?? new List<OrderItem>())
            .Select(item =>
            {
                var files = new List<object>();
                var seenUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                if (item.Attachments != null)
                {
                    foreach (var attachment in item.Attachments)
                    {
                        if (string.IsNullOrWhiteSpace(attachment.Url)) continue;
                        var url = attachment.Url.Trim();
                        if (!seenUrls.Add(url)) continue;

                        files.Add(new
                        {
                            url,
                            name = string.IsNullOrWhiteSpace(attachment.FileName) ? "file" : attachment.FileName,
                            kind = string.IsNullOrWhiteSpace(attachment.Kind) ? "other" : attachment.Kind,
                        });
                    }
                }

                if (!string.IsNullOrWhiteSpace(item.FileUrl))
                {
                    var fileUrl = item.FileUrl.Trim();
                    if (seenUrls.Add(fileUrl))
                    {
                        files.Add(new
                        {
                            url = fileUrl,
                            name = string.IsNullOrWhiteSpace(item.fileName) ? "model" : item.fileName,
                            kind = "model",
                        });
                    }
                }

                if (!string.IsNullOrWhiteSpace(item.ImageUrl))
                {
                    var imageUrl = item.ImageUrl.Trim();
                    if (seenUrls.Add(imageUrl))
                    {
                        files.Add(new
                        {
                            url = imageUrl,
                            name = "image",
                            kind = "image",
                        });
                    }
                }

                return new
                {
                    item.Id,
                    item.OrderId,
                    item.FileUrl,
                    item.ImageUrl,
                    FileName = item.fileName,
                    item.Notes,
                    item.Size,
                    item.Material,
                    item.Color,
                    item.Count,
                    item.Price,
                    files,
                    attachments = files,
                };
            })
            .ToList();

        return new
        {
            order.Id,
            order.UserId,
            order.Status,
            order.OrderType,
            order.PaymentFlow,
            order.FullName,
            order.AddressLine1,
            order.AddressLine2,
            order.City,
            order.PostalCode,
            order.PhoneNumber,
            order.DeliveryPrice,
            order.OrderDiscountAmount,
            order.SubtotalAmount,
            order.DiscountAmount,
            order.FinalTotalAmount,
            order.ServiceFeePrice,
            order.QuotedPrice,
            order.QuoteConfirmedAt,
            order.QuoteExpiresAt,
            order.TrackingCode,
            order.TrackingUrl,
            CustomerNotes = order.CustomerNotes,
            InternalNotes = (string?)null,
            order.IsPaid,
            order.UpdatedAt,
            order.CreatedAt,
            BankTransferDetails = hasBankTransferDetails
                ? new
                {
                    accountName = bankTransferAccountName,
                    iban = bankTransferIban,
                    bic = bankTransferBic,
                }
                : null,
            Items = orderItems,
            order.Payments,
            Notes = noteItems,
        };
    }

    private void DeleteUploadFileIfExists(string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl)) return;
        if (string.IsNullOrWhiteSpace(_env.WebRootPath)) return;

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

        var uploadsRoot = Path.GetFullPath(Path.Combine(_env.WebRootPath, "uploads"));
        var filePath = Path.GetFullPath(Path.Combine(uploadsRoot, fileName));

        if (!filePath.StartsWith(uploadsRoot + Path.DirectorySeparatorChar, StringComparison.Ordinal))
            return;

        if (System.IO.File.Exists(filePath))
        {
            System.IO.File.Delete(filePath);
        }
    }

}

public record ManualPaymentNotificationRequest(string? Message);

public record QuoteRequest(
    List<QuoteItemRequest> Items,
    string? GuestName,
    string? GuestEmail,
    string? GuestPhone,
    string ShippingFullName,
    string ShippingPhoneNumber,
    string ShippingAddressLine1,
    string ShippingCity,
    string ShippingPostalCode,
    bool AgreementAccepted = false,
    string? AgreementVersion = null
);

public record QuoteItemRequest(
    string? FileUrl,
    string? ImageUrl,
    string? FileName,
    string? Notes,
    string? Size,
    string? Material,
    string? Color,
    int Count,
    List<QuoteItemFileRequest>? Files,
    double? ScaleFactor = 1.0,
    int? InfillPercent = 20,
    string? PrintQuality = "Standard (0.20mm)",
    bool? SupportsNeeded = false
);

public record QuoteItemFileRequest(
    string Url,
    string Name,
    string? Kind
);

public record SaveQuoteShippingRequest(
    string FullName,
    string PhoneNumber,
    string AddressLine1,
    string City,
    string PostalCode
);
