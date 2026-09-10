import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from './theme/ThemeProvider';
import { ToastContainer } from './components/ui/Toast';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './components/home/HomePage';
import { CatalogPage } from './components/catalog/CatalogPage';
import { ProductDetailPage } from './components/product/ProductDetailPage';
import { WishlistPage } from './components/wishlist/WishlistPage';
import { AdminDashboard } from './admin/AdminDashboard';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { QuickViewModal } from './components/modals/QuickViewModal';
import { SizeGuideModal } from './components/modals/SizeGuideModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { SEOHead } from './components/seo/SEOHead';
import { analytics } from './services/analytics';
import { syncURLPath, findProductBySlugOrId, getProductPath } from './utils/slug';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setCategorySlug, setSearchQuery, setFilters, setPriceRange, setSortBy } from './store/slices/filterSlice';
import { addToCart, removeFromCart, updateQuantity, applyCouponDiscount } from './store/slices/cartSlice';
import { setCartDrawerOpen, openSizeGuide, addToast } from './store/slices/uiSlice';
import { useGetProductsQuery, useGetSettingsQuery, useGetCategoriesQuery } from './store/api/ecommerceApi';
import { useGiniVoice } from './hooks/useGiniVoice';
import { GiniLauncher } from './components/gini/GiniLauncher';
import { GiniVoiceAssistant } from './components/gini/GiniVoiceAssistant';
import { GiniAstraModal } from './components/gini/GiniAstraModal';
import { Product, Order } from './types';

export function App() {
  const dispatch = useAppDispatch();
  const { data: settings } = useGetSettingsQuery();
  const { data: products = [], isLoading: isProductsLoading } = useGetProductsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const cart = useAppSelector((state) => state.cart);

  // Primary routing state
  const [currentRoute, setCurrentRoute] = useState<'home' | 'catalog' | 'product' | 'wishlist' | 'admin'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [giniLayoutMode, setGiniLayoutMode] = useState<'split' | 'fullscreen'>('split');
  const [giniRecommendedProducts, setGiniRecommendedProducts] = useState<Product[]>([]);

  // Calculate cart grand total
  const cartGrandTotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0) - (cart.discountAmount || 0);

  // Handlers for Navigation
  const handleSelectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
    setCurrentRoute('product');
    const path = getProductPath(product);
    syncURLPath(path, product.name);
    analytics.trackViewItem(product);
  }, []);

  const handleNavigateToCatalog = useCallback((categorySlug?: string, subcategory?: string) => {
    if (categorySlug) {
      dispatch(setCategorySlug({ slug: categorySlug, subcategory }));
      syncURLPath(`/category/${categorySlug}`, `${categorySlug} Collection`);
    } else {
      syncURLPath('/catalog', 'Product Catalog');
    }
    setCurrentRoute('catalog');
  }, [dispatch]);

  const handleNavigateToHome = useCallback(() => {
    setSelectedProduct(null);
    setCurrentRoute('home');
    syncURLPath('/', settings?.brandName || 'Nandita Fashion');
  }, [settings?.brandName]);

  const handleNavigateToWishlist = useCallback(() => {
    setCurrentRoute('wishlist');
    syncURLPath('/wishlist', 'My Wishlist');
  }, []);

  const handleNavigateToAdmin = useCallback(() => {
    setCurrentRoute('admin');
    syncURLPath('/admin', 'Admin Portal');
  }, []);

  const handleOrderSuccess = (order: Order) => {
    analytics.trackPurchase(order);
  };

  // Gini Voice Commerce Assistant Integration
  const gini = useGiniVoice({
    onNavigateRoute: (path) => {
      if (path === '/cart') {
        dispatch(setCartDrawerOpen(true));
      } else if (path === '/wishlist') {
        handleNavigateToWishlist();
      } else if (path.startsWith('/catalog') || path.startsWith('/category')) {
        const urlParams = new URLSearchParams(path.split('?')[1] || '');
        const cat = urlParams.get('category');
        handleNavigateToCatalog(cat || undefined);
      } else if (path === '/') {
        handleNavigateToHome();
      }
    },
    onSearchCatalog: (params) => {
      if (params.query) {
        dispatch(setSearchQuery(params.query));
      }
      if (params.maxPrice) {
        dispatch(setPriceRange({ min: 0, max: Number(params.maxPrice) }));
      }
      if (params.category) {
        dispatch(setCategorySlug({ slug: params.category.toLowerCase().replace(/\s+/g, '-') }));
      }
      setCurrentRoute('catalog');
      syncURLPath('/catalog', 'Search Results');
    },
    onProductsUpdated: (suggestedProducts, params) => {
      if (suggestedProducts && suggestedProducts.length > 0) {
        setGiniRecommendedProducts(suggestedProducts);
      }
      if (params?.query) {
        dispatch(setSearchQuery(params.query));
      }
      if (params?.maxPrice) {
        dispatch(setPriceRange({ min: 0, max: Number(params.maxPrice) }));
      }
      if (params?.category) {
        dispatch(setCategorySlug({ slug: params.category.toLowerCase().replace(/\s+/g, '-') }));
      }
      setCurrentRoute('catalog');
    },
    onOpenProduct: (product) => {
      handleSelectProduct(product);
    },
    onOpenSizeGuide: () => {
      dispatch(openSizeGuide(selectedProduct || products[0] || null));
    },
    onOpenCheckout: () => {
      setIsCheckoutOpen(true);
    },
    onSelectVariant: (size, color, alsoAddToCart) => {
      if (alsoAddToCart && (selectedProduct || products[0])) {
        const prod = selectedProduct || products[0];
        const s = size || prod.variants?.[0]?.size || 'M';
        const variant = prod.variants?.find((v) => v.size.toUpperCase() === s.toUpperCase()) || prod.variants?.[0];
        dispatch(
          addToCart({
            productId: prod.id,
            productName: prod.name,
            productImage: prod.images?.[0]?.url || '',
            variantId: variant?.id || `var-${prod.id}-${s}`,
            sku: variant?.sku || prod.sku,
            size: s,
            color: color || variant?.color || 'Standard',
            price: prod.sellingPrice,
            mrp: prod.mrp,
            quantity: 1,
            maxStock: variant?.stock || 10,
          })
        );
        dispatch(
          addToast({
            type: 'success',
            title: 'Added via Gini Voice',
            message: `${prod.name} (Size ${s}) added to bag.`,
          })
        );
      }
    },
    onAddToCart: (qty, size) => {
      const prod = selectedProduct || products[0];
      if (prod) {
        const s = size || prod.variants?.[0]?.size || 'M';
        const variant = prod.variants?.find((v) => v.size.toUpperCase() === s.toUpperCase()) || prod.variants?.[0];
        dispatch(
          addToCart({
            productId: prod.id,
            productName: prod.name,
            productImage: prod.images?.[0]?.url || '',
            variantId: variant?.id || `var-${prod.id}-${s}`,
            sku: variant?.sku || prod.sku,
            size: s,
            color: variant?.color || 'Standard',
            price: prod.sellingPrice,
            mrp: prod.mrp,
            quantity: qty || 1,
            maxStock: variant?.stock || 10,
          })
        );
        dispatch(
          addToast({
            type: 'success',
            title: 'Added via Gini Voice',
            message: `${prod.name} (${qty}x Size ${s}) added to bag.`,
          })
        );
      }
    },
    onUpdateCartQty: (qty) => {
      if (cart.items.length > 0) {
        const lastItem = cart.items[cart.items.length - 1];
        dispatch(
          updateQuantity({
            productId: lastItem.productId,
            size: lastItem.size,
            quantity: qty,
          })
        );
      }
    },
    onRemoveCartItem: () => {
      if (cart.items.length > 0) {
        const lastItem = cart.items[cart.items.length - 1];
        dispatch(
          removeFromCart({
            productId: lastItem.productId,
            size: lastItem.size,
          })
        );
        dispatch(
          addToast({
            type: 'info',
            title: 'Removed from Cart',
            message: `${lastItem.productName} removed.`,
          })
        );
      }
    },
    onApplyCoupon: (code) => {
      // Calculate estimated 15% discount or minimum ₹200 for voice promo
      const discount = Math.min(Math.round(cartGrandTotal * 0.15), 500);
      dispatch(applyCouponDiscount({ code: code.toUpperCase(), discountAmount: discount > 0 ? discount : 100 }));
      dispatch(
        addToast({
          type: 'success',
          title: 'Promo Applied',
          message: `Coupon code ${code.toUpperCase()} applied successfully!`,
        })
      );
    },
    onOrderConfirmed: (order) => {
      handleOrderSuccess(order);
      dispatch(
        addToast({
          type: 'success',
          title: 'Order Confirmed by Gini',
          message: `Order #${order.orderNumber} placed successfully!`,
        })
      );
    },
    context: {
      currentRoute,
      cartItemCount: cart.items.reduce((s, i) => s + i.quantity, 0),
      cartGrandTotal,
      selectedProduct: selectedProduct || undefined,
      isAuthenticated: true,
      customerId: 'user-1',
    },
  });

  // Initial Route Parser from Browser URL
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const parseCurrentPath = () => {
      const path = window.location.pathname;

      if (path.startsWith('/admin')) {
        setCurrentRoute('admin');
      } else if (path.startsWith('/products/') || path.startsWith('/product/')) {
        const slug = path.replace(/^\/(products|product)\//, '');
        if (slug && products.length > 0) {
          const found = findProductBySlugOrId(products, slug);
          if (found) {
            setSelectedProduct(found);
            setCurrentRoute('product');
            analytics.trackViewItem(found);
          }
        }
      } else if (path.startsWith('/catalog') || path.startsWith('/category/')) {
        const catSlug = path.replace(/^\/(catalog|category)\/?/, '');
        if (catSlug) {
          dispatch(setCategorySlug({ slug: catSlug }));
        }
        setCurrentRoute('catalog');
      } else if (path.startsWith('/wishlist')) {
        setCurrentRoute('wishlist');
      } else {
        setCurrentRoute('home');
      }
    };

    parseCurrentPath();

    // Listen for browser Back/Forward navigation
    const handlePopState = () => {
      parseCurrentPath();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products, dispatch]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentRoute, selectedProduct]);

  // If in Admin suite view
  if (currentRoute === 'admin') {
    return (
      <ThemeProvider>
        <ErrorBoundary>
          <SEOHead
            title="Admin Suite & Portal"
            description="Manage products, orders, inventory, promotions, and settings."
          />
          <AdminDashboard
            onReturnToStore={handleNavigateToHome}
            onViewProductOnStore={(p) => handleSelectProduct(p)}
          />
          <ToastContainer />
        </ErrorBoundary>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
        {/* Dynamic SEO Meta Tag Injector */}
        <SEOHead
          title={
            currentRoute === 'product' && selectedProduct
              ? selectedProduct.name
              : currentRoute === 'catalog'
              ? 'Ethnic Catalog & Kurtis'
              : currentRoute === 'wishlist'
              ? 'My Saved Wishlist'
              : undefined
          }
          product={currentRoute === 'product' && selectedProduct ? selectedProduct : undefined}
          ogType={currentRoute === 'product' ? 'product' : 'website'}
        />

        <div className={`min-h-screen bg-[#FBF9F5] text-neutral-900 flex ${gini.isOpen && giniLayoutMode === 'split' ? 'flex-col lg:flex-row' : 'flex-col'} font-sans antialiased selection:bg-[#7B2435] selection:text-white`}>
          {/* Main Interactive E-Commerce Store (Left / Main Page) */}
          <div className="flex-1 min-w-0 flex flex-col min-h-screen relative">
            {/* Live Synchronized Navigation Status Banner in Split Screen Mode */}
            {gini.isOpen && (
              <div className="bg-gradient-to-r from-[#7B2435] via-[#8B1E3F] to-[#7B2435] text-white px-4 py-2 border-b border-[#D4AF37]/40 flex items-center justify-between shadow-sm text-xs sticky top-0 z-20">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                  </span>
                  <span className="font-bold text-amber-200 font-serif shrink-0">Gini Store Live Sync</span>
                  <span className="text-white/40 hidden sm:inline">•</span>
                  <span className="text-white/90 truncate text-[11px] sm:text-xs">
                    {gini.lastActionResult?.actionId === 'search_products'
                      ? `Browsing Search: ${gini.lastActionResult.params.query || 'Kurtis'} ${gini.lastActionResult.params.maxPrice ? `(Under ₹${gini.lastActionResult.params.maxPrice.toLocaleString('en-IN')})` : ''}`
                      : gini.lastActionResult?.actionId === 'open_product'
                      ? `Viewing: ${gini.lastActionResult.executionResult?.data?.product?.name || selectedProduct?.name || 'Product Details'}`
                      : gini.lastActionResult?.actionId === 'add_cart_item'
                      ? `Added ${selectedProduct?.name || 'Kurti'} to Bag (Size ${gini.lastActionResult.params.size || 'M'})`
                      : gini.lastActionResult?.actionId === 'open_checkout'
                      ? 'Navigated to Secure Checkout'
                      : gini.lastActionResult?.actionId === 'conversational_response'
                      ? 'Answering question'
                      : currentRoute === 'catalog' ? 'Browsing Catalog' : currentRoute === 'product' ? `Viewing: ${selectedProduct?.name || 'Product'}` : 'Storefront Home'}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {giniLayoutMode === 'split' ? (
                    <button
                      type="button"
                      onClick={() => setGiniLayoutMode('fullscreen')}
                      className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/15 border border-white/25 text-white hover:bg-white/25 transition cursor-pointer font-bold shadow-2xs"
                    >
                      Split View Active
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setGiniLayoutMode('split')}
                      className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/50 text-emerald-100 hover:bg-emerald-500/40 transition cursor-pointer font-bold shadow-2xs"
                    >
                      Switch to Split View
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Main Top Navigation Header */}
            <Navbar
              onNavigateToHome={handleNavigateToHome}
              onNavigateToCatalog={handleNavigateToCatalog}
              onNavigateToWishlist={handleNavigateToWishlist}
              onNavigateToAdmin={handleNavigateToAdmin}
              onNavigateToOrders={() => {}}
              onSelectProduct={handleSelectProduct}
            />

            {/* Active View Router */}
            <main className="flex-1">
              {currentRoute === 'home' && (
                <HomePage
                  onSelectProduct={handleSelectProduct}
                  onNavigateToCatalog={handleNavigateToCatalog}
                />
              )}

              {currentRoute === 'catalog' && (
                <CatalogPage
                  onSelectProduct={handleSelectProduct}
                  onNavigateHome={handleNavigateToHome}
                  giniRecommendedProducts={giniRecommendedProducts}
                />
              )}

              {currentRoute === 'product' && selectedProduct && (
                <ProductDetailPage
                  product={selectedProduct}
                  onSelectRelatedProduct={handleSelectProduct}
                  onNavigateHome={handleNavigateToHome}
                  onNavigateCatalog={() => handleNavigateToCatalog()}
                />
              )}

              {currentRoute === 'wishlist' && (
                <WishlistPage
                  onSelectProduct={handleSelectProduct}
                  onNavigateCatalog={() => handleNavigateToCatalog()}
                />
              )}
            </main>

            {/* Global Storefront Footer */}
            <Footer
              onNavigateToCatalog={handleNavigateToCatalog}
              onNavigateToAdmin={handleNavigateToAdmin}
            />
          </div>

          {/* Right Split Pane: Gini Astra Assistant in Split Screen Mode */}
          {gini.isOpen && giniLayoutMode === 'split' && (
            <aside className="w-full lg:w-[420px] xl:w-[460px] h-[60vh] lg:h-screen lg:sticky lg:top-0 bg-white flex flex-col z-30 shadow-xl shrink-0 border-t lg:border-t-0 lg:border-l border-stone-200">
              <GiniAstraModal
                isOpen={gini.isOpen}
                onClose={() => {
                  gini.endCall();
                  gini.setIsOpen(false);
                }}
                config={gini.config}
                uiState={gini.uiState}
                hasConsent={gini.hasConsent}
                language={gini.language}
                onToggleLanguage={gini.toggleLanguage}
                turns={gini.turns}
                partialTranscript={gini.partialTranscript}
                currentSpeechText={gini.currentSpeechText}
                pendingConfirmation={gini.pendingConfirmation}
                errorMessage={gini.errorMessage}
                isMuted={gini.isMuted}
                onToggleMute={() => gini.setIsMuted(!gini.isMuted)}
                audioLevel={gini.audioLevel}
                onStartListening={gini.startListening}
                onStopListening={gini.stopListening}
                onGrantConsent={gini.grantConsent}
                onSubmitTurn={gini.submitTurn}
                onResolveConfirmation={gini.resolveConfirmation}
                onStopSpeech={gini.stopSpeech}
                onSpeakResponse={gini.speakResponse}
                onUnlockAudio={gini.unlockAudio}
                onOpenProduct={handleSelectProduct}
                layoutMode="split"
                onToggleLayoutMode={() => setGiniLayoutMode('fullscreen')}
                onOpenCheckout={() => setIsCheckoutOpen(true)}
                onAddToCart={(qty, size, targetProduct) => {
                  const prod = targetProduct || selectedProduct || products[0];
                  if (prod) {
                    const s = size || 'M';
                    dispatch(
                      addToCart({
                        productId: prod.id,
                        productName: prod.name,
                        productImage: prod.images?.[0]?.url || '',
                        variantId: `var-${prod.id}-${s}`,
                        sku: prod.sku,
                        size: s,
                        color: 'Standard',
                        price: prod.sellingPrice,
                        mrp: prod.mrp,
                        quantity: qty || 1,
                        maxStock: 10,
                      })
                    );
                    dispatch(
                      addToast({
                        type: 'success',
                        title: 'Added to Shopping Bag',
                        message: `${prod.name} (Size ${s}) added to bag.`,
                      })
                    );
                  }
                }}
              />
            </aside>
          )}

          {/* Global Cart Slide-Over Drawer */}
          <CartDrawer
            onProceedToCheckout={() => setIsCheckoutOpen(true)}
            onContinueShopping={() => handleNavigateToCatalog()}
          />

          {/* Global Multi-Step Checkout Modal */}
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            onOrderSuccess={handleOrderSuccess}
          />

          {/* Global Quick View Product Modal */}
          <QuickViewModal onNavigateToProduct={handleSelectProduct} />

          {/* Global Standard Kurti Size Guide Modal */}
          <SizeGuideModal />

          {/* Gini Voice Commerce Floating Launcher (shown when Gini is closed) */}
          {!gini.isOpen && (
            <GiniLauncher
              config={gini.config}
              uiState={gini.uiState}
              isOpen={gini.isOpen}
              onOpen={() => {
                gini.setIsOpen(true);
                setGiniLayoutMode('split');
              }}
            />
          )}

          {/* Gini Fullscreen Overlay Modal (shown only when in fullscreen mode) */}
          {gini.isOpen && giniLayoutMode === 'fullscreen' && (
            <GiniAstraModal
              isOpen={gini.isOpen}
              onClose={() => {
                gini.endCall();
                gini.setIsOpen(false);
              }}
              config={gini.config}
              uiState={gini.uiState}
              hasConsent={gini.hasConsent}
              language={gini.language}
              onToggleLanguage={gini.toggleLanguage}
              turns={gini.turns}
              partialTranscript={gini.partialTranscript}
              currentSpeechText={gini.currentSpeechText}
              pendingConfirmation={gini.pendingConfirmation}
              errorMessage={gini.errorMessage}
              isMuted={gini.isMuted}
              onToggleMute={() => gini.setIsMuted(!gini.isMuted)}
              audioLevel={gini.audioLevel}
              onStartListening={gini.startListening}
              onStopListening={gini.stopListening}
              onGrantConsent={gini.grantConsent}
              onSubmitTurn={gini.submitTurn}
              onResolveConfirmation={gini.resolveConfirmation}
              onStopSpeech={gini.stopSpeech}
              onSpeakResponse={gini.speakResponse}
              onUnlockAudio={gini.unlockAudio}
              onOpenProduct={handleSelectProduct}
              onProductsUpdated={(prods) => {
                if (prods && prods.length > 0) {
                  setGiniRecommendedProducts(prods);
                }
              }}
              onNavigateRoute={(path) => {
                if (path === '/cart' || path === '/checkout') {
                  setIsCheckoutOpen(true);
                } else if (path === '/wishlist') {
                  handleNavigateToWishlist();
                } else if (path.startsWith('/category/') || path.startsWith('/catalog')) {
                  const cat = path.replace('/category/', '').replace('/catalog', '');
                  handleNavigateToCatalog(cat ? decodeURIComponent(cat) : undefined);
                } else if (path === '/') {
                  handleNavigateToHome();
                }
              }}
              layoutMode="fullscreen"
              onToggleLayoutMode={() => setGiniLayoutMode('split')}
              onOpenCheckout={() => setIsCheckoutOpen(true)}
              onAddToCart={(qty, size, targetProduct) => {
                const prod = targetProduct || selectedProduct || products[0];
                if (prod) {
                  const s = size || 'M';
                  dispatch(
                    addToCart({
                      productId: prod.id,
                      productName: prod.name,
                      productImage: prod.images?.[0]?.url || '',
                      variantId: `var-${prod.id}-${s}`,
                      sku: prod.sku,
                      size: s,
                      color: 'Standard',
                      price: prod.sellingPrice,
                      mrp: prod.mrp,
                      quantity: qty || 1,
                      maxStock: 10,
                    })
                  );
                  dispatch(
                    addToast({
                      type: 'success',
                      title: 'Added to Shopping Bag',
                      message: `${prod.name} (Size ${s}) added to bag.`,
                    })
                  );
                }
              }}
            />
          )}

          {/* Global Toast Notifications Container */}
          <ToastContainer />
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
