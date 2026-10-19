using Microsoft.Extensions.DependencyInjection;
using PrintCraft.Features.Content.Data;
using PrintCraft.Shared.Data;

namespace PrintCraft.Features.Content;

public static class ContentModule
{
    public static IServiceCollection AddContentFeature(this IServiceCollection services)
    {
        PrintCraftDb.RegisterModelCustomizer(HeroSlideSeeder.Seed);
        return services;
    }
}

