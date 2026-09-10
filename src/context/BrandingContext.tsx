import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../services/api';
import { StoreBranding, ThemePreset } from '../types';

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'nandita-maroon',
    name: 'Nandita Regal Maroon & Rose Gold',
    description: 'Timeless royal bridal & festive aesthetic with deep crimson maroon and soft rose accents.',
    primaryColor: '#7B2435',
    primaryHover: '#621C2A',
    primaryLight: '#FFF0F3',
    secondaryColor: '#C98C97',
    accentColor: '#E6A4B4',
    backgroundColor: '#FAF6F0',
    previewColors: ['#7B2435', '#C98C97', '#E6A4B4', '#FAF6F0']
  },
  {
    id: 'royal-emerald',
    name: 'Royal Emerald & Antique Gold',
    description: 'Majestic forest emerald inspired by handcrafted Mughal silks and gold zari border work.',
    primaryColor: '#1B4D3E',
    primaryHover: '#12382C',
    primaryLight: '#EDF6F2',
    secondaryColor: '#D4AF37',
    accentColor: '#E6CA65',
    backgroundColor: '#F8FAF8',
    previewColors: ['#1B4D3E', '#D4AF37', '#E6CA65', '#F8FAF8']
  },
  {
    id: 'imperial-navy',
    name: 'Imperial Indigo & Silver Zari',
    description: 'Regal midnight indigo with silvery-slate accents for modern high-fashion ethnic aesthetics.',
    primaryColor: '#1B2A4A',
    primaryHover: '#101C33',
    primaryLight: '#EEF3F8',
    secondaryColor: '#6B829E',
    accentColor: '#9FB5CD',
    backgroundColor: '#F7FAFC',
    previewColors: ['#1B2A4A', '#6B829E', '#9FB5CD', '#F7FAFC']
  },
  {
    id: 'jaipur-terracotta',
    name: 'Jaipur Terracotta & Warm Ochre',
    description: 'Earthy artisanal vibes reminiscent of Rajasthani palaces, block prints, and natural clay.',
    primaryColor: '#B85D38',
    primaryHover: '#944626',
    primaryLight: '#FFF4EE',
    secondaryColor: '#E08E45',
    accentColor: '#F5B880',
    backgroundColor: '#FAF5F0',
    previewColors: ['#B85D38', '#E08E45', '#F5B880', '#FAF5F0']
  },
  {
    id: 'regal-plum',
    name: 'Regal Plum & Velvet Rose',
    description: 'Enchanting berry plum with delicate powder pink highlights for opulent celebratory collections.',
    primaryColor: '#5C1D4E',
    primaryHover: '#441139',
    primaryLight: '#FCF0F9',
    secondaryColor: '#B85B94',
    accentColor: '#D98CB9',
    backgroundColor: '#FAF4F8',
    previewColors: ['#5C1D4E', '#B85B94', '#D98CB9', '#FAF4F8']
  },
  {
    id: 'modern-onyx',
    name: 'Modern Onyx & Champagne Gold',
    description: 'High-contrast luxury editorial aesthetic pairing deep obsidian black with subtle champagne foil.',
    primaryColor: '#1F1F1F',
    primaryHover: '#000000',
    primaryLight: '#F5F5F5',
    secondaryColor: '#C5A880',
    accentColor: '#D8C3A5',
    backgroundColor: '#FFFFFF',
    previewColors: ['#1F1F1F', '#C5A880', '#D8C3A5', '#FFFFFF']
  }
];

export const DEFAULT_BRANDING: StoreBranding = {
  storeName: 'Nandita Fashion',
  tagline: 'Ethnic & Kurti Studio',
  logoUrl: '',
  logoType: 'both',
  themeId: 'nandita-maroon',
  primaryColor: '#7B2435',
  primaryHover: '#621C2A',
  primaryLight: '#FFF0F3',
  secondaryColor: '#C98C97',
  accentColor: '#E6A4B4',
  backgroundColor: '#FAF6F0',
  headerAnnouncementText: 'Festive Launch: Use code NANDITA20 for Flat 20% OFF | COD Available Across India',
  announcementActive: true,
  freeShippingThreshold: 999,
  supportEmail: 'care@nanditafashion.com',
  supportPhone: '+91 98765 43210',
  addressText: 'Nandita Fashion Flagship Studio, Indiranagar, Bengaluru',
  heroBannerTitle: "The Royal Festive Weaves '26",
  heroBannerSubtitle: 'Handcrafted pure cotton, mulmul, and chanderi kurtas styled for every occasion.',
  couponPromoCode: 'NANDITA20',
  couponPromoDiscount: 'Flat 20% OFF',
  socialInstagram: 'https://instagram.com/nanditafashion',
  socialWhatsapp: '+919876543210'
};

const STORAGE_KEY = 'vedaaya_store_branding_v2';

interface BrandingContextType {
  branding: StoreBranding;
  presets: ThemePreset[];
  updateBranding: (newBranding: Partial<StoreBranding>) => Promise<void>;
  applyPreset: (presetId: string) => Promise<void>;
  resetToDefault: () => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<StoreBranding>(() => {
    // 1. Check local storage cache for instantaneous zero-latency render
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        return { ...DEFAULT_BRANDING, ...JSON.parse(cached) };
      }
    } catch {}
    return DEFAULT_BRANDING;
  });

  // 2. Apply dynamic CSS root variables whenever branding state changes
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', branding.primaryColor);
    root.style.setProperty('--brand-primary-hover', branding.primaryHover);
    root.style.setProperty('--brand-primary-light', branding.primaryLight);
    root.style.setProperty('--brand-secondary', branding.secondaryColor);
    root.style.setProperty('--brand-accent', branding.accentColor);
    root.style.setProperty('--brand-bg', branding.backgroundColor);

    // Update document title
    document.title = `${branding.storeName} | ${branding.tagline}`;
  }, [branding]);

  // 3. Sync from backend API / Firestore on initial mount
  useEffect(() => {
    const fetchCloudBranding = async () => {
      // 1. Try remote PHP REST endpoint
      try {
        const remoteSettings = await api.getStoreBranding();
        if (remoteSettings && remoteSettings.storeName) {
          setBranding((prev) => {
            const merged = { ...prev, ...remoteSettings };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      } catch (e) {
        console.warn('Remote branding settings error:', e);
      }

      // 2. Also check Firestore if available
      try {
        const settingsRef = doc(db, 'settings', 'store_branding');
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          const cloudData = snap.data() as Partial<StoreBranding>;
          setBranding((prev) => {
            const merged = { ...prev, ...cloudData };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      } catch (e) {
        console.warn('Firestore settings fetch error:', e);
      }
    };
    fetchCloudBranding();
  }, []);

  const updateBranding = async (partial: Partial<StoreBranding>) => {
    const updated: StoreBranding = {
      ...branding,
      ...partial,
      lastUpdatedAt: new Date().toISOString()
    };

    setBranding(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Save to Firestore
    try {
      const settingsRef = doc(db, 'settings', 'store_branding');
      await setDoc(settingsRef, updated, { merge: true });
    } catch (err) {
      console.warn('Failed to save branding to Firestore:', err);
    }
  };

  const applyPreset = async (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    await updateBranding({
      themeId: preset.id,
      primaryColor: preset.primaryColor,
      primaryHover: preset.primaryHover,
      primaryLight: preset.primaryLight,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      backgroundColor: preset.backgroundColor
    });
  };

  const resetToDefault = async () => {
    await updateBranding(DEFAULT_BRANDING);
  };

  const uploadLogo = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Url = reader.result as string;
        await updateBranding({ logoUrl: base64Url });
        resolve(base64Url);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  return (
    <BrandingContext.Provider
      value={{
        branding,
        presets: THEME_PRESETS,
        updateBranding,
        applyPreset,
        resetToDefault,
        uploadLogo,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};
