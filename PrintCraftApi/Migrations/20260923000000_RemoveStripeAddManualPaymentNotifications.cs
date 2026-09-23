using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrintCraftApi.Migrations;

public partial class RemoveStripeAddManualPaymentNotifications : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<string>(name: "PaymentFlow", table: "Orders", type: "character varying(32)", maxLength: 32, nullable: false, defaultValue: "bank_transfer", oldClrType: typeof(string), oldType: "character varying(32)", oldMaxLength: 32, oldDefaultValue: "stripe");
        migrationBuilder.Sql("UPDATE \"Orders\" SET \"PaymentFlow\" = 'bank_transfer' WHERE \"PaymentFlow\" IN ('stripe', 'manual', 'invoice');");
        migrationBuilder.CreateTable(name: "ManualPaymentNotifications", columns: table => new
        {
            Id = table.Column<Guid>(type: "uuid", nullable: false),
            OrderId = table.Column<Guid>(type: "uuid", nullable: false),
            Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
            CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
            ReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
        }, constraints: table =>
        {
            table.PrimaryKey("PK_ManualPaymentNotifications", x => x.Id);
            table.ForeignKey("FK_ManualPaymentNotifications_Orders_OrderId", x => x.OrderId, "Orders", "Id", onDelete: ReferentialAction.Cascade);
        });
        migrationBuilder.CreateIndex(name: "IX_ManualPaymentNotifications_OrderId_CreatedAt", table: "ManualPaymentNotifications", columns: new[] { "OrderId", "CreatedAt" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "ManualPaymentNotifications");
        migrationBuilder.AlterColumn<string>(name: "PaymentFlow", table: "Orders", type: "character varying(32)", maxLength: 32, nullable: false, defaultValue: "stripe", oldClrType: typeof(string), oldType: "character varying(32)", oldMaxLength: 32, oldDefaultValue: "bank_transfer");
    }
}