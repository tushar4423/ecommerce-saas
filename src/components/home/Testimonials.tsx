import React from 'react';
import { Star, ShieldCheck, Heart, Sparkles, Instagram, ArrowRight } from 'lucide-react';
import { useBranding } from '../../hooks/useBranding';

export interface TestimonialsProps {
  title?: string;
  subtitle?: string;
  onNavigateToCatalog?: (categorySlug?: string, subcategory?: string) => void;
}

export const Testimonials: React.FC<TestimonialsProps> = ({
  title,
  subtitle,
  onNavigateToCatalog,
}) => {
  const { branding, primaryColor } = useBranding();
  const brandName = branding.brandName || 'Nandita Fashion';

  const reviews = [
    {
      id: 1,
      author: 'Suniti Mathur',
      city: 'South Delhi',
      rating: 5,
      title: 'Finally true 3XL sizing with flawless finishing',
      text: 'I ordered the Dusty Rose Embroidered Co-ord Set. The pure cotton is unbelievably soft and the fit across the shoulders and chest is tailored to perfection. Arrived in 2 days!',
      product: 'Dusty Rose Co-ord Set (3XL)',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    },
    {
      id: 2,
      author: 'Dr. Kriti Deshmukh',
      city: 'Pune',
      rating: 5,
      title: 'Perfect for hospital OPDs and long work hours',
      text: `The pure cambric cotton kurtis from ${brandName} are my daily uniform. Breathable even in humid weather, zero color bleeding after multiple washes, and deeply functional pockets.`,
      product: 'Mustard Block Print Kurti (XL)',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    },
    {
      id: 3,
      author: 'Meenakshi Sundaram',
      city: 'Chennai',
      rating: 5,
      title: 'Regal Anarkali for my daughter’s engagement',
      text: 'The Deep Wine Chanderi set looks like a designer couture piece worth ₹15,000. The zari work is subtle yet stunning. Received countless compliments!',
      product: 'Deep Wine Zari Anarkali (2XL)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white via-stone-50/60 to-white border-t border-stone-200/80 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-primary)] block mb-1">
            Real Experiences & Patron Love
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900">
            {title || `Loved by 50,000+ Women Across India`}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-2">
            {subtitle ||
              'Verified purchase reviews praising our authentic fabrics, fit precision, and attentive boutique service.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Buyer
                  </span>
                </div>

                <h4 className="font-serif text-base font-bold text-stone-900 mb-2 leading-snug">
                  &ldquo;{rev.title}&rdquo;
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed mb-6">
                  {rev.text}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center gap-3">
                <img
                  src={rev.avatar}
                  alt={rev.author}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border-2 border-[var(--brand-primary)]/20"
                />
                <div>
                  <h5 className="text-xs font-bold text-stone-900">{rev.author}</h5>
                  <p className="text-[11px] text-stone-500">
                    {rev.city} • Purchased <span className="font-semibold text-stone-700">{rev.product}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export interface InstagramGridProps {
  title?: string;
  subtitle?: string;
  onNavigateToCatalog?: (categorySlug?: string, subcategory?: string) => void;
}

export const InstagramGrid: React.FC<InstagramGridProps> = ({
  title,
  subtitle,
  onNavigateToCatalog,
}) => {
  const { branding } = useBranding();
  const brandName = branding.brandName || 'Nandita Fashion';

  const posts = [
    {
      img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
      handle: '@priya.styled',
      product: 'Dusty Rose Co-ord',
      tag: 'co-ord-sets',
    },
    {
      img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
      handle: '@riya_festive',
      product: 'Sage Green Chikankari',
      tag: 'chikankari',
    },
    {
      img: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
      handle: '@tarini_ethnic',
      product: 'Deep Wine Anarkali',
      tag: 'anarkalis',
    },
    {
      img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
      handle: '@divya_curvystyle',
      product: 'Indigo Tiered Maxi (3XL)',
      tag: 'plus-size',
    },
  ];

  return (
    <section className="py-14 sm:py-18 bg-white border-t border-stone-100 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[var(--brand-primary)] mb-1">
          <Instagram className="w-4 h-4" />
          <span>#{brandName.replace(/\s+/g, '')}Women</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-2">
          {title || 'As Styled By You'}
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mb-8 max-w-md mx-auto">
          {subtitle ||
            'Tag @nanditafashion on Instagram to be featured on our style wall and win a ₹1,000 shopping voucher.'}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {posts.map((post, idx) => (
            <div
              key={idx}
              onClick={() => onNavigateToCatalog?.(post.tag)}
              className="group relative aspect-square rounded-2xl overflow-hidden shadow-2xs border border-stone-200 cursor-pointer"
            >
              <img
                src={post.img}
                alt={post.handle}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-stone-950/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4 text-center">
                <Heart className="w-6 h-6 text-rose-400 fill-rose-400 mb-2 animate-bounce" />
                <span className="text-xs font-bold">{post.handle}</span>
                <span className="text-[10px] text-amber-200 mt-1 font-semibold">Wearing {post.product}</span>
                <span className="text-[10px] uppercase tracking-wider font-bold underline underline-offset-2 mt-2 text-white flex items-center gap-1">
                  Shop This Look <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
