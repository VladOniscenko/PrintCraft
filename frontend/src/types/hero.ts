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
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}
