export interface SubSubCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  featured?: boolean;
  displayOrder?: number;
  productCount?: number;
}

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  subcategories?: SubSubCategory[];
  featured?: boolean;
  displayOrder?: number;
  productCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  description?: string;
  imageUrl?: string;
  image?: string;
  bannerUrl?: string;
  bannerImage?: string;
  icon?: string;
  subcategories?: string[];
  subMenus?: SubCategory[];
  featured?: boolean;
  displayOrder?: number;
  productCount?: number;
  badge?: string;
  isActive?: boolean;
  showInNavbar?: boolean;
  showInHome?: boolean;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

export interface CollectionRule {
  isNewArrival?: boolean;
  isBestseller?: boolean;
  isFestive?: boolean;
  isPlusSize?: boolean;
  category?: string;
  fabric?: string;
  occasion?: string;
  minPrice?: number;
  maxPrice?: number;
  tag?: string;
  minDiscount?: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  title: string;
  subtitle: string;
  description?: string;
  bannerUrl: string;
  imageUrl?: string;
  productCount?: number;
  featured?: boolean;
  displayOrder?: number;
  isActive?: boolean;
  assignmentType?: 'manual' | 'dynamic' | 'both';
  productIds?: string[];
  rules?: CollectionRule;
  createdAt?: string;
  updatedAt?: string;
}
