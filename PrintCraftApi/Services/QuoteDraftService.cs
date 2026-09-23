using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Data;
using PrintCraftApi.Models;

namespace PrintCraftApi.Services;

public sealed record QuoteDraftResult(string QuoteToken, Guid DraftId, string FileUrl, string FileName, string Material, decimal Estimate, DateTime ExpiresAt);

public interface IQuoteDraftService
{
    Task<QuoteDraftResult> CreateAsync(string fileUrl, string fileName, string description, string material, string? visitorKey, CancellationToken cancellationToken = default);
    Task<QuoteDraft?> RedeemAsync(string token, Guid userId, CancellationToken cancellationToken = default);
}

public sealed class QuoteDraftService : IQuoteDraftService
{
    private readonly PrintCraftDb _db;

    public QuoteDraftService(PrintCraftDb db) => _db = db;

    public async Task<QuoteDraftResult> CreateAsync(string fileUrl, string fileName, string description, string material, string? visitorKey, CancellationToken cancellationToken = default)
    {
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)).Replace("+", "-").Replace("/", "_").TrimEnd('=');
        var normalizedMaterial = string.IsNullOrWhiteSpace(material) ? "PLA" : material.Trim().ToUpperInvariant();
        var estimate = Math.Clamp(12m + (fileName.Length % 24), 12m, 180m);
        var draft = new QuoteDraft
        {
            TokenHash = Hash(token),
            FileUrl = fileUrl.Trim(),
            FileName = fileName.Trim(),
            Description = description.Trim(),
            Material = normalizedMaterial,
            VisitorKey = visitorKey,
            Estimate = estimate,
        };
        _db.QuoteDrafts.Add(draft);
        await _db.SaveChangesAsync(cancellationToken);
        return new QuoteDraftResult(token, draft.Id, draft.FileUrl, draft.FileName, draft.Material, draft.Estimate, draft.ExpiresAt);
    }

    public async Task<QuoteDraft?> RedeemAsync(string token, Guid userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(token)) return null;
        var draft = await _db.QuoteDrafts.FirstOrDefaultAsync(d => d.TokenHash == Hash(token) && d.ExpiresAt > DateTime.UtcNow && d.RedeemedAt == null, cancellationToken);
        if (draft == null) return null;
        draft.UserId = userId;
        draft.RedeemedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return draft;
    }

    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
}
