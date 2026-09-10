import React from 'react';
import { Category } from '../../types';
import { useBranding } from '../../hooks/useBranding';
import { Sparkles } from 'lucide-react';

export interface CategoryStoriesProps {
  categories?: Category[];
  title?: string;
  subtitle?: string;
  onSelectCategory: (slug: string, subcategory?: string) => void;
}

export const CategoryStories: React.FC<CategoryStoriesProps> = ({
  categories = [],
  title,
  subtitle,
  onSelectCategory,
}) => {
  const { primaryColor } = useBranding();

  const dynamicPills = React.useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map((cat, idx) => ({
        id: cat.id || cat.slug,
        title: cat.name,
        slug: cat.slug,
        tag: cat.slug === 'plus-size' ? '2XL-5XL' : idx === 0 ? 'Featured' : idx === 1 ? 'Trending' : 'Artisanal',
        isPlus: cat.slug === 'plus-size',
        isSpecial: idx === 0,
        image: cat.imageUrl || cat.bannerUrl || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=300&q=80',
      }));
    }
    return [
      {
        id: 'cat-1',
        title: 'Anarkalis',
        slug: 'anarkalis',
        tag: 'Festive',
        isPlus: false,
        isSpecial: true,
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'cat-2',
        title: 'Straight Kurtis',
        slug: 'kurtis',
        tag: 'Daily Cotton',
        isPlus: false,
        isSpecial: false,
        image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'cat-3',
        title: 'Plus Size',
        slug: 'plus-size',
        tag: '2XL-5XL',
        isPlus: true,
        isSpecial: false,
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'cat-4',
        title: 'Co-ord Sets',
        slug: 'co-ord-sets',
        tag: 'Trending',
        isPlus: false,
        isSpecial: false,
        image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'cat-5',
        title: 'Kurta Sets (3 Pc)',
        slug: 'kurta-sets',
        tag: 'Complete',
        isPlus: false,
        isSpecial: false,
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
      },
      {
        id: 'cat-6',
        title: 'Chikankari',
        slug: 'chikankari',
        tag: 'Handloom',
        isPlus: false,
        isSpecial: false,
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      },
    ];
  }, [categories]);

  return (
    <section className="bg-white border-b border-stone-100 py-6 shadow-2xs w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="text-center mb-4">
            {title && <h3 className="font-serif text-lg font-bold text-stone-900">{title}</h3>}
            {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
          </div>
        )}
        <div className="flex items-center gap-4 sm:gap-8 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center">
          {dynamicPills.map((story) => (
            <button
              key={story.id}
              type="button"
              onClick={() => onSelectCategory(story.slug)}
              className="flex flex-col items-center flex-shrink-0 group focus:outline-none cursor-pointer"
            >
              {/* Circular story ring */}
              <div
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-[2.5px] transition-all duration-300 group-hover:scale-108 group-hover:shadow-md ${
                  story.isPlus
                    ? 'bg-gradient-to-tr from-amber-600 via-rose-600 to-amber-400 ring-2 ring-amber-400/30'
                    : story.isSpecial
                    ? 'bg-gradient-to-tr from-amber-400 via-rose-500 to-[var(--brand-primary)]'
                    : 'bg-gradient-to-tr from-stone-300 via-stone-200 to-[var(--brand-primary)] group-hover:from-[var(--brand-primary)] group-hover:to-amber-500'
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-white p-[2px]">
                  <img
                    src={story.image}
                    alt={story.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Micro Tag Badge */}
                {story.tag && (
                  <span
                    className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full shadow-xs whitespace-nowrap ${
                      story.isPlus
                        ? 'bg-[var(--brand-primary)] text-white ring-1 ring-white'
                        : story.isSpecial
                        ? 'bg-amber-400 text-stone-950 ring-1 ring-white'
                        : 'bg-stone-900 text-white'
                    }`}
                  >
                    {story.tag}
                  </span>
                )}
              </div>

              {/* Title */}
              <span className="text-[11px] sm:text-xs font-bold text-stone-800 group-hover:text-[var(--brand-primary)] transition-colors mt-2 text-center max-w-[80px] leading-tight">
                {story.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
