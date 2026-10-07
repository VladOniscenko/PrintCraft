using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PrintCraftApi.Migrations
{
    /// <inheritdoc />
    public partial class AddHeroSlides : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "HeroSlides",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Subtext = table.Column<string>(type: "text", nullable: false),
                    PriceText = table.Column<string>(type: "text", nullable: false),
                    MediaUrl = table.Column<string>(type: "text", nullable: false),
                    MediaType = table.Column<string>(type: "text", nullable: false),
                    InstructionTooltip = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HeroSlides", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "HeroSlides",
                columns: new[] { "Id", "CreatedAt", "InstructionTooltip", "IsActive", "MediaType", "MediaUrl", "PriceText", "SortOrder", "Subtext", "Title", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000101"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Interactive 3D model: drag to rotate 360°, scroll to zoom in and inspect geometry.", true, "model3d", "/uploads/hero/cable-holder.stl", "Starting from €9.95", 1, "High-precision FDM 3D printing for functional prototypes, replacement parts, and custom enclosures.", "Rapid Prototyping & Custom Parts", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0000-000000000102"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Available in 12+ vibrant colors, food-safe filaments, and specialty carbon fiber composites.", true, "image", "/uploads/hero/materials.svg", "From €0.08 / gram", 2, "Durable PETG, heat-resistant ABS, ultra-tough Carbon Fiber, and flexible TPU engineered for real-world demands.", "Engineering Grade Materials", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("00000000-0000-0000-0000-000000000103"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Rotate the model to check fine organic curves and surface layer fidelity.", true, "model3d", "/uploads/hero/dino.stl", "Starting at €14.50", 3, "Ultra-fine 0.12mm layer height reproducing intricate curves, character meshes, and miniatures with silky smoothness.", "Detailed Figurines & Art Collectibles", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.CreateIndex(
                name: "IX_HeroSlides_IsActive_SortOrder",
                table: "HeroSlides",
                columns: new[] { "IsActive", "SortOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HeroSlides");
        }
    }
}
