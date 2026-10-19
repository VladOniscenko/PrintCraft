namespace PrintCraft.Shared.Services;

public interface IPrintPricingService
{
    Task CalculatePricingAsync(Guid orderItemId, string filePath, double scaleFactor, int? infillPercent = 20, string? quality = null, bool? supports = false);
}

