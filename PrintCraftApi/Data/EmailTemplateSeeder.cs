using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Models;

namespace PrintCraftApi.Data;

public static class EmailTemplateSeeder
{
    public enum CtaButtonStyle
    {
        Primary,
        Ghost,
        MassiveSecurity
    }

    public class EmailTemplateDefinition
    {
        public string TemplateName { get; set; } = string.Empty;
        public CtaButtonStyle CtaStyle { get; set; } = CtaButtonStyle.Primary;
        public string CtaUrlPlaceholder { get; set; } = "{{OrderUrl}}";
        public string? BadgeBg { get; set; }
        public string? BadgeBorder { get; set; }
        public string? BadgeTextColor { get; set; }
        public bool ShowDirectLink { get; set; } = true;
        public bool HasHighlightBox { get; set; }
        public bool HasDetailBox { get; set; }
        public bool HasHeroCheckIcon { get; set; }

        public Dictionary<string, string> Subjects { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, string> BadgeTexts { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, string> Headings { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, string> IntroParagraphs { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, string> CtaTexts { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, string> CtaSubtitles { get; set; } = new(StringComparer.OrdinalIgnoreCase);
        public Dictionary<string, string> DetailBoxTitles { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    }

    private static readonly Dictionary<string, string> CommonDirectLink = new(StringComparer.OrdinalIgnoreCase)
    {
        ["en"] = "Direct link:",
        ["nl"] = "Directe link:",
        ["tr"] = "Doğrudan bağlantı:",
        ["ru"] = "Прямая ссылка:",
        ["ar"] = "الرابط المباشر:"
    };

    private static readonly Dictionary<string, string> CommonFooterQuestions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["en"] = "Questions regarding your 3D print or order specifications?",
        ["nl"] = "Vragen over je 3D-print of bestelspecificaties?",
        ["tr"] = "3D baskınız veya sipariş özellikleriniz hakkında sorularınız mı var?",
        ["ru"] = "Вопросы по 3D-печати или спецификациям заказа?",
        ["ar"] = "هل لديك أسئلة بخصوص الطباعة ثلاثية الأبعاد أو مواصفات الطلب؟"
    };

    private static readonly Dictionary<string, string> CommonFooterContact = new(StringComparer.OrdinalIgnoreCase)
    {
        ["en"] = "Contact our engineering team at",
        ["nl"] = "Neem contact op met ons engineeringteam via",
        ["tr"] = "Mühendislik ekibimizle şu adresten iletişime geçin:",
        ["ru"] = "Свяжитесь с нашей инженерной командой:",
        ["ar"] = "تواصل مع فريق الهندسة لدينا عبر"
    };

    private static readonly Dictionary<string, string> CommonPaymentRefLabel = new(StringComparer.OrdinalIgnoreCase)
    {
        ["en"] = "Payment Reference (Include with Transfer)",
        ["nl"] = "Betalingskenmerk (Vermelden bij overschrijving)",
        ["tr"] = "Ödeme Referansı (Havale Açıklamasına Ekleyin)",
        ["ru"] = "Назначение платежа (Укажите при переводе)",
        ["ar"] = "المرجع البنكي (يرجى إرفاقه مع التحويل)"
    };

    private static readonly Dictionary<string, string> CommonTrackingLabel = new(StringComparer.OrdinalIgnoreCase)
    {
        ["en"] = "PostNL Tracking Number",
        ["nl"] = "PostNL Track & Trace Nummer",
        ["tr"] = "PostNL Takip Numarası",
        ["ru"] = "Трек-номер PostNL",
        ["ar"] = "رقم تتبع PostNL"
    };

    public static readonly List<EmailTemplateDefinition> TemplateDefinitions = new()
    {
        new EmailTemplateDefinition
        {
            TemplateName = "ResetPassword",
            CtaStyle = CtaButtonStyle.MassiveSecurity,
            CtaUrlPlaceholder = "{{ResetLink}}",
            ShowDirectLink = false,
            BadgeBg = "#f8fafc",
            BadgeBorder = "#e2e8f0",
            BadgeTextColor = "#334155",
            Subjects = new()
            {
                ["en"] = "Reset your Print My 3D password",
                ["nl"] = "Stel je Print My 3D wachtwoord opnieuw in",
                ["tr"] = "Print My 3D şifrenizi sıfırlayın",
                ["ru"] = "Сбросьте пароль Print My 3D",
                ["ar"] = "إعادة تعيين كلمة مرور Print My 3D الخاصة بك"
            },
            BadgeTexts = new()
            {
                ["en"] = "Security &bull; Account",
                ["nl"] = "Beveiliging &bull; Account",
                ["tr"] = "Güvenlik &bull; Hesap",
                ["ru"] = "Безопасность &bull; Аккаунт",
                ["ar"] = "الأمان &bull; الحساب"
            },
            Headings = new()
            {
                ["en"] = "Reset Your Password",
                ["nl"] = "Wachtwoord Opnieuw Instellen",
                ["tr"] = "Şifrenizi Sıfırlayın",
                ["ru"] = "Сброс пароля",
                ["ar"] = "إعادة تعيين كلمة المرور"
            },
            IntroParagraphs = new()
            {
                ["en"] = "Hi <strong>{{CustomerName}}</strong>, we received a request to reset your password. Click the button below to choose a new password. If you did not request this, you can safely ignore this email.",
                ["nl"] = "Hallo <strong>{{CustomerName}}</strong>, we hebben een verzoek ontvangen om je wachtwoord opnieuw in te stellen. Klik op de onderstaande knop om een nieuw wachtwoord te kiezen. Als je dit niet hebt aangevraagd, kun je deze e-mail veilig negeren.",
                ["tr"] = "Merhaba <strong>{{CustomerName}}</strong>, şifrenizi sıfırlama talebi aldık. Yeni bir şifre seçmek için aşağıdaki butona tıklayın. Bu talebi siz yapmadıysanız, bu e-postayı güvenle yok sayabilirsiniz.",
                ["ru"] = "Здравствуйте, <strong>{{CustomerName}}</strong>! Мы получили запрос на сброс вашего пароля. Нажмите кнопку ниже, чтобы установить новый пароль. Если вы не отправляли этот запрос, просто проигнорируйте письмо.",
                ["ar"] = "مرحبًا <strong>{{CustomerName}}</strong>، لقد تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بك. انقر فوق الزر أدناه لاختيار كلمة مرور جديدة. إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد الإلكتروني بأمان."
            },
            CtaTexts = new()
            {
                ["en"] = "Reset My Password &rarr;",
                ["nl"] = "Wachtwoord Opnieuw Instellen &rarr;",
                ["tr"] = "Şifremi Sıfırla &rarr;",
                ["ru"] = "Сбросить пароль &rarr;",
                ["ar"] = "إعادة تعيين كلمة المرور &rarr;"
            },
            CtaSubtitles = new()
            {
                ["en"] = "This password reset link expires in 2 hours. If you did not request this, you can safely ignore this email.",
                ["nl"] = "Deze link voor het opnieuw instellen van je wachtwoord verloopt over 2 uur. Als je dit niet hebt aangevraagd, is er geen actie vereist.",
                ["tr"] = "Bu şifre sıfırlama bağlantısının süresi 2 saat içinde dolar. Bu talebi siz yapmadıysanız herhangi bir işlem yapmanız gerekmez.",
                ["ru"] = "Срок действия ссылки истекает через 2 часа. Если вы не запрашивали сброс, никаких действий предпринимать не требуется.",
                ["ar"] = "تنتهي صلاحية رابط إعادة التعيين هذا خلال ساعتين. إذا لم تطلب هذا، فلا يلزم اتخاذ أي إجراء."
            }
        },
        new EmailTemplateDefinition
        {
            TemplateName = "QuoteRequested",
            CtaStyle = CtaButtonStyle.Ghost,
            CtaUrlPlaceholder = "{{OrderUrl}}",
            BadgeBg = "#f1f5f9",
            BadgeBorder = "#cbd5e1",
            BadgeTextColor = "#475569",
            Subjects = new()
            {
                ["en"] = "We received your quote request (Order #{{ShortOrderId}})",
                ["nl"] = "We hebben je offerteaanvraag ontvangen (Bestelling #{{ShortOrderId}})",
                ["tr"] = "Fiyat teklifi talebinizi aldık (Sipariş #{{ShortOrderId}})",
                ["ru"] = "Мы получили ваш запрос на расчет стоимости (Заказ #{{ShortOrderId}})",
                ["ar"] = "لقد استلمنا طلب عرض السعر الخاص بك (الطلب #{{ShortOrderId}})"
            },
            BadgeTexts = new()
            {
                ["en"] = "Quote Received &bull; #{{ShortOrderId}}",
                ["nl"] = "Offerte Ontvangen &bull; #{{ShortOrderId}}",
                ["tr"] = "Teklif Alındı &bull; #{{ShortOrderId}}",
                ["ru"] = "Запрос получен &bull; #{{ShortOrderId}}",
                ["ar"] = "تم استلام الطلب &bull; #{{ShortOrderId}}"
            },
            Headings = new()
            {
                ["en"] = "Your 3D Files Are In Review",
                ["nl"] = "Je 3D-bestanden worden beoordeeld",
                ["tr"] = "3D Dosyalarınız İnceleniyor",
                ["ru"] = "Ваши 3D-файлы находятся на проверке",
                ["ar"] = "ملفاتك ثلاثية الأبعاد قيد المراجعة"
            },
            IntroParagraphs = new()
            {
                ["en"] = "Hi <strong>{{CustomerName}}</strong>, we received your quote request for order #<strong>{{ShortOrderId}}</strong>. Our engineering team is reviewing your files, analyzing print geometry, and preparing your custom quote.",
                ["nl"] = "Hallo <strong>{{CustomerName}}</strong>, we hebben je offerteaanvraag ontvangen voor bestelling #<strong>{{ShortOrderId}}</strong>. Ons engineeringteam beoordeelt je bestanden, analyseert de printgeometrie en stelt je offerte op maat samen.",
                ["tr"] = "Merhaba <strong>{{CustomerName}}</strong>, sipariş #<strong>{{ShortOrderId}}</strong> için fiyat teklifi talebinizi aldık. Mühendislik ekibimiz dosyalarınızı inceliyor, baskı geometrisini analiz ediyor ve özel teklifinizi hazırlıyor.",
                ["ru"] = "Здравствуйте, <strong>{{CustomerName}}</strong>! Мы получили ваш запрос на заказ #<strong>{{ShortOrderId}}</strong>. Наша инженерная команда проверяет ваши файлы, анализирует геометрию печати и готовит индивидуальный расчет.",
                ["ar"] = "مرحبًا <strong>{{CustomerName}}</strong>، لقد استلمنا طلب عرض السعر الخاص بك للطلب رقم #<strong>{{ShortOrderId}}</strong>. يقوم فريقنا الهندسي بمراجعة ملفاتك وتحليل أبعاد الطباعة وإعداد عرض السعر المخصص لك."
            },
            CtaTexts = new()
            {
                ["en"] = "Check Order Status &rarr;",
                ["nl"] = "Bestelstatus Bekijken &rarr;",
                ["tr"] = "Sipariş Durumunu Kontrol Et &rarr;",
                ["ru"] = "Проверить статус заказа &rarr;" ,
                ["ar"] = "التحقق من حالة الطلب &rarr;"
            }
        },
        new EmailTemplateDefinition
        {
            TemplateName = "QuoteConfirmation",
            CtaStyle = CtaButtonStyle.Primary,
            CtaUrlPlaceholder = "{{OrderUrl}}",
            BadgeBg = "#ecfdf5",
            BadgeBorder = "#a7f3d0",
            BadgeTextColor = "#047857",
            HasDetailBox = true,
            Subjects = new()
            {
                ["en"] = "Your quote for order #{{ShortOrderId}} is ready",
                ["nl"] = "Je offerte voor bestelling #{{ShortOrderId}} is gereed",
                ["tr"] = "Sipariş #{{ShortOrderId}} için fiyat teklifiniz hazır",
                ["ru"] = "Расчет стоимости заказа #{{ShortOrderId}} готов",
                ["ar"] = "عرض السعر الخاص بطلبك #{{ShortOrderId}} جاهز الآن"
            },
            BadgeTexts = new()
            {
                ["en"] = "Quote Ready &bull; #{{ShortOrderId}}",
                ["nl"] = "Offerte Gereed &bull; #{{ShortOrderId}}",
                ["tr"] = "Teklif Hazır &bull; #{{ShortOrderId}}",
                ["ru"] = "Расчет готов &bull; #{{ShortOrderId}}",
                ["ar"] = "عرض السعر جاهز &bull; #{{ShortOrderId}}"
            },
            Headings = new()
            {
                ["en"] = "Your Quote is Ready",
                ["nl"] = "Je Offerte is Gereed",
                ["tr"] = "Teklifiniz Hazır",
                ["ru"] = "Ваш расчет готов",
                ["ar"] = "عرض السعر الخاص بك جاهز"
            },
            IntroParagraphs = new()
            {
                ["en"] = "Hi <strong>{{CustomerName}}</strong>, good news! Your quote for order #<strong>{{ShortOrderId}}</strong> is ready. Please log in to your portal to review the specifications and securely complete payment.",
                ["nl"] = "Hallo <strong>{{CustomerName}}</strong>, goed nieuws! Je offerte voor bestelling #<strong>{{ShortOrderId}}</strong> is gereed. Log in op je portaal om de specificaties te bekijken en de betaling veilig te voltooien.",
                ["tr"] = "Merhaba <strong>{{CustomerName}}</strong>, harika haber! Sipariş #<strong>{{ShortOrderId}}</strong> için fiyat teklifiniz hazır. Özellikleri incelemek ve ödemeyi güvenle tamamlamak için lütfen panelinize giriş yapın.",
                ["ru"] = "Здравствуйте, <strong>{{CustomerName}}</strong>! Отличные новости: расчет стоимости заказа #<strong>{{ShortOrderId}}</strong> готов. Пожалуйста, войдите в личный кабинет, чтобы проверить детали и безопасно оплатить заказ.",
                ["ar"] = "مرحبًا <strong>{{CustomerName}}</strong>، أخبار سارة! عرض السعر الخاص بطلبك رقم #<strong>{{ShortOrderId}}</strong> جاهز. يرجى تسجيل الدخول إلى بوابتك لمراجعة المواصفات وإتمام عملية الدفع بأمان."
            },
            CtaTexts = new()
            {
                ["en"] = "Review Quote &amp; Pay &rarr;",
                ["nl"] = "Offerte Bekijken &amp; Betalen &rarr;",
                ["tr"] = "Teklifi İncele ve Öde &rarr;",
                ["ru"] = "Посмотреть расчет и оплатить &rarr;",
                ["ar"] = "مراجعة عرض السعر والدفع &rarr;"
            },
            DetailBoxTitles = new()
            {
                ["en"] = "Engineering Team Note",
                ["nl"] = "Opmerking van het engineeringteam",
                ["tr"] = "Mühendislik Ekibi Notu",
                ["ru"] = "Примечание инженерной команды",
                ["ar"] = "ملاحظة الفريق الهندسي"
            }
        },
        new EmailTemplateDefinition
        {
            TemplateName = "QuoteConfirmationBankTransfer",
            CtaStyle = CtaButtonStyle.Primary,
            CtaUrlPlaceholder = "{{OrderUrl}}",
            BadgeBg = "#fffbeb",
            BadgeBorder = "#fde68a",
            BadgeTextColor = "#b45309",
            HasHighlightBox = true,
            HasDetailBox = true,
            Subjects = new()
            {
                ["en"] = "Your quote for order #{{ShortOrderId}} is ready for review",
                ["nl"] = "Je offerte voor bestelling #{{ShortOrderId}} is gereed voor beoordeling",
                ["tr"] = "Sipariş #{{ShortOrderId}} için teklifiniz incelenmeye hazır",
                ["ru"] = "Ваш заказ #{{ShortOrderId}} готов к оплате банковским переводом",
                ["ar"] = "عرض السعر لطلبك #{{ShortOrderId}} جاهز للمراجعة والدفع"
            },
            BadgeTexts = new()
            {
                ["en"] = "Bank Transfer &bull; #{{ShortOrderId}}",
                ["nl"] = "Bankoverschrijving &bull; #{{ShortOrderId}}",
                ["tr"] = "Banka Havalesi &bull; #{{ShortOrderId}}",
                ["ru"] = "Банковский перевод &bull; #{{ShortOrderId}}",
                ["ar"] = "تحويل بنكي &bull; #{{ShortOrderId}}"
            },
            Headings = new()
            {
                ["en"] = "Your Quote is Ready for Review",
                ["nl"] = "Je Offerte is Gereed voor Beoordeling",
                ["tr"] = "Teklifiniz İncelemeye Hazır",
                ["ru"] = "Ваш заказ готов к оплате",
                ["ar"] = "طلبك جاهز للمراجعة"
            },
            IntroParagraphs = new()
            {
                ["en"] = "Hi <strong>{{CustomerName}}</strong>, good news! Your quote for order #<strong>{{ShortOrderId}}</strong> is ready. Payment Reference: <strong style=\"color: #133827; font-family: monospace;\">{{PaymentReference}}</strong>. Please review the quote and bank transfer instructions in your customer portal.",
                ["nl"] = "Hallo <strong>{{CustomerName}}</strong>, goed nieuws! Je offerte voor bestelling #<strong>{{ShortOrderId}}</strong> is gereed. Betalingskenmerk: <strong style=\"color: #133827; font-family: monospace;\">{{PaymentReference}}</strong>. Bekijk de offerte en overschrijvingsinstructies in je klantportaal.",
                ["tr"] = "Merhaba <strong>{{CustomerName}}</strong>, harika haber! Sipariş #<strong>{{ShortOrderId}}</strong> için fiyat teklifiniz hazır. Ödeme Referansı: <strong style=\"color: #133827; font-family: monospace;\">{{PaymentReference}}</strong>. Lütfen müşteri panelinizden teklifi ve banka havalesi talimatlarını inceleyin.",
                ["ru"] = "Здравствуйте, <strong>{{CustomerName}}</strong>! Расчет для заказа #<strong>{{ShortOrderId}}</strong> готов. Назначение платежа: <strong style=\"color: #133827; font-family: monospace;\">{{PaymentReference}}</strong>. Пожалуйста, ознакомьтесь с инструкциями по банковскому переводу в личном кабинете.",
                ["ar"] = "مرحبًا <strong>{{CustomerName}}</strong>، أخبار سارة! عرض السعر لطلبك رقم #<strong>{{ShortOrderId}}</strong> جاهز. المرجع البنكي للدفع: <strong style=\"color: #133827; font-family: monospace;\">{{PaymentReference}}</strong>. يرجى مراجعة تفاصيل التحويل البنكي في بوابتك الخاصة."
            },
            CtaTexts = new()
            {
                ["en"] = "View Transfer Instructions &rarr;",
                ["nl"] = "Overschrijvingsinstructies Bekijken &rarr;",
                ["tr"] = "Havale Talimatlarını Görüntüle &rarr;",
                ["ru"] = "Инструкция по оплате &rarr;",
                ["ar"] = "عرض تعليمات التحويل البنكي &rarr;"
            },
            DetailBoxTitles = new()
            {
                ["en"] = "Engineering Team Note",
                ["nl"] = "Opmerking van het engineeringteam",
                ["tr"] = "Mühendislik Ekibi Notu",
                ["ru"] = "Примечание инженерной команды",
                ["ar"] = "ملاحظة الفريق الهندسي"
            }
        },
        new EmailTemplateDefinition
        {
            TemplateName = "OrderSentTracking",
            CtaStyle = CtaButtonStyle.Primary,
            CtaUrlPlaceholder = "{{OrderUrl}}",
            BadgeBg = "#eff6ff",
            BadgeBorder = "#bfdbfe",
            BadgeTextColor = "#1d4ed8",
            HasHighlightBox = true,
            Subjects = new()
            {
                ["en"] = "Your order #{{ShortOrderId}} has shipped",
                ["nl"] = "Je bestelling #{{ShortOrderId}} is verzonden",
                ["tr"] = "Siparişiniz #{{ShortOrderId}} kargoya verildi",
                ["ru"] = "Ваш заказ #{{ShortOrderId}} отправлен",
                ["ar"] = "تم شحن طلبك #{{ShortOrderId}}"
            },
            BadgeTexts = new()
            {
                ["en"] = "Shipped &bull; #{{ShortOrderId}}",
                ["nl"] = "Verzonden &bull; #{{ShortOrderId}}",
                ["tr"] = "Kargoya Verildi &bull; #{{ShortOrderId}}",
                ["ru"] = "Отправлено &bull; #{{ShortOrderId}}",
                ["ar"] = "تم الشحن &bull; #{{ShortOrderId}}"
            },
            Headings = new()
            {
                ["en"] = "Your 3D Part Has Shipped!",
                ["nl"] = "Je 3D-print is Verzonden!",
                ["tr"] = "3D Baskınız Kargoya Verildi!",
                ["ru"] = "Ваша 3D-деталь отправлена!",
                ["ar"] = "تم شحن قطعتك ثلاثية الأبعاد!"
            },
            IntroParagraphs = new()
            {
                ["en"] = "Hi <strong>{{CustomerName}}</strong>, your order #<strong>{{ShortOrderId}}</strong> has been dispatched via PostNL! Tracking Number: <strong style=\"color: #133827; font-family: monospace;\">{{TrackingCode}}</strong>.",
                ["nl"] = "Hallo <strong>{{CustomerName}}</strong>, je bestelling #<strong>{{ShortOrderId}}</strong> is verzonden via PostNL! Track &amp; Trace code: <strong style=\"color: #133827; font-family: monospace;\">{{TrackingCode}}</strong>.",
                ["tr"] = "Merhaba <strong>{{CustomerName}}</strong>, siparişiniz #<strong>{{ShortOrderId}}</strong> PostNL ile gönderildi! Takip Kodu: <strong style=\"color: #133827; font-family: monospace;\">{{TrackingCode}}</strong>.",
                ["ru"] = "Здравствуйте, <strong>{{CustomerName}}</strong>! Ваш заказ #<strong>{{ShortOrderId}}</strong> отправлен службой PostNL! Трек-номер: <strong style=\"color: #133827; font-family: monospace;\">{{TrackingCode}}</strong>.",
                ["ar"] = "مرحبًا <strong>{{CustomerName}}</strong>، تم إرسال طلبك رقم #<strong>{{ShortOrderId}}</strong> عبر PostNL! رقم التتبع: <strong style=\"color: #133827; font-family: monospace;\">{{TrackingCode}}</strong>."
            },
            CtaTexts = new()
            {
                ["en"] = "Track Your Shipment &rarr;",
                ["nl"] = "Zending Volgen &rarr;",
                ["tr"] = "Gönderinizi Takip Edin &rarr;",
                ["ru"] = "Отследить посылку &rarr;",
                ["ar"] = "تتبع شحنتك &rarr;"
            }
        },
        new EmailTemplateDefinition
        {
            TemplateName = "OrderPaid",
            CtaStyle = CtaButtonStyle.Primary,
            CtaUrlPlaceholder = "{{OrderUrl}}",
            BadgeBg = "#ecfdf5",
            BadgeBorder = "#a7f3d0",
            BadgeTextColor = "#047857",
            HasHeroCheckIcon = true,
            Subjects = new()
            {
                ["en"] = "Payment confirmed for order #{{ShortOrderId}}",
                ["nl"] = "Betaling bevestigd voor bestelling #{{ShortOrderId}}",
                ["tr"] = "Sipariş #{{ShortOrderId}} için ödeme onaylandı",
                ["ru"] = "Оплата заказа #{{ShortOrderId}} подтверждена",
                ["ar"] = "تم تأكيد الدفع للطلب #{{ShortOrderId}}"
            },
            BadgeTexts = new()
            {
                ["en"] = "Payment Received &bull; #{{ShortOrderId}}",
                ["nl"] = "Betaling Ontvangen &bull; #{{ShortOrderId}}",
                ["tr"] = "Ödeme Alındı &bull; #{{ShortOrderId}}",
                ["ru"] = "Оплата получена &bull; #{{ShortOrderId}}",
                ["ar"] = "تم استلام الدفعة &bull; #{{ShortOrderId}}"
            },
            Headings = new()
            {
                ["en"] = "Payment Received — Print Queued!",
                ["nl"] = "Betaling Ontvangen — Print Ingewilligd!",
                ["tr"] = "Ödeme Alındı — Baskı Sıraya Alındı!",
                ["ru"] = "Оплата получена — печать в очереди!",
                ["ar"] = "تم استلام الدفع — تمت جدولة الطباعة!"
            },
            IntroParagraphs = new()
            {
                ["en"] = "Hi <strong>{{CustomerName}}</strong>, we successfully received your payment for order #<strong>{{ShortOrderId}}</strong>. Your 3D models have been scheduled for printing.",
                ["nl"] = "Hallo <strong>{{CustomerName}}</strong>, we hebben je betaling voor bestelling #<strong>{{ShortOrderId}}</strong> succesvol ontvangen. Je 3D-modellen zijn ingepland voor productie.",
                ["tr"] = "Merhaba <strong>{{CustomerName}}</strong>, sipariş #<strong>{{ShortOrderId}}</strong> için ödemeniz başarıyla alındı. 3D modelleriniz baskı için sıraya eklendi.",
                ["ru"] = "Здравствуйте, <strong>{{CustomerName}}</strong>! Оплата заказа #<strong>{{ShortOrderId}}</strong> успешно получена. Ваши 3D-модели поставлены в очередь на печать.",
                ["ar"] = "مرحبًا <strong>{{CustomerName}}</strong>، لقد استلمنا دفعتك بنجاح للطلب رقم #<strong>{{ShortOrderId}}</strong>. تمت جدولة نماذجك ثلاثية الأبعاد لبدء الطباعة."
            },
            CtaTexts = new()
            {
                ["en"] = "View Order Progress &rarr;",
                ["nl"] = "Bestelvoortgang Bekijken &rarr;",
                ["tr"] = "Sipariş İlerlemesini Gör &rarr;",
                ["ru"] = "Смотреть прогресс заказа &rarr;",
                ["ar"] = "عرض تقدم الطلب &rarr;"
            }
        }
    };

    private static string GetDictText(Dictionary<string, string> dict, string language, string fallback = "")
    {
        if (dict.TryGetValue(language, out var val) && !string.IsNullOrWhiteSpace(val)) return val;
        if (dict.TryGetValue("en", out var enVal) && !string.IsNullOrWhiteSpace(enVal)) return enVal;
        return fallback;
    }

    public static (string Subject, string Body) GenerateTemplate(string templateName, string language = "en")
    {
        var lang = string.IsNullOrWhiteSpace(language) ? "en" : language.Trim().ToLowerInvariant();
        var def = TemplateDefinitions.FirstOrDefault(d => string.Equals(d.TemplateName, templateName, StringComparison.OrdinalIgnoreCase));
        if (def == null) return (string.Empty, string.Empty);

        var subject = GetDictText(def.Subjects, lang, $"Notification: {templateName}");
        var badgeText = GetDictText(def.BadgeTexts, lang, "Print My 3D Notification");
        var heading = GetDictText(def.Headings, lang, "Order Update");
        var introParagraph = GetDictText(def.IntroParagraphs, lang);
        var ctaText = GetDictText(def.CtaTexts, lang, "View Details &rarr;");
        var ctaSubtitle = GetDictText(def.CtaSubtitles, lang);
        var detailBoxTitle = GetDictText(def.DetailBoxTitles, lang, "Engineering Team Note");
        var directLinkText = GetDictText(CommonDirectLink, lang, "Direct link:");
        var footerQuestions = GetDictText(CommonFooterQuestions, lang, "Questions regarding your 3D print or order specifications?");
        var footerContact = GetDictText(CommonFooterContact, lang, "Contact our engineering team at");
        const string footerCompany = "&copy; Print My 3D &bull; Precision Additive Manufacturing &bull; Rotterdam, NL";

        string? heroIconHtml = null;
        if (def.HasHeroCheckIcon)
        {
            heroIconHtml = """
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 12px auto;">
                <tr>
                  <td align="center" style="width: 56px; height: 56px; background-color: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="font-size: 28px; line-height: 56px; color: #059669; font-weight: bold; display: block;">&#10003;</span>
                  </td>
                </tr>
              </table>
            """;
        }

        string? highlightBoxHtml = null;
        if (def.HasHighlightBox)
        {
            if (templateName.Contains("BankTransfer", StringComparison.OrdinalIgnoreCase))
            {
                var refLabel = GetDictText(CommonPaymentRefLabel, lang, "Payment Reference (Include with Transfer)");
                highlightBoxHtml = $$$"""
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ecfdf5; border-radius: 10px; border: 2px solid #059669; text-align: center; padding: 18px 20px;">
                    <tr>
                      <td align="center">
                        <div style="font-size: 11px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px;">
                          {{{refLabel}}}
                        </div>
                        <div style="font-size: 22px; font-weight: 800; color: #133827; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: 2px;">
                          {{PaymentReference}}
                        </div>
                      </td>
                    </tr>
                  </table>
                """;
            }
            else if (templateName.Contains("Tracking", StringComparison.OrdinalIgnoreCase))
            {
                var trackLabel = GetDictText(CommonTrackingLabel, lang, "PostNL Tracking Number");
                highlightBoxHtml = $$$"""
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 10px; border: 1.5px dashed #cbd5e1; text-align: center; padding: 18px 20px;">
                    <tr>
                      <td align="center">
                        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px;">
                          {{{trackLabel}}}
                        </div>
                        <div style="font-size: 22px; font-weight: 800; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: 2px;">
                          {{TrackingCode}}
                        </div>
                      </td>
                    </tr>
                  </table>
                """;
            }
        }

        string? detailBoxHtml = def.HasDetailBox ? "{{QuoteMessage}}" : null;

        var body = BuildCardHtmlTemplate(
            badgeText: badgeText,
            heading: heading,
            introParagraph: introParagraph,
            ctaText: ctaText,
            ctaUrlPlaceholder: def.CtaUrlPlaceholder,
            badgeBg: def.BadgeBg,
            badgeBorder: def.BadgeBorder,
            badgeTextColor: def.BadgeTextColor,
            heroIconHtml: heroIconHtml,
            highlightBoxHtml: highlightBoxHtml,
            detailBoxHtml: detailBoxHtml,
            ctaStyle: def.CtaStyle,
            showDirectLink: def.ShowDirectLink,
            ctaSubtitle: string.IsNullOrWhiteSpace(ctaSubtitle) ? null : ctaSubtitle,
            detailBoxTitle: detailBoxTitle,
            directLinkText: directLinkText,
            footerQuestions: footerQuestions,
            footerContact: footerContact,
            footerCompany: footerCompany
        );

        return (subject, body);
    }

    public static List<EmailTemplate> GetDefaultTemplates()
    {
        var languages = new[] { "en", "nl", "tr", "ru", "ar" };
        var list = new List<EmailTemplate>();

        var langBaseIds = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            ["en"] = 0,
            ["nl"] = 10,
            ["tr"] = 20,
            ["ru"] = 30,
            ["ar"] = 40
        };

        foreach (var lang in languages)
        {
            var baseId = langBaseIds[lang];
            for (var i = 0; i < TemplateDefinitions.Count; i++)
            {
                var def = TemplateDefinitions[i];
                var templateNum = baseId + (i + 1);
                var id = Guid.Parse($"00000000-0000-0000-0000-{templateNum:D12}");
                var (subject, body) = GenerateTemplate(def.TemplateName, lang);

                list.Add(new EmailTemplate
                {
                    Id = id,
                    TemplateName = def.TemplateName,
                    Language = lang,
                    Subject = subject,
                    Body = body
                });
            }
        }

        return list;
    }

    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EmailTemplate>().HasData(GetDefaultTemplates());
    }

    public static async Task<SeederResult> EnsureDatabaseSeededAsync(PrintCraftDb db, bool forceReload = false)
    {
        var defaults = GetDefaultTemplates();
        var existing = await db.EmailTemplates.ToListAsync();
        var result = new SeederResult { TotalBefore = existing.Count };

        if (existing.Count == 0)
        {
            await db.EmailTemplates.AddRangeAsync(defaults);
            await db.SaveChangesAsync();
            result.Inserted = defaults.Count;
            result.TotalAfter = defaults.Count;
            return result;
        }

        foreach (var def in defaults)
        {
            var matches = existing
                .Where(t => t.Id == def.Id || (string.Equals(t.TemplateName.Trim(), def.TemplateName.Trim(), StringComparison.OrdinalIgnoreCase) && string.Equals(t.Language?.Trim() ?? "en", def.Language.Trim(), StringComparison.OrdinalIgnoreCase)))
                .ToList();

            if (matches.Count == 0)
            {
                await db.EmailTemplates.AddAsync(def);
                result.Inserted++;
            }
            else
            {
                foreach (var match in matches)
                {
                    if (forceReload
                        || !string.Equals(match.Subject, def.Subject, StringComparison.Ordinal)
                        || !string.Equals(match.Body, def.Body, StringComparison.Ordinal)
                        || !string.Equals(match.Language, def.Language, StringComparison.OrdinalIgnoreCase))
                    {
                        match.TemplateName = def.TemplateName;
                        match.Language = def.Language;
                        match.Subject = def.Subject;
                        match.Body = def.Body;
                        db.Entry(match).State = EntityState.Modified;
                        result.Updated++;
                    }
                }
            }
        }

        // Sanitize any remaining legacy brand name in existing templates
        foreach (var t in existing)
        {
            var updated = false;
            if (!string.IsNullOrEmpty(t.Subject) && t.Subject.Contains("PrintCraft"))
            {
                t.Subject = t.Subject.Replace("PrintCraft", "Print My 3D");
                updated = true;
            }
            if (!string.IsNullOrEmpty(t.Body) && t.Body.Contains("PrintCraft"))
            {
                t.Body = t.Body.Replace("PrintCraft", "Print My 3D");
                updated = true;
            }
            if (updated)
            {
                db.Entry(t).State = EntityState.Modified;
                result.Updated++;
            }
        }

        if (result.Inserted > 0 || result.Updated > 0)
        {
            await db.SaveChangesAsync();
        }

        result.TotalAfter = await db.EmailTemplates.CountAsync();
        return result;
    }

    public static string BuildCardHtmlTemplate(
        string badgeText,
        string heading,
        string introParagraph,
        string ctaText,
        string ctaUrlPlaceholder = "{{OrderUrl}}",
        string? badgeBg = null,
        string? badgeBorder = null,
        string? badgeTextColor = null,
        string? heroIconHtml = null,
        string? highlightBoxHtml = null,
        string? detailBoxHtml = null,
        CtaButtonStyle ctaStyle = CtaButtonStyle.Primary,
        bool showDirectLink = true,
        string? ctaSubtitle = null,
        string? detailBoxTitle = null,
        string? directLinkText = null,
        string? footerQuestions = null,
        string? footerContact = null,
        string? footerCompany = null)
    {
        badgeBg ??= "#ecfdf5";
        badgeBorder ??= "#a7f3d0";
        badgeTextColor ??= "#047857";
        detailBoxTitle ??= "Engineering Team Note";
        directLinkText ??= "Direct link:";
        footerQuestions ??= "Questions about your 3D print or order specifications?";
        footerContact ??= "Reach out to our engineering team at";
        footerCompany ??= "&copy; Print My 3D &bull; Precision Additive Manufacturing &bull; Rotterdam, NL";

        var logoUrlPlaceholder = "{{LogoUrl}}";

        var iconBlock = !string.IsNullOrWhiteSpace(heroIconHtml) ? $$"""
          <!-- Hero Icon Section -->
          {{heroIconHtml}}
        """ : "";

        var highlightBlock = !string.IsNullOrWhiteSpace(highlightBoxHtml) ? $$"""
          <!-- Highlight Callout Box -->
          <tr>
            <td class="mobile-p-20" style="padding: 4px 40px 20px 40px;">
              {{highlightBoxHtml}}
            </td>
          </tr>
        """ : "";

        var detailBlock = !string.IsNullOrWhiteSpace(detailBoxHtml) ? $$"""
          <!-- Detail Box Section -->
          <tr>
            <td class="mobile-p-20" style="padding: 0 40px 28px 40px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-left: 4px solid #133827; border-radius: 0 8px 8px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b;">{{detailBoxTitle}}</p>
                    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #334155; font-style: italic;">
                      {{detailBoxHtml}}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        """ : "";

        var (btnBg, btnBorder, btnText, btnPadding, btnFontSize) = ctaStyle switch
        {
            CtaButtonStyle.MassiveSecurity => ("#133827", "#0d261a", "#ffffff", "16px 36px", "16px"),
            CtaButtonStyle.Ghost => ("#f8fafc", "#cbd5e1", "#1e293b", "13px 28px", "14px"),
            _ => ("#133827", "#0d261a", "#ffffff", "14px 32px", "15px")
        };

        var directLinkRow = showDirectLink ? $$"""
          <!-- Direct Link Row -->
          <tr>
            <td class="mobile-p-20" align="center" style="padding: 0 40px 24px 40px;">
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8; word-break: break-all;">
                {{directLinkText}} <a href="{{ctaUrlPlaceholder}}" style="color: #059669; text-decoration: underline;">{{ctaUrlPlaceholder}}</a>
              </p>
            </td>
          </tr>
        """ : "";

        var ctaSubtitleRow = !string.IsNullOrWhiteSpace(ctaSubtitle) ? $$"""
          <tr>
            <td class="mobile-p-20" align="center" style="padding: 12px 40px 0 40px;">
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                {{ctaSubtitle}}
              </p>
            </td>
          </tr>
        """ : "";

        return $$"""
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>{{heading}}</title>
  <style type="text/css">
    @media only screen and (max-width: 600px) {
      .mobile-p-20 { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-p-24 { padding-left: 24px !important; padding-right: 24px !important; }
      .mobile-full-width { width: 100% !important; min-width: 100% !important; }
      .mobile-h1 { font-size: 22px !important; line-height: 28px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 40px 16px 48px 16px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto;">
          <!-- Brand Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <a href="https://printmy3d.work" target="_blank" style="text-decoration: none; display: inline-block;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 10px;">
                      <img src="{{logoUrlPlaceholder}}" width="36" height="36" alt="Print My 3D" style="display: block; border: 0;" />
                    </td>
                    <td style="vertical-align: middle;">
                      <span style="font-size: 20px; font-weight: 800; color: #133827; letter-spacing: -0.5px;">Print My 3D</span>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>

          <!-- Main Card Container -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; overflow: hidden;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <!-- Card Header with Badge -->
                <tr>
                  <td class="mobile-p-24" align="center" style="padding: 40px 40px 24px 40px;">
                    {{iconBlock}}
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: {{badgeBg}}; border: 1px solid {{badgeBorder}}; border-radius: 9999px; padding: 4px 16px;">
                          <span style="color: {{badgeTextColor}}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; display: inline-block;">
                            {{badgeText}}
                          </span>
                        </td>
                      </tr>
                    </table>
                    <h1 class="mobile-h1" style="margin: 18px 0 0 0; font-size: 26px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; line-height: 34px;">
                      {{heading}}
                    </h1>
                  </td>
                </tr>

                <!-- Intro Paragraph -->
                <tr>
                  <td class="mobile-p-24" style="padding: 0 40px 24px 40px;">
                    <p style="margin: 0; font-size: 15px; line-height: 24px; color: #475569;">
                      {{introParagraph}}
                    </p>
                  </td>
                </tr>

                {{highlightBlock}}
                {{detailBlock}}

                <!-- Call To Action Button -->
                <tr>
                  <td class="mobile-p-24" align="center" style="padding: 8px 40px 24px 40px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="mobile-full-width">
                      <tr>
                        <td align="center" style="background-color: {{btnBg}}; border: 1px solid {{btnBorder}}; border-radius: 12px; box-shadow: 0 2px 4px rgba(19, 56, 39, 0.15);">
                          <a href="{{ctaUrlPlaceholder}}" target="_blank" style="display: block; padding: {{btnPadding}}; font-size: {{btnFontSize}}; font-weight: 700; color: {{btnText}}; text-decoration: none; letter-spacing: 0.3px;">
                            {{ctaText}}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {{ctaSubtitleRow}}
                {{directLinkRow}}
              </table>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td align="center" style="padding: 32px 24px 0 24px;">
              <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 20px; color: #64748b;">
                {{footerQuestions}}<br />
                {{footerContact}} <a href="mailto:info@printmy3d.work" style="color: #133827; font-weight: 600; text-decoration: underline;">info@printmy3d.work</a>
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                {{footerCompany}}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
""";
    }
}
