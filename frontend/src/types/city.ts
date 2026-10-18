export interface ManagedCity {
  id: string;
  slug: string;
  names: Record<string, string>;
  province: string;
  latitude?: number | null;
  longitude?: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}
