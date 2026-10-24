using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PrintCraft.Shared.Data;
using PrintCraft.Shared.Models;
using PrintCraft.Shared.Services;
using PrintCraftApi.Controllers;
using Xunit;

namespace PrintCraftApi.Tests;

public class SupportTicketsControllerTests
{
    private sealed class FakeEmailService : IEmailService
    {
        public Task SendResetPasswordEmailAsync(string toEmail, string toName, string resetLink) => Task.CompletedTask;
        public Task SendQuoteRequestedEmailAsync(string toEmail, string toName, Guid orderId) => Task.CompletedTask;
        public Task SendQuoteConfirmationEmailAsync(string toEmail, string toName, Guid orderId, decimal price, string? quoteMessage) => Task.CompletedTask;
        public Task SendQuoteConfirmationBankTransferEmailAsync(string toEmail, string toName, Guid orderId, decimal price, string? quoteMessage, string paymentReference) => Task.CompletedTask;
        public Task SendOrderSentTrackingEmailAsync(string toEmail, string toName, Guid orderId, string trackingCode, string? trackingUrl) => Task.CompletedTask;
        public Task SendOrderPaidEmailAsync(string toEmail, string toName, Guid orderId, decimal amount) => Task.CompletedTask;
        public Task SendCustomEmailAsync(string toEmail, string toName, string subject, string body) => Task.CompletedTask;
    }

    private sealed class FakeDiscordWebhookService : IDiscordWebhookService
    {
        public Task SendUnhandledExceptionAsync(HttpContext context, Exception exception, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task SendQuoteRequestedAsync(Order order, User? user, string? guestEmail = null, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task SendBookingCreatedAsync(Order order, User? user, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task SendPaymentReceivedAsync(Order order, User? user, decimal paidAmount, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task SendPaymentIssueAsync(Order order, User? user, decimal amount, string paymentStatus, string? reference, string? reason, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private static PrintCraftDb CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<PrintCraftDb>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new PrintCraftDb(options);
    }

    [Fact]
    public void SupportTicket_StatusAndCategory_SerializeAsStrings()
    {
        var ticket = new SupportTicket
        {
            Id = Guid.NewGuid(),
            UserEmail = "test@example.com",
            Subject = "Test Issue",
            Description = "Problem with print",
            Status = SupportTicketStatus.InProgress,
            Category = SupportTicketCategory.OrderIssue
        };

        var json = JsonSerializer.Serialize(ticket);

        Assert.Contains("\"Status\":\"InProgress\"", json);
        Assert.Contains("\"Category\":\"OrderIssue\"", json);
    }

    [Fact]
    public void SupportTicket_StatusAndCategory_DeserializeFromStrings()
    {
        var json = """
        {
            "Id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
            "UserEmail": "customer@example.com",
            "Subject": "Bug report",
            "Description": "Found a bug",
            "Status": "Resolved",
            "Category": "Bug"
        }
        """;

        var ticket = JsonSerializer.Deserialize<SupportTicket>(json);

        Assert.NotNull(ticket);
        Assert.Equal(SupportTicketStatus.Resolved, ticket.Status);
        Assert.Equal(SupportTicketCategory.Bug, ticket.Category);
    }

    [Fact]
    public async Task GetTickets_ReturnsTickets_WithProperStatus()
    {
        using var db = CreateDbContext();
        var ticket = new SupportTicket
        {
            Id = Guid.NewGuid(),
            UserEmail = "user@example.com",
            Subject = "Help",
            Description = "Need help with something",
            Status = SupportTicketStatus.Open,
            Category = SupportTicketCategory.General
        };
        db.SupportTickets.Add(ticket);
        await db.SaveChangesAsync();

        var controller = new SupportTicketsController(
            db,
            new FakeDiscordWebhookService(),
            new FakeEmailService(),
            NullLogger<SupportTicketsController>.Instance);

        var result = await controller.GetTickets();
        var okResult = Assert.IsType<OkObjectResult>(result);
        var tickets = Assert.IsAssignableFrom<IEnumerable<SupportTicket>>(okResult.Value);

        var retrieved = Assert.Single(tickets);
        Assert.Equal(SupportTicketStatus.Open, retrieved.Status);
        Assert.Equal(SupportTicketCategory.General, retrieved.Category);
    }

    [Fact]
    public async Task UpdateTicketStatus_UpdatesStatus_Successfully()
    {
        using var db = CreateDbContext();
        var ticket = new SupportTicket
        {
            Id = Guid.NewGuid(),
            UserEmail = "user@example.com",
            Subject = "Help",
            Description = "Need help",
            Status = SupportTicketStatus.Open
        };
        db.SupportTickets.Add(ticket);
        await db.SaveChangesAsync();

        var controller = new SupportTicketsController(
            db,
            new FakeDiscordWebhookService(),
            new FakeEmailService(),
            NullLogger<SupportTicketsController>.Instance);

        var result = await controller.UpdateTicketStatus(ticket.Id, new UpdateSupportTicketStatusRequest("Resolved"), default);
        var okResult = Assert.IsType<OkObjectResult>(result);
        var updated = Assert.IsType<SupportTicket>(okResult.Value);

        Assert.Equal(SupportTicketStatus.Resolved, updated.Status);

        var json = JsonSerializer.Serialize(updated);
        Assert.Contains("\"Status\":\"Resolved\"", json);
    }
}

