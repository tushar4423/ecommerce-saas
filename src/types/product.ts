export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | 'XXL' | '3XL' | '4XL' | '5XL' | string;

export interface ProductVariant {
  id: string;
  sku: string;
  color: string;
  colorHex: string;
  size: ProductSize;
  stock: number;
  price?: number;
  mrp?: number;
  barcode?: string;
  weightInGrams?: number;
  [key: string]: any;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string;
  isPrimary?: boolean;
  type?: 'front' | 'back' | 'side' | 'detail' | 'model' | string;
  order?: number;
}

export interface ProductAttributeOption {
  id: string;
  label: string;
  value: string;
  colorHex?: string;
}

export interface ProductAttributeGroup {
  id: string;
  name: string;
  key: 'fabric' | 'work' | 'occasion' | 'sleeve' | 'neck' | 'pattern' | 'fit' | 'length' | 'bottomType' | string;
  options: ProductAttributeOption[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: string;
  subcategory?: string;
  subSubCategory?: string;
  gender?: 'Women' | 'Men' | 'Unisex';
  collections?: string[];
  mrp: number;
  sellingPrice: number;
  costPrice?: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  images: ProductImage[];
  variants: ProductVariant[];
  fabric?: string;
  work?: string;
  pattern?: string;
  sleeve?: string;
  neckType?: string;
  neck?: string;
  occasion?: string;
  fit?: string;
  length?: string;
  bottomType?: string;
  dupattaIncluded?: boolean;
  description?: string;
  careInstructions?: string[];
  washCare?: string;
  features?: string[];
  isBestseller?: boolean;
  isNewArrival?: boolean;
  isTrending?: boolean;
  isPlusSize?: boolean;
  isFestive?: boolean;
  badge?: string;
  tags?: string[];
  brand?: string;
  videoUrl?: string;
  videoPoster?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
    ogImage?: string;
  };
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  variantInfo?: string;
  isVerifiedPurchase?: boolean;
  isVerifiedBuyer?: boolean;
  images?: string[];
  helpfulCount?: number;
  status?: 'Approved' | 'Pending' | 'Rejected' | 'Hidden';
  createdAt: string;
}

export interface FilterState {
  category?: string;
  subcategory?: string;
  subSubCategory?: string;
  collection?: string;
  sizes: string[];
  colors: string[];
  fabrics: string[];
  works: string[];
  occasions: string[];
  minPrice: number;
  maxPrice: number;
  discountMin?: number;
  ratingMin?: number;
  inStockOnly?: boolean;
  searchQuery?: string;
  sortBy:
    | 'recommended'
    | 'newest'
    | 'price-asc'
    | 'price-desc'
    | 'price_low'
    | 'price_high'
    | 'bestseller'
    | 'rating'
    | 'discount';
}
