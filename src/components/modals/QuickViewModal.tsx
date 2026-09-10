import React, { useState, useEffect } from 'react';
import { ShoppingBag, Heart, Ruler, Check, Star } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SizeSelector } from '../common/SizeSelector';
import { PriceDisplay } from '../common/PriceDisplay';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { closeQuickView, openSizeGuide, setCartDrawerOpen } from '../../store/slices/uiSlice';
import { toggleWishlist } from '../../store/slices/wishlistSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { useToast } from '../../hooks/useToast';
import { Product } from '../../types';

export interface QuickViewModalProps {
  onNavigateToProduct?: (product: Product) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ onNavigateToProduct }) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const isOpen = useAppSelector((state) => state.ui.isQuickViewOpen);
  const product = useAppSelector((state) => state.ui.quickViewProduct);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);

  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  useEffect(() => {
    if (product) {
      const defaultSize = product.variants?.[0]?.size || 'M';
      setSelectedSize(defaultSize);
      setActiveImageIdx(0);
    }
  }, [product]);

  if (!product) return null;

  const isWishlisted = wishlistItems.some((item) => item.id === product.id);
  const images = product.images.length > 0 ? product.images : [{ id: '1', url: '', altText: product.name }];
  const currentImage = images[activeImageIdx]?.url || images[0]?.url;

  const handleAddToCart = () => {
    const variant = product.variants?.find((v) => v.size === selectedSize);
    const color = variant?.color || 'Standard';

    dispatch(
      addToCart({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: currentImage,
        size: selectedSize,
        color,
        price: product.sellingPrice,
        mrp: product.mrp,
        quantity: 1,
      })
    );

    toast.success(`Added ${product.name} (${selectedSize}) to your bag!`);
    dispatch(closeQuickView());
    dispatch(setCartDrawerOpen(true));
  };

  const handleToggleWishlist = () => {
    dispatch(toggleWishlist(product));
    if (isWishlisted) {
      toast.info(`Removed "${product.name}" from wishlist`);
    } else {
      toast.success(`Saved "${product.name}" to wishlist!`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeQuickView())}
      size="xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Image View & Thumbnails */}
        <div className="space-y-3">
          <div className="aspect-[3/4] bg-[#FAF6F0] rounded-2xl overflow-hidden border border-neutral-100 relative">
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-full object-cover object-top"
            />
          </div>

          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-14 h-18 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    activeImageIdx === idx ? 'border-[#7B2435] scale-105' : 'border-neutral-200 opacity-70'
                  }`}
                >
                  <img src={img.url} alt={img.altText} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Product Buy Section */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#8A7A78] font-bold">
              {product.subcategory || product.category}
            </span>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 mt-1">
              {product.name}
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">SKU: {product.sku}</p>
          </div>

          {/* Price */}
          <PriceDisplay
            sellingPrice={product.sellingPrice}
            mrp={product.mrp}
            discountPercent={product.discountPercent}
            size="lg"
            showSavings
          />

          {/* Size Selector */}
          <div className="pt-2 border-t border-neutral-100">
            <SizeSelector
              selectedSize={selectedSize}
              onSelectSize={setSelectedSize}
              variants={product.variants}
              showSizeGuideButton
              onOpenSizeGuide={() => dispatch(openSizeGuide(product))}
            />
          </div>

          {/* Product Highlights */}
          <div className="p-3 bg-[#FAF6F0] rounded-xl text-xs space-y-1 text-neutral-700">
            <p>
              <strong>Fabric:</strong> {product.fabric || 'Pure Cotton'}
            </p>
            <p>
              <strong>Work:</strong> {product.work || 'Handcrafted'}
            </p>
            <p>
              <strong>Fit / Sleeve:</strong> {product.length || 'Regular Fit'} • {product.sleeve || '3/4th Sleeve'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleAddToCart}
              leftIcon={<ShoppingBag className="w-5 h-5" />}
            >
              Add to Bag
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleToggleWishlist}
              className={isWishlisted ? 'text-rose-600 border-rose-300 bg-rose-50' : ''}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
            </Button>
          </div>

          {onNavigateToProduct && (
            <button
              type="button"
              onClick={() => {
                dispatch(closeQuickView());
                onNavigateToProduct(product);
              }}
              className="text-xs font-bold text-neutral-500 hover:text-[#7B2435] text-center underline cursor-pointer"
            >
              View Full Product Details & Customer Reviews →
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
