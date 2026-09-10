import React from 'react';
import { Sparkles, ShieldCheck, Heart, Leaf, Award, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { useBranding } from '../../hooks/useBranding';

export interface BrandStoryProps {
  title?: string;
  subtitle?: string;
  onNavigateToCatalog: (categorySlug?: string, subcategory?: string) => void;
}

export const BrandStory: React.FC<BrandStoryProps> = ({
  title,
  subtitle,
  onNavigateToCatalog,
}) => {
  const { branding, primaryColor } = useBranding();
  const brandName = branding.brandName || 'Nandita Fashion';

  const storyTitle = title || 'Crafted with Soul, Rooted in Jaipur’s Handloom Traditions';
  const storySubtitle =
    subtitle ||
    'From generation-old hand-block printing in Sanganer to intricate Lucknowi Chikankari, every ensemble at Nandita Fashion is woven with pure breathable natural fabrics and mindful tailoring for sizes XS through 5XL.';

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-stone-50 via-[#FAF6F0] to-white border-y border-stone-200/80 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Visual Media Collage */}
          <div className="lg:col-span-6 relative">
            <div className="relative z-10 grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-md border border-stone-200/80 bg-stone-100">
                  <img
                    src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=85"
                    alt="Handloom Weave"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                    <Leaf className="w-4 h-4 text-emerald-600" />
                    <span>100% Breathable Cotton</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    60s Cambric & Mulmul weaves perfect for all-day humid comfort.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-8">
                <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Azo-Free Natural Dyes</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Skin-safe, fade-resistant traditional wooden block dyes.
                  </p>
                </div>
                <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-md border border-stone-200/80 bg-stone-100">
                  <img
                    src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=85"
                    alt="Jaipur Artisan"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>

            {/* Decorative background blob */}
            <div 
              className="absolute -top-10 -left-10 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
              style={{ backgroundColor: primaryColor || '#7B2435' }}
            />
          </div>

          {/* Right Column: Editorial Narrative & Craft Values */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-light border border-[var(--brand-primary)]/20 text-brand-primary text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              <span>The Artisan Heritage of {brandName}</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 leading-tight">
              {storyTitle}
            </h2>

            <p className="text-sm text-stone-600 leading-relaxed">
              {storySubtitle}
            </p>

            {/* 3 Craft Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-stone-200/70 shadow-2xs">
                <div className="text-xl font-serif font-black text-[var(--brand-primary)] mb-1">
                  120+
                </div>
                <div className="text-xs font-bold text-stone-900">Master Artisans</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Empowered across Rajasthan & UP clusters</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200/70 shadow-2xs">
                <div className="text-xl font-serif font-black text-[var(--brand-primary)] mb-1">
                  XS-5XL
                </div>
                <div className="text-xs font-bold text-stone-900">True Inclusive Sizing</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Tailored bust measurements from 36" to 50"</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-stone-200/70 shadow-2xs">
                <div className="text-xl font-serif font-black text-[var(--brand-primary)] mb-1">
                  50k+
                </div>
                <div className="text-xs font-bold text-stone-900">Happy Patrons</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Cherished in 400+ cities across India</div>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => onNavigateToCatalog('cotton-daily-wear')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Explore Pure Cotton Heritage
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigateToCatalog('plus-size')}
              >
                Shop Inclusive Edit (2XL-5XL)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
