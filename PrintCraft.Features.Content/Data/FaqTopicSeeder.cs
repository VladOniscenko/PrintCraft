using Microsoft.EntityFrameworkCore;
using PrintCraft.Shared.Models;

namespace PrintCraft.Features.Content.Data;

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
                ["en"] = "Replacement Parts 3D Printing",
                ["tr"] = "Yedek Parça 3D Baskı",
                ["ru"] = "3D-печать запасных частей",
                ["ar"] = "طباعة قطع الغيار ثلاثية الأبعاد"
            },
            Tagline = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Kapot plastic onderdeel namaken of reserveonderdelen 3D-printen",
                ["en"] = "Reproduce broken plastic parts and discontinued components",
                ["tr"] = "Kırık plastik parçaları yeniden üretin veya artık üretilmeyen parçaları basın",
                ["ru"] = "Воспроизведение сломанных деталей и деталей, снятых с производства",
                ["ar"] = "إعادة إنتاج الأجزاء البلاستيكية المكسورة والقطع غير المتوفرة"
            },
            Badge = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Reverse Engineering & Spare Parts",
                ["en"] = "Reverse Engineering & Spare Parts",
                ["tr"] = "Tersine Mühendislik & Yedek Parçalar",
                ["ru"] = "Реверс-инжиниринг и запчасти",
                ["ar"] = "الهندسة العكسية وقطع الغيار"
            },
            HeroTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Vervangend Onderdeel 3D Printen & Namaken",
                ["en"] = "Replacement Part 3D Printing & Reproduction",
                ["tr"] = "Yedek Parça 3D Baskı ve Yeniden Üretim",
                ["ru"] = "3D-печать и воспроизведение запасных частей",
                ["ar"] = "طباعة وإعادة تصنيع قطع الغيار ثلاثية الأبعاد"
            },
            HeroSubtitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Is er een plastic onderdeel van een apparaat, machine, oldtimer of gereedschap afgebroken? Wij reproduceren niet meer leverbare onderdelen in slijtvast PETG of rubberachtig TPU.",
                ["en"] = "Broken plastic gear, clip, knob, or machine mount? We reproduce discontinued parts with high-strength PETG or impact-absorbing TPU delivered in 2-5 days.",
                ["tr"] = "Cihazınızda, makinenizde veya aletinizde kırık bir plastik parça mı var? Aşınmaya dayanıklı PETG veya darbe emici TPU ile 2-5 gün içinde yeniden üretiyoruz.",
                ["ru"] = "Сломалась пластиковая деталь прибора, станка или инструмента? Мы воспроизведем снятые с производства детали из прочного PETG или гибкого TPU за 2–5 дней.",
                ["ar"] = "هل انكسر جزء بلاستيكي في جهاز أو آلة أو أداة لديك؟ نعيد إنتاج القطع غير المتوفرة باستخدام PETG المتين أو TPU المرن مع التسليم خلال 2-5 أيام."
            },
            Description = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Voorkom het vervangen van complete apparaten door één enkel defect onderdeel. Met 3D-printen en reverse engineering maken we exacte replica's van gebroken kunststof tandwielen, behuizingsklemmen, handgrepen en industriële reserveonderdelen.",
                ["en"] = "Avoid replacing entire machines due to a single broken plastic component. We manufacture exact functional replicas of gears, clips, brackets, and machine components on demand.",
                ["tr"] = "Tek bir arızalı plastik parça yüzünden tüm cihazı değiştirmekten kaçının. 3D baskı ve tersine mühendislik ile kırık dişlileri, klipsleri, braketleri ve makine bileşenlerini birebir kopyalıyoruz.",
                ["ru"] = "Не заменяйте всё устройство из-за одной сломанной пластиковой детали. С помощью 3D-печати и реверс-инжиниринга мы создаем точные функциональные копии шестерен, фиксаторов и компонентов оборудования.",
                ["ar"] = "تجنب استبدال الآلات أو الأجهزة بالكامل بسبب عطل قطعة بلاستيكية واحدة. من خلال الطباعة ثلاثية الأبعاد والهندسة العكسية، نصنع نسخاً مطابقة للتروس والمشابك وحوامل الآلات."
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
                },
                ["tr"] = new List<string>
                {
                    "Minimum sipariş miktarı yok: tek parçadan küçük serilere kadar",
                    "Aşınmaya dayanıklı ve 75°C'ye kadar ısıya dayanıklı PETG",
                    "TPU kauçuk ile esnek contalar ve darbe emiciler",
                    "Anında çevrimiçi fiyat teklifi ve hızlı PostNL teslimatı"
                },
                ["ru"] = new List<string>
                {
                    "Без минимального заказа: от единичных деталей до небольших партий",
                    "Износостойкий и термостойкий PETG до 75°C",
                    "Гибкие уплотнители и амортизаторы из резины TPU",
                    "Мгновенный онлайн-расчет и быстрая доставка PostNL"
                },
                ["ar"] = new List<string>
                {
                    "لا يوجد حد أدنى للطلب: من قطعة واحدة إلى دفعات صغيرة",
                    "بلاستيك PETG مقاوم للتآكل وللحرارة حتى 75 درجة مئوية",
                    "حشيات مرنة وصدادات ممتصة للصدمات من مطاط TPU",
                    "عرض سعر فوري عبر الإنترنت وشحن سريع مع PostNL"
                }
            },
            RecommendedMaterials = new List<string> { "PETG", "TPU", "PLA" },
            LeadTime = "2-5 werkdagen / business days",
            Precision = "±0.1mm industriële tolerantie",
            MetaTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Vervangend Onderdeel 3D Printen | Kapot Plastic Namaken | Print My 3D",
                ["en"] = "Replacement Part 3D Printing | Reverse Engineering Parts | Print My 3D",
                ["tr"] = "Yedek Parça 3D Baskı | Kırık Plastik Parça Yeniden Üretimi | Print My 3D",
                ["ru"] = "3D-печать запчастей | Воспроизведение сломанного пластика | Print My 3D",
                ["ar"] = "طباعة قطع الغيار ثلاثية الأبعاد | تصنيع بدائل البلاستيك المكسور | Print My 3D"
            },
            MetaDescription = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Kapot plastic onderdeel namaken of reserveonderdeel 3D-printen? Upload je bestand of foto voor een directe offerte. Slijtvast PETG & TPU, snelle levering in Nederland.",
                ["en"] = "3D print replacement parts for appliances, tools, and machines. Upload your file for an instant quote. Durable PETG and flexible TPU with 2-5 days delivery.",
                ["tr"] = "Kırık plastik parçaları yeniden üretin veya yedek parça basın. Dosyanızı veya fotoğrafınızı yükleyin, anında teklif alın. Dayanıklı PETG ve TPU.",
                ["ru"] = "3D-печать запасных частей для техники, оборудования и приборов. Загрузите файл или фото для мгновенного расчета. Износостойкий PETG и TPU.",
                ["ar"] = "طباعة قطع غيار ثلاثية الأبعاد للأجهزة والآلات. ارفع ملفك أو صورك للحصول على عرض سعر فوري. مادة PETG و TPU المتينة مع توصيل سريع."
            },
            MetaKeywords = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "vervangend onderdeel 3D printen, kapot plastic onderdeel namaken, reserveonderdelen 3D printen, tandwiel 3D printen, reserveonderdeel namaken, reverse engineering 3D printen",
                ["en"] = "replacement part 3D printing, discontinued plastic parts 3D print, broken plastic repair, custom spare parts, 3D print broken bracket",
                ["tr"] = "yedek parça 3D baskı, kırık plastik parça üretimi, dişli 3d baskı, tersine mühendislik, özel yedek parça",
                ["ru"] = "3d печать запчастей, воспроизведение сломанного пластика, печать шестеренок, реверс инжиниринг, запасные детали на заказ",
                ["ar"] = "طباعة قطع غيار 3D, تصنيع البلاستيك المكسور, طباعة تروس 3D, هندسة عكسية, قطع غيار مخصصة"
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
                },
                ["tr"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "3D dosyam yoksa kırık bir parçayı nasıl yeniden üretebilirim?",
                        A = "Teklif formumuz aracılığıyla cetvel veya kumpas ile çekilmiş net fotoğrafları gönderebilirsiniz. Mühendislik ekibimizin parçayı modelleyip (tersine mühendislik) basabileceğini değerlendiriyoruz."
                    },
                    new()
                    {
                        Q = "Mekanik yedek parçalar için hangi malzeme en iyisidir?",
                        A = "Yük taşıyan braketler ve mekanik dişliler için tokluğu ve ısı dayanımı nedeniyle PETG idealdir. Contalar ve sönümleyiciler için esnek TPU kauçuk önerilir."
                    },
                    new()
                    {
                        Q = "Yedek parça teklifi nasıl hesaplanır?",
                        A = "Teklifler geometriye, gereken malzemeye (aşınmaya dayanıklı PETG veya esnek TPU gibi) ve üretim süresine göre hesaplanır. Özel teklif için modelinizi yükleyin."
                    }
                },
                ["ru"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "Как восстановить сломанную деталь, если у меня нет 3D-модели?",
                        A = "Вы можете прикрепить четкие фотографии с размерами (линейкой или штангенциркулем) через форму расчета. Мы оценим возможность 3D-моделирования (реверс-инжиниринга) и печати."
                    },
                    new()
                    {
                        Q = "Какой материал лучше всего подходит для механических запчастей?",
                        A = "Для несущих кронштейнов и шестерен отлично подходит PETG благодаря прочности и термостойкости. Для уплотнителей и амортизаторов применяется гибкий TPU."
                    },
                    new()
                    {
                        Q = "Как рассчитывается стоимость изготовления запасной детали?",
                        A = "Расчет выполняется на основе геометрии, выбранного материала (PETG или гибкий TPU) и времени изготовления. Загрузите модель или эскиз для точного расчета."
                    }
                },
                ["ar"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "كيف يمكنني إعادة تصنيع قطعة مكسورة إذا لم يكن لدي ملف ثلاثي الأبعاد؟",
                        A = "يمكنك إرسال صور واضحة مع أبعاد مرجعية (باستخدام مسطرة أو فرجار) عبر نموذج عرض السعر. سيقوم فريقنا بتقييم إمكانية نمذجتها وهندستها عكسياً وطباعتها."
                    },
                    new()
                    {
                        Q = "ما هي أفضل مادة لقطع الغيار الميكانيكية؟" ,
                        A = "بالنسبة للحوامل والتروس المعرضة للأحمال، يعتبر PETG مثالياً لمتانته ومقاومته للحرارة. أما بالنسبة للحشيات والموانع، فنوصي بمطاط TPU المرن."
                    },
                    new()
                    {
                        Q = "كيف يتم حساب عرض السعر لقطعة الغيار البديلة؟",
                        A = "يتم حساب السعر بناءً على الشكل الهندسي والمادة المطلوبة (مثل PETG أو TPU) ووقت الإنتاج. ارفع نموذجك أو رسمك للحصول على عرض فوري."
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
                ["en"] = "Custom Electronics Enclosures",
                ["tr"] = "Özel Elektronik Muhafazaları",
                ["ru"] = "Корпуса для электроники на заказ",
                ["ar"] = "علب وأغطية مخصصة للإلكترونيات"
            },
            Tagline = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Maatwerk PCB casings, sensor mounts en DIN-rail behuizingen",
                ["en"] = "Custom PCB casings, sensor housings, and DIN-rail enclosures",
                ["tr"] = "Özel PCB kutuları, sensör yuvaları ve DIN rayı muhafazaları",
                ["ru"] = "Индивидуальные корпуса для печатных плат, датчиков и DIN-реек",
                ["ar"] = "حافظات لوحات دوائر مخصصة وحوامل حساسات وعلب سكك DIN"
            },
            Badge = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Custom Enclosures & Mounts",
                ["en"] = "Custom Enclosures & Mounts",
                ["tr"] = "Custom Enclosures & Mounts",
                ["ru"] = "Корпуса и крепления",
                ["ar"] = "أغطية وحوامل مخصصة"
            },
            HeroTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Elektronica Behuizing 3D Printen op Maat",
                ["en"] = "Custom Electronics Enclosure 3D Printing",
                ["tr"] = "Özel Elektronik Muhafazası 3D Baskı",
                ["ru"] = "3D-печать корпусов для электроники на заказ",
                ["ar"] = "طباعة علب وحافظات الإلكترونيات ثلاثية الأبعاد"
            },
            HeroSubtitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Perfect passende behuizingen voor printplaten (PCB), Raspberry Pi, ESP32, sensoren en industriële IoT-hardware met snap-fit deksels en schroefdraadinzetstukken.",
                ["en"] = "Precision-engineered enclosures for PCBs, IoT devices, Raspberry Pi, ESP32, and industrial hardware with snap-fit lids and brass threaded inserts.",
                ["tr"] = "PCB, Raspberry Pi, ESP32, sensörler ve endüstriyel IoT donanımları için geçmeli kapaklar ve pirinç dişli ekler içeren kusursuz kutular.",
                ["ru"] = "Точные корпуса для плат (PCB), Raspberry Pi, ESP32, датчиков и IoT-устройств с защелкивающимися крышками и резьбовыми вставками.",
                ["ar"] = "علب مصممة بدقة للوحات الدوائر و Raspberry Pi و ESP32 والمستشعرات مع أغطية محكمة ومسامير نحاسية مدمجة."
            },
            Description = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Standaard behuizingen passen zelden exact. Met 3D-printen produceren we op maat gemaakte behuizingen inclusief kabeldoorvoeren, display-uitsparingen, ventilatiesleuven en montagelippen in vlamvertragende of hittebestendige materialen.",
                ["en"] = "Off-the-shelf project boxes rarely match custom PCBs. We manufacture tailored enclosures featuring custom connector cutouts, ventilation grills, mounting flanges, and heat-set inserts.",
                ["tr"] = "Hazır kutular nadiren özel kartlarınıza tam uyar. 3D baskı ile konektör kesitleri, havalandırma kanalları ve montaj delikleri içeren özel muhafazalar üretiyoruz.",
                ["ru"] = "Стандартные корпуса редко подходят идеально. С помощью 3D-печати мы изготавливаем корпуса с точными вырезами под разъемы, вентиляцию и крепления из огнестойких и прочных материалов.",
                ["ar"] = "نادراً ما تلائم الصناديق الجاهزة لوحات الدوائر الإلكترونية المخصصة. نطبع حاويات مخصصة بدقة تشمل فتحات للمنافذ والتهوية ومسامير التثبيت."
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
                },
                ["tr"] = new List<string>
                {
                    "USB, HDMI, kablolar ve konektörler için hassas kesitler",
                    "Pirinç dişli ek parçaları (M2–M5) desteği",
                    "Geçmeli (snap-fit) veya vidalı toz geçirmez kapaklar",
                    "Güç kaynakları ve ısınan kartlar için ısıya dayanıklı PETG"
                },
                ["ru"] = new List<string>
                {
                    "Точные вырезы под разъемы USB, питания, дисплеи и кабели",
                    "Поддержка латунных резьбовых втулок (M2–M5)",
                    "Крышки на защелках или винтах с плотной посадкой",
                    "Термостойкий PETG для непрерывной работы электроники"
                },
                ["ar"] = new List<string>
                {
                    "فتحات دقيقة لمنافذ USB والكابلات والموصلات",
                    "دعم المسامير النحاسية اللولبية المدمجة (M2 إلى M5)",
                    "خيارات أغطية بالتثبيت السريع (Snap-fit) أو البراغي",
                    "مادة PETG مقاومة للحرارة ومناسبة لدوائر الطاقة"
                }
            },
            RecommendedMaterials = new List<string> { "PETG", "PLA", "TPU" },
            LeadTime = "2-5 werkdagen / business days",
            Precision = "±0.1mm passingstolerantie",
            MetaTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Elektronica Behuizing 3D Printen | PCB Casing op Maat | Print My 3D",
                ["en"] = "Custom Electronics Enclosure 3D Print | PCB Casing | Print My 3D",
                ["tr"] = "Elektronik Muhafazası 3D Baskı | Özel PCB Kutusu | Print My 3D",
                ["ru"] = "3D-печать корпусов для электроники | Корпуса для плат PCB | Print My 3D",
                ["ar"] = "طباعة علب إلكترونيات 3D | صناديق لوحات الدوائر PCB | Print My 3D"
            },
            MetaDescription = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Elektronica behuizing op maat 3D-printen? Upload je CAD-bestand voor een directe offerte. Snap-fits, connector-uitsparingen en messing inserts in PETG.",
                ["en"] = "Custom 3D printed electronics enclosures and PCB cases. Upload your CAD/STEP model for an instant quote with connector cutouts and brass inserts.",
                ["tr"] = "Özel elektronik muhafazası bastırın. CAD dosyanızı yükleyin, anında teklif alın. Snap-fit kapaklar ve pirinç dişli ekleri ile dayanıklı PETG.",
                ["ru"] = "3D-печать корпусов для электроники и плат на заказ. Загрузите модель CAD/STEP для моментального расчета. Защелки, вырезы и вставки.",
                ["ar"] = "طباعة حافظات مخصصة للإلكترونيات ولوحات الدوائر. ارفع ملفك للحصول على عرض سعر فوري مع خيارات الفتحات والتثبيت."
            },
            MetaKeywords = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "elektronica behuizing 3D printen, custom electronics enclosure, PCB casing 3D print, bevestigingsbeugel op maat, DIN rail behuizing printen, sensor mount 3D print",
                ["en"] = "custom electronics enclosure 3D print, PCB casing 3D print, custom mounts 3D printing, DIN rail enclosure, sensor housing 3D print",
                ["tr"] = "elektronik kutusu 3d baskı, özel PCB kutusu, DIN ray muhafaza, sensör yuvası 3d baskı",
                ["ru"] = "корпус для электроники 3d печать, корпус pcb печать, корпус на din рейку, крепление датчика 3d",
                ["ar"] = "علبة إلكترونيات 3d, حافظة pcb, صندوق سكة din, حامل مستشعر 3d"
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
                },
                ["tr"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "Pirinç dişli ek parçaları (threaded inserts) takabiliyor musunuz?",
                        A = "Evet! M2, M3, M4 veya M5 pirinç ek parçalar için delikler tasarlayabiliyor ve vidaların aşınmadan defalarca sıkılabilmesi için sıcak pres ile yerleştirebiliyoruz."
                    },
                    new()
                    {
                        Q = "PETG ısınan elektronik bileşenler için uygun mu?",
                        A = "Kesinlikle. PETG yaklaşık 75°C'ye kadar boyutsal kararlılığını korur ve standart PLA'ya göre mükemmel elektriksel yalıtım sunar."
                    }
                },
                ["ru"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "Устанавливаете ли вы латунные резьбовые вставки?",
                        A = "Да, мы можем спроектировать отверстия под латунные вставки M2, M3, M4 или M5 и впрессовать их для многократного закручивания винтов без износа пластика."
                    },
                    new()
                    {
                        Q = "Подходит ли PETG для электроники, выделяющей тепло?",
                        A = "Безусловно. PETG сохраняет форму до ~75°C и обеспечивает отличную электроизоляцию."
                    }
                },
                ["ar"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "هل تقومون بتركيب مسامير لولبية نحاسية مدمجة (threaded inserts)؟",
                        A = "نعم! يمكننا تصميم ثقوب لمسامير M2 و M3 و M4 و M5 النحاسية وتثبيتها حرارياً لتسهيل فك وربط البراغي المعدنية مراراً دون تآكل البلاستيك."
                    },
                    new()
                    {
                        Q = "هل مادة PETG مناسبة للإلكترونيات التي تصدر حرارة؟",
                        A = "نعم، يحافظ PETG على ثبات أبعاده حتى حوالي 75 درجة مئوية ويوفر عزلاً كهربائياً ممتازاً."
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
                ["en"] = "Molds, Jigs & Assembly Fixtures",
                ["tr"] = "Kalıplar, Mastarlar & Fikstürler",
                ["ru"] = "Шаблоны, оснастка и сборочные приспособления",
                ["ar"] = "القوالب والمثبتات ومعدات التجميع الصناعية"
            },
            Tagline = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Productiegereedschap, montagemallen en boorkalibers voor werkplaats en fabriek",
                ["en"] = "Tooling, assembly jigs, inspection fixtures, and drill guides",
                ["tr"] = "Atölye ve fabrika için üretim takımları, montaj şablonları ve delme mastarları",
                ["ru"] = "Технологическая оснастка, сборочные кондукторы и шаблоны для сверления",
                ["ar"] = "أدوات الإنتاج وقوالب التجميع ومثبتات الفحص لورش العمل والمصانع"
            },
            Badge = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Tooling, Jigs & Fixtures",
                ["en"] = "Tooling, Jigs & Fixtures",
                ["tr"] = "Tooling, Jigs & Fixtures",
                ["ru"] = "Оснастка и кондукторы",
                ["ar"] = "أدوات ومثبتات صناعية"
            },
            HeroTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Mallen en Kalibers 3D Printen (Jigs & Fixtures)",
                ["en"] = "3D Printed Jigs, Fixtures & Manufacturing Tooling",
                ["tr"] = "3D Baskı Mastarlar, Fikstürler ve İmalat Takımları",
                ["ru"] = "3D-печать оснастки, шаблонов и кондукторов (Jigs & Fixtures)",
                ["ar"] = "طباعة المثبتات وقوالب التجميع الصناعية ثلاثية الأبعاد"
            },
            HeroSubtitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Versnel je assemblage- en inspectieprocessen met op maat gemaakte kalibers, montagemallen, gereedschapshouders en boorsjablonen binnen 2 tot 5 werkdagen.",
                ["en"] = "Speed up manufacturing, quality control, and assembly workflows with custom 3D printed jigs, inspection fixtures, and ergonomic tool mounts.",
                ["tr"] = "2 ila 5 iş günü içinde özel üretilmiş mastarlar, montaj şablonları ve alet tutucularla montaj ve kalite kontrol süreçlerinizi hızlandırın.",
                ["ru"] = "Ускорьте процессы сборки и контроля с помощью изготовленных на заказ калибров, кондукторов и шаблонов за 2–5 рабочих дней.",
                ["ar"] = "سرّع عمليات التجميع والفحص في ورش العمل من خلال مثبتات وقوالب حفر مخصصة مطبوعة خلال 2 إلى 5 أيام عمل."
            },
            Description = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Traditioneel frezen van productiemallen vergt vaak weken aan doorlooptijd. Met onze industriële 3D-print service produceren we direct slijtvaste mallen, laskalibers en montagesjablonen in PETG met ±0.1mm nauwkeurigheid.",
                ["en"] = "Traditional milling of assembly tooling often involves long lead times. Our high-precision FDM service produces rigid jigs, welding fixtures, and alignment gauges in days directly from your 3D files.",
                ["tr"] = "Geleneksel kalıp frezeleme haftalar sürebilir. Hassas FDM servisimizle doğrudan 3D dosyanızdan ±0.1mm hassasiyetle sağlam PETG kalıp ve montaj kılavuzları üretiyoruz.",
                ["ru"] = "Традиционная фрезеровка оснастки требует недель. Наша FDM-печать позволяет за несколько дней изготовить износостойкие сварочные кондукторы и сборочные шаблоны из PETG с точностью ±0.1 мм.",
                ["ar"] = "يستغرق تفريز القوالب التقليدي أسابيع. من خلال خدمتنا الصناعية، ننتج مثبتات وقوالب تجميع متينة من PETG بدقة ±0.1 مم مباشرة من ملفاتك."
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
                },
                ["tr"] = new List<string>
                {
                    "Üretim süresi haftalardan 2-5 iş gününe düşer",
                    "Yüksek rijitliğe sahip sağlam PETG alet tutucular",
                    "Hassas parçaları çizilmelere karşı koruyan yumuşak TPU temas yüzeyleri",
                    "CNC kurulumu veya pahalı kalıplar olmadan doğrudan üretim"
                },
                ["ru"] = new List<string>
                {
                    "Срок изготовления сокращен с недель до 2–5 рабочих дней",
                    "Жесткие и химически стойкие держатели инструмента из PETG",
                    "Мягкие накладки из TPU для предотвращения царапин на готовых деталях",
                    "Прямое производство без длительной наладки ЧПУ и дорогой оснастки"
                },
                ["ar"] = new List<string>
                {
                    "تقليص زمن الإنتاج من أسابيع إلى 2-5 أيام عمل",
                    "حوامل أدوات قوية وصلبة مصنوعة من بلاستيك PETG",
                    "وسادات تلامس من TPU المرن لحماية الأجزاء الحساسة من الخدش",
                    "إنتاج مباشر دون الحاجة لإعداد مكائن CNC معقدة أو قوالب مكلفة"
                }
            },
            RecommendedMaterials = new List<string> { "PETG", "TPU", "PLA" },
            LeadTime = "2-5 werkdagen / business days",
            Precision = "±0.1mm industriële herhaalnauwkeurigheid",
            MetaTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Mallen & Kalibers 3D Printen | Jigs & Fixtures Nederland | Print My 3D",
                ["en"] = "3D Printed Jigs & Fixtures | Tooling Manufacturing | Print My 3D",
                ["tr"] = "Kalıplar & Fikstürler 3D Baskı | Jigs & Fixtures | Print My 3D",
                ["ru"] = "3D-печать оснастки и шаблонов | Кондукторы и калибры | Print My 3D",
                ["ar"] = "طباعة قوالب ومثبتات 3D | تجهيزات ومعدات التجميع | Print My 3D"
            },
            MetaDescription = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Mallen en kalibers 3D-printen (jigs & fixtures)? Productiegereedschap, boorsjablonen en montagemallen in sterk PETG. Snelle levering en facturatie voor bedrijven.",
                ["en"] = "Custom 3D printed jigs, fixtures, and drill guides. Accelerate workshop production with high-precision PETG tooling delivered in 2-5 business days.",
                ["tr"] = "Özel 3D baskı montaj mastarları, delme şablonları ve fikstürler. Yüksek hassasiyetli PETG ile atölye üretiminizi hızlandırın.",
                ["ru"] = "3D-печать шаблонов, кондукторов и сборочной оснастки на заказ. Ускорьте производство с помощью надежной оснастки из PETG за 2–5 дней.",
                ["ar"] = "طباعة قوالب ومثبتات صناعية وقوالب حفر مخصصة بتقنية 3D. حسّن إنتاج ورشة عملك بمواد متينة وتسليم سريع."
            },
            MetaKeywords = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "mallen en kalibers 3D printen, jigs & fixtures Nederland, montagemallen 3D print, boorsjabloon printen, gereedschapshouders PETG, productiegereedschap 3D print",
                ["en"] = "3D printed jigs and fixtures, manufacturing tooling 3D print, custom drill guide, assembly fixture, industrial tooling replacement",
                ["tr"] = "mastar 3d baskı, fikstür üretimi, delme şablonu, montaj kalıbı 3d baskı, endüstriyel takımlar",
                ["ru"] = "3d печать оснастки, сборочный кондуктор, шаблон для сверления, промышленная оснастка 3d",
                ["ar"] = "طباعة مثبتات 3d, قوالب تجميع, دليل حفر, معدات صناعية 3d"
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
                },
                ["tr"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "3D baskı mastarlar ve fikstürler ne kadar hassastır?",
                        A = "Endüstriyel FDM sistemlerimiz ±0.1mm'ye kadar tolerans sağlar; bu da montaj şablonları, kalite kontrol kalibreleri ve delme kılavuzları için fazlasıyla yeterlidir."
                    },
                    new()
                    {
                        Q = "Kalıplar atölyedeki yağ ve kimyasallara dayanıklı mıdır?",
                        A = "PETG; atölyelerde yaygın olarak bulunan yağlar, gresler ve hafif temizlik çözücülerine karşı yüksek kimyasal direnç sunar."
                    }
                },
                ["ru"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "Какая точность достигается при печати оснастки и калибров?",
                        A = "Наше промышленное FDM-оборудование обеспечивает точность в пределах ±0.1 мм, что отлично подходит для контрольных калибров, кондукторов сверления и сборочных шаблонов."
                    },
                    new()
                    {
                        Q = "Устойчивы ли приспособления к маслам и техническим жидкостям?",
                        A = "PETG обладает высокой химической стойкостью к смазочным материалам, маслам и большинству стандартных моющих средств цеха."
                    }
                },
                ["ar"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "ما مدى دقة المثبتات وقوالب التجميع المطبوعة ثلاثية الأبعاد؟",
                        A = "توفر طابعاتنا الصناعية دقة تصل إلى ±0.1 مم، وهي ممتازة لقوالب التجميع وقوالب الفحص وموجهات الحفر."
                    },
                    new()
                    {
                        Q = "هل القوالب مقاومة للزيوت والمواد الكيميائية في بيئة العمل؟",
                        A = "تتمتع مادة PETG بمقاومة كيميائية ممتازة للزيوت والشحوم ومواد التنظيف الصناعية الشائعة."
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
                ["en"] = "Rapid Plastic Prototyping",
                ["tr"] = "Hızlı Plastik Prototipleme",
                ["ru"] = "Быстрое прототипирование из пластика",
                ["ar"] = "النماذج الأولية البلاستيكية السريعة"
            },
            Tagline = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Functionele prototypes, CAD/STEP validatie en nulserie pre-productie",
                ["en"] = "Functional prototypes, STEP/CAD validation, and pilot run production",
                ["tr"] = "Fonksiyonel prototipler, CAD/STEP doğrulaması ve pilot seri ön üretim",
                ["ru"] = "Функциональные прототипы, проверка CAD/STEP и пилотные партии",
                ["ar"] = "نماذج وظيفية والتحقق من ملفات CAD/STEP وإنتاج الدفعات التجريبية"
            },
            Badge = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Engineering & Prototyping",
                ["en"] = "Engineering & Prototyping",
                ["tr"] = "Engineering & Prototyping",
                ["ru"] = "Инжиниринг и прототипы",
                ["ar"] = "الهندسة والنماذج الأولية"
            },
            HeroTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Rapid Prototyping Kunststof in Nederland",
                ["en"] = "Rapid Plastic Prototyping in the Netherlands",
                ["tr"] = "Hollanda'da Hızlı Plastik Prototipleme",
                ["ru"] = "Быстрое прототипирование из пластика в Нидерландах",
                ["ar"] = "خدمة النماذج الأولية البلاستيكية السريعة في هولندا"
            },
            HeroSubtitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Zet je CAD- of STEP-model direct om in een tastbaar, functioneel prototype. Valideer ergonomie, passing en sterkte binnen 2 tot 5 werkdagen vóór kostbare serieproductie.",
                ["en"] = "Convert CAD and STEP files into physical, functional prototypes. Test form, fit, and mechanical performance within 2 to 5 business days before tooling up.",
                ["tr"] = "CAD veya STEP dosyanızı somut, fonksiyonel bir prototipe dönüştürün. Pahalı seri üretime geçmeden önce ergonomiyi ve mukavemeti 2-5 gün içinde test edin.",
                ["ru"] = "Превратите CAD- и STEP-файлы в реальные функциональные прототипы. Проверяйте эргономику, посадку и прочность за 2–5 рабочих дней до запуска дорогой пресс-формы.",
                ["ar"] = "حوّل ملفات CAD و STEP إلى نماذج أولية عملية وملموسة. اختبر الملاءمة وقوة التحمل خلال 2 إلى 5 أيام عمل قبل الاستثمار في خطوط الإنتاج الباهظة."
            },
            Description = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Van eerste vormstudie tot mechanisch geteste nulserie: onze FDM rapid prototyping service ondersteunt ingenieursbureaus, startup hardware-ontwikkelaars en machinebouwers met snelle iteraties en zakelijke facturatie.",
                ["en"] = "From initial concept validation to functional pilot series: we support product development teams and machine builders with fast turnaround iterations and B2B invoicing.",
                ["tr"] = "İlk form çalışmasından mekanik testleri tamamlanmış pilot serilere kadar: FDM hızlı prototipleme servisimiz mühendislik firmalarını, donanım girişimlerini ve makine üreticilerini kurumsal faturalandırma ile destekler.",
                ["ru"] = "От первой концептуальной модели до функциональной пилотной партии: наш сервис FDM-прототипирования помогает инженерам, стартапам и производителям оборудования с быстрыми итерациями и счетами для бизнеса.",
                ["ar"] = "من النموذج الأولي المفاهيمي إلى دفعات الاختبار الوظيفية: تدعم خدمتنا فرق التصميم الهندسي والشركات الناشئة مع دورات إنتاج سريعة وفواتير ضريبية رسمية."
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
                },
                ["tr"] = new List<string>
                {
                    "STEP, 3MF ve STL modellerinin doğrudan yüklenmesini destekler",
                    "Yüklenen tüm 3D dosyalar ve tasarımlar için sıkı gizlilik",
                    "Minimum sipariş miktarı yok: 1 parçadan 500+ pilot üniteye kadar",
                    "Şirketler ve kurumlar için resmi KDV faturası"
                },
                ["ru"] = new List<string>
                {
                    "Прямая загрузка форматов STEP, 3MF и STL",
                    "Строгая конфиденциальность всех загруженных проектов и данных",
                    "Без минимального заказа: тестируйте 1 деталь или закажите серию из 500+ шт.",
                    "Официальный коммерческий счет с НДС для компаний и организаций"
                },
                ["ar"] = new List<string>
                {
                    "دعم الرفع المباشر لملفات STEP و 3MF و STL",
                    "سرية تامة لجميع التصاميم والملفات المرفوعة وحقوق الملكية",
                    "لا يوجد حد أدنى للطلب: اختبر قطعة واحدة أو اطلب دفعة تجريبية من 500+ قطعة",
                    "فاتورة ضريبية رسمية للشركات والمؤسسات"
                }
            },
            RecommendedMaterials = new List<string> { "PLA", "PETG", "TPU" },
            LeadTime = "2-5 werkdagen / business days",
            Precision = "±0.1mm industriële tolerantie",
            MetaTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Rapid Prototyping Nederland | Kunststof Prototypes 3D Printen | Print My 3D",
                ["en"] = "Rapid Prototyping Netherlands | Functional 3D Prints | Print My 3D",
                ["tr"] = "Hızlı Prototipleme Hollanda | Plastik Prototip 3D Baskı | Print My 3D",
                ["ru"] = "Быстрое прототипирование в Нидерландах | 3D-печать прототипов | Print My 3D",
                ["ar"] = "النماذج الأولية السريعة في هولندا | طباعة نماذج بلاستيكية 3D | Print My 3D"
            },
            MetaDescription = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Rapid prototyping service in Nederland voor ingenieurs en productontwikkelaars. Upload STEP/STL voor een directe offerte op functionele kunststof prototypes.",
                ["en"] = "Rapid prototyping service in the Netherlands for product designers and engineers. Upload STEP/STL models for an instant custom quote on functional plastic prototypes.",
                ["tr"] = "Mühendisler ve ürün geliştiriciler için hızlı prototipleme servisi. Fonksiyonel prototipler için STEP/STL yükleyip anında teklif alın.",
                ["ru"] = "Сервис быстрого прототипирования для инженеров и разработчиков. Загрузите модель STEP/STL для моментального расчета функциональных прототипов.",
                ["ar"] = "خدمة نماذج أولية سريعة للمهندسين ومطوري المنتجات. ارفع ملفات STEP أو STL للحصول على عرض سعر فوري للنماذج الوظيفية."
            },
            MetaKeywords = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "rapid prototyping Nederland, functioneel kunststof prototype, zakelijk 3D printen, CAD STEP model laten printen, nulserie pre-productie, product prototype laten maken",
                ["en"] = "rapid prototyping services, B2B 3D printing service Netherlands, functional plastic prototypes, STEP CAD file manufacturing, small batch rapid prototyping",
                ["tr"] = "hızlı prototipleme, fonksiyonel plastik prototip, kurumsal 3d baskı, STEP model baskı, ürün prototipi",
                ["ru"] = "быстрое прототипирование, функциональный пластиковый прототип, b2b 3d печать, печать step cad файлов, изготовление прототипов",
                ["ar"] = "نماذج أولية سريعة, نماذج بلاستيكية وظيفية, طباعة 3d للشركات, طباعة ملفات step, تصنيع نماذج أولية"
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
                },
                ["tr"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "Prototipleme için doğrudan STEP veya CAD montajı yükleyebilir miyim?",
                        A = "Evet! Platformumuz STEP, STP, STL ve 3MF dosyalarını kabul eder. Et kalınlıklarını ve geçme paylarını doğrudan yazılımımızda analiz ediyoruz."
                    },
                    new()
                    {
                        Q = "Yüklediğim 3D dosyalar gizli tutuluyor mu?",
                        A = "Evet, tüm dosyalar ve tasarımlar kesinlikle gizli tutulur ve yalnızca siparişinizin üretimi için kullanılır."
                    }
                },
                ["ru"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "Можно ли загрузить сборку STEP или CAD напрямую для прототипирования?",
                        A = "Да! Наша платформа принимает файлы STEP, STP, STL и 3MF. Мы анализируем толщину стенок и допуски посадок."
                    },
                    new()
                    {
                        Q = "Обеспечивается ли конфиденциальность загруженных 3D-файлов?",
                        A = "Да, все загруженные файлы и проекты обрабатываются со строжайшей конфиденциальностью и используются исключительно для выполнения заказа."
                    }
                },
                ["ar"] = new List<FaqQuestionAnswerDto>
                {
                    new()
                    {
                        Q = "هل يمكنني رفع ملف تجميع STEP أو CAD مباشرة لإنتاج نموذج أولي؟" ,
                        A = "نعم! منصتنا تقبل ملفات STEP و STP و STL و 3MF. نقوم بتحليل سماكة الجدران والبروزات والتفاوتات مباشرة."
                    },
                    new()
                    {
                        Q = "هل تحظى ملفاتي ثلاثية الأبعاد بالسرية التامة؟",
                        A = "نعم، يتم التعامل مع جميع الملفات والتصاميم بسرية تامة وتُستخدم فقط لتنفيذ طلبك."
                    }
                }
            },
            SortOrder = 4,
            IsActive = true
        }
    };

    private static Dictionary<string, string> MergeDict(Dictionary<string, string>? existing, Dictionary<string, string>? defaults, ref bool needsUpdate, bool forceReload)
    {
        var target = existing ?? new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (defaults == null) return target;
        foreach (var (k, v) in defaults)
        {
            if (!target.ContainsKey(k) || (forceReload && target[k] != v))
            {
                target[k] = v;
                needsUpdate = true;
            }
        }
        return target;
    }

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
            else
            {
                var needsUpdate = forceReload;
                match.Names = MergeDict(match.Names, def.Names, ref needsUpdate, forceReload);
                match.Tagline = MergeDict(match.Tagline, def.Tagline, ref needsUpdate, forceReload);
                match.Badge = MergeDict(match.Badge, def.Badge, ref needsUpdate, forceReload);
                match.HeroTitle = MergeDict(match.HeroTitle, def.HeroTitle, ref needsUpdate, forceReload);
                match.HeroSubtitle = MergeDict(match.HeroSubtitle, def.HeroSubtitle, ref needsUpdate, forceReload);
                match.Description = MergeDict(match.Description, def.Description, ref needsUpdate, forceReload);
                match.MetaTitle = MergeDict(match.MetaTitle, def.MetaTitle, ref needsUpdate, forceReload);
                match.MetaDescription = MergeDict(match.MetaDescription, def.MetaDescription, ref needsUpdate, forceReload);
                match.MetaKeywords = MergeDict(match.MetaKeywords, def.MetaKeywords, ref needsUpdate, forceReload);

                // Benefits
                match.Benefits ??= new(StringComparer.OrdinalIgnoreCase);
                if (def.Benefits != null)
                {
                    foreach (var (k, v) in def.Benefits)
                    {
                        if (!match.Benefits.ContainsKey(k) || (forceReload && match.Benefits[k] != v))
                        {
                            match.Benefits[k] = v;
                            needsUpdate = true;
                        }
                    }
                }

                // Faqs
                match.Faqs ??= new(StringComparer.OrdinalIgnoreCase);
                if (def.Faqs != null)
                {
                    foreach (var (k, v) in def.Faqs)
                    {
                        if (!match.Faqs.ContainsKey(k) || (forceReload && match.Faqs[k] != v))
                        {
                            match.Faqs[k] = v;
                            needsUpdate = true;
                        }
                    }
                }

                if (forceReload)
                {
                    match.Slug = def.Slug;
                    match.Key = def.Key;
                    match.RecommendedMaterials = def.RecommendedMaterials;
                    match.LeadTime = def.LeadTime;
                    match.Precision = def.Precision;
                    match.SortOrder = def.SortOrder;
                    match.IsActive = def.IsActive;
                }

                if (needsUpdate)
                {
                    match.UpdatedAt = DateTime.UtcNow;
                    db.Entry(match).State = EntityState.Modified;
                    result.Updated++;
                }
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
