import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Heart, 
  Search, 
  Menu, 
  X, 
  Shield, 
  Sparkles, 
  ChevronDown,
  User as UserIcon,
  Tag
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setCartDrawerOpen, setMobileMenuOpen } from '../../store/slices/uiSlice';
import { setCategorySlug, setSearchQuery } from '../../store/slices/filterSlice';
import { 
  useGetCategoriesQuery, 
  useGetProductsQuery, 
  useGetNavigationMenuQuery 
} from '../../store/api/ecommerceApi';
import { useBranding } from '../../hooks/useBranding';
import { SearchInput } from '../ui/SearchInput';
import { Button } from '../ui/Button';
import { AnnouncementBar } from './AnnouncementBar';
import { MegaMenuOverlay } from './MegaMenuOverlay';
import { INITIAL_MEGA_MENU } from '../../data/mockData';
import { Product, Category, MegaMenuItem } from '../../types';

export interface NavbarProps {
  onNavigateToHome: () => void;
  onNavigateToCatalog: (categorySlug?: string, subcategory?: string) => void;
  onNavigateToWishlist: () => void;
  onNavigateToAdmin: () => void;
  onNavigateToOrders: () => void;
  onSelectProduct?: (product: Product) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateToHome,
  onNavigateToCatalog,
  onNavigateToWishlist,
  onNavigateToAdmin,
  onNavigateToOrders,
  onSelectProduct,
}) => {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const isMobileMenuOpen = useAppSelector((state) => state.ui.isMobileMenuOpen);

  const branding = useBranding();
  const { data: dbCategories = [] } = useGetCategoriesQuery();
  const { data: dbProducts = [] } = useGetProductsQuery();
  const { data: dbMegaMenuItems } = useGetNavigationMenuQuery();

  const [searchVal, setSearchVal] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null);

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const brandName = branding.brandName || 'Nandita Fashion';
  const tagline = branding.tagline || 'Handcrafted Heritage Ethnic Wear';

  // Mega menu items from DB or fallback
  const menuItems: MegaMenuItem[] = React.useMemo(() => {
    if (dbMegaMenuItems && dbMegaMenuItems.length > 0) {
      return [...dbMegaMenuItems].sort((a, b) => a.order - b.order);
    }
    return INITIAL_MEGA_MENU;
  }, [dbMegaMenuItems]);

  const activeMegaItem = menuItems.find((item) => item.id === hoveredMenuId && item.type === 'mega');

  const handleSearch = (val: string) => {
    if (val.trim()) {
      dispatch(setSearchQuery(val.trim()));
      onNavigateToCatalog('search');
    }
  };

  const handleCategoryClick = (slug?: string, subcat?: string) => {
    dispatch(setCategorySlug({ slug: slug || 'all', subcategory: subcat }));
    onNavigateToCatalog(slug, subcat);
    dispatch(setMobileMenuOpen(false));
    setHoveredMenuId(null);
  };

  const handleSelectProduct = (product: Product) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      dispatch(setSearchQuery(product.name));
      onNavigateToCatalog('search');
    }
    setShowSearchModal(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      {/* Dynamic Announcement Bar (Multi-item, Auto-rotating) */}
      <AnnouncementBar onNavigateToCatalog={onNavigateToCatalog} />

      {/* Main Navigation Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Mobile Hamburger Button */}
          <div className="flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => dispatch(setMobileMenuOpen(!isMobileMenuOpen))}
              className="p-2.5 rounded-xl text-stone-700 hover:bg-stone-100 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo & Editorial Typography */}
          <div
            onClick={onNavigateToHome}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group min-w-0"
          >
            {branding.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={brandName}
                className="h-10 w-auto object-contain shrink-0"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-display font-black text-xl shadow-xs shrink-0 transition-transform group-hover:scale-105"
                style={{ backgroundColor: branding.primaryColor || '#7B2435' }}
              >
                {brandName.charAt(0) || 'N'}
              </div>
            )}

            <div className="flex flex-col min-w-0">
              <span 
                className="font-display text-xl sm:text-2xl font-bold tracking-tight text-stone-900 group-hover:text-[var(--brand-primary)] transition-colors truncate"
              >
                {brandName}
              </span>
              <span className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold hidden xl:inline-block truncate">
                {tagline}
              </span>
            </div>
          </div>

          {/* Desktop Search Bar with Live Instant Autocomplete */}
          <div className="hidden md:flex flex-1 max-w-[280px] lg:max-w-md mx-3 lg:mx-6">
            <SearchInput
              value={searchVal}
              onChange={setSearchVal}
              onSearch={handleSearch}
              products={dbProducts}
              categories={dbCategories}
              onSelectProduct={handleSelectProduct}
              onSelectCategory={(slug, sub) => handleCategoryClick(slug, sub)}
              placeholder="Search Chikankari, Anarkalis, Sizes M-5XL..."
            />
          </div>

          {/* Customer Action Items */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile Search Button */}
            <button
              type="button"
              onClick={() => setShowSearchModal(!showSearchModal)}
              className="md:hidden p-2.5 rounded-xl text-stone-700 hover:bg-stone-100 cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Button with Badge */}
            <button
              type="button"
              onClick={onNavigateToWishlist}
              className="relative p-2.5 rounded-xl text-stone-700 hover:text-rose-600 hover:bg-stone-100 transition-colors cursor-pointer"
              title="My Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistItems.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                  {wishlistItems.length}
                </span>
              )}
            </button>

            {/* Shopping Bag Drawer Trigger */}
            <button
              type="button"
              onClick={() => dispatch(setCartDrawerOpen(true))}
              className="relative flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-brand-light text-brand-primary border border-brand-primary/20 hover:opacity-90 transition-all cursor-pointer shadow-xs"
              title="View Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5 text-[var(--brand-primary)]" />
              <span className="font-bold text-xs hidden sm:inline text-brand-primary">Bag</span>
              {totalCartCount > 0 && (
                <span 
                  className="w-5 h-5 text-white text-xs font-bold rounded-full flex items-center justify-center bg-brand-primary"
                >
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Merchant Admin Portal Quick Access */}
            <div className="hidden lg:block">
              <Button
                variant="ghost"
                size="sm"
                onClick={onNavigateToAdmin}
                leftIcon={<Shield className="w-4 h-4 text-stone-500" />}
                className="text-xs font-bold text-stone-600 hover:text-[var(--brand-primary)]"
              >
                Admin Suite
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Search Input Overlay */}
        {showSearchModal && (
          <div className="md:hidden pb-4">
            <SearchInput
              autoFocus
              value={searchVal}
              onChange={setSearchVal}
              products={dbProducts}
              categories={dbCategories}
              onSelectProduct={handleSelectProduct}
              onSelectCategory={(slug, sub) => {
                handleCategoryClick(slug, sub);
                setShowSearchModal(false);
              }}
              onSearch={(v) => {
                handleSearch(v);
                setShowSearchModal(false);
              }}
              placeholder="Search handcrafted kurtis, fabrics, sizes..."
            />
          </div>
        )}

        {/* Desktop Category Navigation & Dynamic Mega Menu Row */}
        <nav className="hidden lg:flex items-center justify-center gap-8 py-2.5 border-t border-stone-100 text-xs font-bold tracking-wide uppercase text-stone-700 relative">
          {/* All Kurtis Static Link */}
          <button
            type="button"
            onClick={() => handleCategoryClick('all')}
            className="hover:text-[var(--brand-primary)] transition-colors py-1 cursor-pointer"
          >
            All Kurtis
          </button>

          {/* Dynamic Navigation Menu Items */}
          {menuItems.map((item) => {
            const isHovered = hoveredMenuId === item.id;

            return (
              <div
                key={item.id}
                className="relative py-1"
                onMouseEnter={() => setHoveredMenuId(item.id)}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (item.url?.includes('category=')) {
                      const slug = new URLSearchParams(item.url.split('?')[1]).get('category') || undefined;
                      handleCategoryClick(slug);
                    } else {
                      handleCategoryClick();
                    }
                  }}
                  className="hover:text-[var(--brand-primary)] transition-colors flex items-center gap-1.5 py-1 cursor-pointer"
                >
                  <span className={isHovered ? 'text-[var(--brand-primary)]' : ''}>
                    {item.title}
                  </span>

                  {item.badge && (
                    <span 
                      className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-black text-white tracking-normal uppercase shadow-2xs"
                      style={{ backgroundColor: item.badgeColor || '#7B2435' }}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.type === 'mega' || (item.columns && item.columns.length > 0) ? (
                    <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                  ) : null}
                </button>

                {/* Standard Dropdown (if type !== 'mega' and has columns) */}
                {item.type === 'dropdown' && isHovered && item.columns && item.columns.length > 0 && (
                  <div 
                    className="absolute top-full left-0 bg-white shadow-xl rounded-2xl border border-stone-100 py-3 w-56 z-50 normal-case"
                    onMouseLeave={() => setHoveredMenuId(null)}
                  >
                    {item.columns.map((col) => (
                      <div key={col.id} className="px-2">
                        {col.title && (
                          <div className="px-3 py-1 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                            {col.title}
                          </div>
                        )}
                        {col.items.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              handleCategoryClick(undefined, sub.title);
                              setHoveredMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-brand-light hover:text-[var(--brand-primary)] rounded-lg transition-colors cursor-pointer flex items-center justify-between"
                          >
                            <span>{sub.title}</span>
                            {sub.isNew && (
                              <span className="text-[9px] bg-rose-100 text-rose-700 px-1 rounded font-bold">New</span>
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Plus Size Dedicated Quick Filter */}
          <button
            type="button"
            onClick={() => handleCategoryClick('plus-size')}
            className="hover:text-[var(--brand-primary)] transition-colors py-1 cursor-pointer flex items-center gap-1.5"
          >
            <span>Plus Size (2XL-5XL)</span>
            <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-md">
              Specialized Fits
            </span>
          </button>

          {/* Festive Specials Highlight */}
          <button
            type="button"
            onClick={() => handleCategoryClick('festive-specials')}
            className="text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer py-1 font-extrabold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Festive Specials</span>
          </button>
        </nav>
      </div>

      {/* Dynamic Desktop Mega Menu Overlay */}
      {activeMegaItem && (
        <MegaMenuOverlay
          item={activeMegaItem}
          onNavigateToCatalog={onNavigateToCatalog}
          onClose={() => setHoveredMenuId(null)}
        />
      )}

      {/* Mobile Drawer Menu Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-stone-200 p-4 space-y-4 shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col space-y-1">
            <button
              type="button"
              onClick={() => handleCategoryClick('all')}
              className="text-left px-3 py-2.5 rounded-xl text-sm font-bold text-stone-800 hover:bg-stone-100"
            >
              All Kurtis Catalog
            </button>

            {menuItems.map((item) => (
              <div key={item.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleCategoryClick(undefined, item.title)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-[var(--brand-primary)] hover:bg-brand-light flex items-center justify-between"
                >
                  <span>{item.title}</span>
                  {item.badge && (
                    <span 
                      className="text-[10px] text-white font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: item.badgeColor || '#7B2435' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>

                {item.columns?.map((col) => (
                  <div key={col.id} className="pl-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3">
                      {col.title}
                    </span>
                    {col.items.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleCategoryClick(undefined, sub.title)}
                        className="w-full text-left pl-6 pr-3 py-1.5 text-xs text-stone-600 hover:text-[var(--brand-primary)] flex items-center justify-between"
                      >
                        <span>• {sub.title}</span>
                        {sub.isNew && (
                          <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1 rounded">New</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))}

            <div className="pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => handleCategoryClick('plus-size')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-amber-800 hover:bg-amber-50 flex items-center justify-between"
              >
                <span>Plus Size Collection (2XL-5XL)</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">Inclusive</span>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex flex-col gap-2">
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => {
                onNavigateToAdmin();
                dispatch(setMobileMenuOpen(false));
              }}
              leftIcon={<Shield className="w-4 h-4" />}
            >
              Admin Dashboard
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
