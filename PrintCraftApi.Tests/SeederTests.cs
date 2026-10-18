using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using Xunit;

namespace PrintCraftApi.Tests;

public class SeederTests
{
    private static PrintCraftDb CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<PrintCraftDb>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new PrintCraftDb(options);
    }

    [Fact]
    public async Task FilamentSeeder_SeedsAllStandardFilaments_WhenTableIsEmpty()
    {
        using var db = CreateDbContext();

        var result = await FilamentSeeder.EnsureDatabaseSeededAsync(db);

        Assert.Equal(0, result.TotalBefore);
        Assert.Equal(33, result.Inserted);
        Assert.Equal(33, result.TotalAfter);

        var filaments = await db.Filaments.ToListAsync();
        Assert.Equal(33, filaments.Count);

        var pla = filaments.Where(f => f.Material == "PLA").ToList();
        var petg = filaments.Where(f => f.Material == "PETG").ToList();

        Assert.Equal(17, pla.Count);
        Assert.Equal(16, petg.Count);

        // Verify only clean standard names (strictly no "Silk", "Matte", "Neon", etc.)
        foreach (var f in filaments)
        {
            Assert.DoesNotContain("Silk", f.Name, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("Matte", f.Name, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("Neon", f.Name, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("Metallic", f.Name, StringComparison.OrdinalIgnoreCase);
        }
    }

    [Fact]
    public async Task FilamentSeeder_DoesNotDuplicate_WhenTableIsNotEmpty()
    {
        using var db = CreateDbContext();

        var initial = await FilamentSeeder.EnsureDatabaseSeededAsync(db);
        Assert.Equal(33, initial.Inserted);

        var second = await FilamentSeeder.EnsureDatabaseSeededAsync(db);
        Assert.Equal(33, second.TotalBefore);
        Assert.Equal(0, second.Inserted);
        Assert.Equal(33, second.TotalAfter);

        var total = await db.Filaments.CountAsync();
        Assert.Equal(33, total);
    }

    [Fact]
    public async Task FilamentSeeder_InsertsMissingRecords_WhenTableHasPartialFilaments()
    {
        using var db = CreateDbContext();

        // Seed initial 33
        await FilamentSeeder.EnsureDatabaseSeededAsync(db);

        // Remove 2 filaments
        var toRemove = await db.Filaments.Where(f => f.Color == "Light Blue").ToListAsync();
        db.Filaments.RemoveRange(toRemove);
        await db.SaveChangesAsync();

        var countBefore = await db.Filaments.CountAsync();
        Assert.Equal(31, countBefore);

        // Run seeder again
        var result = await FilamentSeeder.EnsureDatabaseSeededAsync(db);

        Assert.Equal(31, result.TotalBefore);
        Assert.Equal(2, result.Inserted);
        Assert.Equal(33, result.TotalAfter);

        var lightBlueCount = await db.Filaments.CountAsync(f => f.Color == "Light Blue");
        Assert.Equal(2, lightBlueCount);
    }

    [Fact]
    public async Task EmailTemplateSeeder_SeedsAllDefaultTemplates_WhenTableIsEmpty()
    {
        using var db = CreateDbContext();

        var result = await EmailTemplateSeeder.EnsureDatabaseSeededAsync(db);

        Assert.Equal(0, result.TotalBefore);
        Assert.Equal(6, result.Inserted);
        Assert.Equal(6, result.TotalAfter);

        var templates = await db.EmailTemplates.ToListAsync();
        Assert.Contains(templates, t => t.TemplateName == "QuoteRequested");
        Assert.Contains(templates, t => t.TemplateName == "QuoteConfirmation");
        Assert.Contains(templates, t => t.TemplateName == "QuoteConfirmationBankTransfer");
        Assert.Contains(templates, t => t.TemplateName == "OrderSentTracking");
        Assert.Contains(templates, t => t.TemplateName == "OrderPaid");
        Assert.Contains(templates, t => t.TemplateName == "ResetPassword");
    }

    [Fact]
    public async Task HeroSlideSeeder_SeedsDefaultSlides_WhenTableIsEmpty()
    {
        using var db = CreateDbContext();

        var result = await HeroSlideSeeder.EnsureDatabaseSeededAsync(db);

        Assert.Equal(0, result.TotalBefore);
        Assert.Equal(4, result.Inserted);
        Assert.Equal(4, result.TotalAfter);

        var slides = await db.HeroSlides.ToListAsync();
        Assert.Equal(4, slides.Count);
    }
}
