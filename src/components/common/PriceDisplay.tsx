import React from 'react';
import { formatCurrency, calculateDiscount } from '../../utils/formatters';
import { cn } from '../../utils/cn';

export interface PriceDisplayProps {
  sellingPrice: number | string;
  mrp?: number | string;
  discountPercent?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSavings?: boolean;
  showDiscountBadge?: boolean;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  sellingPrice,
  mrp,
  discountPercent: directDiscount,
  size = 'md',
  showSavings = false,
  showDiscountBadge = true,
  className,
}) => {
  const numSelling = typeof sellingPrice === 'string' ? parseFloat(sellingPrice) : Number(sellingPrice);
  const numMrp = mrp ? (typeof mrp === 'string' ? parseFloat(mrp) : Number(mrp)) : undefined;

  const discount = directDiscount ?? (numMrp ? calculateDiscount(numMrp, numSelling) : 0);
  const savings = numMrp && numMrp > numSelling ? numMrp - numSelling : 0;

  const sizeMap = {
    sm: {
      price: 'text-sm font-bold text-neutral-900',
      mrp: 'text-xs text-neutral-400 line-through',
      badge: 'text-[10px] px-1.5 py-0.5 font-bold',
    },
    md: {
      price: 'text-base sm:text-lg font-bold text-neutral-900',
      mrp: 'text-xs sm:text-sm text-neutral-400 line-through',
      badge: 'text-[11px] px-2 py-0.5 font-bold',
    },
    lg: {
      price: 'text-xl sm:text-2xl font-bold text-neutral-900',
      mrp: 'text-sm sm:text-base text-neutral-400 line-through',
      badge: 'text-xs px-2.5 py-1 font-bold',
    },
    xl: {
      price: 'text-2xl sm:text-3xl font-bold text-neutral-900',
      mrp: 'text-base sm:text-lg text-neutral-400 line-through',
      badge: 'text-xs sm:text-sm px-3 py-1 font-bold',
    },
  };

  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <div className="flex items-baseline flex-wrap gap-2">
        <span className={sizeMap[size].price}>{formatCurrency(numSelling)}</span>
        {numMrp && numMrp > numSelling && (
          <span className={sizeMap[size].mrp}>{formatCurrency(numMrp)}</span>
        )}
        {showDiscountBadge && discount > 0 && (
          <span className={cn('rounded-full bg-[#FFF0F3] text-[#7B2435] border border-[#EADBDA]/80', sizeMap[size].badge)}>
            {discount}% OFF
          </span>
        )}
      </div>
      {showSavings && savings > 0 && (
        <p className="text-xs font-semibold text-emerald-700">
          You Save {formatCurrency(savings)} (Incl. of all taxes)
        </p>
      )}
    </div>
  );
};
