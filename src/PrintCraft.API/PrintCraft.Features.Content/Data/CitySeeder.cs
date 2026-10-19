using Microsoft.EntityFrameworkCore;
using PrintCraft.Shared.Models;

namespace PrintCraft.Features.Content.Data;

public static class CitySeeder
{
    public static List<City> GetDefaultCities() => new()
    {
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000501"),
            Slug = "amsterdam",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Amsterdam", ["en"] = "Amsterdam", ["tr"] = "Amsterdam", ["ru"] = "Амстердам", ["ar"] = "أمستردام" },
            Province = "Noord-Holland",
            Latitude = 52.3676,
            Longitude = 4.9041,
            SortOrder = 1,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000502"),
            Slug = "rotterdam",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Rotterdam", ["en"] = "Rotterdam", ["tr"] = "Rotterdam", ["ru"] = "Роттердам", ["ar"] = "روتردام" },
            Province = "Zuid-Holland",
            Latitude = 51.9244,
            Longitude = 4.4777,
            SortOrder = 2,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000503"),
            Slug = "den-haag",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Den Haag", ["en"] = "The Hague", ["tr"] = "Lahey", ["ru"] = "Гаага", ["ar"] = "لاهاي" },
            Province = "Zuid-Holland",
            Latitude = 52.0705,
            Longitude = 4.3007,
            SortOrder = 3,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000504"),
            Slug = "utrecht",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Utrecht", ["en"] = "Utrecht", ["tr"] = "Utrecht", ["ru"] = "Утрехт", ["ar"] = "أوتريخت" },
            Province = "Utrecht",
            Latitude = 52.0907,
            Longitude = 5.1214,
            SortOrder = 4,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000505"),
            Slug = "eindhoven",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Eindhoven", ["en"] = "Eindhoven", ["tr"] = "Eindhoven", ["ru"] = "Эйндховен", ["ar"] = "أيندهوفن" },
            Province = "Noord-Brabant",
            Latitude = 51.4416,
            Longitude = 5.4697,
            SortOrder = 5,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000506"),
            Slug = "tilburg",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Tilburg", ["en"] = "Tilburg", ["tr"] = "Tilburg", ["ru"] = "Тилбург", ["ar"] = "تيلبورغ" },
            Province = "Noord-Brabant",
            Latitude = 51.5555,
            Longitude = 5.0913,
            SortOrder = 6,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000507"),
            Slug = "groningen",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Groningen", ["en"] = "Groningen", ["tr"] = "Groningen", ["ru"] = "Гронинген", ["ar"] = "خرونينغن" },
            Province = "Groningen",
            Latitude = 53.2194,
            Longitude = 6.5665,
            SortOrder = 7,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000508"),
            Slug = "almere",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Almere", ["en"] = "Almere", ["tr"] = "Almere", ["ru"] = "Алмере", ["ar"] = "ألميرا" },
            Province = "Flevoland",
            Latitude = 52.3508,
            Longitude = 5.2647,
            SortOrder = 8,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000509"),
            Slug = "breda",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Breda", ["en"] = "Breda", ["tr"] = "Breda", ["ru"] = "Бреда", ["ar"] = "بريدا" },
            Province = "Noord-Brabant",
            Latitude = 51.5719,
            Longitude = 4.7683,
            SortOrder = 9,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000510"),
            Slug = "nijmegen",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Nijmegen", ["en"] = "Nijmegen", ["tr"] = "Nijmegen", ["ru"] = "Неймеген", ["ar"] = "نايميخن" },
            Province = "Gelderland",
            Latitude = 51.8126,
            Longitude = 5.8372,
            SortOrder = 10,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000511"),
            Slug = "apeldoorn",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Apeldoorn", ["en"] = "Apeldoorn", ["tr"] = "Apeldoorn", ["ru"] = "Апелдорн", ["ar"] = "أبلدورن" },
            Province = "Gelderland",
            Latitude = 52.2112,
            Longitude = 5.9699,
            SortOrder = 11,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000512"),
            Slug = "haarlem",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Haarlem", ["en"] = "Haarlem", ["tr"] = "Haarlem", ["ru"] = "Харлем", ["ar"] = "هارلم" },
            Province = "Noord-Holland",
            Latitude = 52.3874,
            Longitude = 4.6462,
            SortOrder = 12,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000513"),
            Slug = "arnhem",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Arnhem", ["en"] = "Arnhem", ["tr"] = "Arnhem", ["ru"] = "Арнем", ["ar"] = "أرنهيم" },
            Province = "Gelderland",
            Latitude = 51.9851,
            Longitude = 5.8987,
            SortOrder = 13,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000514"),
            Slug = "enschede",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Enschede", ["en"] = "Enschede", ["tr"] = "Enschede", ["ru"] = "Энсхеде", ["ar"] = "أنسخديه" },
            Province = "Overijssel",
            Latitude = 52.2215,
            Longitude = 6.8937,
            SortOrder = 14,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000515"),
            Slug = "amersfoort",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Amersfoort", ["en"] = "Amersfoort", ["tr"] = "Amersfoort", ["ru"] = "Амерсфорт", ["ar"] = "أمرسفورت" },
            Province = "Utrecht",
            Latitude = 52.1561,
            Longitude = 5.3878,
            SortOrder = 15,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000516"),
            Slug = "zaanstad",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Zaanstad", ["en"] = "Zaanstad", ["tr"] = "Zaanstad", ["ru"] = "Занстад", ["ar"] = "زانستاد" },
            Province = "Noord-Holland",
            Latitude = 52.4420,
            Longitude = 4.8292,
            SortOrder = 16,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000517"),
            Slug = "s-hertogenbosch",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "'s-Hertogenbosch", ["en"] = "'s-Hertogenbosch", ["tr"] = "'s-Hertogenbosch", ["ru"] = "Хертогенбос", ["ar"] = "سيرتوخيمبوس" },
            Province = "Noord-Brabant",
            Latitude = 51.6978,
            Longitude = 5.3037,
            SortOrder = 17,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000518"),
            Slug = "haarlemmermeer",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Haarlemmermeer", ["en"] = "Haarlemmermeer", ["tr"] = "Haarlemmermeer", ["ru"] = "Харлеммермер", ["ar"] = "هارلمرمير" },
            Province = "Noord-Holland",
            Latitude = 52.3025,
            Longitude = 4.6889,
            SortOrder = 18,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000519"),
            Slug = "zwolle",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Zwolle", ["en"] = "Zwolle", ["tr"] = "Zwolle", ["ru"] = "Зволле", ["ar"] = "زوولا" },
            Province = "Overijssel",
            Latitude = 52.5168,
            Longitude = 6.0830,
            SortOrder = 19,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000520"),
            Slug = "zoetermeer",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Zoetermeer", ["en"] = "Zoetermeer", ["tr"] = "Zoetermeer", ["ru"] = "Зутермер", ["ar"] = "زوترمير" },
            Province = "Zuid-Holland",
            Latitude = 52.0607,
            Longitude = 4.4940,
            SortOrder = 20,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000521"),
            Slug = "leiden",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Leiden", ["en"] = "Leiden", ["tr"] = "Leiden", ["ru"] = "Лейден", ["ar"] = "لايدن" },
            Province = "Zuid-Holland",
            Latitude = 52.1601,
            Longitude = 4.4970,
            SortOrder = 21,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000522"),
            Slug = "leeuwarden",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Leeuwarden", ["en"] = "Leeuwarden", ["tr"] = "Leeuwarden", ["ru"] = "Леуварден", ["ar"] = "ليوواردن" },
            Province = "Friesland",
            Latitude = 53.2012,
            Longitude = 5.7999,
            SortOrder = 22,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000523"),
            Slug = "dordrecht",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Dordrecht", ["en"] = "Dordrecht", ["tr"] = "Dordrecht", ["ru"] = "Дордрехт", ["ar"] = "دوردريخت" },
            Province = "Zuid-Holland",
            Latitude = 51.8133,
            Longitude = 4.6901,
            SortOrder = 23,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000524"),
            Slug = "maastricht",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Maastricht", ["en"] = "Maastricht", ["tr"] = "Maastricht", ["ru"] = "Маастрихт", ["ar"] = "ماستريخت" },
            Province = "Limburg",
            Latitude = 50.8514,
            Longitude = 5.6910,
            SortOrder = 24,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000525"),
            Slug = "ede",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Ede", ["en"] = "Ede", ["tr"] = "Ede", ["ru"] = "Эде", ["ar"] = "إيدي" },
            Province = "Gelderland",
            Latitude = 52.0442,
            Longitude = 5.6661,
            SortOrder = 25,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000526"),
            Slug = "delft",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Delft", ["en"] = "Delft", ["tr"] = "Delft", ["ru"] = "Делфт", ["ar"] = "دلفت" },
            Province = "Zuid-Holland",
            Latitude = 52.0116,
            Longitude = 4.3571,
            SortOrder = 26,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000527"),
            Slug = "deventer",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Deventer", ["en"] = "Deventer", ["tr"] = "Deventer", ["ru"] = "Девентер", ["ar"] = "ديفينتر" },
            Province = "Overijssel",
            Latitude = 52.2550,
            Longitude = 6.1625,
            SortOrder = 27,
            IsActive = true
        },
        new City
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000528"),
            Slug = "alkmaar",
            Names = new(StringComparer.OrdinalIgnoreCase) { ["nl"] = "Alkmaar", ["en"] = "Alkmaar", ["tr"] = "Alkmaar", ["ru"] = "Алкмар", ["ar"] = "ألكمار" },
            Province = "Noord-Holland",
            Latitude = 52.6324,
            Longitude = 4.7534,
            SortOrder = 28,
            IsActive = true
        }
    };

    public static async Task<SeederResult> EnsureDatabaseSeededAsync(PrintCraftDb db, bool forceReload = false)
    {
        var defaults = GetDefaultCities();
        var existing = await db.Cities.ToListAsync();
        var result = new SeederResult { TotalBefore = existing.Count };

        if (existing.Count == 0)
        {
            await db.Cities.AddRangeAsync(defaults);
            await db.SaveChangesAsync();
            result.Inserted = defaults.Count;
            result.TotalAfter = defaults.Count;
            return result;
        }

        foreach (var def in defaults)
        {
            var match = existing.FirstOrDefault(c => c.Id == def.Id)
                        ?? existing.FirstOrDefault(c => string.Equals(c.Slug, def.Slug, StringComparison.OrdinalIgnoreCase));

            if (match == null)
            {
                await db.Cities.AddAsync(def);
                result.Inserted++;
            }
            else if (forceReload)
            {
                match.Slug = def.Slug;
                match.Names = def.Names;
                match.Province = def.Province;
                match.Latitude = def.Latitude;
                match.Longitude = def.Longitude;
                match.SortOrder = def.SortOrder;
                match.IsActive = def.IsActive;
                match.UpdatedAt = DateTime.UtcNow;
                db.Entry(match).State = EntityState.Modified;
                result.Updated++;
            }
        }

        if (result.Inserted > 0 || result.Updated > 0)
        {
            await db.SaveChangesAsync();
        }

        result.TotalAfter = await db.Cities.CountAsync();
        return result;
    }
}
