import React, { useRef } from 'react';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import { ProductCard } from '../common/ProductCard';
import { useBranding } from '../../hooks/useBranding';
import { Button } from '../ui/Button';

export interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  badge?: string;
  layout?: 'grid' | 'carousel' | 'slider';
  products?: Product[];
  onSelectProduct: (product: Product) => void;
  onViewAll?: () => void;
  onQuickView?: (product: Product) => void;
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({
  title,
  subtitle,
  badge,
  layout = 'grid',
  products = [],
  onSelectProduct,
  onViewAll,
  onQuickView,
}) => {
  const { primaryColor } = useBranding();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const displayedProducts = (products || []).slice(0, 8);

  if (displayedProducts.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 bg-white w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-stone-100">
          <div>
            {badge && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--brand-primary)] mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{badge}</span>
              </span>
            )}
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-stone-500 mt-1 max-w-xl">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {layout === 'carousel' && (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scroll('left')}
                  className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 hover:border-stone-400 transition-colors cursor-pointer"
                  aria-label="Previous products"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scroll('right')}
                  className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 hover:border-stone-400 transition-colors cursor-pointer"
                  aria-label="Next products"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {onViewAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewAll}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                View All
              </Button>
            )}
          </div>
        </div>

        {/* Layout: Grid vs Carousel */}
        {layout === 'carousel' ? (
          <div
            ref={scrollRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory no-scrollbar"
          >
            {displayedProducts.map((product) => (
              <div
                key={product.id}
                className="w-[240px] sm:w-[280px] shrink-0 snap-start"
              >
                <ProductCard
                  product={product}
                  onSelectProduct={onSelectProduct}
                  onQuickView={onQuickView}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
