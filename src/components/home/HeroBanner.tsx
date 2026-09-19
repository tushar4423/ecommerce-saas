import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Clock, Tag, ArrowRight } from 'lucide-react';
import { HeroBanner as HeroBannerType } from '../../types';
import { useGetBannersQuery } from '../../store/api/ecommerceApi';
import { INITIAL_HERO_BANNERS } from '../../data/mockData';
import { useBranding } from '../../hooks/useBranding';
import { Button } from '../ui/Button';

export interface HeroBannerProps {
  banners?: HeroBannerType[];
  onNavigate?: (route: string) => void;
  onNavigateToCatalog?: (categorySlug?: string, subcategory?: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  banners: propBanners,
  onNavigate,
  onNavigateToCatalog,
}) => {
  const { branding, primaryColor, secondaryColor } = useBranding();
  const { data: dynamicBanners } = useGetBannersQuery();
  const banners =
    propBanners || (dynamicBanners && dynamicBanners.length > 0 ? dynamicBanners : INITIAL_HERO_BANNERS);
  const activeBanners = (banners || [])
    .filter((b) => b.isActive)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 38, seconds: 45 });

  // Carousel auto rotation timer
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  // Flash deal countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 6, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (activeBanners.length === 0) return null;

  const current = activeBanners[currentIndex] || activeBanners[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handleCtaClick = (link?: string) => {
    if (onNavigateToCatalog) {
      if (link?.includes('category=')) {
        const cat = new URLSearchParams(link.split('?')[1]).get('category') || undefined;
        onNavigateToCatalog(cat);
      } else if (link?.includes('size=plus') || link?.includes('plus-size')) {
        onNavigateToCatalog('plus-size');
      } else if (link?.includes('collection=festive')) {
        onNavigateToCatalog('festive-specials');
      } else {
        const clean = link?.replace(/^\//, '') || 'all';
        onNavigateToCatalog(clean === 'catalog' ? 'all' : clean);
      }
    } else if (onNavigate) {
      onNavigate(link || '/catalog');
    }
  };

  const displayTitle =
    currentIndex === 0 && branding.heroBannerTitle ? branding.heroBannerTitle : current.title;
  const displaySubtitle =
    currentIndex === 0 && branding.heroBannerSubtitle ? branding.heroBannerSubtitle : current.subtitle;

  const bannerDesktop =
    current.desktopImage ||
    current.imageUrl ||
    current.mobileImage ||
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=85';
  const bannerMobile = current.mobileImage || current.imageUrl || current.desktopImage || bannerDesktop;

  return (
    <section className="relative w-full overflow-hidden bg-stone-950 text-white select-none">
      <div className="relative min-h-[480px] sm:min-h-[560px] lg:min-h-[620px] flex items-center">
        {/* Background Image with High-Contrast Editorial Overlay */}
        <div className="absolute inset-0 z-0">
          <picture>
            <source media="(min-width: 768px)" srcSet={bannerDesktop} />
            <img
              src={bannerMobile}
              alt={displayTitle}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.includes('photo-1583391733956-3750e0ff4e8b')) {
                  target.src =
                    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=85';
                }
              }}
              className="w-full h-full object-cover object-center filter brightness-[0.88] transition-all duration-700"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/92 via-stone-950/60 to-transparent" />
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/35" />
        </div>

        {/* Content Box */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-16">
          <div className="max-w-2xl space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              {current.badge && (
                <div
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-white text-[11px] font-bold tracking-widest uppercase shadow-sm border border-white/20"
                  style={{ backgroundColor: primaryColor || '#7B2435' }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{current.badge}</span>
                </div>
              )}

              {/* Flash Countdown pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/20 text-amber-300 text-xs font-semibold backdrop-blur-xs">
                <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>
                  Ends in: {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m :{' '}
                  {String(timeLeft.seconds).padStart(2, '0')}s
                </span>
              </div>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12] drop-shadow-sm">
              {displayTitle}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-stone-200 font-normal leading-relaxed max-w-xl">
              {displaySubtitle}
            </p>

            {/* Coupon tag highlight */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/15 backdrop-blur-md rounded-xl border border-white/25 text-xs text-white">
              <Tag className="w-3.5 h-3.5 text-amber-300" />
              <span>
                Use code <strong className="text-amber-300 font-mono">{branding.couponPromoCode || 'NANDITA20'}</strong> for {branding.couponPromoDiscount || 'Flat 20% OFF'}
              </span>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                size="xl"
                onClick={() => handleCtaClick(current.ctaLink || '/catalog')}
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="shadow-xl hover:shadow-2xl hover:scale-102 transition-all cursor-pointer font-bold"
              >
                {current.ctaText || 'Shop Royal Festive Collection'}
              </Button>
              <button
                type="button"
                onClick={() => handleCtaClick('/catalog?size=plus')}
                className="px-6 py-3.5 bg-white/20 hover:bg-white/30 text-white text-xs sm:text-sm font-bold rounded-xl backdrop-blur-xs transition border border-white/30 cursor-pointer"
              >
                Plus Size (2XL - 5XL)
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        {activeBanners.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 bottom-3 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition shadow-lg z-10 cursor-pointer"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 bottom-3 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition shadow-lg z-10 cursor-pointer"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Indicators */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'w-8 bg-amber-400' : 'w-2 bg-white/40'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
