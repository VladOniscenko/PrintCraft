using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Models;

namespace PrintCraftApi.Data;

public static class FilamentSeeder
{
    public static List<Filament> GetDefaultFilaments() => new()
    {
        // ── PLA (17 Standard Colors) ──────────────────────────────────────────
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000201"),
            Name = "PLA Beige",
            Material = "PLA",
            Color = "Beige",
            PricePerGram = 0.04m,
            StockQuantity = 2000,
            Description = "Standard beige PLA for architectural models and natural aesthetic prints."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000202"),
            Name = "PLA Black",
            Material = "PLA",
            Color = "Black",
            PricePerGram = 0.04m,
            StockQuantity = 5000,
            Description = "Standard baseline PLA in black for general prototypes and display models."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000203"),
            Name = "PLA Blue",
            Material = "PLA",
            Color = "Blue",
            PricePerGram = 0.04m,
            StockQuantity = 3000,
            Description = "Standard primary blue PLA with bright color saturation for everyday 3D prints."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000204"),
            Name = "PLA Brown",
            Material = "PLA",
            Color = "Brown",
            PricePerGram = 0.04m,
            StockQuantity = 2000,
            Description = "Standard brown PLA, optimal for earth-toned models, wood-look parts, and figurines."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000205"),
            Name = "PLA Clear",
            Material = "PLA",
            Color = "Clear",
            PricePerGram = 0.04m,
            StockQuantity = 2500,
            Description = "Natural translucent clear PLA for light diffusion and semi-transparent models."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000206"),
            Name = "PLA Green",
            Material = "PLA",
            Color = "Green",
            PricePerGram = 0.04m,
            StockQuantity = 2500,
            Description = "Standard primary green PLA, great for outdoor accessories, plant holders, and decorative prints."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000207"),
            Name = "PLA Grey",
            Material = "PLA",
            Color = "Grey",
            PricePerGram = 0.04m,
            StockQuantity = 4000,
            Description = "Standard neutral grey PLA, perfect for technical prototypes and dimensional fit checks."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000208"),
            Name = "PLA Light Blue",
            Material = "PLA",
            Color = "Light Blue",
            PricePerGram = 0.04m,
            StockQuantity = 2000,
            Description = "Standard light blue PLA with clean contrast and sharp overhang bridging capabilities."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000209"),
            Name = "PLA Multicolor",
            Material = "PLA",
            Color = "Multicolor",
            PricePerGram = 0.04m,
            StockQuantity = 2000,
            Description = "Multi-color gradient PLA for artistic prints, vases, and decorative pieces."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000210"),
            Name = "PLA Navy",
            Material = "PLA",
            Color = "Navy",
            PricePerGram = 0.04m,
            StockQuantity = 2500,
            Description = "Standard deep navy blue PLA for professional, high-contrast parts."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000211"),
            Name = "PLA Orange",
            Material = "PLA",
            Color = "Orange",
            PricePerGram = 0.04m,
            StockQuantity = 2500,
            Description = "Standard bright orange PLA, popular for high-visibility markers and accents."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000212"),
            Name = "PLA Pink",
            Material = "PLA",
            Color = "Pink",
            PricePerGram = 0.04m,
            StockQuantity = 2000,
            Description = "Standard pink PLA, great for toys, customized gifts, and artistic models."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000213"),
            Name = "PLA Purple",
            Material = "PLA",
            Color = "Purple",
            PricePerGram = 0.04m,
            StockQuantity = 2000,
            Description = "Standard vibrant purple PLA for figurines, tokens, and creative designs."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000214"),
            Name = "PLA Red",
            Material = "PLA",
            Color = "Red",
            PricePerGram = 0.04m,
            StockQuantity = 3000,
            Description = "Standard primary red PLA offering bold color saturation for mechanical and display parts."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000215"),
            Name = "PLA Teal",
            Material = "PLA",
            Color = "Teal",
            PricePerGram = 0.04m,
            StockQuantity = 2000,
            Description = "Standard teal PLA, combining cyan and green tones for modern decorative prints."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000216"),
            Name = "PLA White",
            Material = "PLA",
            Color = "White",
            PricePerGram = 0.04m,
            StockQuantity = 5000,
            Description = "Standard clean white PLA, perfect for painting, architectural mockups, and display pieces."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000217"),
            Name = "PLA Yellow",
            Material = "PLA",
            Color = "Yellow",
            PricePerGram = 0.04m,
            StockQuantity = 2500,
            Description = "Standard bright yellow PLA with high opacity for signs, visual models, and accents."
        },

        // ── PETG (16 Standard Colors) ─────────────────────────────────────────
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000218"),
            Name = "PETG Beige",
            Material = "PETG",
            Color = "Beige",
            PricePerGram = 0.05m,
            StockQuantity = 2000,
            Description = "Specialty beige PETG offering high impact resistance and thermal stability for functional parts."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000219"),
            Name = "PETG Black",
            Material = "PETG",
            Color = "Black",
            PricePerGram = 0.05m,
            StockQuantity = 5000,
            Description = "Universal baseline black PETG. Tough, UV-resistant, and heat-tolerant up to 75°C."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000220"),
            Name = "PETG Blue",
            Material = "PETG",
            Color = "Blue",
            PricePerGram = 0.05m,
            StockQuantity = 3000,
            Description = "Standard blue PETG designed for durable outdoor gear, brackets, and protective casings."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000221"),
            Name = "PETG Brown",
            Material = "PETG",
            Color = "Brown",
            PricePerGram = 0.05m,
            StockQuantity = 1500,
            Description = "Standard brown PETG for functional outdoor mounts and mechanical fittings."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000222"),
            Name = "PETG Clear",
            Material = "PETG",
            Color = "Clear",
            PricePerGram = 0.05m,
            StockQuantity = 4000,
            Description = "Transparent clear PETG with superior layer adhesion for fluid tanks, light diffusers, and covers."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000223"),
            Name = "PETG Green",
            Material = "PETG",
            Color = "Green",
            PricePerGram = 0.05m,
            StockQuantity = 2000,
            Description = "Standard green PETG with high ductility, excellent for functional mechanical parts and clips."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000224"),
            Name = "PETG Grey",
            Material = "PETG",
            Color = "Grey",
            PricePerGram = 0.05m,
            StockQuantity = 4000,
            Description = "Universal baseline grey PETG with high tensile strength for workshop fixtures and machinery jigs."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000225"),
            Name = "PETG Light Blue",
            Material = "PETG",
            Color = "Light Blue",
            PricePerGram = 0.05m,
            StockQuantity = 2000,
            Description = "Standard light blue PETG offering weather resistance and high impact strength."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000226"),
            Name = "PETG Navy",
            Material = "PETG",
            Color = "Navy",
            PricePerGram = 0.05m,
            StockQuantity = 2500,
            Description = "Deep navy PETG with chemical resistance for automotive trim and industrial housings."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000227"),
            Name = "PETG Orange",
            Material = "PETG",
            Color = "Orange",
            PricePerGram = 0.05m,
            StockQuantity = 2500,
            Description = "Rugged orange PETG with excellent fatigue resistance for utility brackets and outdoor mounts."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000228"),
            Name = "PETG Pink",
            Material = "PETG",
            Color = "Pink",
            PricePerGram = 0.05m,
            StockQuantity = 1500,
            Description = "Standard pink PETG combining high impact resistance with vibrant color."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000229"),
            Name = "PETG Purple",
            Material = "PETG",
            Color = "Purple",
            PricePerGram = 0.05m,
            StockQuantity = 1500,
            Description = "Standard purple PETG for durable consumer products and impact-resistant casings."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000230"),
            Name = "PETG Red",
            Material = "PETG",
            Color = "Red",
            PricePerGram = 0.05m,
            StockQuantity = 3000,
            Description = "Standard impact-proof red PETG for heavy-duty automotive brackets and utility levers."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000231"),
            Name = "PETG Teal",
            Material = "PETG",
            Color = "Teal",
            PricePerGram = 0.05m,
            StockQuantity = 2000,
            Description = "Specialty teal PETG for durable consumer product prototypes and waterproof enclosures."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000232"),
            Name = "PETG White",
            Material = "PETG",
            Color = "White",
            PricePerGram = 0.05m,
            StockQuantity = 5000,
            Description = "Universal baseline white PETG for weather-proof outdoor brackets and sensor enclosures."
        },
        new Filament
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000233"),
            Name = "PETG Yellow",
            Material = "PETG",
            Color = "Yellow",
            PricePerGram = 0.05m,
            StockQuantity = 2500,
            Description = "Heavy-duty safety yellow PETG engineered for high visibility, wear resistance, and outdoor longevity."
        }
    };

    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Filament>().HasData(GetDefaultFilaments());
    }

    /// <summary>
    /// Ensures database has default filaments.
    /// If table is empty, seeds all 33 defaults.
    /// If table is not empty, checks for any missing material/color combinations and inserts them.
    /// If forceReload is true, updates existing records to match standard names and descriptions.
    /// </summary>
    public static async Task<SeederResult> EnsureDatabaseSeededAsync(PrintCraftDb db, bool forceReload = false)
    {
        var defaults = GetDefaultFilaments();
        var existingFilaments = await db.Filaments.ToListAsync();
        var result = new SeederResult { TotalBefore = existingFilaments.Count };

        if (existingFilaments.Count == 0)
        {
            await db.Filaments.AddRangeAsync(defaults);
            await db.SaveChangesAsync();
            result.Inserted = defaults.Count;
            result.TotalAfter = defaults.Count;
            return result;
        }

        foreach (var def in defaults)
        {
            var match = existingFilaments.FirstOrDefault(f => f.Id == def.Id)
                        ?? existingFilaments.FirstOrDefault(f => string.Equals(f.Material, def.Material, StringComparison.OrdinalIgnoreCase)
                                                              && string.Equals(f.Color, def.Color, StringComparison.OrdinalIgnoreCase));

            if (match == null)
            {
                await db.Filaments.AddAsync(def);
                result.Inserted++;
            }
            else if (forceReload)
            {
                match.Name = def.Name;
                match.Material = def.Material;
                match.Color = def.Color;
                match.PricePerGram = def.PricePerGram;
                match.StockQuantity = def.StockQuantity;
                match.Description = def.Description;
                result.Updated++;
            }
        }

        if (result.Inserted > 0 || result.Updated > 0)
        {
            await db.SaveChangesAsync();
        }

        result.TotalAfter = await db.Filaments.CountAsync();
        return result;
    }
}
