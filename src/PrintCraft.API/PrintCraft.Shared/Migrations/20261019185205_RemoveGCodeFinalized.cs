using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrintCraft.Shared.Migrations
{
    /// <inheritdoc />
    public partial class RemoveGCodeFinalized : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GCodeFinalized",
                table: "Orders");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "GCodeFinalized",
                table: "Orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
