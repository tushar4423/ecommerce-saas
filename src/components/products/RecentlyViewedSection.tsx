import React from 'react';
import { History, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { ProductCard } from '../common/ProductCard';

interface RecentlyViewedSectionProps {
  products: Product[];
  currentProductId?: string;
  onSelectProduct: (product: Product) => void;
  title?: string;
  subtitle?: string;
  limit?: number;
}

export const RecentlyViewedSection: React.FC<RecentlyViewedSectionProps> = ({
  products,
  currentProductId,
  onSelectProduct,
  title = 'Recently Viewed',
  subtitle = 'Pick up right where you left off in our boutique',
  limit = 4,
}) => {
  const filtered = products
    .filter((p) => p.id !== currentProductId)
    .slice(0, limit);

  if (filtered.length === 0) return null;

  return (
    <section className="mt-14 pt-10 border-t border-[#F0E6E1]" id="recently-viewed-section">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7B2435] mb-1">
            <History className="w-3.5 h-3.5" />
            <span>Browsing History</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>{filtered.length} products saved</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {filtered.map((prod) => (
          <ProductCard
            key={prod.id}
            product={prod}
            onSelectProduct={onSelectProduct}
            onSelect={onSelectProduct}
          />
        ))}
      </div>
    </section>
  );
};
