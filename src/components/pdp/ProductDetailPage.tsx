import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  ShoppingBag, 
  Ruler, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  RefreshCcw, 
  Sparkles, 
  Star, 
  Check, 
  ChevronRight, 
  Share2, 
  AlertTriangle 
} from 'lucide-react';
import { Product, ProductReview } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { RatingStars } from '../common/RatingStars';
import { SizeGuideModal } from './SizeGuideModal';
import { WriteReviewModal } from './WriteReviewModal';
import { ProductCard } from '../common/ProductCard';
import { RecentlyViewedSection } from '../products/RecentlyViewedSection';

interface ProductDetailPageProps {
  product: Product;
  allProducts?: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigate: (route: string) => void;
  onBuyNow: (product: Product, size: string, color: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  allProducts = [],
  onSelectProduct,
  onNavigate,
  onBuyNow,
}) => {
  const { isInWishlist, toggleWishlist, addToCart } = useCart();
  const { user } = useAuth();
  const inWishlist = isInWishlist(product.id);

  // States
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>(product.variants[0]?.color || 'Default');
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [pincode, setPincode] = useState('110001');
  const [pincodeStatus, setPincodeStatus] = useState<{ checked: boolean; available: boolean; cod: boolean; date: string } | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'care' | 'shipping'>('details');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [recentlyViewedList, setRecentlyViewedList] = useState<Product[]>([]);

  // Load reviews for this product
  useEffect(() => {
    api.getReviews(product.id).then(setReviews);
  }, [product.id]);

  // Record product in recently viewed history & load dynamic related products from backend
  useEffect(() => {
    api.recordRecentlyViewed(product.id, user?.id);
    api.getRelatedProducts(product.id).then((items) => {
      if (items && items.length > 0) {
        setRelatedProducts(items);
      } else {
        setRelatedProducts(
          (allProducts || []).filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4)
        );
      }
    });
    api.getRecentlyViewed(user?.id).then(setRecentlyViewedList);
  }, [product.id, user?.id]);

  // Set default size to first in-stock variant
  useEffect(() => {
    const inStock = product.variants.find((v) => v.stock > 0);
    if (inStock) {
      setSelectedSize(inStock.size);
    }
  }, [product]);

  const selectedVariant = product.variants.find(
    (v) => v.size === selectedSize && (v.color === selectedColor || !selectedColor)
  ) || product.variants.find((v) => v.size === selectedSize);

  const stockCount = selectedVariant?.stock || 0;
  const isOutOfStock = stockCount <= 0;

  // Available unique colors
  const availableColors = Array.from(new Set(product.variants.map((v) => v.color)));

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      alert('Please enter a valid 6-digit Indian PIN code');
      return;
    }
    // Calculate 3-4 days delivery date
    const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    setPincodeStatus({
      checked: true,
      available: true,
      cod: true,
      date: deliveryDate,
    });
  };

  // Similar products in same category
  const similarProducts = (allProducts || [])
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  return (
    <div className="bg-[#FAF6F0] min-h-screen py-8 w-full">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6 flex-wrap">
          <button onClick={() => onNavigate('/')} className="hover:text-[#7B2435]">
            Home
          </button>
          <span>/</span>
          <button onClick={() => onNavigate(`/${product.category.toLowerCase().replace(/[\s&]+/g, '-')}`)} className="hover:text-[#7B2435]">
            {product.category}
          </button>
          <span>/</span>
          <span className="font-semibold text-neutral-800 line-clamp-1">{product.name}</span>
        </nav>

        {/* PDP Main 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl p-6 sm:p-10 border border-[#F0E6E1] shadow-sm mb-12">
          {/* Left Column: Media Gallery (5 cols on lg) */}
          <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnail switcher strip */}
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[580px] flex-shrink-0">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 sm:w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-[#7B2435] shadow-md scale-105'
                      : 'border-neutral-200 hover:border-neutral-400 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.altText} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Stage Display Image */}
            <div className="flex-1 relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#FAF6F4] border border-[#EADBDA]">
              <img
                src={product.images[selectedImageIndex]?.url || product.images[0]?.url}
                alt={product.name}
                className="w-full h-full object-cover object-top"
              />

              {/* Floating Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                {product.isBestseller && (
                  <span className="px-3 py-1 bg-[#7B2435] text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-md">
                    Bestseller
                  </span>
                )}
                {product.isNewArrival && (
                  <span className="px-3 py-1 bg-neutral-900 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-md">
                    New Arrival
                  </span>
                )}
              </div>

              {/* Share & Wishlist in Image Corner */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-3 rounded-full backdrop-blur-md shadow-lg transition ${
                    inWishlist ? 'bg-[#7B2435] text-white' : 'bg-white/90 text-neutral-700 hover:text-[#7B2435]'
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart className={`w-5 h-5 ${inWishlist ? 'fill-white' : ''}`} />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert('Product link copied to clipboard!');
                  }}
                  className="p-3 rounded-full bg-white/90 text-neutral-700 hover:text-[#7B2435] backdrop-blur-md shadow-lg transition"
                  aria-label="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Product Purchase Information (6 cols on lg) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-[#7B2435] uppercase tracking-widest">
                  {product.fabric} Handcrafted Weave
                </span>
                <span className="text-neutral-300">•</span>
                <span className="text-xs text-neutral-500">SKU: {selectedVariant?.sku || product.sku}</span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 leading-snug">
                {product.name}
              </h1>

              {/* Ratings */}
              <div className="flex items-center gap-3 mt-2.5">
                <div className="flex items-center gap-1.5 bg-[#FFF6F7] border border-[#F5D5DC] px-2.5 py-1 rounded-full">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-neutral-900">{product.rating.toFixed(1)}</span>
                  <span className="text-neutral-400 text-xs">|</span>
                  <span className="text-xs text-[#7B2435] font-semibold">{product.reviewCount} Reviews</span>
                </div>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> 100% Verified Quality
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-4 bg-[#FAF6F0] rounded-2xl border border-[#EADBDA]">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-3xl font-bold text-[#7B2435]">
                  ₹{product.sellingPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-base text-neutral-400 line-through">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                  Save {product.discountPercent}% (₹{(product.mrp - product.sellingPrice).toLocaleString('en-IN')} OFF)
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Inclusive of all taxes. Free Express Shipping on orders above ₹999.
              </p>
            </div>

            {/* Nykaa Fashion Style Offers & Coupons Box */}
            <div className="p-3.5 bg-[#FFF9F6] rounded-2xl border border-[#F5ECE8] space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#7B2435]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Special Offers & Coupons:</span>
              </div>
              <div className="space-y-1.5 text-[11px] text-neutral-700">
                <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-rose-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#FFF2F4] text-[#7B2435] font-mono font-bold rounded">
                      NANDITA15
                    </span>
                    <span>Flat 15% OFF on orders above ₹1,999</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText('NANDITA15');
                      alert('Coupon code NANDITA15 copied!');
                    }}
                    className="text-[#7B2435] font-bold hover:underline"
                  >
                    Copy
                  </button>
                </div>
                <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-rose-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#FFF2F4] text-[#7B2435] font-mono font-bold rounded">
                      FIRSTBUY
                    </span>
                    <span>Flat ₹200 OFF on your first purchase</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText('FIRSTBUY');
                      alert('Coupon code FIRSTBUY copied!');
                    }}
                    className="text-[#7B2435] font-bold hover:underline"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Color Variant Swatches */}
            {availableColors.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Selected Color: <strong className="text-[#7B2435]">{selectedColor}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {availableColors.map((colName) => {
                    const sampleVariant = product.variants.find((v) => v.color === colName);
                    return (
                      <button
                        key={colName}
                        onClick={() => setSelectedColor(colName)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition ${
                          selectedColor === colName
                            ? 'border-[#7B2435] bg-[#FFF6F7] shadow-xs'
                            : 'border-neutral-200 hover:border-neutral-400 bg-white'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/15 shadow-xs"
                          style={{ backgroundColor: sampleVariant?.colorHex || '#C98C97' }}
                        />
                        <span className="text-xs font-semibold text-neutral-800">{colName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Variant Selector + Stock Indicator */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  Select Size: <strong className="text-[#7B2435]">{selectedSize}</strong>
                </span>
                <button
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-xs font-semibold text-[#7B2435] hover:underline flex items-center gap-1"
                >
                  <Ruler className="w-3.5 h-3.5" /> Size & Fit Guide
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {product.variants.map((variant) => {
                  const isAvailable = variant.stock > 0;
                  const isSelected = selectedSize === variant.size;
                  return (
                    <button
                      key={variant.id}
                      disabled={!isAvailable}
                      onClick={() => setSelectedSize(variant.size)}
                      className={`relative py-3 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-[#7B2435] text-white shadow-md border-2 border-[#7B2435]'
                          : !isAvailable
                          ? 'bg-neutral-100 text-neutral-300 border border-neutral-200 cursor-not-allowed line-through'
                          : 'bg-white text-neutral-800 border border-neutral-200 hover:border-[#7B2435]'
                      }`}
                    >
                      <span>{variant.size}</span>
                      {isAvailable && variant.stock <= 3 && (
                        <span className="text-[8px] text-amber-300 font-extrabold uppercase mt-0.5">
                          {variant.stock} left
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Stock Warning message */}
              {stockCount > 0 && stockCount <= 4 && (
                <p className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mt-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Hurry, only {stockCount} units remaining in size {selectedSize}!
                </p>
              )}

              {isOutOfStock && (
                <p className="text-xs font-bold text-red-600 mt-2">
                  Size {selectedSize} is currently out of stock. Please check another size.
                </p>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                disabled={isOutOfStock}
                onClick={() => addToCart(product, selectedSize, selectedColor)}
                className={`w-full sm:flex-1 py-4 rounded-full font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition ${
                  isOutOfStock
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    : 'bg-[#7B2435] hover:bg-[#621c2a] text-white hover:scale-[1.02]'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add To Bag</span>
              </button>

              <button
                disabled={isOutOfStock}
                onClick={() => onBuyNow(product, selectedSize, selectedColor)}
                className={`w-full sm:flex-1 py-4 rounded-full font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                  isOutOfStock
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-[#FAF6F0] hover:bg-[#F5ECE8] text-[#7B2435] border-2 border-[#7B2435]'
                }`}
              >
                <span>Buy Now (Instant Checkout)</span>
              </button>
            </div>

            {/* Pincode Delivery Availability Checker */}
            <div className="p-4 bg-white rounded-2xl border border-[#EADBDA] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
                <MapPin className="w-4 h-4 text-[#7B2435]" />
                <span>Check Delivery Date & COD Availability:</span>
              </div>
              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit PIN code"
                  className="flex-1 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2 text-xs font-bold text-neutral-800 focus:outline-none focus:border-[#7B2435]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition"
                >
                  Verify
                </button>
              </form>

              {pincodeStatus?.checked && (
                <div className="space-y-1 text-xs text-neutral-700 bg-[#FFF9F6] p-3 rounded-xl border border-[#F5ECE8]">
                  <p className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <Check className="w-3.5 h-3.5" /> Delivery available to {pincode} by <strong>{pincodeStatus.date}</strong>
                  </p>
                  <p className="text-neutral-600 text-[11px]">• Cash on Delivery (COD) is available at this address</p>
                  <p className="text-neutral-600 text-[11px]">• Express 48-Hour Dispatch from central studio</p>
                </div>
              )}
            </div>

            {/* Product Tabs (Details, Care, Shipping) */}
            <div className="border-t border-[#F0E6E1] pt-6">
              <div className="flex items-center gap-6 border-b border-[#F0E6E1] pb-3 mb-4">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition ${
                    activeTab === 'details'
                      ? 'border-[#7B2435] text-[#7B2435]'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Product Details
                </button>
                <button
                  onClick={() => setActiveTab('care')}
                  className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition ${
                    activeTab === 'care'
                      ? 'border-[#7B2435] text-[#7B2435]'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Wash & Fabric Care
                </button>
                <button
                  onClick={() => setActiveTab('shipping')}
                  className={`text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition ${
                    activeTab === 'shipping'
                      ? 'border-[#7B2435] text-[#7B2435]'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Shipping & 7-Day Returns
                </button>
              </div>

              {activeTab === 'details' && (
                <div className="space-y-4 text-xs text-neutral-700">
                  <p className="leading-relaxed text-neutral-600">{product.description}</p>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 bg-[#FAF6F0] p-4 rounded-2xl border border-[#EADBDA]">
                    <div><strong className="text-neutral-900">Fabric:</strong> {product.fabric}</div>
                    <div><strong className="text-neutral-900">Work/Craft:</strong> {product.work}</div>
                    <div><strong className="text-neutral-900">Neck Type:</strong> {product.neckType}</div>
                    <div><strong className="text-neutral-900">Sleeve:</strong> {product.sleeve}</div>
                    <div><strong className="text-neutral-900">Fit Silhouette:</strong> {product.fit}</div>
                    <div><strong className="text-neutral-900">Length:</strong> {product.length || 'Calf Length'}</div>
                    <div><strong className="text-neutral-900">Bottom Wear:</strong> {product.bottomType || 'None'}</div>
                    <div><strong className="text-neutral-900">Dupatta:</strong> {product.dupattaIncluded ? 'Included (2.4m)' : 'Not Included'}</div>
                    <div><strong className="text-neutral-900">Country of Origin:</strong> India</div>
                  </div>
                </div>
              )}

              {activeTab === 'care' && (
                <ul className="space-y-2 text-xs text-neutral-600 list-disc pl-4">
                  {product.careInstructions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                  <li>Do not wring pure cotton garments violently to preserve artisanal embroidery fibers.</li>
                </ul>
              )}

              {activeTab === 'shipping' && (
                <div className="space-y-2.5 text-xs text-neutral-600 leading-relaxed">
                  <p>• <strong>Free Shipping:</strong> Automatically applied for orders above ₹999.</p>
                  <p>• <strong>Dispatch:</strong> Orders are packaged in eco-friendly dust bags and dispatched within 24-48 business hours.</p>
                  <p>• <strong>7-Day Easy Returns:</strong> You can request a doorstep exchange or refund within 7 days of delivery from your My Account portal.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-[#F0E6E1] mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#F0E6E1] mb-8">
            <div>
              <h2 className="font-serif text-2xl font-bold text-neutral-900">
                Verified Customer Reviews
              </h2>
              <div className="flex items-center gap-3 mt-2">
                <RatingStars rating={product.rating} size="lg" />
                <span className="text-xs text-neutral-500 font-semibold">
                  Based on {reviews.length} authentic buyer evaluations
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsWriteReviewOpen(true)}
              className="px-6 py-3 bg-[#FAF6F0] hover:bg-[#7B2435] text-[#7B2435] hover:text-white border border-[#7B2435] text-xs font-bold rounded-full transition shadow-xs"
            >
              Write a Verified Review
            </button>
          </div>

          {/* Reviews list */}
          <div className="space-y-6">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-5 bg-[#FAF6F0] rounded-2xl border border-[#EADBDA]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RatingStars rating={rev.rating} size="sm" />
                    <span className="text-xs font-bold text-neutral-900">{rev.title}</span>
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <p className="text-xs text-neutral-700 leading-relaxed mb-3">{rev.comment}</p>

                <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-[#EADBDA]">
                  <span>{rev.userName} • {rev.variantInfo}</span>
                  {rev.isVerifiedPurchase && (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verified Purchase
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Related Products Recommendation (Req 42) */}
        {relatedProducts.length > 0 && (
          <section className="mt-12">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#7B2435] mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Curated Matches</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-neutral-900">
                You May Also Like
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Handcrafted pieces with matching craft, fabric, and styling in {product.category}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} onSelectProduct={onSelectProduct} onSelect={onSelectProduct} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed Products (Req 41) */}
        <RecentlyViewedSection
          products={recentlyViewedList}
          currentProductId={product.id}
          onSelectProduct={onSelectProduct}
        />
      </div>

      {/* Sticky Mobile Purchase Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#EADBDA] p-3.5 z-40 flex items-center gap-3 shadow-2xl">
        <div className="flex-1">
          <div className="text-xs font-bold text-[#7B2435]">
            ₹{product.sellingPrice} <span className="line-through text-neutral-400 text-[10px]">₹{product.mrp}</span>
          </div>
          <span className="text-[10px] text-neutral-500">Size: {selectedSize}</span>
        </div>
        <button
          disabled={isOutOfStock}
          onClick={() => addToCart(product, selectedSize, selectedColor)}
          className="flex-1 py-3 bg-[#7B2435] text-white rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
        >
          <ShoppingBag className="w-4 h-4" /> Add to Bag
        </button>
      </div>

      {/* Modals */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        product={product}
        selectedSize={selectedSize}
        onSelectSize={(size) => setSelectedSize(size)}
      />
      <WriteReviewModal
        product={product}
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        onReviewSubmitted={() => {
          api.getReviews(product.id).then(setReviews);
        }}
      />
    </div>
  );
};
