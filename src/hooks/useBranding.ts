import { useAppSelector } from '../store/hooks';
import { useGetSettingsQuery } from '../store/api/ecommerceApi';
import { StoreBranding } from '../types';

export function useBranding(): {
  branding: StoreBranding;
  isLoading: boolean;
  storeName: string;
  brandName: string;
  tagline: string;
  logoUrl: string;
  logoType: 'text' | 'image' | 'both';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  supportPhone: string;
  supportEmail: string;
  addressText: string;
  freeShippingThreshold: number;
} {
  const { data: dbSettings, isLoading } = useGetSettingsQuery();
  const reduxConfig = useAppSelector((state) => state.branding.config);

  const branding = dbSettings || reduxConfig || {};

  return {
    branding,
    isLoading,
    storeName: branding.storeName || 'Nandita Fashion',
    brandName: branding.brandName || branding.storeName || 'Nandita Fashion',
    tagline: branding.tagline || 'Timeless Indian Elegance • Handcrafted Ethnic Kurtis & Festive Edit',
    logoUrl: branding.logoUrl || '',
    logoType: branding.logoType || 'both',
    primaryColor: branding.primaryColor || '#7B2435',
    secondaryColor: branding.secondaryColor || '#C98C97',
    accentColor: branding.accentColor || '#E6A4B4',
    backgroundColor: branding.backgroundColor || '#FAF6F0',
    supportPhone: branding.supportPhone || branding.contact?.phone || '+91 98765 43210',
    supportEmail: branding.supportEmail || branding.contact?.email || 'care@nanditafashion.com',
    addressText: branding.addressText || branding.contact?.address || 'Nandita Fashion Studio, Indiranagar, Bengaluru, Karnataka 560038',
    freeShippingThreshold: branding.freeShippingThreshold || branding.shippingConfig?.freeShippingThreshold || 999,
  };
}
