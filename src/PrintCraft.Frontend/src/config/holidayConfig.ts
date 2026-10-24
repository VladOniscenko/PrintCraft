import type { SupportedLanguage, TranslationKey } from "../i18n/translations";

export type HolidayKey =
  | "halloween"
  | "sinterklaas"
  | "christmas"
  | "newYear"
  | "valentines"
  | "easter"
  | "kingsDay"
  | "mothersDay"
  | "fathersDay"
  | "backToWork"
  | "animalDay";

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
  | "blossom"
  | "pawprints"
  | "fireworks"
  | "none"
  | string;

export interface HolidayConfigItem {
  id: HolidayKey;
  name: string;
  names?: Record<SupportedLanguage, string>;
  dateLabel?: string;
  dateLabels?: Record<SupportedLanguage, string>;
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
  // 1. Pasen: 15 maart t/m Pasen (effect: 'blossom', model: 'egg.stl')
  easter: {
    id: "easter",
    name: "Pasen",
    names: {
      nl: "Pasen",
      en: "Easter",
      tr: "Paskalya",
      ru: "Пасха",
      ar: "عيد الفصح",
    },
    dateLabel: "15 maart t/m Pasen",
    dateLabels: {
      nl: "15 maart t/m Pasen",
      en: "March 15 thru Easter",
      tr: "15 Mart - Paskalya",
      ru: "15 марта — Пасха",
      ar: "15 مارس حتى عيد الفصح",
    },
    dates: {
      start: "03-15",
      end: "04-15",
      startMonth: 3,
      startDay: 15,
      endMonth: 4,
      endDay: 15,
    },
    content: {
      title: "Vrolijk Pasen met unieke 3D-lenteprints",
      subtitle:
        "Print vrolijke paaseieren, decoraties en tafelaccessoires op maat. Binnen 2 tot 5 werkdagen bezorgd met PostNL.",
      ctaText: "Ontdek Paasprints",
      titleKey: "hero.holidays.easter.title",
      subtitleKey: "hero.holidays.easter.subtitle",
      ctaTextKey: "hero.holidays.easter.cta",
      titles: {
        nl: "Vrolijk Pasen met unieke 3D-lenteprints",
        en: "Happy Easter with Custom 3D Spring Prints",
        tr: "Özel 3D Bahar Baskıları ile Mutlu Paskalyalar",
        ru: "Светлой Пасхи с весенней 3D-печатью",
        ar: "فصح سعيد مع تصاميم ربيعية ثلاثية الأبعاد",
      },
      subtitles: {
        nl: "Print vrolijke paaseieren, decoraties en tafelaccessoires op maat. Binnen 2 tot 5 werkdagen bezorgd met PostNL.",
        en: "Print festive Easter eggs, spring decor, and table centerpieces. Delivered in 2 to 5 business days via PostNL.",
        tr: "Özel paskalya yumurtaları, masa ve bahar dekorasyonları bastırın. PostNL ile 2 ila 5 iş gününde teslimat.",
        ru: "Печатайте пасхальные яйца, декор и праздничные украшения. Доставка через PostNL за 2–5 рабочих дней.",
        ar: "اطبع بيض الفصح وديكورات المائدة الربيعية المخصصة. التوصيل خلال 2 إلى 5 أيام عمل عبر PostNL.",
      },
      ctaTexts: {
        nl: "Ontdek Paasprints",
        en: "Explore Easter Prints",
        tr: "Paskalya Baskılarını Keşfet",
        ru: "Смотреть пасхальную печать",
        ar: "استكشف تصاميم الفصح",
      },
    },
    modelUrl: "/uploads/hero/egg.stl",
    colorPalette: {
      heroBg:
        "bg-gradient-to-b from-[#142316] via-[#0d180f] to-[#070e08] border border-emerald-400/25 shadow-[0_32px_64px_-16px_rgba(20,35,22,0.8)]",
      bgColor:
        "bg-gradient-to-b from-[#142316] via-[#0d180f] to-[#070e08] border border-emerald-400/25 shadow-[0_32px_64px_-16px_rgba(20,35,22,0.8)]",
      eyebrowText: "text-yellow-300",
      headingText: "text-white",
      textColor: "text-white",
      subtext: "text-emerald-100/90",
      ctaButton:
        "bg-yellow-400 text-gray-950 hover:bg-yellow-300 shadow-lg hover:shadow-yellow-400/30 active:scale-[0.98]",
      ctaColor:
        "bg-yellow-400 text-gray-950 hover:bg-yellow-300 shadow-lg hover:shadow-yellow-400/30 active:scale-[0.98]",
      secondaryLink: "text-emerald-300 hover:text-white",
      accentGlow: "bg-yellow-300/20",
      secondaryGlow: "bg-emerald-400/15",
      centerGlow: "bg-lime-400/10",
      badgeBg: "bg-yellow-400/20 border-yellow-300/30 text-yellow-200",
      paginationDotActive: "bg-yellow-400",
      modelViewerAura: "bg-yellow-300/15",
      focusRing: "focus:ring-yellow-400",
    },
    effect: "blossom",
    eyebrow: "Pasen Special",
    eyebrowKey: "hero.holidays.easter.eyebrow",
    eyebrows: {
      nl: "Pasen Special",
      en: "Easter Special",
      tr: "Paskalya Özel",
      ru: "Пасхальный спецвыпуск",
      ar: "خاص بعيد الفصح",
    },
  },

  // 2. Koningsdag: 1 april t/m 27 april
  kingsDay: {
    id: "kingsDay",
    name: "Koningsdag",
    names: {
      nl: "Koningsdag",
      en: "King's Day",
      tr: "Kral Günü",
      ru: "День короля",
      ar: "يوم الملك",
    },
    dateLabel: "1 april t/m 27 april",
    dateLabels: {
      nl: "1 april t/m 27 april",
      en: "April 1 thru April 27",
      tr: "1 Nisan - 27 Nisan",
      ru: "1 апреля — 27 апреля",
      ar: "1 أبريل حتى 27 أبريل",
    },
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

  // 3. Moederdag: 15 april t/m 2e zondag van mei (effect: 'blossom', model: 'mothers-day.stl', focus: HueForge cadeaus)
  mothersDay: {
    id: "mothersDay",
    name: "Moederdag",
    names: {
      nl: "Moederdag",
      en: "Mother's Day",
      tr: "Anneler Günü",
      ru: "День матери",
      ar: "عيد الأم",
    },
    dateLabel: "15 april t/m 2e zondag van mei",
    dateLabels: {
      nl: "15 april t/m 2e zondag van mei",
      en: "April 15 thru 2nd Sunday of May",
      tr: "15 Nisan - Mayıs'ın 2. Pazarı",
      ru: "15 апреля — 2-е воскресенье мая",
      ar: "15 أبريل حتى الأحد الثاني من مايو",
    },
    dates: {
      start: "04-15",
      end: "05-14",
      startMonth: 4,
      startDay: 15,
      endMonth: 5,
      endDay: 14,
    },
    content: {
      title: "Verras mama met een uniek HueForge 3D-kunstwerk",
      subtitle:
        "Zet jullie favoriete herinnering om in een tastbaar 3D-reliëf schilderij. Bestel op tijd: binnen 2 tot 5 werkdagen in huis.",
      ctaText: "Maak Moederdagcadeau",
      titleKey: "hero.holidays.mothersDay.title",
      subtitleKey: "hero.holidays.mothersDay.subtitle",
      ctaTextKey: "hero.holidays.mothersDay.cta",
      titles: {
        nl: "Verras mama met een uniek HueForge 3D-kunstwerk",
        en: "Surprise Mom with a Unique HueForge 3D Art Piece",
        tr: "Anneler Günü için Eşsiz HueForge 3D Tablo Hediyesi",
        ru: "Удивите маму уникальной 3D-картиной HueForge",
        ar: "فاجئ والدتك بلوحة فنية ثلاثية الأبعاد بتقنية HueForge",
      },
      subtitles: {
        nl: "Zet jullie favoriete herinnering om in een tastbaar 3D-reliëf schilderij. Bestel op tijd: binnen 2 tot 5 werkdagen in huis.",
        en: "Transform your favorite memory into a touchable optical 3D relief painting. Delivered in 2 to 5 business days.",
        tr: "En güzel anınızı dokunulabilir 3D rölyef tablosuna dönüştürün. PostNL ile 2 ila 5 iş gününde kapınızda.",
        ru: "Превратите любимое фото в осязаемую рельефную картину. Доставка за 2–5 рабочих дней через PostNL.",
        ar: "حوّل ذكرياتكم المميزة إلى لوحة بارزة ملموسة. اطلب مسبقاً: التوصيل خلال 2 إلى 5 أيام عمل.",
      },
      ctaTexts: {
        nl: "Maak Moederdagcadeau",
        en: "Create Mother's Day Gift",
        tr: "Anneler Günü Hediyesi Yap",
        ru: "Создать подарок маме",
        ar: "اصنع هدية عيد الأم",
      },
    },
    modelUrl: "/uploads/hero/mothers-day.stl",
    colorPalette: {
      heroBg:
        "bg-gradient-to-b from-[#220d1c] via-[#150711] to-[#0b0309] border border-pink-400/30 shadow-[0_32px_64px_-16px_rgba(34,13,28,0.8)]",
      bgColor:
        "bg-gradient-to-b from-[#220d1c] via-[#150711] to-[#0b0309] border border-pink-400/30 shadow-[0_32px_64px_-16px_rgba(34,13,28,0.8)]",
      eyebrowText: "text-pink-300",
      headingText: "text-white",
      textColor: "text-white",
      subtext: "text-pink-100/90",
      ctaButton:
        "bg-pink-400 text-gray-950 hover:bg-pink-300 shadow-lg hover:shadow-pink-400/30 active:scale-[0.98]",
      ctaColor:
        "bg-pink-400 text-gray-950 hover:bg-pink-300 shadow-lg hover:shadow-pink-400/30 active:scale-[0.98]",
      secondaryLink: "text-pink-200 hover:text-white",
      accentGlow: "bg-pink-400/20",
      secondaryGlow: "bg-rose-400/15",
      centerGlow: "bg-purple-500/10",
      badgeBg: "bg-pink-500/20 border-pink-400/30 text-pink-200",
      paginationDotActive: "bg-pink-400",
      modelViewerAura: "bg-pink-400/15",
      focusRing: "focus:ring-pink-400",
    },
    effect: "blossom",
    eyebrow: "Moederdag Special",
    eyebrowKey: "hero.holidays.mothersDay.eyebrow",
    eyebrows: {
      nl: "Moederdag Special",
      en: "Mother's Day Special",
      tr: "Anneler Günü Özel",
      ru: "Ко Дню матери",
      ar: "خاص بعيد الأم",
    },
  },

  // 4. Vaderdag: 20 mei t/m 3e zondag van juni (effect: 'none', donker palet, model: 'fathers-day.stl', focus: gadgets & organizers)
  fathersDay: {
    id: "fathersDay",
    name: "Vaderdag",
    names: {
      nl: "Vaderdag",
      en: "Father's Day",
      tr: "Babalar Günü",
      ru: "День отца",
      ar: "عيد الأب",
    },
    dateLabel: "20 mei t/m 3e zondag van juni",
    dateLabels: {
      nl: "20 mei t/m 3e zondag van juni",
      en: "May 20 thru 3rd Sunday of June",
      tr: "20 Mayıs - Haziran'ın 3. Pazarı",
      ru: "20 мая — 3-е воскресенье июня",
      ar: "20 مايو حتى الأحد الثالث من يونيو",
    },
    dates: {
      start: "05-20",
      end: "06-21",
      startMonth: 5,
      startDay: 20,
      endMonth: 6,
      endDay: 21,
    },
    content: {
      title: "Stoere 3D-geprinte gadgets & organizers voor vader",
      subtitle:
        "Van slimme desk organizers tot gereedschapshouders op maat. Binnen 2 tot 5 werkdagen bezorgd door PostNL.",
      ctaText: "Bekijk Vaderdag Gadgets",
      titleKey: "hero.holidays.fathersDay.title",
      subtitleKey: "hero.holidays.fathersDay.subtitle",
      ctaTextKey: "hero.holidays.fathersDay.cta",
      titles: {
        nl: "Stoere 3D-geprinte gadgets & organizers voor vader",
        en: "Rugged 3D Printed Gadgets & Organizers for Dad",
        tr: "Babalar Günü için Dayanıklı 3D Düzenleyiciler ve Aletler",
        ru: "Практичные 3D-гаджеты и органайзеры для папы",
        ar: "أدوات ومنظمات عملية مطبوعة ثلاثية الأبعاد للأب",
      },
      subtitles: {
        nl: "Van slimme desk organizers tot gereedschapshouders op maat. Binnen 2 tot 5 werkdagen bezorgd door PostNL.",
        en: "From sleek desk organizers to precision tool mounts and custom gear. Delivered in 2 to 5 business days via PostNL.",
        tr: "Masaüstü düzenleyicilerden özel aparatlara kadar her şey. PostNL ile 2 ila 5 iş gününde teslimat.",
        ru: "От удобных настольных органайзеров до креплений для инструментов. Доставка за 2–5 рабочих дней.",
        ar: "من منظمات المكاتب الذكية إلى حوامل الأدوات الدقيقة. التوصيل خلال 2 إلى 5 أيام عمل عبر PostNL.",
      },
      ctaTexts: {
        nl: "Bekijk Vaderdag Gadgets",
        en: "Explore Father's Day Gifts",
        tr: "Babalar Günü Hediyelerini Gör",
        ru: "Подарки ко Дню отца",
        ar: "استعرض هدايا عيد الأب",
      },
    },
    modelUrl: "/uploads/hero/fathers-day.stl",
    colorPalette: {
      heroBg:
        "bg-gradient-to-b from-[#0f172a] via-[#090e1a] to-[#04060c] border border-slate-700/50 shadow-[0_32px_64px_-16px_rgba(15,23,42,0.9)]",
      bgColor:
        "bg-gradient-to-b from-[#0f172a] via-[#090e1a] to-[#04060c] border border-slate-700/50 shadow-[0_32px_64px_-16px_rgba(15,23,42,0.9)]",
      eyebrowText: "text-cyan-400",
      headingText: "text-white",
      textColor: "text-white",
      subtext: "text-slate-200/90",
      ctaButton:
        "bg-cyan-500 text-gray-950 hover:bg-cyan-400 shadow-lg hover:shadow-cyan-500/30 active:scale-[0.98]",
      ctaColor:
        "bg-cyan-500 text-gray-950 hover:bg-cyan-400 shadow-lg hover:shadow-cyan-500/30 active:scale-[0.98]",
      secondaryLink: "text-cyan-300 hover:text-white",
      accentGlow: "bg-cyan-500/15",
      secondaryGlow: "bg-blue-600/15",
      centerGlow: "bg-slate-700/20",
      badgeBg: "bg-slate-800/60 border-cyan-500/30 text-cyan-200",
      paginationDotActive: "bg-cyan-400",
      modelViewerAura: "bg-cyan-500/15",
      focusRing: "focus:ring-cyan-400",
    },
    effect: "none",
    eyebrow: "Vaderdag Special",
    eyebrowKey: "hero.holidays.fathersDay.eyebrow",
    eyebrows: {
      nl: "Vaderdag Special",
      en: "Father's Day Special",
      tr: "Babalar Günü Özel",
      ru: "Ко Дню отца",
      ar: "خاص بعيد الأب",
    },
  },

  // 5. Back to Work: 15 augustus t/m 15 september (effect: 'none', zakelijk palet, model: 'cable-holder.stl', focus: kantoor/B2B)
  backToWork: {
    id: "backToWork",
    name: "Back to Work",
    names: {
      nl: "Back to Work",
      en: "Back to Work",
      tr: "İşe Dönüş",
      ru: "Снова в офис",
      ar: "العودة للعمل",
    },
    dateLabel: "15 augustus t/m 15 september",
    dateLabels: {
      nl: "15 augustus t/m 15 september",
      en: "August 15 thru September 15",
      tr: "15 Ağustos - 15 Eylül",
      ru: "15 августа — 15 сентября",
      ar: "15 أغسطس حتى 15 سبتمبر",
    },
    dates: {
      start: "08-15",
      end: "09-15",
      startMonth: 8,
      startDay: 15,
      endMonth: 9,
      endDay: 15,
    },
    content: {
      title: "Start georganiseerd: slimme 3D-kantooroplossingen",
      subtitle:
        "Kabelmanagement, bureau-organizers en prototypes voor professionals. Binnen 2 tot 5 werkdagen geleverd.",
      ctaText: "Optimaliseer Je Werkplek",
      titleKey: "hero.holidays.backToWork.title",
      subtitleKey: "hero.holidays.backToWork.subtitle",
      ctaTextKey: "hero.holidays.backToWork.cta",
      titles: {
        nl: "Start georganiseerd: slimme 3D-kantooroplossingen",
        en: "Back to Work: Smart 3D Workplace & Office Gear",
        tr: "İşe Dönüş: Akıllı 3D Ofis ve Çalışma Çözümleri",
        ru: "Снова за работу: умные 3D-решения для офиса",
        ar: "العودة للعمل: حلول مكتبية ثلاثية الأبعاد ذكية",
      },
      subtitles: {
        nl: "Kabelmanagement, bureau-organizers en prototypes voor professionals. Binnen 2 tot 5 werkdagen geleverd.",
        en: "Cable management, desk organizers, and batch parts for professionals. Delivered in 2 to 5 business days.",
        tr: "Kablo kanalları, masa aksesuarları ve profesyonel seriler. 2 ila 5 iş gününde hızlı teslimat.",
        ru: "Кабель-менеджмент, органайзеры и серийное производство. Доставка за 2–5 рабочих дней через PostNL.",
        ar: "تنظيم الأسلاك، منظمات المكاتب، ودفعات الإنتاج التجاري. التوصيل خلال 2 إلى 5 أيام عمل.",
      },
      ctaTexts: {
        nl: "Optimaliseer Je Werkplek",
        en: "Upgrade Your Desk Setup",
        tr: "Çalışma Alanını Geliştir",
        ru: "Обустроить рабочее место",
        ar: "طور مساحة عملك",
      },
    },
    modelUrl: "/uploads/hero/cable-holder.stl",
    colorPalette: {
      heroBg:
        "bg-gradient-to-b from-[#0c1829] via-[#070f1a] to-[#03070d] border border-blue-500/25 shadow-[0_32px_64px_-16px_rgba(12,24,41,0.85)]",
      bgColor:
        "bg-gradient-to-b from-[#0c1829] via-[#070f1a] to-[#03070d] border border-blue-500/25 shadow-[0_32px_64px_-16px_rgba(12,24,41,0.85)]",
      eyebrowText: "text-blue-400",
      headingText: "text-white",
      textColor: "text-white",
      subtext: "text-blue-100/90",
      ctaButton:
        "bg-blue-500 text-white hover:bg-blue-400 shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]",
      ctaColor:
        "bg-blue-500 text-white hover:bg-blue-400 shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]",
      secondaryLink: "text-blue-300 hover:text-white",
      accentGlow: "bg-blue-500/20",
      secondaryGlow: "bg-indigo-500/15",
      centerGlow: "bg-sky-500/10",
      badgeBg: "bg-blue-500/20 border-blue-400/30 text-blue-200",
      paginationDotActive: "bg-blue-500",
      modelViewerAura: "bg-blue-500/15",
      focusRing: "focus:ring-blue-400",
    },
    effect: "none",
    eyebrow: "Back to Work Special",
    eyebrowKey: "hero.holidays.backToWork.eyebrow",
    eyebrows: {
      nl: "Back to Work Special",
      en: "Back to Work Special",
      tr: "İşe Dönüş Özel",
      ru: "Снова в офис",
      ar: "العودة إلى العمل",
    },
  },

  // 6. Dierendag: 15 september t/m 4 oktober (effect: 'pawprints', model: 'dog-tag.stl', focus: huisdier accessoires in sterk PETG)
  animalDay: {
    id: "animalDay",
    name: "Dierendag",
    names: {
      nl: "Dierendag",
      en: "World Animal Day",
      tr: "Hayvanları Koruma Günü",
      ru: "День защиты животных",
      ar: "اليوم العالمي للحيوان",
    },
    dateLabel: "15 september t/m 4 oktober",
    dateLabels: {
      nl: "15 september t/m 4 oktober",
      en: "September 15 thru October 4",
      tr: "15 Eylül - 4 Ekim",
      ru: "15 сентября — 4 октября",
      ar: "15 سبتمبر حتى 4 أكتوبر",
    },
    dates: {
      start: "09-15",
      end: "10-04",
      startMonth: 9,
      startDay: 15,
      endMonth: 10,
      endDay: 4,
    },
    content: {
      title: "Verwen je trouwe viervoeter op Dierendag",
      subtitle:
        "Gepersonaliseerde penningen en handige voeraccessoires in oersterk PETG. Binnen 2 tot 5 werkdagen bezorgd via PostNL.",
      ctaText: "Bestel Huisdier Accessoires",
      titleKey: "hero.holidays.animalDay.title",
      subtitleKey: "hero.holidays.animalDay.subtitle",
      ctaTextKey: "hero.holidays.animalDay.cta",
      titles: {
        nl: "Verwen je trouwe viervoeter op Dierendag",
        en: "Celebrate World Animal Day with Custom Pet Gear",
        tr: "Hayvanları Koruma Günü'nde Evcil Dostunuza Özel 3D Baskı",
        ru: "Порадуйте питомцев ко Дню защиты животных",
        ar: "دلل أليفك في اليوم العالمي للحيوان",
      },
      subtitles: {
        nl: "Gepersonaliseerde penningen en handige voeraccessoires in oersterk PETG. Binnen 2 tot 5 werkdagen bezorgd via PostNL.",
        en: "Personalized dog tags and pet accessories printed in ultra-tough PETG. Delivered in 2 to 5 business days via PostNL.",
        tr: "Ekstra dayanıklı PETG ile kişiselleştirilmiş tasmalar ve aksesuarlar. 2 ila 5 iş gününde teslimat.",
        ru: "Именные адресники и аксессуары из ударопрочного PETG. Доставка через PostNL за 2–5 рабочих дней.",
        ar: "قلائد أسماء مخصصة وإكسسوارات قوية مصنوعة من PETG. التوصيل خلال 2 إلى 5 أيام عمل عبر PostNL.",
      },
      ctaTexts: {
        nl: "Bestel Huisdier Accessoires",
        en: "Order Pet Accessories",
        tr: "Evcil Hayvan Ürünlerini Sipariş Et",
        ru: "Заказать товары для питомцев",
        ar: "اطلب مستلزمات الحيوانات",
      },
    },
    modelUrl: "/uploads/hero/dog-tag.stl",
    colorPalette: {
      heroBg:
        "bg-gradient-to-b from-[#1c140a] via-[#120c06] to-[#090603] border border-amber-600/30 shadow-[0_32px_64px_-16px_rgba(28,20,10,0.8)]",
      bgColor:
        "bg-gradient-to-b from-[#1c140a] via-[#120c06] to-[#090603] border border-amber-600/30 shadow-[0_32px_64px_-16px_rgba(28,20,10,0.8)]",
      eyebrowText: "text-amber-400",
      headingText: "text-white",
      textColor: "text-white",
      subtext: "text-amber-100/90",
      ctaButton:
        "bg-amber-500 text-gray-950 hover:bg-amber-400 shadow-lg hover:shadow-amber-500/30 active:scale-[0.98]",
      ctaColor:
        "bg-amber-500 text-gray-950 hover:bg-amber-400 shadow-lg hover:shadow-amber-500/30 active:scale-[0.98]",
      secondaryLink: "text-amber-300 hover:text-white",
      accentGlow: "bg-amber-500/20",
      secondaryGlow: "bg-orange-500/15",
      centerGlow: "bg-emerald-600/10",
      badgeBg: "bg-amber-500/20 border-amber-400/30 text-amber-200",
      paginationDotActive: "bg-amber-500",
      modelViewerAura: "bg-amber-500/15",
      focusRing: "focus:ring-amber-400",
    },
    effect: "pawprints",
    eyebrow: "Dierendag Special",
    eyebrowKey: "hero.holidays.animalDay.eyebrow",
    eyebrows: {
      nl: "Dierendag Special",
      en: "Animal Day Special",
      tr: "Hayvanlar Günü Özel",
      ru: "Ко Дню животных",
      ar: "يوم الحيوان العالمي",
    },
  },

  // 7. Halloween: 1 oktober t/m 31 oktober
  halloween: {
    id: "halloween",
    name: "Halloween",
    names: {
      nl: "Halloween",
      en: "Halloween",
      tr: "Cadılar Bayramı",
      ru: "Хэллоуин",
      ar: "الهالوين",
    },
    dateLabel: "1 oktober t/m 31 oktober",
    dateLabels: {
      nl: "1 oktober t/m 31 oktober",
      en: "October 1 thru October 31",
      tr: "1 Ekim - 31 Ekim",
      ru: "1 октября — 31 октября",
      ar: "1 أكتوبر حتى 31 أكتوبر",
    },
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

  // 8. Sinterklaas: 1 november t/m 5 december
  sinterklaas: {
    id: "sinterklaas",
    name: "Sinterklaas",
    names: {
      nl: "Sinterklaas",
      en: "Sinterklaas",
      tr: "Sinterklaas",
      ru: "Синтерклаас",
      ar: "سينتركلاس",
    },
    dateLabel: "1 november t/m 5 december",
    dateLabels: {
      nl: "1 november t/m 5 december",
      en: "November 1 thru December 5",
      tr: "1 Kasım - 5 Aralık",
      ru: "1 ноября — 5 декабря",
      ar: "1 نوفمبر حتى 5 ديسمبر",
    },
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

  // 9. Kerstmis: 6 december t/m 26 december
  christmas: {
    id: "christmas",
    name: "Kerstmis",
    names: {
      nl: "Kerstmis",
      en: "Christmas",
      tr: "Noel",
      ru: "Рождество",
      ar: "عيد الميلاد",
    },
    dateLabel: "6 december t/m 26 december",
    dateLabels: {
      nl: "6 december t/m 26 december",
      en: "December 6 thru December 26",
      tr: "6 Aralık - 26 Aralık",
      ru: "6 декабря — 26 декабря",
      ar: "6 ديسمبر حتى 26 ديسمبر",
    },
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

  // 10. Oud & Nieuw: 27 december t/m 2 januari
  newYear: {
    id: "newYear",
    name: "Oud & Nieuw",
    names: {
      nl: "Oud & Nieuw",
      en: "New Year",
      tr: "Yılbaşı",
      ru: "Новый год",
      ar: "رأس السنة",
    },
    dateLabel: "27 december t/m 2 januari",
    dateLabels: {
      nl: "27 december t/m 2 januari",
      en: "December 27 thru January 2",
      tr: "27 Aralık - 2 Ocak",
      ru: "27 декабря — 2 января",
      ar: "27 ديسمبر حتى 2 يناير",
    },
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

  // 11. Valentijnsdag: 20 januari t/m 14 februari
  valentines: {
    id: "valentines",
    name: "Valentijnsdag",
    names: {
      nl: "Valentijnsdag",
      en: "Valentine's Day",
      tr: "Sevgililer Günü",
      ru: "День святого Валентина",
      ar: "عيد الحب",
    },
    dateLabel: "20 januari t/m 14 februari",
    dateLabels: {
      nl: "20 januari t/m 14 februari",
      en: "January 20 thru February 14",
      tr: "20 Ocak - 14 Şubat",
      ru: "20 января — 14 февраля",
      ar: "20 يناير حتى 14 فبراير",
    },
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
};

/**
 * Calculates Easter Sunday for a given year using Meeus/Jones/Butcher algorithm
 */
export function getEasterSundayDate(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

/**
 * Calculates Easter Monday (Tweede Paasdag) for a given year
 */
export function getEasterMondayDate(year: number): { month: number; day: number } {
  const easter = getEasterSundayDate(year);
  const date = new Date(year, easter.month - 1, easter.day + 1);
  return { month: date.getMonth() + 1, day: date.getDate() };
}

/**
 * Calculates Mother's Day (2nd Sunday of May) for a given year
 */
export function getMothersDayDate(year: number): { month: number; day: number } {
  const may1 = new Date(year, 4, 1);
  const dayOfWeek = may1.getDay();
  const firstSunday = (7 - dayOfWeek) % 7 + 1;
  const secondSunday = firstSunday + 7;
  return { month: 5, day: secondSunday };
}

/**
 * Calculates Father's Day (3rd Sunday of June) for a given year
 */
export function getFathersDayDate(year: number): { month: number; day: number } {
  const june1 = new Date(year, 5, 1);
  const dayOfWeek = june1.getDay();
  const firstSunday = (7 - dayOfWeek) % 7 + 1;
  const thirdSunday = firstSunday + 14;
  return { month: 6, day: thirdSunday };
}

export function isDateInHoliday(date: Date, holiday: HolidayConfigItem): boolean {
  const year = date.getFullYear();
  const m = date.getMonth() + 1; // 1-12
  const d = date.getDate(); // 1-31
  const current = m * 100 + d;

  let startMonth = holiday.dates.startMonth;
  let startDay = holiday.dates.startDay;
  let endMonth = holiday.dates.endMonth;
  let endDay = holiday.dates.endDay;

  // Dynamic calculation for movable holidays
  if (holiday.id === "easter") {
    const easterMonday = getEasterMondayDate(year);
    endMonth = easterMonday.month;
    endDay = easterMonday.day;
  } else if (holiday.id === "mothersDay") {
    const mothersDay = getMothersDayDate(year);
    endMonth = mothersDay.month;
    endDay = mothersDay.day;
  } else if (holiday.id === "fathersDay") {
    const fathersDay = getFathersDayDate(year);
    endMonth = fathersDay.month;
    endDay = fathersDay.day;
  }

  const start = startMonth * 100 + startDay;
  const end = endMonth * 100 + endDay;

  if (start <= end) {
    return current >= start && current <= end;
  }
  // Holiday crosses New Year boundary (e.g. Dec 27 to Jan 2)
  return current >= start || current <= end;
}

// Ordered prioritization to handle seasonal transitions cleanly
export const HOLIDAY_PRIORITY: HolidayKey[] = [
  "easter",
  "kingsDay",
  "mothersDay",
  "fathersDay",
  "backToWork",
  "animalDay",
  "halloween",
  "sinterklaas",
  "christmas",
  "newYear",
  "valentines",
];

export function getActiveHoliday(
  date: Date = new Date(),
  config: HolidayConfig = holidayConfig
): HolidayConfigItem | null {
  for (const key of HOLIDAY_PRIORITY) {
    const holiday = config[key];
    if (holiday && isDateInHoliday(date, holiday)) {
      return holiday;
    }
  }
  return null;
}

export function getHolidayName(
  holidayOrKey: HolidayConfigItem | HolidayKey,
  language: SupportedLanguage
): string {
  const holiday =
    typeof holidayOrKey === "string" ? holidayConfig[holidayOrKey] : holidayOrKey;
  if (!holiday) return "";
  if (holiday.names?.[language]) return holiday.names[language];
  return holiday.name || holiday.id;
}

export function getHolidayDateLabel(
  holidayOrKey: HolidayConfigItem | HolidayKey,
  language: SupportedLanguage
): string {
  const holiday =
    typeof holidayOrKey === "string" ? holidayConfig[holidayOrKey] : holidayOrKey;
  if (!holiday) return "";
  if (holiday.dateLabels?.[language]) return holiday.dateLabels[language];
  return holiday.dateLabel || `${holiday.dates.start} - ${holiday.dates.end}`;
}

export function getHolidayTitle(
  holidayOrKey: HolidayConfigItem | HolidayKey,
  language: SupportedLanguage,
  t?: (key: TranslationKey) => string
): string {
  const holiday =
    typeof holidayOrKey === "string" ? holidayConfig[holidayOrKey] : holidayOrKey;
  if (!holiday) return "";
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
  holidayOrKey: HolidayConfigItem | HolidayKey,
  language: SupportedLanguage,
  t?: (key: TranslationKey) => string
): string {
  const holiday =
    typeof holidayOrKey === "string" ? holidayConfig[holidayOrKey] : holidayOrKey;
  if (!holiday) return "";
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
  holidayOrKey: HolidayConfigItem | HolidayKey,
  language: SupportedLanguage,
  t?: (key: TranslationKey) => string
): string {
  const holiday =
    typeof holidayOrKey === "string" ? holidayConfig[holidayOrKey] : holidayOrKey;
  if (!holiday) return "";
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
  holidayOrKey: HolidayConfigItem | HolidayKey,
  language: SupportedLanguage,
  t?: (key: TranslationKey) => string
): string {
  const holiday =
    typeof holidayOrKey === "string" ? holidayConfig[holidayOrKey] : holidayOrKey;
  if (!holiday) return "";
  if (t && holiday.eyebrowKey) {
    const val = t(holiday.eyebrowKey);
    if (val && val !== holiday.eyebrowKey) return val;
  }
  if (holiday.eyebrows?.[language]) {
    return holiday.eyebrows[language];
  }
  return holiday.eyebrow || "";
}
