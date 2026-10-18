using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Controllers;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using Xunit;

namespace PrintCraftApi.Tests;

public class FaqControllerTests
{
    private static PrintCraftDb CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<PrintCraftDb>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new PrintCraftDb(options);
    }

    [Fact]
    public async Task GetAll_ReturnsOnlyActiveFaqsByDefault()
    {
        using var db = CreateDbContext();
        db.FaqItems.AddRange(
            new FaqItem
            {
                Question = new() { ["nl"] = "Vraag 1", ["en"] = "Question 1" },
                Answer = new() { ["nl"] = "Antwoord 1", ["en"] = "Answer 1" },
                IsActive = true,
                SortOrder = 1
            },
            new FaqItem
            {
                Question = new() { ["nl"] = "Vraag 2 (inactief)", ["en"] = "Question 2 (inactive)" },
                Answer = new() { ["nl"] = "Antwoord 2", ["en"] = "Answer 2" },
                IsActive = false,
                SortOrder = 2
            }
        );
        await db.SaveChangesAsync();

        var controller = new FaqController(db);
        var result = await controller.GetAll(all: false, category: null);

        var ok = Assert.IsType<OkObjectResult>(result);
        var items = Assert.IsAssignableFrom<List<FaqItem>>(ok.Value);
        Assert.Single(items);
        Assert.Equal("Vraag 1", items[0].Question["nl"]);

        // When all=true, returns both
        var allResult = await controller.GetAll(all: true, category: null);
        var allOk = Assert.IsType<OkObjectResult>(allResult);
        var allItems = Assert.IsAssignableFrom<List<FaqItem>>(allOk.Value);
        Assert.Equal(2, allItems.Count);
    }

    [Fact]
    public async Task Create_AddsNewFaqItem_AndReturnsCreated()
    {
        using var db = CreateDbContext();
        var controller = new FaqController(db);

        var newFaq = new FaqItem
        {
            Question = new() { ["nl"] = "Nieuwe vraag", ["en"] = "New Question" },
            Answer = new() { ["nl"] = "Nieuw antwoord", ["en"] = "New Answer" },
            Category = "materials",
            SortOrder = 5,
            IsActive = true
        };

        var result = await controller.Create(newFaq);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        var item = Assert.IsType<FaqItem>(created.Value);
        Assert.Equal("Nieuwe vraag", item.Question["nl"]);
        Assert.Equal("materials", item.Category);

        var inDb = await db.FaqItems.FirstOrDefaultAsync(f => f.Id == item.Id);
        Assert.NotNull(inDb);
    }

    [Fact]
    public async Task Update_ModifiesExistingFaqItem()
    {
        using var db = CreateDbContext();
        var existing = new FaqItem
        {
            Id = Guid.NewGuid(),
            Question = new() { ["nl"] = "Oude vraag", ["en"] = "Old Question" },
            Answer = new() { ["nl"] = "Oud antwoord", ["en"] = "Old Answer" },
            IsActive = true,
            SortOrder = 1
        };
        db.FaqItems.Add(existing);
        await db.SaveChangesAsync();

        var controller = new FaqController(db);
        var updateRequest = new FaqItem
        {
            Question = new() { ["nl"] = "Bijgewerkte vraag", ["en"] = "Updated Question" },
            Answer = new() { ["nl"] = "Bijgewerkt antwoord", ["en"] = "Updated Answer" },
            SortOrder = 10,
            IsActive = false
        };

        var result = await controller.Update(existing.Id, updateRequest);

        var ok = Assert.IsType<OkObjectResult>(result);
        var updated = Assert.IsType<FaqItem>(ok.Value);
        Assert.Equal("Bijgewerkte vraag", updated.Question["nl"]);
        Assert.False(updated.IsActive);
        Assert.Equal(10, updated.SortOrder);
    }

    [Fact]
    public async Task Delete_RemovesFaqItem()
    {
        using var db = CreateDbContext();
        var existing = new FaqItem
        {
            Id = Guid.NewGuid(),
            Question = new() { ["nl"] = "Te verwijderen", ["en"] = "To delete" },
            Answer = new() { ["nl"] = "Antwoord", ["en"] = "Answer" }
        };
        db.FaqItems.Add(existing);
        await db.SaveChangesAsync();

        var controller = new FaqController(db);
        var result = await controller.Delete(existing.Id);

        Assert.IsType<OkObjectResult>(result);
        Assert.Null(await db.FaqItems.FirstOrDefaultAsync(f => f.Id == existing.Id));
    }
}
