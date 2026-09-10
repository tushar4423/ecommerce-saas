import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart, 
  applyCouponDiscount, 
  removeCouponDiscount 
} from '../store/slices/cartSlice';
import { CartItem } from '../types';

export function useCart() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart);

  const addItem = (item: CartItem) => {
    dispatch(addToCart(item));
  };

  const removeItem = (productId: string, size: string) => {
    dispatch(removeFromCart({ productId, size }));
  };

  const setQty = (productId: string, size: string, quantity: number) => {
    dispatch(updateQuantity({ productId, size, quantity }));
  };

  const emptyCart = () => {
    dispatch(clearCart());
  };

  const applyPromo = (code: string, discountAmount: number) => {
    dispatch(applyCouponDiscount({ code, discountAmount }));
  };

  const removePromo = () => {
    dispatch(removeCouponDiscount());
  };

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = cart.discountAmount || 0;
  const shippingFee = subtotal > 999 || subtotal === 0 ? 0 : 99;
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  return {
    items: cart.items,
    itemCount,
    subtotal,
    discountAmount,
    appliedCoupon: cart.appliedCoupon,
    shippingFee,
    total,
    addItem,
    removeItem,
    setQty,
    emptyCart,
    applyPromo,
    removePromo,
  };
}
