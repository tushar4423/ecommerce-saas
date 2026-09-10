import React, { useState } from 'react';
import { SlidersHorizontal, X, RotateCcw, Sparkles } from 'lucide-react';
import { PageHeader } from '../common/PageHeader';
import { FilterBar } from '../common/FilterBar';
import { ProductCard } from '../common/ProductCard';
import { SizeSelector } from '../common/SizeSelector';
import { EmptyState } from '../ui/EmptyState';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { ProductCardSkeleton } from '../ui/Skeleton';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setFilters,
  toggleSizeFilter,
  toggleFabricFilter,
  toggleColorFilter,
  setPriceRange,
  setSortBy,
  resetFilters,
  setSearchQuery,
} from '../../store/slices/filterSlice';
import { useGetProductsQuery, useGetCategoriesQuery } from '../../store/api/ecommerceApi';
import { SIZES, FABRICS, OCCASIONS, WORKS, COLORS } from '../../config/constants';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { matchProductToCategory, matchProductToFilters } from '../../utils/filterUtils';

export interface CatalogPageProps {
  onSelectProduct: (product: Product) => void;
  onNavigateHome: () => void;
  giniRecommendedProducts?: Product[];
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ 
  onSelectProduct, 
  onNavigateHome,
  giniRecommendedProducts = []
}) => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.filters.filters);
  const activeCategorySlug = useAppSelector((state) => state.filters.activeCategorySlug);
  const activeSubcategory = useAppSelector((state) => state.filters.activeSubcategory);

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const { data: allProducts = [], isLoading } = useGetProductsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();

  // Active Category Name
  const currentCategory = categories.find((c) => c.slug === activeCategorySlug);
  
  const pageTitle = React.useMemo(() => {
    if (activeCategorySlug === 'search') {
      return `Search results for "${filters.searchQuery}"`;
    }
    if (activeCategorySlug === 'new-arrivals' || activeCategorySlug === 'new') {
      return 'Fresh New Season Arrivals';
    }
    if (activeCategorySlug === 'plus-size' || activeCategorySlug === 'plus') {
      return 'Plus Size Ethnic Collection (2XL to 5XL)';
    }
    if (activeCategorySlug === 'festive-specials' || activeCategorySlug === 'festive') {
      return 'Festive Specials & Occasion Wear';
    }
    if (activeCategorySlug === 'bestsellers') {
      return 'Bestseller Kurtis Collection';
    }
    if (activeCategorySlug === 'trending') {
      return 'Trending Kurtis & Ensembles';
    }
    return activeSubcategory || currentCategory?.name || 'Handcrafted Ethnic Kurtis Collection';
  }, [activeCategorySlug, activeSubcategory, currentCategory, filters.searchQuery]);

  const pageSubtitle = React.useMemo(() => {
    if (activeCategorySlug === 'new-arrivals' || activeCategorySlug === 'new') {
      return 'Discover our latest handcrafted silhouettes, fresh artisanal prints, and newest seasonal drops.';
    }
    if (activeCategorySlug === 'plus-size' || activeCategorySlug === 'plus') {
      return 'Comfortable, graceful ethnic kurtis designed for flattering fits in sizes 2XL, 3XL, 4XL, and 5XL.';
    }
    if (activeCategorySlug === 'festive-specials' || activeCategorySlug === 'festive') {
      return 'Celebrate in style with Lucknowi Chikankari, Gotapatti, Zari embroidery, and royal Anarkali sets.';
    }
    return 'Explore our artisanal collection of hand-block printed, Chikankari, and festive designer kurtis.';
  }, [activeCategorySlug]);

  // Apply filters in memory
  const filteredProducts = React.useMemo(() => {
    return allProducts.filter((product) => {
      // 1. Check Category and Subcategory matching
      const matchesCategory = matchProductToCategory(
        product,
        activeCategorySlug,
        activeSubcategory,
        categories
      );
      if (!matchesCategory) return false;

      // 2. Check sidebar and query filters (size, fabric, work, occasion, price, colors, inStock)
      const matchesSidebar = matchProductToFilters(product, filters);
      if (!matchesSidebar) return false;

      return true;
    });
  }, [allProducts, activeCategorySlug, activeSubcategory, filters, categories]);

  // Sort filtered products
  const sortedProducts = React.useMemo(() => {
    const list = [...filteredProducts];
    switch (filters.sortBy) {
      case 'price_low':
        return list.sort((a, b) => a.sellingPrice - b.sellingPrice);
      case 'price_high':
        return list.sort((a, b) => b.sellingPrice - a.sellingPrice);
      case 'rating':
        return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'discount':
        return list.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
      case 'newest':
        return list.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
      case 'recommended':
      default:
        return list.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
    }
  }, [filteredProducts, filters.sortBy]);

  // Active filter tags for FilterBar
  const activeTags = [
    ...filters.sizes.map((sz) => ({
      id: `size-${sz}`,
      label: `Size: ${sz}`,
      onRemove: () => dispatch(toggleSizeFilter(sz)),
    })),
    ...filters.fabrics.map((fb) => ({
      id: `fabric-${fb}`,
      label: fb,
      onRemove: () => dispatch(toggleFabricFilter(fb)),
    })),
    ...filters.colors.map((cl) => ({
      id: `color-${cl}`,
      label: cl,
      onRemove: () => dispatch(toggleColorFilter(cl)),
    })),
  ];

  const filterSidebarContent = (
    <div className="space-y-6">
      {/* Size Filter (M, L, XL, XXL) */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
          Available Sizes
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {SIZES.map((size) => {
            const isSelected = filters.sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => dispatch(toggleSizeFilter(size))}
                className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#7B2435] text-white border-[#7B2435] shadow-xs'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-[#7B2435]'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-neutral-800 uppercase tracking-wider">
          <span>Max Price</span>
          <span className="text-[#7B2435] font-black">{formatCurrency(filters.maxPrice || 5000)}</span>
        </div>
        <input
          type="range"
          min={499}
          max={5000}
          step={100}
          value={filters.maxPrice || 5000}
          onChange={(e) =>
            dispatch(setPriceRange({ min: filters.minPrice || 499, max: Number(e.target.value) }))
          }
          className="w-full accent-[#7B2435] cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-neutral-400 font-semibold">
          <span>{formatCurrency(499)}</span>
          <span>{formatCurrency(5000)}</span>
        </div>
      </div>

      {/* Fabric Filter */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
          Fabric / Material
        </h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {FABRICS.map((fabric) => {
            const isChecked = filters.fabrics.includes(fabric);
            return (
              <label
                key={fabric}
                className="flex items-center gap-2.5 text-xs text-neutral-700 hover:text-neutral-900 cursor-pointer select-none py-0.5"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => dispatch(toggleFabricFilter(fabric))}
                  className="w-4 h-4 rounded text-[#7B2435] accent-[#7B2435]"
                />
                <span>{fabric}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Color Filter */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
          Shade & Palette
        </h4>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((col) => {
            const isSelected = filters.colors.includes(col.name);
            return (
              <button
                key={col.name}
                type="button"
                onClick={() => dispatch(toggleColorFilter(col.name))}
                title={col.name}
                className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer p-0.5 ${
                  isSelected ? 'border-[#7B2435] scale-110 shadow-xs' : 'border-transparent hover:scale-105'
                }`}
              >
                <span
                  className="w-full h-full rounded-full block border border-black/10"
                  style={{ backgroundColor: col.hex }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset Filter Button */}
      <Button
        variant="outline"
        size="sm"
        fullWidth
        onClick={() => dispatch(resetFilters())}
        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
      >
        Reset All Filters
      </Button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb & Header */}
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        breadcrumbs={[
          { label: 'Home', onClick: () => onNavigateHome() },
          { label: 'Catalog', onClick: () => dispatch(resetFilters()) },
          { label: pageTitle },
        ]}
      />

      {/* Filter & Search Bar */}
      <FilterBar
        searchQuery={filters.searchQuery}
        onSearchChange={(val) => dispatch(setSearchQuery(val))}
        sortBy={filters.sortBy}
        onSortChange={(val) => dispatch(setSortBy(val as any))}
        activeTags={activeTags}
        onClearAllTags={() => dispatch(resetFilters())}
        onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
        filterDrawerCount={activeTags.length}
        totalResults={sortedProducts.length}
      />

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Sticky Desktop Filter Sidebar */}
        <aside className="hidden lg:block bg-white p-6 rounded-2xl border border-neutral-100 shadow-xs sticky top-24">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100">
            <span className="font-serif font-bold text-sm text-neutral-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#7B2435]" />
              <span>Refine Outfits</span>
            </span>
            {activeTags.length > 0 && (
              <button
                type="button"
                onClick={() => dispatch(resetFilters())}
                className="text-xs text-[#7B2435] font-bold hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {filterSidebarContent}
        </aside>

        {/* Right Product Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Gini Live Voice Recommendations Highlight */}
          {giniRecommendedProducts && giniRecommendedProducts.length > 0 && (
            <div className="bg-gradient-to-r from-[#1E1B24] via-[#2A1820] to-[#1E1B24] p-5 rounded-2xl border border-[#D4AF37]/40 shadow-lg text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#F9F6F0] flex items-center gap-2">
                      <span>Live Voice Recommendations</span>
                      <span className="text-[10px] uppercase font-sans tracking-widest px-2 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                        Gini AI
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-300">
                      Curated matching your conversation and preferred styles
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {giniRecommendedProducts.slice(0, 4).map((recProduct) => (
                  <button
                    key={recProduct.id}
                    type="button"
                    onClick={() => onSelectProduct(recProduct)}
                    className="group text-left bg-black/40 hover:bg-black/60 p-2.5 rounded-xl border border-white/10 hover:border-[#D4AF37]/50 transition-all cursor-pointer"
                  >
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-neutral-800">
                      <img
                        src={recProduct.images?.[0]?.url || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400'}
                        alt={recProduct.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/80 backdrop-blur-xs text-[#D4AF37] text-[10px] font-bold px-1.5 py-0.5 rounded">
                        ₹{recProduct.sellingPrice}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-neutral-100 line-clamp-1 group-hover:text-[#D4AF37]">
                      {recProduct.name}
                    </p>
                    <p className="text-[11px] text-neutral-400 capitalize">
                      {recProduct.fabric || recProduct.category}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <EmptyState
              title="No kurtis match your current filters"
              description="Try adjusting your selected sizes, price range, or fabrics to discover matching designs."
              primaryActionText="Reset All Filters"
              onPrimaryAction={() => dispatch(resetFilters())}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {sortedProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={idx < 4}
                  onSelectProduct={onSelectProduct}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Slide-Over Filter Drawer */}
      <Drawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Refine Collection Filters"
        position="right"
        size="md"
        footer={
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => setIsFilterDrawerOpen(false)}
          >
            Apply Filters ({sortedProducts.length} Results)
          </Button>
        }
      >
        <div className="py-2">{filterSidebarContent}</div>
      </Drawer>
    </div>
  );
};
