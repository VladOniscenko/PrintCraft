export interface FaqQuestionAnswer {
  q: string;
  a: string;
}

export interface FaqItem {
  id: string;
  question: Record<string, string>;
  answer: Record<string, string>;
  category: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface FaqTopic {
  id: string;
  slug: string;
  key?: string;
  names: Record<string, string>;
  tagline: Record<string, string>;
  badge: Record<string, string>;
  heroTitle: Record<string, string>;
  heroSubtitle: Record<string, string>;
  description: Record<string, string>;
  benefits: Record<string, string[]>;
  recommendedMaterials: string[];
  leadTime: string;
  precision: string;
  metaTitle: Record<string, string>;
  metaDescription: Record<string, string>;
  metaKeywords: Record<string, string>;
  faqs: Record<string, FaqQuestionAnswer[]>;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}
