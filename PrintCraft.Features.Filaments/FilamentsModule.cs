using Microsoft.Extensions.DependencyInjection;
using PrintCraft.Features.Filaments.Data;
using PrintCraft.Features.Filaments.Services;
using PrintCraft.Shared.Data;
using PrintCraft.Shared.Services;

namespace PrintCraft.Features.Filaments;

public static class FilamentsModule
{
    public static IServiceCollection AddFilamentsFeature(this IServiceCollection services, bool isSeedOnly = false)
    {
        PrintCraftDb.RegisterModelCustomizer(FilamentSeeder.Seed);

        services.AddScoped<IPrintPricingService, PrintPricingService>();

        if (!isSeedOnly)
        {
            services.AddSingleton<IPricingQueue, PricingQueue>();
            services.AddHostedService<PricingBackgroundWorker>();
        }

        return services;
    }
}

