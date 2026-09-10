export interface Coupon {
  id?: string;
  code: string;
  title?: string;
  description?: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  minOrderValue?: number;
  maxDiscount?: number;
  firstOrderOnly?: boolean;
  expiryDate?: string;
  validUntil?: string;
  active?: boolean;
  isActive?: boolean;
  usageLimit?: number;
  usageCount?: number;
  applicableCategories?: string[];
  applicableProducts?: string[];
  createdAt?: string;
}
