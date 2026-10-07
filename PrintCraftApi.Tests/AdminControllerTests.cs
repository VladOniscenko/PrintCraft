using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using PrintCraftApi.Controllers;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using PrintCraftApi.Services;

namespace PrintCraftApi.Tests;

public class AdminControllerPricingSyncTests
{
    private static AdminController CreateAdminController(PrintCraftDb db)
    {
        var invoiceService = new InvoiceService(Options.Create(new InvoiceOptions()));
        return new AdminController(db, new NoopEmailService(), new ConfigurationBuilder().Build(), invoiceService);
    }

    [Fact]
    public async Task UpdateOrderItem_RecalculatesQuotedPrice()
    {
        await using var db = CreateDbContext();
        var order = CreateOrder(delivery: 5m, discount: 2m, itemPrice: 10, itemCount: 2);
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await CreateAdminController(db).UpdateOrderItem(order.Id, order.Items[0].Id, new AdminController.UpdateItemRequest(12));

        var ok = Assert.IsType<OkObjectResult>(result);
        var updated = Assert.IsType<Order>(ok.Value);
        Assert.Equal(32m, updated.QuotedPrice);
    }

    [Fact]
    public async Task UpdateDeliveryPrice_RecalculatesQuotedPrice()
    {
        await using var db = CreateDbContext();
        var order = CreateOrder(delivery: 4m, discount: 1m, itemPrice: 10, itemCount: 2);
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await CreateAdminController(db).UpdateDeliveryPrice(order.Id, new AdminController.DeliveryPriceRequest(9m));

        var ok = Assert.IsType<OkObjectResult>(result);
        var updated = Assert.IsType<Order>(ok.Value);
        Assert.Equal(33m, updated.QuotedPrice);
    }

    [Fact]
    public async Task UpdateOrderDiscount_RecalculatesQuotedPrice()
    {
        await using var db = CreateDbContext();
        var order = CreateOrder(delivery: 6m, discount: 0m, itemPrice: 8, itemCount: 3);
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await CreateAdminController(db).UpdateOrderDiscount(order.Id, new AdminController.OrderDiscountRequest(5m));

        var ok = Assert.IsType<OkObjectResult>(result);
        var updated = Assert.IsType<Order>(ok.Value);
        Assert.Equal(30m, updated.QuotedPrice);
    }

    [Fact]
    public async Task UpdateOrderDiscount_PaidOrder_IsRejected()
    {
        await using var db = CreateDbContext();
        var order = CreateOrder(delivery: 6m, discount: 0m, itemPrice: 8, itemCount: 3);
        order.Status = "paid";
        order.IsPaid = true;
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await CreateAdminController(db).UpdateOrderDiscount(order.Id, new AdminController.OrderDiscountRequest(5m));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task UpdateOrderStatus_PaidOrder_CanRollbackToQuoted()
    {
        await using var db = CreateDbContext();
        var order = CreateOrder(delivery: 6m, discount: 0m, itemPrice: 8, itemCount: 3);
        order.Status = "paid";
        order.IsPaid = true;
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await CreateAdminController(db).UpdateOrderStatus(order.Id, new AdminController.UpdateOrderStatusRequest("quoted"));

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task UpdateOrderStatus_CancelledOrder_CanTransition()
    {
        await using var db = CreateDbContext();
        var order = CreateOrder(delivery: 6m, discount: 0m, itemPrice: 8, itemCount: 3);
        order.Status = "cancelled";
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await CreateAdminController(db).UpdateOrderStatus(order.Id, new AdminController.UpdateOrderStatusRequest("pending_quote"));

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task UpdateOrderStatus_CompletedOrder_CanTransition()
    {
        await using var db = CreateDbContext();
        var order = CreateOrder(delivery: 6m, discount: 0m, itemPrice: 8, itemCount: 3);
        order.Status = "completed";
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await CreateAdminController(db).UpdateOrderStatus(order.Id, new AdminController.UpdateOrderStatusRequest("delivered"));

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task UpdateDeliveryPrice_PaidOrder_IsRejected()
    {
        await using var db = CreateDbContext();
        var order = CreateOrder(delivery: 6m, discount: 0m, itemPrice: 8, itemCount: 3);
        order.Status = "paid";
        order.IsPaid = true;
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await CreateAdminController(db).UpdateDeliveryPrice(order.Id, new AdminController.DeliveryPriceRequest(12m));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task UpdateOrderItem_PrintingOrder_IsRejected()
    {
        await using var db = CreateDbContext();
        var order = CreateOrder(delivery: 6m, discount: 0m, itemPrice: 8, itemCount: 3);
        order.Status = "printing";
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await CreateAdminController(db).UpdateOrderItem(order.Id, order.Items[0].Id, new AdminController.UpdateItemRequest(11));

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public void Order_ExposesConsistentPricingBreakdownFields()
    {
        var order = CreateOrder(delivery: 6m, discount: 5m, itemPrice: 8, itemCount: 3);

        Assert.Equal(24m, order.SubtotalAmount);
        Assert.Equal(5m, order.DiscountAmount);
        Assert.Equal(30m, order.FinalTotalAmount);
    }

    [Fact]
    public async Task DownloadInvoice_ReturnsPdfFile()
    {
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
        await using var db = CreateDbContext();
        var order = CreateOrder(delivery: 6m, discount: 5m, itemPrice: 8, itemCount: 3);
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var result = await CreateAdminController(db).DownloadInvoice(order.Id);

        var file = Assert.IsType<FileContentResult>(result);
        Assert.Equal("application/pdf", file.ContentType);
        Assert.Equal($"invoice-{order.Id:N}.pdf", file.FileDownloadName);
        Assert.NotEmpty(file.FileContents);
        Assert.Equal("%PDF-", System.Text.Encoding.ASCII.GetString(file.FileContents[..5]));
    }

    private static PrintCraftDb CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<PrintCraftDb>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new PrintCraftDb(options);
    }

    private static Order CreateOrder(decimal delivery, decimal discount, double itemPrice, int itemCount)
    {
        return new Order
        {
            FullName = "Test User",
            AddressLine1 = "Street 1",
            City = "City",
            PostalCode = "1234AB",
            PhoneNumber = "0612345678",
            DeliveryPrice = delivery,
            OrderDiscountAmount = discount,
            Items =
            [
                new OrderItem
                {
                    FileUrl = "/uploads/test.stl",
                    Price = itemPrice,
                    Count = itemCount,
                    PlateCost = 0,
                    Material = "PLA",
                    Color = "Black"
                }
            ]
        };
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
