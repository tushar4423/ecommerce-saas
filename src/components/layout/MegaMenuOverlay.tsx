import React from 'react';
import { Sparkles, ArrowRight, Tag, Star } from 'lucide-react';
import { MegaMenuItem } from '../../types';

export interface MegaMenuOverlayProps {
  item: MegaMenuItem;
  onNavigateToCatalog: (categorySlug?: string, subcategory?: string) => void;
  onClose: () => void;
}

export const MegaMenuOverlay: React.FC<MegaMenuOverlayProps> = ({
  item,
  onNavigateToCatalog,
  onClose,
}) => {
  const columns = item.columns || [];
  const promoCards = item.promoCards || [];

  const handleSubItemClick = (url?: string, title?: string) => {
    onClose();
    if (!url) {
      onNavigateToCatalog();
      return;
    }

    // Extract query params if present
    try {
      const parsedUrl = new URL(url, window.location.origin);
      const category = parsedUrl.searchParams.get('category') || undefined;
      const sub = parsedUrl.searchParams.get('sub') || parsedUrl.searchParams.get('type') || parsedUrl.searchParams.get('fabric') || parsedUrl.searchParams.get('occasion') || title;
      onNavigateToCatalog(category, sub);
    } catch {
      onNavigateToCatalog(undefined, title);
    }
  };

  return (
    <div
      className="absolute top-full left-0 w-full bg-white/98 backdrop-blur-md shadow-2xl border-b border-stone-200 z-50 transition-all duration-200 animate-in fade-in slide-in-from-top-1 select-none"
      onMouseLeave={onClose}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Main Navigation Subcategories & Columns */}
          <div className={promoCards.length > 0 ? 'col-span-8 lg:col-span-9 grid grid-cols-3 gap-6' : 'col-span-12 grid grid-cols-4 gap-6'}>
            {columns.map((column) => (
              <div key={column.id} className="flex flex-col space-y-3">
                {/* Column Header */}
                <div className="border-b border-stone-100 pb-2">
                  <h3
                    onClick={() => handleSubItemClick(column.url, column.title)}
                    className="text-xs font-bold uppercase tracking-wider text-stone-900 hover:text-[var(--brand-primary)] cursor-pointer transition-colors"
                  >
                    {column.title}
                  </h3>
                </div>

                {/* Column Child Items */}
                <ul className="space-y-2.5">
                  {column.items.map((subItem) => (
                    <li key={subItem.id}>
                      <button
                        type="button"
                        onClick={() => handleSubItemClick(subItem.url, subItem.title)}
                        className="group flex items-center justify-between w-full text-left text-xs font-medium text-stone-600 hover:text-[var(--brand-primary)] hover:translate-x-0.5 transition-all cursor-pointer"
                      >
                        <span className="truncate">{subItem.title}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {subItem.isNew && (
                            <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded-full uppercase">
                              New
                            </span>
                          )}
                          {subItem.isFeatured && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full uppercase flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" />
                              Hot
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Promotional Marketing Visual Cards (Right Side) */}
          {promoCards.length > 0 && (
            <div className="col-span-4 lg:col-span-3 flex flex-col gap-4 border-l border-stone-100 pl-6">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                Featured Edits
              </span>
              <div className="flex flex-col gap-3">
                {promoCards.map((promo) => (
                  <div
                    key={promo.id}
                    onClick={() => handleSubItemClick(promo.linkUrl, promo.title)}
                    className="group relative overflow-hidden rounded-2xl border border-stone-200/80 bg-stone-50 hover:shadow-theme-md transition-all cursor-pointer"
                  >
                    <div className="aspect-[16/9] w-full overflow-hidden bg-stone-200">
                      <img
                        src={promo.imageUrl}
                        alt={promo.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3">
                      {promo.badge && (
                        <span className="text-[9px] font-black bg-[var(--brand-primary)] text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {promo.badge}
                        </span>
                      )}
                      <h4 className="font-serif font-bold text-xs text-stone-900 mt-1.5 group-hover:text-[var(--brand-primary)] transition-colors">
                        {promo.title}
                      </h4>
                      {promo.subtitle && (
                        <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                          {promo.subtitle}
                        </p>
                      )}
                      <div className="mt-2 flex items-center text-[11px] font-bold text-[var(--brand-primary)]">
                        <span>{promo.ctaText || 'Shop Now'}</span>
                        <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
