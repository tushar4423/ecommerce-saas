import React, { useState } from 'react';
import { SlidersHorizontal, ChevronDown, Grid2X2, Grid3X3, LayoutGrid, X, Sparkles, Filter } from 'lucide-react';
import { Product, FilterState } from '../../types';
import { ProductCard } from './ProductCard';
import { FilterSidebar } from './FilterSidebar';
import { EmptyState } from '../common/EmptyState';
import { QuickViewModal } from '../common/QuickViewModal';

interface ProductListingViewProps {
  title: string;
  subtitle?: string;
  categorySlug?: string;
  subcategory?: string;
  products: Product[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  onSelectProduct: (product: Product) => void;
  onNavigate: (route: string) => void;
}

export const ProductListingView: React.FC<ProductListingViewProps> = ({
  title,
  subtitle,
  categorySlug,
  subcategory,
  products,
  filters,
  onFilterChange,
  onResetFilters,
  onSelectProduct,
  onNavigate,
}) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(3);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Apply filtering logic
  let filtered = [...products];

  // Category filter
  if (categorySlug && categorySlug !== 'all' && categorySlug !== 'search') {
    if (categorySlug === 'new-arrivals' || categorySlug === 'new') {
      filtered = filtered.filter(
        (p) =>
          p.isNewArrival ||
          p.badge?.toLowerCase().includes('new') ||
          p.tags?.some((t) => t.toLowerCase().includes('new')) ||
          p.collections?.some((c) => c.toLowerCase().includes('new')) ||
          p.category?.toLowerCase().includes('new')
      );
    } else if (categorySlug === 'bestsellers') {
      filtered = filtered.filter((p) => p.isBestseller || p.badge?.toLowerCase().includes('best'));
    } else if (categorySlug === 'plus-size') {
      filtered = filtered.filter((p) =>
        p.variants.some((v) => ['2XL', '3XL', '4XL', '5XL'].includes(v.size) && v.stock > 0)
      );
    } else if (categorySlug === 'offers') {
      filtered = filtered.filter((p) => p.discountPercent >= 35);
    } else {
      filtered = filtered.filter(
        (p) =>
          p.category.toLowerCase().replace(/[\s&]+/g, '-') === categorySlug ||
          p.category.toLowerCase().includes(categorySlug.replace(/-/g, ' '))
      );
    }
  }

  // Subcategory filter
  if (subcategory) {
    filtered = filtered.filter(
      (p) => p.subcategory?.toLowerCase() === subcategory.toLowerCase()
    );
  }

  // Sub-SubCategory filter
  if (filters.subSubCategory) {
    const ssc = filters.subSubCategory.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.subSubCategory?.toLowerCase() === ssc ||
        p.subcategory?.toLowerCase().includes(ssc) ||
        p.tags?.some((t) => t?.toLowerCase().includes(ssc)) ||
        p.name?.toLowerCase().includes(ssc)
    );
  }

  // Discount Min filter (Nykaa style: 20% & above, 30% & above, 50% & above)
  if (filters.discountMin && filters.discountMin > 0) {
    filtered = filtered.filter((p) => p.discountPercent >= (filters.discountMin || 0));
  }

  // Rating Min filter
  if (filters.ratingMin && filters.ratingMin > 0) {
    filtered = filtered.filter((p) => (p.rating || 4.5) >= (filters.ratingMin || 0));
  }

  // Search query filter
  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase().trim();
    const isNewQ = q.includes('new') || q.includes('arrival') || q.includes('fresh');

    filtered = filtered.filter((p) => {
      if (isNewQ && (p.isNewArrival || p.badge?.toLowerCase().includes('new') || p.tags?.some((t) => t.toLowerCase().includes('new')))) {
        return true;
      }
      return (
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.subcategory?.toLowerCase().includes(q) ||
        p.fabric?.toLowerCase().includes(q) ||
        p.work?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.badge?.toLowerCase().includes(q) ||
        p.collections?.some((c) => c?.toLowerCase().includes(q)) ||
        p.tags?.some((t) => t?.toLowerCase().includes(q))
      );
    });
  }

  // Size filter
  if (filters.sizes && filters.sizes.length > 0) {
    filtered = filtered.filter((p) =>
      p.variants?.some((v) => filters.sizes.includes(v.size) && v.stock > 0)
    );
  }

  // Color filter
  if (filters.colors && filters.colors.length > 0) {
    filtered = filtered.filter((p) =>
      p.variants?.some((v) => filters.colors.includes(v.color))
    );
  }

  // Fabric filter
  if (filters.fabrics && filters.fabrics.length > 0) {
    filtered = filtered.filter((p) => filters.fabrics.includes(p.fabric));
  }

  // Work filter
  if (filters.works && filters.works.length > 0) {
    filtered = filtered.filter((p) => filters.works.includes(p.work));
  }

  // Occasion filter
  if (filters.occasions && filters.occasions.length > 0) {
    filtered = filtered.filter((p) => filters.occasions.includes(p.occasion));
  }

  // Price range
  if (filters.minPrice > 0) {
    filtered = filtered.filter((p) => p.sellingPrice >= filters.minPrice);
  }
  if (filters.maxPrice < 5000) {
    filtered = filtered.filter((p) => p.sellingPrice <= filters.maxPrice);
  }

  // In stock
  if (filters.inStockOnly) {
    filtered = filtered.filter((p) => p.variants?.some((v) => v.stock > 0));
  }

  // Sorting
  if (filters.sortBy === 'price-asc') {
    filtered.sort((a, b) => a.sellingPrice - b.sellingPrice);
  } else if (filters.sortBy === 'price-desc') {
    filtered.sort((a, b) => b.sellingPrice - a.sellingPrice);
  } else if (filters.sortBy === 'bestseller') {
    filtered.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
  } else if (filters.sortBy === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (filters.sortBy === 'discount') {
    filtered.sort((a, b) => b.discountPercent - a.discountPercent);
  } else if (filters.sortBy === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const activeFilterPills: { label: string; onRemove: () => void }[] = [];
  (filters.sizes || []).forEach((s) => {
    activeFilterPills.push({
      label: `Size: ${s}`,
      onRemove: () => onFilterChange({ ...filters, sizes: (filters.sizes || []).filter((x) => x !== s) }),
    });
  });
  (filters.colors || []).forEach((c) => {
    activeFilterPills.push({
      label: `Color: ${c}`,
      onRemove: () => onFilterChange({ ...filters, colors: (filters.colors || []).filter((x) => x !== c) }),
    });
  });
  (filters.fabrics || []).forEach((f) => {
    activeFilterPills.push({
      label: `Fabric: ${f}`,
      onRemove: () => onFilterChange({ ...filters, fabrics: (filters.fabrics || []).filter((x) => x !== f) }),
    });
  });
  (filters.works || []).forEach((w) => {
    activeFilterPills.push({
      label: `Work: ${w}`,
      onRemove: () => onFilterChange({ ...filters, works: (filters.works || []).filter((x) => x !== w) }),
    });
  });
  if (filters.maxPrice < 5000) {
    activeFilterPills.push({
      label: `Under ₹${filters.maxPrice}`,
      onRemove: () => onFilterChange({ ...filters, maxPrice: 5000 }),
    });
  }

  // Prevent body scroll when mobile filter is open
  React.useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileFilterOpen]);

  return (
    <div className="bg-[#FAF6F0] min-h-screen py-8 w-full">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-neutral-500 mb-6">
          <button onClick={() => onNavigate('/')} className="hover:text-[#7B2435]">
            Home
          </button>
          <span>/</span>
          <span className="font-semibold text-neutral-800 capitalize">{title}</span>
          {subcategory && (
            <>
              <span>/</span>
              <span className="font-bold text-[#7B2435]">{subcategory}</span>
            </>
          )}
        </nav>

        {/* Page Title & Count Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#EADBDA] mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-neutral-900 capitalize">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 mt-1">
              {subtitle || `Explore ${filtered.length} handcrafted authentic ethnic garments.`}
            </p>
          </div>

          {/* Controls: Mobile filter trigger + Sort + Desktop Grid toggles */}
          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-[#EADBDA] rounded-full text-xs font-bold text-neutral-800 shadow-xs"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#7B2435]" />
              <span>Filters ({activeFilterPills.length})</span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative inline-block">
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    sortBy: e.target.value as FilterState['sortBy'],
                  })
                }
                className="appearance-none bg-white border border-[#EADBDA] text-xs font-semibold text-neutral-800 rounded-full pl-4 pr-9 py-2 focus:outline-none focus:border-[#7B2435] shadow-xs cursor-pointer"
              >
                <option value="recommended">Sort: Recommended</option>
                <option value="newest">Sort: Newest First</option>
                <option value="bestseller">Sort: Bestsellers</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="discount">Biggest Discount</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Desktop Grid Layout Buttons */}
            <div className="hidden sm:flex items-center bg-white border border-[#EADBDA] rounded-full p-1 shadow-xs">
              <button
                onClick={() => setGridColumns(2)}
                className={`p-1.5 rounded-full transition ${
                  gridColumns === 2 ? 'bg-[#7B2435] text-white' : 'text-neutral-500 hover:text-neutral-800'
                }`}
                title="2 Columns"
              >
                <Grid2X2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setGridColumns(3)}
                className={`p-1.5 rounded-full transition ${
                  gridColumns === 3 ? 'bg-[#7B2435] text-white' : 'text-neutral-500 hover:text-neutral-800'
                }`}
                title="3 Columns"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setGridColumns(4)}
                className={`p-1.5 rounded-full transition ${
                  gridColumns === 4 ? 'bg-[#7B2435] text-white' : 'text-neutral-500 hover:text-neutral-800'
                }`}
                title="4 Columns"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFilterPills.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-bold text-neutral-600 mr-1">Active:</span>
            {activeFilterPills.map((pill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#E6A4B4] text-[#7B2435] rounded-full text-xs font-semibold shadow-xs"
              >
                <span>{pill.label}</span>
                <button
                  onClick={pill.onRemove}
                  className="hover:bg-rose-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={onResetFilters}
              className="text-xs font-bold text-neutral-500 hover:text-[#7B2435] underline underline-offset-2 ml-2"
            >
              Reset All
            </button>
          </div>
        )}

        {/* Main Content Layout (Sidebar + Product Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Desktop Left Sidebar */}
          <div className="hidden lg:block lg:col-span-1 sticky top-28 self-start max-h-[calc(100vh-8rem)] overflow-y-auto pr-1 custom-scrollbar">
            <FilterSidebar
              filters={filters}
              onFilterChange={onFilterChange}
              onReset={onResetFilters}
            />
          </div>

          {/* Product Cards Grid */}
          <div className="lg:col-span-3">
            {filtered.length > 0 ? (
              <div
                className={`grid gap-4 sm:gap-6 ${
                  gridColumns === 2
                    ? 'grid-cols-2'
                    : gridColumns === 4
                    ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-2 sm:grid-cols-3'
                }`}
              >
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={onSelectProduct}
                    onQuickView={(p) => setQuickViewProduct(p)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Products Match Your Filters"
                description="Try clearing some filter criteria like fabric or size to see more ethnic outfits."
                actionText="Reset All Filters"
                onAction={onResetFilters}
              />
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onSelectProduct={onSelectProduct}
        />
      )}

      {/* Mobile Filters Slide-over Modal */}
      {isMobileFilterOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in"
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div 
            className="w-[85%] max-w-sm bg-white h-full shadow-2xl flex flex-col z-[101] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 overflow-y-auto">
              <FilterSidebar
                filters={filters}
                onFilterChange={onFilterChange}
                onReset={onResetFilters}
                onCloseMobile={() => setIsMobileFilterOpen(false)}
                isMobile={true}
              />
            </div>
            <div className="p-4 border-t border-[#F0E6E1] bg-white flex gap-3 flex-shrink-0 shadow-lg">
              <button
                onClick={() => {
                  onResetFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="flex-1 py-2.5 rounded-full border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 rounded-full bg-[#7B2435] hover:bg-[#621c2a] text-white text-xs font-bold shadow-md transition"
              >
                Apply ({filtered.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
