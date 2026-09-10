import { useAppDispatch, useAppSelector } from '../store/hooks';
import { toggleWishlist, removeFromWishlist, clearWishlist } from '../store/slices/wishlistSlice';
import { Product } from '../types';

export function useWishlist() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.wishlist.items);

  const isWishlisted = (productId: string) => {
    return items.some((item) => item.id === productId);
  };

  const toggle = (product: Product) => {
    dispatch(toggleWishlist(product));
  };

  const remove = (productId: string) => {
    dispatch(removeFromWishlist(productId));
  };

  const clear = () => {
    dispatch(clearWishlist());
  };

  return {
    items,
    count: items.length,
    isWishlisted,
    toggle,
    remove,
    clear,
  };
}
