import React from 'react';
import { cn } from '../../utils/cn';

export interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'payment' | 'stock' | 'coupon';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'order',
  className,
}) => {
  const getStatusStyles = () => {
    const s = status.toLowerCase();

    // Success states
    if (['delivered', 'paid', 'active', 'in stock', 'completed', 'approved'].includes(s)) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    // Pending / Processing / Shipped states
    if (['pending', 'processing', 'confirmed', 'packed'].includes(s)) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }

    if (['shipped', 'out for delivery', 'transit'].includes(s)) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }

    // Warning / Danger states
    if (['cancelled', 'failed', 'out of stock', 'expired', 'inactive', 'rejected'].includes(s)) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    if (['returned', 'refunded'].includes(s)) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }

    if (['low stock'].includes(s)) {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }

    return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border whitespace-nowrap',
        getStatusStyles(),
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      <span>{status}</span>
    </span>
  );
};
