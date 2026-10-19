export const businessInfo = {
  name: "Print My 3D",
  email: "info@printmy3d.work",
  website: "https://printmy3d.work",
  phone: "",
  phoneHref: "",
  address: {
    locality: "Rotterdam",
    countryCode: "NL",
    countryName: {
      en: "Netherlands",
      nl: "Nederland",
      tr: "Hollanda",
      ru: "Нидерланды",
      ar: "هولندا",
    },
  },
  openingHours: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    dayLabels: {
      en: "Mon - Fri",
      nl: "Ma - Vr",
      tr: "Pzt - Cum",
      ru: "Пн - Пт",
      ar: "الإثنين - الجمعة",
    },
    opens: "09:00",
    closes: "18:00",
  },
} as const;