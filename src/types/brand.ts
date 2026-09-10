export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  pinterest?: string;
  youtube?: string;
  whatsapp?: string;
  twitter?: string;
  [key: string]: any;
}

export interface ContactInfo {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  supportHours?: string;
  [key: string]: any;
}

export interface DeliveryProvider {
  id: string;
  name: string;
  code?: string;
  isEnabled?: boolean;
  isActive?: boolean;
  isDefault?: boolean;
  isPrimary?: boolean;
  isReversePickup?: boolean;
  estimatedDays?: string;
  trackingUrlPrefix?: string;
  trackingUrlTemplate?: string;
  [key: string]: any;
}

export interface PincodeRulesConfig {
  mode?: 'all_india' | 'whitelist' | 'restricted';
  serviceableList?: string[];
  codBlockedList?: string[];
  expressList?: string[];
  restrictedList?: string[];
  restrictedPincodes?: string[];
  codBlacklistedPincodes?: string[];
  remoteAreaSurcharge?: number;
  [key: string]: any;
}

export interface ShippingConfig {
  freeShippingThreshold: number;
  standardShippingFee: number;
  expressShippingFee?: number;
  expressAvailable?: boolean;
  expressDeliveryDays?: string;
  codAvailable: boolean;
  codFee: number;
  minCodOrderValue?: number;
  maxCodOrderValue?: number;
  codMinOrder?: number;
  codMaxOrder?: number;
  deliveryProviders?: DeliveryProvider[];
  serviceablePincodes?: string[];
  blockedCodPincodes?: string[];
  expressPincodes?: string[];
  pincodeRuleMode?: 'all_india' | 'whitelist' | 'restricted';
  pincodeRules?: PincodeRulesConfig;
  [key: string]: any;
}

export interface PaymentGatewayConfig {
  razorpayEnabled?: boolean;
  razorpayKeyId?: string;
  isRazorpayTestMode?: boolean;
  codEnabled?: boolean;
  upiDirectEnabled?: boolean;
  upiVpa?: string;
  cardsEnabled?: boolean;
  netBankingEnabled?: boolean;
  walletsEnabled?: boolean;
  webhookUrl?: string;
  activeGateway?: 'razorpay' | 'cashfree' | 'phonepe' | 'payu' | string;
  primaryGateway?: string;
  currency?: string;
  currencySymbol?: string;
  razorpay?: any;
  cashfree?: any;
  stripe?: any;
  cod?: any;
  enabledMethods?: any;
  autoRefundOnCancel?: boolean;
  [key: string]: any;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export interface BrandColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  textMain: string;
  textMuted: string;
  border: string;
}

export interface StoreBranding {
  id?: string;
  brandName?: string;
  storeName?: string;
  tagline?: string;
  logoUrl?: string;
  logoType?: 'text' | 'image' | 'both';
  faviconUrl?: string;
  themeId?: string;
  primaryColor?: string;
  primaryHover?: string;
  primaryLight?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textMainColor?: string;
  textMutedColor?: string;
  borderColor?: string;
  currency?: CurrencyConfig;
  contact?: ContactInfo;
  socialLinks?: SocialLinks;
  shippingConfig?: ShippingConfig;
  paymentConfig?: PaymentGatewayConfig;
  gstNumber?: string;
  panNumber?: string;
  cinNumber?: string;
  announcementActive?: boolean;
  announcementText?: string;
  headerAnnouncementText?: string;
  announcementBar?: {
    isActive?: boolean;
    enabled?: boolean;
    text?: string;
    link?: string;
    linkText?: string;
    linkUrl?: string;
    highlightText?: string;
    backgroundColor?: string;
    textColor?: string;
    [key: string]: any;
  };

  freeShippingThreshold?: number;

  supportEmail?: string;
  supportPhone?: string;
  addressText?: string;
  socialInstagram?: string;
  socialWhatsapp?: string;
  heroBannerTitle?: string;
  heroBannerSubtitle?: string;
  heroBannerImage?: string;
  couponPromoCode?: string;
  couponPromoDiscount?: string;
  lastUpdatedAt?: string;
  [key: string]: any;
}

export interface SiteSettings extends StoreBranding {
  storeName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  freeShippingThreshold: number;
  standardShippingFee: number;
  isCodEnabled?: boolean;
  backendApiUrl?: string;
  currencySymbol?: string;
}
