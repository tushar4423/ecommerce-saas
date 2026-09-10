import React, { useState } from 'react';
import { X, RotateCcw, ChevronDown, Sparkles } from 'lucide-react';
import { FilterState } from '../../types';

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  onCloseMobile?: () => void;
  isMobile?: boolean;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  onFilterChange,
  onReset,
  onCloseMobile,
  isMobile = false,
}) => {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  const fabrics = ['Pure Cotton', 'Chanderi', 'Mulmul Silk', 'Rayon Slub', 'Pure Linen', 'Kota Doria', 'Georgette', 'Muslin'];
  const works = ['Neck Embroidery', 'Lucknowi Chikankari', 'Hand Block Print', 'Gotta Patti', 'Zari & Sequin Work', 'Solid Weave'];
  const occasions = ['Daily & Work Wear', 'Festive & Puja', 'Wedding Guest', 'Cocktail & Party', 'Casual Outing'];

  // Collapsible section state for compact layout
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    size: true,
    price: true,
    discount: true,
    fabric: true,
    work: true,
    occasion: false,
    rating: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const colors = [
    { name: 'Dusty Rose', hex: '#C98C97' },
    { name: 'Sage Green', hex: '#87A991' },
    { name: 'Mustard Gold', hex: '#E3A857' },
    { name: 'Deep Wine', hex: '#7B2435' },
    { name: 'Royal Indigo', hex: '#2E4057' },
    { name: 'Ivory Cream', hex: '#F5ECE8' },
    { name: 'Teal Blue', hex: '#005F73' },
    { name: 'Coral Peach', hex: '#F78888' },
  ];

  const toggleArrayItem = (key: 'sizes' | 'colors' | 'fabrics' | 'works' | 'occasions', item: string) => {
    const list = filters[key] || [];
    const updated = list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
    onFilterChange({ ...filters, [key]: updated });
  };

  const hasActiveFilters =
    (filters.sizes || []).length > 0 ||
    (filters.colors || []).length > 0 ||
    (filters.fabrics || []).length > 0 ||
    (filters.works || []).length > 0 ||
    (filters.occasions || []).length > 0 ||
    (filters.minPrice || 0) > 499 ||
    (filters.maxPrice || 5000) < 5000 ||
    (filters.discountMin || 0) > 0 ||
    (filters.ratingMin || 0) > 0 ||
    !!filters.inStockOnly;

  return (
    <div className={`bg-white ${isMobile ? 'p-5 h-full overflow-y-auto' : 'p-5 rounded-2xl border border-[#F0E6E1] shadow-xs'}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#F0E6E1] mb-4 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-base font-bold text-neutral-900">Filter By</h3>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-[#7B2435]"></span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-xs font-bold text-[#7B2435] hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Clear All
            </button>
          )}
          {isMobile && onCloseMobile && (
            <button 
              onClick={onCloseMobile} 
              className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 transition"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4 divide-y divide-neutral-100">
        {/* In Stock Toggle */}
        <div className="flex items-center justify-between pb-3">
          <div>
            <span className="text-xs font-bold text-neutral-800 block">Express Delivery</span>
            <span className="text-[10px] text-neutral-500">Ready to dispatch</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={!!filters.inStockOnly}
              onChange={(e) => onFilterChange({ ...filters, inStockOnly: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7B2435]"></div>
          </label>
        </div>

        {/* Size Filter */}
        <div className="pt-3">
          <button 
            type="button"
            onClick={() => toggleSection('size')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2.5"
          >
            <span className="flex items-center gap-1.5">
              <span>Size & Curve Fit</span>
              {(filters.sizes || []).length > 0 && (
                <span className="px-1.5 py-0.2 bg-[#7B2435] text-white text-[10px] font-bold rounded-full">
                  {filters.sizes.length}
                </span>
              )}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${expandedSections.size ? 'rotate-180' : ''}`} />
          </button>

          {expandedSections.size && (
            <div className="grid grid-cols-4 gap-1.5 animate-fade-in">
              {sizes.map((s) => {
                const isSelected = (filters.sizes || []).includes(s);
                const isCurve = ['2XL', '3XL', '4XL', '5XL'].includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleArrayItem('sizes', s)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition relative ${
                      isSelected
                        ? 'bg-[#7B2435] text-white border-[#7B2435] shadow-xs'
                        : isCurve 
                        ? 'border-rose-200 bg-[#FFF8F8] hover:border-[#7B2435] text-neutral-800'
                        : 'border-neutral-200 hover:border-[#7B2435] bg-white text-neutral-700'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Color Palette */}
        <div className="pt-3">
          <button
            type="button"
            onClick={() => toggleSection('color')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2.5"
          >
            <span className="flex items-center gap-1.5">
              <span>Color Palette</span>
              {(filters.colors || []).length > 0 && (
                <span className="px-1.5 py-0.2 bg-[#7B2435] text-white text-[10px] font-bold rounded-full">
                  {filters.colors.length}
                </span>
              )}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${expandedSections.color !== false ? 'rotate-180' : ''}`} />
          </button>

          {expandedSections.color !== false && (
            <div className="grid grid-cols-4 gap-1.5 animate-fade-in">
              {colors.map((c) => {
                const isSelected = (filters.colors || []).includes(c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => toggleArrayItem('colors', c.name)}
                    title={c.name}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border text-center transition ${
                      isSelected ? 'border-[#7B2435] bg-[#FFF2F4]' : 'border-neutral-100 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-[10px] text-neutral-700 truncate w-full font-medium">
                      {c.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Price Range */}
        <div className="pt-3">
          <button
            type="button"
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2"
          >
            <span>Price Range</span>
            <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${expandedSections.price ? 'rotate-180' : ''}`} />
          </button>

          {expandedSections.price && (
            <div className="space-y-2 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#7B2435]">
                  ₹{filters.minPrice || 499} - ₹{filters.maxPrice || 5000}
                </span>
              </div>
              <input
                type="range"
                min="499"
                max="5000"
                step="100"
                value={filters.maxPrice || 5000}
                onChange={(e) => onFilterChange({ ...filters, maxPrice: Number(e.target.value) })}
                className="w-full accent-[#7B2435] cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                <span>₹499</span>
                <span>₹5,000+</span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: 'Under ₹999', max: 999 },
                  { label: 'Under ₹1,999', max: 1999 },
                  { label: 'Under ₹2,999', max: 2999 },
                ].map((bracket) => (
                  <button
                    key={bracket.label}
                    type="button"
                    onClick={() => onFilterChange({ ...filters, maxPrice: bracket.max })}
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition ${
                      filters.maxPrice === bracket.max
                        ? 'bg-[#7B2435] text-white border-[#7B2435]'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    {bracket.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Discount (Nykaa Fashion Style) */}
        <div className="pt-3">
          <button
            type="button"
            onClick={() => toggleSection('discount')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2.5"
          >
            <span className="flex items-center gap-1.5">
              <span>Discount & Offers</span>
              {(filters.discountMin || 0) > 0 && (
                <span className="px-1.5 py-0.2 bg-[#7B2435] text-white text-[10px] font-bold rounded-full">
                  {filters.discountMin}%+
                </span>
              )}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${expandedSections.discount ? 'rotate-180' : ''}`} />
          </button>

          {expandedSections.discount && (
            <div className="space-y-1.5 animate-fade-in">
              {[
                { label: 'All Discounts', min: 0 },
                { label: '20% and above', min: 20 },
                { label: '30% and above', min: 30 },
                { label: '40% and above', min: 40 },
                { label: '50% and above', min: 50 },
              ].map((disc) => {
                const isSelected = (filters.discountMin || 0) === disc.min;
                return (
                  <label
                    key={disc.label}
                    className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer hover:text-[#7B2435] py-0.5"
                  >
                    <input
                      type="radio"
                      name="discountFilter"
                      checked={isSelected}
                      onChange={() => onFilterChange({ ...filters, discountMin: disc.min })}
                      className="text-[#7B2435] focus:ring-[#7B2435] accent-[#7B2435]"
                    />
                    <span className={`transition text-xs ${isSelected ? 'font-bold text-[#7B2435]' : ''}`}>
                      {disc.label}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Fabric */}
        <div className="pt-3">
          <button
            type="button"
            onClick={() => toggleSection('fabric')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2.5"
          >
            <span className="flex items-center gap-1.5">
              <span>Fabric Type</span>
              {(filters.fabrics || []).length > 0 && (
                <span className="px-1.5 py-0.2 bg-[#7B2435] text-white text-[10px] font-bold rounded-full">
                  {filters.fabrics.length}
                </span>
              )}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${expandedSections.fabric ? 'rotate-180' : ''}`} />
          </button>

          {expandedSections.fabric && (
            <div className="space-y-1.5 animate-fade-in">
              {fabrics.map((fab) => (
                <label key={fab} className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer hover:text-[#7B2435] py-0.5">
                  <input
                    type="checkbox"
                    checked={(filters.fabrics || []).includes(fab)}
                    onChange={() => toggleArrayItem('fabrics', fab)}
                    className="rounded border-neutral-300 text-[#7B2435] focus:ring-[#7B2435] accent-[#7B2435]"
                  />
                  <span className="text-xs">{fab}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Craft & Work */}
        <div className="pt-3">
          <button
            type="button"
            onClick={() => toggleSection('work')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2.5"
          >
            <span className="flex items-center gap-1.5">
              <span>Artisanal Work</span>
              {(filters.works || []).length > 0 && (
                <span className="px-1.5 py-0.2 bg-[#7B2435] text-white text-[10px] font-bold rounded-full">
                  {filters.works.length}
                </span>
              )}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${expandedSections.work ? 'rotate-180' : ''}`} />
          </button>

          {expandedSections.work && (
            <div className="space-y-1.5 animate-fade-in">
              {works.map((w) => (
                <label key={w} className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer hover:text-[#7B2435] py-0.5">
                  <input
                    type="checkbox"
                    checked={(filters.works || []).includes(w)}
                    onChange={() => toggleArrayItem('works', w)}
                    className="rounded border-neutral-300 text-[#7B2435] focus:ring-[#7B2435] accent-[#7B2435]"
                  />
                  <span className="text-xs">{w}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Customer Rating */}
        <div className="pt-3">
          <button
            type="button"
            onClick={() => toggleSection('rating')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2.5"
          >
            <span>Customer Rating</span>
            <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${expandedSections.rating ? 'rotate-180' : ''}`} />
          </button>

          {expandedSections.rating && (
            <div className="space-y-1.5 animate-fade-in">
              {[
                { label: '4.5★ & above', min: 4.5 },
                { label: '4.0★ & above', min: 4.0 },
                { label: '3.5★ & above', min: 3.5 },
              ].map((r) => {
                const isSelected = filters.ratingMin === r.min;
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => onFilterChange({ ...filters, ratingMin: isSelected ? undefined : r.min })}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between border transition ${
                      isSelected ? 'bg-[#FFF2F4] border-[#7B2435] font-bold text-[#7B2435]' : 'border-neutral-100 hover:border-neutral-300 text-neutral-700 bg-white'
                    }`}
                  >
                    <span>{r.label}</span>
                    {isSelected && <span className="text-[10px] text-[#7B2435] font-bold">Active</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Occasion */}
        <div className="pt-3">
          <button
            type="button"
            onClick={() => toggleSection('occasion')}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-800 mb-2.5"
          >
            <span className="flex items-center gap-1.5">
              <span>Occasion</span>
              {(filters.occasions || []).length > 0 && (
                <span className="px-1.5 py-0.2 bg-[#7B2435] text-white text-[10px] font-bold rounded-full">
                  {filters.occasions.length}
                </span>
              )}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${expandedSections.occasion ? 'rotate-180' : ''}`} />
          </button>

          {expandedSections.occasion && (
            <div className="space-y-1.5 animate-fade-in">
              {occasions.map((occ) => (
                <label key={occ} className="flex items-center gap-2 text-xs text-neutral-700 cursor-pointer hover:text-[#7B2435] py-0.5">
                  <input
                    type="checkbox"
                    checked={(filters.occasions || []).includes(occ)}
                    onChange={() => toggleArrayItem('occasions', occ)}
                    className="rounded border-neutral-300 text-[#7B2435] focus:ring-[#7B2435] accent-[#7B2435]"
                  />
                  <span className="text-xs">{occ}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

