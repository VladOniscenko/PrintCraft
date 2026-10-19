using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrintCraft.Shared.Migrations
{
    /// <inheritdoc />
    public partial class AddAutoForgeJobIdToOrderItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AutoForgeJobId",
                table: "OrderItems",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AutoForgeJobId",
                table: "OrderItems");
        }
    }
}
