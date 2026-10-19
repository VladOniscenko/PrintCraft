using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintCraft.Features.Admin.Models;
using PrintCraft.Features.Admin.Services;
using PrintCraft.Shared.Data;

namespace PrintCraft.Features.Admin.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "admin")]
public class AdminUsersController : ControllerBase
{
    private readonly PrintCraftDb _db;

    public AdminUsersController(PrintCraftDb db)
    {
        _db = db;
    }

    // Permission: Admin Only
    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0) pageSize = 20;

        var query = _db.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(search))
        {
            var q = search.ToLower();
            query = query.Where(u => EF.Functions.ILike(u.Name, $"%{q}%") || EF.Functions.ILike(u.Email, $"%{q}%") || EF.Functions.ILike(u.Role, $"%{q}%"));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var results = await query
            .OrderBy(u => u.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserDto(u.Id, u.Name, u.Email, u.Role))
            .ToListAsync(cancellationToken);
        return Ok(new { results, totalCount, page, pageSize });
    }

    // Permission: Admin Only
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetUserById([FromRoute] Guid id, CancellationToken cancellationToken = default)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, cancellationToken);
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
            }).ToListAsync(cancellationToken);
        var addresses = await _db.UserAddresses.AsNoTracking().Where(a => a.UserId == id).OrderByDescending(a => a.IsDefault).ThenByDescending(a => a.LastUsedAt).ToListAsync(cancellationToken);

        return Ok(new
        {
            user = new AdminUserDto(user.Id, user.Name, user.Email, user.Role),
            orders,
            addresses,
            payments = orders.SelectMany(o => o.Payments).OrderByDescending(p => p.CreatedAt)
        });
    }

    // Permission: Admin Only
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateUser([FromRoute] Guid id, [FromBody] UpdateUserRequest updated)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "User not found" });

        var name = updated.Name?.Trim();
        var email = updated.Email?.Trim().ToLowerInvariant();
        var role = updated.Role?.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(name) || name.Length < 2 || name.Length > 80)
            return BadRequest(new { message = "Name must be between 2 and 80 characters." });

        if (!AdminOrderHelper.IsValidEmail(email))
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

    // Permission: Admin Only
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteUser([FromRoute] Guid id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "User not found" });

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}

