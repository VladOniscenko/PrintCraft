using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Models;

namespace PrintCraftApi.Data;

public static class PolicyTemplateSeeder
{
    public static List<PolicyTemplate> GetDefaultPolicies() => new()
    {
        // 1. Privacy Policy
        new PolicyTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000601"),
            Slug = "privacy",
            Title = new(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Privacy Policy",
                ["nl"] = "Privacybeleid",
                ["tr"] = "Gizlilik Politikası",
                ["ru"] = "Политика конфиденциальности",
                ["ar"] = "سياسة الخصوصية"
            },
            LastUpdated = new(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Last updated: 27 March 2026",
                ["nl"] = "Laatst bijgewerkt: 27 maart 2026",
                ["tr"] = "Son güncelleme: 27 Mart 2026",
                ["ru"] = "Последнее обновление: 27 марта 2026 г.",
                ["ar"] = "آخر تحديث: 27 مارس 2026"
            },
            ContactTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Legal Contact",
                ["nl"] = "Juridisch Contact",
                ["tr"] = "Hukuki İletişim",
                ["ru"] = "Юридические контакты",
                ["ar"] = "الاتصال القانوني"
            },
            ContactBody = new(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "For legal or privacy questions, email info@printmy3d.work. We aim to respond within 5 business days.",
                ["nl"] = "Voor juridische of privacyvragen kun je mailen naar info@printmy3d.work. We reageren doorgaans binnen 5 werkdagen.",
                ["tr"] = "Hukuki veya gizlilikle ilgili sorularınız için info@printmy3d.work adresine e-posta gönderebilirsiniz. 5 iş günü içinde yanıt vermeyi hedefliyoruz.",
                ["ru"] = "По юридическим вопросам и вопросам конфиденциальности пишите на info@printmy3d.work. Мы стремимся отвечать в течение 5 рабочих дней.",
                ["ar"] = "للأسئلة القانونية أو المتعلقة بالخصوصية، يرجى مراسلتنا عبر البريد الإلكتروني info@printmy3d.work. نسعى للرد خلال 5 أيام عمل."
            },
            IsActive = true,
            Sections = new()
            {
                new PolicySection
                {
                    Id = "privacy-sec-1",
                    SortOrder = 1,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "What we collect",
                        ["nl"] = "Welke gegevens we verzamelen",
                        ["tr"] = "Hangi verileri topluyoruz?",
                        ["ru"] = "Какие данные мы собираем",
                        ["ar"] = "ما نجمعه من بيانات"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "We collect data needed to operate our service: account details, contact information, shipping address, payment status, and uploaded model files.",
                        ["nl"] = "We verzamelen gegevens die nodig zijn voor onze dienstverlening: accountgegevens, contactgegevens, verzendadres, betaalstatus en geuploade modelbestanden.",
                        ["tr"] = "Hizmetimizi yürütmek için gerekli verileri topluyoruz: hesap bilgileri, iletişim bilgileri, teslimat adresi, ödeme durumu ve yüklenen model dosyaları.",
                        ["ru"] = "Мы собираем данные, необходимые для работы сервиса: информацию об аккаунте, контактные данные, адрес доставки, статус оплаты и загруженные файлы 3D-моделей.",
                        ["ar"] = "نجمع البيانات اللازمة لتشغيل خدمتنا: تفاصيل الحساب، ومعلومات الاتصال، وعنوان الشحن، وحالة الدفع، وملفات النماذج المرفوعة."
                    }
                },
                new PolicySection
                {
                    Id = "privacy-sec-2",
                    SortOrder = 2,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "How we use your data",
                        ["nl"] = "Hoe we je gegevens gebruiken",
                        ["tr"] = "Verilerinizi nasıl kullanıyoruz?",
                        ["ru"] = "Как мы используем ваши данные",
                        ["ar"] = "كيف نستخدم بياناتك"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "We use your data for quote calculation, production planning, shipping, customer support, fraud prevention, and operational communication. We do not sell personal data.",
                        ["nl"] = "Je gegevens gebruiken we voor offerteberekening, productieplanning, verzending, klantenservice, fraudepreventie en operationele communicatie. We verkopen geen persoonsgegevens.",
                        ["tr"] = "Verilerinizi fiyat teklifi hesaplama, üretim planlaması, kargo, müşteri desteği, dolandırıcılık önleme ve operasyonel iletişim için kullanıyoruz. Kişisel verileri satmıyoruz.",
                        ["ru"] = "Мы используем ваши данные для расчета стоимости, планирования производства, доставки, клиентской поддержки, предотвращения мошенничества и операционной связи. Мы не продаем персональные данные.",
                        ["ar"] = "نستخدم بياناتك لحساب عروض الأسعار، وتخطيط الإنتاج، والشحن، ودعم العملاء، ومنع الاحتيال، والتواصل التشغيلي. نحن لا نبيع البيانات الشخصية."
                    }
                },
                new PolicySection
                {
                    Id = "privacy-sec-3",
                    SortOrder = 3,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Data retention",
                        ["nl"] = "Bewaartermijn",
                        ["tr"] = "Veri saklama",
                        ["ru"] = "Хранение данных",
                        ["ar"] = "الاحتفاظ بالبيانات"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Order and invoice records are stored as required for accounting and legal obligations. Non-essential data can be removed on verified request.",
                        ["nl"] = "Bestel- en factuurgegevens bewaren we zolang wettelijk vereist voor administratie en boekhouding. Niet-essentiële gegevens verwijderen we op een geverifieerd verzoek.",
                        ["tr"] = "Sipariş ve fatura kayıtları muhasebe ve yasal yükümlülüklerin gerektirdiği süre boyunca saklanır. Zorunlu olmayan veriler doğrulanmış talep üzerine silinebilir.",
                        ["ru"] = "Записи о заказах и счетах хранятся в соответствии с бухгалтерскими и законодательными требованиями. Необязательные данные могут быть удалены по подтвержденному запросу.",
                        ["ar"] = "يتم تخزين سجلات الطلبات والفواتير كما هو مطلوب للالتزامات المحاسبية والقانونية. يمكن إزالة البيانات غير الأساسية بناءً على طلب موثق."
                    }
                },
                new PolicySection
                {
                    Id = "privacy-sec-4",
                    SortOrder = 4,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Your rights",
                        ["nl"] = "Jouw rechten",
                        ["tr"] = "Haklarınız",
                        ["ru"] = "Ваши права",
                        ["ar"] = "حقوقك"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "You can request access, correction, deletion, or export of personal data, subject to legal retention requirements.",
                        ["nl"] = "Je kunt inzage, correctie, verwijdering of export van persoonsgegevens aanvragen, voor zover dit past binnen wettelijke bewaarplichten.",
                        ["tr"] = "Yasal saklama gereksinimlerine tabi olmak kaydıyla kişisel verilerinize erişim, düzeltme, silme veya dışa aktarma talebinde bulunabilirsiniz.",
                        ["ru"] = "Вы имеете право запросить доступ, исправление, удаление или экспорт ваших персональных данных с учетом требований законодательства о хранении информации.",
                        ["ar"] = "يمكنك طلب الوصول إلى بياناتك الشخصية، أو تصحيحها، أو حذفها، أو تصديرها، بما يتوافق مع متطلبات الاحتفاظ القانونية."
                    }
                }
            }
        },

        // 2. Terms of Service
        new PolicyTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000602"),
            Slug = "terms",
            Title = new(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Terms of Service",
                ["nl"] = "Algemene Voorwaarden",
                ["tr"] = "Kullanım Koşulları",
                ["ru"] = "Условия обслуживания",
                ["ar"] = "شروط الخدمة"
            },
            LastUpdated = new(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Last updated: 27 March 2026",
                ["nl"] = "Laatst bijgewerkt: 27 maart 2026",
                ["tr"] = "Son güncelleme: 27 Mart 2026",
                ["ru"] = "Последнее обновление: 27 марта 2026 г.",
                ["ar"] = "آخر تحديث: 27 مارس 2026"
            },
            ContactTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Legal Contact",
                ["nl"] = "Juridisch Contact",
                ["tr"] = "Hukuki İletişim",
                ["ru"] = "Юридические контакты",
                ["ar"] = "الاتصال القانوني"
            },
            ContactBody = new(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "For legal or privacy questions, email info@printmy3d.work. We aim to respond within 5 business days.",
                ["nl"] = "Voor juridische of privacyvragen kun je mailen naar info@printmy3d.work. We reageren doorgaans binnen 5 werkdagen.",
                ["tr"] = "Hukuki veya gizlilikle ilgili sorularınız için info@printmy3d.work adresine e-posta gönderebilirsiniz. 5 iş günü içinde yanıt vermeyi hedefliyoruz.",
                ["ru"] = "По юридическим вопросам и вопросам конфиденциальности пишите на info@printmy3d.work. Мы стремимся отвечать в течение 5 рабочих дней.",
                ["ar"] = "للأسئلة القانونية أو المتعلقة بالخصوصية، يرجى مراسلتنا عبر البريد الإلكتروني info@printmy3d.work. نسعى للرد خلال 5 أيام عمل."
            },
            IsActive = true,
            Sections = new()
            {
                new PolicySection
                {
                    Id = "terms-sec-1",
                    SortOrder = 1,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Service scope",
                        ["nl"] = "Reikwijdte van de dienst",
                        ["tr"] = "Hizmet kapsamı",
                        ["ru"] = "Объем услуг",
                        ["ar"] = "نطاق الخدمة"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "By submitting files, you confirm that you own or are authorized to use them and that they do not violate laws or third-party rights.",
                        ["nl"] = "Door bestanden aan te leveren bevestig je dat je eigenaar bent van die bestanden of bevoegd bent om ze te gebruiken, en dat ze geen wet of rechten van derden schenden.",
                        ["tr"] = "Dosyaları göndererek bu dosyaların sahibi olduğunuzu veya bunları kullanmaya yetkili olduğunuzu, yasaları ya da üçüncü taraf haklarını ihlal etmediğini onaylamış olursunuz.",
                        ["ru"] = "Загружая файлы, вы подтверждаете, что являетесь их владельцем или имеете право на их использование, и что они не нарушают законодательство или права третьих лиц.",
                        ["ar"] = "من خلال إرسال الملفات، فإنك تؤكد أنك تمتلكها أو مصرح لك باستخدامها وأنها لا تنتهك القوانين أو حقوق الأطراف الثالثة."
                    }
                },
                new PolicySection
                {
                    Id = "terms-sec-2",
                    SortOrder = 2,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Quotes and orders",
                        ["nl"] = "Offertes en bestellingen",
                        ["tr"] = "Fiyat teklifleri ve siparişler",
                        ["ru"] = "Расчет стоимости и заказы",
                        ["ar"] = "عروض الأسعار والطلبات"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Quotes are customized estimates based on model size, quantity, material choice, print complexity, and finishing requirements. Production starts only after explicit approval and confirmed payment.",
                        ["nl"] = "Offertes zijn maatwerkramingen op basis van modelgrootte, aantallen, materiaalkeuze, printcomplexiteit en eventuele afwerking. Productie start uitsluitend na expliciet akkoord en bevestigde betaling.",
                        ["tr"] = "Fiyat teklifleri model boyutu, adet, malzeme seçimi, baskı karmaşıklığı ve yüzey işleme gereksinimlerine dayalı özel tahminlerdir. Üretim yalnızca açık onay ve teyit edilmiş ödemeden sonra başlar.",
                        ["ru"] = "Расчет стоимости является индивидуальной сметой на основе размеров модели, количества, выбора материала, сложности печати и требований к обработке. Производство начинается только после явного согласования и подтверждения оплаты.",
                        ["ar"] = "عروض الأسعار هي تقديرات مخصصة بناءً على حجم النموذج، والكمية، واختيار المادة، وتعقيد الطباعة، ومتطلبات التشطيب. لا يبدأ الإنتاج إلا بعد الموافقة الصريحة وتأكيد الدفع."
                    }
                },
                new PolicySection
                {
                    Id = "terms-sec-3",
                    SortOrder = 3,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Prices and quote validity",
                        ["nl"] = "Prijs- en offertegeldigheid",
                        ["tr"] = "Fiyatlar ve teklif geçerliliği",
                        ["ru"] = "Цены и действительность расчетов",
                        ["ar"] = "الأسعار وصلاحية عروض الأسعار"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Indicative prices shown on the website are guidance only. Final pricing may differ per request because size, quantity, geometry, support usage, post-processing, and delivery method can change actual cost. Displayed prices and draft quotes are non-binding; rights only arise after written quote confirmation by Print My 3D.",
                        ["nl"] = "Getoonde richtprijzen op de website zijn indicatief. De definitieve prijs kan per aanvraag afwijken doordat grootte, aantallen, geometrie, supportgebruik, nabewerking en verzendmethode de werkelijke kostprijs beïnvloeden. Getoonde prijzen en conceptoffertes zijn niet bindend; rechten ontstaan pas na schriftelijke offertebevestiging door Print My 3D.",
                        ["tr"] = "Web sitesinde gösterilen gösterge niteliğindeki fiyatlar yalnızca rehberlik amaçlıdır. Boyut, adet, geometri, destek kullanımı, ardıl işlem ve teslimat yöntemi gerçek maliyeti etkileyebileceğinden nihai fiyat talebe göre değişiklik gösterebilir. Görüntülenen fiyatlar ve taslak teklifler bağlayıcı değildir; haklar yalnızca Print My 3D tarafından yazılı teklif onayından sonra doğar.",
                        ["ru"] = "Ориентировочные цены на сайте представлены исключительно в ознакомительных целях. Окончательная стоимость может отличаться, так как размеры, количество, геометрия, расход поддержек, постобработка и способ доставки влияют на реальные расходы. Отображаемые цены и предварительные расчеты не имеют обязательной юридической силы; права и обязательства возникают только после письменного подтверждения расчета компанией Print My 3D.",
                        ["ar"] = "الأسعار الإرشادية المعروضة على الموقع هي لأغراض التوجيه فقط. قد يختلف السعر النهائي لكل طلب لأن الحجم، والكمية، والشكل الهندسي، واستخدام دعامات الطباعة، والمعالجة اللاحقة، وطريقة التوصيل يمكن أن تغير التكلفة الفعلية. الأسعار المعروضة ومسودات عروض الأسعار غير ملزمة؛ وتنشأ الحقوق فقط بعد تأكيد عرض السعر كتابياً من Print My 3D."
                    }
                },
                new PolicySection
                {
                    Id = "terms-sec-4",
                    SortOrder = 4,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Limitation of liability",
                        ["nl"] = "Beperking van aansprakelijkheid",
                        ["tr"] = "Sorumluluğun sınırlandırılması",
                        ["ru"] = "Ограничение ответственности",
                        ["ar"] = "حدود المسؤولية"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Customers are responsible for functional suitability and safety of uploaded designs. Our liability is limited to the value of the specific order where legally allowed.",
                        ["nl"] = "Klanten blijven verantwoordelijk voor de functionele geschiktheid en veiligheid van aangeleverde ontwerpen. Onze aansprakelijkheid is, waar wettelijk toegestaan, beperkt tot de waarde van de betreffende bestelling.",
                        ["tr"] = "Müşteriler, yüklenen tasarımların işlevsel uygunluğu ve güvenliğinden sorumludur. Sorumluluğumuz, yasal olarak izin verilen durumlarda ilgili siparişin değeri ile sınırlıdır.",
                        ["ru"] = "Клиенты несут ответственность за функциональную пригодность и безопасность загруженных моделей. Наша ответственность ограничена суммой конкретного заказа в пределах, предусмотренных законодательством.",
                        ["ar"] = "العملاء مسؤولون عن الملاءمة الوظيفية والسلامة للتصاميم المرفوعة. تقتصر مسؤوليتنا على قيمة الطلب المحدد حيثما يسمح القانون بذلك."
                    }
                },
                new PolicySection
                {
                    Id = "terms-sec-5",
                    SortOrder = 5,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Governing law",
                        ["nl"] = "Toepasselijk recht",
                        ["tr"] = "Uygulanacak hukuk",
                        ["ru"] = "Применимое право",
                        ["ar"] = "القانون الواجب التطبيق"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "These terms are governed by Dutch law. Disputes are handled by the competent court in the Netherlands unless mandatory consumer law states otherwise.",
                        ["nl"] = "Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland, tenzij dwingend consumentenrecht anders bepaalt.",
                        ["tr"] = "Bu koşullar Hollanda yasalarına tabidir. Zorunlu tüketici kanunları aksini belirtmedikçe, uyuşmazlıklar Hollanda'daki yetkili mahkeme tarafından çözülür.",
                        ["ru"] = "Настоящие условия регулируются законодательством Нидерландов. Все споры подлежат рассмотрению в компетентном суде Нидерландов, если иное не предусмотрено обязательными нормами законодательства о защите прав потребителей.",
                        ["ar"] = "تخضع هذه الشروط للقانون الهولندي. وتتم معالجة النزاعات من قبل المحكمة المختصة في هولندا ما لم ينص قانون حماية المستهلك الإلزامي على خلاف ذلك."
                    }
                }
            }
        },

        // 3. Refund Policy
        new PolicyTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000603"),
            Slug = "refunds",
            Title = new(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Refund Policy",
                ["nl"] = "Retour- en Terugbetaalbeleid",
                ["tr"] = "İade Politikası",
                ["ru"] = "Политика возврата средств",
                ["ar"] = "سياسة الاسترداد"
            },
            LastUpdated = new(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Last updated: 27 March 2026",
                ["nl"] = "Laatst bijgewerkt: 27 maart 2026",
                ["tr"] = "Son güncelleme: 27 Mart 2026",
                ["ru"] = "Последнее обновление: 27 марта 2026 г.",
                ["ar"] = "آخر تحديث: 27 مارس 2026"
            },
            ContactTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Legal Contact",
                ["nl"] = "Juridisch Contact",
                ["tr"] = "Hukuki İletişim",
                ["ru"] = "Юридические контакты",
                ["ar"] = "الاتصال القانوني"
            },
            ContactBody = new(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "For legal or privacy questions, email info@printmy3d.work. We aim to respond within 5 business days.",
                ["nl"] = "Voor juridische of privacyvragen kun je mailen naar info@printmy3d.work. We reageren doorgaans binnen 5 werkdagen.",
                ["tr"] = "Hukuki veya gizlilikle ilgili sorularınız için info@printmy3d.work adresine e-posta gönderebilirsiniz. 5 iş günü içinde yanıt vermeyi hedefliyoruz.",
                ["ru"] = "По юридическим вопросам и вопросам конфиденциальности пишите на info@printmy3d.work. Мы стремимся отвечать в течение 5 рабочих дней.",
                ["ar"] = "للأسئلة القانونية أو المتعلقة بالخصوصية، يرجى مراسلتنا عبر البريد الإلكتروني info@printmy3d.work. نسعى للرد خلال 5 أيام عمل."
            },
            IsActive = true,
            Sections = new()
            {
                new PolicySection
                {
                    Id = "refunds-sec-1",
                    SortOrder = 1,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Damaged or defective items",
                        ["nl"] = "Beschadigde of defecte items",
                        ["tr"] = "Hasarlı veya kusurlu ürünler",
                        ["ru"] = "Поврежденные или бракованные изделия",
                        ["ar"] = "العناصر التالفة أو المعيبة"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "If an item arrives damaged or has major production defects, contact us within 3 days with photos. We will assess and offer a reprint or refund where appropriate.",
                        ["nl"] = "Als een item beschadigd aankomt of ernstige productiefouten bevat, neem dan binnen 3 dagen contact op met foto's. We beoordelen het en bieden waar passend een herprint of terugbetaling.",
                        ["tr"] = "Bir ürün hasarlı ulaşırsa veya büyük üretim kusurları içeriyorsa, fotoğraflarla birlikte 3 gün içinde bizimle iletişime geçin. Durumu değerlendirip uygun olduğunda yeniden baskı veya para iadesi sunacağız.",
                        ["ru"] = "Если деталь получена поврежденной или имеет существенный производственный брак, свяжитесь с нами в течение 3 дней и приложите фотографии. Мы оценим ситуацию и предложим бесплатную перепечать или возврат средств.",
                        ["ar"] = "إذا وصل المنتج تالفاً أو كانت به عيوب إنتاجية جسيمة، اتصل بنا في غضون 3 أيام مع إرفاق الصور. سنقوم بالتقييم وتقديم إعادة طباعة أو استرداد الأموال عند الاقتضاء."
                    }
                },
                new PolicySection
                {
                    Id = "refunds-sec-2",
                    SortOrder = 2,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Custom-made products",
                        ["nl"] = "Maatwerkproducten",
                        ["tr"] = "Kişiye özel üretilen ürünler",
                        ["ru"] = "Индивидуальные изделия на заказ",
                        ["ar"] = "المنتجات المصنوعة حسب الطلب"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Because each print is produced on request and often unique in size and quantity, approved custom orders are generally non-refundable unless there is a clear manufacturing error.",
                        ["nl"] = "Omdat iedere print op aanvraag wordt gemaakt en vaak uniek is in formaat en aantallen, zijn goedgekeurde maatwerkbestellingen in principe niet restitueerbaar, behalve bij aantoonbare productiefouten.",
                        ["tr"] = "Her baskı talep üzerine üretildiğinden ve genellikle boyut ile adet bakımından benzersiz olduğundan, onaylanmış özel siparişler bariz bir üretim hatası olmadığı sürece genel olarak iade edilemez.",
                        ["ru"] = "Поскольку каждое изделие изготавливается по индивидуальному заказу с уникальными размерами и характеристиками, подтвержденные индивидуальные заказы возврату не подлежат, за исключением явного производственного брака.",
                        ["ar"] = "نظراً لأن كل مطبوعة يتم إنتاجها بناءً على طلب وتكون فريدة في الحجم والكمية، فإن الطلبات المخصصة المعتمدة غير قابلة للاسترداد بشكل عام ما لم يكن هناك خطأ تصنيعي واضح."
                    }
                },
                new PolicySection
                {
                    Id = "refunds-sec-3",
                    SortOrder = 3,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Cancellation",
                        ["nl"] = "Annulering",
                        ["tr"] = "İptal",
                        ["ru"] = "Отмена заказа",
                        ["ar"] = "الإلغاء"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Quotes can be canceled before production starts. Once production has started, cancellation is usually no longer possible.",
                        ["nl"] = "Een offerte kun je annuleren voordat productie start. Zodra productie is begonnen, is annuleren doorgaans niet meer mogelijk.",
                        ["tr"] = "Fiyat teklifleri üretim başlamadan önce iptal edilebilir. Üretim başladıktan sonra iptal genellikle mümkün değildir.",
                        ["ru"] = "Заявку на расчет стоимости можно отменить до начала производства. После запуска детали в печать отмена заказа обычно невозможна.",
                        ["ar"] = "يمكن إلغاء عروض الأسعار قبل بدء الإنتاج. وبمجرد بدء الإنتاج، لا يمكن الإلغاء عادةً."
                    }
                },
                new PolicySection
                {
                    Id = "refunds-sec-4",
                    SortOrder = 4,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Exclusions",
                        ["nl"] = "Uitsluitingen",
                        ["tr"] = "İstisnalar",
                        ["ru"] = "Исключения",
                        ["ar"] = "الاستثناءات"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Color variation, minor surface artifacts, or dimensional tolerances within normal 3D-print limits are not treated as defects.",
                        ["nl"] = "Kleurafwijkingen, kleine oppervlaktelijnen en maatverschillen binnen normale 3D-print toleranties gelden niet als defect.",
                        ["tr"] = "Renk farklılıkları, küçük yüzey izleri veya normal 3D baskı toleransları dahilindeki boyutsal sapmalar kusur olarak kabul edilmez.",
                        ["ru"] = "Незначительные отклонения оттенков цвета, небольшие поверхностные артефакты слоев или допуски размеров в пределах стандартных норм 3D-печати дефектами не являются.",
                        ["ar"] = "لا تعامل اختلافات الألوان، أو الشوائب السطحية الطفيفة، أو التفاوتات الأبعادية ضمن الحدود الطبيعية للطباعة ثلاثية الأبعاد على أنها عيوب."
                    }
                }
            }
        },

        // 4. Shipping Policy
        new PolicyTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000604"),
            Slug = "shipping",
            Title = new(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Shipping Policy",
                ["nl"] = "Verzendbeleid",
                ["tr"] = "Kargo Politikası",
                ["ru"] = "Условия доставки",
                ["ar"] = "سياسة الشحن"
            },
            LastUpdated = new(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Last updated: 27 March 2026",
                ["nl"] = "Laatst bijgewerkt: 27 maart 2026",
                ["tr"] = "Son güncelleme: 27 Mart 2026",
                ["ru"] = "Последнее обновление: 27 марта 2026 г.",
                ["ar"] = "آخر تحديث: 27 مارس 2026"
            },
            ContactTitle = new(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "Legal Contact",
                ["nl"] = "Juridisch Contact",
                ["tr"] = "Hukuki İletişim",
                ["ru"] = "Юридические контакты",
                ["ar"] = "الاتصال القانوني"
            },
            ContactBody = new(StringComparer.OrdinalIgnoreCase)
            {
                ["en"] = "For legal or privacy questions, email info@printmy3d.work. We aim to respond within 5 business days.",
                ["nl"] = "Voor juridische of privacyvragen kun je mailen naar info@printmy3d.work. We reageren doorgaans binnen 5 werkdagen.",
                ["tr"] = "Hukuki veya gizlilikle ilgili sorularınız için info@printmy3d.work adresine e-posta gönderebilirsiniz. 5 iş günü içinde yanıt vermeyi hedefliyoruz.",
                ["ru"] = "По юридическим вопросам и вопросам конфиденциальности пишите на info@printmy3d.work. Мы стремимся отвечать в течение 5 рабочих дней.",
                ["ar"] = "للأسئلة القانونية أو المتعلقة بالخصوصية، يرجى مراسلتنا عبر البريد الإلكتروني info@printmy3d.work. نسعى للرد خلال 5 أيام عمل."
            },
            IsActive = true,
            Sections = new()
            {
                new PolicySection
                {
                    Id = "shipping-sec-1",
                    SortOrder = 1,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Processing time",
                        ["nl"] = "Verwerkingstijd",
                        ["tr"] = "İşlem süresi",
                        ["ru"] = "Сроки изготовления",
                        ["ar"] = "وقت المعالجة"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Most orders are produced and prepared for shipment within 2 to 5 business days, depending on queue, complexity, material availability, and ordered quantity.",
                        ["nl"] = "De meeste bestellingen worden binnen 2 tot 5 werkdagen geproduceerd en verzendklaar gemaakt, afhankelijk van drukte, complexiteit, materiaalbeschikbaarheid en bestelde aantallen.",
                        ["tr"] = "Siparişlerin çoğu iş kuyruğuna, karmaşıklığa, malzeme mevcudiyetine ve sipariş edilen adede bağlı olarak 2 ila 5 iş günü içinde üretilir ve sevkiyata hazırlanır.",
                        ["ru"] = "Большинство заказов изготавливаются и подготавливаются к отправке в течение 2-5 рабочих дней, в зависимости от очереди печати, сложности, наличия материалов и объема заказа.",
                        ["ar"] = "يتم إنتاج وتجهيز معظم الطلبات للشحن خلال 2 إلى 5 أيام عمل، اعتماداً على قائمة الانتظار، والتعقيد، وتوفر المواد، والكمية المطلوبة."
                    }
                },
                new PolicySection
                {
                    Id = "shipping-sec-2",
                    SortOrder = 2,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Delivery area",
                        ["nl"] = "Leveringsgebied",
                        ["tr"] = "Teslimat alanı",
                        ["ru"] = "География доставки",
                        ["ar"] = "منطقة التوصيل"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "We deliver across the Netherlands. For fixed-price checkout products, shipping fees are shown at checkout. For quote-based orders, delivery costs are included or specified in the quote and may vary by package size, weight, quantity, and destination.",
                        ["nl"] = "We leveren door heel Nederland. Voor producten met vaste checkout-prijs worden verzendkosten tijdens checkout getoond. Voor offertebestellingen worden bezorgkosten opgenomen of gespecificeerd in de offerte en kunnen deze afwijken op basis van pakketgrootte, gewicht, aantallen en bestemming.",
                        ["tr"] = "Tüm Hollanda genelinde teslimat yapıyoruz. Sabit fiyatlı ödeme ürünleri için kargo ücretleri ödeme sırasında gösterilir. Teklife dayalı siparişlerde teslimat maliyetleri teklife dahil edilir veya belirtilir ve paket boyutuna, ağırlığına, adedine ve varış yerine göre değişebilir.",
                        ["ru"] = "Мы доставляем заказы по всей территории Нидерландов. Для товаров с фиксированной ценой стоимость доставки отображается при оформлении. Для индивидуальных заказов стоимость доставки указывается в смете и может зависеть от габаритов, веса, тиража и адреса назначения.",
                        ["ar"] = "نقوم بالتوصيل إلى جميع أنحاء هولندا. بالنسبة لمنتجات الشراء المباشر بأسعار ثابتة، تظهر رسوم الشحن عند الدفع. وبالنسبة للطلبات المستندة إلى عروض الأسعار، يتم تضمين تكاليف التوصيل أو تحديدها في عرض السعر وقد تختلف بحسب حجم الطرد ووزنه والكمية والوجهة."
                    }
                },
                new PolicySection
                {
                    Id = "shipping-sec-3",
                    SortOrder = 3,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Tracking",
                        ["nl"] = "Track & trace",
                        ["tr"] = "Kargo takibi",
                        ["ru"] = "Отслеживание отправлений",
                        ["ar"] = "تتبع الشحنة"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "When available, tracking details are shared after dispatch so you can follow delivery progress.",
                        ["nl"] = "Wanneer beschikbaar delen we na verzending track & trace-gegevens zodat je de levering kunt volgen.",
                        ["tr"] = "Mevcut olduğunda, teslimat sürecini takip edebilmeniz için gönderimden sonra takip bilgileri paylaşılır.",
                        ["ru"] = "При наличии трек-номера данные для отслеживания отправляются после передачи посылки в службу доставки.",
                        ["ar"] = "عند توفرها، تتم مشاركة تفاصيل التتبع بعد الإرسال حتى تتمكن من متابعة تقدم التوصيل."
                    }
                },
                new PolicySection
                {
                    Id = "shipping-sec-4",
                    SortOrder = 4,
                    Title = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Delays and risk",
                        ["nl"] = "Vertraging en risico",
                        ["tr"] = "Gecikmeler ve risk",
                        ["ru"] = "Задержки и риски",
                        ["ar"] = "التأخير والمخاطر"
                    },
                    Body = new(StringComparer.OrdinalIgnoreCase)
                    {
                        ["en"] = "Carrier delays may occur outside our control. Risk transfers at delivery unless mandatory consumer law provides otherwise.",
                        ["nl"] = "Vertraging door vervoerders kan buiten onze invloed liggen. Het risico gaat over bij levering, tenzij dwingend consumentenrecht anders bepaalt.",
                        ["tr"] = "Kargo şirketinden kaynaklanan gecikmeler kontrolümüz dışında gerçekleşebilir. Zorunlu tüketici kanunları aksini öngörmedikçe, risk teslimat anında devredilir.",
                        ["ru"] = "Задержки со стороны почтовых и курьерских служб находятся вне зоны нашего контроля. Риск случайной утраты переходит в момент вручения отправления, если иное не установлено законодательством.",
                        ["ar"] = "قد تحدث تأخيرات من شركة الشحن خارجة عن إرادتنا. وتنتقل المسؤولية عند التسليم ما لم ينص قانون المستهلك الإلزامي على خلاف ذلك."
                    }
                }
            }
        }
    };

    public static async Task<SeederResult> EnsureDatabaseSeededAsync(PrintCraftDb db, bool forceReload = false)
    {
        var defaults = GetDefaultPolicies();
        var existing = await db.PolicyTemplates.ToListAsync();
        var result = new SeederResult { TotalBefore = existing.Count };

        if (existing.Count == 0)
        {
            await db.PolicyTemplates.AddRangeAsync(defaults);
            await db.SaveChangesAsync();
            result.Inserted = defaults.Count;
            result.TotalAfter = defaults.Count;
            return result;
        }

        foreach (var def in defaults)
        {
            var match = existing.FirstOrDefault(p => p.Id == def.Id)
                        ?? existing.FirstOrDefault(p => string.Equals(p.Slug, def.Slug, StringComparison.OrdinalIgnoreCase));

            if (match == null)
            {
                await db.PolicyTemplates.AddAsync(def);
                result.Inserted++;
            }
            else if (forceReload)
            {
                match.Slug = def.Slug;
                match.Title = def.Title;
                match.LastUpdated = def.LastUpdated;
                match.Sections = def.Sections;
                match.ContactTitle = def.ContactTitle;
                match.ContactBody = def.ContactBody;
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

        result.TotalAfter = await db.PolicyTemplates.CountAsync();
        return result;
    }
}

