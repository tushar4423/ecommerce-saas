import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'gold' | 'emerald' | 'rose' | 'amber' | 'neutral' | 'outline';
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'primary',
  size = 'sm',
  dot = false,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 font-medium rounded-full tracking-wide transition-colors whitespace-nowrap';

  const sizeStyles = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  const variantStyles = {
    primary: 'bg-brand-light text-brand-primary border border-brand-primary/20',
    secondary: 'bg-[var(--brand-secondary)]/15 text-[var(--brand-secondary)] border border-[var(--brand-secondary)]/30',
    gold: 'bg-amber-50 text-amber-800 border border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    rose: 'bg-rose-50 text-rose-800 border border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-300',
    neutral: 'bg-stone-100 text-stone-700 border border-stone-200',
    outline: 'border border-stone-300 text-stone-700 bg-transparent',
  };

  const dotColor = {
    primary: 'bg-brand-primary',
    secondary: 'bg-[var(--brand-secondary)]',
    gold: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    neutral: 'bg-stone-400',
    outline: 'bg-stone-500',
  };

  return (
    <span
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 animate-pulse', dotColor[variant])} />
      )}
      {children}
    </span>
  );
};
