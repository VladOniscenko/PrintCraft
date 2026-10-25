using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrintCraft.Shared.Migrations
{
    /// <inheritdoc />
    public partial class AddExpressAndRequestType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsExpress",
                table: "QuoteDrafts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RequestType",
                table: "QuoteDrafts",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsExpress",
                table: "Orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "RequestType",
                table: "Orders",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsExpress",
                table: "QuoteDrafts");

            migrationBuilder.DropColumn(
                name: "RequestType",
                table: "QuoteDrafts");

            migrationBuilder.DropColumn(
                name: "IsExpress",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "RequestType",
                table: "Orders");
        }
    }
}
