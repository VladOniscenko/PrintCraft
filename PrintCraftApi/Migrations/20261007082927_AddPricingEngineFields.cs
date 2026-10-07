using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrintCraftApi.Migrations
{
    /// <inheritdoc />
    public partial class AddPricingEngineFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EstimatedPrintTime",
                table: "OrderItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "FilamentUsedGrams",
                table: "OrderItems",
                type: "double precision",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EstimatedPrintTime",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "FilamentUsedGrams",
                table: "OrderItems");
        }
    }
}
