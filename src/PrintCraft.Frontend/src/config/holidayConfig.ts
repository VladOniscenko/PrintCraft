import type { SupportedLanguage, TranslationKey } from "../i18n/translations";

export type HolidayKey =
  | "halloween"
  | "sinterklaas"
  | "christmas"
  | "newYear"
  | "valentines"
  | "kingsDay";

export interface HolidayDates {
  start: string; // "MM-DD", e.g. "10-01"
  end: string; // "MM-DD", e.g. "10-31"
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
}

export interface HolidayContent {
  title: string;
  subtitle: string;
  ctaText: string;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  ctaTextKey: TranslationKey;
  titles?: Record<SupportedLanguage, string>;
  subtitles?: Record<SupportedLanguage, string>;
  ctaTexts?: Record<SupportedLanguage, string>;
}

export interface HolidayColorPalette {
  heroBg: string;
  bgColor?: string;
  eyebrowText: string;
  headingText?: string;
  textColor?: string;
  subtext: string;
  ctaButton: string;
  ctaColor?: string;
  secondaryLink: string;
  accentGlow: string;
  secondaryGlow: string;
  centerGlow: string;
  badgeBg?: string;
  paginationDotActive?: string;
  modelViewerAura?: string;
  focusRing?: string;
}

export type HolidayEffect =
  | "bats"
  | "confetti"
  | "snow"
  | "hearts"
  | "fireworks"
  | string;

export interface HolidayConfigItem {
  id: HolidayKey;
  dates: HolidayDates;
  content: HolidayContent;
  modelUrl: string;
  colorPalette: HolidayColorPalette;
  effect: HolidayEffect;
  eyebrow?: string;
  eyebrowKey?: TranslationKey;
  eyebrows?: Record<SupportedLanguage, string>;
}

export type HolidayConfig = Record<HolidayKey, HolidayConfigItem>;

export const DEFAULT_HERO_PALETTE: HolidayColorPalette = {
  heroBg:
    "bg-gradient-to-b from-[#071c15] via-[#05140f] to-[#030d0a] border border-emerald-500/20 shadow-[0_32px_64px_-16px_rgba(2,12,9,0.8)]",
  bgColor:
    "bg-gradient-to-b from-[#071c15] via-[#05140f] to-[#030d0a] border border-emerald-500/20 shadow-[0_32px_64px_-16px_rgba(2,12,9,0.8)]",
  eyebrowText: "text-emerald-400",
  headingText: "text-white",
  textColor: "text-white",
  subtext: "text-emerald-100",
  ctaButton:
    "bg-emerald-400 text-gray-950 hover:bg-emerald-300 shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98]",
  ctaColor:
    "bg-emerald-400 text-gray-950 hover:bg-emerald-300 shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98]",
  secondaryLink: "text-emerald-300 hover:text-white",
  accentGlow: "bg-emerald-500/15",
  secondaryGlow: "bg-teal-400/10",
  centerGlow: "bg-emerald-400/5",
  badgeBg: "bg-emerald-500/20 border-emerald-400/30 text-emerald-200",
  paginationDotActive: "bg-emerald-400",
  modelViewerAura: "bg-emerald-400/10",
  focusRing: "focus:ring-emerald-400",
};

export const holidayConfig: HolidayConfig = {
  halloween: {
    id: "halloween",
    dates: {
      start: "10-01",
      end: "10-31",
      startMonth: 10,
      startDay: 1,
      endMonth: 10,
      endDay: 31,
    },
    content: {
      title: "Griezelig goede 3D-prints voor Halloween",
      subtitle:
        "Print je pompoenen, decoraties en cosplay accessoires op maat. Binnen 2 tot 5 werkdagen bezorgd met PostNL.",
      ctaText: "Ontdek Halloween Prints",
      titleKey: "hero.holidays.halloween.title",
      subtitleKey: "hero.holidays.halloween.subtitle",
      ctaTextKey: "hero.holidays.halloween.cta",
      titles: {
        nl: "Griezelig goede 3D-prints voor Halloween",
        en: "Spooktacular 3D Prints for Halloween",
        tr: "Cadılar Bayramı için Ürkütücü ve Özel 3D Baskılar",
        ru: "Жутко крутая 3D-печать на Хэллоуин",
        ar: "طباعة ثلاثية الأبعاد مميزة للهالوين",
      },
      subtitles: {
        nl: "Print je pompoenen, decoraties en cosplay accessoires op maat. Binnen 2 tot 5 werkdagen bezorgd met PostNL.",
        en: "Custom 3D print your pumpkins, decor, and cosplay props. Delivered in 2 to 5 business days via PostNL.",
        tr: "Balkabaklarınızı, dekorasyonlarınızı ve kostüm aksesuarlarınızı bastırın. PostNL ile 2 ila 5 iş gününde teslimat.",
        ru: "Печатайте тыквы, декор и реквизит для косплея на заказ. Доставка через PostNL за 2–5 рабочих дней.",
        ar: "اطبع مجسمات القرع والديكورات وإكسسوارات التنكر بدقة. التوصيل خلال 2 إلى 5 أيام عمل عبر PostNL.",
      },
      ctaTexts: {
        nl: "Ontdek Halloween Prints",
        en: "Explore Halloween Prints",
        tr: "Cadılar Bayramı Baskılarını Keşfet",
        ru: "Смотреть печать на Хэллоуин",
        ar: "استكشف تصاميم الهالوين",
      },
    },
    modelUrl: "/uploads/hero/pumpkin.stl",
    colorPalette: {
      heroBg:
        "bg-gradient-to-b from-[#1c0b02] via-[#100601] to-[#080300] border border-orange-500/30 shadow-[0_32px_64px_-16px_rgba(28,11,2,0.8)]",
      bgColor:
        "bg-gradient-to-b from-[#1c0b02] via-[#100601] to-[#080300] border border-orange-500/30 shadow-[0_32px_64px_-16px_rgba(28,11,2,0.8)]",
      eyebrowText: "text-orange-400",
      headingText: "text-white",
      textColor: "text-white",
      subtext: "text-orange-100/90",
      ctaButton:
        "bg-orange-500 text-gray-950 hover:bg-orange-400 shadow-lg hover:shadow-orange-500/30 active:scale-[0.98]",
      ctaColor:
        "bg-orange-500 text-gray-950 hover:bg-orange-400 shadow-lg hover:shadow-orange-500/30 active:scale-[0.98]",
      secondaryLink: "text-orange-300 hover:text-white",
      accentGlow: "bg-orange-500/20",
      secondaryGlow: "bg-amber-500/15",
      centerGlow: "bg-purple-900/15",
      badgeBg: "bg-orange-500/20 border-orange-400/30 text-orange-200",
      paginationDotActive: "bg-orange-500",
      modelViewerAura: "bg-orange-500/15",
      focusRing: "focus:ring-orange-400",
    },
    effect: "bats",
    eyebrow: "Halloween Special",
    eyebrowKey: "hero.holidays.halloween.eyebrow",
    eyebrows: {
      nl: "Halloween Special",
      en: "Halloween Special",
      tr: "Cadılar Bayramı Özel",
      ru: "Спецвыпуск к Хэллоуину",
      ar: "خاص بالهالوين",
    },
  },

  sinterklaas: {
    id: "sinterklaas",
    dates: {
      start: "11-01",
      end: "12-05",
      startMonth: 11,
      startDay: 1,
      endMonth: 12,
      endDay: 5,
    },
    content: {
      title: "Unieke 3D-surprises & cadeaus voor Sinterklaas",
      subtitle:
        "Maak je surprise compleet of print een uniek schoencadeautje. Bestel op tijd: geleverd binnen 2 tot 5 werkdagen.",
      ctaText: "Bestel Sinterklaas Prints",
      titleKey: "hero.holidays.sinterklaas.title",
      subtitleKey: "hero.holidays.sinterklaas.subtitle",
      ctaTextKey: "hero.holidays.sinterklaas.cta",
      titles: {
        nl: "Unieke 3D-surprises & cadeaus voor Sinterklaas",
        en: "Unique 3D Surprises & Gifts for Sinterklaas",
        tr: "Sinterklaas için Eşsiz 3D Sürprizler ve Hediyeler",
        ru: "Уникальные 3D-сюрпризы и подарки к Синтерклаасу",
        ar: "مفاجآت وهدايا فريدة ثلاثية الأبعاد لسانتا كلوز",
      },
      subtitles: {
        nl: "Maak je surprise compleet of print een uniek schoencadeautje. Bestel op tijd: geleverd binnen 2 tot 5 werkdagen.",
        en: "Level up your festive surprise or print custom shoe gifts. Order in time: delivered in 2 to 5 business days.",
        tr: "Sürprizlerinizi tamamlayın veya özel hediyeler üretin. Zamanında sipariş verin: 2 ila 5 iş gününde teslimat.",
        ru: "Дополните праздничный сюрприз оригинальным подарком. Заказывайте вовремя: доставка за 2–5 рабочих дней.",
        ar: "اجعل هديتك الاحتفالية استثنائية. اطلب مسبقاً: التوصيل خلال 2 إلى 5 أيام عمل.",
      },
      ctaTexts: {
        nl: "Bestel Sinterklaas Prints",
        en: "Order Holiday Gifts",
        tr: "Sinterklaas Hediyelerini Sipariş Et",
        ru: "Заказать подарки к Синтерклаасу",
        ar: "طلب هدايا المناسبات",
      },
    },
    modelUrl: "/uploads/hero/sinterklaas.stl",
    colorPalette: {
      heroBg:
        "bg-gradient-to-b from-[#1f0707] via-[#130303] to-[#0a0202] border border-red-500/25 shadow-[0_32px_64px_-16px_rgba(31,7,7,0.8)]",
      bgColor:
        "bg-gradient-to-b from-[#1f0707] via-[#130303] to-[#0a0202] border border-red-500/25 shadow-[0_32px_64px_-16px_rgba(31,7,7,0.8)]",
      eyebrowText: "text-amber-400",
      headingText: "text-white",
      textColor: "text-white",
      subtext: "text-amber-100/90",
      ctaButton:
        "bg-amber-400 text-gray-950 hover:bg-amber-300 shadow-lg hover:shadow-amber-400/30 active:scale-[0.98]",
      ctaColor:
        "bg-amber-400 text-gray-950 hover:bg-amber-300 shadow-lg hover:shadow-amber-400/30 active:scale-[0.98]",
      secondaryLink: "text-amber-300 hover:text-white",
      accentGlow: "bg-red-600/20",
      secondaryGlow: "bg-amber-400/15",
      centerGlow: "bg-red-500/10",
      badgeBg: "bg-red-500/20 border-amber-400/30 text-amber-200",
      paginationDotActive: "bg-amber-400",
      modelViewerAura: "bg-amber-400/15",
      focusRing: "focus:ring-amber-400",
    },
    effect: "confetti",
    eyebrow: "Sinterklaas Special",
    eyebrowKey: "hero.holidays.sinterklaas.eyebrow",
    eyebrows: {
      nl: "Sinterklaas Special",
      en: "Sinterklaas Special",
      tr: "Sinterklaas Özel",
      ru: "Спецвыпуск Синтерклаас",
      ar: "خاص بسينتركلاس",
    },
  },

  christmas: {
    id: "christmas",
    dates: {
      start: "12-06",
      end: "12-26",
      startMonth: 12,
      startDay: 6,
      endMonth: 12,
      endDay: 26,
    },
    content: {
      title: "Magische 3D-geprinte kerstdecoraties & cadeaus",
      subtitle:
        "Van gepersonaliseerde boomhangers tot unieke cadeaus onder de kerstboom. Levering binnen 2 tot 5 werkdagen.",
      ctaText: "Print Jouw Kerstdecoratie",
      titleKey: "hero.holidays.christmas.title",
      subtitleKey: "hero.holidays.christmas.subtitle",
      ctaTextKey: "hero.holidays.christmas.cta",
      titles: {
        nl: "Magische 3D-geprinte kerstdecoraties & cadeaus",
        en: "Magical 3D Printed Christmas Decor & Gifts",
        tr: "Büyüleyici 3D Baskı Yılbaşı Süsleri ve Hediyeleri",
        ru: "Волшебные 3D-рождественские украшения и подарки",
        ar: "ديكورات وهدايا كريسماس ساحرة مطبوعة ثلاثية الأبعاد",
      },
      subtitles: {
        nl: "Van gepersonaliseerde boomhangers tot unieke cadeaus onder de kerstboom. Levering binnen 2 tot 5 werkdagen.",
        en: "From custom tree ornaments to unique gifts under the tree. Reliable delivery in 2 to 5 business days.",
        tr: "Özel ağaç süslerinden benzersiz yılbaşı hediyelerine kadar. PostNL ile 2 ila 5 iş gününde güvenli teslimat.",
        ru: "От персонализированных елочных игрушек до уникальных подарков. Надежная доставка за 2–5 рабочих дней.",
        ar: "من زينة شجرة العيد المخصصة إلى هدايا فريدة. توصيل موثوق خلال 2 إلى 5 أيام عمل.",
      },
      ctaTexts: {
        nl: "Print Jouw Kerstdecoratie",
        en: "Print Your Christmas Decor",
        tr: "Yılbaşı Süslerini Bastır",
        ru: "Напечатать новогодний декор",
        ar: "اطبع زينة العيد",
      },
    },
    modelUrl: "/uploads/hero/christmas-tree.stl",
    colorPalette: {
      heroBg:
        "bg-gradient-to-b from-[#06180e] via-[#0b140b] to-[#050c07] border border-red-500/30 shadow-[0_32px_64px_-16px_rgba(6,24,14,0.8)]",
      bgColor:
        "bg-gradient-to-b from-[#06180e] via-[#0b140b] to-[#050c07] border border-red-500/30 shadow-[0_32px_64px_-16px_rgba(6,24,14,0.8)]",
      eyebrowText: "text-red-400",
      headingText: "text-white",
      textColor: "text-white",
      subtext: "text-emerald-100/90",
      ctaButton:
        "bg-red-500 text-white hover:bg-red-400 shadow-lg hover:shadow-red-500/30 active:scale-[0.98]",
      ctaColor:
        "bg-red-500 text-white hover:bg-red-400 shadow-lg hover:shadow-red-500/30 active:scale-[0.98]",
      secondaryLink: "text-emerald-300 hover:text-white",
      accentGlow: "bg-red-500/20",
      secondaryGlow: "bg-emerald-500/20",
      centerGlow: "bg-red-500/10",
      badgeBg: "bg-red-500/20 border-red-400/30 text-red-200",
      paginationDotActive: "bg-red-500",
      modelViewerAura: "bg-red-500/15",
      focusRing: "focus:ring-red-400",
    },
    effect: "snow",
    eyebrow: "Kerst Special",
    eyebrowKey: "hero.holidays.christmas.eyebrow",
    eyebrows: {
      nl: "Kerst Special",
      en: "Christmas Special",
      tr: "Noel Özel",
      ru: "Рождественский спецвыпуск",
      ar: "خاص بالكريسماس",
    },
  },

  newYear: {
    id: "newYear",
    dates: {
      start: "12-27",
      end: "01-02",
      startMonth: 12,
      startDay: 27,
      endMonth: 1,
      endDay: 2,
    },
    content: {
      title: "Knal het nieuwe jaar in met innovatieve 3D-prints",
      subtitle:
        "Start je nieuwe projecten, prototypes of feestartikelen direct. Binnen 2 tot 5 werkdagen bezorgd door PostNL.",
      ctaText: "Start Nieuwjaarsproject",
      titleKey: "hero.holidays.newYear.title",
      subtitleKey: "hero.holidays.newYear.subtitle",
      ctaTextKey: "hero.holidays.newYear.cta",
      titles: {
        nl: "Knal het nieuwe jaar in met innovatieve 3D-prints",
        en: "Ring in the New Year with Innovative 3D Prints",
        tr: "Yeni Yıla Yenilikçi 3D Baskılarla Başlayın",
        ru: "Встречайте Новый год с инновационной 3D-печатью",
        ar: "استقبل العام الجديد بابتكارات الطباعة ثلاثية الأبعاد",
      },
      subtitles: {
        nl: "Start je nieuwe projecten, prototypes of feestartikelen direct. Binnen 2 tot 5 werkdagen bezorgd door PostNL.",
        en: "Kickstart your new projects, prototypes, or party gear. Delivered across the Netherlands in 2 to 5 business days.",
        tr: "Yeni projelerinizi, prototiplerinizi veya parti ürünlerinizi hemen başlatın. 2 ila 5 iş gününde teslimat.",
        ru: "Запускайте новые проекты, прототипы или праздничный реквизит. Доставка по Нидерландам за 2–5 рабочих дней.",
        ar: "ابدأ مشاريعك ونماذجك الأولية أو أدوات الحفلات فوراً. التوصيل خلال 2 إلى 5 أيام عمل.",
      },
      ctaTexts: {
        nl: "Start Nieuwjaarsproject",
        en: "Start New Year Project",
        tr: "Yeni Yıl Projesini Başlat",
        ru: "Начать новогодний проект",
        ar: "ابدأ مشروع العام الجديد",
      },
    },
    modelUrl: "/uploads/hero/new-year.stl",
    colorPalette: {
      heroBg:
        "bg-gradient-to-b from-[#0b1021] via-[#070a14] to-[#03050a] border border-yellow-400/25 shadow-[0_32px_64px_-16px_rgba(11,16,33,0.8)]",
      bgColor:
        "bg-gradient-to-b from-[#0b1021] via-[#070a14] to-[#03050a] border border-yellow-400/25 shadow-[0_32px_64px_-16px_rgba(11,16,33,0.8)]",
      eyebrowText: "text-yellow-300",
      headingText: "text-white",
      textColor: "text-white",
      subtext: "text-yellow-100/90",
      ctaButton:
        "bg-yellow-400 text-gray-950 hover:bg-yellow-300 shadow-lg hover:shadow-yellow-400/30 active:scale-[0.98]",
      ctaColor:
        "bg-yellow-400 text-gray-950 hover:bg-yellow-300 shadow-lg hover:shadow-yellow-400/30 active:scale-[0.98]",
      secondaryLink: "text-yellow-200 hover:text-white",
      accentGlow: "bg-yellow-400/20",
      secondaryGlow: "bg-amber-300/15",
      centerGlow: "bg-blue-600/15",
      badgeBg: "bg-yellow-400/20 border-yellow-300/30 text-yellow-200",
      paginationDotActive: "bg-yellow-400",
      modelViewerAura: "bg-yellow-400/15",
      focusRing: "focus:ring-yellow-400",
    },
    effect: "confetti",
    eyebrow: "Oud & Nieuw Special",
    eyebrowKey: "hero.holidays.newYear.eyebrow",
    eyebrows: {
      nl: "Oud & Nieuw Special",
      en: "New Year Special",
      tr: "Yılbaşı Özel",
      ru: "Новогодний спецвыпуск",
      ar: "خاص برأس السنة",
    },
  },

  valentines: {
    id: "valentines",
    dates: {
      start: "01-20",
      end: "02-14",
      startMonth: 1,
      startDay: 20,
      endMonth: 2,
      endDay: 14,
    },
    content: {
      title: "Verras je geliefde met een persoonlijk 3D-geprint cadeau",
      subtitle:
        "Van 3D-fotolijsten tot tastbare herinneringen. Bestel op tijd voor Valentijn: geleverd binnen 2 tot 5 werkdagen.",
      ctaText: "Ontwerp Jouw Valentijnscadeau",
      titleKey: "hero.holidays.valentines.title",
      subtitleKey: "hero.holidays.valentines.subtitle",
      ctaTextKey: "hero.holidays.valentines.cta",
      titles: {
        nl: "Verras je geliefde met een persoonlijk 3D-geprint cadeau",
        en: "Surprise Your Valentine with a Personalized 3D Gift",
        tr: "Sevgilinize Özel Kişiselleştirilmiş 3D Baskı Hediye",
        ru: "Удивите любимых персональным 3D-подарком",
        ar: "فاجئ من تحب بهدية شخصية مطبوعة ثلاثية الأبعاد",
      },
      subtitles: {
        nl: "Van 3D-fotolijsten tot tastbare herinneringen. Bestel op tijd voor Valentijn: geleverd binnen 2 tot 5 werkdagen.",
        en: "From 3D lithophane photos to custom keepsakes. Order in time for Valentine's Day: delivered in 2 to 5 business days.",
        tr: "3D fotoğraflardan unutulmaz anılara kadar. Sevgililer Günü için zamanında sipariş edin: 2-5 iş gününde teslimat.",
        ru: "От 3D-литофаний до осязаемых воспоминаний. Закажите ко Дню святого Валентина: доставка за 2–5 рабочих дней.",
        ar: "من لوحات الصور البارزة إلى التذكارات الملموسة. اطلب لعيد الحب: توصيل خلال 2 إلى 5 أيام عمل.",
      },
      ctaTexts: {
        nl: "Ontwerp Jouw Valentijnscadeau",
        en: "Design Valentine's Gift",
        tr: "Sevgililer Günü Hediyeni Tasarla",
        ru: "Создать подарок ко Дню Валентина",
        ar: "صمم هدية عيد الحب",
      },
    },
    modelUrl: "/uploads/hero/heart.stl",
    colorPalette: {
      heroBg:
        "bg-gradient-to-b from-[#210915] via-[#13050c] to-[#0a0206] border border-pink-500/30 shadow-[0_32px_64px_-16px_rgba(33,9,21,0.8)]",
      bgColor:
        "bg-gradient-to-b from-[#210915] via-[#13050c] to-[#0a0206] border border-pink-500/30 shadow-[0_32px_64px_-16px_rgba(33,9,21,0.8)]",
      eyebrowText: "text-pink-400",
      headingText: "text-white",
      textColor: "text-white",
      subtext: "text-pink-100/90",
      ctaButton:
        "bg-pink-500 text-white hover:bg-pink-400 shadow-lg hover:shadow-pink-500/30 active:scale-[0.98]",
      ctaColor:
        "bg-pink-500 text-white hover:bg-pink-400 shadow-lg hover:shadow-pink-500/30 active:scale-[0.98]",
      secondaryLink: "text-pink-300 hover:text-white",
      accentGlow: "bg-pink-500/20",
      secondaryGlow: "bg-rose-500/15",
      centerGlow: "bg-pink-400/10",
      badgeBg: "bg-pink-500/20 border-pink-400/30 text-pink-200",
      paginationDotActive: "bg-pink-500",
      modelViewerAura: "bg-pink-500/15",
      focusRing: "focus:ring-pink-400",
    },
    effect: "hearts",
    eyebrow: "Valentijnsdag Special",
    eyebrowKey: "hero.holidays.valentines.eyebrow",
    eyebrows: {
      nl: "Valentijnsdag Special",
      en: "Valentine's Special",
      tr: "Sevgililer Günü Özel",
      ru: "Ко Дню святого Валентина",
      ar: "خاص بعيد الحب",
    },
  },

  kingsDay: {
    id: "kingsDay",
    dates: {
      start: "04-01",
      end: "04-27",
      startMonth: 4,
      startDay: 1,
      endMonth: 4,
      endDay: 27,
    },
    content: {
      title: "Vier Koningsdag in stijl met oranje 3D-prints",
      subtitle:
        "Van feestkronen en festivalaccessoires tot oranje gadgets. Binnen 2 tot 5 werkdagen in huis via PostNL.",
      ctaText: "Bestel Oranje Prints",
      titleKey: "hero.holidays.kingsDay.title",
      subtitleKey: "hero.holidays.kingsDay.subtitle",
      ctaTextKey: "hero.holidays.kingsDay.cta",
      titles: {
        nl: "Vier Koningsdag in stijl met oranje 3D-prints",
        en: "Celebrate King's Day with Custom Orange 3D Prints",
        tr: "Kral Günü'nü Turuncu 3D Baskılarla Kutlayın",
        ru: "Празднуйте День короля с оранжевой 3D-печатью",
        ar: "احتفل بيوم الملك بتصاميم برتقالية ثلاثية الأبعاد",
      },
      subtitles: {
        nl: "Van feestkronen en festivalaccessoires tot oranje gadgets. Binnen 2 tot 5 werkdagen in huis via PostNL.",
        en: "From crowns and festival accessories to bright orange gadgets. Delivered in 2 to 5 business days via PostNL.",
        tr: "Taçlardan parti aksesuarlarına ve turuncu aletlere kadar. PostNL ile 2 ila 5 iş gününde kapınızda.",
        ru: "От праздничных корон и аксессуаров до оранжевых гаджетов. Доставка за 2–5 рабочих дней через PostNL.",
        ar: "من التيجان وإكسسوارات الاحتفال إلى المجسمات البرتقالية. التوصيل خلال 2 إلى 5 أيام عمل عبر PostNL.",
      },
      ctaTexts: {
        nl: "Bestel Oranje Prints",
        en: "Order King's Day Prints",
        tr: "Turuncu Baskıları Sipariş Et",
        ru: "Заказать оранжевые принты",
        ar: "اطلب التصاميم البرتقالية",
      },
    },
    modelUrl: "/uploads/hero/crown.stl",
    colorPalette: {
      heroBg:
        "bg-gradient-to-b from-[#200e02] via-[#130701] to-[#0a0400] border border-amber-500/30 shadow-[0_32px_64px_-16px_rgba(32,14,2,0.8)]",
      bgColor:
        "bg-gradient-to-b from-[#200e02] via-[#130701] to-[#0a0400] border border-amber-500/30 shadow-[0_32px_64px_-16px_rgba(32,14,2,0.8)]",
      eyebrowText: "text-amber-400",
      headingText: "text-white",
      textColor: "text-white",
      subtext: "text-amber-100/90",
      ctaButton:
        "bg-amber-500 text-gray-950 hover:bg-amber-400 shadow-lg hover:shadow-amber-500/30 active:scale-[0.98]",
      ctaColor:
        "bg-amber-500 text-gray-950 hover:bg-amber-400 shadow-lg hover:shadow-amber-500/30 active:scale-[0.98]",
      secondaryLink: "text-amber-300 hover:text-white",
      accentGlow: "bg-orange-500/20",
      secondaryGlow: "bg-blue-600/15",
      centerGlow: "bg-amber-500/10",
      badgeBg: "bg-amber-500/20 border-amber-400/30 text-amber-200",
      paginationDotActive: "bg-amber-500",
      modelViewerAura: "bg-amber-500/15",
      focusRing: "focus:ring-amber-400",
    },
    effect: "confetti",
    eyebrow: "Koningsdag Special",
    eyebrowKey: "hero.holidays.kingsDay.eyebrow",
    eyebrows: {
      nl: "Koningsdag Special",
      en: "King's Day Special",
      tr: "Kral Günü Özel",
      ru: "Ко Дню короля",
      ar: "خاص بيوم الملك",
    },
  },
};

export function isDateInHoliday(date: Date, holiday: HolidayConfigItem): boolean {
  const m = date.getMonth() + 1; // 1-12
  const d = date.getDate(); // 1-31
  const current = m * 100 + d;

  const start = holiday.dates.startMonth * 100 + holiday.dates.startDay;
  const end = holiday.dates.endMonth * 100 + holiday.dates.endDay;

  if (start <= end) {
    return current >= start && current <= end;
  }
  // Holiday crosses New Year boundary (e.g. Dec 27 to Jan 2)
  return current >= start || current <= end;
}

export function getActiveHoliday(
  date: Date = new Date(),
  config: HolidayConfig = holidayConfig
): HolidayConfigItem | null {
  for (const holiday of Object.values(config)) {
    if (isDateInHoliday(date, holiday)) {
      return holiday;
    }
  }
  return null;
}

export function getHolidayTitle(
  holiday: HolidayConfigItem,
  language: SupportedLanguage,
  t?: (key: TranslationKey) => string
): string {
  if (t && holiday.content.titleKey) {
    const val = t(holiday.content.titleKey);
    if (val && val !== holiday.content.titleKey) return val;
  }
  if (holiday.content.titles?.[language]) {
    return holiday.content.titles[language];
  }
  return holiday.content.title;
}

export function getHolidaySubtitle(
  holiday: HolidayConfigItem,
  language: SupportedLanguage,
  t?: (key: TranslationKey) => string
): string {
  if (t && holiday.content.subtitleKey) {
    const val = t(holiday.content.subtitleKey);
    if (val && val !== holiday.content.subtitleKey) return val;
  }
  if (holiday.content.subtitles?.[language]) {
    return holiday.content.subtitles[language];
  }
  return holiday.content.subtitle;
}

export function getHolidayCtaText(
  holiday: HolidayConfigItem,
  language: SupportedLanguage,
  t?: (key: TranslationKey) => string
): string {
  if (t && holiday.content.ctaTextKey) {
    const val = t(holiday.content.ctaTextKey);
    if (val && val !== holiday.content.ctaTextKey) return val;
  }
  if (holiday.content.ctaTexts?.[language]) {
    return holiday.content.ctaTexts[language];
  }
  return holiday.content.ctaText;
}

export function getHolidayEyebrow(
  holiday: HolidayConfigItem,
  language: SupportedLanguage,
  t?: (key: TranslationKey) => string
): string {
  if (t && holiday.eyebrowKey) {
    const val = t(holiday.eyebrowKey);
    if (val && val !== holiday.eyebrowKey) return val;
  }
  if (holiday.eyebrows?.[language]) {
    return holiday.eyebrows[language];
  }
  return holiday.eyebrow || "";
}

