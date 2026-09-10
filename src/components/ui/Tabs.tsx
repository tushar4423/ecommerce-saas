import React from 'react';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pills' | 'underline' | 'cards';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
}) => {
  return (
    <div className={cn('flex items-center overflow-x-auto no-scrollbar', className)}>
      <div
        className={cn(
          'flex items-center gap-1.5',
          variant === 'underline' ? 'border-b border-neutral-200 w-full' : '',
          variant === 'pills' ? 'bg-[#F5EFE6] p-1 rounded-xl' : '',
          variant === 'cards' ? 'gap-2' : ''
        )}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          if (variant === 'pills') {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'bg-[#7B2435] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
                )}
              >
                {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
                <span>{tab.label}</span>
                {(tab.badge !== undefined || tab.count !== undefined) && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                      isActive ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
                    )}
                  >
                    {tab.badge ?? tab.count}
                  </span>
                )}
              </button>
            );
          }

          if (variant === 'cards') {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold transition-all whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'bg-[#FFF0F3] border-[#7B2435] text-[#7B2435] shadow-xs'
                    : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300'
                )}
              >
                {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
                <span>{tab.label}</span>
                {(tab.badge !== undefined || tab.count !== undefined) && (
                  <span
                    className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full font-bold',
                      isActive ? 'bg-[#7B2435] text-white' : 'bg-neutral-100 text-neutral-600'
                    )}
                  >
                    {tab.badge ?? tab.count}
                  </span>
                )}
              </button>
            );
          }

          // Underline default
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border-b-2 -mb-[2px] cursor-pointer',
                isActive
                  ? 'border-[#7B2435] text-[#7B2435]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              )}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              <span>{tab.label}</span>
              {(tab.badge !== undefined || tab.count !== undefined) && (
                <span
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full font-bold',
                    isActive ? 'bg-[#FFF0F3] text-[#7B2435]' : 'bg-neutral-100 text-neutral-600'
                  )}
                >
                  {tab.badge ?? tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
