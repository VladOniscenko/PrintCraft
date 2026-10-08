using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using PrintCraftApi.Controllers;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using PrintCraftApi.Services;

namespace PrintCraftApi.Tests;

public class OrderDetailsDtoTests
{
    private static AdminController CreateAdminController(PrintCraftDb db)
    {
        var invoiceService = new InvoiceService(Options.Create(new InvoiceOptions()));
        return new AdminController(db, new NoopEmailService(), new ConfigurationBuilder().Build(), invoiceService);
    }

    [Fact]
    public async Task GetOrderById_ReturnsComprehensiveOrderDetailsDto()
    {
        await using var db = CreateDbContext();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            FullName = "Jane Doe",
            AddressLine1 = "Kerkstraat 10",
            AddressLine2 = "Apt 2B",
            City = "Amsterdam",
            PostalCode = "1012AB",
            PhoneNumber = "+31612345678",
            Status = OrderStatus.QuoteRequested,
            DeliveryPrice = 5.95m,
            ServiceFeePrice = 4.00m,
            OrderDiscountAmount = 2.00m,
            QuotedPrice = 35.00m,
            QuoteMessage = "Reviewed your custom model.",
            Items = new List<OrderItem>
            {
                new OrderItem
                {
                    fileName = "bracket.stl",
                    FileUrl = "/uploads/bracket.stl",
                    Price = 15.0,
                    UnitPrice = 15.0,
                    PlateCost = 2.0,
                    Count = 2,
                    Material = "PETG",
                    Color = "Black",
                    Size = "50 x 50 x 20 mm",
                    Attachments = new List<OrderItemAttachment>
                    {
                        new OrderItemAttachment
                        {
                            FileName = "drawing.step",
                            Url = "/uploads/drawing.step",
                            Kind = "model"
                        }
                    }
                }
            },
            StatusHistory = new List<OrderStatusHistory>
            {
                new OrderStatusHistory
                {
                    PreviousStatus = null,
                    NewStatus = OrderStatus.QuoteRequested,
                    ChangedAt = DateTime.UtcNow.AddHours(-2),
                    ChangedBy = "system",
                    Note = "Order created"
                }
            },
            Communications = new List<OrderCommunication>
            {
                new OrderCommunication
                {
                    Channel = "email",
                    CommunicationType = "quote_requested",
                    Subject = "Quote Request Confirmation",
                    RecipientEmail = "jane@example.com",
                    SentAt = DateTime.UtcNow.AddHours(-1)
                }
            },
            Notes = new List<OrderNote>
            {
                new OrderNote
                {
                    Content = "Please print with 30% infill",
                    Visibility = "customer",
                    CreatedBy = "Jane Doe",
                    CreatedAt = DateTime.UtcNow.AddMinutes(-30)
                },
                new OrderNote
                {
                    Content = "Verified mesh geometry, ready to price",
                    Visibility = "internal",
                    CreatedBy = "Admin",
                    CreatedAt = DateTime.UtcNow.AddMinutes(-10)
                }
            }
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var controller = CreateAdminController(db);
        var result = await controller.GetOrderById(order.Id);

        var okResult = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<OrderDetailsDto>(okResult.Value);

        // State Machine & Status verification
        Assert.Equal(order.Id, dto.Id);
        Assert.Equal(OrderStatus.QuoteRequested, dto.Status);
        Assert.Equal(OrderStatus.QuoteRequested, dto.NormalizedStatus);
        Assert.Contains(OrderStatus.AwaitingPayment, dto.AllowedTransitions);

        // Customer details
        Assert.Equal("Jane Doe", dto.Customer.FullName);
        Assert.Equal("Kerkstraat 10", dto.Customer.AddressLine1);
        Assert.Equal("jane@example.com", dto.Customer.Email);
        Assert.Equal("+31612345678", dto.Customer.PhoneNumber);

        // Aggregated files (bracket.stl + drawing.step)
        Assert.Equal(2, dto.Files.Count);
        Assert.Contains(dto.Files, f => f.FileName.EndsWith(".stl") && f.Is3DModel);
        Assert.Contains(dto.Files, f => f.FileName.EndsWith(".step") && f.Is3DModel);

        // Items verification
        Assert.Single(dto.Items);
        Assert.Equal("bracket.stl", dto.Items[0].FileName);
        Assert.Equal(15.0, dto.Items[0].UnitPrice);
        Assert.Equal(2.0, dto.Items[0].PlateCost);

        // Timeline verification (Status + Email + 2 Notes = 4 events)
        Assert.Equal(4, dto.Timeline.Count);
        // Timeline sorted descending by timestamp
        Assert.Equal("note", dto.Timeline[0].Type); // latest is admin note
        Assert.Contains(dto.Timeline, t => t.Type == "status_change");
        Assert.Contains(dto.Timeline, t => t.Type == "email");
        Assert.Contains(dto.Timeline, t => t.Type == "note" && t.Visibility == "customer");
        Assert.Contains(dto.Timeline, t => t.Type == "note" && t.Visibility == "internal");
    }

    [Fact]
    public async Task UpdateProductionAssignment_UpdatesPrinterAndMaterial()
    {
        await using var db = CreateDbContext();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            FullName = "John Doe",
            AddressLine1 = "Main St 1",
            City = "Rotterdam",
            PostalCode = "3011AA",
            PhoneNumber = "0600000000",
            Status = OrderStatus.ReadyToPrint,
            IsPaid = true
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var controller = CreateAdminController(db);
        var result = await controller.UpdateProductionAssignment(order.Id, new AdminController.AssignProductionRequest(
            "Prusa MK4 #2",
            "Prusament PLA Galaxy Black",
            true
        ));

        Assert.IsType<OkObjectResult>(result);
        var updated = await db.Orders.FindAsync(order.Id);
        Assert.NotNull(updated);
        Assert.Equal("Prusa MK4 #2", updated.AssignedPrinter);
        Assert.Equal("Prusament PLA Galaxy Black", updated.AssignedMaterial);
        Assert.True(updated.GCodeFinalized);
    }

    private static PrintCraftDb CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<PrintCraftDb>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new PrintCraftDb(options);
    }

    private sealed class NoopEmailService : IEmailService
    {
        public Task SendResetPasswordEmailAsync(string toEmail, string toName, string resetLink) => Task.CompletedTask;
        public Task SendQuoteRequestedEmailAsync(string toEmail, string toName, Guid orderId) => Task.CompletedTask;
        public Task SendQuoteConfirmationEmailAsync(string toEmail, string toName, Guid orderId, decimal price, string? quoteMessage) => Task.CompletedTask;
        public Task SendQuoteConfirmationBankTransferEmailAsync(string toEmail, string toName, Guid orderId, decimal price, string? quoteMessage, string paymentReference) => Task.CompletedTask;
        public Task SendOrderSentTrackingEmailAsync(string toEmail, string toName, Guid orderId, string trackingCode, string? trackingUrl) => Task.CompletedTask;
        public Task SendOrderPaidEmailAsync(string toEmail, string toName, Guid orderId, decimal amount) => Task.CompletedTask;
        public Task SendCustomEmailAsync(string toEmail, string toName, string subject, string body) => Task.CompletedTask;
    }
}

