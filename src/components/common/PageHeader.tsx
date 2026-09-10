import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-3 mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-500 overflow-x-auto no-scrollbar py-0.5">
          {breadcrumbs.map((crumb, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === breadcrumbs.length - 1;
            const isHome = isFirst && (crumb.label.toLowerCase() === 'home');

            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />}
                {crumb.onClick && !isLast ? (
                  <button
                    type="button"
                    onClick={crumb.onClick}
                    className="flex items-center gap-1 hover:text-[#7B2435] transition-colors cursor-pointer truncate max-w-[200px]"
                  >
                    {isHome && <Home className="w-3.5 h-3.5 shrink-0" />}
                    <span>{crumb.label}</span>
                  </button>
                ) : (
                  <span
                    className={cn(
                      'flex items-center gap-1 truncate max-w-[240px]',
                      isLast ? 'font-bold text-neutral-800' : 'text-neutral-500'
                    )}
                  >
                    {isHome && <Home className="w-3.5 h-3.5 shrink-0" />}
                    <span>{crumb.label}</span>
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {typeof title === 'string' ? (
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
              {title}
            </h1>
          ) : (
            title
          )}
          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
};
