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
                ["en"] = "What type of 3D files do you accept?",
                ["tr"] = "Hangi 3D dosya formatlarını kabul ediyorsunuz?",
                ["ru"] = "Какие форматы 3D-файлов поддерживаются?",
                ["ar"] = "ما هي صيغ ملفات 3D المدعومة؟"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "We accepteren de meest gangbare 3D-bestanden: .STL, .OBJ en .3MF. Daarnaast ondersteunen we ook STEP- en STP-assemblages. Als je een ander bestandstype hebt vanuit je CAD-software, kun je meestal exporteren naar .STL of .STEP.",
                ["en"] = "We accept the most common 3D files: .STL, .OBJ, and .3MF. We also support STEP and STP CAD assemblies. If you have a different file type from your design software, you can usually use Export or Save As to convert it.",
                ["tr"] = "En yaygın 3D dosya türlerini kabul ediyoruz: .STL, .OBJ ve .3MF. Ayrıca STEP ve STP CAD montajlarını da destekliyoruz. Tasarım yazılımınızda farklı bir format varsa, genellikle .STL veya .STEP olarak dışa aktarabilirsiniz.",
                ["ru"] = "Мы принимаем самые распространенные форматы 3D-файлов: .STL, .OBJ и .3MF. Также поддерживаются CAD-сборки STEP и STP. Если в вашей CAD-программе другой формат, обычно его можно экспортировать в .STL или .STEP.",
                ["ar"] = "نقبل أكثر صيغ الملفات ثلاثية الأبعاد شيوعاً: STL و OBJ و 3MF. كما ندعم ملفات وتجميعات CAD بصيغتي STEP و STP. إذا كان لديك تنسيق ملف مختلف من برنامج التصميم، يمكنك عادة تصديره إلى STL أو STEP."
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
                ["en"] = "How is a custom 3D print quote calculated?",
                ["tr"] = "Özel 3D baskı teklifi nasıl hesaplanır?",
                ["ru"] = "Как рассчитывается стоимость 3D-печати?",
                ["ar"] = "كيف يتم حساب عرض سعر الطباعة ثلاثية الأبعاد؟"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "De offerte wordt transparant berekend op basis van de exacte afmetingen, het benodigde filamentvolume in grammen en het gekozen materiaal (zoals PLA, PETG of TPU). Upload je bestand voor een directe berekening.",
                ["en"] = "Quotes are calculated based on model dimensions, infill percentage, and chosen material. Upload your file in our configurator for an instant, transparent quote.",
                ["tr"] = "Fiyat teklifleri; model boyutları, doluluk oranı ve seçilen malzemeye göre şeffaf bir şekilde hesaplanır. Anında net teklif almak için dosyanızı konfigüratörümüze yükleyin.",
                ["ru"] = "Стоимость рассчитывается прозрачно на основе точных размеров модели, процента заполнения и выбранного материала (PLA, PETG или TPU). Загрузите файл в наш конфигуратор для мгновенного расчета.",
                ["ar"] = "يتم حساب عروض الأسعار بشفافية بناءً على أبعاد النموذج، ونسبة الحشو، والمواد المختارة (مثل PLA أو PETG أو TPU). ارفع ملفك في أداة التهيئة للحصول على عرض سعر فوري وواضح."
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
                ["en"] = "How long will it take to get my item?",
                ["tr"] = "3D baskımı ne kadar sürede teslim alabilirim?",
                ["ru"] = "Как быстро я получу свою 3D-печать?",
                ["ar"] = "كم من الوقت يستغرق استلام طلبي المطبوع؟"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "De meeste orders worden binnen 2 tot 5 werkdagen geprint en verzonden via PostNL met track & trace door heel Nederland en België.",
                ["en"] = "Usually we print and ship within 2 to 5 business days using tracked PostNL delivery across the Netherlands and Belgium.",
                ["tr"] = "Siparişlerin çoğu 2 ila 5 iş günü içinde basılır ve PostNL takip numarası ile Hollanda ve Belçika genelinde gönderilir.",
                ["ru"] = "Большинство заказов печатаются и отправляются в течение 2–5 рабочих дней с отслеживанием PostNL по всей территории Нидерландов и Бельгии.",
                ["ar"] = "تتم طباعة وشحن معظم الطلبات في غضون 2 إلى 5 أيام عمل مع تتبع PostNL في جميع أنحاء هولندا وبلجيكا."
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
                ["en"] = "I have an idea but no 3D file. Can you help?",
                ["tr"] = "Bir fikrim var ama 3D dosyam yok. Yardımcı olabilir misiniz?",
                ["ru"] = "У меня есть идея, но нет 3D-файла. Вы можете помочь?",
                ["ar"] = "لدي فكرة ولكن ليس لدي ملف ثلاثي الأبعاد. هل يمكنكم المساعدة؟"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Zeker! Stuur duidelijke foto's of schetsen met afmetingen naar ons en we kunnen helpen met 3D-modellering of reverse engineering.",
                ["en"] = "Yes. Share sketches, photos, or reference dimensions and we can help model (reverse engineer) a 3D printable file.",
                ["tr"] = "Kesinlikle! Çizimlerinizi, fotoğraflarınızı veya referans ölçülerinizi bizimle paylaşın; 3D baskıya uygun modelleme (tersine mühendislik) konusunda yardımcı olalım.",
                ["ru"] = "Конечно! Отправьте нам четкие фотографии или эскизы с размерами, и мы поможем создать 3D-модель (реверс-инжиниринг) для печати.",
                ["ar"] = "بالتأكيد! أرسل رسومات أو صوراً واضحة مع الأبعاد المرجعية ويمكننا مساعدتك في النمذجة ثلاثية الأبعاد أو الهندسة العكسية لإنتاج ملف قابل للطباعة."
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
                ["en"] = "Are printed parts food-safe?",
                ["tr"] = "Basılan parçalar gıdaya uygun mu?",
                ["ru"] = "Безопасны ли напечатанные детали для контакта с пищей?",
                ["ar"] = "هل الأجزاء المطبوعة ثلاثية الأبعاد آمنة مع الأغذية؟"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Standaard 3D-prints hebben microscopische laaglijnen waarin bacteriën zich kunnen nestelen. Direct contact met onverpakt voedsel wordt afgeraden, tenzij behandeld met een voedselveilige epoxy coating.",
                ["en"] = "Standard printed plastics are usually not recommended for direct food contact due to microscopic layer lines. Food-safe epoxy finishing can be applied when necessary.",
                ["tr"] = "Standart 3D baskılar, bakterilerin birikebileceği mikroskobik katman çizgilerine sahiptir. Gıdaya uygun epoksi kaplama uygulanmadıkça doğrudan gıda teması önerilmez.",
                ["ru"] = "Стандартные пластиковые детали не рекомендуются для прямого контакта с неупакованной пищей из-за микроскопических слоев. При необходимости можно нанести специальное пищевое эпоксидное покрытие.",
                ["ar"] = "لا يُنصح بالاتصال المباشر للمطبوعات البلاستيكية القياسية بالأطعمة غير المغلفة بسبب خطوط الطبقات المجهرية. يمكن تطبيق طلاء إيبوكسي آمن غذائياً عند الحاجة."
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
                ["en"] = "What if my print arrives damaged?",
                ["tr"] = "Baskım hasarlı ulaşırsa ne olur?",
                ["ru"] = "Что делать, если заказ пришел поврежденным?",
                ["ar"] = "ماذا لو وصل طلبي المطبوع تالفاً؟"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Mocht je pakket tijdens transport beschadigd raken, stuur ons binnen 3 dagen foto's van de verpakking en het printmodel. Wij printen en verzenden kosteloos een vervangend exemplaar.",
                ["en"] = "If your item arrives damaged in transit, send a photo within 3 days and we will reprint and reship it at no extra charge.",
                ["tr"] = "Ürününüz taşıma sırasında hasar görürse, 3 gün içinde ambalaj ve ürün fotoğraflarını gönderin; hiçbir ek ücret talep etmeden yeniden basıp gönderelim.",
                ["ru"] = "Если посылка повреждена при транспортировке, отправьте фото упаковки и детали в течение 3 дней, и мы бесплатно перепечатаем и повторно отправим заказ.",
                ["ar"] = "إذا تعرض طلبك للتلف أثناء الشحن، أرسل صوراً للطرد والقطعة المطبوعة خلال 3 أيام وسنعيد طباعته وشحنه مجاناً دون أي تكلفة إضافية."
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
                ["en"] = "Can I upload and print STEP, CAD, or Fusion 360 files?",
                ["tr"] = "STEP, CAD veya Fusion 360 dosyalarını yükleyip bastırabilir miyim?",
                ["ru"] = "Можно ли загрузить файлы STEP, CAD или Autodesk Fusion 360?",
                ["ar"] = "هل يمكنني رفع وطباعة ملفات STEP أو CAD أو Fusion 360؟"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Ja, absoluut! Naast STL en 3MF ondersteunen we STEP- en STP-bestanden uit SolidWorks, Autodesk Fusion 360 of Inventor voor maximale tolerantie-nauwkeurigheid.",
                ["en"] = "Yes, absolutely! Along with STL, OBJ, and 3MF files, we accept STEP, STP, and CAD exports from software like Autodesk Fusion 360 or SolidWorks with up to ±0.1mm tolerance.",
                ["tr"] = "Evet, kesinlikle! STL, OBJ ve 3MF dosyalarının yanı sıra SolidWorks veya Autodesk Fusion 360 gibi yazılımlardan alınan STEP ve STP dosyalarını da ±0.1mm hassasiyetle kabul ediyoruz.",
                ["ru"] = "Да, безусловно! Наряду с STL, OBJ и 3MF мы принимаем экспорт STEP и STP из SolidWorks, Autodesk Fusion 360 или Inventor с промышленной точностью до ±0.1 мм.",
                ["ar"] = "نعم بكل تأكيد! إلى جانب ملفات STL و OBJ و 3MF، نقبل ملفات STEP و STP وتصديرات CAD من برامج مثل Fusion 360 و SolidWorks بدقة تصل إلى ±0.1 مم."
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
                ["en"] = "How is the quote for 3D printing a replacement part calculated?",
                ["tr"] = "Yedek parça 3D baskı teklifi nasıl hesaplanır?",
                ["ru"] = "Как рассчитывается стоимость изготовления запасной детали?",
                ["ar"] = "كيف يتم حساب عرض السعر لطباعة قطعة غيار بديلة؟"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Het reproduceren van reserveonderdelen of kapotte plastic onderdelen wordt berekend op basis van geometrie, gekozen materiaal (zoals slijtvast PETG of flexibel TPU) en productietijd.",
                ["en"] = "Reproducing broken plastic parts or discontinued replacement components is calculated based on geometry, required material, and production time.",
                ["tr"] = "Kırık plastik parçaların veya üretimi durdurulmuş yedek parçaların yeniden üretimi; geometri, gerekli malzeme (aşınmaya dayanıklı PETG veya esnek TPU gibi) ve üretim süresine göre hesaplanır.",
                ["ru"] = "Воспроизведение сломанных пластиковых деталей или снятых с производства компонентов рассчитывается на основе геометрии, выбранного материала (прочный PETG или гибкий TPU) и времени производства.",
                ["ar"] = "يتم حساب إعادة إنتاج الأجزاء البلاستيكية المكسورة أو قطع الغيار غير المتوفرة بناءً على الهندسة، والمواد المطلوبة (مثل PETG المقاوم للتآكل أو TPU المرن)، ووقت الإنتاج."
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
                ["en"] = "Can you print custom electronics enclosures, PCB cases, and mounts?",
                ["tr"] = "Özel elektronik muhafazaları, PCB kutuları ve montaj aparatları basabilir misiniz?",
                ["ru"] = "Печатаете ли вы корпуса для электроники, печатных плат (PCB) и крепления на заказ?",
                ["ar"] = "هل يمكنكم طباعة أغطية وحافظات مخصصة للإلكترونيات ولوحات الدوائر (PCB)؟"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Ja! We zijn gespecialiseerd in PCB casings, sensor mounts en DIN-rail behuizingen in vlamvertragend of hittebestendig PETG inclusief optionele messing schroefdraad (threaded inserts).",
                ["en"] = "Yes! We specialize in custom electronics enclosures, PCB cases, sensor mounts, and mounting brackets in heat-resistant PETG with brass heat-set inserts.",
                ["tr"] = "Evet! Isıya dayanıklı PETG ile pirinç dişli ekleri (threaded inserts) içeren PCB kutuları, sensör yuvaları ve DIN rayı muhafazaları konusunda uzmanız.",
                ["ru"] = "Да! Мы специализируемся на изготовлении корпусов для печатных плат, датчиков и DIN-реек из термостойкого PETG с латунными резьбовыми вставками.",
                ["ar"] = "نعم! نحن متخصصون في علب لوحات الدوائر الإلكترونية وحوامل الحساسات وحاويات سكك DIN باستخدام بلاستيك PETG المقاوم للحرارة مع إمكانية تثبيت مسامير لولبية نحاسية مدمجة."
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
                ["en"] = "What is the difference between PETG and flexible TPU 3D printing?",
                ["tr"] = "PETG ile esnek TPU 3D baskı arasındaki fark nedir?",
                ["ru"] = "В чем разница между 3D-печатью из PETG и гибкого TPU?",
                ["ar"] = "ما الفرق بين الطباعة باستخدام PETG و TPU المرن؟"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "PETG is slagvast, vormvast tot 75°C en chemisch resistent voor dragende delen. TPU is een elastisch, rubberachtig materiaal ideaal voor stootranden, pakkingen en trillingsdempers.",
                ["en"] = "PETG provides high tensile strength, heat resistance up to ~75°C, and impact toughness for structural parts. TPU is an elastic, rubber-like filament ideal for shock absorbers, gaskets, and seals.",
                ["tr"] = "PETG; yüksek gerilme direnci, ~75°C'ye kadar ısı dayanımı ve darbe dayanıklılığı sunarak yapısal parçalar için idealdir. TPU ise kauçuk benzeri elastik yapısıyla conta, sönümleyici ve darbe emiciler için uygundur.",
                ["ru"] = "PETG обеспечивает высокую прочность, термостойкость до ~75°C и химическую стойкость для несущих элементов. TPU — это эластичный резиноподобный материал, идеальный для амортизаторов, прокладок и уплотнителей.",
                ["ar"] = "يوفر PETG قوة شد عالية ومقاومة للحرارة حتى 75 درجة مئوية ومقاومة للصدمات للأجزاء الهيكلية. أما TPU فهو مادة مرنة تشبه المطاط مثالية لامتصاص الصدمات والحشيات وموانع التسرب."
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
                ["en"] = "Do you offer small-batch 3D printing and rapid prototyping for businesses?",
                ["tr"] = "İşletmeler için küçük seri üretim ve hızlı prototipleme sunuyor musunuz?",
                ["ru"] = "Предлагаете ли вы мелкосерийное производство и быстрое прототипирование для бизнеса?",
                ["ar"] = "هل تقدمون خدمات النماذج الأولية السريعة والإنتاج للدفعات الصغيرة للشركات؟"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Ja! We produceren van 1 stuk tot 500+ pre-productie eenheden voor ingenieurs, machinebouwers en productontwikkelaars, inclusief officiële BTW-factuur.",
                ["en"] = "Yes! We provide short-run FDM manufacturing and small-batch production from 1 to 500+ units across the Netherlands with commercial B2B invoicing.",
                ["tr"] = "Evet! Hollanda ve genelinde mühendisler ve ürün geliştiriciler için 1 adetten 500+ adede kadar küçük seri üretim ve B2B ticari KDV faturası sağlıyoruz.",
                ["ru"] = "Да! Мы выполняем мелкосерийное производство от 1 до 500+ единиц для инженеров и разработчиков оборудования с официальным выставлением счетов B2B с учетом НДС.",
                ["ar"] = "نعم! نقدم تصنيع الدفعات الصغيرة والنماذج الأولية من قطعة واحدة إلى أكثر من 500 وحدة للمهندسين والمصنعين مع فواتير ضريبية رسمية للشركات."
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
                ["en"] = "Can I order a 3D print directly from Thingiverse, Printables, or MakerWorld?",
                ["tr"] = "Thingiverse, Printables veya MakerWorld'den bir tasarımı doğrudan bastırabilir miyim?",
                ["ru"] = "Можно ли заказать печать модели напрямую с Thingiverse, Printables или MakerWorld?",
                ["ar"] = "هل يمكنني طلب طباعة تصميم مباشرة من Thingiverse أو Printables أو MakerWorld؟"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Absoluut! Download eenvoudig het .STL- of .3MF-bestand van MakerWorld, Printables of Thingiverse en upload het in onze configurator voor een directe offerte.",
                ["en"] = "Absolutely! Found a great design on MakerWorld, Printables, or Thingiverse? Just download the .STL or .3MF file and upload it to our quote tool for instant slicing.",
                ["tr"] = "Kesinlikle! MakerWorld, Printables veya Thingiverse'de bulduğunuz .STL veya .3MF dosyasını indirin ve anında fiyatlandırma için teklif aracımıza yükleyin.",
                ["ru"] = "Конечно! Нашли отличную модель на MakerWorld, Printables или Thingiverse? Просто скачайте файл .STL или .3MF и загрузите его в наш калькулятор для мгновенного расчета.",
                ["ar"] = "بالتأكيد! هل وجدت تصميماً رائعاً على MakerWorld أو Printables أو Thingiverse؟ ما عليك سوى تنزيل ملف STL أو 3MF ورفعه في أداة عروض الأسعار لدينا لتقطيعه وحسابه فوراً."
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
                ["en"] = "Can businesses order on invoice with a VAT breakdown?",
                ["tr"] = "İşletmeler KDV ayrıntılı fatura ile sipariş verebilir mi?",
                ["ru"] = "Могут ли компании заказывать по счету с детализацией НДС?",
                ["ar"] = "هل يمكن للشركات الطلب بموجب فاتورة ضريبية مفصلة؟"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Ja, we leveren aan bedrijven en instellingen met een duidelijke gespecificeerde factuur inclusief BTW en KvK-gegevens voor de bedrijfsadministratie.",
                ["en"] = "Yes, we support corporate invoice billing for companies and institutions. Every B2B order comes with a formal VAT invoice with company details.",
                ["tr"] = "Evet, şirketler ve kurumlar için kurumsal faturalı siparişleri destekliyoruz. Her B2B siparişi, şirket bilgilerinizi içeren resmi bir KDV faturası ile birlikte gelir.",
                ["ru"] = "Да, мы поддерживаем выставление корпоративных счетов для юридических лиц. К каждому B2B-заказу прилагается официальный счет-фактура с выделенным НДС и реквизитами.",
                ["ar"] = "نعم، ندعم الفوترة المؤسسية للشركات والمؤسسات. تأتي كل طلبية B2B مع فاتورة ضريبية رسمية تتضمن تفاصيل الشركة وضريبة القيمة المضافة."
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
                ["en"] = "Do you offer non-disclosure agreements (NDAs) for confidential CAD designs and prototypes?",
                ["tr"] = "Gizli CAD tasarımları ve prototipler için Gizlilik Sözleşmesi (NDA) sunuyor musunuz?",
                ["ru"] = "Подписываете ли вы соглашение о неразглашении (NDA) для конфиденциальных чертежей и прототипов?",
                ["ar"] = "هل تقدمون اتفاقيات عدم إفصاح (NDA) للتصاميم والنماذج الأولية السرية؟"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Ja. We behandelen alle CAD-bestanden en intellectueel eigendom strikt vertrouwelijk en zijn graag bereid vooraf een geheimhoudingsovereenkomst (NDA) te ondertekenen.",
                ["en"] = "Absolutely. We treat all uploaded 3D files and proprietary designs as strictly confidential in compliance with GDPR, and are happy to sign an NDA before manufacturing.",
                ["tr"] = "Kesinlikle. Yüklenen tüm 3D dosyaları ve tescilli tasarımları GDPR uyumlu olarak kesinlikle gizli tutuyoruz ve üretim öncesinde bir NDA imzalamaktan memnuniyet duyarız.",
                ["ru"] = "Безусловно. Мы строго конфиденциально относимся ко всем загруженным 3D-файлам и чертежам в соответствии с регламентом GDPR и готовы подписать соглашение NDA перед производством.",
                ["ar"] = "بالتأكيد. نتعامل مع جميع الملفات ثلاثية الأبعاد والتصاميم المرفوعة بسرية تامة ووفقاً للائحة حماية البيانات العامة (GDPR)، ويسعدنا توقيع اتفاقية عدم إفصاح قبل بدء الإنتاج."
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
                ["en"] = "Can you manufacture custom jigs, fixtures, and replacement machine components?",
                ["tr"] = "Özel aparatlar, mastarlar ve yedek makine parçaları üretebilir misiniz?",
                ["ru"] = "Можете ли вы изготовить оснастку, кондукторы и детали станков?",
                ["ar"] = "هل يمكنكم تصنيع قوالب ومثبتات مخصصة وقطع غيار للآلات؟"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Zeker! Wij produceren montagemallen, boorsjablonen, laskalibers en inspectiemallen in sterk PETG met ±0.1mm nauwkeurigheid.",
                ["en"] = "Yes! We manufacture custom assembly jigs, drill templates, inspection fixtures, and durable PETG tool holders with ±0.1mm precision.",
                ["tr"] = "Evet! Montaj aparatları, delme şablonları, kaynak mastarları ve kontrol fikstürlerini sağlam PETG malzeme ile ±0.1mm hassasiyetle üretiyoruz.",
                ["ru"] = "Да! Мы производим сборочные шаблоны, кондукторы для сверления, сварочные приспособления и контрольную оснастку из прочного PETG с точностью до ±0.1 мм.",
                ["ar"] = "نعم! نصنع قوالب التجميع وقوالب الحفر وقوالب الفحص وحوامل الأدوات المتينة من مادة PETG بدقة تصل إلى ±0.1 مم."
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
                ["en"] = "Do you offer batch production for small series (10–500+ parts)?",
                ["tr"] = "10 ila 500+ adetlik küçük seriler için toplu üretim yapıyor musunuz?",
                ["ru"] = "Производите ли вы небольшие партии от 10 до 500+ штук?",
                ["ar"] = "هل تقدمون إنتاج دفعات للكميات الصغيرة من 10 إلى أكثر من 500 قطعة؟"
            },
            Answer = new(StringComparer.OrdinalIgnoreCase)
            {
                ["nl"] = "Ja! Ons printfarm-netwerk is ingericht voor snelle nulseries en batchproductie als flexibel alternatief voor kostbare spuitgietmatrijzen.",
                ["en"] = "Yes! Our print farm specializes in short-run plastic batch production from 10 to 500+ units as a fast, flexible bridge manufacturing alternative to injection molding.",
                ["tr"] = "Evet! Baskı çiftliğimiz, maliyetli enjeksiyon kalıplarına hızlı ve esnek bir köprü üretim alternatifi olarak 10 ila 500+ adetlik seri üretimde uzmanlaşmıştır.",
                ["ru"] = "Да! Наша ферма 3D-принтеров специализируется на мелкосерийном производстве от 10 до 500+ деталей как на быстрой и гибкой альтернативе дорогостоящему литью под давлением.",
                ["ar"] = "نعم! مزرعة الطابعات لدينا مهيأة لإنتاج الدفعات الصغيرة من 10 إلى أكثر من 500 قطعة كبديل سريع ومرن لقوالب الحقن الباهظة الثمن."
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
            else
            {
                var needsUpdate = forceReload;
                match.Question ??= new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                match.Answer ??= new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

                foreach (var (k, v) in def.Question)
                {
                    if (!match.Question.ContainsKey(k) || (forceReload && match.Question[k] != v))
                    {
                        match.Question[k] = v;
                        needsUpdate = true;
                    }
                }

                foreach (var (k, v) in def.Answer)
                {
                    if (!match.Answer.ContainsKey(k) || (forceReload && match.Answer[k] != v))
                    {
                        match.Answer[k] = v;
                        needsUpdate = true;
                    }
                }

                if (forceReload)
                {
                    match.Category = def.Category;
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

        result.TotalAfter = await db.FaqItems.CountAsync();
        return result;
    }
}
