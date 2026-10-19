export type HeroMediaType = "image" | "model3d";

export interface HeroSlide {
  id: string;
  title: string;
  subtext: string;
  priceText: string;
  mediaUrl: string;
  mediaType: HeroMediaType;
  instructionTooltip?: string | null;
  titleNl?: string | null;
  subtextNl?: string | null;
  priceTextNl?: string | null;
  instructionTooltipNl?: string | null;
  titles?: Record<string, string> | null;
  subtexts?: Record<string, string> | null;
  priceTexts?: Record<string, string> | null;
  instructionTooltips?: Record<string, string> | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}
