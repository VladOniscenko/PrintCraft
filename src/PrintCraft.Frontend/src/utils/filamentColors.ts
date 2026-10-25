const FILAMENT_COLOR_MAP: Record<string, number> = {
  // Multi-word / specific colors (high priority)
  "navy blue": 0x172554,
  "midnight navy": 0x0f172a,
  "light blue": 0x38bdf8,
  "sky blue": 0x38bdf8,
  "baby blue": 0x7dd3fc,
  "dark blue": 0x1e3a8a,
  "crimson red": 0xdc2626,
  "dark red": 0x991b1b,
  "dark green": 0x14532d,
  "forest green": 0x166534,
  "lime green": 0x84cc16,
  "neon green": 0x22c55e,
  "sunburst yellow": 0xfbbf24,
  "jade white": 0xf8fafc,
  "pure white": 0xffffff,
  "deep black": 0x09090b,
  "slate charcoal": 0x334155,
  "cool grey": 0x64748b,
  "cool gray": 0x64748b,
  "warm grey": 0x78716c,
  "warm gray": 0x78716c,
  "dark grey": 0x3f3f46,
  "dark gray": 0x3f3f46,
  "light grey": 0xd4d4d8,
  "light gray": 0xd4d4d8,
  "neon magenta": 0xc026d3,
  "vibrant orange": 0xf97316,

  // Dutch multi-word colors
  lichtblauw: 0x38bdf8,
  marineblauw: 0x172554,
  donkerblauw: 0x1e3a8a,
  donkergroen: 0x14532d,
  donkergrijs: 0x3f3f46,
  lichtgrijs: 0xd4d4d8,

  // Single-word standard and specialty colors
  magenta: 0xd946ef,
  fuchsia: 0xd946ef,
  teal: 0x14b8a6,
  cyan: 0x06b6d4,
  cyaan: 0x06b6d4,
  turquoise: 0x06b6d4,
  beige: 0xd4b996,
  tan: 0xd2b48c,
  khaki: 0xbdb76b,
  ivory: 0xfffff0,
  cream: 0xfef9c3,
  olive: 0x65a30d,
  maroon: 0x881337,
  burgundy: 0x831843,
  wine: 0x701a75,
  charcoal: 0x27272a,
  anthracite: 0x27272a,
  slate: 0x475569,
  lime: 0x84cc16,
  mint: 0x6ee7b7,
  coral: 0xf87171,
  terracotta: 0xc2410c,
  mustard: 0xca8a04,
  ochre: 0xd97706,
  lavender: 0xc084fc,
  lilac: 0xd8b4fe,
  black: 0x18181b,
  zwart: 0x18181b,
  white: 0xf4f4f5,
  wit: 0xf4f4f5,
  grey: 0x71717a,
  gray: 0x71717a,
  grijs: 0x71717a,
  red: 0xef4444,
  rood: 0xef4444,
  crimson: 0xdc2626,
  navy: 0x1e3a8a,
  blue: 0x2563eb,
  blauw: 0x2563eb,
  green: 0x10b981,
  groen: 0x10b981,
  emerald: 0x059669,
  yellow: 0xfbbf24,
  geel: 0xfbbf24,
  amber: 0xf59e0b,
  orange: 0xf97316,
  oranje: 0xf97316,
  purple: 0x8b5cf6,
  paars: 0x8b5cf6,
  violet: 0x7c3aed,
  pink: 0xec4899,
  roze: 0xec4899,
  rose: 0xf43f5e,
  gold: 0xd97706,
  silver: 0xa1a1aa,
  bronze: 0x92400e,
  copper: 0xb45309,
  brown: 0x78350f,
  bruin: 0x78350f,
  clear: 0xe2e8f0,
  transparent: 0xe2e8f0,
  translucent: 0xe2e8f0,
  peach: 0xf59e0b,
  custom: 0x6366f1,
};

// Sort entries by key length descending so specific multi-word keys match first
const SORTED_COLOR_ENTRIES = Object.entries(FILAMENT_COLOR_MAP).sort(
  (a, b) => b[0].length - a[0].length,
);

export function getFilamentHexColor(colorName?: string): number {
  if (!colorName) return 0x2563eb;
  const clean = colorName.trim().toLowerCase();

  if (/^#?[0-9a-f]{6}$/i.test(clean)) {
    return parseInt(clean.replace("#", ""), 16);
  }

  // Exact full name match first
  if (FILAMENT_COLOR_MAP[clean]) {
    return FILAMENT_COLOR_MAP[clean];
  }

  // Longest substring match
  for (const [key, hex] of SORTED_COLOR_ENTRIES) {
    if (clean.includes(key)) return hex;
  }

  return 0x2563eb;
}

