import React, { useState } from 'react';
import { 
  Heart, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Phone, 
  Mail, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  Send,
  Instagram,
  Facebook,
  Twitter,
  Sparkles,
  FileText,
  Download
} from 'lucide-react';
import { useGetCategoriesQuery, useGetSettingsQuery } from '../../store/api/ecommerceApi';
import { useBranding } from '../../hooks/useBranding';
import { useToast } from '../../hooks/useToast';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { buildVedaayaFeaturesPdf } from '../../utils/generatePdfDocument';

export interface FooterProps {
  onNavigateToCatalog: (categorySlug?: string, subcategory?: string) => void;
  onNavigateToAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateToCatalog, onNavigateToAdmin }) => {
  const branding = useBranding();
  const { data: dbCategories = [] } = useGetCategoriesQuery();
  const { toast } = useToast();

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const brandName = branding.brandName || 'Nandita Fashion';
  const tagline = branding.tagline || 'Handcrafted Heritage Ethnic Wear';

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      toast('Please provide a valid email address', 'error');
      return;
    }
    setIsSubscribed(true);
    toast('🎉 Welcome to Nandita VIP Club! Your 15% OFF coupon is WELCOME15', 'success');
    setNewsletterEmail('');
  };

  const handleDownloadFeaturesPdf = () => {
    try {
      const doc = buildVedaayaFeaturesPdf();
      doc.save('Vedaaya_Ethnic_App_Features_Specification.pdf');
      toast('Features Specification PDF downloaded successfully', 'success');
    } catch (err) {
      // Fallback to server route
      window.open('/api/docs/features-pdf', '_blank');
    }
  };

  return (
    <footer className="bg-stone-950 text-stone-300 pt-16 pb-12 mt-20 border-t border-stone-800 selection:bg-rose-900 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Proposition Trust Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 border-b border-stone-800 text-left">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-stone-900/50 border border-stone-800/80">
            <div className="w-12 h-12 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-[var(--brand-primary)]" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-stone-100">Free Express Shipping</h4>
              <p className="text-xs text-stone-400 mt-0.5">On orders above ₹{branding.freeShippingThreshold || 999} nationwide</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-stone-900/50 border border-stone-800/80">
            <div className="w-12 h-12 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6 text-[var(--brand-primary)]" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-stone-100">7-Day Easy Exchange</h4>
              <p className="text-xs text-stone-400 mt-0.5">Doorstep size swaps & hassle-free returns</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-stone-900/50 border border-stone-800/80">
            <div className="w-12 h-12 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-[var(--brand-primary)]" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-stone-100">100% Handloom Certified</h4>
              <p className="text-xs text-stone-400 mt-0.5">Directly sourced from master artisan clusters</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-stone-900/50 border border-stone-800/80">
            <div className="w-12 h-12 rounded-xl bg-brand-light text-brand-primary flex items-center justify-center shrink-0">
              <Phone className="w-6 h-6 text-[var(--brand-primary)]" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-stone-100">Artisan Support</h4>
              <p className="text-xs text-stone-400 mt-0.5">{branding.supportPhone || '+91 98765 43210'}</p>
            </div>
          </div>
        </div>

        {/* Newsletter Signup VIP Banner */}
        <div className="my-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-stone-900/90 border border-stone-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>VIP Heritage Circle</span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-white">
              Get 15% OFF your first handcrafted order
            </h3>
            <p className="text-xs sm:text-sm text-stone-400 mt-1">
              Join 40,000+ connoisseurs of Indian handloom. Receive secret festive drops and early sale invites.
            </p>
          </div>

          <form onSubmit={handleSubscribe} className="w-full md:w-auto flex-1 max-w-md flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address..."
              required
              className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-stone-500 focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              rightIcon={<Send className="w-4 h-4" />}
            >
              Subscribe
            </Button>
          </form>
        </div>

        {/* Multi-Column Links Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 py-8">
          {/* Brand Column */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-3">
              <div 
                className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-display font-black text-lg shadow-xs"
                style={{ backgroundColor: branding.primaryColor || '#7B2435' }}
              >
                {brandName.charAt(0) || 'N'}
              </div>
              <span className="font-display text-xl font-bold text-white tracking-wide">
                {brandName}
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              {tagline} — Celebrating India's rich artisanal heritage through breathable pure cottons, Lucknowi Chikankari, and contemporary inclusive silhouettes crafted for every woman.
            </p>
            <div className="flex items-center gap-3 pt-2 text-stone-400">
              <a href="#" className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-display font-bold text-sm text-stone-100 mb-4 tracking-wide uppercase">
              Collections
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              {dbCategories.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onNavigateToCatalog(c.slug)}
                    className="hover:text-white hover:translate-x-0.5 transition-all cursor-pointer text-left"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateToCatalog('plus-size')}
                  className="text-amber-400 hover:text-amber-300 font-semibold transition-colors cursor-pointer text-left"
                >
                  Plus Size Edit (XS-5XL)
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-display font-bold text-sm text-stone-100 mb-4 tracking-wide uppercase">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button type="button" onClick={() => onNavigateToCatalog()} className="hover:text-white transition-colors">
                  Size Guide & Fit Matrix
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigateToCatalog()} className="hover:text-white transition-colors">
                  Track Delivery Status
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigateToCatalog()} className="hover:text-white transition-colors">
                  Shipping & Customs Policy
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigateToCatalog()} className="hover:text-white transition-colors">
                  7-Day Return Portal
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigateToCatalog()} className="hover:text-white transition-colors">
                  Artisan Care Instructions
                </button>
              </li>
            </ul>
          </div>

          {/* Boutique Studio Contact */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm text-stone-100 mb-4 tracking-wide uppercase">
              Craft Studio
            </h4>
            <div className="flex items-start gap-2.5 text-xs text-stone-400">
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{branding.addressText || 'Plot 42, Heritage Craft Lane, Jaipur, Rajasthan 302001'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-stone-400">
              <Mail className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{branding.supportEmail || 'care@nanditafashion.com'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-stone-400">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{branding.supportPhone || '+91 98765 43210'}</span>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Administration Bar */}
        <div className="pt-8 mt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} {brandName}. Handcrafted with precision in India.</p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={handleDownloadFeaturesPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-amber-300 hover:text-amber-200 border border-stone-700 transition-colors font-medium cursor-pointer shadow-sm"
              title="Download full architectural and feature specification PDF"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Features Specification (PDF)</span>
              <Download className="w-3 h-3 text-amber-400" />
            </button>
            <button
              type="button"
              onClick={onNavigateToAdmin}
              className="text-stone-400 hover:text-stone-200 transition-colors font-medium cursor-pointer"
            >
              Merchant Admin Workspace
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
