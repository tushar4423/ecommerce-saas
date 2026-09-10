import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ColorOption {
  name: string;
  hex: string;
}

export interface ColorSelectorProps {
  colors: ColorOption[];
  selectedColor?: string;
  onSelectColor: (colorName: string) => void;
  className?: string;
}

export const ColorSelector: React.FC<ColorSelectorProps> = ({
  colors,
  selectedColor,
  onSelectColor,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
        Shade: {selectedColor && <span className="text-[#7B2435] font-black">{selectedColor}</span>}
      </span>
      <div className="flex items-center flex-wrap gap-2.5">
        {colors.map((c) => {
          const isSelected = selectedColor === c.name;
          return (
            <button
              key={c.name}
              type="button"
              title={c.name}
              onClick={() => onSelectColor(c.name)}
              className={cn(
                'relative w-8 h-8 rounded-full flex items-center justify-center transition-all p-0.5 border-2 cursor-pointer',
                isSelected ? 'border-[#7B2435] scale-110 shadow-xs' : 'border-transparent hover:scale-105'
              )}
            >
              <span
                className="w-full h-full rounded-full border border-black/10 flex items-center justify-center"
                style={{ backgroundColor: c.hex }}
              >
                {isSelected && (
                  <Check
                    className={cn(
                      'w-3.5 h-3.5',
                      ['#FFFFFF', '#FAF6F0', '#FFF0F3', '#FFF'].includes(c.hex.toUpperCase())
                        ? 'text-neutral-900'
                        : 'text-white'
                    )}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
