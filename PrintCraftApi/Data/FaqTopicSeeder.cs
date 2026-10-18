using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Models;

namespace PrintCraftApi.Data;

public static class FaqTopicSeeder
{
    public static List<FaqTopic> GetDefaultTopics() => new()
    {
        new FaqTopic
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000401"),
            Slug = "vervangende-onderdelen-printen",
            Key = "replacementParts",
            Names = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Vervangende Onderdelen Printen",
                ["en"] = "Replacement Parts 3D Printing"
            },
            Tagline = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Kapot plastic onderdeel namaken of reserveonderdelen 3D-printen",
                ["en"] = "Reproduce broken plastic parts and discontinued components"
            },
            Badge = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Reverse Engineering & Spare Parts",
                ["en"] = "Reverse Engineering & Spare Parts"
            },
            HeroTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Vervangend Onderdeel 3D Printen & Namaken",
                ["en"] = "Replacement Part 3D Printing & Reproduction"
            },
            HeroSubtitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Is er een plastic onderdeel van een apparaat, machine, oldtimer of gereedschap afgebroken? Wij reproduceren niet meer leverbare onderdelen in slijtvast PETG of rubberachtig TPU.",
                ["en"] = "Broken plastic gear, clip, knob, or machine mount? We reproduce discontinued parts with high-strength PETG or impact-absorbing TPU delivered in 2-5 days."
            },
            Description = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Voorkom het vervangen van complete apparaten door één enkel defect onderdeel. Met 3D-printen en reverse engineering maken we exacte replica's van gebroken kunststof tandwielen, behuizingsklemmen, handgrepen en industriële reserveonderdelen.",
                ["en"] = "Avoid replacing entire machines due to a single broken plastic component. We manufacture exact functional replicas of gears, clips, brackets, and machine components on demand."
            },
            Benefits = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = new List<string>
                {
                    "Geen minimale afname: van enkelstuks tot kleine series",
                    "Slijtvast en hittebestendig PETG tot 75°C",
                    "Flexibele pakkingen en stootranden in TPU rubber",
                    "Direct online offerte en snelle PostNL bezorging"
                },
                ["en"] = new List<string>
                {
                    "No minimum order quantity: from single units to batch runs",
                    "Wear-resistant, high-strength PETG heat resistant up to 75°C",
                    "Flexible rubber gaskets and impact bumpers in TPU",
                    "Instant online quote calculation and fast 2-5 business days dispatch"
                }
            },
            RecommendedMaterials = new List<string> { "PETG", "TPU", "PLA" },
            LeadTime = "2-5 werkdagen / business days",
            Precision = "±0.1mm industriële tolerantie",
            MetaTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Vervangend Onderdeel 3D Printen | Kapot Plastic Namaken | Print My 3D",
                ["en"] = "Replacement Part 3D Printing | Reverse Engineering Parts | Print My 3D"
            },
            MetaDescription = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Kapot plastic onderdeel namaken of reserveonderdeel 3D-printen? Upload je bestand of foto voor een directe offerte. Slijtvast PETG & TPU, snelle levering in Nederland.",
                ["en"] = "3D print replacement parts for appliances, tools, and machines. Upload your file for an instant quote. Durable PETG and flexible TPU with 2-5 days delivery."
            },
            MetaKeywords = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "vervangend onderdeel 3D printen, kapot plastic onderdeel namaken, reserveonderdelen 3D printen, tandwiel 3D printen, reserveonderdeel namaken, reverse engineering 3D printen",
                ["en"] = "replacement part 3D printing, discontinued plastic parts 3D print, broken plastic repair, custom spare parts, 3D print broken bracket"
            },
            Faqs = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "Hoe kan ik een kapot onderdeel namaken als ik geen 3D-bestand heb?",
                        A = "Je kunt duidelijke foto's met afmetingen (liniaal of schuifmaat) opsturen via ons offerteformulier. We beoordelen direct of we het onderdeel kunnen modelleren (reverse engineering) en printen."
                    },
                    new()
                    {
                        Q = "Welk materiaal is het beste voor mechanische reserveonderdelen?",
                        A = "Voor dragende onderdelen, beugels en tandwielen raden we PETG aan vanwege de hoge taaiheid en temperatuurbestendigheid. Voor afdichtingen en stootdempers gebruiken we flexibel TPU."
                    },
                    new()
                    {
                        Q = "Hoe wordt de offerte voor een vervangend onderdeel berekend?",
                        A = "De offerte wordt berekend op basis van de afmetingen, het benodigde materiaal (zoals slijtvast PETG of flexibel TPU) en de productietijd. Upload je 3D-model of foto voor een directe offerte op maat."
                    }
                },
                ["en"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "How can I reproduce a broken component if I do not have a 3D model?",
                        A = "You can submit clear photos with key dimensions (using calipers or a ruler) through our quote page. We evaluate whether our engineering team can model (reverse engineer) and print it."
                    },
                    new()
                    {
                        Q = "Which material is best for functional replacement components?",
                        A = "For load-bearing brackets and mechanical gears, PETG is ideal due to its impact toughness and heat resistance. For seals and bumpers, flexible TPU rubber is recommended."
                    },
                    new()
                    {
                        Q = "How is the quote for a replacement part calculated?",
                        A = "Quotes are calculated based on geometry, required material (such as wear-resistant PETG or flexible TPU), and production time. Upload your 3D model or sketch for an instant custom quote."
                    }
                }
            },
            SortOrder = 1,
            IsActive = true
        },
        new FaqTopic
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000402"),
            Slug = "elektronica-behuizingen-op-maat",
            Key = "enclosures",
            Names = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Elektronica Behuizingen op Maat",
                ["en"] = "Custom Electronics Enclosures"
            },
            Tagline = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Maatwerk PCB casings, sensor mounts en DIN-rail behuizingen",
                ["en"] = "Custom PCB casings, sensor housings, and DIN-rail enclosures"
            },
            Badge = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Custom Enclosures & Mounts",
                ["en"] = "Custom Enclosures & Mounts"
            },
            HeroTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Elektronica Behuizing 3D Printen op Maat",
                ["en"] = "Custom Electronics Enclosure 3D Printing"
            },
            HeroSubtitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Perfect passende behuizingen voor printplaten (PCB), Raspberry Pi, ESP32, sensoren en industriële IoT-hardware met snap-fit deksels en schroefdraadinzetstukken.",
                ["en"] = "Precision-engineered enclosures for PCBs, IoT devices, Raspberry Pi, ESP32, and industrial hardware with snap-fit lids and brass threaded inserts."
            },
            Description = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Standaard behuizingen passen zelden exact. Met 3D-printen produceren we op maat gemaakte behuizingen inclusief kabeldoorvoeren, display-uitsparingen, ventilatiesleuven en montagelippen in vlamvertragende of hittebestendige materialen.",
                ["en"] = "Off-the-shelf project boxes rarely match custom PCBs. We manufacture tailored enclosures featuring custom connector cutouts, ventilation grills, mounting flanges, and heat-set inserts."
            },
            Benefits = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = new List<string>
                {
                    "Exacte uitsparingen voor USB, HDMI, kabels en connectoren",
                    "Ondersteuning voor messing schroefdraad (threaded heat-set inserts)",
                    "Snap-fit of schroefdeksels met stofdichte passing",
                    "Hittebestendig PETG voor continue belasting en voedingen"
                },
                ["en"] = new List<string>
                {
                    "Precise cutouts for USB, power ports, antennas, and displays",
                    "Support for brass threaded heat-set inserts (M2–M5)",
                    "Snap-fit and screw-down lid options with snug tolerances",
                    "Heat-resistant PETG suitable for internal electronics and power units"
                }
            },
            RecommendedMaterials = new List<string> { "PETG", "PLA", "TPU" },
            LeadTime = "2-5 werkdagen / business days",
            Precision = "±0.1mm passingstolerantie",
            MetaTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Elektronica Behuizing 3D Printen | PCB Casing op Maat | Print My 3D",
                ["en"] = "Custom Electronics Enclosure 3D Print | PCB Casing | Print My 3D"
            },
            MetaDescription = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Elektronica behuizing op maat 3D-printen? Upload je CAD-bestand voor een directe offerte. Snap-fits, connector-uitsparingen en messing inserts in PETG.",
                ["en"] = "Custom 3D printed electronics enclosures and PCB cases. Upload your CAD/STEP model for an instant quote with connector cutouts and brass inserts."
            },
            MetaKeywords = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "elektronica behuizing 3D printen, custom electronics enclosure, PCB casing 3D print, bevestigingsbeugel op maat, DIN rail behuizing printen, sensor mount 3D print",
                ["en"] = "custom electronics enclosure 3D print, PCB casing 3D print, custom mounts 3D printing, DIN rail enclosure, sensor housing 3D print"
            },
            Faqs = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "Kunnen jullie messing schroefdraad (threaded inserts) aanbrengen?",
                        A = "Ja, we kunnen gaten ontwerpen voor M2, M3, M4 of M5 messing inserts en deze desgewenst insmelten voor herhaaldelijk vastschroeven zonder dat het plastic uitslijt."
                    },
                    new()
                    {
                        Q = "Is PETG geschikt voor warme elektronica componenten?",
                        A = "Zeker. PETG behoudt zijn vorm tot ongeveer 75°C en biedt goede elektrische isolatie en vlamvertraging vergeleken met standaard PLA."
                    }
                },
                ["en"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "Do you install brass heat-set threaded inserts?",
                        A = "Yes! We can dimension holes for M2, M3, M4, or M5 brass inserts and heat-press them for durable machine screws and repeated opening."
                    },
                    new()
                    {
                        Q = "Is PETG suitable for electronics generating heat?",
                        A = "Yes. PETG retains dimensional stability up to approximately 75°C and provides excellent electrical insulation."
                    }
                }
            },
            SortOrder = 2,
            IsActive = true
        },
        new FaqTopic
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000403"),
            Slug = "mallen-kalibers-jigs-fixtures",
            Key = "jigsFixtures",
            Names = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Mallen, Kalibers & Jigs Fixtures",
                ["en"] = "Molds, Jigs & Assembly Fixtures"
            },
            Tagline = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Productiegereedschap, montagemallen en boorkalibers voor werkplaats en fabriek",
                ["en"] = "Tooling, assembly jigs, inspection fixtures, and drill guides"
            },
            Badge = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Tooling, Jigs & Fixtures",
                ["en"] = "Tooling, Jigs & Fixtures"
            },
            HeroTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Mallen en Kalibers 3D Printen (Jigs & Fixtures)",
                ["en"] = "3D Printed Jigs, Fixtures & Manufacturing Tooling"
            },
            HeroSubtitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Versnel je assemblage- en inspectieprocessen met op maat gemaakte kalibers, montagemallen, gereedschapshouders en boorsjablonen binnen 2 tot 5 werkdagen.",
                ["en"] = "Speed up manufacturing, quality control, and assembly workflows with custom 3D printed jigs, inspection fixtures, and ergonomic tool mounts."
            },
            Description = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Traditioneel frezen van productiemallen vergt vaak weken aan doorlooptijd. Met onze industriële 3D-print service produceren we direct slijtvaste mallen, laskalibers en montagesjablonen in PETG met ±0.1mm nauwkeurigheid.",
                ["en"] = "Traditional milling of assembly tooling often involves long lead times. Our high-precision FDM service produces rigid jigs, welding fixtures, and alignment gauges in days directly from your 3D files."
            },
            Benefits = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = new List<string>
                {
                    "Productietijd van weken teruggebracht naar 2-5 werkdagen",
                    "Sterke PETG gereedschapshouders met hoge stijfheid",
                    "Zachte TPU contactoppervlakken voorkomen krassen op kwetsbare delen",
                    "Directe productie zonder frezen of fysieke spuitgietmatrijzen"
                },
                ["en"] = new List<string>
                {
                    "Turnaround reduced from weeks to 2-5 business days",
                    "Rigid, chemical-resistant PETG suitable for workshop shop floors",
                    "Soft TPU contact pads available to avoid marring finished products",
                    "Direct manufacturing without CNC setup or physical molds"
                }
            },
            RecommendedMaterials = new List<string> { "PETG", "TPU", "PLA" },
            LeadTime = "2-5 werkdagen / business days",
            Precision = "±0.1mm industriële herhaalnauwkeurigheid",
            MetaTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Mallen & Kalibers 3D Printen | Jigs & Fixtures Nederland | Print My 3D",
                ["en"] = "3D Printed Jigs & Fixtures | Tooling Manufacturing | Print My 3D"
            },
            MetaDescription = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Mallen en kalibers 3D-printen (jigs & fixtures)? Productiegereedschap, boorsjablonen en montagemallen in sterk PETG. Snelle levering en facturatie voor bedrijven.",
                ["en"] = "Custom 3D printed jigs, fixtures, and drill guides. Accelerate workshop production with high-precision PETG tooling delivered in 2-5 business days."
            },
            MetaKeywords = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "mallen en kalibers 3D printen, jigs & fixtures Nederland, montagemallen 3D print, boorsjabloon printen, gereedschapshouders PETG, productiegereedschap 3D print",
                ["en"] = "3D printed jigs and fixtures, manufacturing tooling 3D print, custom drill guide, assembly fixture, industrial tooling replacement"
            },
            Faqs = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "Hoe nauwkeurig zijn 3D-geprinte kalibers?",
                        A = "Onze industriële FDM-printers zijn gekalibreerd voor toleranties tot ±0.1mm, ruim voldoende voor montagemallen, inspectiemallen en boorgeleidingen."
                    },
                    new()
                    {
                        Q = "Zijn de mallen bestand tegen oliën en chemicaliën op de werkvloer?",
                        A = "PETG biedt uitstekende chemische resistentie tegen smeermiddelen, oliën en milde reinigingsmiddelen die in machinewerkplaatsen voorkomen."
                    }
                },
                ["en"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "What tolerances can be achieved on 3D printed assembly fixtures?",
                        A = "Our tuned FDM systems achieve tolerances within ±0.1mm, ideal for quality control gauges, drill templates, and assembly fixtures."
                    },
                    new()
                    {
                        Q = "Are the fixtures resistant to oils and workshop chemicals?",
                        A = "PETG exhibits high chemical resistance against oils, greases, and standard industrial cleaning solvents."
                    }
                }
            },
            SortOrder = 3,
            IsActive = true
        },
        new FaqTopic
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000404"),
            Slug = "rapid-prototyping-kunststof",
            Key = "prototyping",
            Names = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Rapid Prototyping Kunststof",
                ["en"] = "Rapid Plastic Prototyping"
            },
            Tagline = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Functionele prototypes, CAD/STEP validatie en nulserie pre-productie",
                ["en"] = "Functional prototypes, STEP/CAD validation, and pilot run production"
            },
            Badge = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Engineering & Prototyping",
                ["en"] = "Engineering & Prototyping"
            },
            HeroTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Rapid Prototyping Kunststof in Nederland",
                ["en"] = "Rapid Plastic Prototyping in the Netherlands"
            },
            HeroSubtitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Zet je CAD- of STEP-model direct om in een tastbaar, functioneel prototype. Valideer ergonomie, passing en sterkte binnen 2 tot 5 werkdagen vóór kostbare serieproductie.",
                ["en"] = "Convert CAD and STEP files into physical, functional prototypes. Test form, fit, and mechanical performance within 2 to 5 business days before tooling up."
            },
            Description = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Van eerste vormstudie tot mechanisch geteste nulserie: onze FDM rapid prototyping service ondersteunt ingenieursbureaus, startup hardware-ontwikkelaars en machinebouwers met snelle iteraties en zakelijke facturatie.",
                ["en"] = "From initial concept validation to functional pilot series: we support product development teams and machine builders with fast turnaround iterations and B2B invoicing."
            },
            Benefits = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = new List<string>
                {
                    "Ondersteunt directe upload van STEP-, 3MF- en STL-bestanden",
                    "Vertrouwelijke behandeling van alle geüploade 3D-bestanden",
                    "Geen minimale afname: van 1 stuk tot 500+ pre-productie eenheden",
                    "Officiële BTW-factuur voor bedrijven en instellingen"
                },
                ["en"] = new List<string>
                {
                    "Direct upload support for STEP, 3MF, and STL models",
                    "Strict confidentiality for all uploaded designs and IP",
                    "No minimum order quantity: test 1 part or launch a 500-unit pilot batch",
                    "Official commercial VAT invoice with corporate payment terms"
                }
            },
            RecommendedMaterials = new List<string> { "PLA", "PETG", "TPU" },
            LeadTime = "2-5 werkdagen / business days",
            Precision = "±0.1mm industriële tolerantie",
            MetaTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Rapid Prototyping Nederland | Kunststof Prototypes 3D Printen | Print My 3D",
                ["en"] = "Rapid Prototyping Netherlands | Functional 3D Prints | Print My 3D"
            },
            MetaDescription = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Rapid prototyping service in Nederland voor ingenieurs en productontwikkelaars. Upload STEP/STL voor een directe offerte op functionele kunststof prototypes.",
                ["en"] = "Rapid prototyping service in the Netherlands for product designers and engineers. Upload STEP/STL models for an instant custom quote on functional plastic prototypes."
            },
            MetaKeywords = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "rapid prototyping Nederland, functioneel kunststof prototype, zakelijk 3D printen, CAD STEP model laten printen, nulserie pre-productie, product prototype laten maken",
                ["en"] = "rapid prototyping services, B2B 3D printing service Netherlands, functional plastic prototypes, STEP CAD file manufacturing, small batch rapid prototyping"
            },
            Faqs = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "Kan ik direct een STEP- of CAD-assemblage uploaden voor prototyping?",
                        A = "Ja, ons platform accepteert STEP-, STP-, STL- en 3MF-bestanden. We controleren wanddiktes en passingen direct in onze software."
                    },
                    new()
                    {
                        Q = "Worden mijn geüploade 3D-bestanden vertrouwelijk behandeld?",
                        A = "Ja, alle bestanden en ontwerpen worden strikt vertrouwelijk behandeld en uitsluitend gebruikt voor de productie van jouw order."
                    }
                },
                ["en"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "Can I upload a STEP assembly directly for prototyping?",
                        A = "Yes! Our platform supports STEP, STP, STL, and 3MF files. We analyze wall thickness, overhangs, and fits directly."
                    },
                    new()
                    {
                        Q = "Are my uploaded 3D files kept confidential?",
                        A = "Yes, all models and project designs are treated with strict confidentiality and used solely to fulfill your order."
                    }
                }
            },
            SortOrder = 4,
            IsActive = true
        }
    };

    public static async Task<SeederResult> EnsureDatabaseSeededAsync(PrintCraftDb db, bool forceReload = false)
    {
        var defaults = GetDefaultTopics();
        var existing = await db.FaqTopics.ToListAsync();
        var result = new SeederResult { TotalBefore = existing.Count };

        if (existing.Count == 0)
        {
            await db.FaqTopics.AddRangeAsync(defaults);
            await db.SaveChangesAsync();
            result.Inserted = defaults.Count;
            result.TotalAfter = defaults.Count;
            return result;
        }

        foreach (var def in defaults)
        {
            var match = existing.FirstOrDefault(t => t.Id == def.Id)
                        ?? existing.FirstOrDefault(t => string.Equals(t.Slug, def.Slug, StringComparison.OrdinalIgnoreCase));

            if (match == null)
            {
                await db.FaqTopics.AddAsync(def);
                result.Inserted++;
            }
            else if (forceReload)
            {
                match.Slug = def.Slug;
                match.Key = def.Key;
                match.Names = def.Names;
                match.Tagline = def.Tagline;
                match.Badge = def.Badge;
                match.HeroTitle = def.HeroTitle;
                match.HeroSubtitle = def.HeroSubtitle;
                match.Description = def.Description;
                match.Benefits = def.Benefits;
                match.RecommendedMaterials = def.RecommendedMaterials;
                match.LeadTime = def.LeadTime;
                match.Precision = def.Precision;
                match.MetaTitle = def.MetaTitle;
                match.MetaDescription = def.MetaDescription;
                match.MetaKeywords = def.MetaKeywords;
                match.Faqs = def.Faqs;
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

        result.TotalAfter = await db.FaqTopics.CountAsync();
        return result;
    }
}
