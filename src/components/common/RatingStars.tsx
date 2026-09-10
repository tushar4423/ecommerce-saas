import React from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxStars = 5,
  size = 'md',
  showCount = false,
  count,
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center text-amber-500">
        {Array.from({ length: maxStars }).map((_, idx) => {
          const fillLevel = Math.max(0, Math.min(1, rating - idx));
          return (
            <Star
              key={idx}
              className={`${sizeClasses[size]} ${
                fillLevel >= 0.8
                  ? 'fill-amber-400 text-amber-400'
                  : fillLevel >= 0.3
                  ? 'fill-amber-400/50 text-amber-400'
                  : 'text-neutral-300'
              }`}
            />
          );
        })}
      </div>
      <span className="text-xs font-semibold text-neutral-800 ml-1">
        {rating.toFixed(1)}
      </span>
      {showCount && count !== undefined && (
        <span className="text-xs text-neutral-500">
          ({count})
        </span>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}> = ({ title, description, icon, actionText, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-[#F0E6E1] max-w-lg mx-auto my-8">
      {icon && <div className="p-4 bg-[#FFF6F4] rounded-full mb-4 text-[#7B2435]">{icon}</div>}
      <h3 className="text-xl font-serif font-bold text-neutral-900 mb-2">{title}</h3>
      <p className="text-sm text-neutral-600 mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-[#7B2435] hover:bg-[#621c2a] text-white text-sm font-medium rounded-full transition shadow-md hover:shadow-lg"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
