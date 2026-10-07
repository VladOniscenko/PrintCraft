using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Models;

namespace PrintCraftApi.Data;

public static class HeroSlideSeeder
{
    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<HeroSlide>().HasData(
            new HeroSlide
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000101"),
                Title = "Rapid Prototyping & Custom Parts",
                TitleNl = "Snelle Prototyping & Maatwerk Onderdelen",
                Subtext = "High-precision FDM 3D printing for functional prototypes, replacement parts, and custom enclosures in 2-5 working days.",
                SubtextNl = "Precisie FDM 3D-printen voor functionele prototypes, vervangende onderdelen en behuizingen binnen 2-5 werkdagen.",
                PriceText = "Starting from €9.95",
                PriceTextNl = "Vanaf €9,95",
                MediaUrl = "/uploads/hero/cable-holder.stl",
                MediaType = HeroMediaType.Model3d,
                InstructionTooltip = "Interactive 3D model: drag to rotate 360°, scroll to zoom in and inspect geometry.",
                InstructionTooltipNl = "Interactief 3D-model: sleep om 360° te draaien, scroll om in te zoomen op details.",
                IsActive = true,
                SortOrder = 1,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new HeroSlide
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000102"),
                Title = "Engineering Grade Materials",
                TitleNl = "Technische Kwaliteitsmaterialen",
                Subtext = "Durable PETG, heat-resistant ABS, ultra-tough Carbon Fiber, and flexible TPU engineered for real-world demands.",
                SubtextNl = "Duurzaam PETG, hittebestendig ABS, oersterk Carbon Fiber en flexibel TPU voor zware toepassingen.",
                PriceText = "From €0.08 / gram",
                PriceTextNl = "Vanaf €0,08 / gram",
                MediaUrl = "/uploads/hero/materials.svg",
                MediaType = HeroMediaType.Image,
                InstructionTooltip = "Available in 12+ vibrant colors, food-safe filaments, and specialty carbon fiber composites.",
                InstructionTooltipNl = "Beschikbaar in 12+ kleuren, voedselveilige filamenten en carbon-composieten.",
                IsActive = true,
                SortOrder = 2,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            },
            new HeroSlide
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000103"),
                Title = "Detailed Figurines & Art Collectibles",
                TitleNl = "Gedetailleerde Figuren & Kunstobjecten",
                Subtext = "Ultra-fine 0.12mm layer height reproducing intricate curves, character meshes, and miniatures with silky smoothness.",
                SubtextNl = "Fijne 0.12mm laaghoogte voor vloeiende rondingen, miniaturen en artistieke modellen met hoge precisie.",
                PriceText = "Starting at €14.50",
                PriceTextNl = "Vanaf €14,50",
                MediaUrl = "/uploads/hero/dino.stl",
                MediaType = HeroMediaType.Model3d,
                InstructionTooltip = "Rotate the model to check fine organic curves and surface layer fidelity.",
                InstructionTooltipNl = "Draai het model om organische vormen en oppervlaktekwaliteit te inspecteren.",
                IsActive = true,
                SortOrder = 3,
                CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
            }
        );
    }
}
