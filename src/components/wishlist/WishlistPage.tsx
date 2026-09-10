import React from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { EmptyState } from '../ui/EmptyState';
import { Button } from '../ui/Button';
import { PriceDisplay } from '../common/PriceDisplay';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeFromWishlist, clearWishlist } from '../../store/slices/wishlistSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { setCartDrawerOpen } from '../../store/slices/uiSlice';
import { useToast } from '../../hooks/useToast';
import { Product } from '../../types';

export interface WishlistPageProps {
  onSelectProduct: (p: Product) => void;
  onNavigateCatalog: () => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({
  onSelectProduct,
  onNavigateCatalog,
}) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);

  const handleMoveToBag = (product: Product) => {
    const defaultSize = product.variants?.[0]?.size || 'M';
    const defaultColor = product.variants?.[0]?.color || 'Maroon';

    dispatch(
      addToCart({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: product.images[0]?.url || '',
        size: defaultSize,
        color: defaultColor,
        price: product.sellingPrice,
        mrp: product.mrp,
        quantity: 1,
      })
    );

    dispatch(removeFromWishlist(product.id));
    toast.success(`Moved ${product.name} to your bag!`);
    dispatch(setCartDrawerOpen(true));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title={`My Saved Wishlist (${wishlistItems.length})`}
        subtitle="Saved handcrafted kurtis for your upcoming celebrations"
        breadcrumbs={[{ label: 'Home', onClick: onNavigateCatalog }, { label: 'Wishlist' }]}
        actions={
          wishlistItems.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => dispatch(clearWishlist())}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Clear All
            </Button>
          ) : undefined
        }
      />

      {wishlistItems.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-8 h-8 text-[#7B2435]" />}
          title="Your Wishlist is Empty"
          description="Save your favorite ethnic kurtis, suits, and anarkalis by tapping the heart icon on any outfit."
          primaryActionText="Discover Kurtis"
          onPrimaryAction={onNavigateCatalog}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlistItems.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-xs flex flex-col justify-between group hover:shadow-md transition-all"
            >
              <div className="relative aspect-[3/4] bg-[#FAF6F0] overflow-hidden">
                <img
                  src={product.images[0]?.url}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                  onClick={() => onSelectProduct(product)}
                />
                <button
                  type="button"
                  onClick={() => dispatch(removeFromWishlist(product.id))}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-rose-600 hover:bg-white flex items-center justify-center shadow-xs cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400">
                    {product.subcategory || product.category}
                  </span>
                  <h3
                    onClick={() => onSelectProduct(product)}
                    className="font-serif font-bold text-sm text-neutral-900 line-clamp-1 cursor-pointer hover:text-[#7B2435]"
                  >
                    {product.name}
                  </h3>
                  <div className="mt-1">
                    <PriceDisplay
                      sellingPrice={product.sellingPrice}
                      mrp={product.mrp}
                      discountPercent={product.discountPercent}
                      size="sm"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => handleMoveToBag(product)}
                    leftIcon={<ShoppingBag className="w-4 h-4" />}
                  >
                    Move to Bag
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
