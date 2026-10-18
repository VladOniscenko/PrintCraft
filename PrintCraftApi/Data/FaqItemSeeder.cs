using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Models;

namespace PrintCraftApi.Data;

public static class FaqItemSeeder
{
    public static List<FaqItem> GetDefaultFaqItems() => new()
    {
        new FaqItem
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000301"),
            Question = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Welke bestandsformaten worden ondersteund?",
                ["en"] = "What type of 3D files do you accept?"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "We accepteren de meest gangbare 3D-bestanden: .STL, .OBJ en .3MF. Daarnaast ondersteunen we ook STEP- en STP-assemblages. Als je een ander bestandstype hebt vanuit je CAD-software, kun je meestal exporteren naar .STL of .STEP.",
                ["en"] = "We accept the most common 3D files: .STL, .OBJ, and .3MF. We also support STEP and STP CAD assemblies. If you have a different file type from your design software, you can usually use Export or Save As to convert it."
            },
            Category = "files",
            SortOrder = 1,
            IsActive = true
        },
        new FaqItem
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000302"),
            Question = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Hoe wordt de offerte berekend?",
                ["en"] = "How is a custom 3D print quote calculated?"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "De offerte wordt transparant berekend op basis van de exacte afmetingen, het benodigde filamentvolume in grammen en het gekozen materiaal (zoals PLA, PETG of TPU). Upload je bestand voor een directe berekening.",
                ["en"] = "Quotes are calculated based on model dimensions, infill percentage, and chosen material. Upload your file in our configurator for an instant, transparent quote."
            },
            Category = "pricing",
            SortOrder = 2,
            IsActive = true
        },
        new FaqItem
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000303"),
            Question = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Hoe snel kan ik mijn 3D print verwachten?",
                ["en"] = "How long will it take to get my item?"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "De meeste orders worden binnen 2 tot 5 werkdagen geprint en verzonden via PostNL met track & trace door heel Nederland en België.",
                ["en"] = "Usually we print and ship within 2 to 5 business days using tracked PostNL delivery across the Netherlands and Belgium."
            },
            Category = "shipping",
            SortOrder = 3,
            IsActive = true
        },
        new FaqItem
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000304"),
            Question = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Ik heb een idee maar geen 3D-bestand. Kunnen jullie helpen?",
                ["en"] = "I have an idea but no 3D file. Can you help?"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Zeker! Stuur duidelijke foto's of schetsen met afmetingen naar ons en we kunnen helpen met 3D-modellering of reverse engineering.",
                ["en"] = "Yes. Share sketches, photos, or reference dimensions and we can help model (reverse engineer) a 3D printable file."
            },
            Category = "services",
            SortOrder = 4,
            IsActive = true
        },
        new FaqItem
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000305"),
            Question = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Zijn geprinte onderdelen voedselveilig?",
                ["en"] = "Are printed parts food-safe?"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Standaard 3D-prints hebben microscopische laaglijnen waarin bacteriën zich kunnen nestelen. Direct contact met onverpakt voedsel wordt afgeraden, tenzij behandeld met een voedselveilige epoxy coating.",
                ["en"] = "Standard printed plastics are usually not recommended for direct food contact due to microscopic layer lines. Food-safe epoxy finishing can be applied when necessary."
            },
            Category = "materials",
            SortOrder = 5,
            IsActive = true
        },
        new FaqItem
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000306"),
            Question = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Wat gebeurt er als mijn print beschadigd aankomt?",
                ["en"] = "What if my print arrives damaged?"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Mocht je pakket tijdens transport beschadigd raken, stuur ons binnen 3 dagen foto's van de verpakking en het printmodel. Wij printen en verzenden kosteloos een vervangend exemplaar.",
                ["en"] = "If your item arrives damaged in transit, send a photo within 3 days and we will reprint and reship it at no extra charge."
            },
            Category = "orders",
            SortOrder = 6,
            IsActive = true
        },
        new FaqItem
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000307"),
            Question = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Kan ik STEP-, STP- of CAD-bestanden uploaden?",
                ["en"] = "Can I upload and print STEP, CAD, or Fusion 360 files?"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Ja, absoluut! Naast STL en 3MF ondersteunen we STEP- en STP-bestanden uit SolidWorks, Autodesk Fusion 360 of Inventor voor maximale tolerantie-nauwkeurigheid.",
                ["en"] = "Yes, absolutely! Along with STL, OBJ, and 3MF files, we accept STEP, STP, and CAD exports from software like Autodesk Fusion 360 or SolidWorks with up to ±0.1mm tolerance."
            },
            Category = "files",
            SortOrder = 7,
            IsActive = true
        },
        new FaqItem
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000308"),
            Question = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Hoe wordt de offerte voor een reserveonderdeel berekend?",
                ["en"] = "How is the quote for 3D printing a replacement part calculated?"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Het reproduceren van reserveonderdelen of kapotte plastic onderdelen wordt berekend op basis van geometrie, gekozen materiaal (zoals slijtvast PETG of flexibel TPU) en productietijd.",
                ["en"] = "Reproducing broken plastic parts or discontinued replacement components is calculated based on geometry, required material, and production time."
            },
            Category = "pricing",
            SortOrder = 8,
            IsActive = true
        },
        new FaqItem
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000309"),
            Question = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Kunnen jullie op maat gemaakte elektronica-behuizingen printen?",
                ["en"] = "Can you print custom electronics enclosures, PCB cases, and mounts?"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Ja! We zijn gespecialiseerd in PCB casings, sensor mounts en DIN-rail behuizingen in vlamvertragend of hittebestendig PETG inclusief optionele messing schroefdraad (threaded inserts).",
                ["en"] = "Yes! We specialize in custom electronics enclosures, PCB cases, sensor mounts, and mounting brackets in heat-resistant PETG with brass heat-set inserts."
            },
            Category = "services",
            SortOrder = 9,
            IsActive = true
        },
        new FaqItem
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000310"),
            Question = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Wat is het verschil tussen PETG en flexibel TPU?",
                ["en"] = "What is the difference between PETG and flexible TPU 3D printing?"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "PETG is slagvast, vormvast tot 75°C en chemisch resistent voor dragende delen. TPU is een elastisch, rubberachtig materiaal ideaal voor stootranden, pakkingen en trillingsdempers.",
                ["en"] = "PETG provides high tensile strength, heat resistance up to ~75°C, and impact toughness for structural parts. TPU is an elastic, rubber-like filament ideal for shock absorbers, gaskets, and seals."
            },
            Category = "materials",
            SortOrder = 10,
            IsActive = true
        },
        new FaqItem
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000311"),
            Question = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Bieden jullie kleine series en rapid prototyping aan voor bedrijven?",
                ["en"] = "Do you offer small-batch 3D printing and rapid prototyping for businesses?"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Ja! We produceren van 1 stuk tot 500+ pre-productie eenheden voor ingenieurs, machinebouwers en productontwikkelaars, inclusief officiële BTW-factuur.",
                ["en"] = "Yes! We provide short-run FDM manufacturing and small-batch production from 1 to 500+ units across the Netherlands with commercial B2B invoicing."
            },
            Category = "services",
            SortOrder = 11,
            IsActive = true
        },
        new FaqItem
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000312"),
            Question = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Kan ik direct een ontwerp van Thingiverse, Printables of MakerWorld laten printen?",
                ["en"] = "Can I order a 3D print directly from Thingiverse, Printables, or MakerWorld?"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Absoluut! Download eenvoudig het .STL- of .3MF-bestand van MakerWorld, Printables of Thingiverse en upload het in onze configurator voor een directe offerte.",
                ["en"] = "Absolutely! Found a great design on MakerWorld, Printables, or Thingiverse? Just download the .STL or .3MF file and upload it to our quote tool for instant slicing."
            },
            Category = "general",
            SortOrder = 12,
            IsActive = true
        },
        new FaqItem
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000313"),
            Question = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Kunnen bedrijven op factuur bestellen met BTW-specificatie?",
                ["en"] = "Can businesses order on invoice with a VAT breakdown?"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Ja, we leveren aan bedrijven en instellingen met een duidelijke gespecificeerde factuur inclusief BTW en KvK-gegevens voor de bedrijfsadministratie.",
                ["en"] = "Yes, we support corporate invoice billing for companies and institutions. Every B2B order comes with a formal VAT invoice with company details."
            },
            Category = "pricing",
            SortOrder = 13,
            IsActive = true
        },
        new FaqItem
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000314"),
            Question = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Bieden jullie geheimhoudingsverklaringen (NDA) aan voor vertrouwelijke ontwerpen?",
                ["en"] = "Do you offer non-disclosure agreements (NDAs) for confidential CAD designs and prototypes?"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Ja. We behandelen alle CAD-bestanden en intellectueel eigendom strikt vertrouwelijk en zijn graag bereid vooraf een geheimhoudingsovereenkomst (NDA) te ondertekenen.",
                ["en"] = "Absolutely. We treat all uploaded 3D files and proprietary designs as strictly confidential in compliance with GDPR, and are happy to sign an NDA before manufacturing."
            },
            Category = "services",
            SortOrder = 14,
            IsActive = true
        },
        new FaqItem
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000315"),
            Question = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Kunnen jullie mallen, kalibers en machineonderdelen produceren?",
                ["en"] = "Can you manufacture custom jigs, fixtures, and replacement machine components?"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Zeker! Wij produceren montagemallen, boorsjablonen, laskalibers en inspectiemallen in sterk PETG met ±0.1mm nauwkeurigheid.",
                ["en"] = "Yes! We manufacture custom assembly jigs, drill templates, inspection fixtures, and durable PETG tool holders with ±0.1mm precision."
            },
            Category = "services",
            SortOrder = 15,
            IsActive = true
        },
        new FaqItem
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000316"),
            Question = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Produceren jullie ook kleine series van 10 tot 500+ stuks?",
                ["en"] = "Do you offer batch production for small series (10–500+ parts)?"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Ja! Ons printfarm-netwerk is ingericht voor snelle nulseries en batchproductie als flexibel alternatief voor kostbare spuitgietmatrijzen.",
                ["en"] = "Yes! Our print farm specializes in short-run plastic batch production from 10 to 500+ units as a fast, flexible bridge manufacturing alternative to injection molding."
            },
            Category = "services",
            SortOrder = 16,
            IsActive = true
        }
    };

    public static async Task<SeederResult> EnsureDatabaseSeededAsync(PrintCraftDb db, bool forceReload = false)
    {
        var defaults = GetDefaultFaqItems();
        var existing = await db.FaqItems.ToListAsync();
        var result = new SeederResult { TotalBefore = existing.Count };

        if (existing.Count == 0)
        {
            await db.FaqItems.AddRangeAsync(defaults);
            await db.SaveChangesAsync();
            result.Inserted = defaults.Count;
            result.TotalAfter = defaults.Count;
            return result;
        }

        foreach (var def in defaults)
        {
            var match = existing.FirstOrDefault(i => i.Id == def.Id);
            if (match == null)
            {
                await db.FaqItems.AddAsync(def);
                result.Inserted++;
            }
            else if (forceReload)
            {
                match.Question = def.Question;
                match.Answer = def.Answer;
                match.Category = def.Category;
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

        result.TotalAfter = await db.FaqItems.CountAsync();
        return result;
    }
}
