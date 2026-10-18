import type { SupportedLanguage } from "../i18n/translations";

export interface SeoApplicationFaq {
  q: string;
  a: string;
}

export interface SeoApplication {
  slug: string;
  key: "replacementParts" | "enclosures" | "jigsFixtures" | "prototyping";
  names: Record<SupportedLanguage, string>;
  tagline: Record<SupportedLanguage, string>;
  badge: Record<SupportedLanguage, string>;
  heroTitle: Record<SupportedLanguage, string>;
  heroSubtitle: Record<SupportedLanguage, string>;
  description: Record<SupportedLanguage, string>;
  benefits: Record<SupportedLanguage, string[]>;
  recommendedMaterials: string[];
  leadTime: string;
  precision: string;
  metaTitle: Record<SupportedLanguage, string>;
  metaDescription: Record<SupportedLanguage, string>;
  metaKeywords: Record<SupportedLanguage, string>;
  faqs: Record<SupportedLanguage, SeoApplicationFaq[]>;
}

export const seoApplications: SeoApplication[] = [
  {
    slug: "vervangende-onderdelen-printen",
    key: "replacementParts",
    names: {
      nl: "Vervangende Onderdelen Printen",
      en: "Replacement Parts 3D Printing",
      tr: "Yedek Parça 3D Baskı",
      ru: "3D-печать запасных частей",
      ar: "طباعة ثلاثية الأبعاد لقطع الغيار",
    },
    tagline: {
      nl: "Kapot plastic onderdeel namaken of reserveonderdelen 3D-printen",
      en: "Reproduce broken plastic parts and discontinued components",
      tr: "Kırık plastik parçaları yeniden üretin veya yedek parça bastırın",
      ru: "Воспроизведение сломанных пластиковых деталей и снятых с производства компонентов",
      ar: "إعادة إنتاج الأجزاء البلاستيكية المكسورة والمكونات المتوقفة عن الإنتاج",
    },
    badge: {
      nl: "Reverse Engineering & Spare Parts",
      en: "Reverse Engineering & Spare Parts",
      tr: "Tersine Mühendislik ve Yedek Parçalar",
      ru: "Обратная разработка и запчасти",
      ar: "الهندسة العكسية وقطع الغيار",
    },
    heroTitle: {
      nl: "Vervangend Onderdeel 3D Printen & Namaken",
      en: "Replacement Part 3D Printing & Reproduction",
      tr: "Yedek Parça 3D Baskı ve Yeniden Üretim",
      ru: "3D-печать и воспроизведение запасных деталей",
      ar: "طباعة ثلاثية الأبعاد وإعادة إنتاج قطع الغيار",
    },
    heroSubtitle: {
      nl: "Is er een plastic onderdeel van een apparaat, machine, oldtimer of gereedschap afgebroken? Wij reproduceren niet meer leverbare onderdelen in slijtvast PETG of rubberachtig TPU.",
      en: "Broken plastic gear, clip, knob, or machine mount? We reproduce discontinued parts with high-strength PETG or impact-absorbing TPU delivered in 2-5 days.",
      tr: "Cihazınızda, makinenizde veya aletinizde kırık bir plastik parça mı var? Üretimi durdurulmuş parçaları dayanıklı PETG veya darbe emici TPU ile 2-5 günde üretiyoruz.",
      ru: "Сломалась пластиковая шестерня, клипса или крепление? Мы воспроизводим снятые с производства детали из прочного PETG или гибкого TPU за 2–5 дней.",
      ar: "هل انكسر جزء بلاستيكي في جهازك أو آلتك؟ نعيد إنتاج القطع غير المتوفرة باستخدام خامات PETG المتينة أو TPU المرن مع التوصيل خلال 2-5 أيام.",
    },
    description: {
      nl: "Voorkom het vervangen van complete apparaten door één enkel defect onderdeel. Met 3D-printen en reverse engineering maken we exacte replica's van gebroken kunststof tandwielen, behuizingsklemmen, handgrepen en industriële reserveonderdelen.",
      en: "Avoid replacing entire machines due to a single broken plastic component. We manufacture exact functional replicas of gears, clips, brackets, and machine components on demand.",
      tr: "Tek bir kırık parça yüzünden tüm cihazı çöpe atmayın. 3D baskı ve tersine mühendislik ile dişliler, klipsler, braketler ve makine parçalarının birebir işlevsel kopyalarını üretiyoruz.",
      ru: "Не заменяйте оборудование целиком из-за одной сломанной детали. С помощью 3D-печати и обратной разработки мы создаем точные функциональные копии шестерен, защелок и кронштейнов.",
      ar: "تجنب استبدال الأجهزة بالكامل بسبب قطعة بلاستيكية تالفة. من خلال الطباعة ثلاثية الأبعاد والهندسة العكسية، نصنع نسخاً طبق الأصل من التروس والمشابك وحوامل التثبيت.",
    },
    benefits: {
      nl: [
        "Geen minimale afname: van enkelstuks tot kleine series",
        "Slijtvast en hittebestendig PETG tot 75°C",
        "Flexibele pakkingen en stootranden in TPU rubber",
        "Direct online offerte en snelle PostNL bezorging",
      ],
      en: [
        "No minimum order quantity: from single units to batch runs",
        "Wear-resistant, high-strength PETG heat resistant up to 75°C",
        "Flexible rubber gaskets and impact bumpers in TPU",
        "Instant online quote calculation and fast 2-5 business days dispatch",
      ],
      tr: [
        "Minimum sipariş miktarı yok: tek adetten küçük serilere",
        "75°C'ye kadar ısıya dayanıklı, aşınmaya dirençli PETG",
        "TPU kauçuktan esnek contalar ve darbe emiciler",
        "Anında çevrimiçi fiyat teklifi ve 2-5 iş gününde kargo",
      ],
      ru: [
        "Без минимального заказа: от единичных деталей до мелких серий",
        "Износостойкий PETG, устойчивый к температуре до 75°C",
        "Гибкие уплотнители и амортизаторы из TPU",
        "Мгновенный онлайн-расчет стоимости и доставка за 2–5 рабочих дней",
      ],
      ar: [
        "لا يوجد حد أدنى للطلب: من قطعة واحدة إلى دفعات صغيرة",
        "خامة PETG مقاومة للتآكل والحرارة حتى 75 درجة مئوية",
        "حشوات ومصدات مرنة مصنوعة من مادة TPU المطاطية",
        "حساب فوري للتكلفة عبر الإنترنت وتسليم سريع خلال 2-5 أيام عمل",
      ],
    },
    recommendedMaterials: ["PETG", "TPU", "PLA"],
    leadTime: "2-5 werkdagen / business days",
    precision: "±0.1mm industriële tolerantie",
    metaTitle: {
      nl: "Vervangend Onderdeel 3D Printen | Kapot Plastic Namaken | Print My 3D",
      en: "Replacement Part 3D Printing | Reverse Engineering Parts | Print My 3D",
      tr: "Yedek Parça 3D Baskı | Kırık Plastik Parça Üretimi | Print My 3D",
      ru: "3D-печать запчастей | Восстановление пластиковых деталей | Print My 3D",
      ar: "طباعة ثلاثية الأبعاد لقطع الغيار | إعادة إنتاج القطع البلاستيكية | Print My 3D",
    },
    metaDescription: {
      nl: "Kapot plastic onderdeel namaken of reserveonderdeel 3D-printen? Upload je bestand of foto voor een directe offerte. Slijtvast PETG & TPU, snelle levering in Nederland.",
      en: "3D print replacement parts for appliances, tools, and machines. Upload your file for an instant quote. Durable PETG and flexible TPU with 2-5 days delivery.",
      tr: "Cihazlar ve makineler için yedek parça 3D baskısı. Dosyanızı veya fotoğrafınızı yükleyin, anında teklif alın. Dayanıklı PETG ve TPU ile 2-5 günde teslimat.",
      ru: "3D-печать запасных частей для техники и приборов. Загрузите файл или фото для мгновенного расчета. Прочный PETG и эластичный TPU с доставкой за 2–5 дней.",
      ar: "طباعة قطع غيار ثلاثية الأبعاد للأجهزة والآلات. ارفع ملفك أو صورتك للحصول على عرض سعر فوري. خامات PETG و TPU متينة مع توصيل سريع خلال 2-5 أيام.",
    },
    metaKeywords: {
      nl: "vervangend onderdeel 3D printen, kapot plastic onderdeel namaken, reserveonderdelen 3D printen, tandwiel 3D printen, reserveonderdeel namaken, reverse engineering 3D printen",
      en: "replacement part 3D printing, discontinued plastic parts 3D print, broken plastic repair, custom spare parts, 3D print broken bracket",
      tr: "yedek parça 3D baskı, kırık plastik parça yapımı, özel yedek parça üretimi, dişli 3D baskı, tersine mühendislik parça",
      ru: "3D-печать запчастей, восстановление сломанного пластика, печать деталей на заказ, печать шестерен 3D, обратная разработка деталей",
      ar: "طباعة قطع غيار 3D, تصنيع قطع بلاستيك بديلة, طباعة تروس ثلاثية الأبعاد, هندسة عكسية لقطع الغيار, تصنيع قطع غيار حسب الطلب",
    },
    faqs: {
      nl: [
        {
          q: "Hoe kan ik een kapot onderdeel namaken als ik geen 3D-bestand heb?",
          a: "Je kunt duidelijke foto's met afmetingen (liniaal of schuifmaat) opsturen via ons offerteformulier. We beoordelen direct of we het onderdeel kunnen modelleren (reverse engineering) en printen.",
        },
        {
          q: "Welk materiaal is het beste voor mechanische reserveonderdelen?",
          a: "Voor dragende onderdelen, beugels en tandwielen raden we PETG aan vanwege de hoge taaiheid en temperatuurbestendigheid. Voor afdichtingen en stootdempers gebruiken we flexibel TPU.",
        },
        {
          q: "Hoe wordt de offerte voor een vervangend onderdeel berekend?",
          a: "De offerte wordt berekend op basis van de afmetingen, het benodigde materiaal (zoals slijtvast PETG of flexibel TPU) en de productietijd. Upload je 3D-model of foto voor een directe offerte op maat.",
        },
      ],
      en: [
        {
          q: "How can I reproduce a broken component if I do not have a 3D model?",
          a: "You can submit clear photos with key dimensions (using calipers or a ruler) through our quote page. We evaluate whether our engineering team can model (reverse engineer) and print it.",
        },
        {
          q: "Which material is best for functional replacement components?",
          a: "For load-bearing brackets and mechanical gears, PETG is ideal due to its impact toughness and heat resistance. For seals and bumpers, flexible TPU rubber is recommended.",
        },
        {
          q: "How is the quote for a replacement part calculated?",
          a: "Quotes are calculated based on geometry, required material (such as wear-resistant PETG or flexible TPU), and production time. Upload your 3D model or sketch for an instant custom quote.",
        },
      ],
      tr: [
        {
          q: "3D modelim yoksa kırık bir parçayı nasıl yeniden üretebilirim?",
          a: "Teklif formumuz üzerinden parçanın kumpas veya cetvelle çekilmiş net fotoğraflarını gönderebilirsiniz. Ekibimiz parçayı 3D modelleyip (tersine mühendislik) basabileceğimizi inceler.",
        },
        {
          q: "Mekanik yedek parçalar için en uygun malzeme hangisidir?",
          a: "Yük taşıyan braketler ve mekanik dişliler için darbe dayanımı ve sıcaklık direnci nedeniyle PETG idealdir. Contalar ve tamponlar için esnek TPU kauçuk önerilir.",
        },
        {
          q: "Yedek parça için fiyat teklifi nasıl hesaplanır?",
          a: "Teklifler geometrik boyutlar, malzeme türü (örneğin dayanıklı PETG veya esnek TPU) ve üretim süresine göre hesaplanır. Anında teklif için 3D modelinizi veya çiziminizi yükleyin.",
        },
      ],
      ru: [
        {
          q: "Как воссоздать деталь, если у меня нет 3D-модели?",
          a: "Вы можете отправить четкие фотографии с размерами (рядом с линейкой или штангенциркулем) через форму расчета. Мы оценим возможность 3D-моделирования (обратной разработки) и печати.",
        },
        {
          q: "Какой материал лучше всего подходит для функциональных запчастей?",
          a: "Для нагруженных кронштейнов и шестерен оптимален PETG благодаря прочности и термостойкости. Для прокладок и амортизаторов рекомендуется эластичный TPU.",
        },
        {
          q: "Как рассчитывается стоимость изготовления запасной детали?",
          a: "Стоимость рассчитывается на основе размеров, выбранного материала (например, износостойкий PETG или эластичный TPU) и времени печати. Загрузите 3D-модель или эскиз для мгновенного расчета.",
        },
      ],
      ar: [
        {
          q: "كيف يمكنني إعادة تصنيع قطعة مكسورة إذا لم يكن لدي ملف 3D؟",
          a: "يمكنك إرسال صور واضحة مع الأبعاد (باستخدام فرجار أو مسطرة) عبر نموذج عرض السعر. يقوم فريقنا الهندسي بتقييم إمكانية النمذجة (الهندسة العكسية) والطباعة.",
        },
        {
          q: "ما هي أفضل مادة للأجزاء الميكانيكية البديلة؟",
          a: "بالنسبة للأذرع الحاملة والتروس الميكانيكية، يعتبر PETG خياراً مثالياً بفضل متانته ومقاومته للحرارة. أما للحشوات والمصدات، فنوصي باستخدام مطاط TPU المرن.",
        },
        {
          q: "كيف يتم حساب تكلفة طباعة قطعة الغيار؟",
          a: "يتم حساب التكلفة بناءً على الأبعاد الهندسية ونوع الخامة (مثل PETG المقاوم للتآكل أو TPU المرن) ووقت الإنتاج. ارفع نموذجك أو رسمك للحصول على سعر مخصص وفوري.",
        },
      ],
    },
  },
  {
    slug: "elektronica-behuizingen-op-maat",
    key: "enclosures",
    names: {
      nl: "Elektronica Behuizingen op Maat",
      en: "Custom Electronics Enclosures",
      tr: "Özel Elektronik Kutuları",
      ru: "Корпуса для электроники на заказ",
      ar: "صناديق أجهزة إلكترونية مخصصة",
    },
    tagline: {
      nl: "Maatwerk PCB casings, sensor mounts en DIN-rail behuizingen",
      en: "Custom PCB casings, sensor housings, and DIN-rail enclosures",
      tr: "Özel PCB kutuları, sensör muhafazaları ve DIN rayı kutuları",
      ru: "Индивидуальные корпуса для печатных плат, датчиков и DIN-реек",
      ar: "علب لوحات إلكترونية وحافظات أجهزة استشعار وعلب قضبان DIN",
    },
    badge: {
      nl: "Custom Enclosures & Mounts",
      en: "Custom Enclosures & Mounts",
      tr: "Özel Kutular ve Montaj Parçaları",
      ru: "Корпуса и монтажные крепления",
      ar: "صناديق مخصصة وحوامل تثبيت",
    },
    heroTitle: {
      nl: "Elektronica Behuizing 3D Printen op Maat",
      en: "Custom Electronics Enclosure 3D Printing",
      tr: "Özel Elektronik Kutusu 3D Baskı",
      ru: "3D-печать корпусов для электроники на заказ",
      ar: "طباعة صناديق إلكترونيات ثلاثية الأبعاد مخصصة",
    },
    heroSubtitle: {
      nl: "Perfect passende behuizingen voor printplaten (PCB), Raspberry Pi, ESP32, sensoren en industriële IoT-hardware met snap-fit deksels en schroefdraadinzetstukken.",
      en: "Precision-engineered enclosures for PCBs, IoT devices, Raspberry Pi, ESP32, and industrial hardware with snap-fit lids and brass threaded inserts.",
      tr: "PCB'ler, IoT cihazları, Raspberry Pi, ESP32 ve endüstriyel donanımlar için geçmeli kapaklar ve pirinç dişli somunlarla hassas üretilmiş kutular.",
      ru: "Высокоточные корпуса для печатных плат (PCB), устройств IoT, Raspberry Pi, ESP32 с защелкивающимися крышками и резьбовыми втулками.",
      ar: "علب مصممة بدقة للوحات الإلكترونية وأجهزة إنترنت الأشياء وRaspberry Pi وESP32 مع أغطية محكمة التثبيت ووصلات لولبية نحاسية.",
    },
    description: {
      nl: "Standaard behuizingen passen zelden exact. Met 3D-printen produceren we op maat gemaakte behuizingen inclusief kabeldoorvoeren, display-uitsparingen, ventilatiesleuven en montagelippen in vlamvertragende of hittebestendige materialen.",
      en: "Off-the-shelf project boxes rarely match custom PCBs. We manufacture tailored enclosures featuring custom connector cutouts, ventilation grills, mounting flanges, and heat-set inserts.",
      tr: "Standart hazır kutular özel devrelere nadiren uyar. 3D baskı ile konektör kesitleri, havalandırma delikleri ve montaj kulakçıkları içeren özel kutular üretiyoruz.",
      ru: "Готовые корпуса редко идеально подходят к платам. С помощью 3D-печати мы создаем корпуса с нужными разъемами, вентиляцией, монтажными фланцами и термореактивными втулками.",
      ar: "نادراً ما تتطابق العلب الجاهزة مع اللوحات الإلكترونية المخصصة. نقوم بتصنيع علب مخصصة تتضمن فتحات الموصلات وفتحات التهوية وحواف التثبيت.",
    },
    benefits: {
      nl: [
        "Exacte uitsparingen voor USB, HDMI, kabels en connectoren",
        "Ondersteuning voor messing schroefdraad (threaded heat-set inserts)",
        "Snap-fit of schroefdeksels met stofdichte passing",
        "Hittebestendig PETG voor continue belasting en voedingen",
      ],
      en: [
        "Precise cutouts for USB, power ports, antennas, and displays",
        "Support for brass threaded heat-set inserts (M2–M5)",
        "Snap-fit and screw-down lid options with snug tolerances",
        "Heat-resistant PETG suitable for internal electronics and power units",
      ],
      tr: [
        "USB, güç girişleri, antenler ve ekranlar için tam uyumlu kesimler",
        "Pirinç dişli ekler desteği (M2–M5 heat-set inserts)",
        "Geçmeli (snap-fit) ve vidalı kapak seçenekleri",
        "Dahili elektronikler ve güç kaynakları için ısıya dayanıklı PETG",
      ],
      ru: [
        "Точные вырезы под разъемы USB, питания, антенны и дисплеи",
        "Поддержка латунных резьбовых втулок (M2–M5)",
        "Варианты крышек на защелках (snap-fit) и винтах",
        "Термостойкий PETG, подходящий для компонентов с нагревом",
      ],
      ar: [
        "فتحات دقيقة لمنافذ USB والطاقة والهوائيات والشاشات",
        "دعم الوصلات اللولبية النحاسية المدمجة بالحرارة (M2–M5)",
        "خيارات إغلاق بالأقفال المرنة (Snap-fit) أو البراغي المحكمة",
        "خامة PETG مقاومة للحرارة ومناسبة لمصادر الطاقة والدوائر",
      ],
    },
    recommendedMaterials: ["PETG", "PLA", "TPU"],
    leadTime: "2-5 werkdagen / business days",
    precision: "±0.1mm passingstolerantie",
    metaTitle: {
      nl: "Elektronica Behuizing 3D Printen | PCB Casing op Maat | Print My 3D",
      en: "Custom Electronics Enclosure 3D Print | PCB Casing | Print My 3D",
      tr: "Elektronik Kutusu 3D Baskı | Özel PCB Kutusu | Print My 3D",
      ru: "3D-печать корпусов электроники | Корпуса для плат | Print My 3D",
      ar: "طباعة علب إلكترونيات ثلاثية الأبعاد | علب PCB مخصصة | Print My 3D",
    },
    metaDescription: {
      nl: "Elektronica behuizing op maat 3D-printen? Upload je CAD-bestand voor een directe offerte. Snap-fits, connector-uitsparingen en messing inserts in PETG.",
      en: "Custom 3D printed electronics enclosures and PCB cases. Upload your CAD/STEP model for an instant quote with connector cutouts and brass inserts.",
      tr: "Özel elektronik kutuları ve PCB kasaları 3D baskısı. CAD/STEP modelinizi yükleyin, konektör kesitleri ve pirinç insertlerle anında teklif alın.",
      ru: "Индивидуальная 3D-печать корпусов для электроники и печатных плат. Загрузите CAD/STEP модель для расчета с учетом вырезов и латунных резьб.",
      ar: "طباعة علب إلكترونية وصناديق للوحات الدوائر 3D حسب الطلب. ارفع نموذج CAD للحصول على تسعير فوري يشمل فتحات التوصيل والبراغي النحاسية.",
    },
    metaKeywords: {
      nl: "elektronica behuizing 3D printen, custom electronics enclosure, PCB casing 3D print, bevestigingsbeugel op maat, DIN rail behuizing printen, sensor mount 3D print",
      en: "custom electronics enclosure 3D print, PCB casing 3D print, custom mounts 3D printing, DIN rail enclosure, sensor housing 3D print",
      tr: "elektronik kutusu 3D baskı, PCB kutusu 3D, sensör muhafazası baskı, DIN ray kutusu, özel montaj parçası",
      ru: "3D-печать корпусов электроники, печать корпусов для плат, корпус для датчика 3D, крепление на DIN-рейку 3D",
      ar: "طباعة علب إلكترونيات ثلاثية الأبعاد, صناديق لوحات إلكترونية, طباعة علبة حساس 3D, علب مسار DIN ثلاثية الأبعاد",
    },
    faqs: {
      nl: [
        {
          q: "Kunnen jullie messing schroefdraad (threaded inserts) aanbrengen?",
          a: "Ja, we kunnen gaten ontwerpen voor M2, M3, M4 of M5 messing inserts en deze desgewenst insmelten voor herhaaldelijk vastschroeven zonder dat het plastic uitslijt.",
        },
        {
          q: "Is PETG geschikt voor warme elektronica componenten?",
          a: "Zeker. PETG behoudt zijn vorm tot ongeveer 75°C en biedt goede elektrische isolatie en vlamvertraging vergeleken met standaard PLA.",
        },
      ],
      en: [
        {
          q: "Do you install brass heat-set threaded inserts?",
          a: "Yes! We can dimension holes for M2, M3, M4, or M5 brass inserts and heat-press them for durable machine screws and repeated opening.",
        },
        {
          q: "Is PETG suitable for electronics generating heat?",
          a: "Yes. PETG retains dimensional stability up to approximately 75°C and provides excellent electrical insulation.",
        },
      ],
      tr: [
        {
          q: "Pirinç dişli somun (threaded inserts) montajı yapıyor musunuz?",
          a: "Evet! M2, M3, M4 veya M5 pirinç dişliler için delikler tasarlıyor ve defalarca sökülüp takılabilmesi için sıcak presleme ile uyguluyoruz.",
        },
        {
          q: "PETG ısı üreten elektronik bileşenler için uygun mudur?",
          a: "Evet. PETG yaklaşık 75°C'ye kadar boyutsal kararlılığını korur ve mükemmel elektrik yalıtımı sağlar.",
        },
      ],
      ru: [
        {
          q: "Устанавливаете ли вы латунные резьбовые втулки?",
          a: "Да! Мы закладываем отверстия под резьбу M2, M3, M4 или M5 и впаиваем латунные втулки для надежной фиксации и многократной сборки.",
        },
        {
          q: "Подходит ли PETG для греющейся электроники?",
          a: "Да. PETG сохраняет стабильность формы при температуре примерно до 75°C и обеспечивает отличную электроизоляцию.",
        },
      ],
      ar: [
        {
          q: "هل تقومون بتركيب وصلات لولبية نحاسية مدمجة (Threaded Inserts)؟",
          a: "نعم! نقوم بتصميم الثقوب بمقاسات M2 و M3 و M4 و M5 ونثبت الوصلات النحاسية بالحرارة لضمان متانة البراغي عند الفك والتركيب المتكرر.",
        },
        {
          q: "هل خامة PETG مناسبة للإلكترونيات التي تصدر حرارة؟",
          a: "نعم، يحافظ PETG على ثبات أبعاده حتى حرارة تقارب 75 درجة مئوية ويوفر عزلاً كهربائياً ممتازاً.",
        },
      ],
    },
  },
  {
    slug: "mallen-kalibers-jigs-fixtures",
    key: "jigsFixtures",
    names: {
      nl: "Mallen, Kalibers & Jigs Fixtures",
      en: "Molds, Jigs & Assembly Fixtures",
      tr: "Kalıplar, Mastarlar ve Montaj Aparatları",
      ru: "Оснастка, шаблоны и кондукторы (Jigs & Fixtures)",
      ar: "قوالب ومثبتات وأدوات التجميع الصناعية",
    },
    tagline: {
      nl: "Productiegereedschap, montagemallen en boorkalibers voor werkplaats en fabriek",
      en: "Tooling, assembly jigs, inspection fixtures, and drill guides",
      tr: "Atölye ve fabrika için üretim takımları, montaj fikstürleri ve delme mastarları",
      ru: "Инструментальная оснастка, сборочные кондукторы и шаблоны для сверления",
      ar: "أدوات الإنتاج ومثبتات التجميع وقوالب توجيه الحفر لورش العمل والمصانع",
    },
    badge: {
      nl: "Tooling, Jigs & Fixtures",
      en: "Tooling, Jigs & Fixtures",
      tr: "Takımlar, Mastarlar ve Fikstürler",
      ru: "Инструментальная оснастка и фиксаторы",
      ar: "الأدوات والمثبتات الصناعية",
    },
    heroTitle: {
      nl: "Mallen en Kalibers 3D Printen (Jigs & Fixtures)",
      en: "3D Printed Jigs, Fixtures & Manufacturing Tooling",
      tr: "3D Baskı Kalıplar ve Fikstürler (Jigs & Fixtures)",
      ru: "3D-печать кондукторов, фиксаторов и оснастки",
      ar: "طباعة قوالب ومثبتات صناعية ثلاثية الأبعاد",
    },
    heroSubtitle: {
      nl: "Versnel je assemblage- en inspectieprocessen met op maat gemaakte kalibers, montagemallen, gereedschapshouders en boorsjablonen binnen 2 tot 5 werkdagen.",
      en: "Speed up manufacturing, quality control, and assembly workflows with custom 3D printed jigs, inspection fixtures, and ergonomic tool mounts.",
      tr: "Özel 3D baskı mastarlar, kontrol fikstürleri ve montaj kılavuzları ile üretim ve kalite kontrol süreçlerinizi 2-5 iş gününde hızlandırın.",
      ru: "Ускорьте процессы сборки и контроля качества с помощью 3D-печатных шаблонов, кондукторов и калибров с готовностью за 2–5 рабочих дней.",
      ar: "سرّع عمليات التجميع وفحص الجودة باستخدام مثبتات وقوالب توجيه مخصصة مطبوعة ثلاثية الأبعاد خلال 2 إلى 5 أيام عمل.",
    },
    description: {
      nl: "Traditioneel frezen van productiemallen vergt vaak weken aan doorlooptijd. Met onze industriële 3D-print service produceren we direct slijtvaste mallen, laskalibers en montagesjablonen in PETG met ±0.1mm nauwkeurigheid.",
      en: "Traditional milling of assembly tooling often involves long lead times. Our high-precision FDM service produces rigid jigs, welding fixtures, and alignment gauges in days directly from your 3D files.",
      tr: "Üretim fikstürlerinin geleneksel CNC ile işlenmesi haftalar sürer. Endüstriyel FDM servisimizle doğrudan 3D modellerinizden ±0.1mm hassasiyette dayanıklı montaj aparatları ve kalıplar üretiyoruz.",
      ru: "Традиционное фрезерование оснастки требует недель. Наш FDM-сервис позволяет изготавливать прочные монтажные кондукторы, сварочные шаблоны и калибры за считанные дни с точностью ±0.1 мм.",
      ar: "يستغرق تشغيل أدوات الإنتاج التقليدية بالـ CNC أسابيع. مع خدمتنا الصناعية، ننتج قوالب تثبيت صلبة ونماذج توجيه دقيقة خلال أيام بدقة ±0.1 مم.",
    },
    benefits: {
      nl: [
        "Productietijd van weken teruggebracht naar 2-5 werkdagen",
        "Sterke PETG gereedschapshouders met hoge stijfheid",
        "Zachte TPU contactoppervlakken voorkomen krassen op kwetsbare delen",
        "Directe productie zonder frezen of fysieke spuitgietmatrijzen",
      ],
      en: [
        "Turnaround reduced from weeks to 2-5 business days",
        "Rigid, chemical-resistant PETG suitable for workshop shop floors",
        "Soft TPU contact pads available to avoid marring finished products",
        "Direct manufacturing without CNC setup or physical molds",
      ],
      tr: [
        "Haftalar süren tedarik süresi 2-5 iş gününe iner",
        "Atölye ortamına uygun, kimyasallara dayanıklı rijit PETG",
        "Hassas parçaların çizilmesini önleyen yumuşak TPU temas yüzeyleri",
        "CNC kurulumu veya kalıp maliyeti olmadan doğrudan üretim",
      ],
      ru: [
        "Сокращение сроков изготовления с недель до 2–5 рабочих дней",
        "Жесткий химически стойкий PETG для цеховых условий",
        "Мягкие накладки из TPU для защиты деликатных деталей от царапин",
        "Прямое производство без затрат на фрезеровку и литьевую оснастку",
      ],
      ar: [
        "تقليص مدة التسليم من أسابيع إلى 2-5 أيام عمل فقط",
        "خامة PETG صلبة ومقاومة للكيماويات والزيوت في بيئات العمل الصناعية",
        "أسطح ملامسة من TPU المرن لحماية القطع الحساسة من الخدش",
        "إنتاج مباشر بدون تكاليف تشغيل ماكينات أو قوالب سباكة معدنية",
      ],
    },
    recommendedMaterials: ["PETG", "TPU", "PLA"],
    leadTime: "2-5 werkdagen / business days",
    precision: "±0.1mm industriële herhaalnauwkeurigheid",
    metaTitle: {
      nl: "Mallen & Kalibers 3D Printen | Jigs & Fixtures Nederland | Print My 3D",
      en: "3D Printed Jigs & Fixtures | Tooling Manufacturing | Print My 3D",
      tr: "Kalıp ve Mastar 3D Baskı | Jigs & Fixtures | Print My 3D",
      ru: "3D-печать оснастки и шаблонов | Jigs & Fixtures | Print My 3D",
      ar: "طباعة مثبتات وقوالب صناعية 3D | Jigs & Fixtures | Print My 3D",
    },
    metaDescription: {
      nl: "Mallen en kalibers 3D-printen (jigs & fixtures)? Productiegereedschap, boorsjablonen en montagemallen in sterk PETG. Snelle levering en facturatie voor bedrijven.",
      en: "Custom 3D printed jigs, fixtures, and drill guides. Accelerate workshop production with high-precision PETG tooling delivered in 2-5 business days.",
      tr: "Özel 3D baskı mastarlar, fikstürler ve delme kılavuzları. 2-5 iş gününde teslim edilen yüksek hassasiyetli PETG aparatlarla atölye üretiminizi hızlandırın.",
      ru: "3D-печать сборочной оснастки, шаблонов и кондукторов для сверления. Повысьте скорость производства с помощью точной оснастки из PETG за 2–5 дней.",
      ar: "طباعة أدوات تثبيت وقوالب توجيه حفر ثلاثية الأبعاد مخصصة. حسّن كفاءة الإنتاج مع مثبتات PETG الدقيقة المسلّمة خلال 2-5 أيام عمل.",
    },
    metaKeywords: {
      nl: "mallen en kalibers 3D printen, jigs & fixtures Nederland, montagemallen 3D print, boorsjabloon printen, gereedschapshouders PETG, productiegereedschap 3D print",
      en: "3D printed jigs and fixtures, manufacturing tooling 3D print, custom drill guide, assembly fixture, industrial tooling replacement",
      tr: "kalıp mastar 3D baskı, jigs fixtures üretimi, montaj fikstürü 3D, delme mastarı baskı, endüstriyel aparat üretimi",
      ru: "3D-печать оснастки, изготовление кондукторов, сборочные шаблоны 3D, направляющие для сверления, промышленная оснастка 3D",
      ar: "طباعة قوالب ومثبتات 3D, مثبتات تجميع صناعية, قوالب توجيه حفر, أدوات تصنيع مخصصة, طباعة ملحقات الإنتاج",
    },
    faqs: {
      nl: [
        {
          q: "Hoe nauwkeurig zijn 3D-geprinte kalibers?",
          a: "Onze industriële FDM-printers zijn gekalibreerd voor toleranties tot ±0.1mm, ruim voldoende voor montagemallen, inspectiemallen en boorgeleidingen.",
        },
        {
          q: "Zijn de mallen bestand tegen oliën en chemicaliën op de werkvloer?",
          a: "PETG biedt uitstekende chemische resistentie tegen smeermiddelen, oliën en milde reinigingsmiddelen die in machinewerkplaatsen voorkomen.",
        },
      ],
      en: [
        {
          q: "What tolerances can be achieved on 3D printed assembly fixtures?",
          a: "Our tuned FDM systems achieve tolerances within ±0.1mm, ideal for quality control gauges, drill templates, and assembly fixtures.",
        },
        {
          q: "Are the fixtures resistant to oils and workshop chemicals?",
          a: "PETG exhibits high chemical resistance against oils, greases, and standard industrial cleaning solvents.",
        },
      ],
      tr: [
        {
          q: "3D baskı mastarlar ve fikstürler ne kadar hassastır?",
          a: "Endüstriyel FDM sistemlerimiz ±0.1mm tolerans aralığında kalibre edilmiştir; montaj kalıpları, kalite kontrol mastarları ve delme kılavuzları için mükemmeldir.",
        },
        {
          q: "Aparatlar atölyedeki yağ ve kimyasallara dayanıklı mıdır?",
          a: "PETG; atölyelerde yaygın olarak bulunan yağlara, greslere ve standart endüstriyel temizlik solventlerine karşı yüksek kimyasal direnç gösterir.",
        },
      ],
      ru: [
        {
          q: "Какова точность изготовления 3D-печатной оснастки?",
          a: "Наши FDM-принтеры откалиброваны для обеспечения допусков в пределах ±0.1 мм, что отлично подходит для сборочных кондукторов и контрольных калибров.",
        },
        {
          q: "Устойчивы ли фиксаторы к маслам и техническим жидкостям?",
          a: "PETG обладает высокой химической стойкостью к маслам, смазкам и стандартным промышленным моющим средствам.",
        },
      ],
      ar: [
        {
          q: "ما مدى دقة قوالب ومثبتات التجميع المطبوعة ثلاثية الأبعاد؟",
          a: "تتم معايرة طابعاتنا الصناعية لتحقيق تفاوتات دقيقة ضمن حدود ±0.1 مم، وهو ما يلبي تماماً معايير مثبتات التجميع وأدوات الفحص.",
        },
        {
          q: "هل المثبتات مقاومة للزيوت والمواد الكيميائية في ورش العمل؟",
          a: "تتميز خامة PETG بمقاومة كيميائية عالية للزيوت والشحوم ومواد التنظيف الصناعية الشائعة.",
        },
      ],
    },
  },
  {
    slug: "rapid-prototyping-kunststof",
    key: "prototyping",
    names: {
      nl: "Rapid Prototyping Kunststof",
      en: "Rapid Plastic Prototyping",
      tr: "Hızlı Plastik Prototipleme",
      ru: "Быстрое прототипирование из пластика",
      ar: "النماذج الأولية البلاستيكية السريعة",
    },
    tagline: {
      nl: "Functionele prototypes, CAD/STEP validatie en nulserie pre-productie",
      en: "Functional prototypes, STEP/CAD validation, and pilot run production",
      tr: "İşlevsel prototipler, CAD/STEP doğrulaması ve ön seri üretim",
      ru: "Функциональные прототипы, валидация CAD/STEP и мелкосерийное производство",
      ar: "نماذج أولية وظيفية، التحقق من ملفات CAD/STEP وإنتاج الدفعات التجريبية",
    },
    badge: {
      nl: "Engineering & Prototyping",
      en: "Engineering & Prototyping",
      tr: "Mühendislik ve Prototipleme",
      ru: "Инжиниринг и прототипирование",
      ar: "الهندسة وتطوير النماذج الأولية",
    },
    heroTitle: {
      nl: "Rapid Prototyping Kunststof in Nederland",
      en: "Rapid Plastic Prototyping in the Netherlands",
      tr: "Hollanda'da Hızlı Plastik Prototipleme",
      ru: "Быстрое прототипирование из пластика в Нидерландах",
      ar: "خدمات النماذج الأولية البلاستيكية السريعة في هولندا",
    },
    heroSubtitle: {
      nl: "Zet je CAD- of STEP-model direct om in een tastbaar, functioneel prototype. Valideer ergonomie, passing en sterkte binnen 2 tot 5 werkdagen vóór kostbare serieproductie.",
      en: "Convert CAD and STEP files into physical, functional prototypes. Test form, fit, and mechanical performance within 2 to 5 business days before tooling up.",
      tr: "CAD ve STEP modellerinizi doğrudan işlevsel prototiplere dönüştürün. Pahalı seri üretime geçmeden önce ergonomi, uyum ve mekanik performansı 2 ila 5 iş gününde doğrulayın.",
      ru: "Превратите файлы CAD и STEP в реальные функциональные прототипы. Проверьте форму, посадку и прочность за 2–5 рабочих дней до запуска в серию.",
      ar: "حوّل ملفات CAD و STEP إلى نماذج حقيقية وعملية. اختبر الملاءمة والأداء الميكانيكي خلال 2 إلى 5 أيام عمل قبل الاستثمار في خطوط الإنتاج الكبيرة.",
    },
    description: {
      nl: "Van eerste vormstudie tot mechanisch geteste nulserie: onze FDM rapid prototyping service ondersteunt ingenieursbureaus, startup hardware-ontwikkelaars en machinebouwers met snelle iteraties en zakelijke facturatie.",
      en: "From initial concept validation to functional pilot series: we support product development teams and machine builders with fast turnaround iterations and B2B invoicing.",
      tr: "İlk konsept doğrulamasından işlevsel pilot serilere kadar: FDM hızlı prototipleme servisimiz, hızlı teslimat ve kurumsal faturalandırma ile mühendislik ekiplerine ve makine üreticilerine destek sağlar.",
      ru: "От первой проверки концепции до функциональной пилотной серии: наш сервис FDM-прототипирования помогает инженерам и разработчикам оборудования благодаря быстрым итерациям и официальным счетам.",
      ar: "من التحقق الأولي من الفكرة إلى إنتاج الدفعات التجريبية: تدعم خدمتنا فرق التصميم الهندسي ومطوري الأجهزة بتكرارات سريعة وفواتير تجارية رسمية.",
    },
    benefits: {
      nl: [
        "Ondersteunt directe upload van STEP-, 3MF- en STL-bestanden",
        "Vertrouwelijke behandeling van alle geüploade 3D-bestanden",
        "Geen minimale afname: van 1 stuk tot 500+ pre-productie eenheden",
        "Officiële BTW-factuur voor bedrijven en instellingen",
      ],
      en: [
        "Direct upload support for STEP, 3MF, and STL models",
        "Strict confidentiality for all uploaded designs and IP",
        "No minimum order quantity: test 1 part or launch a 500-unit pilot batch",
        "Official commercial VAT invoice with corporate payment terms",
      ],
      tr: [
        "STEP, 3MF ve STL modelleri için doğrudan yükleme desteği",
        "Yüklenen tüm tasarımlar ve fikri mülkiyet için sıkı gizlilik",
        "Minimum sipariş miktarı yok: 1 parçadan 500+ pilot partiye",
        "Şirketler ve kurumlar için resmi KDV faturası",
      ],
      ru: [
        "Прямая загрузка файлов STEP, 3MF и STL",
        "Строгая конфиденциальность загруженных чертежей и интеллектуальной собственности",
        "Без минимального заказа: от 1 прототипа до партии в 500+ штук",
        "Официальный счет-фактура с НДС для юридических лиц",
      ],
      ar: [
        "دعم الرفع المباشر لملفات STEP و 3MF و STL",
        "سرية تامة لجميع التصاميم وحقوق الملكية الفكرية المرفوعة",
        "لا يوجد حد أدنى للطلب: اختبر قطعة واحدة أو أنتج دفعة تجريبية بأكثر من 500 قطعة",
        "فاتورة ضريبية رسمية للشركات والمؤسسات",
      ],
    },
    recommendedMaterials: ["PLA", "PETG", "TPU"],
    leadTime: "2-5 werkdagen / business days",
    precision: "±0.1mm industriële tolerantie",
    metaTitle: {
      nl: "Rapid Prototyping Nederland | Kunststof Prototypes 3D Printen | Print My 3D",
      en: "Rapid Prototyping Netherlands | Functional 3D Prints | Print My 3D",
      tr: "Hızlı Prototipleme | Plastik Prototip 3D Baskı | Print My 3D",
      ru: "Быстрое прототипирование | 3D-печать пластиковых прототипов | Print My 3D",
      ar: "نماذج أولية سريعة | طباعة نماذج بلاستيكية ثلاثية الأبعاد | Print My 3D",
    },
    metaDescription: {
      nl: "Rapid prototyping service in Nederland voor ingenieurs en productontwikkelaars. Upload STEP/STL voor een directe offerte op functionele kunststof prototypes.",
      en: "Rapid prototyping service in the Netherlands for product designers and engineers. Upload STEP/STL models for an instant custom quote on functional plastic prototypes.",
      tr: "Mühendisler ve ürün tasarımcıları için hızlı prototipleme servisi. İşlevsel plastik prototipler için STEP/STL yükleyip anında özel teklif alın.",
      ru: "Быстрое прототипирование для инженеров и разработчиков. Загрузите файлы STEP/STL для мгновенного расчета стоимости функциональных прототипов.",
      ar: "خدمة النماذج الأولية السريعة للمصممين والمهندسين في هولندا. ارفع ملفات STEP/STL للحصول على عرض سعر فوري للنماذج الوظيفية.",
    },
    metaKeywords: {
      nl: "rapid prototyping Nederland, functioneel kunststof prototype, zakelijk 3D printen, CAD STEP model laten printen, nulserie pre-productie, product prototype laten maken",
      en: "rapid prototyping services, B2B 3D printing service Netherlands, functional plastic prototypes, STEP CAD file manufacturing, small batch rapid prototyping",
      tr: "hızlı prototipleme, işlevsel plastik prototip, kurumsal 3D baskı, STEP CAD model üretimi, küçük seri prototip",
      ru: "быстрое прототипирование, функциональные прототипы из пластика, 3D-печать для бизнеса, печать моделей STEP CAD, опытная партия",
      ar: "خدمات النماذج الأولية السريعة, طباعة 3D للشركات, نماذج بلاستيكية وظيفية, تصنيع ملفات STEP CAD, إنتاج دفعات صغيرة",
    },
    faqs: {
      nl: [
        {
          q: "Kan ik direct een STEP- of CAD-assemblage uploaden voor prototyping?",
          a: "Ja, ons platform accepteert STEP-, STP-, STL- en 3MF-bestanden. We controleren wanddiktes en passingen direct in onze software.",
        },
        {
          q: "Worden mijn geüploade 3D-bestanden vertrouwelijk behandeld?",
          a: "Ja, alle bestanden en ontwerpen worden strikt vertrouwelijk behandeld en uitsluitend gebruikt voor de productie van jouw order.",
        },
      ],
      en: [
        {
          q: "Can I upload a STEP assembly directly for prototyping?",
          a: "Yes! Our platform supports STEP, STP, STL, and 3MF files. We analyze wall thickness, overhangs, and fits directly.",
        },
        {
          q: "Are my uploaded 3D files kept confidential?",
          a: "Yes, all models and project designs are treated with strict confidentiality and used solely to fulfill your order.",
        },
      ],
      tr: [
        {
          q: "Prototipleme için doğrudan bir STEP veya CAD montaj dosyası yükleyebilir miyim?",
          a: "Evet! Platformumuz STEP, STP, STL ve 3MF dosyalarını kabul eder. Et kalınlıklarını ve geçme paylarını doğrudan yazılımımızda analiz ediyoruz.",
        },
        {
          q: "Yüklediğim 3D dosyalar gizli tutuluyor mu?",
          a: "Evet, tüm modeller ve proje tasarımları kesin bir gizlilikle ele alınır ve yalnızca siparişinizi üretmek amacıyla kullanılır.",
        },
      ],
      ru: [
        {
          q: "Можно ли напрямую загрузить сборку STEP или CAD для прототипирования?",
          a: "Да! Наша платформа поддерживает форматы STEP, STP, STL и 3MF. Мы напрямую анализируем толщину стенок, нависания и сопряжения деталей.",
        },
        {
          q: "Гарантируется ли конфиденциальность загруженных 3D-файлов?",
          a: "Да, все файлы и чертежи являются строго конфиденциальными и используются исключительно для выполнения вашего заказа.",
        },
      ],
      ar: [
        {
          q: "هل يمكنني رفع ملف تجميع STEP أو CAD مباشرة لإنتاج نموذج أولي؟",
          a: "نعم! تدعم منصتنا ملفات STEP و STP و STL و 3MF، حيث نقوم بتحليل سماكة الجدران والتفاوتات والتطابق تلقائياً.",
        },
        {
          q: "هل يتم التعامل مع ملفاتي ثلاثية الأبعاد بسرية؟",
          a: "نعم، تخضع جميع النماذج والتصاميم لسرية صارمة وتُستخدم فقط لتنفيذ طلبك.",
        },
      ],
    },
  },
];

export function getApplicationName(
  app: SeoApplication,
  lang: SupportedLanguage,
): string {
  return app.names[lang] || app.names.nl || app.names.en;
}

export function getSeoApplicationBySlug(slug: string): SeoApplication | undefined {
  const normalized = slug.trim().toLowerCase();
  return seoApplications.find((app) => app.slug === normalized);
}

export function getAllApplicationSlugs(): string[] {
  return seoApplications.map((app) => app.slug);
}
