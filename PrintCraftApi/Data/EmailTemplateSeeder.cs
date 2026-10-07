using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Models;

namespace PrintCraftApi.Data;

public static class EmailTemplateSeeder
{
    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EmailTemplate>().HasData(
            new EmailTemplate
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                TemplateName = "ResetPassword",
                Subject = "Reset your PrintCraft password",
                Body = "Hi {{CustomerName}},\n\nWe received a request to reset your password.\n\nReset link:\n{{ResetLink}}\n\nIf you did not request this, you can ignore this email.\n\n- PrintCraft"
            },
            new EmailTemplate
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                TemplateName = "QuoteRequested",
                Subject = "We received your quote request",
                Body = "Hi {{CustomerName}},\n\nWe got your quote request (Order: {{OrderId}}).\n\nOur team will review your files and send pricing soon. You can check the status of your request anytime in your portal.\n\n- PrintCraft"
            },
            new EmailTemplate
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                TemplateName = "QuoteConfirmation",
                Subject = "Your quote is ready",
                Body = "Hi {{CustomerName}},\n\nGood news! Your quote for order {{OrderId}} is ready.\n\nPlease log in to your PrintCraft portal to view the price, read any notes from our team, and securely complete your payment.\n\n- PrintCraft"
            },
            new EmailTemplate
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000004"),
                TemplateName = "QuoteConfirmationBankTransfer",
                Subject = "Your quote is ready for review",
                Body = "Hi {{CustomerName}},\n\nGood news! Your quote for order {{OrderId}} is ready.\n\nPlease log in to your PrintCraft portal to review the quote and get the bank transfer instructions to complete your payment.\n\nOnce your transfer is received, we will start production.\n\n- PrintCraft"
            },
            new EmailTemplate
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000005"),
                TemplateName = "OrderSentTracking",
                Subject = "Your order has shipped",
                Body = "Hi {{CustomerName}},\n\nYour order ({{OrderId}}) has been shipped!\n\nPlease log in to your PrintCraft portal to view your tracking number and shipping details.\n\nThanks for choosing PrintCraft.\n\n- PrintCraft"
            },
            new EmailTemplate
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000006"),
                TemplateName = "OrderPaid",
                Subject = "Payment received",
                Body = "Hi {{CustomerName}},\n\nWe successfully received your payment for order {{OrderId}}.\n\nYour order is now confirmed and moving into production. You can track its progress at any time in your portal.\n\n- PrintCraft"
            }
        );
    }
}
