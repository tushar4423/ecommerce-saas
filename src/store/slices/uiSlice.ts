import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../types';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

interface UIState {
  toasts: ToastMessage[];
  isCartDrawerOpen: boolean;
  isMobileMenuOpen: boolean;
  isQuickViewOpen: boolean;
  quickViewProduct: Product | null;
  isSizeGuideOpen: boolean;
  sizeGuideProduct: Product | null;
  isAdminLoginOpen: boolean;
  isGoogleAuthPromptOpen: boolean;
}

const initialState: UIState = {
  toasts: [],
  isCartDrawerOpen: false,
  isMobileMenuOpen: false,
  isQuickViewOpen: false,
  quickViewProduct: null,
  isSizeGuideOpen: false,
  sizeGuideProduct: null,
  isAdminLoginOpen: false,
  isGoogleAuthPromptOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<Omit<ToastMessage, 'id'>>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      state.toasts.push({ ...action.payload, id });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
    setCartDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.isCartDrawerOpen = action.payload;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileMenuOpen = action.payload;
    },
    openQuickView: (state, action: PayloadAction<Product>) => {
      state.quickViewProduct = action.payload;
      state.isQuickViewOpen = true;
    },
    closeQuickView: (state) => {
      state.isQuickViewOpen = false;
      state.quickViewProduct = null;
    },
    openSizeGuide: (state, action: PayloadAction<Product | null | undefined>) => {
      state.sizeGuideProduct = action.payload || null;
      state.isSizeGuideOpen = true;
    },
    closeSizeGuide: (state) => {
      state.isSizeGuideOpen = false;
      state.sizeGuideProduct = null;
    },
    setAdminLoginOpen: (state, action: PayloadAction<boolean>) => {
      state.isAdminLoginOpen = action.payload;
    },
    setGoogleAuthPromptOpen: (state, action: PayloadAction<boolean>) => {
      state.isGoogleAuthPromptOpen = action.payload;
    },
  },
});

export const {
  addToast,
  removeToast,
  clearToasts,
  setCartDrawerOpen,
  setMobileMenuOpen,
  openQuickView,
  closeQuickView,
  openSizeGuide,
  closeSizeGuide,
  setAdminLoginOpen,
  setGoogleAuthPromptOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
