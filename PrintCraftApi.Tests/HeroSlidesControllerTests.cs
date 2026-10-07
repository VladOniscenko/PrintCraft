using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Controllers;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using Xunit;

namespace PrintCraftApi.Tests;

public class HeroSlidesControllerTests
{
    private static PrintCraftDb CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<PrintCraftDb>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new PrintCraftDb(options);
    }

    [Fact]
    public async Task GetActive_ReturnsOnlyActiveSlidesSortedBySortOrder()
    {
        var dbName = Guid.NewGuid().ToString();
        await using (var db = CreateDbContext(dbName))
        {
            db.HeroSlides.AddRange(
                new HeroSlide
                {
                    Id = Guid.NewGuid(),
                    Title = "Slide 3",
                    MediaUrl = "/img3.png",
                    MediaType = "image",
                    SortOrder = 30,
                    IsActive = true
                },
                new HeroSlide
                {
                    Id = Guid.NewGuid(),
                    Title = "Inactive Slide",
                    MediaUrl = "/img-hidden.png",
                    MediaType = "image",
                    SortOrder = 5,
                    IsActive = false
                },
                new HeroSlide
                {
                    Id = Guid.NewGuid(),
                    Title = "Slide 1",
                    MediaUrl = "/model1.stl",
                    MediaType = "model3d",
                    SortOrder = 10,
                    IsActive = true
                },
                new HeroSlide
                {
                    Id = Guid.NewGuid(),
                    Title = "Slide 2",
                    MediaUrl = "/img2.png",
                    MediaType = "image",
                    SortOrder = 20,
                    IsActive = true
                }
            );
            await db.SaveChangesAsync();

            var controller = new HeroSlidesController(db);
            var actionResult = await controller.GetActive();

            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var list = Assert.IsAssignableFrom<List<HeroSlide>>(okResult.Value);

            Assert.Equal(3, list.Count);
            Assert.Equal("Slide 1", list[0].Title);
            Assert.Equal("Slide 2", list[1].Title);
            Assert.Equal("Slide 3", list[2].Title);
            Assert.All(list, s => Assert.True(s.IsActive));
        }
    }

    [Fact]
    public async Task GetAll_WithAllTrue_ReturnsAllSlidesIncludingInactive()
    {
        var dbName = Guid.NewGuid().ToString();
        await using (var db = CreateDbContext(dbName))
        {
            db.HeroSlides.AddRange(
                new HeroSlide
                {
                    Id = Guid.NewGuid(),
                    Title = "Active",
                    MediaUrl = "/active.png",
                    MediaType = "image",
                    SortOrder = 1,
                    IsActive = true
                },
                new HeroSlide
                {
                    Id = Guid.NewGuid(),
                    Title = "Draft",
                    MediaUrl = "/draft.png",
                    MediaType = "image",
                    SortOrder = 2,
                    IsActive = false
                }
            );
            await db.SaveChangesAsync();

            var controller = new HeroSlidesController(db);
            var actionResult = await controller.GetAll(activeOnly: null, all: true);

            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var list = Assert.IsAssignableFrom<List<HeroSlide>>(okResult.Value);

            Assert.Equal(2, list.Count);
        }
    }

    [Fact]
    public async Task GetById_ReturnsSlide_WhenFound()
    {
        var dbName = Guid.NewGuid().ToString();
        var slideId = Guid.NewGuid();
        await using (var db = CreateDbContext(dbName))
        {
            db.HeroSlides.Add(new HeroSlide
            {
                Id = slideId,
                Title = "Target Slide",
                MediaUrl = "/target.stl",
                MediaType = "model3d",
                PriceText = "€19.99",
                InstructionTooltip = "Rotate in 3D"
            });
            await db.SaveChangesAsync();

            var controller = new HeroSlidesController(db);
            var actionResult = await controller.GetById(slideId);

            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var slide = Assert.IsType<HeroSlide>(okResult.Value);
            Assert.Equal(slideId, slide.Id);
            Assert.Equal("Target Slide", slide.Title);
            Assert.Equal("model3d", slide.MediaType);
        }
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenDoesNotExist()
    {
        var dbName = Guid.NewGuid().ToString();
        await using (var db = CreateDbContext(dbName))
        {
            var controller = new HeroSlidesController(db);
            var actionResult = await controller.GetById(Guid.NewGuid());

            Assert.IsType<NotFoundObjectResult>(actionResult);
        }
    }

    [Fact]
    public async Task Create_ValidSlide_ReturnsCreatedAtAction()
    {
        var dbName = Guid.NewGuid().ToString();
        await using (var db = CreateDbContext(dbName))
        {
            var controller = new HeroSlidesController(db);
            var newSlide = new HeroSlide
            {
                Title = "New Product Showcase",
                Subtext = "Premium 3D printed gadgets",
                PriceText = "Starting at €15",
                MediaUrl = "/uploads/gadget.stl",
                MediaType = "model3d",
                InstructionTooltip = "Interactive preview",
                IsActive = true,
                SortOrder = 5
            };

            var actionResult = await controller.Create(newSlide);

            var createdResult = Assert.IsType<CreatedAtActionResult>(actionResult);
            var createdSlide = Assert.IsType<HeroSlide>(createdResult.Value);
            Assert.Equal("New Product Showcase", createdSlide.Title);
            Assert.Equal("model3d", createdSlide.MediaType);
            Assert.Equal(5, createdSlide.SortOrder);
            Assert.NotEqual(Guid.Empty, createdSlide.Id);

            var stored = await db.HeroSlides.FirstOrDefaultAsync(s => s.Id == createdSlide.Id);
            Assert.NotNull(stored);
            Assert.Equal("New Product Showcase", stored.Title);
        }
    }

    [Fact]
    public async Task Create_MissingTitleOrMediaUrl_ReturnsBadRequest()
    {
        var dbName = Guid.NewGuid().ToString();
        await using (var db = CreateDbContext(dbName))
        {
            var controller = new HeroSlidesController(db);

            var noTitleResult = await controller.Create(new HeroSlide
            {
                Title = "",
                MediaUrl = "/test.png"
            });
            Assert.IsType<BadRequestObjectResult>(noTitleResult);

            var noMediaResult = await controller.Create(new HeroSlide
            {
                Title = "Has Title",
                MediaUrl = "  "
            });
            Assert.IsType<BadRequestObjectResult>(noMediaResult);

            var invalidTypeResult = await controller.Create(new HeroSlide
            {
                Title = "Has Title",
                MediaUrl = "/test.png",
                MediaType = "video"
            });
            Assert.IsType<BadRequestObjectResult>(invalidTypeResult);
        }
    }

    [Fact]
    public async Task Update_ExistingSlide_UpdatesFieldsAndReturnsOk()
    {
        var dbName = Guid.NewGuid().ToString();
        var slideId = Guid.NewGuid();
        await using (var db = CreateDbContext(dbName))
        {
            db.HeroSlides.Add(new HeroSlide
            {
                Id = slideId,
                Title = "Old Title",
                Subtext = "Old Subtext",
                PriceText = "€5.00",
                MediaUrl = "/old.png",
                MediaType = "image",
                SortOrder = 1,
                IsActive = true
            });
            await db.SaveChangesAsync();

            var controller = new HeroSlidesController(db);
            var updateRequest = new HeroSlide
            {
                Title = "Updated Title",
                Subtext = "Updated Subtext",
                PriceText = "€12.50",
                MediaUrl = "/updated.stl",
                MediaType = "model3d",
                InstructionTooltip = "New tooltip",
                SortOrder = 10,
                IsActive = false
            };

            var actionResult = await controller.Update(slideId, updateRequest);

            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var updatedSlide = Assert.IsType<HeroSlide>(okResult.Value);
            Assert.Equal("Updated Title", updatedSlide.Title);
            Assert.Equal("model3d", updatedSlide.MediaType);
            Assert.Equal("€12.50", updatedSlide.PriceText);
            Assert.Equal(10, updatedSlide.SortOrder);
            Assert.False(updatedSlide.IsActive);

            var stored = await db.HeroSlides.FindAsync(slideId);
            Assert.NotNull(stored);
            Assert.Equal("Updated Title", stored.Title);
            Assert.False(stored.IsActive);
        }
    }

    [Fact]
    public async Task Delete_ExistingSlide_RemovesAndReturnsNoContent()
    {
        var dbName = Guid.NewGuid().ToString();
        var slideId = Guid.NewGuid();
        await using (var db = CreateDbContext(dbName))
        {
            db.HeroSlides.Add(new HeroSlide
            {
                Id = slideId,
                Title = "To Delete",
                MediaUrl = "/delete.png"
            });
            await db.SaveChangesAsync();

            var controller = new HeroSlidesController(db);
            var actionResult = await controller.Delete(slideId);

            Assert.IsType<NoContentResult>(actionResult);

            var remaining = await db.HeroSlides.FindAsync(slideId);
            Assert.Null(remaining);
        }
    }

    [Fact]
    public async Task CreateAndUpdate_PreservesMultilingualFields()
    {
        var dbName = Guid.NewGuid().ToString();
        await using (var db = CreateDbContext(dbName))
        {
            var controller = new HeroSlidesController(db);
            var newSlide = new HeroSlide
            {
                Title = "English Title",
                TitleNl = "Nederlandse Titel",
                Subtext = "English Subtext",
                SubtextNl = "Nederlandse Subtekst",
                PriceText = "From €10",
                PriceTextNl = "Vanaf €10",
                MediaUrl = "/img.png",
                MediaType = "image",
                InstructionTooltip = "English tooltip",
                InstructionTooltipNl = "Nederlandse tooltip",
                IsActive = true
            };

            var createRes = await controller.Create(newSlide);
            var created = Assert.IsType<HeroSlide>(Assert.IsType<CreatedAtActionResult>(createRes).Value);
            Assert.Equal("Nederlandse Titel", created.TitleNl);
            Assert.Equal("Nederlandse Subtekst", created.SubtextNl);
            Assert.Equal("Vanaf €10", created.PriceTextNl);
            Assert.Equal("Nederlandse tooltip", created.InstructionTooltipNl);

            created.TitleNl = "Aangepaste Titel";
            var updateRes = await controller.Update(created.Id, created);
            var updated = Assert.IsType<HeroSlide>(Assert.IsType<OkObjectResult>(updateRes).Value);
            Assert.Equal("Aangepaste Titel", updated.TitleNl);
        }
    }

    [Fact]
    public async Task SeedDefaults_SeedsMissingDefaultSlidesAndReturnsAll()
    {
        var dbName = Guid.NewGuid().ToString();
        await using (var db = CreateDbContext(dbName))
        {
            var controller = new HeroSlidesController(db);
            var res = await controller.SeedDefaults();
            var okResult = Assert.IsType<OkObjectResult>(res);
            var slides = Assert.IsAssignableFrom<List<HeroSlide>>(okResult.Value);

            Assert.Equal(3, slides.Count);
            Assert.Contains(slides, s => s.MediaUrl == "/uploads/hero/cable-holder.stl");
            Assert.Contains(slides, s => s.MediaUrl == "/uploads/hero/materials.svg");
            Assert.Contains(slides, s => s.MediaUrl == "/uploads/hero/dino.stl");
        }
    }

    [Fact]
    public void GetAvailableFiles_ReturnsOkWithFileList()
    {
        var dbName = Guid.NewGuid().ToString();
        using var db = CreateDbContext(dbName);
        var controller = new HeroSlidesController(db);
        var res = controller.GetAvailableFiles();
        Assert.IsType<OkObjectResult>(res);
    }
}

