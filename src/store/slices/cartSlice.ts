import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem } from '../../types';

interface CartState {
  items: CartItem[];
  appliedCoupon: string | null;
  discountAmount: number;
}

const getInitialCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem('nandita_cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const initialState: CartState = {
  items: getInitialCart(),
  appliedCoupon: null,
  discountAmount: 0,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(
        (item) => item.productId === action.payload.productId && item.size === action.payload.size
      );
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      localStorage.setItem('nandita_cart', JSON.stringify(state.items));
    },
    removeFromCart: (state, action: PayloadAction<{ productId: string; size: string }>) => {
      state.items = state.items.filter(
        (item) => !(item.productId === action.payload.productId && item.size === action.payload.size)
      );
      localStorage.setItem('nandita_cart', JSON.stringify(state.items));
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ productId: string; size: string; quantity: number }>
    ) => {
      const item = state.items.find(
        (i) => i.productId === action.payload.productId && i.size === action.payload.size
      );
      if (item) {
        item.quantity = action.payload.quantity;
        if (item.quantity <= 0) {
          state.items = state.items.filter(
            (i) => !(i.productId === action.payload.productId && i.size === action.payload.size)
          );
        }
      }
      localStorage.setItem('nandita_cart', JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      state.appliedCoupon = null;
      state.discountAmount = 0;
      localStorage.removeItem('nandita_cart');
    },
    applyCouponDiscount: (
      state,
      action: PayloadAction<{ code: string; discountAmount: number }>
    ) => {
      state.appliedCoupon = action.payload.code;
      state.discountAmount = action.payload.discountAmount;
    },
    removeCouponDiscount: (state) => {
      state.appliedCoupon = null;
      state.discountAmount = 0;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  applyCouponDiscount,
  removeCouponDiscount,
} = cartSlice.actions;

export default cartSlice.reducer;
