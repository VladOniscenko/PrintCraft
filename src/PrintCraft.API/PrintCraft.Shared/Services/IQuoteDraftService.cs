using PrintCraft.Shared.Models;

namespace PrintCraft.Shared.Services;

public sealed record QuoteDraftResult(string QuoteToken, Guid DraftId, string FileUrl, string FileName, string Material, decimal Estimate, DateTime ExpiresAt);

public interface IQuoteDraftService
{
    Task<QuoteDraftResult> CreateAsync(string fileUrl, string fileName, string description, string material, string? visitorKey, CancellationToken cancellationToken = default);
    Task<QuoteDraft?> RedeemAsync(string token, Guid userId, CancellationToken cancellationToken = default);
}

