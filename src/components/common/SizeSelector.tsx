import React from 'react';
import { Ruler } from 'lucide-react';
import { SIZES } from '../../config/constants';
import { ProductVariant } from '../../types';
import { cn } from '../../utils/cn';

export interface SizeSelectorProps {
  sizes?: readonly string[] | string[];
  selectedSize?: string;
  onSelectSize: (size: string) => void;
  variants?: ProductVariant[];
  showSizeGuideButton?: boolean;
  onOpenSizeGuide?: () => void;
  className?: string;
  sizeVariant?: 'sm' | 'md' | 'lg';
}

export const SizeSelector: React.FC<SizeSelectorProps> = ({
  sizes = SIZES,
  selectedSize,
  onSelectSize,
  variants,
  showSizeGuideButton = false,
  onOpenSizeGuide,
  className,
  sizeVariant = 'md',
}) => {
  const getStockForSize = (size: string): number => {
    if (!variants || variants.length === 0) return 10;
    const variant = variants.find((v) => v.size === size);
    return variant ? variant.stock : 0;
  };

  const buttonSizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'min-w-[42px] h-10 px-3 text-xs sm:text-sm',
    lg: 'min-w-[48px] h-12 px-4 text-sm sm:text-base font-bold',
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
          Select Size: {selectedSize && <span className="text-[#7B2435] font-black">{selectedSize}</span>}
        </span>
        {showSizeGuideButton && (
          <button
            type="button"
            onClick={onOpenSizeGuide}
            className="text-xs font-semibold text-[#7B2435] hover:text-[#621C2A] flex items-center gap-1.5 underline decoration-dotted cursor-pointer"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Size Chart & Fit Guide</span>
          </button>
        )}
      </div>

      <div className="flex items-center flex-wrap gap-2">
        {sizes.map((size) => {
          const isSelected = selectedSize === size;
          const stock = getStockForSize(size);
          const isOutOfStock = stock <= 0;

          return (
            <button
              key={size}
              type="button"
              disabled={isOutOfStock}
              onClick={() => onSelectSize(size)}
              className={cn(
                'relative flex items-center justify-center rounded-xl font-bold transition-all border cursor-pointer',
                buttonSizes[sizeVariant],
                isSelected
                  ? 'bg-[#7B2435] text-white border-[#7B2435] shadow-xs'
                  : 'bg-white text-neutral-800 border-neutral-200 hover:border-[#7B2435] hover:text-[#7B2435]',
                isOutOfStock
                  ? 'opacity-40 cursor-not-allowed bg-neutral-100 text-neutral-400 line-through border-neutral-200 hover:border-neutral-200 hover:text-neutral-400'
                  : ''
              )}
            >
              {size}
              {stock > 0 && stock <= 3 && !isSelected && (
                <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
