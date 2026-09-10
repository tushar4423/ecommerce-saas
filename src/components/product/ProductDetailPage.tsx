import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  ShoppingBag,
  Ruler,
  Truck,
  RotateCcw,
  ShieldCheck,
  Star,
  ChevronDown,
  ChevronRight,
  Home,
  Check,
  Share2,
  Sparkles,
  Play,
  Maximize2,
  Clock,
  Layers,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { PriceDisplay } from '../common/PriceDisplay';
import { SizeSelector } from '../common/SizeSelector';
import { ColorSelector } from '../common/ColorSelector';
import { ProductCard } from '../common/ProductCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleWishlist } from '../../store/slices/wishlistSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { openSizeGuide, setCartDrawerOpen } from '../../store/slices/uiSlice';
import {
  useGetProductsQuery,
  useGetReviewsQuery,
  useAddReviewMutation,
} from '../../store/api/ecommerceApi';
import { Product, ProductReview, ProductVariant } from '../../types';
import { useToast } from '../../hooks/useToast';
import { formatDate } from '../../utils/formatters';

export interface ProductDetailPageProps {
  product: Product;
  onSelectRelatedProduct: (p: Product) => void;
  onNavigateHome: () => void;
  onNavigateCatalog: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  onSelectRelatedProduct,
  onNavigateHome,
  onNavigateCatalog,
}) => {
  const dispatch = useAppDispatch();
  const toast = useToast();

  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const isWishlisted = wishlistItems.some((item) => item.id === product.id);

  // Images & Media
  const images = product.images && product.images.length > 0
    ? product.images
    : [{ id: '1', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', altText: product.name }];

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isZoomActive, setIsZoomActive] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  // Variants & Selections
  const defaultVariant = product.variants?.[0];
  const [selectedColor, setSelectedColor] = useState<string>(
    defaultVariant?.color || 'Maroon'
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    defaultVariant?.size || 'M'
  );

  // Extract distinct colors
  const colorMap = new Map<string, { color: string; colorHex: string }>();
  (product.variants || []).forEach((v) => {
    if (v.color && !colorMap.has(v.color.toLowerCase())) {
      colorMap.set(v.color.toLowerCase(), {
        color: v.color,
        colorHex: v.colorHex || '#7B2435',
      });
    }
  });
  const colorOptions = Array.from(colorMap.values());

  // Active Variant based on selected color & size
  const activeVariant: ProductVariant | undefined = product.variants?.find(
    (v) => v.color.toLowerCase() === selectedColor.toLowerCase() && v.size === selectedSize
  ) || product.variants?.find((v) => v.color.toLowerCase() === selectedColor.toLowerCase()) || product.variants?.[0];

  const currentStock = activeVariant?.stock ?? 15;
  const isVariantInStock = currentStock > 0;
  const variantSku = activeVariant?.sku || product.sku;

  // Accordion state
  const [activeAccordion, setActiveAccordion] = useState<string>('details');

  // Pincode checker
  const [pincode, setPincode] = useState('302001');
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);

  // Reviews
  const { data: reviews = [] } = useGetReviewsQuery(product.id);
  const [addReview, { isLoading: isSubmittingReview }] = useAddReviewMutation();

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Related products
  const { data: allProducts = [] } = useGetProductsQuery();
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  // Track Recently Viewed Products in localStorage
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vedaaya_recent_products');
      let recents: Product[] = stored ? JSON.parse(stored) : [];
      recents = [product, ...recents.filter((p) => p.id !== product.id)].slice(0, 6);
      localStorage.setItem('vedaaya_recent_products', JSON.stringify(recents));
      setRecentlyViewed(recents.filter((p) => p.id !== product.id));
    } catch {
      // ignore
    }
  }, [product.id]);

  const currentImage = images[activeImageIdx]?.url || images[0]?.url;

  // Zoom pan handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleAddToCart = (openBag = true) => {
    if (!isVariantInStock) {
      toast.error('This size/color combination is currently out of stock.');
      return;
    }

    dispatch(
      addToCart({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        image: currentImage,
        size: selectedSize,
        color: selectedColor,
        price: product.sellingPrice,
        mrp: product.mrp,
        quantity: 1,
      })
    );

    toast.success(`Added ${product.name} (${selectedColor} / ${selectedSize}) to your bag!`);
    if (openBag) {
      dispatch(setCartDrawerOpen(true));
    }
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode || pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit PIN code.');
      return;
    }
    const days = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Monday'];
    const randomDay = days[Math.floor(Math.random() * days.length)];
    setPincodeResult(`✅ Express Delivery available to PIN ${pincode} by ${randomDay} (Cash on Delivery Available)`);
  };

  const handleToggleWishlist = () => {
    dispatch(toggleWishlist(product));
    if (isWishlisted) {
      toast.info(`Removed "${product.name}" from wishlist`);
    } else {
      toast.success(`Saved "${product.name}" to wishlist!`);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on Vedaaya Ethnic Studio!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleAddReviewSubmit = async () => {
    if (!reviewName.trim() || !reviewComment.trim()) {
      toast.error('Please fill in your name and review details.');
      return;
    }

    try {
      await addReview({
        productId: product.id,
        userName: reviewName.trim(),
        title: 'Verified Review',
        rating: reviewRating,
        comment: reviewComment.trim(),
        isVerifiedPurchase: true,
      }).unwrap();

      toast.success('Thank you for sharing your experience!');
      setIsReviewModalOpen(false);
      setReviewName('');
      setReviewComment('');
    } catch {
      toast.error('Failed to submit review. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10 sm:space-y-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-500 overflow-x-auto no-scrollbar py-1">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-1 hover:text-[#7B2435] transition-colors cursor-pointer shrink-0"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <button
          type="button"
          onClick={onNavigateCatalog}
          className="hover:text-[#7B2435] transition-colors cursor-pointer truncate max-w-[150px] shrink-0"
        >
          {product.category || 'Catalog'}
        </button>
        {product.subcategory && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="text-neutral-600 truncate max-w-[150px] shrink-0">{product.subcategory}</span>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <span className="font-bold text-neutral-800 truncate max-w-[240px] shrink-0" aria-current="page">
          {product.name}
        </span>
      </nav>

      {/* Main Grid: Gallery & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Gallery & Zoom Showcase */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails Strip */}
          {images.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:max-h-[600px] no-scrollbar shrink-0">
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    activeImageIdx === idx
                      ? 'border-[#7B2435] ring-2 ring-[#7B2435]/20'
                      : 'border-neutral-200 hover:border-neutral-300 opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt={img.altText || product.name} className="w-full h-full object-cover object-top" />
                </button>
              ))}

              {/* Video Thumbnail Button */}
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(true)}
                className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl bg-neutral-900 text-white flex flex-col items-center justify-center gap-1 shrink-0 border-2 border-transparent hover:border-amber-400 transition-all cursor-pointer group"
                title="Watch Product Video"
              >
                <div className="w-7 h-7 rounded-full bg-white/20 group-hover:bg-[#7B2435] flex items-center justify-center transition-colors">
                  <Play className="w-3.5 h-3.5 fill-white text-white translate-x-0.5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Video</span>
              </button>
            </div>
          )}

          {/* Large Hero Image with Pan-Zoom */}
          <div
            className="flex-1 aspect-[3/4] bg-[#FAF6F0] rounded-2xl overflow-hidden border border-neutral-100 relative shadow-sm cursor-crosshair group"
            onMouseEnter={() => setIsZoomActive(true)}
            onMouseLeave={() => setIsZoomActive(false)}
            onMouseMove={handleMouseMove}
          >
            <img
              src={currentImage}
              alt={product.name}
              className={`w-full h-full object-cover object-top transition-transform duration-200 ${
                isZoomActive ? 'scale-150' : 'scale-100'
              }`}
              style={
                isZoomActive
                  ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                  : undefined
              }
            />

            {/* Quick Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
              {product.isBestseller && (
                <span className="bg-[#7B2435] text-white text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Bestseller
                </span>
              )}
              {product.isNewArrival && !product.isBestseller && (
                <span className="bg-neutral-900 text-white text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full shadow-xs">
                  New Arrival
                </span>
              )}
            </div>

            {/* Floating Top Right Actions */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
                  isWishlisted ? 'bg-rose-50 text-rose-600' : 'bg-white/90 hover:bg-white text-neutral-700'
                }`}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="w-10 h-10 rounded-full bg-white/90 hover:bg-white text-neutral-700 flex items-center justify-center transition-all shadow-md cursor-pointer"
                title="Share Kurti"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom hint badge */}
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-none opacity-80 group-hover:opacity-0 transition-opacity">
              <Maximize2 className="w-3 h-3" /> Hover to Zoom
            </div>
          </div>
        </div>

        {/* Right Column: Purchasing & Specifications */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
              <span className="uppercase tracking-wider font-bold text-[#8A7A78]">
                {product.subcategory || product.category}
              </span>
              <span className="font-mono text-[11px]">SKU: {variantSku}</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Ratings & Reviews summary */}
            <div className="flex items-center gap-2 mt-2.5">
              <div className="flex items-center gap-1 bg-[#FAF6F0] px-2.5 py-1 rounded-md text-neutral-900 font-bold text-xs border border-[#F0E6E1]">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{(product.rating || 4.8).toFixed(1)}</span>
              </div>
              <span className="text-xs text-neutral-500 font-medium">
                {reviews.length || product.reviewCount || 18} Verified Patron Ratings
              </span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 rounded-2xl bg-[#FAF6F0]/70 border border-[#F0E6E1]">
            <PriceDisplay
              sellingPrice={product.sellingPrice}
              mrp={product.mrp}
              discountPercent={product.discountPercent}
              size="xl"
              showSavings
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Inclusive of all taxes. Free express shipping on prepaid orders.
            </p>
          </div>

          {/* Color Variants Selection */}
          {colorOptions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Color: <span className="text-[#7B2435] font-semibold capitalize">{selectedColor}</span>
                </span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                {colorOptions.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setSelectedColor(c.color)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                      selectedColor.toLowerCase() === c.color.toLowerCase()
                        ? 'border-[#7B2435] bg-[#FFF2F4] text-[#7B2435] ring-1 ring-[#7B2435]'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-xs"
                      style={{ backgroundColor: c.colorHex }}
                    />
                    <span>{c.color}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selector & Size Guide */}
          <div className="space-y-2">
            <SizeSelector
              selectedSize={selectedSize}
              onSelectSize={setSelectedSize}
              variants={product.variants}
              showSizeGuideButton
              onOpenSizeGuide={() => dispatch(openSizeGuide(product))}
              sizeVariant="lg"
            />
          </div>

          {/* Real-time Variant Stock Indicator */}
          <div className="flex items-center gap-2 text-xs">
            {isVariantInStock ? (
              currentStock <= 5 ? (
                <span className="text-amber-700 font-bold flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  Hurry, only {currentStock} left in stock for size {selectedSize}!
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Check className="w-3.5 h-3.5" />
                  In Stock (Ready to dispatch from Jaipur studio in 24 hrs)
                </span>
              )
            ) : (
              <span className="text-rose-700 font-bold flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                Out of Stock in size {selectedSize}. Select another size or color.
              </span>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="xl"
              fullWidth
              disabled={!isVariantInStock}
              onClick={() => handleAddToCart(true)}
              leftIcon={<ShoppingBag className="w-5 h-5" />}
            >
              Add to Bag
            </Button>
            <Button
              variant="outline"
              size="xl"
              fullWidth
              disabled={!isVariantInStock}
              onClick={() => handleAddToCart(true)}
            >
              Buy Now
            </Button>
          </div>

          {/* Pincode & Delivery Checker */}
          <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#7B2435]" />
              <span>Check Delivery & Cash on Delivery</span>
            </span>

            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Enter 6-digit Pincode"
                className="w-full bg-[#FAF6F0] border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-900 font-mono focus:outline-none focus:border-[#7B2435]"
              />
              <Button type="submit" variant="light" size="sm">
                Check
              </Button>
            </form>

            {pincodeResult && (
              <p className="text-xs text-emerald-800 font-semibold mt-1 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                {pincodeResult}
              </p>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] text-neutral-600 pt-2 border-t border-neutral-100">
            <div className="p-2.5 bg-neutral-50 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span>100% Handcrafted</span>
            </div>
            <div className="p-2.5 bg-neutral-50 rounded-xl">
              <RotateCcw className="w-4 h-4 text-[#7B2435] mx-auto mb-1" />
              <span>7-Day Easy Swap</span>
            </div>
            <div className="p-2.5 bg-neutral-50 rounded-xl">
              <Truck className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <span>Free Delivery Above ₹999</span>
            </div>
          </div>

          {/* Accordion Specs Table */}
          <div className="border border-neutral-200 rounded-2xl divide-y divide-neutral-200 overflow-hidden">
            {/* Accordion 1: Attributes & Details */}
            <div>
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === 'details' ? '' : 'details')}
                className="w-full p-4 text-left font-serif font-bold text-sm text-neutral-900 flex items-center justify-between hover:bg-[#FAF6F0] cursor-pointer"
              >
                <span>Product Specifications & Artisan Craft</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    activeAccordion === 'details' ? 'rotate-180 text-[#7B2435]' : 'text-neutral-400'
                  }`}
                />
              </button>
              {activeAccordion === 'details' && (
                <div className="p-4 bg-[#FAF6F0]/40 text-xs text-neutral-700 space-y-3">
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    <div>
                      <span className="text-neutral-400 block font-mono text-[10px] uppercase">Fabric</span>
                      <strong className="text-neutral-900">{product.fabric || 'Pure Handloom Cotton'}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-mono text-[10px] uppercase">Craft / Work</span>
                      <strong className="text-neutral-900">{product.work || 'Hand-Block Zari'}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-mono text-[10px] uppercase">Sleeve</span>
                      <strong className="text-neutral-900">{product.sleeve || '3/4th Sleeves'}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-mono text-[10px] uppercase">Neck Style</span>
                      <strong className="text-neutral-900">{product.neck || 'Mandarin Collar'}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-mono text-[10px] uppercase">Length</span>
                      <strong className="text-neutral-900">{product.length || 'Calf Length (46")'}</strong>
                    </div>
                    <div>
                      <span className="text-neutral-400 block font-mono text-[10px] uppercase">Occasion</span>
                      <strong className="text-neutral-900">{product.occasion || 'Festive / Daily Wear'}</strong>
                    </div>
                  </div>

                  {product.description && (
                    <div className="pt-2 border-t border-[#F0E6E1]">
                      <p className="text-neutral-600 leading-relaxed">{product.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Accordion 2: Wash & Care */}
            <div>
              <button
                type="button"
                onClick={() => setActiveAccordion(activeAccordion === 'care' ? '' : 'care')}
                className="w-full p-4 text-left font-serif font-bold text-sm text-neutral-900 flex items-center justify-between hover:bg-[#FAF6F0] cursor-pointer"
              >
                <span>Wash & Garment Care</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    activeAccordion === 'care' ? 'rotate-180 text-[#7B2435]' : 'text-neutral-400'
                  }`}
                />
              </button>
              {activeAccordion === 'care' && (
                <div className="p-4 bg-[#FAF6F0]/40 text-xs text-neutral-700 space-y-1.5 list-disc pl-5">
                  <p>• {product.washCare || 'Dry Clean recommended for first wash to lock vegetable dyes.'}</p>
                  <p>• Cold gentle hand wash separately with mild eco-detergents thereafter.</p>
                  <p>• Dry inside out in shaded breezeway to preserve luster.</p>
                  <p>• Medium warm iron on reverse embroidery motifs.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div>
            <h3 className="font-serif text-xl font-bold text-neutral-900">
              Patron Reviews & Ratings
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Verified feedback from authentic boutique buyers
            </p>
          </div>
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsReviewModalOpen(true)}
            leftIcon={<Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
          >
            Write a Review
          </Button>
        </div>

        {/* Reviews List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((rev) => (
            <div key={rev.id} className="p-4 rounded-2xl bg-[#FAF6F0]/50 border border-neutral-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-neutral-900">{rev.userName}</span>
                <span className="text-[10px] text-neutral-400">{formatDate(rev.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-neutral-700 leading-relaxed">{rev.comment}</p>
            </div>
          ))}

          {reviews.length === 0 && (
            <p className="text-xs text-neutral-400 col-span-full py-6 text-center">
              No customer reviews submitted yet. Be the first to share your thoughts!
            </p>
          )}
        </div>
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900">
                You May Also Adore
              </h3>
              <p className="text-xs text-neutral-500">Handcrafted ethnic complements from this collection</p>
            </div>
            <button
              type="button"
              onClick={onNavigateCatalog}
              className="text-xs font-bold text-[#7B2435] hover:underline cursor-pointer"
            >
              View All Collection →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onSelectProduct={onSelectRelatedProduct}
              />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed Products */}
      {recentlyViewed.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-neutral-100">
          <div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#7B2435]" />
              <span>Recently Viewed</span>
            </h3>
            <p className="text-xs text-neutral-500">Kurtis and ensembles you explored earlier</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {recentlyViewed.map((p) => (
              <ProductCard
                key={`recent-${p.id}`}
                product={p}
                onSelectProduct={onSelectRelatedProduct}
              />
            ))}
          </div>
        </section>
      )}

      {/* Add Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={`Review "${product.name}"`}
        subtitle="Share your fitting, fabric texture, and styling experience."
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => setIsReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSubmittingReview}
              onClick={handleAddReviewSubmit}
            >
              Submit Review
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Your Full Name"
            required
            placeholder="e.g. Meera Rajput"
            value={reviewName}
            onChange={(e) => setReviewName(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-700">Rating</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="p-1 cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-700">Review Message</label>
            <textarea
              rows={4}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="How was the cotton drape, neckline, and sizing fit?"
              className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#7B2435] focus:ring-2 focus:ring-[#7B2435]/15"
            />
          </div>
        </div>
      </Modal>

      {/* Video Preview Modal */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title={`Video Drape Preview: ${product.name}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="aspect-video bg-neutral-900 rounded-2xl overflow-hidden flex items-center justify-center relative">
            <video
              className="w-full h-full object-cover"
              controls
              autoPlay
              muted
              poster={currentImage}
              src={(product as any).videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-an-ethnic-dress-41132-large.mp4'}
            >
              Your browser does not support video playback.
            </video>
          </div>
          <p className="text-xs text-neutral-500 text-center">
            Handmade with pure artisan touch in Rajasthan, India.
          </p>
        </div>
      </Modal>
    </div>
  );
};
