import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Category } from '../../types';
import { useGetCategoriesQuery } from '../../store/api/ecommerceApi';
import { INITIAL_CATEGORIES } from '../../data/mockData';
import { useBranding } from '../../hooks/useBranding';

export interface CategoryGridProps {
  categories?: Category[];
  title?: string;
  subtitle?: string;
  onSelectCategory: (slug: string, subcategory?: string) => void;
  onSelectSize?: (size: string) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories: propCategories,
  title,
  subtitle,
  onSelectCategory,
  onSelectSize,
}) => {
  const { data: dynamicCategories } = useGetCategoriesQuery();
  const categories =
    propCategories ||
    (dynamicCategories && dynamicCategories.length > 0 ? dynamicCategories : INITIAL_CATEGORIES);

  return (
    <section className="py-14 sm:py-18 bg-[#FAF6F0]/70 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-primary)] block mb-2">
            Curated Artisanal Categories
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 mb-3">
            {title || 'Shop by Silhouette & Craft'}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            {subtitle ||
              'From lightweight 60s cambric cotton daily wear to regal festive Anarkalis and modern two-piece co-ord sets.'}
          </p>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {(categories || []).map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className="group cursor-pointer flex flex-col items-center text-center select-none"
            >
              <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-xs border border-stone-200 bg-white group-hover:shadow-lg transition-all duration-300">
                <img
                  src={
                    cat.imageUrl ||
                    cat.bannerUrl ||
                    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('photo-1583391733956-3750e0ff4e8b')) {
                      target.src =
                        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80';
                    }
                  }}
                  className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-70 group-hover:opacity-50 transition-opacity" />

                {cat.slug === 'plus-size' && (
                  <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[var(--brand-primary)] text-white text-[9px] font-black rounded-md uppercase tracking-wider flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                    2XL-5XL
                  </div>
                )}
              </div>

              <div className="mt-3">
                <h3 className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-[var(--brand-primary)] transition-colors">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-stone-500 font-medium group-hover:text-[var(--brand-primary)] flex items-center justify-center gap-1 mt-0.5 transition-colors">
                  <span>Explore</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const ShopBySize: React.FC<{ onSelectSize: (size: string) => void }> = ({ onSelectSize }) => {
  const sizes = [
    { label: 'M', desc: 'Chest 38"' },
    { label: 'L', desc: 'Chest 40"' },
    { label: 'XL', desc: 'Chest 42"' },
    { label: '2XL', desc: 'Chest 44"', isPlus: true },
    { label: '3XL', desc: 'Chest 46"', isPlus: true },
    { label: '4XL', desc: 'Chest 48"', isPlus: true },
    { label: '5XL', desc: 'Chest 50"', isPlus: true },
  ];

  return (
    <section className="py-12 bg-white border-y border-stone-200/80 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
                Tailored Fit Precision
              </span>
              <span className="px-2.5 py-0.5 bg-brand-light text-brand-primary text-[10px] font-bold rounded-full border border-[var(--brand-primary)]/20">
                Zero Sizing Hassle
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Shop by Size (M to 5XL)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md">
            Every garment is calibrated with ease allowances so you never have to size up or down. Select your size to filter instant ready-to-ship stock:
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 sm:gap-4">
          {sizes.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => onSelectSize(s.label)}
              className={`group flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                s.isPlus
                  ? 'border-amber-200/80 bg-amber-50/40 hover:bg-[var(--brand-primary)] hover:border-[var(--brand-primary)] hover:shadow-md'
                  : 'border-stone-200 bg-stone-50 hover:bg-[var(--brand-primary)] hover:border-[var(--brand-primary)] hover:shadow-md'
              }`}
            >
              <span className="text-lg sm:text-xl font-bold tracking-tight text-stone-900 group-hover:text-white transition-colors">
                {s.label}
              </span>
              <span className="text-[10px] text-stone-500 group-hover:text-amber-200 mt-0.5 transition-colors">
                {s.desc}
              </span>
              {s.isPlus && (
                <span className="mt-1.5 text-[8px] font-black uppercase px-1.5 py-0.2 bg-[var(--brand-primary)] text-white rounded-md group-hover:bg-white group-hover:text-[var(--brand-primary)] transition-colors shadow-2xs">
                  Curve Fit
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
