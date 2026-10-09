export type UploadFlowType = "native-3d" | "filament-painting";

export interface FilamentPaintingPaletteItem {
  filamentId: string;
  name: string;
  colorHex: string;
  material: string;
  transmissionDistanceMm: number; // TD in mm (e.g. Black 0.6mm, White 5.0mm)
  startHeightMm: number;
  endHeightMm: number;
}

export interface LayerSwapInstruction {
  swapNumber: number;
  layerNumber: number;
  heightMm: number;
  colorName: string;
  colorHex: string;
  material: string;
  filamentId?: string;
  instruction: string;
}

export type HueForgeQualityPreset = "Low" | "Medium" | "Best";

export interface FilamentPaintingConfig {
  quality: HueForgeQualityPreset;
  targetWidthMm: number;
  targetHeightMm: number;
  palette: FilamentPaintingPaletteItem[];
  baseLayerHeightMm?: number;
  layerHeightMm?: number;
  maxDepthMm?: number;
  minBaseThicknessMm?: number;
}

export interface FilamentPaintingGenerationResult {
  modelGlbUrl: string;
  modelStlUrl: string;
  modelZipUrl?: string;
  previewImageUrl: string;
  layerSwaps: LayerSwapInstruction[];
  dimensions: {
    x: number;
    y: number;
    z: number;
  };
  volumeMm3: number;
  estimatedGrams: number;
  totalLayers: number;
  estimatedPrintTime?: string;
  estimatedPrice?: number;
  unitPrice?: number;
  colorSwapFee?: number;
}

export interface CuratedPalettePreset {
  id: string;
  name: string;
  description: string;
  filaments: Array<{
    name: string;
    colorHex: string;
    material: string;
    transmissionDistanceMm: number;
    heightShare: number; // 0.0 to 1.0 fraction of relief
  }>;
}

export const CURATED_PALETTES: CuratedPalettePreset[] = [
  {
    id: "standard-4-color",
    name: "Classic 4-Color (Black / Red / Yellow / White)",
    description: "Ideal for high-contrast illustrations, logos, and comic book art.",
    filaments: [
      { name: "Black", colorHex: "#111111", material: "PLA", transmissionDistanceMm: 0.6, heightShare: 0.28 },
      { name: "Crimson Red", colorHex: "#DC2626", material: "PLA", transmissionDistanceMm: 2.2, heightShare: 0.24 },
      { name: "Sunburst Yellow", colorHex: "#FBBF24", material: "PLA", transmissionDistanceMm: 3.8, heightShare: 0.24 },
      { name: "Jade White", colorHex: "#FFFFFF", material: "PLA", transmissionDistanceMm: 5.0, heightShare: 0.24 },
    ],
  },
  {
    id: "monochrome-greyscale",
    name: "Monochrome Portrait (4-Tone Greyscale)",
    description: "Perfect for classic black-and-white portraits and high-detail photography.",
    filaments: [
      { name: "Deep Black", colorHex: "#09090B", material: "PLA", transmissionDistanceMm: 0.5, heightShare: 0.25 },
      { name: "Slate Charcoal", colorHex: "#475569", material: "PLA", transmissionDistanceMm: 1.8, heightShare: 0.25 },
      { name: "Cool Grey", colorHex: "#94A3B8", material: "PLA", transmissionDistanceMm: 3.2, heightShare: 0.25 },
      { name: "Pure White", colorHex: "#FFFFFF", material: "PLA", transmissionDistanceMm: 5.2, heightShare: 0.25 },
    ],
  },
  {
    id: "warm-sunset",
    name: "Sunset Glow (Navy / Magenta / Orange / Cream)",
    description: "Vibrant gradients for landscapes, nature scenes, and sci-fi artwork.",
    filaments: [
      { name: "Midnight Navy", colorHex: "#0F172A", material: "PLA", transmissionDistanceMm: 0.7, heightShare: 0.25 },
      { name: "Neon Magenta", colorHex: "#C026D3", material: "PLA", transmissionDistanceMm: 2.4, heightShare: 0.25 },
      { name: "Vibrant Orange", colorHex: "#F97316", material: "PLA", transmissionDistanceMm: 3.6, heightShare: 0.25 },
      { name: "Warm Cream", colorHex: "#FEF3C7", material: "PLA", transmissionDistanceMm: 5.0, heightShare: 0.25 },
    ],
  },
  {
    id: "forest-nature",
    name: "Forest Nature (Dark Brown / Pine / Lime / White)",
    description: "Botanical illustrations, wildlife, and natural landscapes.",
    filaments: [
      { name: "Earth Brown", colorHex: "#3E2723", material: "PLA", transmissionDistanceMm: 0.8, heightShare: 0.25 },
      { name: "Forest Pine", colorHex: "#15803D", material: "PLA", transmissionDistanceMm: 2.0, heightShare: 0.25 },
      { name: "Lime Mist", colorHex: "#A3E635", material: "PLA", transmissionDistanceMm: 3.5, heightShare: 0.25 },
      { name: "Bright White", colorHex: "#FFFFFF", material: "PLA", transmissionDistanceMm: 5.0, heightShare: 0.25 },
    ],
  },
];
