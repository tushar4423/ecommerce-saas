import React, { useState } from 'react';
import {
  X,
  Heart,
  ShoppingBag,
  Star,
  Check,
  Truck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Ruler
} from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';
import { SizeGuideModal } from '../pdp/SizeGuideModal';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
  onBuyNow?: (product: Product, size: string, color: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onSelectProduct,
  onBuyNow,
}) => {
  const { isInWishlist, toggleWishlist, addToCart, setIsCartDrawerOpen } = useCart();
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [pincode, setPincode] = useState('110001');
  const [deliveryInfo, setDeliveryInfo] = useState<string | null>(null);

  if (!product) return null;

  const inWishlist = isInWishlist(product.id);
  const images = product.images && product.images.length > 0 ? product.images : [
    { id: '1', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80', altText: product.name }
  ];

  // Set initial selected size if not set
  const availableVariants = product.variants || [];
  const inStockVariants = availableVariants.filter(v => v.stock > 0);
  const currentSize = selectedSize || inStockVariants[0]?.size || availableVariants[0]?.size || 'M';
  const currentColor = selectedColor || availableVariants[0]?.color || 'Default';

  const selectedVariant = availableVariants.find(
    v => v.size === currentSize && (v.color === currentColor || !currentColor)
  ) || availableVariants.find(v => v.size === currentSize);

  const stock = selectedVariant?.stock || 0;
  const isOutOfStock = stock <= 0;

  const handleAddToCart = () => {
    addToCart(product, currentSize, currentColor, 1);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      setIsCartDrawerOpen(true);
      onClose();
    }, 600);
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6) {
      setDeliveryInfo('Free Delivery in 2-3 Days | COD Available');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-[#F0E6E1] relative max-h-[90vh] flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/90 hover:bg-white rounded-full text-neutral-600 hover:text-neutral-900 shadow-md transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Image Gallery */}
        <div className="md:w-1/2 bg-[#FAF6F4] p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-[#F0E6E1]">
          <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-white shadow-xs border border-[#EADBDA]">
            <img
              src={images[selectedImageIdx]?.url || images[0]?.url}
              alt={product.name}
              className="w-full h-full object-cover object-top"
            />
            {product.discountPercent > 0 && (
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#7B2435] text-white text-[10px] font-bold uppercase rounded-full shadow-sm">
                {product.discountPercent}% OFF
              </div>
            )}
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition ${
                inWishlist
                  ? 'bg-[#7B2435] text-white shadow-md'
                  : 'bg-white/80 hover:bg-white text-neutral-700 hover:text-[#7B2435]'
              }`}
            >
              <Heart className={`w-4 h-4 ${inWishlist ? 'fill-white' : ''}`} />
            </button>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto max-w-full pb-1">
              {images.map((img, i) => (
                <button
                  key={img.id || i}
                  onClick={() => setSelectedImageIdx(i)}
                  className={`w-12 h-14 rounded-lg overflow-hidden border-2 transition ${
                    selectedImageIdx === i ? 'border-[#7B2435] scale-105' : 'border-neutral-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Fast Buy */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[85vh] md:max-h-none space-y-6">
          <div>
            {/* Header info */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#8A7A78]">
                {(product as any).brand || 'Nandita Fashion Studio'}
              </span>
              <span className="text-[10px] text-neutral-300">•</span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                {product.fabric}
              </span>
            </div>

            <h3 className="font-serif text-xl font-bold text-neutral-900 leading-snug">
              {product.name}
            </h3>

            {/* Ratings chip */}
            <div className="flex items-center gap-2 mt-2">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-700 text-white text-xs font-bold rounded">
                <span>{product.rating || 4.8}</span>
                <Star className="w-3 h-3 fill-white" />
              </div>
              <span className="text-xs text-neutral-500">
                ({product.reviewCount || 128} verified ratings)
              </span>
            </div>

            {/* Price section (Nykaa Fashion Style) */}
            <div className="flex items-baseline gap-3 mt-4 pb-4 border-b border-[#F0E6E1]">
              <span className="text-2xl font-extrabold text-[#7B2435]">
                ₹{product.sellingPrice.toLocaleString('en-IN')}
              </span>
              {product.mrp > product.sellingPrice && (
                <>
                  <span className="text-sm text-neutral-400 line-through">
                    ₹{product.mrp.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                    {product.discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Size selection */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Select Size: <strong className="text-[#7B2435]">{currentSize}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-xs text-[#7B2435] hover:underline font-bold flex items-center gap-1"
                >
                  <Ruler className="w-3.5 h-3.5" /> Size Guide
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {availableVariants.map((v) => {
                  const isAvailable = v.stock > 0;
                  const isSelected = currentSize === v.size;
                  return (
                    <button
                      key={v.id || v.size}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(v.size)}
                      className={`py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center border ${
                        isSelected
                          ? 'bg-[#7B2435] text-white border-[#7B2435] shadow-xs'
                          : !isAvailable
                          ? 'bg-neutral-100 text-neutral-300 border-neutral-200 cursor-not-allowed line-through'
                          : 'bg-white text-neutral-800 border-neutral-200 hover:border-[#7B2435]'
                      }`}
                    >
                      <span>{v.size}</span>
                      {isAvailable && v.stock < 5 && (
                        <span className="text-[8px] font-normal opacity-80">{v.stock} left</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Delivery Pincode */}
            <div className="mt-5 pt-4 border-t border-[#F0E6E1]">
              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit Pincode"
                  className="flex-1 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3 py-2 text-xs font-medium"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold"
                >
                  Check
                </button>
              </form>
              {deliveryInfo && (
                <p className="text-xs text-emerald-700 font-semibold mt-1.5 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" /> {deliveryInfo}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-4 border-t border-[#F0E6E1]">
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className={`flex-1 py-3.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 shadow-md transition ${
                  isOutOfStock
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    : isAdded
                    ? 'bg-emerald-700 text-white'
                    : 'bg-[#7B2435] hover:bg-[#621c2a] text-white'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4" /> Added to Bag!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" /> Add to Bag
                  </>
                )}
              </button>

              {onBuyNow && (
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => {
                    onBuyNow(product, currentSize, currentColor);
                    onClose();
                  }}
                  className="flex-1 py-3.5 rounded-full text-xs font-bold bg-[#FAF6F0] hover:bg-[#F3ECE6] text-[#7B2435] border border-[#7B2435] transition flex items-center justify-center gap-1.5"
                >
                  <span>Buy Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {onSelectProduct && (
              <button
                type="button"
                onClick={() => {
                  onSelectProduct(product);
                  onClose();
                }}
                className="w-full text-center py-1 text-xs text-neutral-500 hover:text-[#7B2435] font-semibold underline underline-offset-2"
              >
                View Full Product Details & Sizing Specs →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {isSizeGuideOpen && (
        <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
      )}
    </div>
  );
};
