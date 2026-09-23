using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using PrintCraftApi.Controllers;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using PrintCraftApi.Services;

namespace PrintCraftApi.Tests;

public class ProductPricingTests
{
    [Theory]
    [InlineData(-10, 0)]
    [InlineData(0, 0)]
    [InlineData(25, 25)]
    [InlineData(90, 90)]
    [InlineData(150, 90)]
    public void ClampDiscount_RespectsBounds(double input, double expected)
    {
        var result = ProductPricing.ClampDiscount(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData(100, -20, 100)]
    [InlineData(100, 0, 100)]
    [InlineData(100, 10, 90)]
    [InlineData(100, 90, 10)]
    [InlineData(100, 120, 10)]
    [InlineData(-50, 25, 0)]
    public void EffectivePrice_UsesClampedDiscountAndNonNegativeBase(double basePrice, double discount, decimal expected)
    {
        var result = ProductPricing.EffectivePrice(basePrice, discount);
        Assert.Equal(expected, result);
    }
}

public class ProductsControllerTests
{
    [Fact]
    public async Task GetAll_ExcludesInactiveProductsByDefault()
    {
        await using var db = CreateDbContext();
        db.Products.AddRange(
            new Product { Name = "Visible", Category = "C", ProductType = "print", Price = 10, IsActive = true },
            new Product { Name = "Hidden", Category = "C", ProductType = "print", Price = 10, IsActive = false }
        );
        await db.SaveChangesAsync();

        var sut = CreateController(db);
        var result = await sut.GetAll(
            category: null,
            productType: null,
            q: null,
            discountedOnly: false,
            inStockOnly: false,
            minPrice: null,
            maxPrice: null,
            sortBy: "name",
            sortDir: "asc",
            limit: null,
            includeInactive: false
        );

        var list = AssertOkResponses(result);
        Assert.Single(list);
        Assert.Equal("Visible", list[0].Name);
    }

    [Fact]
    public async Task Create_RejectsOutOfRangeDiscounts()
    {
        await using var db = CreateDbContext();
        var sut = CreateController(db);

        var low = await sut.Create(new UpsertProductRequest(
            Name: "Low Discount",
            Category: "Test",
            ProductType: "print",
            Description: "",
            ImageUrl: "",
            Images: [],
            FileUrl: "",
            Price: 10,
            DiscountPercentage: -1,
            IsActive: true,
            TrackInventory: false,
            StockQuantity: 0
        ));

        var high = await sut.Create(new UpsertProductRequest(
            Name: "High Discount",
            Category: "Test",
            ProductType: "print",
            Description: "",
            ImageUrl: "",
            Images: [],
            FileUrl: "",
            Price: 10,
            DiscountPercentage: 91,
            IsActive: true,
            TrackInventory: false,
            StockQuantity: 0
        ));

        Assert.IsType<BadRequestObjectResult>(low);
        Assert.IsType<BadRequestObjectResult>(high);
    }

    [Fact]
    public async Task Create_AllowsBoundaryDiscountValues()
    {
        await using var db = CreateDbContext();
        var sut = CreateController(db);

        var min = await sut.Create(new UpsertProductRequest(
            Name: "Min Discount",
            Category: "Test",
            ProductType: "print",
            Description: "",
            ImageUrl: "",
            Images: [],
            FileUrl: "",
            Price: 20,
            DiscountPercentage: 0,
            IsActive: true,
            TrackInventory: false,
            StockQuantity: 0
        ));

        var max = await sut.Create(new UpsertProductRequest(
            Name: "Max Discount",
            Category: "Test",
            ProductType: "print",
            Description: "",
            ImageUrl: "",
            Images: [],
            FileUrl: "",
            Price: 20,
            DiscountPercentage: 90,
            IsActive: true,
            TrackInventory: true,
            StockQuantity: 3
        ));

        Assert.IsType<CreatedAtActionResult>(min);
        Assert.IsType<CreatedAtActionResult>(max);
    }

    [Fact]
    public async Task GetAll_FiltersByDiscountAndStock()
    {
        await using var db = CreateDbContext();

        db.Products.AddRange(
            new Product
            {
                Name = "Discounted In Stock",
                Category = "Figures",
                ProductType = "print",
                Price = 100,
                DiscountPercentage = 20,
                TrackInventory = true,
                StockQuantity = 5,
            },
            new Product
            {
                Name = "Filament Out",
                Category = "Filament",
                ProductType = "filament",
                Price = 30,
                DiscountPercentage = 0,
                TrackInventory = true,
                StockQuantity = 0,
            },
            new Product
            {
                Name = "Made To Order",
                Category = "Tools",
                ProductType = "other",
                Price = 50,
                DiscountPercentage = 0,
                TrackInventory = false,
                StockQuantity = 0,
            }
        );
        await db.SaveChangesAsync();

        var sut = CreateController(db);

        var discountedOnlyResult = await sut.GetAll(
            category: null,
            productType: null,
            q: null,
            discountedOnly: true,
            inStockOnly: false,
            minPrice: null,
            maxPrice: null,
            sortBy: "name",
            sortDir: "asc",
            limit: null
        );

        var inStockOnlyResult = await sut.GetAll(
            category: null,
            productType: null,
            q: null,
            discountedOnly: false,
            inStockOnly: true,
            minPrice: null,
            maxPrice: null,
            sortBy: "name",
            sortDir: "asc",
            limit: null
        );

        var discounted = AssertOkResponses(discountedOnlyResult);
        var inStock = AssertOkResponses(inStockOnlyResult);

        Assert.Single(discounted);
        Assert.Equal("Discounted In Stock", discounted[0].Name);

        Assert.Equal(2, inStock.Count);
        Assert.DoesNotContain(inStock, p => p.Name == "Filament Out");
    }

    [Fact]
    public async Task GetAll_FiltersByProductType()
    {
        await using var db = CreateDbContext();
        db.Products.AddRange(
            new Product { Name = "A", Category = "C", ProductType = "print", Price = 1 },
            new Product { Name = "B", Category = "C", ProductType = "filament", Price = 1 }
        );
        await db.SaveChangesAsync();

        var sut = CreateController(db);
        var result = await sut.GetAll(
            category: null,
            productType: "filament",
            q: null,
            discountedOnly: false,
            inStockOnly: false,
            minPrice: null,
            maxPrice: null,
            sortBy: "name",
            sortDir: "asc",
            limit: null
        );

        var list = AssertOkResponses(result);
        Assert.Single(list);
        Assert.Equal("B", list[0].Name);
    }

    private static PrintCraftDb CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<PrintCraftDb>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new PrintCraftDb(options);
    }

    private static ProductsController CreateController(PrintCraftDb db)
    {
        return new ProductsController(db, new TestWebHostEnvironment());
    }

    private static List<ProductResponse> AssertOkResponses(IActionResult result)
    {
        var ok = Assert.IsType<OkObjectResult>(result);
        var payload = Assert.IsAssignableFrom<IEnumerable<ProductResponse>>(ok.Value);
        return payload.ToList();
    }

    private sealed class TestWebHostEnvironment : IWebHostEnvironment
    {
        public string ApplicationName { get; set; } = "PrintCraftApi.Tests";
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string WebRootPath { get; set; } = string.Empty;
        public string EnvironmentName { get; set; } = "Development";
        public string ContentRootPath { get; set; } = string.Empty;
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}

public class AdminControllerPricingSyncTests
{
    private static AdminController CreateAdminController(PrintCraftDb db)
    {
        return new AdminController(db, new NoopEmailService(), new ConfigurationBuilder().Build());
    }

    [Fact]
    public async Task UpdateOrderItem_RecalculatesQuotedPrice()
    {
        await using var db = CreateDbContext();
        var order = CreateOrder(delivery: 5m, discount: 2m, itemPrice: 10, itemCount: 2);
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var sut = CreateAdminController(db);
        var itemId = order.Items[0].Id;

        var result = await sut.UpdateOrderItem(order.Id, itemId, new AdminController.UpdateItemRequest(12));

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

        var sut = CreateAdminController(db);
        var result = await sut.UpdateDeliveryPrice(order.Id, new AdminController.DeliveryPriceRequest(9m));

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

        var sut = CreateAdminController(db);
        var result = await sut.UpdateOrderDiscount(order.Id, new AdminController.OrderDiscountRequest(5m));

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

        var sut = CreateAdminController(db);
        var result = await sut.UpdateOrderDiscount(order.Id, new AdminController.OrderDiscountRequest(5m));

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

        var sut = CreateAdminController(db);
        var result = await sut.UpdateOrderStatus(order.Id, new AdminController.UpdateOrderStatusRequest("quoted"));

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

        var sut = CreateAdminController(db);
        var result = await sut.UpdateOrderStatus(order.Id, new AdminController.UpdateOrderStatusRequest("pending_quote"));

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

        var sut = CreateAdminController(db);
        var result = await sut.UpdateOrderStatus(order.Id, new AdminController.UpdateOrderStatusRequest("delivered"));

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

        var sut = CreateAdminController(db);
        var result = await sut.UpdateDeliveryPrice(order.Id, new AdminController.DeliveryPriceRequest(12m));

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

        var sut = CreateAdminController(db);
        var result = await sut.UpdateOrderItem(
            order.Id,
            order.Items[0].Id,
            new AdminController.UpdateItemRequest(11));

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
