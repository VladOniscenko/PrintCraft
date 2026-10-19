using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintCraft.Shared.Data;

namespace PrintCraft.Features.Admin.Controllers;

[ApiController]
[Route("api/admin/payments")]
[Authorize(Roles = "admin")]
public class AdminPaymentsController : ControllerBase
{
    private readonly PrintCraftDb _db;

    public AdminPaymentsController(PrintCraftDb db)
    {
        _db = db;
    }

    // Permission: Admin Only
    [HttpGet]
    public async Task<IActionResult> GetPayments(
        [FromQuery] Guid? orderId,
        [FromQuery] string? provider,
        [FromQuery] string? status,
        [FromQuery] string? reference,
        [FromQuery] DateTime? fromUtc,
        [FromQuery] DateTime? toUtc,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
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

        var totalCount = await query.CountAsync(cancellationToken);

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
            .ToListAsync(cancellationToken);

        return Ok(new { results, totalCount, page, pageSize });
    }
}

