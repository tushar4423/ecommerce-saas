import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'light' | 'gold';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-xl active:scale-[0.98] cursor-pointer';

    const sizeStyles = {
      xs: 'text-xs px-2.5 py-1 gap-1',
      sm: 'text-xs px-3.5 py-1.5 gap-1.5 font-semibold',
      md: 'text-sm px-4 py-2.5 gap-2 font-semibold',
      lg: 'text-base px-6 py-3.5 gap-2.5 font-bold',
      xl: 'text-lg px-8 py-4 gap-3 font-bold',
    };

    const variantStyles = {
      primary: 'bg-brand-primary text-white hover:opacity-95 focus:ring-[var(--brand-primary)] shadow-xs hover:shadow-md',
      secondary: 'bg-[var(--brand-secondary)] text-white hover:opacity-95 focus:ring-[var(--brand-secondary)]',
      outline: 'border border-brand-primary text-brand-primary bg-transparent hover:bg-brand-light focus:ring-[var(--brand-primary)]',
      ghost: 'text-stone-700 hover:text-brand-primary hover:bg-brand-light focus:ring-stone-300',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
      light: 'bg-brand-light text-brand-primary hover:opacity-90 border border-brand-primary/20',
      gold: 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          fullWidth ? 'w-full' : '',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-current" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span className="whitespace-nowrap">{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
