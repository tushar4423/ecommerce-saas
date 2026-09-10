export type HomepageSectionType =
  | 'hero_banner_slider'
  | 'features_strip'
  | 'category_circles'
  | 'product_carousel'
  | 'product_grid'
  | 'collection_banner'
  | 'promo_split_banner'
  | 'testimonials'
  | 'instagram_feed'
  | 'brand_story'
  | 'newsletter_signup'
  | 'custom_html';

export interface HomepageSectionConfig {
  id: string;
  type: HomepageSectionType;
  title?: string;
  subtitle?: string;
  badge?: string;
  categorySlug?: string;
  collectionSlug?: string;
  filterCriteria?: {
    isBestseller?: boolean;
    isNewArrival?: boolean;
    isTrending?: boolean;
    isPlusSize?: boolean;
    isFestive?: boolean;
    category?: string;
    tag?: string;
    limit?: number;
  };
  layout?: 'grid' | 'carousel' | 'slider' | 'split' | 'masonry' | 'banner';
  backgroundColor?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  linkUrl?: string;
  ctaText?: string;
  customData?: Record<string, any>;
  order: number;
  isActive: boolean;
}

export interface HomepageCMSConfig {
  id?: string;
  sections: HomepageSectionConfig[];
  metaTitle?: string;
  metaDescription?: string;
  lastUpdated?: string;
}
