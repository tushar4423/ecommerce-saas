import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Heart, 
  ShoppingBag, 
  User as UserIcon, 
  Menu, 
  X, 
  ChevronDown, 
  Sparkles, 
  LogOut, 
  Shield, 
  Package, 
  MapPin, 
  LogIn 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useBranding } from '../../context/BrandingContext';
import { Category, Product } from '../../types';
import { useGetCategoriesQuery, useGetProductsQuery } from '../../store/api/ecommerceApi';
import { INITIAL_CATEGORIES } from '../../data/mockData';
import { MegaMenu } from './MegaMenu';

interface HeaderProps {
  categories?: Category[];
  products?: Product[];
  currentRoute?: string;
  onNavigate: (route: string) => void;
  onOpenCart?: () => void;
  onOpenStylist?: () => void;
  onSelectProduct?: (product: Product) => void;
  onSearch?: (query: string) => void;
  onSelectCategory?: (slug: string, subcategory?: string, subSubCategory?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  categories: propCategories,
  products: propProducts,
  currentRoute = '/',
  onNavigate,
  onOpenCart,
  onOpenStylist,
  onSelectProduct,
  onSearch,
  onSelectCategory,
}) => {
  const { user, isAdmin, loginWithGoogle, logout } = useAuth();
  const { wishlist = [], itemCount = 0, setIsCartDrawerOpen } = useCart();
  const { branding } = useBranding();

  const { data: dbCategories } = useGetCategoriesQuery();
  const { data: dbProducts } = useGetProductsQuery();

  const effectiveCategories = propCategories || (dbCategories && dbCategories.length > 0 ? dbCategories : INITIAL_CATEGORIES);
  const effectiveProducts = propProducts || (dbProducts && dbProducts.length > 0 ? dbProducts : []);

  const [categoriesList, setCategoriesList] = useState<Category[]>(effectiveCategories);
  const [activeMegaCategory, setActiveMegaCategory] = useState<Category | null>(null);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const [expandedMobileSubMenu, setExpandedMobileSubMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [pinCode, setPinCode] = useState('110001');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Sync categories prop & dynamic query updates
  useEffect(() => {
    setCategoriesList(effectiveCategories);
  }, [effectiveCategories]);

  useEffect(() => {
    const handleCategoriesUpdated = (e: CustomEvent<Category[]>) => {
      if (Array.isArray(e.detail)) {
        setCategoriesList(e.detail);
      }
    };
    window.addEventListener('vedaaya_categories_updated' as any, handleCategoriesUpdated);
    return () => window.removeEventListener('vedaaya_categories_updated' as any, handleCategoriesUpdated);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for predictive search
  const safeProducts = effectiveProducts || [];
  const filteredSuggestions = searchQuery.trim()
    ? safeProducts.filter((p) => {
        const q = searchQuery.toLowerCase().trim();
        const tokens = q.split(/\s+/).filter(Boolean);
        const name = (p.name || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const subcat = (p.subcategory || '').toLowerCase();
        const fabric = (p.fabric || '').toLowerCase();
        const work = (p.work || '').toLowerCase();
        const sku = (p.sku || '').toLowerCase();
        const tags = (p.tags || []).join(' ').toLowerCase();
        const colors = (p.variants || []).map((v) => v.color).join(' ').toLowerCase();
        const haystack = `${name} ${cat} ${subcat} ${fabric} ${work} ${sku} ${tags} ${colors}`;
        return tokens.every((token) => haystack.includes(token));
      }).slice(0, 6)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchFocused(false);
    if (onSearch) {
      onSearch(searchQuery.trim());
    } else {
      onNavigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-[#F0E6E1] w-full">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-neutral-700 hover:text-[#7B2435] focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Brand Logo */}
          <div
            onClick={() => onNavigate('/')}
            className="cursor-pointer flex items-center gap-3 group flex-shrink-0"
          >
            {branding.logoUrl && (branding.logoType === 'image' || branding.logoType === 'both') && (
              <img
                src={branding.logoUrl}
                alt={branding.storeName}
                className="h-10 sm:h-12 max-w-[140px] object-contain rounded"
              />
            )}
            {(branding.logoType === 'text' || branding.logoType === 'both' || !branding.logoUrl) && (
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-1.5">
                  <span 
                    className="font-serif text-2xl sm:text-3xl font-bold tracking-tight transition"
                    style={{ color: branding.primaryColor }}
                  >
                    {branding.storeName || 'Nandita Fashion'}
                  </span>
                  <span 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: branding.secondaryColor }}
                  />
                </div>
                <span className="text-[9px] tracking-[0.25em] uppercase font-medium text-[#8A7A78] -mt-1">
                  {branding.tagline || 'Ethnic & Kurti Studio'}
                </span>
              </div>
            )}
          </div>

          {/* Search Bar with Predictive Dropdown */}
          <div ref={searchRef} className="hidden md:block flex-1 max-w-md relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search kurtis, sets, pure cotton, 3XL, chikankari..."
                className="w-full bg-[#FAF6F4] text-neutral-800 text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-full border border-[#EADBDA] focus:outline-none focus:border-[#7B2435] focus:bg-white transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Live Search Suggestions Dropdown */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-[#F0E6E1] py-4 px-4 z-50 animate-fade-in max-h-96 overflow-y-auto">
                {searchQuery.trim() ? (
                  filteredSuggestions.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-[11px] font-bold text-[#8A7A78] uppercase tracking-wider px-2">
                        Suggested Ethnic Designs
                      </div>
                      {filteredSuggestions.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            if (onSelectProduct) {
                              onSelectProduct(prod);
                            } else {
                              onNavigate(`/product/${prod.slug || prod.id}`);
                            }
                            setIsSearchFocused(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-3 p-2 hover:bg-[#FFF6F4] rounded-xl cursor-pointer transition group"
                        >
                          <img
                            src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80'}
                            alt={prod.name}
                            className="w-12 h-14 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-semibold text-neutral-900 truncate group-hover:text-[#7B2435]">
                              {prod.name}
                            </h5>
                            <p className="text-[11px] text-neutral-500">
                              {prod.fabric} • {prod.work}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-bold text-[#7B2435]">
                                ₹{prod.sellingPrice}
                              </span>
                              <span className="text-[10px] text-neutral-400 line-through">
                                ₹{prod.mrp}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={handleSearchSubmit}
                        className="w-full text-center py-2 text-xs font-semibold text-[#7B2435] bg-[#FFF2F4] hover:bg-[#FFE5EA] rounded-xl transition"
                      >
                        View all results for &quot;{searchQuery}&quot;
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-neutral-500 text-xs">
                      No results found for &quot;{searchQuery}&quot;. Try searching &quot;Cotton&quot;, &quot;Anarkali&quot;, or &quot;3XL&quot;.
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="text-[11px] font-bold text-[#8A7A78] uppercase tracking-wider mb-2">
                        Popular Searches
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          'Pure Cotton Kurti',
                          'Festive Kurta Sets',
                          'Plus Size 3XL',
                          'Chikankari Suit',
                          'Co-ord Sets',
                          'Under ₹999',
                          'Office Wear',
                        ].map((tag) => (
                          <button
                            key={tag}
                            onClick={() => {
                              setSearchQuery(tag);
                              onNavigate(`/search?q=${encodeURIComponent(tag)}`);
                              setIsSearchFocused(false);
                            }}
                            className="text-xs px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-[#FFF2F4] hover:text-[#7B2435] text-neutral-700 transition"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions (Pin, Stylist, Wishlist, User, Cart) */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Delivery Pin badge */}
            <button
              onClick={() => setIsPinModalOpen(!isPinModalOpen)}
              className="hidden xl:flex items-center gap-1.5 text-xs text-neutral-600 hover:text-[#7B2435] px-2.5 py-1.5 rounded-full hover:bg-neutral-50 transition border border-transparent hover:border-neutral-200"
            >
              <MapPin className="w-3.5 h-3.5 text-[#7B2435]" />
              <span>Deliver to: <strong>{pinCode}</strong></span>
            </button>

            {/* AI Stylist Button */}
            <button
              onClick={() => {
                if (onOpenStylist) {
                  onOpenStylist();
                } else {
                  onNavigate('/listing');
                }
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#FFF2F4] hover:bg-[#FFE5EA] text-[#7B2435] text-xs font-semibold border border-[#F5D5DC] transition shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
              <span>AI Stylist</span>
            </button>

            {/* Wishlist */}
            <button
              onClick={() => onNavigate('/wishlist')}
              className="relative p-2.5 text-neutral-700 hover:text-[#7B2435] hover:bg-[#FFF6F4] rounded-full transition"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {(wishlist || []).length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#7B2435] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {(wishlist || []).length}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => {
                if (onOpenCart) {
                  onOpenCart();
                } else {
                  setIsCartDrawerOpen(true);
                }
              }}
              className="relative flex items-center gap-2 px-3 py-2 bg-[#7B2435] hover:bg-[#621c2a] text-white rounded-full transition shadow-md"
              aria-label="Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Bag</span>
              {itemCount > 0 && (
                <span className="w-5 h-5 bg-[#FAF6F0] text-[#7B2435] text-xs font-extrabold rounded-full flex items-center justify-center shadow-xs">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Profile / Login Dropdown */}
            <div ref={userDropdownRef} className="relative">
              {user ? (
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-full hover:bg-neutral-100 transition border border-neutral-200"
                >
                  <img
                    src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-600 hidden sm:inline" />
                </button>
              ) : (
                <button
                  onClick={() => loginWithGoogle()}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#7B2435] border border-[#7B2435] rounded-full hover:bg-[#7B2435] hover:text-white transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* User Dropdown Menu */}
              {isUserDropdownOpen && user && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#F0E6E1] py-3 z-50 animate-fade-in">
                  <div className="px-4 py-2.5 border-b border-[#F5ECE8]">
                    <p className="text-xs font-bold text-neutral-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-[#FFF2F4] text-[#7B2435] rounded-full">
                      {isAdmin ? 'Platform Administrator' : 'Valued Customer'}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        onNavigate('/account');
                        setIsUserDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-700 hover:bg-[#FFF6F4] hover:text-[#7B2435] w-full text-left font-medium"
                    >
                      <UserIcon className="w-4 h-4 text-neutral-500" />
                      My Profile & Account
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('/account?tab=orders');
                        setIsUserDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-700 hover:bg-[#FFF6F4] hover:text-[#7B2435] w-full text-left font-medium"
                    >
                      <Package className="w-4 h-4 text-neutral-500" />
                      My Orders & Tracking
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('/account?tab=addresses');
                        setIsUserDropdownOpen(false);
                      }}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-neutral-700 hover:bg-[#FFF6F4] hover:text-[#7B2435] w-full text-left font-medium"
                    >
                      <MapPin className="w-4 h-4 text-neutral-500" />
                      Saved Delivery Addresses
                    </button>

                    {/* Admin Switch */}
                    <div className="border-t border-[#F5ECE8] my-1 pt-1">
                      <button
                        onClick={() => {
                          onNavigate('/admin');
                          setIsUserDropdownOpen(false);
                        }}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#7B2435] hover:bg-[#FFF2F4] w-full text-left font-bold"
                      >
                        <Shield className="w-4 h-4 text-[#7B2435]" />
                        {isAdmin ? 'Admin Control Panel' : 'Admin Login (Protected)'}
                      </button>
                    </div>

                    <div className="border-t border-[#F5ECE8] my-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setIsUserDropdownOpen(false);
                        }}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 w-full text-left font-medium"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Main Navigation Bar with MegaMenu on Hover */}
        <nav className="hidden lg:flex items-center justify-between border-t border-[#F5ECE8] py-2 relative">
          <ul className="flex items-center gap-7">
            <li>
              <button
                onClick={() => onNavigate('/')}
                className={`text-xs font-semibold tracking-wider uppercase py-2 hover:text-[#7B2435] transition ${
                  currentRoute === '/' ? 'text-[#7B2435] font-bold border-b-2 border-[#7B2435]' : 'text-neutral-800'
                }`}
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('/new-arrivals')}
                className={`text-xs font-semibold tracking-wider uppercase py-2 hover:text-[#7B2435] transition flex items-center gap-1 ${
                  (currentRoute || '').includes('new-arrivals') ? 'text-[#7B2435] font-bold border-b-2 border-[#7B2435]' : 'text-neutral-800'
                }`}
              >
                <span>New Arrivals</span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              </button>
            </li>
            {(categoriesList || []).map((cat) => (
              <li
                key={cat.id}
                onMouseEnter={() => setActiveMegaCategory(cat)}
                className="relative"
              >
                <button
                  onClick={() => {
                    setActiveMegaCategory(null);
                    if (onSelectCategory) {
                      onSelectCategory(cat.slug);
                    } else {
                      onNavigate(`/${cat.slug}`);
                    }
                  }}
                  className={`text-xs font-semibold tracking-wider uppercase py-2 hover:text-[#7B2435] transition flex items-center gap-1 ${
                    (currentRoute || '').includes(cat.slug) ? 'text-[#7B2435] font-bold border-b-2 border-[#7B2435]' : 'text-neutral-800'
                  }`}
                >
                  <span>{cat.name}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={() => onNavigate('/plus-size')}
                className="text-xs font-bold tracking-wider uppercase py-2 text-[#7B2435] hover:text-[#621c2a] transition flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Plus Size (2XL-5XL)</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('/bestsellers')}
                className="text-xs font-semibold tracking-wider uppercase py-2 text-neutral-800 hover:text-[#7B2435] transition"
              >
                Bestsellers
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('/offers')}
                className="text-xs font-bold tracking-wider uppercase py-2 text-rose-600 hover:text-rose-700 transition"
              >
                Offers
              </button>
            </li>
          </ul>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[#8A7A78] font-medium">
              ✨ 100% Cotton & Chanderi Weaves
            </span>
          </div>

          {/* MegaMenu Dropdown */}
          {activeMegaCategory && (
            <MegaMenu
              category={activeMegaCategory}
              onSelectCategory={(slug, sub, subSub) => {
                if (onSelectCategory) {
                  onSelectCategory(slug, sub, subSub);
                } else {
                  let path = `/${slug}`;
                  const params = new URLSearchParams();
                  if (sub) params.set('subcategory', sub);
                  if (subSub) params.set('subSubCategory', subSub);
                  const qs = params.toString();
                  onNavigate(qs ? `${path}?${qs}` : path);
                }
                setActiveMegaCategory(null);
              }}
              onSelectFilter={(type, val) => {
                onNavigate(`/search?${type}=${encodeURIComponent(val)}`);
                setActiveMegaCategory(null);
              }}
              onClose={() => setActiveMegaCategory(null)}
            />
          )}
        </nav>
      </div>

      {/* Mobile Drawer Menu with Hierarchical Accordion */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex justify-start animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div 
            className="w-[85%] max-w-sm bg-white h-full max-h-screen shadow-2xl flex flex-col z-[101] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#F0E6E1] flex items-center justify-between bg-white flex-shrink-0">
              <div className="flex items-center gap-2.5">
                {branding.logoUrl && (branding.logoType === 'image' || branding.logoType === 'both') && (
                  <img
                    src={branding.logoUrl}
                    alt={branding.storeName}
                    className="h-8 max-w-[100px] object-contain rounded"
                  />
                )}
                {(branding.logoType === 'text' || branding.logoType === 'both' || !branding.logoUrl) && (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span 
                        className="font-serif text-xl font-bold tracking-tight"
                        style={{ color: branding.primaryColor }}
                      >
                        {branding.storeName || 'Nandita Fashion'}
                      </span>
                      <span 
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: branding.secondaryColor }}
                      />
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-[#8A7A78] font-medium">
                      {branding.tagline || 'Ethnic & Kurti Studio'}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Box inside Mobile Drawer */}
            <div className="p-4 border-b border-[#FAF0EC] bg-[#FAF6F4] flex-shrink-0">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search kurtis, sets, fabrics..."
                  className="w-full bg-white text-xs text-neutral-800 pl-9 pr-8 py-2.5 rounded-full border border-[#EADBDA] focus:outline-none focus:border-[#7B2435] shadow-xs"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>
            </div>

            {/* Scrollable Navigation List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Quick Links */}
              <div className="space-y-1 pb-3 border-b border-[#F0E6E1]">
                <button
                  onClick={() => {
                    onNavigate('/');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                    currentRoute === '/' ? 'bg-[#7B2435] text-white' : 'text-neutral-800 hover:bg-[#FFF6F4] hover:text-[#7B2435]'
                  }`}
                >
                  <span>Home</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('/new-arrivals');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold text-neutral-800 hover:bg-[#FFF6F4] hover:text-[#7B2435] flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <span>New Arrivals</span>
                    <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] uppercase font-bold rounded-full">
                      New
                    </span>
                  </span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('/plus-size');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold text-[#7B2435] bg-[#FFF2F4] hover:bg-[#FFE5EA] flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Plus Size (2XL - 5XL)</span>
                  </span>
                  <span className="text-[10px] text-neutral-500 font-semibold">Curve Fit</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('/bestsellers');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold text-neutral-800 hover:bg-[#FFF6F4] hover:text-[#7B2435] flex items-center justify-between transition"
                >
                  <span>Bestsellers</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">★ Top Rated</span>
                </button>

                <button
                  onClick={() => {
                    onNavigate('/offers');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center justify-between transition"
                >
                  <span>Festive Offers & Discounts</span>
                  <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">Up to 60%</span>
                </button>
              </div>

              {/* Categories Section Heading */}
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider px-3 block mb-1">
                  Shop By Category
                </span>
                
                <div className="space-y-1">
                  {(categoriesList || []).map((cat) => {
                    const isCatExpanded = expandedMobileCategory === cat.id;
                    const hasSub = (cat.subMenus && cat.subMenus.length > 0) || (cat.subcategories && cat.subcategories.length > 0);

                    return (
                      <div key={cat.id} className="rounded-xl border border-neutral-100 overflow-hidden bg-[#FAF6F0]/40">
                        <div className="flex items-center justify-between p-2.5">
                          <button
                            onClick={() => {
                              if (onSelectCategory) {
                                onSelectCategory(cat.slug);
                              } else {
                                onNavigate(`/${cat.slug}`);
                              }
                              setIsMobileMenuOpen(false);
                            }}
                            className="text-xs font-bold text-neutral-900 hover:text-[#7B2435] text-left flex-1"
                          >
                            {cat.name}
                          </button>
                          {hasSub && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedMobileCategory(isCatExpanded ? null : cat.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white text-neutral-500 hover:text-[#7B2435]"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCatExpanded ? 'rotate-180 text-[#7B2435]' : ''}`} />
                            </button>
                          )}
                        </div>

                        {/* Subcategories Accordion */}
                        {isCatExpanded && (
                          <div className="bg-white border-t border-neutral-100 px-3 py-2 space-y-1">
                            <button
                              onClick={() => {
                                if (onSelectCategory) {
                                  onSelectCategory(cat.slug);
                                } else {
                                  onNavigate(`/${cat.slug}`);
                                }
                                setIsMobileMenuOpen(false);
                              }}
                              className="text-[11px] font-bold text-[#7B2435] py-1.5 px-2 hover:bg-[#FFF6F4] rounded-lg block text-left w-full"
                            >
                              All {cat.name} Collection →
                            </button>

                            {cat.subMenus && cat.subMenus.length > 0 ? (
                              cat.subMenus.map((subMenu) => {
                                const isSubMenuExpanded = expandedMobileSubMenu === subMenu.id;
                                return (
                                  <div key={subMenu.id} className="pl-1 border-l border-neutral-200 ml-1">
                                    <div className="flex items-center justify-between py-1 px-2 text-[11px] font-bold text-neutral-700">
                                      <button
                                        onClick={() => {
                                          if (onSelectCategory) {
                                            onSelectCategory(cat.slug, subMenu.name);
                                          } else {
                                            onNavigate(`/${cat.slug}?subcategory=${encodeURIComponent(subMenu.name)}`);
                                          }
                                          setIsMobileMenuOpen(false);
                                        }}
                                        className="hover:text-[#7B2435] text-left flex-1"
                                      >
                                        {subMenu.name}
                                      </button>
                                      {subMenu.subcategories && subMenu.subcategories.length > 0 && (
                                        <button
                                          onClick={() => setExpandedMobileSubMenu(isSubMenuExpanded ? null : subMenu.id)}
                                          className="p-1 text-neutral-400 hover:text-neutral-700"
                                        >
                                          <ChevronDown className={`w-3 h-3 transition-transform ${isSubMenuExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                      )}
                                    </div>

                                    {/* Level 2 Sub-subcategories */}
                                    {isSubMenuExpanded && subMenu.subcategories && (
                                      <div className="pl-3 space-y-1 border-l border-rose-200 ml-2 my-1">
                                        {subMenu.subcategories.map((subSub) => (
                                          <button
                                            key={subSub.id}
                                            onClick={() => {
                                              if (onSelectCategory) {
                                                onSelectCategory(cat.slug, subMenu.name, subSub.name);
                                              } else {
                                                onNavigate(`/${cat.slug}?subcategory=${encodeURIComponent(subMenu.name)}&subSubCategory=${encodeURIComponent(subSub.name)}`);
                                              }
                                              setIsMobileMenuOpen(false);
                                            }}
                                            className="text-[11px] text-neutral-600 hover:text-[#7B2435] py-1 px-2 block w-full text-left rounded hover:bg-neutral-50"
                                          >
                                            {subSub.name}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              cat.subcategories.map((sub, sIdx) => (
                                <button
                                  key={sIdx}
                                  onClick={() => {
                                    if (onSelectCategory) {
                                      onSelectCategory(cat.slug, sub);
                                    } else {
                                      onNavigate(`/${cat.slug}?subcategory=${encodeURIComponent(sub)}`);
                                    }
                                    setIsMobileMenuOpen(false);
                                  }}
                                  className="text-[11px] text-neutral-600 hover:text-[#7B2435] px-2 py-1 block text-left w-full rounded hover:bg-neutral-50"
                                >
                                  {sub}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[#F0E6E1] bg-[#FAF6F4] flex-shrink-0 space-y-2.5">
              <button
                onClick={() => {
                  if (onOpenStylist) {
                    onOpenStylist();
                  } else {
                    onNavigate('/listing');
                  }
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#7B2435] hover:bg-[#621c2a] text-white rounded-full text-xs font-bold shadow-sm transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Ethnic Wardrobe Stylist</span>
              </button>

              <div className="flex items-center justify-between pt-1 text-xs">
                {user ? (
                  <button
                    onClick={() => {
                      onNavigate('/account');
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 text-neutral-800 font-semibold hover:text-[#7B2435]"
                  >
                    <UserIcon className="w-4 h-4 text-neutral-500" />
                    <span className="truncate max-w-[130px]">{user.name}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      loginWithGoogle();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-1.5 text-[#7B2435] font-bold"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Google Sign In</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    onNavigate('/admin');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1 text-[11px] text-neutral-600 hover:text-[#7B2435] font-semibold bg-white border border-neutral-200 px-2.5 py-1 rounded-full"
                >
                  <Shield className="w-3.5 h-3.5 text-[#7B2435]" />
                  <span>Admin Suite</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
