import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Skeleton } from './Skeleton';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  aspectRatio?: '3/4' | '1/1' | '16/9' | '4/3' | 'auto';
  fallbackSrc?: string;
  containerClassName?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  aspectRatio = '3/4',
  fallbackSrc = 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80',
  className,
  containerClassName,
  loading = 'lazy',
  decoding = 'async',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const aspectStyles = {
    '3/4': 'aspect-[3/4]',
    '1/1': 'aspect-square',
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    'auto': '',
  };

  const imageSrc = hasError ? fallbackSrc : src;

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-neutral-100',
        aspectStyles[aspectRatio],
        containerClassName
      )}
    >
      {/* Loading Skeleton Placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
      )}

      {/* Image Element with Progressive Fade In */}
      <img
        src={imageSrc}
        alt={alt}
        loading={loading}
        decoding={decoding}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />
    </div>
  );
};
