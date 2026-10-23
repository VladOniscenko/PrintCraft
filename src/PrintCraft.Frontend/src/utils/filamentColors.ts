export function getFilamentHexColor(colorName?: string): number {
  if (!colorName) return 0x2563eb;
  const clean = colorName.trim().toLowerCase();

  if (/^#?[0-9a-f]{6}$/i.test(clean)) {
    return parseInt(clean.replace("#", ""), 16);
  }

  const map: Record<string, number> = {
    black: 0x18181b,
    white: 0xf4f4f5,
    grey: 0x71717a,
    gray: 0x71717a,
    red: 0xef4444,
    crimson: 0xdc2626,
    blue: 0x2563eb,
    navy: 0x1e3a8a,
    green: 0x10b981,
    emerald: 0x059669,
    yellow: 0xfbbf24,
    amber: 0xf59e0b,
    orange: 0xf97316,
    purple: 0x8b5cf6,
    violet: 0x7c3aed,
    pink: 0xec4899,
    rose: 0xf43f5e,
    cyan: 0x06b6d4,
    gold: 0xd97706,
    silver: 0xa1a1aa,
    bronze: 0x92400e,
    copper: 0xb45309,
    brown: 0x78350f,
    clear: 0xe2e8f0,
    transparent: 0xe2e8f0,
    translucent: 0xe2e8f0,
    peach: 0xf59e0b,
    custom: 0x6366f1,
  };

  for (const [key, hex] of Object.entries(map)) {
    if (clean.includes(key)) return hex;
  }

  return 0x2563eb;
}
