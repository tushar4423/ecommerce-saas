import React from 'react';
import { cn } from '../../utils/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded' | 'text';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rounded',
  width,
  height,
  style,
  ...props
}) => {
  const variantStyles = {
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md h-4 my-1 w-full',
  };

  const inlineStyles: React.CSSProperties = {
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    ...style,
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]',
        variantStyles[variant],
        className
      )}
      style={inlineStyles}
      {...props}
    />
  );
};

export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-3 border border-neutral-100 flex flex-col gap-3 shadow-xs">
    <Skeleton className="w-full aspect-[3/4] rounded-xl" />
    <div className="space-y-1.5 px-1">
      <Skeleton className="w-20 h-3" />
      <Skeleton className="w-full h-4" />
      <Skeleton className="w-3/4 h-4" />
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-50">
        <Skeleton className="w-24 h-5" />
        <Skeleton className="w-14 h-4" />
      </div>
    </div>
  </div>
);

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
    {Array.from({ length: count }).map((_, idx) => (
      <ProductCardSkeleton key={idx} />
    ))}
  </div>
);

export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
  <tr className="border-b border-neutral-100">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="py-4 px-4">
        <Skeleton className="h-4 w-full max-w-[120px]" />
      </td>
    ))}
  </tr>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => (
  <div className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-4 shadow-xs">
    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
      <Skeleton className="w-48 h-8 rounded-xl" />
      <Skeleton className="w-24 h-8 rounded-xl" />
    </div>
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2 border-b border-neutral-50">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const PageSkeleton: React.FC<{ title?: boolean }> = ({ title = true }) => (
  <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
    {title && (
      <div className="space-y-2">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-64 h-8" />
        <Skeleton className="w-96 h-4" />
      </div>
    )}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton className="h-40 rounded-2xl md:col-span-1" />
      <Skeleton className="h-40 rounded-2xl md:col-span-2" />
    </div>
    <ProductGridSkeleton count={4} />
  </div>
);

export const CartItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-neutral-100">
    <Skeleton className="w-20 h-24 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="w-3/4 h-4" />
      <Skeleton className="w-1/2 h-3" />
      <Skeleton className="w-24 h-4" />
    </div>
  </div>
);

export const ReviewCardSkeleton: React.FC = () => (
  <div className="p-4 bg-white rounded-xl border border-neutral-100 space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Skeleton variant="circular" className="w-8 h-8" />
        <div className="space-y-1">
          <Skeleton className="w-24 h-3" />
          <Skeleton className="w-16 h-2.5" />
        </div>
      </div>
      <Skeleton className="w-20 h-4" />
    </div>
    <Skeleton className="w-full h-4" />
    <Skeleton className="w-5/6 h-4" />
  </div>
);

export const AdminStatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="bg-white p-4 rounded-2xl border border-neutral-200 space-y-2 shadow-xs">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-28 h-6" />
        <Skeleton className="w-16 h-3" />
      </div>
    ))}
  </div>
);
