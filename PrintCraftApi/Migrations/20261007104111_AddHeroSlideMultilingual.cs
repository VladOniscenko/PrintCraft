using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PrintCraftApi.Migrations
{
    /// <inheritdoc />
    public partial class AddHeroSlideMultilingual : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.AddColumn<string>(
                name: "InstructionTooltipNl",
                table: "HeroSlides",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PriceTextNl",
                table: "HeroSlides",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubtextNl",
                table: "HeroSlides",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TitleNl",
                table: "HeroSlides",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "HeroSlides",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000101"),
                columns: new[] { "InstructionTooltipNl", "PriceTextNl", "Subtext", "SubtextNl", "TitleNl" },
                values: new object[] { "Interactief 3D-model: sleep om 360° te draaien, scroll om in te zoomen op details.", "Vanaf €9,95", "High-precision FDM 3D printing for functional prototypes, replacement parts, and custom enclosures in 2-5 working days.", "Precisie FDM 3D-printen voor functionele prototypes, vervangende onderdelen en behuizingen binnen 2-5 werkdagen.", "Snelle Prototyping & Maatwerk Onderdelen" });

            migrationBuilder.UpdateData(
                table: "HeroSlides",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000102"),
                columns: new[] { "InstructionTooltipNl", "PriceTextNl", "SubtextNl", "TitleNl" },
                values: new object[] { "Beschikbaar in 12+ kleuren, voedselveilige filamenten en carbon-composieten.", "Vanaf €0,08 / gram", "Duurzaam PETG, hittebestendig ABS, oersterk Carbon Fiber en flexibel TPU voor zware toepassingen.", "Technische Kwaliteitsmaterialen" });

            migrationBuilder.UpdateData(
                table: "HeroSlides",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000103"),
                columns: new[] { "InstructionTooltipNl", "PriceTextNl", "SubtextNl", "TitleNl" },
                values: new object[] { "Draai het model om organische vormen en oppervlaktekwaliteit te inspecteren.", "Vanaf €14,50", "Fijne 0.12mm laaghoogte voor vloeiende rondingen, miniaturen en artistieke modellen met hoge precisie.", "Gedetailleerde Figuren & Kunstobjecten" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.DropColumn(
                name: "InstructionTooltipNl",
                table: "HeroSlides");

            migrationBuilder.DropColumn(
                name: "PriceTextNl",
                table: "HeroSlides");

            migrationBuilder.DropColumn(
                name: "SubtextNl",
                table: "HeroSlides");

            migrationBuilder.DropColumn(
                name: "TitleNl",
                table: "HeroSlides");

            migrationBuilder.UpdateData(
                table: "HeroSlides",
                keyColumn: "Id",
                keyValue: new Guid("00000000-0000-0000-0000-000000000101"),
                column: "Subtext",
                value: "High-precision FDM 3D printing for functional prototypes, replacement parts, and custom enclosures.");
        }
    }
}
