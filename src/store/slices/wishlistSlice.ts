import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../types';
import { api } from '../../services/api';

interface WishlistState {
  items: Product[];
  isLoading: boolean;
}

const getStoredWishlist = (): Product[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('nandita_wishlist');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const initialState: WishlistState = {
  items: getStoredWishlist(),
  isLoading: false,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    setWishlist: (state, action: PayloadAction<Product[]>) => {
      state.items = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('nandita_wishlist', JSON.stringify(state.items));
      }
    },
    toggleWishlist: (state, action: PayloadAction<Product>) => {
      const product = action.payload;
      const index = state.items.findIndex((item) => item.id === product.id);
      if (index >= 0) {
        state.items.splice(index, 1);
      } else {
        state.items.unshift(product);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('nandita_wishlist', JSON.stringify(state.items));
      }
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nandita_wishlist', JSON.stringify(state.items));
      }
    },
    clearWishlist: (state) => {
      state.items = [];
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nandita_wishlist');
      }
    },
  },
});

export const { setWishlist, toggleWishlist, removeFromWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
