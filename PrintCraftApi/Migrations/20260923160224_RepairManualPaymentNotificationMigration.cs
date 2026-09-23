using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrintCraftApi.Migrations
{
    /// <inheritdoc />
    public partial class RepairManualPaymentNotificationMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "PaymentFlow",
                table: "Orders",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                defaultValue: "bank_transfer",
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32,
                oldNullable: true,
                oldDefaultValue: "bank_transfer");

            migrationBuilder.Sql("""
                CREATE TABLE IF NOT EXISTS "ManualPaymentNotifications" (
                    "Id" uuid NOT NULL,
                    "OrderId" uuid NOT NULL,
                    "Message" character varying(500),
                    "CreatedAt" timestamp with time zone NOT NULL,
                    "ReviewedAt" timestamp with time zone,
                    CONSTRAINT "PK_ManualPaymentNotifications" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_ManualPaymentNotifications_Orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES "Orders" ("Id") ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS "IX_ManualPaymentNotifications_OrderId_CreatedAt" ON "ManualPaymentNotifications" ("OrderId", "CreatedAt");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ManualPaymentNotifications");

            migrationBuilder.AlterColumn<string>(
                name: "PaymentFlow",
                table: "Orders",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true,
                defaultValue: "bank_transfer",
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32,
                oldDefaultValue: "bank_transfer");
        }
    }
}
