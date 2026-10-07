using Microsoft.Extensions.Configuration;
using PrintCraftApi.Models;
using PrintCraftApi.Services;

namespace PrintCraftApi.Tests;

public class OrderCustomerMapperTests
{
    private static IConfiguration CreateConfiguration()
    {
        var inMemory = new Dictionary<string, string?>
        {
            ["BankTransfer:AccountName"] = "PrintCraft BV",
            ["BankTransfer:Iban"] = "NL99BANK0123456789",
            ["BankTransfer:Bic"] = "BANKNL2A",
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(inMemory)
            .Build();
    }

    [Theory]
    [InlineData("quote_requested", true)]
    [InlineData("pending_quote", true)]
    [InlineData("pending", true)]
    [InlineData("awaiting_payment", false)]
    [InlineData("quoted", false)]
    [InlineData("pending_payment", false)]
    [InlineData("ready_to_print", false)]
    [InlineData("printing", false)]
    [InlineData("post_processing", false)]
    [InlineData("shipped", false)]
    public void IsQuotePending_ReturnsExpectedValue_ForDifferentStatuses(string status, bool expectedPending)
    {
        var order = new Order
        {
            Status = status,
            OrderType = "quote",
            QuotedPrice = expectedPending ? null : 25.00m,
            IsPaid = false,
        };

        var actual = OrderCustomerMapper.IsQuotePending(order);
        Assert.Equal(expectedPending, actual);
    }

    [Fact]
    public void MapOrderForCustomer_WhenQuoteRequested_MasksAllPricingAndBankDetails()
    {
        var config = CreateConfiguration();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Status = OrderStatus.QuoteRequested,
            OrderType = "quote",
            PaymentFlow = "bank_transfer",
            FullName = "Jane Doe",
            AddressLine1 = "Main St 1",
            City = "Rotterdam",
            PostalCode = "3000AA",
            PhoneNumber = "+31600000000",
            DeliveryPrice = 4.95m,
            ServiceFeePrice = 5.00m,
            OrderDiscountAmount = 2.00m,
            QuotedPrice = null,
            IsPaid = false,
            InternalNotes = "Internal secret margin info",
            CustomerNotes = "Handle with care",
            Notes = new List<OrderNote>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Content = "Secret admin internal memo",
                    Visibility = "internal",
                    CreatedBy = "admin",
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Content = "Public message to customer",
                    Visibility = "customer",
                    CreatedBy = "admin",
                },
            },
            Items = new List<OrderItem>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    fileName = "bracket.stl",
                    FileUrl = "/uploads/bracket.stl",
                    Count = 2,
                    Price = 3.50,
                    UnitPrice = 3.50,
                    PlateCost = 2.0,
                    FilamentUsedGrams = 42.5,
                    EstimatedPrintTime = "2h 15m",
                    ScaleFactor = 1.0,
                    InfillPercent = 20,
                    PrintQuality = "Standard (0.20mm)",
                    Attachments = new List<OrderItemAttachment>
                    {
                        new() { Url = "/uploads/bracket.stl", FileName = "bracket.stl", Kind = "model" }
                    }
                }
            }
        };

        var dto = OrderCustomerMapper.MapOrderForCustomer(order, config);

        // Pricing fields must be completely hidden (null)
        Assert.Null(dto.DeliveryPrice);
        Assert.Null(dto.ServiceFeePrice);
        Assert.Null(dto.OrderDiscountAmount);
        Assert.Null(dto.SubtotalAmount);
        Assert.Null(dto.DiscountAmount);
        Assert.Null(dto.FinalTotalAmount);
        Assert.Null(dto.QuotedPrice);

        // Bank details must NOT be returned while quote is pending
        Assert.Null(dto.BankTransferDetails);

        // Item prices must be null
        Assert.Single(dto.Items);
        var item = dto.Items[0];
        Assert.Null(item.Price);
        Assert.Null(item.UnitPrice);
        Assert.Equal("bracket.stl", item.FileName);
        Assert.Equal(2, item.Count);

        // Internal notes must be completely omitted
        Assert.Single(dto.Notes);
        Assert.Equal("Public message to customer", dto.Notes[0].Content);
        Assert.Equal("customer", dto.Notes[0].Visibility);
    }

    [Fact]
    public void MapOrderForCustomer_WhenQuoteConfirmed_ExposesApprovedPricingAndBankDetails()
    {
        var config = CreateConfiguration();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Status = OrderStatus.AwaitingPayment,
            OrderType = "quote",
            PaymentFlow = "bank_transfer",
            FullName = "Jane Doe",
            AddressLine1 = "Main St 1",
            City = "Rotterdam",
            PostalCode = "3000AA",
            PhoneNumber = "+31600000000",
            DeliveryPrice = 4.95m,
            ServiceFeePrice = 5.00m,
            OrderDiscountAmount = 0m,
            QuotedPrice = 18.95m,
            IsPaid = false,
            CustomerNotes = "Ship asap",
            Items = new List<OrderItem>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    fileName = "bracket.stl",
                    FileUrl = "/uploads/bracket.stl",
                    Count = 2,
                    Price = 4.50,
                    UnitPrice = 4.50,
                    PlateCost = 2.0,
                    FilamentUsedGrams = 42.5,
                    EstimatedPrintTime = "2h 15m",
                    Attachments = new List<OrderItemAttachment>
                    {
                        new() { Url = "/uploads/bracket.stl", FileName = "bracket.stl", Kind = "model" }
                    }
                }
            }
        };

        var dto = OrderCustomerMapper.MapOrderForCustomer(order, config);

        // Approved pricing must be visible
        Assert.Equal(4.95m, dto.DeliveryPrice);
        Assert.Equal(5.00m, dto.ServiceFeePrice);
        Assert.Equal(18.95m, dto.QuotedPrice);
        Assert.Equal(18.95m, dto.FinalTotalAmount);
        Assert.NotNull(dto.SubtotalAmount);

        // Item prices must be visible
        Assert.Single(dto.Items);
        Assert.Equal(4.50, dto.Items[0].Price);
        Assert.Equal(4.50, dto.Items[0].UnitPrice);

        // Bank transfer details must be provided since order is awaiting payment
        Assert.NotNull(dto.BankTransferDetails);
        Assert.Equal("PrintCraft BV", dto.BankTransferDetails.AccountName);
        Assert.Equal("NL99BANK0123456789", dto.BankTransferDetails.Iban);
        Assert.Equal("BANKNL2A", dto.BankTransferDetails.Bic);
    }

    [Fact]
    public void MapOrderForCustomer_WhenPaid_SuppressesBankTransferDetails()
    {
        var config = CreateConfiguration();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Status = OrderStatus.ReadyToPrint,
            OrderType = "quote",
            PaymentFlow = "bank_transfer",
            FullName = "Jane Doe",
            AddressLine1 = "Main St 1",
            City = "Rotterdam",
            PostalCode = "3000AA",
            PhoneNumber = "+31600000000",
            DeliveryPrice = 4.95m,
            ServiceFeePrice = 5.00m,
            QuotedPrice = 18.95m,
            IsPaid = true, // ALREADY PAID
            Items = new List<OrderItem>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    fileName = "bracket.stl",
                    Price = 4.50,
                    UnitPrice = 4.50,
                }
            }
        };

        var dto = OrderCustomerMapper.MapOrderForCustomer(order, config);

        // Because order is already paid, bank transfer details should NOT be shown
        Assert.Null(dto.BankTransferDetails);
        // But approved total and item prices remain visible to customer
        Assert.Equal(18.95m, dto.FinalTotalAmount);
        Assert.Equal(4.50, dto.Items[0].Price);
    }
}

