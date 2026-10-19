using Microsoft.Extensions.DependencyInjection;

namespace PrintCraft.Features.Payments;

public static class PaymentsModule
{
    public static IServiceCollection AddPaymentsFeature(this IServiceCollection services)
    {
        return services;
    }
}

