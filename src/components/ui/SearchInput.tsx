import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, History, Sparkles, ChevronRight, Tag } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Product, Category } from '../../types';
import { formatCurrency } from '../../utils/formatters';

export interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  onClear?: () => void;
  onSelectProduct?: (product: Product) => void;
  onSelectCategory?: (categorySlug: string, subcategory?: string) => void;
  products?: Product[];
  categories?: Category[];
  className?: string;
  autoFocus?: boolean;
  enableRecommendations?: boolean;
}

const TRENDING_SEARCHES = [
  'New Arrivals',
  'Chikankari Kurtas',
  '3-Piece Festive Sets',
  'Cotton Co-ords',
  'Plus Size 2XL-5XL',
  'Anarkali Suit',
  'Zari Chanderi Set',
  'A-Line Daily Kurtis',
];

const RECENT_SEARCHES_KEY = 'nandita_recent_searches';

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Search cotton kurtis, sizes M-5XL, anarkalis...',
  value: controlledValue,
  onChange,
  onSearch,
  onClear,
  onSelectProduct,
  onSelectCategory,
  products = [],
  categories = [],
  className,
  autoFocus,
  enableRecommendations = true,
}) => {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch {}
  }, []);

  const saveRecentSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {}
  };

  const removeRecentSearch = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter((s) => s !== query);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  // Sync external value
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalValue(val);
    setSelectedIndex(-1);
    if (onChange) onChange(val);
    if (!isOpen) setIsOpen(true);
  };

  const executeSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    saveRecentSearch(trimmed);
    setIsOpen(false);
    if (inputRef.current) inputRef.current.blur();
    if (onSearch) {
      onSearch(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch(internalValue);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    setSelectedIndex(-1);
    if (onChange) onChange('');
    if (onClear) onClear();
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSelectCategoryItem = (slug: string, subcategory?: string, label?: string) => {
    if (label) saveRecentSearch(label);
    setIsOpen(false);
    if (onSelectCategory) {
      onSelectCategory(slug, subcategory);
    } else if (onSearch) {
      onSearch(label || slug);
    }
  };

  const handleSelectProductItem = (product: Product) => {
    saveRecentSearch(product.name);
    setIsOpen(false);
    if (onSelectProduct) {
      onSelectProduct(product);
    } else if (onSearch) {
      onSearch(product.name);
    }
  };

  // Helper to extract safe primary image URL from product
  const getProductImageUrl = (prod: Product): string => {
    if (!prod.images || prod.images.length === 0) {
      return 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=150&q=80';
    }
    const primary: any = prod.images.find((img: any) => img?.isPrimary) || prod.images[0];
    if (typeof primary === 'string') return primary;
    return primary?.url || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=150&q=80';
  };

  // Calculate live matching recommendations
  const trimmed = internalValue.trim().toLowerCase();

  // Matching Products with intelligent token & new arrivals filtering
  const matchingProducts = React.useMemo(() => {
    if (!trimmed || products.length === 0) return [];

    const tokens = trimmed.split(/[\s,+/]+/).filter((t) => !['in', 'for', 'with', 'and', 'of', 'the', 'a', 'an'].includes(t));
    const isSearchingNew = trimmed.includes('new') || trimmed.includes('arrival') || trimmed.includes('fresh');

    return products
      .filter((p) => {
        // Direct pass for new arrival queries if product is marked as new
        if (isSearchingNew && (p.isNewArrival || p.badge?.toLowerCase().includes('new') || p.tags?.some((t) => t.toLowerCase().includes('new')))) {
          const nonNewTokens = tokens.filter((t) => !['new', 'arrival', 'arrivals', 'fresh'].includes(t));
          if (nonNewTokens.length === 0) return true;
        }

        const searchable = [
          p.name,
          p.category,
          p.subcategory,
          p.subSubCategory,
          p.fabric,
          p.work,
          p.occasion,
          p.description,
          p.badge,
          ...(p.tags || []),
          ...(p.collections || []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return tokens.every((token) => {
          if (!token) return true;
          if (token === 'new' || token === 'arrival' || token === 'arrivals' || token === 'fresh') {
            return Boolean(
              p.isNewArrival ||
              p.badge?.toLowerCase().includes('new') ||
              p.tags?.some((t) => t.toLowerCase().includes('new')) ||
              p.collections?.some((c) => c.toLowerCase().includes('new')) ||
              searchable.includes(token)
            );
          }
          return searchable.includes(token);
        });
      })
      .slice(0, 6);
  }, [trimmed, products]);

  // Matching Categories & Collections
  const matchingCategories = React.useMemo(() => {
    if (!trimmed) return [];
    const results: Array<{ label: string; slug: string; subcategory?: string; type: string }> = [];

    // Check special collections
    if ('new arrivals'.includes(trimmed) || 'fresh'.includes(trimmed) || trimmed.includes('new') || trimmed.includes('arrival')) {
      const newCount = products.filter((p) => p.isNewArrival || p.badge?.toLowerCase().includes('new') || p.tags?.some((t) => t.toLowerCase().includes('new'))).length;
      results.push({
        label: newCount > 0 ? `New Arrivals Collection (${newCount} Items)` : 'New Arrivals Collection',
        slug: 'new-arrivals',
        type: 'Collection',
      });
    }
    if ('plus size'.includes(trimmed) || '2xl'.includes(trimmed) || '3xl'.includes(trimmed) || '4xl'.includes(trimmed) || '5xl'.includes(trimmed) || trimmed.includes('plus')) {
      results.push({ label: 'Plus Size (2XL - 5XL)', slug: 'plus-size', type: 'Size Collection' });
    }
    if ('festive specials'.includes(trimmed) || 'wedding'.includes(trimmed) || 'party'.includes(trimmed) || trimmed.includes('festive')) {
      results.push({ label: 'Festive & Celebration Specials', slug: 'festive-specials', type: 'Occasion' });
    }
    if ('bestsellers'.includes(trimmed) || 'trending'.includes(trimmed) || 'popular'.includes(trimmed)) {
      results.push({ label: 'Bestselling Kurtis & Sets', slug: 'bestsellers', type: 'Curated' });
    }

    // Check real categories and subcategories
    categories.forEach((cat) => {
      if (cat.name.toLowerCase().includes(trimmed) || cat.slug.toLowerCase().includes(trimmed)) {
        results.push({ label: cat.name, slug: cat.slug, type: 'Category' });
      }
      cat.subcategories?.forEach((sub) => {
        if (sub.toLowerCase().includes(trimmed)) {
          results.push({ label: `${sub} in ${cat.name}`, slug: cat.slug, subcategory: sub, type: 'Subcategory' });
        }
      });
    });

    return results.slice(0, 4);
  }, [trimmed, categories, products]);

  return (
    <div ref={containerRef} className={cn('relative flex items-center w-full', className)}>
      <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="text"
        autoFocus={autoFocus}
        value={internalValue}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-[#F5EFE6]/70 hover:bg-[#F5EFE6] focus:bg-white border border-[#EADBDA] rounded-full pl-10 pr-10 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-[#7B2435] focus:ring-2 focus:ring-[#7B2435]/15 transition-all shadow-xs"
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 cursor-pointer z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Live Search Recommendations Dropdown Panel */}
      {enableRecommendations && isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-neutral-100 py-3 z-50 max-h-[80vh] overflow-y-auto normal-case text-left animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Query Match Summary (When Typing) */}
          {trimmed && (
            <div className="px-4 pb-3 border-b border-neutral-100">
              <button
                type="button"
                onClick={() => executeSearch(internalValue)}
                className="w-full flex items-center justify-between text-xs font-bold text-[#7B2435] bg-[#FFF0F3] hover:bg-[#FDE2E8] p-2.5 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#7B2435]" />
                  <span>Search for <span className="underline">"{internalValue}"</span></span>
                </div>
                <span className="text-[11px] font-semibold bg-white text-[#7B2435] px-2 py-0.5 rounded-md shadow-2xs">
                  Press Enter ↵
                </span>
              </button>
            </div>
          )}

          {/* Matching Category Shortcuts */}
          {matchingCategories.length > 0 && (
            <div className="px-4 py-2 border-b border-neutral-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-[#7B2435]" />
                <span>Categories & Collections</span>
              </div>
              <div className="space-y-1">
                {matchingCategories.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectCategoryItem(item.slug, item.subcategory, item.label)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-700 hover:bg-[#FAF6F0] hover:text-[#7B2435] transition-colors cursor-pointer"
                  >
                    <span className="font-semibold text-neutral-800">{item.label}</span>
                    <span className="text-[10px] bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded font-mono">
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matching Products Live Preview */}
          {matchingProducts.length > 0 && (
            <div className="px-4 py-2.5 border-b border-neutral-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Matching Products</span>
                </span>
                <span className="text-[10px] text-neutral-500 font-normal">
                  {matchingProducts.length} items
                </span>
              </div>
              <div className="space-y-2">
                {matchingProducts.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleSelectProductItem(prod)}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#FAF6F0] transition-colors text-left cursor-pointer group"
                  >
                    <img
                      src={getProductImageUrl(prod)}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-lg object-cover bg-neutral-100 border border-neutral-200 shrink-0 group-hover:scale-105 transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-neutral-900 truncate group-hover:text-[#7B2435] transition-colors">
                        {prod.name}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {prod.category} {prod.fabric ? `• ${prod.fabric}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-[#7B2435]">
                        {formatCurrency(prod.sellingPrice)}
                      </span>
                      {prod.mrp > prod.sellingPrice && (
                        <span className="block text-[10px] text-neutral-400 line-through">
                          {formatCurrency(prod.mrp)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* If typed something but no direct products found */}
          {trimmed && matchingProducts.length === 0 && matchingCategories.length === 0 && (
            <div className="px-4 py-3 text-center text-xs text-neutral-500">
              <p>No exact product matches found for <span className="font-semibold text-neutral-800">"{internalValue}"</span></p>
              <button
                type="button"
                onClick={() => executeSearch(internalValue)}
                className="mt-2 text-xs font-bold text-[#7B2435] hover:underline cursor-pointer"
              >
                Search all collections for "{internalValue}" →
              </button>
            </div>
          )}

          {/* Recent Searches Section (When available) */}
          {recentSearches.length > 0 && (
            <div className="px-4 py-2 border-b border-neutral-100">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                <span className="flex items-center gap-1.5">
                  <History className="w-3 h-3 text-neutral-500" />
                  <span>Recent Searches</span>
                </span>
                <button
                  type="button"
                  onClick={clearAllRecent}
                  className="text-[10px] text-neutral-400 hover:text-neutral-700 normal-case font-normal cursor-pointer"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((rec, rIdx) => (
                  <div
                    key={rIdx}
                    onClick={() => {
                      setInternalValue(rec);
                      executeSearch(rec);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-[#FAF6F0] hover:text-[#7B2435] text-neutral-700 text-xs cursor-pointer transition-colors"
                  >
                    <span>{rec}</span>
                    <button
                      type="button"
                      onClick={(e) => removeRecentSearch(e, rec)}
                      className="p-0.5 hover:text-rose-600 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending & Recommended Popular Searches */}
          <div className="px-4 pt-2 pb-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-[#7B2435]" />
              <span>Trending & Popular</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TRENDING_SEARCHES.map((tag, tIdx) => (
                <button
                  key={tIdx}
                  type="button"
                  onClick={() => {
                    setInternalValue(tag);
                    executeSearch(tag);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF6F0] hover:bg-[#FFF0F3] text-neutral-800 hover:text-[#7B2435] text-xs font-medium border border-neutral-200/60 transition-colors cursor-pointer"
                >
                  <span>{tag}</span>
                  <ChevronRight className="w-3 h-3 text-neutral-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
