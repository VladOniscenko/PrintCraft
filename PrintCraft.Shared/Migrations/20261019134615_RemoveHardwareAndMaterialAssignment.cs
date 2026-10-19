using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrintCraft.Shared.Migrations
{
    /// <inheritdoc />
    public partial class RemoveHardwareAndMaterialAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssignedMaterial",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "AssignedPrinter",
                table: "Orders");

            migrationBuilder.CreateTable(
                name: "PolicyTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    LastUpdated = table.Column<string>(type: "text", nullable: false),
                    Sections = table.Column<string>(type: "text", nullable: false),
                    ContactTitle = table.Column<string>(type: "text", nullable: false),
                    ContactBody = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PolicyTemplates", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "Subject",
                value: "Reset your Print My 3D password");

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000011"),
                column: "Subject",
                value: "Stel je Print My 3D wachtwoord opnieuw in");

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000021"),
                column: "Subject",
                value: "Print My 3D şifrenizi sıfırlayın");

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000031"),
                column: "Subject",
                value: "Сбросьте пароль Print My 3D");

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000041"),
                column: "Subject",
                value: "إعادة تعيين كلمة مرور Print My 3D الخاصة بك");

            migrationBuilder.CreateIndex(
                name: "IX_PolicyTemplates_IsActive",
                table: "PolicyTemplates",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_PolicyTemplates_Slug",
                table: "PolicyTemplates",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PolicyTemplates");

            migrationBuilder.AddColumn<string>(
                name: "AssignedMaterial",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssignedPrinter",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000001"),
                column: "Subject",
                value: "Reset your PrintCraft password");

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000011"),
                column: "Subject",
                value: "Stel je PrintCraft wachtwoord opnieuw in");

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000021"),
                column: "Subject",
                value: "PrintCraft şifrenizi sıfırlayın");

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000031"),
                column: "Subject",
                value: "Сбросьте пароль PrintCraft");

            migrationBuilder.UpdateData(
                table: "EmailTemplates",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000041"),
                column: "Subject",
                value: "إعادة تعيين كلمة مرور PrintCraft الخاصة بك");
        }
    }
}
