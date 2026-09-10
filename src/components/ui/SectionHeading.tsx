import React from 'react';
import { cn } from '../../utils/cn';

export interface SectionHeadingProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  serif?: boolean;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  badge,
  action,
  align = 'center',
  className,
  serif = true,
}) => {
  const alignClass = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }[align];

  return (
    <div className={cn('flex flex-col mb-8 sm:mb-12', alignClass, className)}>
      {badge && <div className="mb-2">{badge}</div>}
      <div className={cn('flex flex-wrap items-baseline gap-4', align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-between w-full')}>
        <h2
          className={cn(
            'text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-stone-900',
            serif ? 'font-display' : ''
          )}
        >
          {title}
        </h2>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {subtitle && (
        <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-2xl font-normal leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
};
