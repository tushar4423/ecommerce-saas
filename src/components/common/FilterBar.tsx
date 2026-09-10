import React from 'react';
import { SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import { SearchInput } from '../ui/SearchInput';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export interface FilterTag {
  id: string;
  label: string;
  onRemove: () => void;
}

export interface FilterBarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  sortBy?: string;
  onSortChange?: (val: string) => void;
  sortOptions?: { value: string; label: string }[];
  activeTags?: FilterTag[];
  onClearAllTags?: () => void;
  onOpenFilterDrawer?: () => void;
  filterDrawerCount?: number;
  totalResults?: number;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  sortBy = 'recommended',
  onSortChange,
  sortOptions = [
    { value: 'recommended', label: 'Recommended / Popular' },
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Customer Rating' },
    { value: 'discount', label: 'Biggest Discount' },
  ],
  activeTags = [],
  onClearAllTags,
  onOpenFilterDrawer,
  filterDrawerCount = 0,
  totalResults,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-3 w-full', className)}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-neutral-100 shadow-xs">
        {/* Search Bar */}
        <div className="w-full sm:max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search kurtis, kurta sets, fabric, work..."
            enableRecommendations={false}
          />
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          {onOpenFilterDrawer && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenFilterDrawer}
              leftIcon={<SlidersHorizontal className="w-4 h-4" />}
            >
              <span>Filters</span>
              {filterDrawerCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#7B2435] text-white text-[10px] font-bold">
                  {filterDrawerCount}
                </span>
              )}
            </Button>
          )}

          {onSortChange && (
            <div className="w-44 sm:w-52">
              <Select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                options={sortOptions}
                className="py-2 text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Tags */}
      {activeTags.length > 0 && (
        <div className="flex items-center flex-wrap gap-2 pt-1">
          <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Active Filters ({activeTags.length}):
          </span>
          {activeTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF0F3] text-[#7B2435] border border-[#EADBDA] text-xs font-semibold"
            >
              <span>{tag.label}</span>
              <button
                type="button"
                onClick={tag.onRemove}
                className="p-0.5 rounded-full hover:bg-rose-200/60 text-[#7B2435] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {onClearAllTags && (
            <button
              type="button"
              onClick={onClearAllTags}
              className="text-xs text-rose-600 font-bold hover:underline ml-2 cursor-pointer"
            >
              Clear All
            </button>
          )}
          {totalResults !== undefined && (
            <span className="ml-auto text-xs text-neutral-400 font-medium">
              Showing {totalResults} {totalResults === 1 ? 'outfit' : 'outfits'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
