import React from 'react';
import { ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import { Category, SubCategory } from '../../types';

interface MegaMenuProps {
  category: Category;
  onSelectCategory: (catSlug: string, subcat?: string, subSubCat?: string) => void;
  onSelectFilter: (type: 'size' | 'fabric' | 'occasion', value: string) => void;
  onClose: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({
  category,
  onSelectCategory,
  onSelectFilter,
  onClose,
}) => {
  const sizes = ['M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  const hasSubMenus = category.subMenus && category.subMenus.length > 0;

  return (
    <div
      className="absolute top-full left-0 w-full bg-white shadow-2xl border-t border-[#F0E6E1] py-7 px-8 z-40 animate-fade-in"
      onMouseLeave={onClose}
    >
      <div className="max-w-7xl mx-auto">
        {hasSubMenus ? (
          <div className="grid grid-cols-12 gap-6">
            {/* Multi-Level Hierarchical Columns (e.g. Nykaa Fashion style) */}
            <div className="col-span-9 grid grid-cols-3 sm:grid-cols-4 gap-6 pr-6 border-r border-[#F5ECE8]">
              {category.subMenus?.map((subMenu: SubCategory) => (
                <div key={subMenu.id} className="space-y-3">
                  <div className="pb-2 border-b border-[#F5ECE8]">
                    <button
                      onClick={() => {
                        onSelectCategory(category.slug, subMenu.name);
                        onClose();
                      }}
                      className="text-xs font-bold text-[#7B2435] uppercase tracking-wider hover:underline text-left flex items-center justify-between w-full group"
                    >
                      <span>{subMenu.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#7B2435]" />
                    </button>
                  </div>

                  <ul className="space-y-2">
                    {subMenu.subcategories && subMenu.subcategories.length > 0 ? (
                      subMenu.subcategories.map((subSub) => (
                        <li key={subSub.id}>
                          <button
                            onClick={() => {
                              onSelectCategory(category.slug, subMenu.name, subSub.name);
                              onClose();
                            }}
                            className="text-[13px] text-neutral-600 hover:text-[#7B2435] hover:translate-x-1 transition-all text-left block w-full leading-snug"
                          >
                            {subSub.name}
                          </button>
                        </li>
                      ))
                    ) : (
                      <li>
                        <button
                          onClick={() => {
                            onSelectCategory(category.slug, subMenu.name);
                            onClose();
                          }}
                          className="text-[13px] text-neutral-600 hover:text-[#7B2435] text-left block w-full"
                        >
                          Explore {subMenu.name}
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              ))}

              {/* Quick Size Quick-Filter in 4th Column if space */}
              <div className="space-y-3 bg-[#FAF6F4] p-3.5 rounded-xl border border-[#F0E6E1]">
                <div className="text-xs font-bold text-[#7B2435] uppercase tracking-wider pb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Size Selector</span>
                </div>
                <p className="text-[11px] text-neutral-500">Fast filter by size:</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        onSelectFilter('size', s);
                        onClose();
                      }}
                      className="py-1 text-[11px] font-semibold rounded-md border border-neutral-300 bg-white hover:border-[#7B2435] hover:bg-[#FFF6F7] hover:text-[#7B2435] transition text-center"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Merchandising Banner */}
            <div className="col-span-3">
              <div className="relative rounded-2xl overflow-hidden shadow-md group cursor-pointer h-full min-h-[240px]">
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-5 text-white">
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-[#7B2435] px-2 py-0.5 rounded w-fit mb-2">
                    Exclusive
                  </span>
                  <h5 className="font-serif text-lg font-bold">{category.name} Collection</h5>
                  <p className="text-xs text-rose-100/90 mb-3 line-clamp-2">{category.description}</p>
                  <button
                    onClick={() => {
                      onSelectCategory(category.slug);
                      onClose();
                    }}
                    className="text-xs font-semibold underline underline-offset-4 flex items-center gap-1 text-white hover:text-rose-200"
                  >
                    Shop All {category.name} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-8">
            {/* Fallback Flat Subcategory layout */}
            <div className="col-span-4 border-r border-[#F5ECE8] pr-6">
              <h4 className="text-xs font-bold text-[#7B2435] uppercase tracking-wider mb-4 pb-2 border-b border-[#F5ECE8] flex items-center justify-between">
                <span>{category.name} Categories</span>
                <span className="text-[10px] text-neutral-400">All Items</span>
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <button
                    onClick={() => {
                      onSelectCategory(category.slug);
                      onClose();
                    }}
                    className="text-sm font-semibold text-neutral-900 hover:text-[#7B2435] flex items-center justify-between w-full group transition"
                  >
                    <span>All {category.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#7B2435]" />
                  </button>
                </li>
                {category.subcategories.map((sub, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => {
                        onSelectCategory(category.slug, sub);
                        onClose();
                      }}
                      className="text-sm text-neutral-600 hover:text-[#7B2435] hover:translate-x-1 transition-transform w-full text-left"
                    >
                      {sub}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-4 border-r border-[#F5ECE8] pr-6">
              <h4 className="text-xs font-bold text-[#7B2435] uppercase tracking-wider mb-4 pb-2 border-b border-[#F5ECE8]">
                Shop By Size
              </h4>
              <p className="text-xs text-neutral-500 mb-3">Inclusive sizing from XS to 5XL:</p>
              <div className="grid grid-cols-4 gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      onSelectFilter('size', s);
                      onClose();
                    }}
                    className="py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 hover:border-[#7B2435] hover:bg-[#FFF6F7] hover:text-[#7B2435] transition text-center"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-4">
              <div className="relative rounded-2xl overflow-hidden shadow-md group cursor-pointer h-full min-h-[220px]">
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                  <h5 className="font-serif text-lg font-bold">{category.name} Edit</h5>
                  <p className="text-xs text-rose-100/90 mb-3">{category.description}</p>
                  <button
                    onClick={() => {
                      onSelectCategory(category.slug);
                      onClose();
                    }}
                    className="text-xs font-semibold underline underline-offset-4 flex items-center gap-1 text-white hover:text-rose-200"
                  >
                    View Collection <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
