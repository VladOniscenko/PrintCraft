using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintCraft.Features.Content.Controllers;
using PrintCraft.Shared.Data;
using PrintCraft.Shared.Models;
using Xunit;

namespace PrintCraftApi.Tests;

public class CitiesControllerTests
{
    private static PrintCraftDb CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<PrintCraftDb>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new PrintCraftDb(options);
    }

    [Fact]
    public async Task GetAll_ReturnsActiveCitiesOrderedBySortOrder()
    {
        using var db = CreateDbContext();
        db.Cities.AddRange(
            new City
            {
                Slug = "rotterdam",
                Names = new() { ["nl"] = "Rotterdam", ["en"] = "Rotterdam" },
                Province = "Zuid-Holland",
                SortOrder = 2,
                IsActive = true
            },
            new City
            {
                Slug = "amsterdam",
                Names = new() { ["nl"] = "Amsterdam", ["en"] = "Amsterdam" },
                Province = "Noord-Holland",
                SortOrder = 1,
                IsActive = true
            },
            new City
            {
                Slug = "inactive-city",
                Names = new() { ["nl"] = "Inactief", ["en"] = "Inactive" },
                SortOrder = 3,
                IsActive = false
            }
        );
        await db.SaveChangesAsync();

        var controller = new CitiesController(db);
        var result = await controller.GetAll(all: false, province: null);

        var ok = Assert.IsType<OkObjectResult>(result);
        var cities = Assert.IsAssignableFrom<List<City>>(ok.Value);
        Assert.Equal(2, cities.Count);
        Assert.Equal("amsterdam", cities[0].Slug);
        Assert.Equal("rotterdam", cities[1].Slug);
    }

    [Fact]
    public async Task GetBySlugOrId_ReturnsCorrectCity()
    {
        using var db = CreateDbContext();
        var city = new City
        {
            Id = Guid.NewGuid(),
            Slug = "utrecht",
            Names = new() { ["nl"] = "Utrecht", ["en"] = "Utrecht" },
            Province = "Utrecht"
        };
        db.Cities.Add(city);
        await db.SaveChangesAsync();

        var controller = new CitiesController(db);

        // Fetch by slug
        var bySlugResult = await controller.GetBySlugOrId("utrecht");
        var okSlug = Assert.IsType<OkObjectResult>(bySlugResult);
        var foundBySlug = Assert.IsType<City>(okSlug.Value);
        Assert.Equal("utrecht", foundBySlug.Slug);

        // Fetch by GUID
        var byGuidResult = await controller.GetBySlugOrId(city.Id.ToString());
        var okGuid = Assert.IsType<OkObjectResult>(byGuidResult);
        var foundByGuid = Assert.IsType<City>(okGuid.Value);
        Assert.Equal("utrecht", foundByGuid.Slug);
    }

    [Fact]
    public async Task Create_FailsOnDuplicateSlug()
    {
        using var db = CreateDbContext();
        db.Cities.Add(new City
        {
            Slug = "eindhoven",
            Names = new() { ["nl"] = "Eindhoven", ["en"] = "Eindhoven" }
        });
        await db.SaveChangesAsync();

        var controller = new CitiesController(db);
        var duplicate = new City
        {
            Slug = "eindhoven",
            Names = new() { ["nl"] = "Eindhoven 2", ["en"] = "Eindhoven 2" }
        };

        var result = await controller.Create(duplicate);
        Assert.IsType<ConflictObjectResult>(result);
    }
}
