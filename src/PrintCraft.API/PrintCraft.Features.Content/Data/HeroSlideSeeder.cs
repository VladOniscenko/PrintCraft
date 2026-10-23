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
            Title = "Your idea, 3D printed in days.",
            TitleNl = "Jouw idee, binnen enkele dagen 3D-geprint.",
            Subtext = "From a single replacement part for home to business series. Upload your file and get it delivered via PostNL in 2 to 5 business days.",
            SubtextNl = "Van één vervangend onderdeel voor thuis tot zakelijke series. Upload je bestand en ontvang het binnen 2 tot 5 werkdagen via PostNL.",
            PriceText = "3D Printing in Rotterdam & Across the Netherlands",
            PriceTextNl = "3D-printen in Rotterdam & heel Nederland",
            MediaUrl = "/uploads/hero/cable-holder.stl",
            MediaType = HeroMediaType.Model3d,
            InstructionTooltip = "Interactive 3D model: drag to rotate 360°, scroll to zoom in and inspect geometry.",
            InstructionTooltipNl = "Interactief 3D-model: sleep om 360° te draaien, scroll om in te zoomen op details.",
            Titles = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Your idea, 3D printed in days.",
                ["nl"] = "Jouw idee, binnen enkele dagen 3D-geprint.",
                ["tr"] = "Fikriniz, günler içinde 3D basılsın.",
                ["ru"] = "Ваша идея, напечатанная на 3D-принтере за считанные дни.",
                ["ar"] = "فكرتك، مطبوعة ثلاثية الأبعاد في أيام معدودة."
            },
            Subtexts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "From a single replacement part for home to business series. Upload your file and get it delivered via PostNL in 2 to 5 business days.",
                ["nl"] = "Van één vervangend onderdeel voor thuis tot zakelijke series. Upload je bestand en ontvang het binnen 2 tot 5 werkdagen via PostNL.",
                ["tr"] = "Ev için tek bir yedek parçadan kurumsal serilere kadar. Dosyanızı yükleyin ve PostNL ile 2 ila 5 iş günü içinde teslim alın.",
                ["ru"] = "От одной запасной детали для дома до коммерческих партий. Загрузите свой файл и получите доставку через PostNL за 2–5 рабочих дней.",
                ["ar"] = "من قطعة غيار منزلية واحدة إلى دفعات تجارية. ارفع ملفك واستلمه عبر PostNL خلال 2 إلى 5 أيام عمل."
            },
            PriceTexts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "3D Printing in Rotterdam & Across the Netherlands",
                ["nl"] = "3D-printen in Rotterdam & heel Nederland",
                ["tr"] = "Rotterdam ve Tüm Hollanda'da 3D Baskı",
                ["ru"] = "3D-печать в Роттердаме и по всем Нидерландам",
                ["ar"] = "طباعة ثلاثية الأبعاد في روتردام وجميع أنحاء هولندا"
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
            SortOrder = 1,
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        },
        new HeroSlide
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000102"),
            Title = "Extra strong in Black & White.",
            TitleNl = "Extra sterk in Zwart & Wit.",
            Subtext = "Need a part that can handle heat, outdoor weather, or heavy use? Our Black and White PETG is always in stock for fast, affordable production.",
            SubtextNl = "Een onderdeel nodig dat tegen hitte, buitenweer of een stootje kan? Onze zwarte en witte PETG is altijd op voorraad voor snelle levering.",
            PriceText = "Most Popular Choice",
            PriceTextNl = "Meest gekozen materiaal",
            MediaUrl = "/uploads/hero/dino.stl",
            MediaType = HeroMediaType.Model3d,
            InstructionTooltip = "High-durability PETG is UV-stable, weatherproof, and impact-resistant for demanding environments.",
            InstructionTooltipNl = "Duurzaam PETG is UV-bestendig, weerbestendig en slagvast voor veeleisende omgevingen.",
            Titles = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Extra strong in Black & White.",
                ["nl"] = "Extra sterk in Zwart & Wit.",
                ["tr"] = "Siyah ve Beyazda Ekstra Güçlü.",
                ["ru"] = "Особая прочность в черном и белом цвете.",
                ["ar"] = "قوة فائقة باللونين الأسود والأبيض."
            },
            Subtexts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Need a part that can handle heat, outdoor weather, or heavy use? Our Black and White PETG is always in stock for fast, affordable production.",
                ["nl"] = "Een onderdeel nodig dat tegen hitte, buitenweer of een stootje kan? Onze zwarte en witte PETG is altijd op voorraad voor snelle levering.",
                ["tr"] = "Isıya, dış hava koşullarına veya zorlu kullanıma dayanıklı bir parçaya mı ihtiyacınız var? Siyah ve Beyaz PETG malzememiz hızlı ve uygun maliyetli üretim için daima stokta.",
                ["ru"] = "Нужна деталь, устойчивая к нагреву, погодным условиям или нагрузкам? Наш черный и белый PETG всегда в наличии для быстрого и надежного производства.",
                ["ar"] = "هل تحتاج إلى قطعة تتحمل الحرارة، والطقس الخارجي، أو الاستخدام الشاق؟ خامة PETG باللونين الأسود والأبيض متوفرة دائماً في المخزون لإنتاج سريع وتكلفة مناسبة."
            },
            PriceTexts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Most Popular Choice",
                ["nl"] = "Meest gekozen materiaal",
                ["tr"] = "En Çok Tercih Edilen Malzeme",
                ["ru"] = "Самый популярный материал",
                ["ar"] = "الخامة الأكثر طلباً"
            },
            InstructionTooltips = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "High-durability PETG is UV-stable, weatherproof, and impact-resistant for demanding environments.",
                ["nl"] = "Duurzaam PETG is UV-bestendig, weerbestendig en slagvast voor veeleisende omgevingen.",
                ["tr"] = "Yüksek dayanımlı PETG zorlu ortamlar için UV ışınlarına, hava şartlarına ve darbelere dayanıklıdır.",
                ["ru"] = "Прочный PETG устойчив к ультрафиолету, атмосферным воздействиям и ударам в сложных условиях.",
                ["ar"] = "مادة PETG عالية المتانة مقاومة للأشعة فوق البنفسجية والطقس والصدمات في الظروف الصعبة."
            },
            IsActive = true,
            SortOrder = 2,
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        },
        new HeroSlide
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000103"),
            Title = "Turn your favorite photo into 3D art.",
            TitleNl = "Maak van je favoriete foto een 3D-kunstwerk.",
            Subtext = "Upload any picture and we print it layer by layer into a detailed, touchable relief painting.",
            SubtextNl = "Upload een foto en wij printen hem laag voor laag tot een tastbaar schilderij met diepte.",
            PriceText = "3D Photo Painting",
            PriceTextNl = "3D Foto Schilderij",
            MediaUrl = "/uploads/hero/snowflake.stl",
            MediaType = HeroMediaType.Model3d,
            InstructionTooltip = "Upload any photo in our configurator to preview layered optical relief and color blends.",
            InstructionTooltipNl = "Upload je foto in onze configurator voor een voorbeeld van optische reliëflagen en kleurovergangen.",
            Titles = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Turn your favorite photo into 3D art.",
                ["nl"] = "Maak van je favoriete foto een 3D-kunstwerk.",
                ["tr"] = "En sevdiğiniz fotoğrafı 3D sanata dönüştürün.",
                ["ru"] = "Превратите любимую фотографию в объемное 3D-искусство.",
                ["ar"] = "حوّل صورتك المفضلة إلى عمل فني ثلاثي الأبعاد."
            },
            Subtexts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Upload any picture and we print it layer by layer into a detailed, touchable relief painting.",
                ["nl"] = "Upload een foto en wij printen hem laag voor laag tot een tastbaar schilderij met diepte.",
                ["tr"] = "Herhangi bir fotoğrafı yükleyin, katman katman dokunulabilir ve detaylı bir kabartma tabloya dönüştürelim.",
                ["ru"] = "Загрузите любое изображение, и мы напечатаем его слой за слоем в виде осязаемой рельефной картины.",
                ["ar"] = "ارفع أي صورة وسنقوم بطباعتها طبقة تلو الأخرى إلى لوحة بارزة ملموسة ومليئة بالتفاصيل."
            },
            PriceTexts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "3D Photo Painting",
                ["nl"] = "3D Foto Schilderij",
                ["tr"] = "3D Fotoğraf Tablosu",
                ["ru"] = "3D-картины по фото",
                ["ar"] = "لوحات ثلاثية الأبعاد من الصور"
            },
            InstructionTooltips = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Upload any photo in our configurator to preview layered optical relief and color blends.",
                ["nl"] = "Upload je foto in onze configurator voor een voorbeeld van optische reliëflagen en kleurovergangen.",
                ["tr"] = "Katmanlı optik rölyef ve renk geçişlerini önizlemek için konfigüratörümüze herhangi bir fotoğraf yükleyin.",
                ["ru"] = "Загрузите фото в конфигуратор для предпросмотра оптических слоев рельефа и цветовых переходов.",
                ["ar"] = "ارفع أي صورة في أداتنا لمعاينة الطبقات البصرية البارزة وتدرجات الألوان."
            },
            IsActive = true,
            SortOrder = 3,
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
