using Microsoft.Extensions.DependencyInjection;

namespace PrintCraft.Features.Admin;

public static class AdminModule
{
    public static IServiceCollection AddAdminFeature(this IServiceCollection services)
    {
        return services;
    }
}

