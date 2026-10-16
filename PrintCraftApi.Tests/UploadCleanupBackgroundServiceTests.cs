using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using PrintCraftApi.Services;
using Xunit;

namespace PrintCraftApi.Tests;

public class UploadCleanupBackgroundServiceTests : IDisposable
{
    private readonly string _testUploadsDir;

    public UploadCleanupBackgroundServiceTests()
    {
        _testUploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(_testUploadsDir);
    }

    public void Dispose()
    {
        try
        {
            if (Directory.Exists(_testUploadsDir))
            {
                var files = Directory.GetFiles(_testUploadsDir, "test_*");
                foreach (var f in files)
                {
                    try { File.Delete(f); } catch { }
                }
            }
        }
        catch { }
    }

    private static (IServiceProvider, PrintCraftDb) SetupServices(string dbName)
    {
        var services = new ServiceCollection();
        services.AddDbContext<PrintCraftDb>(opt => opt.UseInMemoryDatabase(dbName));
        var sp = services.BuildServiceProvider();
        var db = sp.GetRequiredService<PrintCraftDb>();
        return (sp, db);
    }

    [Fact]
    public async Task RunCleanupPass_DeletesUnlinkedFilesOlderThanTtl()
    {
        var (sp, db) = SetupServices(Guid.NewGuid().ToString());
        var inMemoryConfig = new Dictionary<string, string?>
        {
            ["UploadCleanup:Enabled"] = "true",
            ["UploadCleanup:IntervalHours"] = "4",
            ["UploadCleanup:TtlHours"] = "24"
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();
        var service = new UploadCleanupBackgroundService(sp, NullLogger<UploadCleanupBackgroundService>.Instance, config);

        var oldGlbPath = Path.Combine(_testUploadsDir, "test_orphan_old.glb");
        var oldStlPath = Path.Combine(_testUploadsDir, "test_orphan_old.stl");
        var freshGlbPath = Path.Combine(_testUploadsDir, "test_orphan_fresh.glb");

        await File.WriteAllTextAsync(oldGlbPath, "dummy-glb-content");
        await File.WriteAllTextAsync(oldStlPath, "dummy-stl-content");
        await File.WriteAllTextAsync(freshGlbPath, "dummy-glb-content");

        // Backdate the old files to 30 hours ago
        File.SetLastWriteTimeUtc(oldGlbPath, DateTime.UtcNow.AddHours(-30));
        File.SetLastWriteTimeUtc(oldStlPath, DateTime.UtcNow.AddHours(-30));
        // Keep fresh file at current time
        File.SetLastWriteTimeUtc(freshGlbPath, DateTime.UtcNow);

        var deleted = await service.RunCleanupPassAsync(24.0, CancellationToken.None);

        Assert.True(deleted >= 2);
        Assert.False(File.Exists(oldGlbPath));
        Assert.False(File.Exists(oldStlPath));
        Assert.True(File.Exists(freshGlbPath));

        // Clean up fresh file
        File.Delete(freshGlbPath);
    }

    [Fact]
    public async Task RunCleanupPass_PreservesFilesLinkedToConfirmedOrPaidOrders()
    {
        var (sp, db) = SetupServices(Guid.NewGuid().ToString());
        var inMemoryConfig = new Dictionary<string, string?>
        {
            ["UploadCleanup:Enabled"] = "true",
            ["UploadCleanup:TtlHours"] = "24"
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();
        var service = new UploadCleanupBackgroundService(sp, NullLogger<UploadCleanupBackgroundService>.Instance, config);

        var paidModelName = "test_paid_order_model.stl";
        var paidModelPath = Path.Combine(_testUploadsDir, paidModelName);
        await File.WriteAllTextAsync(paidModelPath, "stl-content-paid");
        File.SetLastWriteTimeUtc(paidModelPath, DateTime.UtcNow.AddHours(-48)); // 48h old

        // Add confirmed paid order referencing this model
        var order = new Order
        {
            Id = Guid.NewGuid(),
            FullName = "Jan Jansen",
            AddressLine1 = "Kalverstraat 1",
            City = "Amsterdam",
            PostalCode = "1012 NX",
            PhoneNumber = "0612345678",
            IsPaid = true,
            Status = "ready_to_print",
            Items = new List<OrderItem>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    FileUrl = $"/uploads/{paidModelName}",
                    fileName = paidModelName
                }
            }
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        await service.RunCleanupPassAsync(24.0, CancellationToken.None);

        // Protected because order is paid and confirmed!
        Assert.True(File.Exists(paidModelPath));

        File.Delete(paidModelPath);
    }

    [Fact]
    public async Task RunCleanupPass_PreservesHeroSlideModels()
    {
        var (sp, db) = SetupServices(Guid.NewGuid().ToString());
        var inMemoryConfig = new Dictionary<string, string?>
        {
            ["UploadCleanup:Enabled"] = "true",
            ["UploadCleanup:TtlHours"] = "24"
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();
        var service = new UploadCleanupBackgroundService(sp, NullLogger<UploadCleanupBackgroundService>.Instance, config);

        var heroModelName = "test_hero_model.stl";
        var heroModelPath = Path.Combine(_testUploadsDir, heroModelName);
        await File.WriteAllTextAsync(heroModelPath, "hero-stl-content");
        File.SetLastWriteTimeUtc(heroModelPath, DateTime.UtcNow.AddHours(-72)); // 72h old

        db.HeroSlides.Add(new HeroSlide
        {
            Title = "Promotional Print",
            MediaUrl = $"/uploads/{heroModelName}",
            MediaType = HeroMediaType.Model3d
        });
        await db.SaveChangesAsync();

        await service.RunCleanupPassAsync(24.0, CancellationToken.None);

        // Protected because hero slide references it!
        Assert.True(File.Exists(heroModelPath));

        File.Delete(heroModelPath);
    }

    [Fact]
    public async Task RunCleanupPass_DeletesCompanionMetadataAndConfigsForTempDrafts()
    {
        var (sp, db) = SetupServices(Guid.NewGuid().ToString());
        var inMemoryConfig = new Dictionary<string, string?>
        {
            ["UploadCleanup:Enabled"] = "true",
            ["UploadCleanup:TtlHours"] = "24"
        };
        var config = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();
        var service = new UploadCleanupBackgroundService(sp, NullLogger<UploadCleanupBackgroundService>.Instance, config);

        var tempBase = "temp_testvis_testslot";
        var glbPath = Path.Combine(_testUploadsDir, $"{tempBase}.glb");
        var stlPath = Path.Combine(_testUploadsDir, $"{tempBase}.stl");
        var configPath = Path.Combine(_testUploadsDir, $"{tempBase}.config.json");
        var metaPath = Path.Combine(_testUploadsDir, $"{tempBase}.glb.upload-meta.json");

        await File.WriteAllTextAsync(glbPath, "glb");
        await File.WriteAllTextAsync(stlPath, "stl");
        await File.WriteAllTextAsync(configPath, "{}");
        await File.WriteAllTextAsync(metaPath, "{}");

        File.SetLastWriteTimeUtc(glbPath, DateTime.UtcNow.AddHours(-30));
        File.SetLastWriteTimeUtc(stlPath, DateTime.UtcNow.AddHours(-30));
        File.SetLastWriteTimeUtc(configPath, DateTime.UtcNow.AddHours(-30));
        File.SetLastWriteTimeUtc(metaPath, DateTime.UtcNow.AddHours(-30));

        await service.RunCleanupPassAsync(24.0, CancellationToken.None);

        Assert.False(File.Exists(glbPath));
        Assert.False(File.Exists(stlPath));
        Assert.False(File.Exists(configPath));
        Assert.False(File.Exists(metaPath));
    }
}

