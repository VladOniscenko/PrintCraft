using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using PrintCraftApi.Controllers;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using PrintCraftApi.Services;

namespace PrintCraftApi.Tests;

public class OrderItemChangeRequestTests
{
    private static PrintCraftDb CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<PrintCraftDb>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new PrintCraftDb(options);
    }

    private static OrderChangeRequestsController CreateController(PrintCraftDb db, Guid? userId = null, bool isAdmin = false)
    {
        var controller = new OrderChangeRequestsController(
            db,
            new NoopEmailService(),
            new ConfigurationBuilder().Build(),
            NullLogger<OrderChangeRequestsController>.Instance);

        var claims = new List<Claim>();
        if (userId.HasValue)
        {
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId.Value.ToString()));
        }
        if (isAdmin)
        {
            claims.Add(new Claim(ClaimTypes.Role, "admin"));
            claims.Add(new Claim(ClaimTypes.Email, "admin@printcraft.local"));
        }

        var identity = new ClaimsIdentity(claims, "TestAuth");
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };

        return controller;
    }

    [Fact]
    public async Task Admin_CanCreateChangeRequest_AndCustomerCanSubmitRevision_AndLoopOccurs()
    {
        await using var db = CreateDbContext();
        var customerId = Guid.NewGuid();

        var order = new Order
        {
            Id = Guid.NewGuid(),
            UserId = customerId,
            FullName = "Alex Customer",
            AddressLine1 = "Keizersgracht 100",
            City = "Amsterdam",
            PostalCode = "1015AA",
            PhoneNumber = "0612345678",
            Status = OrderStatus.QuoteRequested,
            Items = new List<OrderItem>
            {
                new OrderItem
                {
                    fileName = "bracket_v1.stl",
                    FileUrl = "/uploads/bracket_v1.stl",
                    Price = 12.0,
                    UnitPrice = 12.0,
                    Count = 1,
                    Material = "PETG",
                    Color = "Black"
                }
            }
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var item = order.Items.First();

        // 1. Admin creates change request (Round 1)
        var adminController = CreateController(db, isAdmin: true);
        var createResult = await adminController.CreateChangeRequest(order.Id, item.Id, new CreateOrderItemChangeRequestRequest
        {
            ReasonCategory = "broken_geometry",
            AdminNotes = "Base has holes and inverted normals. Please repair and re-upload.",
            RequiresNewFile = true
        });

        var createdDto = Assert.IsType<OkObjectResult>(createResult).Value as OrderItemChangeRequestDto;
        Assert.NotNull(createdDto);
        Assert.Equal("pending_customer", createdDto.Status);
        Assert.Equal("broken_geometry", createdDto.ReasonCategory);
        Assert.Equal("/uploads/bracket_v1.stl", createdDto.PreviousFileUrl);

        // Verify order has timeline note
        var notes = await db.OrderNotes.Where(n => n.OrderId == order.Id).ToListAsync();
        Assert.Contains(notes, n => n.Content.Contains("Changes requested for item 'bracket_v1.stl'"));

        // 2. Customer submits revised file
        var customerController = CreateController(db, userId: customerId);
        var submitResult = await customerController.SubmitRevision(order.Id, item.Id, createdDto.Id, new SubmitOrderItemRevisionRequest
        {
            NewFileUrl = "/uploads/bracket_v2_fixed.stl",
            NewFileName = "bracket_v2_fixed.stl",
            CustomerNotes = "Fixed mesh holes with Blender 3D Print Toolbox."
        });

        var submittedDto = Assert.IsType<OkObjectResult>(submitResult).Value as OrderItemChangeRequestDto;
        Assert.NotNull(submittedDto);
        Assert.Equal("revision_submitted", submittedDto.Status);
        Assert.Equal("/uploads/bracket_v2_fixed.stl", submittedDto.SubmittedFileUrl);
        Assert.Equal("bracket_v2_fixed.stl", submittedDto.SubmittedFileName);

        // Verify item's active file updated and previous file archived in Attachments
        var updatedItem = await db.OrderItems.Include(i => i.Attachments).FirstAsync(i => i.Id == item.Id);
        Assert.Equal("/uploads/bracket_v2_fixed.stl", updatedItem.FileUrl);
        Assert.Equal("bracket_v2_fixed.stl", updatedItem.fileName);
        Assert.Contains(updatedItem.Attachments, a => a.Url == "/uploads/bracket_v1.stl");

        // 3. Admin inspects and requests another revision (Round 2 - Loop!)
        var round2Result = await adminController.CreateChangeRequest(order.Id, item.Id, new CreateOrderItemChangeRequestRequest
        {
            ReasonCategory = "wall_thickness",
            AdminNotes = "Mesh is manifold now, but walls are only 0.4mm. Please thicken to >= 0.8mm.",
            RequiresNewFile = true
        });

        var round2Dto = Assert.IsType<OkObjectResult>(round2Result).Value as OrderItemChangeRequestDto;
        Assert.NotNull(round2Dto);
        Assert.Equal("pending_customer", round2Dto.Status);
        Assert.Equal("wall_thickness", round2Dto.ReasonCategory);

        // Check that round 1 was marked superseded
        var round1InDb = await db.OrderItemChangeRequests.FindAsync(createdDto.Id);
        Assert.NotNull(round1InDb);
        Assert.Equal("superseded", round1InDb.Status);

        // 4. Customer submits round 2
        var submitRound2Result = await customerController.SubmitRevision(order.Id, item.Id, round2Dto.Id, new SubmitOrderItemRevisionRequest
        {
            NewFileUrl = "/uploads/bracket_v3_thick.stl",
            NewFileName = "bracket_v3_thick.stl",
            CustomerNotes = "Extruded walls to 1.2mm."
        });
        var submittedRound2Dto = Assert.IsType<OkObjectResult>(submitRound2Result).Value as OrderItemChangeRequestDto;
        Assert.Equal("revision_submitted", submittedRound2Dto.Status);

        // 5. Admin resolves and accepts round 2
        var resolveResult = await adminController.ResolveChangeRequest(order.Id, item.Id, round2Dto.Id, new ResolveOrderItemChangeRequestRequest
        {
            ResolutionNotes = "Walls look great, ready to quote."
        });

        var resolvedDto = Assert.IsType<OkObjectResult>(resolveResult).Value as OrderItemChangeRequestDto;
        Assert.NotNull(resolvedDto);
        Assert.Equal("resolved", resolvedDto.Status);
        Assert.Equal("Walls look great, ready to quote.", resolvedDto.ResolutionNotes);
    }

    [Fact]
    public async Task StateMachine_BlocksAdvancementToAwaitingPayment_WhenItemHasPendingChangeRequest()
    {
        await using var db = CreateDbContext();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            FullName = "John Doe",
            AddressLine1 = "Street 1",
            City = "Utrecht",
            PostalCode = "3511AA",
            PhoneNumber = "0600000000",
            Status = OrderStatus.QuoteRequested,
            QuoteMessage = "Admin reviewed.",
            QuotedPrice = 50m,
            Items = new List<OrderItem>
            {
                new OrderItem
                {
                    Price = 25.0,
                    UnitPrice = 25.0,
                    fileName = "model.stl"
                }
            }
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var item = order.Items.First();

        // Add active change request
        db.OrderItemChangeRequests.Add(new OrderItemChangeRequest
        {
            OrderId = order.Id,
            OrderItemId = item.Id,
            Status = "pending_customer",
            ReasonCategory = "broken_geometry",
            AdminNotes = "Model broken"
        });
        await db.SaveChangesAsync();

        var stateMachine = new OrderStatusStateMachine(db);
        var result = await stateMachine.TryTransitionAsync(order, new StatusTransitionRequest
        {
            TargetStatus = OrderStatus.AwaitingPayment
        });

        Assert.False(result.Success);
        Assert.Contains("active change requests", result.ErrorMessage);
    }

    [Fact]
    public async Task Mappers_PopulateActiveChangeRequest_AndTimelineEvents()
    {
        await using var db = CreateDbContext();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            FullName = "Test Customer",
            AddressLine1 = "Street 1",
            City = "The Hague",
            PostalCode = "2511AA",
            PhoneNumber = "0600000000",
            Status = OrderStatus.QuoteRequested,
            Items = new List<OrderItem>
            {
                new OrderItem
                {
                    fileName = "gear.stl",
                    Price = 10,
                    ChangeRequests = new List<OrderItemChangeRequest>
                    {
                        new OrderItemChangeRequest
                        {
                            Id = Guid.NewGuid(),
                            Status = "pending_customer",
                            ReasonCategory = "scale_or_size",
                            AdminNotes = "Scale is 1000x too large",
                            RequestedAt = DateTime.UtcNow
                        }
                    }
                }
            }
        };

        var detailsDto = OrderDetailsMapper.MapToDetailsDto(order, "customer@example.com");
        Assert.Single(detailsDto.Items);
        Assert.NotNull(detailsDto.Items[0].ActiveChangeRequest);
        Assert.Equal("scale_or_size", detailsDto.Items[0].ActiveChangeRequest.ReasonCategory);
        Assert.Contains(detailsDto.Timeline, t => t.Type == "change_request");

        var customerDto = OrderCustomerMapper.MapOrderForCustomer(order);
        Assert.Single(customerDto.Items);
        Assert.NotNull(customerDto.Items[0].ActiveChangeRequest);
        Assert.Equal("scale_or_size", customerDto.Items[0].ActiveChangeRequest.ReasonCategory);
    }

    [Fact]
    public async Task StateMachine_ReviseQuote_TransitionsAwaitingPaymentToQuoteRequested()
    {
        await using var db = CreateDbContext();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            FullName = "Jane Doe",
            AddressLine1 = "Street 1",
            City = "Amsterdam",
            PostalCode = "1011AA",
            PhoneNumber = "0612345678",
            Status = OrderStatus.AwaitingPayment,
            IsPaid = false,
            QuoteConfirmedAt = DateTime.UtcNow,
            QuoteExpiresAt = DateTime.UtcNow.AddDays(7),
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var stateMachine = new OrderStatusStateMachine(db);
        var result = await stateMachine.TryTransitionAsync(order, new StatusTransitionRequest
        {
            TargetStatus = OrderStatus.QuoteRequested
        });

        Assert.True(result.Success);
        Assert.Equal(OrderStatus.QuoteRequested, order.Status);
        Assert.Null(order.QuoteConfirmedAt);
        Assert.Null(order.QuoteExpiresAt);
    }

    [Fact]
    public async Task StateMachine_ReviseQuote_FailsWhenOrderAlreadyPaid()
    {
        await using var db = CreateDbContext();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            FullName = "Jane Doe",
            AddressLine1 = "Street 1",
            City = "Amsterdam",
            PostalCode = "1011AA",
            PhoneNumber = "0612345678",
            Status = OrderStatus.AwaitingPayment,
            IsPaid = true
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var stateMachine = new OrderStatusStateMachine(db);
        var result = await stateMachine.TryTransitionAsync(order, new StatusTransitionRequest
        {
            TargetStatus = OrderStatus.QuoteRequested
        });

        Assert.False(result.Success);
        Assert.Contains("already been marked as paid", result.ErrorMessage);
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
