/**
 * Centralized Form Validation Schemas & Field Rules
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const Validators = {
  required(value: any, fieldName: string = 'Field'): string | null {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} is required`;
    }
    return null;
  },

  email(value: string): string | null {
    if (!value || !value.trim()) return 'Email is required';
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value.trim())) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  phone(value: string): string | null {
    if (!value || !value.trim()) return 'Phone number is required';
    const cleanPhone = value.replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      return null;
    }
    if (cleanPhone.length !== 10) {
      return 'Please enter a valid 10-digit mobile number';
    }
    if (!/^[6-9]/.test(cleanPhone)) {
      return 'Mobile number must start with 6, 7, 8, or 9';
    }
    return null;
  },

  pincode(value: string): string | null {
    if (!value || !value.trim()) return 'PIN code is required';
    const clean = value.replace(/\D/g, '');
    if (clean.length !== 6) {
      return 'PIN code must be exactly 6 digits';
    }
    if (clean.startsWith('0')) {
      return 'Please enter a valid Indian PIN code';
    }
    return null;
  },

  minNumber(value: number, min: number, fieldName: string = 'Value'): string | null {
    if (typeof value !== 'number' || isNaN(value) || value < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  },

  sku(value: string): string | null {
    if (!value || !value.trim()) return 'SKU code is required';
    if (value.trim().length < 3) return 'SKU code must be at least 3 characters';
    if (!/^[a-zA-Z0-9-_]+$/.test(value.trim())) {
      return 'SKU can only contain alphanumeric characters, hyphens, and underscores';
    }
    return null;
  }
};

/**
 * Validate Product Data
 */
export function validateProductForm(data: {
  name?: string;
  sku?: string;
  category?: string;
  sellingPrice?: number;
  mrp?: number;
  variants?: any[];
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length < 3) {
    errors.name = 'Product name must be at least 3 characters';
  }

  const skuErr = Validators.sku(data.sku || '');
  if (skuErr) errors.sku = skuErr;

  if (!data.category || data.category.trim() === '') {
    errors.category = 'Please select a primary category';
  }

  if (typeof data.sellingPrice !== 'number' || data.sellingPrice <= 0) {
    errors.sellingPrice = 'Selling price must be greater than ₹0';
  }

  if (typeof data.mrp === 'number' && typeof data.sellingPrice === 'number') {
    if (data.mrp < data.sellingPrice) {
      errors.mrp = 'MRP cannot be less than selling price';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate Shipping / Billing Address
 */
export function validateAddressForm(data: {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.fullName = 'Full recipient name is required';
  }

  const phoneErr = Validators.phone(data.phone || '');
  if (phoneErr) errors.phone = phoneErr;

  if (!data.addressLine1 || data.addressLine1.trim().length < 5) {
    errors.addressLine1 = 'Street address must be at least 5 characters';
  }

  if (!data.city || data.city.trim().length < 2) {
    errors.city = 'City is required';
  }

  if (!data.state || data.state.trim().length < 2) {
    errors.state = 'State is required';
  }

  const pinErr = Validators.pincode(data.pincode || '');
  if (pinErr) errors.pincode = pinErr;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate Discount Coupon
 */
export function validateCouponForm(data: {
  code?: string;
  discountType?: 'percentage' | 'flat' | string;
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.code || data.code.trim().length < 3) {
    errors.code = 'Coupon code must be at least 3 alphanumeric characters';
  }

  if (typeof data.discountValue !== 'number' || data.discountValue <= 0) {
    errors.discountValue = 'Discount value must be greater than 0';
  } else if (data.discountType === 'percentage' && data.discountValue > 90) {
    errors.discountValue = 'Percentage discount cannot exceed 90%';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
