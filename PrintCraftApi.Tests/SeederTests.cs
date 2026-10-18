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
        Assert.Equal(30, result.Inserted);
        Assert.Equal(30, result.TotalAfter);

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

    [Fact]
    public async Task FaqItemSeeder_Seeds16FaqItems_WhenTableIsEmpty()
    {
        using var db = CreateDbContext();

        var result = await FaqItemSeeder.EnsureDatabaseSeededAsync(db);

        Assert.Equal(0, result.TotalBefore);
        Assert.Equal(16, result.Inserted);
        Assert.Equal(16, result.TotalAfter);

        var faqs = await db.FaqItems.ToListAsync();
        Assert.Equal(16, faqs.Count);
        Assert.All(faqs, f =>
        {
            Assert.True(f.Question.ContainsKey("nl") && !string.IsNullOrWhiteSpace(f.Question["nl"]));
            Assert.True(f.Question.ContainsKey("en") && !string.IsNullOrWhiteSpace(f.Question["en"]));
            Assert.True(f.Answer.ContainsKey("nl") && !string.IsNullOrWhiteSpace(f.Answer["nl"]));
            Assert.True(f.Answer.ContainsKey("en") && !string.IsNullOrWhiteSpace(f.Answer["en"]));
        });

        // Calling again does not duplicate
        var second = await FaqItemSeeder.EnsureDatabaseSeededAsync(db);
        Assert.Equal(16, second.TotalBefore);
        Assert.Equal(0, second.Inserted);
        Assert.Equal(16, second.TotalAfter);
    }

    [Fact]
    public async Task FaqTopicSeeder_Seeds4Topics_WhenTableIsEmpty()
    {
        using var db = CreateDbContext();

        var result = await FaqTopicSeeder.EnsureDatabaseSeededAsync(db);

        Assert.Equal(0, result.TotalBefore);
        Assert.Equal(4, result.Inserted);
        Assert.Equal(4, result.TotalAfter);

        var topics = await db.FaqTopics.ToListAsync();
        Assert.Equal(4, topics.Count);
        Assert.Contains(topics, t => t.Slug == "vervangende-onderdelen-printen");
        Assert.Contains(topics, t => t.Slug == "elektronica-behuizingen-op-maat");
        Assert.Contains(topics, t => t.Slug == "mallen-kalibers-jigs-fixtures");
        Assert.Contains(topics, t => t.Slug == "rapid-prototyping-kunststof");

        // Verify multilingual fields exist
        foreach (var t in topics)
        {
            Assert.True(t.Names.ContainsKey("nl") && !string.IsNullOrWhiteSpace(t.Names["nl"]));
            Assert.True(t.Names.ContainsKey("en") && !string.IsNullOrWhiteSpace(t.Names["en"]));
            Assert.True(t.Benefits.ContainsKey("nl") && t.Benefits["nl"].Count > 0);
            Assert.True(t.Faqs.ContainsKey("nl") && t.Faqs["nl"].Count > 0);
        }

        // Calling again does not duplicate
        var second = await FaqTopicSeeder.EnsureDatabaseSeededAsync(db);
        Assert.Equal(0, second.Inserted);
        Assert.Equal(4, second.TotalAfter);
    }

    [Fact]
    public async Task CitySeeder_Seeds28Cities_WhenTableIsEmpty()
    {
        using var db = CreateDbContext();

        var result = await CitySeeder.EnsureDatabaseSeededAsync(db);

        Assert.Equal(0, result.TotalBefore);
        Assert.Equal(28, result.Inserted);
        Assert.Equal(28, result.TotalAfter);

        var cities = await db.Cities.ToListAsync();
        Assert.Equal(28, cities.Count);
        Assert.Contains(cities, c => c.Slug == "amsterdam");
        Assert.Contains(cities, c => c.Slug == "rotterdam");
        Assert.Contains(cities, c => c.Slug == "den-haag");

        var denHaag = cities.First(c => c.Slug == "den-haag");
        Assert.Equal("Den Haag", denHaag.Names["nl"]);
        Assert.Equal("The Hague", denHaag.Names["en"]);
        Assert.Equal("Zuid-Holland", denHaag.Province);
        Assert.NotNull(denHaag.Latitude);
        Assert.NotNull(denHaag.Longitude);

        // Calling again does not duplicate
        var second = await CitySeeder.EnsureDatabaseSeededAsync(db);
        Assert.Equal(0, second.Inserted);
        Assert.Equal(28, second.TotalAfter);
    }
}
