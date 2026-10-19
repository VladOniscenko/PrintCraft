export interface PolicySection {
  id: string;
  title: Record<string, string>;
  body: Record<string, string>;
  sortOrder: number;
}

export interface PolicyTemplate {
  id: string;
  slug: string;
  title: Record<string, string>;
  lastUpdated: Record<string, string>;
  sections: PolicySection[];
  contactTitle?: Record<string, string>;
  contactBody?: Record<string, string>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

