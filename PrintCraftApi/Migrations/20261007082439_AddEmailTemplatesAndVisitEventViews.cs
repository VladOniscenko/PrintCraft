using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PrintCraftApi.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailTemplatesAndVisitEventViews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Views",
                table: "VisitEvents",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "EmailTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TemplateName = table.Column<string>(type: "text", nullable: false),
                    Subject = table.Column<string>(type: "text", nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailTemplates", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "EmailTemplates",
                columns: new[] { "Id", "Body", "Subject", "TemplateName" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000001"), "Hi {{CustomerName}},\n\nWe received a request to reset your password.\n\nReset link:\n{{ResetLink}}\n\nIf you did not request this, you can ignore this email.\n\n- PrintCraft", "Reset your PrintCraft password", "ResetPassword" },
                    { new Guid("00000000-0000-0000-0000-000000000002"), "Hi {{CustomerName}},\n\nWe got your quote request (Order: {{OrderId}}).\n\nOur team will review your files and send pricing soon. You can check the status of your request anytime in your portal.\n\n- PrintCraft", "We received your quote request", "QuoteRequested" },
                    { new Guid("00000000-0000-0000-0000-000000000003"), "Hi {{CustomerName}},\n\nGood news! Your quote for order {{OrderId}} is ready.\n\nPlease log in to your PrintCraft portal to view the price, read any notes from our team, and securely complete your payment.\n\n- PrintCraft", "Your quote is ready", "QuoteConfirmation" },
                    { new Guid("00000000-0000-0000-0000-000000000004"), "Hi {{CustomerName}},\n\nGood news! Your quote for order {{OrderId}} is ready.\n\nPlease log in to your PrintCraft portal to review the quote and get the bank transfer instructions to complete your payment.\n\nOnce your transfer is received, we will start production.\n\n- PrintCraft", "Your quote is ready for review", "QuoteConfirmationBankTransfer" },
                    { new Guid("00000000-0000-0000-0000-000000000005"), "Hi {{CustomerName}},\n\nYour order ({{OrderId}}) has been shipped!\n\nPlease log in to your PrintCraft portal to view your tracking number and shipping details.\n\nThanks for choosing PrintCraft.\n\n- PrintCraft", "Your order has shipped", "OrderSentTracking" },
                    { new Guid("00000000-0000-0000-0000-000000000006"), "Hi {{CustomerName}},\n\nWe successfully received your payment for order {{OrderId}}.\n\nYour order is now confirmed and moving into production. You can track its progress at any time in your portal.\n\n- PrintCraft", "Payment received", "OrderPaid" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmailTemplates");

            migrationBuilder.DropColumn(
                name: "Views",
                table: "VisitEvents");
        }
    }
}
