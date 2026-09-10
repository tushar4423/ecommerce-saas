import React, { useState } from 'react';
import { Sparkles, ArrowRight, Tag, Copy, Check, Clock } from 'lucide-react';
import { useBranding } from '../../hooks/useBranding';
import { useToast } from '../../hooks/useToast';

export interface PromoSplitBannerProps {
  title?: string;
  subtitle?: string;
  onNavigateToCatalog: (categorySlug?: string, subcategory?: string) => void;
}

export const PromoSplitBanner: React.FC<PromoSplitBannerProps> = ({
  title,
  subtitle,
  onNavigateToCatalog,
}) => {
  const { branding, primaryColor } = useBranding();
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const promoCode1 = branding.couponPromoCode || 'NANDITA20';
  const promoCode2 = 'FESTIVE35';

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    toast(`🎉 Coupon ${code} copied! Applied at checkout`, 'success');
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <section className="py-12 bg-[#FAF6F0]/60 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[var(--brand-primary)] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Limited Festive Privileges</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              {title || 'Curated Boutique Offers & Privileges'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              {subtitle || 'Exclusive celebratory coupons applicable on all pure handloom & plus size kurtis'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Flat 20% Off Launch */}
          <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-stone-900 via-stone-900 to-stone-950 text-white shadow-md border border-stone-800 flex flex-col justify-between min-h-[260px] group">
            <div className="relative z-10 space-y-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-stone-950">
                New Season Launch
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-snug">
                Flat 20% OFF Everything
              </h3>
              <p className="text-xs sm:text-sm text-stone-300 max-w-sm">
                Valid on all Chikankari, Anarkalis, and Pure Cotton daily wear sets.
              </p>
            </div>

            <div className="relative z-10 pt-6 flex flex-wrap items-center justify-between gap-4 border-t border-stone-800/80 mt-4">
              <button
                type="button"
                onClick={() => handleCopy(promoCode1)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs font-mono font-bold text-amber-300 transition-colors cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{promoCode1}</span>
                {copiedCode === promoCode1 ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-stone-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onNavigateToCatalog('all')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-amber-300 transition-colors cursor-pointer group-hover:translate-x-1 transition-transform"
              >
                <span>Shop Collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="absolute right-0 bottom-0 opacity-15 w-48 h-48 pointer-events-none transform translate-x-12 translate-y-12">
              <Sparkles className="w-full h-full text-amber-400" />
            </div>
          </div>

          {/* Card 2: Festive Edit Special */}
          <div 
            className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col justify-between min-h-[260px] group"
            style={{ backgroundColor: primaryColor || '#7B2435' }}
          >
            <div className="relative z-10 space-y-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-stone-900">
                Festive Edit Special
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-snug">
                Buy 2 Get Extra 15% OFF
              </h3>
              <p className="text-xs sm:text-sm text-rose-100/90 max-w-sm">
                Pair any Anarkali or Co-ord Set with a straight kurti and save instantly.
              </p>
            </div>

            <div className="relative z-10 pt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 mt-4">
              <button
                type="button"
                onClick={() => handleCopy(promoCode2)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-xs font-mono font-bold text-white transition-colors cursor-pointer backdrop-blur-xs"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{promoCode2}</span>
                {copiedCode === promoCode2 ? (
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-white/70" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onNavigateToCatalog('anarkalis')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-amber-200 transition-colors cursor-pointer group-hover:translate-x-1 transition-transform"
              >
                <span>Shop Festive Sets</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
