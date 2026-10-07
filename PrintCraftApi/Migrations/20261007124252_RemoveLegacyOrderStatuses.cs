using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrintCraftApi.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLegacyOrderStatuses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var updateStatusSql = @"
                UPDATE ""Orders"" SET ""Status"" = 'quote_requested' WHERE ""Status"" = 'pending_quote';
                UPDATE ""Orders"" SET ""Status"" = 'awaiting_payment' WHERE ""Status"" = 'pending_payment';
                UPDATE ""Orders"" SET ""Status"" = 'ready_to_print' WHERE ""Status"" = 'paid';
                UPDATE ""Orders"" SET ""Status"" = 'shipped' WHERE ""Status"" IN ('sent', 'delivered', 'completed');
                UPDATE ""Orders"" SET ""Status"" = 'cancelled' WHERE ""Status"" IN ('refunded', 'expired_quote', 'failed', 'pending', 'quoted');

                UPDATE ""OrderStatusHistory"" SET ""NewStatus"" = 'quote_requested' WHERE ""NewStatus"" = 'pending_quote';
                UPDATE ""OrderStatusHistory"" SET ""NewStatus"" = 'awaiting_payment' WHERE ""NewStatus"" = 'pending_payment';
                UPDATE ""OrderStatusHistory"" SET ""NewStatus"" = 'ready_to_print' WHERE ""NewStatus"" = 'paid';
                UPDATE ""OrderStatusHistory"" SET ""NewStatus"" = 'shipped' WHERE ""NewStatus"" IN ('sent', 'delivered', 'completed');
                UPDATE ""OrderStatusHistory"" SET ""NewStatus"" = 'cancelled' WHERE ""NewStatus"" IN ('refunded', 'expired_quote', 'failed', 'pending', 'quoted');

                UPDATE ""OrderStatusHistory"" SET ""PreviousStatus"" = 'quote_requested' WHERE ""PreviousStatus"" = 'pending_quote';
                UPDATE ""OrderStatusHistory"" SET ""PreviousStatus"" = 'awaiting_payment' WHERE ""PreviousStatus"" = 'pending_payment';
                UPDATE ""OrderStatusHistory"" SET ""PreviousStatus"" = 'ready_to_print' WHERE ""PreviousStatus"" = 'paid';
                UPDATE ""OrderStatusHistory"" SET ""PreviousStatus"" = 'shipped' WHERE ""PreviousStatus"" IN ('sent', 'delivered', 'completed');
                UPDATE ""OrderStatusHistory"" SET ""PreviousStatus"" = 'cancelled' WHERE ""PreviousStatus"" IN ('refunded', 'expired_quote', 'failed', 'pending', 'quoted');
            ";
            migrationBuilder.Sql(updateStatusSql);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Empty down migration as we don't want to restore legacy statuses
        }
    }
}

