import React from 'react';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { ProductCard } from '../products/ProductCard';
import { EmptyState } from '../common/EmptyState';

interface WishlistViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigate: (route: string) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  products,
  onSelectProduct,
  onNavigate,
}) => {
  const { wishlist = [] } = useCart();
  const wishlistedProducts = (products || []).filter((p) => (wishlist || []).includes(p.id));

  return (
    <div className="bg-[#FAF6F0] min-h-screen py-10 w-full">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between pb-6 border-b border-[#EADBDA] mb-8">
          <div>
            <div className="flex items-center gap-2 text-[#7B2435] text-xs font-bold uppercase tracking-widest mb-1">
              <Heart className="w-4 h-4 fill-[#7B2435]" />
              <span>Saved Items</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">
              My Ethnic Wishlist ({wishlistedProducts.length})
            </h1>
          </div>

          <button
            onClick={() => onNavigate('/kurtis')}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#7B2435] hover:underline"
          >
            <span>Continue Shopping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {wishlistedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {wishlistedProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Heart className="w-8 h-8 text-[#7B2435]" />}
            title="Your Wishlist is Empty"
            description="Explore our collections and tap the heart icon on any kurti or kurta set to save it here for later."
            actionText="Discover Kurtis & Sets"
            onAction={() => onNavigate('/kurtis')}
          />
        )}
      </div>
    </div>
  );
};
