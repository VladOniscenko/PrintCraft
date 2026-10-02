using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using PrintCraftApi.Validation;

namespace PrintCraftApi.Controllers;

[ApiController]
[Route("api/me/addresses")]
[Authorize]
public class AddressesController : ControllerBase
{
    private readonly PrintCraftDb _db;

    public AddressesController(PrintCraftDb db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(new { message = "User not authenticated" });

        var addresses = await _db.UserAddresses
            .AsNoTracking()
            .Where(a => a.UserId == userId.Value)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.LastUsedAt ?? a.UpdatedAt)
            .ThenByDescending(a => a.CreatedAt)
            .Select(a => new AddressResponse(
                a.Id,
                a.UserId,
                a.FullName,
                a.PhoneNumber,
                a.AddressLine1,
                a.AddressLine2,
                a.City,
                a.PostalCode,
                a.Label,
                a.IsDefault,
                a.CreatedAt,
                a.UpdatedAt,
                a.LastUsedAt))
            .ToListAsync();

        return Ok(addresses);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertUserAddressRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(new { message = "User not authenticated" });

        var validation = ValidateAddress(request);
        if (validation != null)
            return BadRequest(new { message = validation });

        var normalized = NormalizeRequest(request);
        var address = await UpsertAddressAsync(userId.Value, normalized, request.IsDefault);
        return Ok(ToDto(address));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] UpsertUserAddressRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(new { message = "User not authenticated" });

        var address = await _db.UserAddresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId.Value);
        if (address == null) return NotFound(new { message = "Address not found." });

        var validation = ValidateAddress(request);
        if (validation != null)
            return BadRequest(new { message = validation });

        var normalized = NormalizeRequest(request);
        address.FullName = normalized.FullName;
        address.PhoneNumber = normalized.PhoneNumber;
        address.AddressLine1 = normalized.AddressLine1;
        address.AddressLine2 = normalized.AddressLine2;
        address.City = normalized.City;
        address.PostalCode = normalized.PostalCode;
        address.Label = string.IsNullOrWhiteSpace(normalized.Label) ? null : normalized.Label;
        address.UpdatedAt = DateTime.UtcNow;

        if (request.IsDefault)
            await SetDefaultAddressAsync(userId.Value, address.Id);

        await _db.SaveChangesAsync();
        return Ok(ToDto(address));
    }

    [HttpPut("{id:guid}/default")]
    public async Task<IActionResult> SetDefault([FromRoute] Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(new { message = "User not authenticated" });

        var address = await _db.UserAddresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId.Value);
        if (address == null) return NotFound(new { message = "Address not found." });

        await SetDefaultAddressAsync(userId.Value, address.Id);
        await _db.SaveChangesAsync();
        return Ok(ToDto(address));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(new { message = "User not authenticated" });

        var address = await _db.UserAddresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId.Value);
        if (address == null) return NotFound(new { message = "Address not found." });

        _db.UserAddresses.Remove(address);
        if (address.IsDefault)
        {
            var nextDefault = await _db.UserAddresses
                .Where(a => a.UserId == userId.Value && a.Id != id)
                .OrderByDescending(a => a.LastUsedAt ?? a.UpdatedAt)
                .ThenByDescending(a => a.CreatedAt)
                .FirstOrDefaultAsync();

            if (nextDefault != null)
                nextDefault.IsDefault = true;
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    private Guid? GetUserId()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(userIdStr, out var userId) ? userId : null;
    }

    private static string? ValidateAddress(UpsertUserAddressRequest request)
    {
        var validation = ShippingInfoValidator.Validate(
            request.FullName,
            request.PhoneNumber,
            request.AddressLine1,
            request.City,
            request.PostalCode);

        return validation.IsValid ? null : string.Join(" ", validation.Errors.Values);
    }

    private static NormalizedAddress NormalizeRequest(UpsertUserAddressRequest request)
    {
        return new NormalizedAddress(
            request.FullName.Trim(),
            request.PhoneNumber.Trim(),
            request.AddressLine1.Trim(),
            string.IsNullOrWhiteSpace(request.AddressLine2) ? null : request.AddressLine2.Trim(),
            request.City.Trim(),
            request.PostalCode.Trim(),
            string.IsNullOrWhiteSpace(request.Label) ? null : request.Label.Trim());
    }

    private async Task<UserAddress> UpsertAddressAsync(Guid userId, NormalizedAddress address, bool makeDefault)
    {
        var existing = await _db.UserAddresses.FirstOrDefaultAsync(a =>
            a.UserId == userId
            && a.FullName == address.FullName
            && a.PhoneNumber == address.PhoneNumber
            && a.AddressLine1 == address.AddressLine1
            && a.AddressLine2 == address.AddressLine2
            && a.City == address.City
            && a.PostalCode == address.PostalCode);

        if (existing != null)
        {
            existing.Label = address.Label;
            existing.LastUsedAt = DateTime.UtcNow;
            existing.UpdatedAt = DateTime.UtcNow;

            if (makeDefault)
                await SetDefaultAddressAsync(userId, existing.Id);

            await _db.SaveChangesAsync();
            return existing;
        }

        var hasDefault = await _db.UserAddresses.AnyAsync(a => a.UserId == userId && a.IsDefault);
        var newAddress = new UserAddress
        {
            UserId = userId,
            FullName = address.FullName,
            PhoneNumber = address.PhoneNumber,
            AddressLine1 = address.AddressLine1,
            AddressLine2 = address.AddressLine2,
            City = address.City,
            PostalCode = address.PostalCode,
            Label = address.Label,
            IsDefault = makeDefault || !hasDefault,
            LastUsedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.UserAddresses.Add(newAddress);

        if (newAddress.IsDefault)
            await SetDefaultAddressAsync(userId, newAddress.Id);

        await _db.SaveChangesAsync();
        return newAddress;
    }

    private async Task SetDefaultAddressAsync(Guid userId, Guid addressId)
    {
        var addresses = await _db.UserAddresses
            .Where(a => a.UserId == userId)
            .ToListAsync();

        foreach (var address in addresses)
        {
            address.IsDefault = address.Id == addressId;
            address.UpdatedAt = DateTime.UtcNow;
        }
    }

    private static AddressResponse ToDto(UserAddress address)
        => new(
            address.Id,
            address.UserId,
            address.FullName,
            address.PhoneNumber,
            address.AddressLine1,
            address.AddressLine2,
            address.City,
            address.PostalCode,
            address.Label,
            address.IsDefault,
            address.CreatedAt,
            address.UpdatedAt,
            address.LastUsedAt);

    private sealed record NormalizedAddress(
        string FullName,
        string PhoneNumber,
        string AddressLine1,
        string? AddressLine2,
        string City,
        string PostalCode,
        string? Label);

    private sealed record AddressResponse(
        Guid Id,
        Guid UserId,
        string FullName,
        string PhoneNumber,
        string AddressLine1,
        string? AddressLine2,
        string City,
        string PostalCode,
        string? Label,
        bool IsDefault,
        DateTime CreatedAt,
        DateTime UpdatedAt,
        DateTime? LastUsedAt);

    public sealed record UpsertUserAddressRequest(
        string FullName,
        string PhoneNumber,
        string AddressLine1,
        string? AddressLine2,
        string City,
        string PostalCode,
        string? Label,
        bool IsDefault = false);
}