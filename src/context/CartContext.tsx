import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Coupon, SiteSettings } from '../types';
import { api } from '../services/api';

interface CartContextType {
  cart: CartItem[];
  wishlist: string[]; // Product IDs
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  isCartDrawerOpen: boolean;
  settings: SiteSettings | null;
  addToCart: (product: Product, size: string, color?: string, quantity?: number) => { success: boolean; message: string };
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => boolean; // returns true if added, false if removed
  isInWishlist: (productId: string) => boolean;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  setIsCartDrawerOpen: (open: boolean) => void;
  subtotal: number;
  totalMrp: number;
  totalSavings: number;
  shippingFee: number;
  taxAmount: number;
  grandTotal: number;
  itemCount: number;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('vedaaya_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vedaaya_wishlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return ['prod-1', 'prod-2'];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    const saved = localStorage.getItem('vedaaya_applied_coupon');
    return saved ? JSON.parse(saved) : null;
  });

  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    api.getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    localStorage.setItem('vedaaya_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('vedaaya_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('vedaaya_applied_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('vedaaya_applied_coupon');
    }
  }, [appliedCoupon]);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const totalMrp = cart.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Recalculate coupon discount whenever subtotal or coupon changes
  useEffect(() => {
    if (!appliedCoupon) {
      setCouponDiscount(0);
      return;
    }
    if (subtotal < appliedCoupon.minOrderAmount) {
      setCouponDiscount(0);
      setAppliedCoupon(null);
      showToast(`Coupon removed: Cart is below ₹${appliedCoupon.minOrderAmount}`, 'info');
      return;
    }

    let discount = 0;
    if (appliedCoupon.discountType === 'percentage') {
      discount = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscountAmount && discount > appliedCoupon.maxDiscountAmount) {
        discount = appliedCoupon.maxDiscountAmount;
      }
    } else {
      discount = appliedCoupon.discountValue;
    }
    setCouponDiscount(Math.round(discount));
  }, [subtotal, appliedCoupon]);

  const freeShippingThreshold = settings?.freeShippingThreshold || 999;
  const standardShippingFee = settings?.standardShippingFee || 99;
  const shippingFee = subtotal === 0 || subtotal >= freeShippingThreshold ? 0 : standardShippingFee;
  const taxAmount = 0; // GST included in product pricing as standard in Indian fashion
  const grandTotal = Math.max(0, subtotal - couponDiscount + shippingFee + taxAmount);
  const totalSavings = totalMrp - subtotal + couponDiscount;
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);

  const addToCart = (product: Product, size: string, color?: string, quantity: number = 1) => {
    const selectedColor = color || product.variants[0]?.color || 'Default';
    const variant = product.variants.find(v => v.size === size && (v.color === selectedColor || !color)) || product.variants.find(v => v.size === size);

    if (!variant || variant.stock <= 0) {
      showToast(`Size ${size} is currently out of stock.`, 'error');
      return { success: false, message: 'Variant out of stock' };
    }

    const cartLineId = `${product.id}-${size}-${selectedColor}`;
    const existingIndex = cart.findIndex(item => item.id === cartLineId);

    if (existingIndex > -1) {
      const existingItem = cart[existingIndex];
      const newQty = existingItem.quantity + quantity;
      if (newQty > variant.stock) {
        showToast(`Only ${variant.stock} item(s) available in size ${size}`, 'info');
        return { success: false, message: 'Stock limit reached' };
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex] = { ...existingItem, quantity: newQty };
      setCart(updatedCart);
    } else {
      const newItem: CartItem = {
        id: cartLineId,
        productId: product.id,
        product,
        variantId: variant.id,
        size,
        color: selectedColor,
        quantity,
        price: variant.price || product.sellingPrice,
        mrp: product.mrp,
      };
      setCart([...cart, newItem]);
    }

    showToast(`Added "${product.name.slice(0, 28)}..." (Size: ${size}) to Bag!`, 'success');
    setIsCartDrawerOpen(true);
    return { success: true, message: 'Added to cart' };
  };

  const removeFromCart = (cartItemId: string) => {
    const item = cart.find(i => i.id === cartItemId);
    setCart(cart.filter(i => i.id !== cartItemId));
    if (item) {
      showToast(`Removed from Bag`, 'info');
    }
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    const index = cart.findIndex(i => i.id === cartItemId);
    if (index === -1) return;

    const item = cart[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    // Check variant stock
    const variant = (item.product?.variants || []).find(v => v.id === item.variantId || (v.size === item.size && v.color === item.color));
    if (variant && newQty > variant.stock) {
      showToast(`Only ${variant.stock} item(s) in stock for size ${item.size}`, 'info');
      return;
    }

    const updated = [...cart];
    updated[index] = { ...item, quantity: newQty };
    setCart(updated);
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
    setCouponDiscount(0);
  };

  const toggleWishlist = (productId: string): boolean => {
    const list = wishlist || [];
    if (list.includes(productId)) {
      setWishlist(list.filter(id => id !== productId));
      showToast('Removed from Wishlist', 'info');
      return false;
    } else {
      setWishlist([...list, productId]);
      showToast('Saved to Wishlist ❤️', 'success');
      return true;
    }
  };

  const isInWishlist = (productId: string) => {
    return (wishlist || []).includes(productId);
  };

  const applyCoupon = async (code: string) => {
    const result = await api.validateCoupon(code, subtotal);
    if (result.valid && result.coupon) {
      setAppliedCoupon(result.coupon);
      setCouponDiscount(result.discount);
      showToast(result.message || 'Coupon Applied!', 'success');
      return { success: true, message: result.message || 'Coupon applied' };
    } else {
      showToast(result.message || 'Invalid coupon code', 'error');
      return { success: false, message: result.message || 'Invalid coupon' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    showToast('Coupon removed', 'info');
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        wishlist,
        appliedCoupon,
        couponDiscount,
        isCartDrawerOpen,
        settings,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        applyCoupon,
        removeCoupon,
        setIsCartDrawerOpen,
        subtotal,
        totalMrp,
        totalSavings,
        shippingFee,
        taxAmount,
        grandTotal,
        itemCount,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
