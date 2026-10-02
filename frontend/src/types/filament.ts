export interface Filament {
  id: string;
  name: string;
  material: string;
  color: string;
  pricePerGram: number;
  stockQuantity?: number;
  inStock?: boolean;
  description?: string;
}
