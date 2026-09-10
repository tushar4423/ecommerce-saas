import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, Truck, ShieldCheck, Tag, ArrowRight } from 'lucide-react';
import { useGetAnnouncementsQuery } from '../../store/api/ecommerceApi';
import { useBranding } from '../../hooks/useBranding';
import { AnnouncementItem } from '../../types';

export interface AnnouncementBarProps {
  onNavigateToCatalog?: (categorySlug?: string, subcategory?: string) => void;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ onNavigateToCatalog }) => {
  const { branding, primaryColor, freeShippingThreshold } = useBranding();
  const { data: dbAnnouncements } = useGetAnnouncementsQuery();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Active items from DB or fallback
  const items: AnnouncementItem[] = React.useMemo(() => {
    if (dbAnnouncements && dbAnnouncements.length > 0) {
      return dbAnnouncements.filter((item) => item.isActive !== false);
    }
    if (branding.announcementActive || branding.announcementBar?.enabled || branding.announcementBar?.isActive) {
      return [
        {
          id: 'default-1',
          text: branding.headerAnnouncementText || branding.announcementText || branding.announcementBar?.text || '✨ Festive Launch: Use code NANDITA20 for Flat 20% OFF | Free Express Shipping across India',
          highlightText: branding.announcementBar?.highlightText || 'NANDITA20',
          linkText: branding.announcementBar?.linkText || 'Shop Collection',
          linkUrl: branding.announcementBar?.linkUrl || '/catalog',
          backgroundColor: branding.announcementBar?.backgroundColor || primaryColor || '#7B2435',
          textColor: branding.announcementBar?.textColor || '#FFFFFF',
          isActive: true,
          order: 1,
        },
      ];
    }
    return [];
  }, [dbAnnouncements, branding, primaryColor]);

  // Auto-rotate every 5 seconds if multiple items
  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];
  const bg = currentItem.backgroundColor || primaryColor || '#7B2435';
  const text = currentItem.textColor || '#FFFFFF';

  const handleLinkClick = () => {
    if (onNavigateToCatalog) {
      if (currentItem.linkUrl?.includes('category=')) {
        const cat = new URLSearchParams(currentItem.linkUrl.split('?')[1]).get('category') || undefined;
        onNavigateToCatalog(cat);
      } else {
        onNavigateToCatalog();
      }
    }
  };

  return (
    <aside 
      aria-label="Store Announcements and Offers"
      className="relative z-50 transition-colors duration-300 w-full overflow-hidden text-xs py-2 px-4 select-none"
      style={{ backgroundColor: bg, color: text }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left Side: Trust Highlight (Desktop only) */}
        <div className="hidden lg:flex items-center gap-5 text-[11px] opacity-90 font-medium">
          <span className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>Free Shipping &gt; ₹{freeShippingThreshold || 999}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>100% Handcrafted Certified</span>
          </span>
        </div>

        {/* Center: Main Rotating Dynamic Announcement */}
        <div className="flex-1 flex items-center justify-center gap-2 text-center min-w-0 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-pulse" />
          <span className="truncate tracking-wide text-xs font-semibold">
            {currentItem.text}
          </span>
          {currentItem.linkText && (
            <button
              type="button"
              onClick={handleLinkClick}
              className="hidden sm:inline-flex items-center gap-1 font-bold underline underline-offset-2 hover:text-amber-200 transition-colors ml-1 cursor-pointer shrink-0"
            >
              <span>{currentItem.linkText}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Right Side: Slider navigation & Offer Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {items.length > 1 && (
            <div className="flex items-center gap-1 bg-black/15 rounded-full px-1.5 py-0.5">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)}
                aria-label="Previous announcement"
                className="p-0.5 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[10px] opacity-80 font-mono px-0.5">
                {currentIndex + 1}/{items.length}
              </span>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev + 1) % items.length)}
                aria-label="Next announcement"
                className="p-0.5 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {currentItem.highlightText && (
            <span className="hidden md:inline-block bg-amber-400 text-stone-950 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full shadow-xs">
              {currentItem.highlightText}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
