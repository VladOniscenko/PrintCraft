namespace PrintCraftApi.Configuration;

public static class AppLimits
{
    // Single source of truth for per-item quantity limits (quote, cart, checkout).
    public const int MaxItemQuantity = 25;
}
