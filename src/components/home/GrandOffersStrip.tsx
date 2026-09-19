import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';
import { useBranding } from '../../hooks/useBranding';

export interface FeaturesStripProps {
  title?: string;
  subtitle?: string;
}

export const FeaturesStrip: React.FC<FeaturesStripProps> = ({ title, subtitle }) => {
  const { branding, primaryColor } = useBranding();
  const freeShippingThreshold = branding.freeShippingThreshold || 999;

  const features = [
    {
      icon: Sparkles,
      title: '100% Handcrafted Weaves',
      desc: 'Artisanal looms & Jaipur block prints',
    },
    {
      icon: Truck,
      title: 'Free Express Delivery',
      desc: `On all orders above ₹${freeShippingThreshold}`,
    },
    {
      icon: RefreshCw,
      title: '7-Day Easy Exchanges',
      desc: 'Hassle-free doorstep sizing pickup',
    },
    {
      icon: ShieldCheck,
      title: 'True-to-Fit Sizing',
      desc: 'Precision tailored from XS to 5XL',
    },
  ];

  return (
    <section className="py-6 sm:py-8 bg-white border-y border-stone-200/80 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div className="text-center mb-6">
            {title && <h3 className="font-serif text-lg font-bold text-stone-900">{title}</h3>}
            {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-stone-50/70 border border-stone-200/70 shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-light text-[var(--brand-primary)] flex items-center justify-center shrink-0 border border-[var(--brand-primary)]/15">
                  <Icon className="w-5 h-5 text-[var(--brand-primary)]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900 leading-snug">{feat.title}</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export interface GrandOffersStripProps {
  onNavigate?: (route: string) => void;
  onSelectCategory?: (slug: string) => void;
  onNavigateToCatalog?: (categorySlug?: string, subcategory?: string) => void;
}

export const GrandOffersStrip: React.FC<GrandOffersStripProps> = ({
  onNavigate,
  onSelectCategory,
  onNavigateToCatalog,
}) => {
  const { branding, primaryColor } = useBranding();

  const handleAction = (slug: string) => {
    if (onNavigateToCatalog) {
      onNavigateToCatalog(slug);
    } else if (onSelectCategory) {
      onSelectCategory(slug);
    } else if (onNavigate) {
      onNavigate(`/catalog?category=${slug}`);
    }
  };

  const cards = [
    {
      id: 'festive-deals',
      tag: 'Grand Festive Edit',
      title: 'Regal Anarkalis & Sets',
      discount: 'UP TO 50% OFF',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
      action: () => handleAction('anarkalis'),
    },
    {
      id: 'cotton-kurtis',
      tag: 'Daily Casuals',
      title: '60s Cambric Pure Cotton',
      discount: 'MIN 40% OFF',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
      action: () => handleAction('kurtis'),
    },
    {
      id: 'plus-size-edit',
      tag: 'Inclusive Boutique',
      title: 'Plus Size 2XL - 5XL',
      discount: 'FLAT 35% OFF',
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
      action: () => handleAction('plus-size'),
    },
    {
      id: 'budget-steals',
      tag: 'Super Saver Store',
      title: 'Ethnic Steals Under ₹999',
      discount: 'STARTING ₹599',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
      action: () => handleAction('cotton-daily-wear'),
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-white w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trust Badges Strip */}
        <FeaturesStrip />

        {/* Section Header */}
        <div className="flex items-end justify-between mt-12 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[var(--brand-primary)] bg-brand-light px-2.5 py-0.5 rounded-full border border-[var(--brand-primary)]/20">
                Grand Festive Spotlight
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Curated Designer Edits & Offers
            </h2>
          </div>
          <button
            type="button"
            onClick={() => handleAction('all')}
            className="text-xs font-bold text-[var(--brand-primary)] hover:underline flex items-center gap-1 cursor-pointer group"
          >
            <span>View All Deals</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* 4-Banner Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {cards.map((card) => (
            <div
              key={card.id}
              onClick={card.action}
              className="group cursor-pointer rounded-3xl overflow-hidden relative aspect-[4/5] bg-stone-900 shadow-2xs hover:shadow-xl transition-all duration-300 border border-stone-200"
            >
              <img
                src={card.image}
                alt={card.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-700 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

              {/* Tag & Discount */}
              <div className="absolute top-3.5 left-3.5 flex flex-col gap-1">
                <span className="px-2.5 py-0.5 bg-white/95 backdrop-blur-xs text-stone-900 text-[10px] font-bold uppercase tracking-wider rounded-full shadow-xs">
                  {card.tag}
                </span>
              </div>

              {/* Bottom Details */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="text-amber-300 font-black text-xs tracking-wider mb-0.5">
                  {card.discount}
                </div>
                <h3 className="font-serif text-lg font-bold leading-tight group-hover:text-amber-200 transition-colors">
                  {card.title}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-white/80 mt-1 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Shop Now</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
