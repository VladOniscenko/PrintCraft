using Microsoft.EntityFrameworkCore;
using PrintCraft.Shared.Models;

namespace PrintCraft.Features.Content.Data;

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
            Titles = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "50% Off Black & White PETG Prints",
                ["nl"] = "50% Korting op Zwart & Wit PETG Prints",
                ["tr"] = "Siyah ve Beyaz PETG Baskılarda %50 İndirim",
                ["ru"] = "Скидка 50% на печать из черного и белого PETG",
                ["ar"] = "خصم 50% على طباعة PETG باللونين الأسود والأبيض"
            },
            Subtexts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Special promotion: Get an automatic 50% discount on all custom 3D prints ordered in high-durability Black or White PETG. UV-resistant, impact-proof, and heat tolerant.",
                ["nl"] = "Speciale actie: Profiteer van 50% korting op alle 3D-prints in oersterk zwart of wit PETG. Weerbestendig, slagvast en hittebestendig.",
                ["tr"] = "Özel promosyon: Yüksek dayanımlı Siyah veya Beyaz PETG ile sipariş edilen tüm özel 3D baskılarda otomatik %50 indirim. UV ışınlarına, darbelere ve ısıya dayanıklıdır.",
                ["ru"] = "Специальная акция: автоматическая скидка 50% на все индивидуальные 3D-отпечатки из прочного черного или белого PETG. Устойчив к УФ, ударам и перепадам температур.",
                ["ar"] = "عرض خاص: احصل على خصم تلقائي بنسبة 50% على جميع المطبوعات ثلاثية الأبعاد المصنوعة من خيوط PETG المتينة باللونين الأسود أو الأبيض. مقاوم للأشعة فوق البنفسجية والصدمات والحرارة."
            },
            PriceTexts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "50% Off Black & White PETG",
                ["nl"] = "50% Korting op PETG",
                ["tr"] = "PETG'de %50 İndirim",
                ["ru"] = "Скидка 50% на PETG",
                ["ar"] = "خصم 50% على PETG"
            },
            InstructionTooltips = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "50% discount applies automatically to all functional prints in Black or White PETG.",
                ["nl"] = "50% korting wordt automatisch verrekend bij selectie van zwart of wit PETG.",
                ["tr"] = "Siyah veya Beyaz PETG'deki tüm fonksiyonel baskılara %50 indirim otomatik olarak uygulanır.",
                ["ru"] = "Скидка 50% автоматически применяется ко всем функциональным деталям из черного или белого PETG.",
                ["ar"] = "ينطبق خصم 50% تلقائيًا على جميع المطبوعات الوظيفية باللونين الأسود أو الأبيض من خامة PETG."
            },
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
            Titles = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "HueForge Filament Painting: Turn Pictures into 3D Art",
                ["nl"] = "HueForge Filament Painting: Maak van je Foto 3D Kunst",
                ["tr"] = "HueForge Filament Tablosu: Resimleri 3D Sanata Dönüştürün",
                ["ru"] = "HueForge Filament Painting: превратите картины в 3D-арт",
                ["ar"] = "لوحات خيوط HueForge: حوّل صورك إلى فن ثلاثي الأبعاد"
            },
            Subtexts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Upload any photo or illustration to transform it into a vibrant, multi-color 3D relief print using optical layer blending. No painting required!",
                ["nl"] = "Upload een 2D foto of illustratie en verander deze in een tactiel, meerkleurig 3D reliëf schilderij met optische laagmenging.",
                ["tr"] = "Optik katman harmanlama kullanarak herhangi bir fotoğrafı veya çizimi canlı, çok renkli bir 3D kabartma baskıya dönüştürün. Boyama gerekmez!",
                ["ru"] = "Загрузите любую фотографию или иллюстрацию, чтобы превратить ее в яркую многоцветную 3D-рельефную картину с помощью оптического смешивания слоев.",
                ["ar"] = "ارفع أي صورة أو رسم توضيحي لتحويله إلى لوحة بارزة ثلاثية الأبعاد متعددة الألوان باستخدام مزج الطبقات البصري. بدون الحاجة إلى طلاء يدوي!"
            },
            PriceTexts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "From €14.95 / Painting",
                ["nl"] = "Vanaf €14,95 / Schilderij",
                ["tr"] = "Tablo Başına €14,95'ten Başlayan Fiyatlarla",
                ["ru"] = "От €14.95 / картина",
                ["ar"] = "ابتداءً من €14.95 / لوحة"
            },
            InstructionTooltips = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Drop any picture in our configurator for an instant 3D relief preview with color swaps.",
                ["nl"] = "Sleep je afbeelding in onze configurator voor een directe full-color 3D reliëf weergave.",
                ["tr"] = "Renk geçişleriyle anında 3D rölyef önizlemesi için herhangi bir resmi konfigüratörümüze bırakın.",
                ["ru"] = "Перетащите изображение в конфигуратор для мгновенного предпросмотра 3D-рельефа со сменой цветов.",
                ["ar"] = "قم بسحب أي صورة إلى أداتنا للحصول على معاينة فورية للوحة البارزة ثلاثية الأبعاد."
            },
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
            Titles = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Rapid Prototyping & Custom Parts",
                ["nl"] = "Snelle Prototyping & Maatwerk Onderdelen",
                ["tr"] = "Hızlı Prototipleme ve Özel Parçalar",
                ["ru"] = "Быстрое прототипирование и детали на заказ",
                ["ar"] = "النماذج الأولية السريعة وقطع الغيار المخصصة"
            },
            Subtexts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "High-precision FDM 3D printing for functional prototypes, replacement parts, and custom enclosures in 2-5 working days.",
                ["nl"] = "Precisie FDM 3D-printen voor functionele prototypes, vervangende onderdelen en behuizingen binnen 2-5 werkdagen.",
                ["tr"] = "Fonksiyonel prototipler, yedek parçalar ve özel muhafazalar için 2-5 iş günü içinde yüksek hassasiyetli FDM 3D baskı.",
                ["ru"] = "Высокоточная FDM 3D-печать для функциональных прототипов, запасных частей и корпусов за 2–5 рабочих дней.",
                ["ar"] = "طباعة ثلاثية الأبعاد عالية الدقة بتقنية FDM للنماذج الأولية الوظيفية وقطع الغيار والحافظات المخصصة خلال 2-5 أيام عمل."
            },
            PriceTexts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Starting from €9.95",
                ["nl"] = "Vanaf €9,95",
                ["tr"] = "€9,95'ten Başlayan Fiyatlarla",
                ["ru"] = "От €9.95",
                ["ar"] = "ابتداءً من €9.95"
            },
            InstructionTooltips = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Interactive 3D model: drag to rotate 360°, scroll to zoom in and inspect geometry.",
                ["nl"] = "Interactief 3D-model: sleep om 360° te draaien, scroll om in te zoomen op details.",
                ["tr"] = "Etkileşimli 3D model: 360° döndürmek için sürükleyin, yakınlaştırmak ve geometriyi incelemek için kaydırın.",
                ["ru"] = "Интерактивная 3D-модель: перетаскивайте для поворота на 360°, масштабируйте для осмотра геометрии.",
                ["ar"] = "نموذج تفاعلي ثلاثي الأبعاد: اسحب للتدوير بزاوية 360 درجة، ومرر للتكبير وفحص التفاصيل."
            },
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
            Titles = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Detailed Figurines & Art Collectibles",
                ["nl"] = "Gedetailleerde Figuren & Kunstobjecten",
                ["tr"] = "Ayrıntılı Figürler ve Sanat Koleksiyonları",
                ["ru"] = "Детализированные фигурки и арт-коллекции",
                ["ar"] = "مجسمات مفصلة ومقتنيات فنية"
            },
            Subtexts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Ultra-fine 0.12mm layer height reproducing intricate curves, character meshes, and miniatures with silky smoothness.",
                ["nl"] = "Fijne 0.12mm laaghoogte voor vloeiende rondingen, miniaturen en artistieke modellen met hoge precisie.",
                ["tr"] = "Karmaşık kıvrımları, karakter ağlarını ve minyatürleri ipeksi bir pürüzsüzlükle yeniden üreten ultra ince 0,12 mm katman yüksekliği.",
                ["ru"] = "Сверхтонкая высота слоя 0,12 мм для точного воспроизведения сложных изгибов, персонажей и миниатюр с шелковистой гладкостью.",
                ["ar"] = "ارتفاع طبقة فائق الدقة يبلغ 0.12 مم يعيد إنتاج المنحنيات المعقدة ونماذج الشخصيات والمجسمات الصغيرة بنعومة وسلاسة."
            },
            PriceTexts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Starting at €14.50",
                ["nl"] = "Vanaf €14,50",
                ["tr"] = "€14,50'den Başlayan Fiyatlarla",
                ["ru"] = "От €14.50",
                ["ar"] = "ابتداءً من €14.50"
            },
            InstructionTooltips = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Rotate the model to check fine organic curves and surface layer fidelity.",
                ["nl"] = "Draai het model om organische vormen en oppervlaktekwaliteit te inspecteren.",
                ["tr"] = "İnce organik kıvrımları ve yüzey katmanı kalitesini kontrol etmek için modeli döndürün.",
                ["ru"] = "Вращайте модель, чтобы проверить тонкие органические линии и качество слоев.",
                ["ar"] = "قم بتدوير النموذج للتحقق من المنحنيات الدقيقة ودقة طبقات السطح."
            },
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
            candidateSourceDirs.Add(Path.Combine(contentRootPath, "..", "..", "PrintCraft.Frontend", "public", "uploads", "hero"));
            candidateSourceDirs.Add(Path.Combine(contentRootPath, "..", "..", "PrintCraft.Frontend", "public", "uploads"));
            candidateSourceDirs.Add(Path.Combine(contentRootPath, "..", "..", "PrintCraft.Frontend", "src", "assets", "hero-models"));
            candidateSourceDirs.Add(Path.Combine(contentRootPath, "..", "PrintCraft.Frontend", "public", "uploads", "hero"));
            candidateSourceDirs.Add(Path.Combine(contentRootPath, "..", "PrintCraft.Frontend", "public", "uploads"));
            candidateSourceDirs.Add(Path.Combine(contentRootPath, "..", "PrintCraft.Frontend", "src", "assets", "hero-models"));
            candidateSourceDirs.Add(Path.Combine(contentRootPath, "..", "frontend", "public", "uploads", "hero"));
            candidateSourceDirs.Add(Path.Combine(contentRootPath, "..", "frontend", "public", "uploads"));
            candidateSourceDirs.Add(Path.Combine(contentRootPath, "..", "frontend", "src", "assets", "hero-models"));
        }
        candidateSourceDirs.Add(Path.Combine(Directory.GetCurrentDirectory(), "SeedAssets", "hero"));
        candidateSourceDirs.Add(Path.Combine(Directory.GetCurrentDirectory(), "SeedAssets"));
        candidateSourceDirs.Add(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "hero"));
        candidateSourceDirs.Add(Path.Combine(Directory.GetCurrentDirectory(), "src", "PrintCraft.Frontend", "public", "uploads", "hero"));
        candidateSourceDirs.Add(Path.Combine(Directory.GetCurrentDirectory(), "src", "PrintCraft.Frontend", "src", "assets", "hero-models"));
        candidateSourceDirs.Add(Path.Combine(Directory.GetCurrentDirectory(), "..", "PrintCraft.Frontend", "public", "uploads", "hero"));
        candidateSourceDirs.Add(Path.Combine(Directory.GetCurrentDirectory(), "..", "PrintCraft.Frontend", "src", "assets", "hero-models"));
        candidateSourceDirs.Add(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "src", "PrintCraft.Frontend", "public", "uploads", "hero"));
        candidateSourceDirs.Add(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "src", "PrintCraft.Frontend", "src", "assets", "hero-models"));

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

            var targetHeroPath = Path.Combine(heroDir, fileName);
            if (!File.Exists(targetHeroPath) || new FileInfo(targetHeroPath).Length == 0)
            {
                try
                {
                    File.Copy(validSource, targetHeroPath, true);
                }
                catch { }
            }

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

    public static async Task<SeederResult> EnsureDatabaseSeededAsync(PrintCraftDb db, bool forceReload = false)
    {
        var defaults = GetDefaultSlides();
        List<HeroSlide> existingSlides;
        try
        {
            existingSlides = await db.HeroSlides.ToListAsync();
        }
        catch
        {
            existingSlides = new List<HeroSlide>();
        }

        var result = new SeederResult { TotalBefore = existingSlides.Count };

        if (existingSlides.Count == 0)
        {
            try
            {
                await db.HeroSlides.AddRangeAsync(defaults);
                await db.SaveChangesAsync();
                result.Inserted = defaults.Count;
                result.TotalAfter = defaults.Count;
                return result;
            }
            catch
            {
                // Fall through to per-slide insert/merge
            }
        }

        foreach (var def in defaults)
        {
            var match = existingSlides.FirstOrDefault(s => s.Id == def.Id)
                        ?? existingSlides.FirstOrDefault(s => s.Title == def.Title);

            if (match == null)
            {
                try
                {
                    await db.HeroSlides.AddAsync(def);
                    result.Inserted++;
                }
                catch { }
            }
            else
            {
                bool modified = false;

                // Ensure multilingual dictionaries are initialized
                match.Titles ??= new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                match.Subtexts ??= new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                match.PriceTexts ??= new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                match.InstructionTooltips ??= new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

                // Merge any missing language keys from default into existing slide
                foreach (var (k, v) in def.Titles)
                {
                    if (forceReload || !match.Titles.ContainsKey(k) || string.IsNullOrWhiteSpace(match.Titles[k]))
                    {
                        match.Titles[k] = v;
                        modified = true;
                    }
                }
                foreach (var (k, v) in def.Subtexts)
                {
                    if (forceReload || !match.Subtexts.ContainsKey(k) || string.IsNullOrWhiteSpace(match.Subtexts[k]))
                    {
                        match.Subtexts[k] = v;
                        modified = true;
                    }
                }
                foreach (var (k, v) in def.PriceTexts)
                {
                    if (forceReload || !match.PriceTexts.ContainsKey(k) || string.IsNullOrWhiteSpace(match.PriceTexts[k]))
                    {
                        match.PriceTexts[k] = v;
                        modified = true;
                    }
                }
                foreach (var (k, v) in def.InstructionTooltips)
                {
                    if (forceReload || !match.InstructionTooltips.ContainsKey(k) || string.IsNullOrWhiteSpace(match.InstructionTooltips[k]))
                    {
                        match.InstructionTooltips[k] = v;
                        modified = true;
                    }
                }

                if (forceReload)
                {
                    match.Title = def.Title;
                    match.TitleNl = def.TitleNl;
                    match.Subtext = def.Subtext;
                    match.SubtextNl = def.SubtextNl;
                    match.PriceText = def.PriceText;
                    match.PriceTextNl = def.PriceTextNl;
                    match.MediaUrl = def.MediaUrl;
                    match.MediaType = def.MediaType;
                    match.InstructionTooltip = def.InstructionTooltip;
                    match.InstructionTooltipNl = def.InstructionTooltipNl;
                    match.SortOrder = def.SortOrder;
                    match.IsActive = def.IsActive;
                    modified = true;
                }

                if (modified)
                {
                    match.UpdatedAt = DateTime.UtcNow;
                    result.Updated++;
                }
            }
        }

        try
        {
            if (result.Inserted > 0 || result.Updated > 0)
            {
                await db.SaveChangesAsync();
            }
            result.TotalAfter = await db.HeroSlides.CountAsync();
        }
        catch
        {
            result.TotalAfter = result.TotalBefore + result.Inserted;
        }

        return result;
    }
}
