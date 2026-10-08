using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Models;

namespace PrintCraftApi.Data;

public static class HeroSlideSeeder
{
    public static List<HeroSlide> GetDefaultSlides() => new()
    {
        new HeroSlide
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000101"),
            Title = "50% Off Black & White PETG Prints",
            TitleNl = "50% Korting op Zwart & Wit PETG Prints",
            Subtext = "Special promotion: Get an automatic 50% discount on all custom 3D prints ordered in high-durability Black or White PETG. UV-resistant, impact-proof, and heat tolerant.",
            SubtextNl = "Speciale actie: Profiteer van 50% korting op alle 3D-prints in oersterk zwart of wit PETG. Weerbestendig, slagvast en hittebestendig.",
            PriceText = "50% Off Black & White PETG",
            PriceTextNl = "50% Korting op PETG",
            MediaUrl = "/uploads/hero/cable-holder.stl",
            MediaType = HeroMediaType.Model3d,
            InstructionTooltip = "50% discount applies automatically to all functional prints in Black or White PETG.",
            InstructionTooltipNl = "50% korting wordt automatisch verrekend bij selectie van zwart of wit PETG.",
            IsActive = true,
            SortOrder = 1,
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        },
        new HeroSlide
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000102"),
            Title = "HueForge Filament Painting: Turn Pictures into 3D Art",
            TitleNl = "HueForge Filament Painting: Maak van je Foto 3D Kunst",
            Subtext = "Upload any photo or illustration to transform it into a vibrant, multi-color 3D relief print using optical layer blending. No painting required!",
            SubtextNl = "Upload een 2D foto of illustratie en verander deze in een tactiel, meerkleurig 3D reliëf schilderij met optische laagmenging.",
            PriceText = "From €14.95 / Painting",
            PriceTextNl = "Vanaf €14,95 / Schilderij",
            MediaUrl = "/uploads/hero/materials.svg",
            MediaType = HeroMediaType.Image,
            InstructionTooltip = "Drop any picture in our configurator for an instant 3D relief preview with color swaps.",
            InstructionTooltipNl = "Sleep je afbeelding in onze configurator voor een directe full-color 3D reliëf weergave.",
            IsActive = true,
            SortOrder = 2,
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        },
        new HeroSlide
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000103"),
            Title = "Rapid Prototyping & Custom Parts",
            TitleNl = "Snelle Prototyping & Maatwerk Onderdelen",
            Subtext = "High-precision FDM 3D printing for functional prototypes, replacement parts, and custom enclosures in 2-5 working days.",
            SubtextNl = "Precisie FDM 3D-printen voor functionele prototypes, vervangende onderdelen en behuizingen binnen 2-5 werkdagen.",
            PriceText = "Starting from €9.95",
            PriceTextNl = "Vanaf €9,95",
            MediaUrl = "/uploads/hero/snowflake.stl",
            MediaType = HeroMediaType.Model3d,
            InstructionTooltip = "Interactive 3D model: drag to rotate 360°, scroll to zoom in and inspect geometry.",
            InstructionTooltipNl = "Interactief 3D-model: sleep om 360° te draaien, scroll om in te zoomen op details.",
            IsActive = true,
            SortOrder = 3,
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        },
        new HeroSlide
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000104"),
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
            SortOrder = 4,
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        }
    };

    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<HeroSlide>().HasData(GetDefaultSlides());
    }

    /// <summary>
    /// Ensures physical seed files (cable-holder.stl, dino.stl, materials.svg, snowflake.stl)
    /// exist in wwwroot/uploads/hero and wwwroot/uploads so they are served properly.
    /// </summary>
    public static void EnsureSeedAssets(string? webRootPath, string? contentRootPath)
    {
        var resolvedWebRoot = !string.IsNullOrWhiteSpace(webRootPath)
            ? webRootPath
            : Path.Combine(contentRootPath ?? Directory.GetCurrentDirectory(), "wwwroot");

        var uploadsDir = Path.Combine(resolvedWebRoot, "uploads");
        var heroDir = Path.Combine(uploadsDir, "hero");

        try
        {
            Directory.CreateDirectory(uploadsDir);
            Directory.CreateDirectory(heroDir);
        }
        catch
        {
            // Ignore directory creation errors if already exists or permission issues
        }

        var candidateSourceDirs = new List<string>();
        if (!string.IsNullOrWhiteSpace(contentRootPath))
        {
            candidateSourceDirs.Add(Path.Combine(contentRootPath, "SeedAssets", "hero"));
            candidateSourceDirs.Add(Path.Combine(contentRootPath, "SeedAssets"));
            candidateSourceDirs.Add(Path.Combine(contentRootPath, "..", "frontend", "public", "uploads", "hero"));
            candidateSourceDirs.Add(Path.Combine(contentRootPath, "..", "frontend", "public", "uploads"));
            candidateSourceDirs.Add(Path.Combine(contentRootPath, "..", "frontend", "src", "assets", "hero-models"));
        }
        candidateSourceDirs.Add(Path.Combine(Directory.GetCurrentDirectory(), "SeedAssets", "hero"));
        candidateSourceDirs.Add(Path.Combine(Directory.GetCurrentDirectory(), "SeedAssets"));
        candidateSourceDirs.Add(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "hero"));

        var seedFiles = new[]
        {
            "cable-holder.stl",
            "dino.stl",
            "materials.svg",
            "snowflake.stl"
        };

        foreach (var fileName in seedFiles)
        {
            string? validSource = null;
            foreach (var dir in candidateSourceDirs)
            {
                var candidateFile = Path.Combine(dir, fileName);
                if (File.Exists(candidateFile) && new FileInfo(candidateFile).Length > 0)
                {
                    validSource = candidateFile;
                    break;
                }
            }

            if (validSource == null) continue;

            // Ensure in heroDir
            var targetHeroPath = Path.Combine(heroDir, fileName);
            if (!File.Exists(targetHeroPath) || new FileInfo(targetHeroPath).Length == 0)
            {
                try
                {
                    File.Copy(validSource, targetHeroPath, true);
                }
                catch { }
            }

            // Ensure also in top-level uploadsDir for direct upload access and model browser
            var targetUploadPath = Path.Combine(uploadsDir, fileName);
            if (!File.Exists(targetUploadPath) || new FileInfo(targetUploadPath).Length == 0)
            {
                try
                {
                    File.Copy(validSource, targetUploadPath, true);
                }
                catch { }
            }
        }
    }

    /// <summary>
    /// Ensures database has default hero slides if the table is empty.
    /// </summary>
    public static async Task EnsureDatabaseSeededAsync(PrintCraftDb db)
    {
        var defaults = GetDefaultSlides();
        var existingSlides = await db.HeroSlides.ToListAsync();

        if (existingSlides.Count == 0)
        {
            await db.HeroSlides.AddRangeAsync(defaults);
            await db.SaveChangesAsync();
            return;
        }

        bool hasChanges = false;
        foreach (var def in defaults)
        {
            var match = existingSlides.FirstOrDefault(s => s.Id == def.Id)
                        ?? existingSlides.FirstOrDefault(s => s.Title == def.Title);

            if (match == null)
            {
                await db.HeroSlides.AddAsync(def);
                hasChanges = true;
            }
        }

        if (hasChanges)
        {
            await db.SaveChangesAsync();
        }
    }
}
