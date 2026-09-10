import React from 'react';
import { 
  ShoppingBag, 
  Heart, 
  Search, 
  Package, 
  Star, 
  Inbox, 
  PackageOpen
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

export type EmptyStatePreset = 
  | 'cart' 
  | 'wishlist' 
  | 'search' 
  | 'orders' 
  | 'reviews' 
  | 'admin-table' 
  | 'custom';

export interface EmptyStateProps {
  preset?: EmptyStatePreset;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  primaryActionText?: string;
  onPrimaryAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  preset = 'custom',
  icon,
  title,
  description,
  actionText,
  onAction,
  primaryActionText,
  onPrimaryAction,
  secondaryActionText,
  onSecondaryAction,
  className,
  children,
}) => {
  // Preset defaults
  let defaultIcon: React.ReactNode = <PackageOpen className="w-8 h-8 stroke-[1.5]" />;
  let defaultTitle = 'No Items Found';
  let defaultDescription = 'There are no records to display at this time.';
  let defaultActionText: string | undefined = undefined;

  switch (preset) {
    case 'cart':
      defaultIcon = <ShoppingBag className="w-8 h-8 text-[#7B2435]" />;
      defaultTitle = 'Your Shopping Bag is Empty';
      defaultDescription = 'Explore our festive chanderi kurtas, anarkali sets, and handcrafted ensembles to begin.';
      defaultActionText = 'Explore Ethnic Edit';
      break;

    case 'wishlist':
      defaultIcon = <Heart className="w-8 h-8 text-[#7B2435]" />;
      defaultTitle = 'Your Wishlist is Empty';
      defaultDescription = 'Save pieces you adore while browsing to revisit and purchase them later.';
      defaultActionText = 'Discover New Arrivals';
      break;

    case 'search':
      defaultIcon = <Search className="w-8 h-8 text-[#7B2435]" />;
      defaultTitle = 'No Matching Kurtis Found';
      defaultDescription = 'We could not find any products matching your search criteria. Try adjusting filters or searching for silk, cotton, or anarkali.';
      defaultActionText = 'Clear All Filters';
      break;

    case 'orders':
      defaultIcon = <Package className="w-8 h-8 text-[#7B2435]" />;
      defaultTitle = 'No Orders Placed Yet';
      defaultDescription = 'When you complete a purchase, your shipment details, tracking links, and invoices will appear here.';
      defaultActionText = 'Start Shopping';
      break;

    case 'reviews':
      defaultIcon = <Star className="w-8 h-8 text-[#7B2435]" />;
      defaultTitle = 'No Customer Reviews Yet';
      defaultDescription = 'Be the first to share your thoughts and styling experience on this handcrafted piece.';
      defaultActionText = 'Write a Review';
      break;

    case 'admin-table':
      defaultIcon = <Inbox className="w-8 h-8 text-[#7B2435]" />;
      defaultTitle = 'No Records Found';
      defaultDescription = 'No entries match your current search query or active filter settings in this table.';
      defaultActionText = undefined;
      break;
  }

  const finalIcon = icon || defaultIcon;
  const finalTitle = title || defaultTitle;
  const finalDesc = description !== undefined ? description : defaultDescription;
  const finalActionText = actionText || primaryActionText || defaultActionText;
  const finalActionHandler = onAction || onPrimaryAction;

  return (
    <div
      className={cn(
        'text-center py-12 px-4 max-w-md mx-auto flex flex-col items-center justify-center animate-fadeIn',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-[#FFF0F3] border border-[#F5D5DC] flex items-center justify-center mb-4 text-[#7B2435] shadow-xs">
        {finalIcon}
      </div>

      <h3 className="font-serif text-xl font-bold text-neutral-900 mb-2">
        {finalTitle}
      </h3>

      {finalDesc && (
        <p className="text-xs sm:text-sm text-neutral-500 mb-6 leading-relaxed max-w-sm">
          {finalDesc}
        </p>
      )}

      {(finalActionText || secondaryActionText) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {finalActionText && finalActionHandler && (
            <Button
              variant="primary"
              size="md"
              onClick={finalActionHandler}
            >
              {finalActionText}
            </Button>
          )}

          {secondaryActionText && onSecondaryAction && (
            <Button
              variant="outline"
              size="md"
              onClick={onSecondaryAction}
            >
              {secondaryActionText}
            </Button>
          )}
        </div>
      )}

      {children && <div className="mt-4 w-full">{children}</div>}
    </div>
  );
};
