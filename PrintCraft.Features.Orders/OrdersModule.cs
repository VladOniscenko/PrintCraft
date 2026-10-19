using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PrintCraft.Features.Orders.Services;
using PrintCraft.Shared.Services;

namespace PrintCraft.Features.Orders;

public static class OrdersModule
{
    public static IServiceCollection AddOrdersFeature(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<InvoiceOptions>(configuration.GetSection("Invoice"));
        services.AddScoped<IQuoteDraftService, QuoteDraftService>();
        services.AddScoped<IInvoiceService, InvoiceService>();
        services.AddScoped<OrderStatusStateMachine>();
        return services;
    }
}

