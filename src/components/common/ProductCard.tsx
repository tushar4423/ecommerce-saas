import React, { useState } from 'react';
import { Heart, Eye, ShoppingBag, Star, Sparkles } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleWishlist } from '../../store/slices/wishlistSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { openQuickView, setCartDrawerOpen } from '../../store/slices/uiSlice';
import { useToast } from '../../hooks/useToast';
import { PriceDisplay } from './PriceDisplay';
import { cn } from '../../utils/cn';

export interface ProductCardProps {
  product: Product;
  onSelectProduct?: (product: Product) => void;
  onSelect?: (product: Product) => void; // alias for backwards compatibility
  onQuickView?: (product: Product) => void; // alias
  className?: string;
  showQuickView?: boolean;
  priority?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onSelect,
  onQuickView,
  className,
  showQuickView = true,
  priority = false,
}) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const isWishlisted = wishlistItems.some((item) => item.id === product.id);

  const [isHovered, setIsHovered] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const handleSelect = () => {
    if (onSelectProduct) onSelectProduct(product);
    else if (onSelect) onSelect(product);
  };

  const images = product.images && product.images.length > 0 ? product.images : [
    { id: '1', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80', altText: product.name }
  ];

  const primaryImage = images.find((img) => img.isPrimary)?.url || images[0]?.url;
  const secondaryImage = images.length > 1 ? (images.find((img) => !img.isPrimary)?.url || images[1]?.url) : primaryImage;

  // Extract distinct color swatches from variants
  const colorMap = new Map<string, { color: string; colorHex: string }>();
  (product.variants || []).forEach((v) => {
    if (v.color && !colorMap.has(v.color.toLowerCase())) {
      colorMap.set(v.color.toLowerCase(), {
        color: v.color,
        colorHex: v.colorHex || '#7B2435',
      });
    }
  });
  const colorSwatches = Array.from(colorMap.values());

  // Available sizes
  const sizes = product.variants?.map((v) => v.size) || ['M', 'L', 'XL', 'XXL'];
  const inStockVariants = (product.variants || []).filter((v) => v.stock > 0);
  const totalStock = product.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) ?? 15;
  const isOutOfStock = totalStock <= 0;
  const hasPlusSize = (product.variants || []).some((v) => ['2XL', 'XXL', '3XL', '4XL', '5XL'].includes(v.size));

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleWishlist(product));
    if (isWishlisted) {
      toast.info(`Removed "${product.name}" from your wishlist`);
    } else {
      toast.success(`Saved "${product.name}" to your wishlist!`);
    }
  };

  const handleTriggerQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(product);
    } else {
      dispatch(openQuickView(product));
    }
  };

  const handleAddToCart = (e: React.MouseEvent, sizeToUse?: string) => {
    e.stopPropagation();
    const size = sizeToUse || sizes[0] || 'M';
    const variant = product.variants?.find((v) => v.size === size);
    const color = selectedColor || variant?.color || product.variants?.[0]?.color || 'Standard';

    dispatch(
      addToCart({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: primaryImage,
        size,
        color,
        price: product.sellingPrice,
        mrp: product.mrp,
        quantity: 1,
      })
    );

    toast.success(`Added ${product.name} (${size}) to bag!`);
    dispatch(setCartDrawerOpen(true));
  };

  return (
    <div
      onClick={handleSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-[#F0E6E1] hover:border-[#C98C97]/70 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer',
        className
      )}
    >
      {/* Media Image Container */}
      <div className="relative w-full aspect-[3/4] bg-[#FAF6F0] overflow-hidden">
        {/* Main Product Image with Smooth Hover Swap */}
        <img
          src={isHovered && secondaryImage !== primaryImage ? secondaryImage : primaryImage}
          alt={product.name}
          loading={priority ? 'eager' : 'lazy'}
          className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="px-3 py-1 bg-white/90 text-rose-700 font-bold text-xs uppercase tracking-widest rounded-full shadow-sm">
              Sold Out
            </span>
          </div>
        )}

        {/* Top Badges: Bestseller, New Arrival, Plus Size */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.isBestseller && (
            <span className="bg-[#7B2435] text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md shadow-xs flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Bestseller
            </span>
          )}
          {product.isNewArrival && !product.isBestseller && (
            <span className="bg-neutral-900 text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md shadow-xs">
              New Arrival
            </span>
          )}
          {hasPlusSize && (
            <span className="bg-white/95 text-[#7B2435] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#F5D5DC] shadow-xs">
              Up to 5XL
            </span>
          )}
        </div>

        {/* Action Buttons: Wishlist & Quick View */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
          <button
            type="button"
            title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            onClick={handleWishlistToggle}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-xs backdrop-blur-xs cursor-pointer',
              isWishlisted
                ? 'bg-[#7B2435] text-white shadow-md'
                : 'bg-white/90 text-neutral-600 hover:text-[#7B2435] hover:bg-white'
            )}
          >
            <Heart className={cn('w-4 h-4', isWishlisted ? 'fill-white text-white' : '')} />
          </button>

          {showQuickView && (
            <button
              type="button"
              title="Quick View"
              onClick={handleTriggerQuickView}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-neutral-700 hover:text-[#7B2435] flex items-center justify-center transition-all shadow-xs backdrop-blur-xs opacity-0 group-hover:opacity-100 hidden sm:flex cursor-pointer"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Hover Quick Size Selector Strip */}
        {!isOutOfStock && (
          <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-xs p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-between gap-1 border-t border-[#F0E6E1] z-10">
            <span className="text-[10px] font-bold text-[#8A7A78] uppercase">Quick Add:</span>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {product.variants?.map((v) => {
                const inStock = v.stock > 0;
                return (
                  <button
                    key={v.id || v.size}
                    type="button"
                    disabled={!inStock}
                    onClick={(e) => handleAddToCart(e, v.size)}
                    className={cn(
                      'min-w-[26px] h-6 px-1 rounded text-[11px] font-bold transition-colors border cursor-pointer',
                      inStock
                        ? 'bg-[#FAF6F0] hover:bg-[#7B2435] hover:text-white text-neutral-800 border-neutral-200'
                        : 'bg-neutral-100 text-neutral-300 cursor-not-allowed line-through border-transparent'
                    )}
                    title={inStock ? `Add Size ${v.size}` : `Size ${v.size} Out of Stock`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-2 bg-white">
        <div>
          {/* Subcategory & Rating */}
          <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1">
            <span className="font-semibold text-[#8A7A78] truncate max-w-[65%]">
              {product.fabric || product.subcategory || product.category} {product.work ? `• ${product.work}` : ''}
            </span>
            {product.rating > 0 && (
              <div className="flex items-center gap-1 bg-[#FAF6F0] px-1.5 py-0.5 rounded text-neutral-800 font-bold">
                <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                <span>{product.rating.toFixed(1)}</span>
                {product.reviewCount > 0 && (
                  <span className="text-[10px] text-neutral-400">({product.reviewCount})</span>
                )}
              </div>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-serif text-sm font-bold text-neutral-900 line-clamp-2 leading-snug group-hover:text-[#7B2435] transition-colors">
            {product.name}
          </h3>

          {/* Available Colors Swatches */}
          {colorSwatches.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              {colorSwatches.slice(0, 4).map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColor(c.color);
                  }}
                  title={c.color}
                  className={cn(
                    'w-3.5 h-3.5 rounded-full border transition-transform',
                    selectedColor === c.color ? 'scale-125 ring-2 ring-[#7B2435] ring-offset-1' : 'border-neutral-300 hover:scale-110'
                  )}
                  style={{ backgroundColor: c.colorHex }}
                />
              ))}
              {colorSwatches.length > 4 && (
                <span className="text-[10px] font-bold text-neutral-400">
                  +{colorSwatches.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price & Quick Bag Button */}
        <div className="pt-2 border-t border-[#F5ECE8] flex items-center justify-between mt-auto">
          <PriceDisplay
            sellingPrice={product.sellingPrice}
            mrp={product.mrp}
            discountPercent={product.discountPercent}
            size="sm"
          />

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={(e) => handleAddToCart(e)}
            className="w-8 h-8 rounded-full bg-[#FFF0F3] hover:bg-[#7B2435] text-[#7B2435] hover:text-white flex items-center justify-center transition-colors border border-[#EADBDA] shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title="Add to Shopping Bag"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
