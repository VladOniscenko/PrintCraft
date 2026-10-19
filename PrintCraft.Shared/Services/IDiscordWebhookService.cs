using Microsoft.AspNetCore.Http;
using PrintCraft.Shared.Models;

namespace PrintCraft.Shared.Services;

public interface IDiscordWebhookService
{
    Task SendUnhandledExceptionAsync(HttpContext context, Exception exception, CancellationToken cancellationToken = default);
    Task SendQuoteRequestedAsync(Order order, User? user, string? guestEmail = null, CancellationToken cancellationToken = default);
    Task SendBookingCreatedAsync(Order order, User? user, CancellationToken cancellationToken = default);
    Task SendPaymentReceivedAsync(Order order, User? user, decimal paidAmount, CancellationToken cancellationToken = default);
    Task SendPaymentIssueAsync(Order order, User? user, decimal amount, string paymentStatus, string? reference, string? reason, CancellationToken cancellationToken = default);
}

