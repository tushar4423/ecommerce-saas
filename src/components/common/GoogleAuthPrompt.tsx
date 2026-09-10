import React, { useState, useEffect } from 'react';
import { X, Sparkles, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const GoogleAuthPrompt: React.FC = () => {
  const { user, loginWithGoogle } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // If user is already authenticated or user explicitly closed this session, do not prompt
    if (user || isDismissed) {
      setIsOpen(false);
      return;
    }

    const dismissedInSession = sessionStorage.getItem('vedaaya_google_prompt_dismissed');
    if (dismissedInSession === 'true') {
      return;
    }

    let hasTriggered = false;

    const triggerPrompt = () => {
      if (!hasTriggered && !user) {
        hasTriggered = true;
        setIsOpen(true);
      }
    };

    // 1. Trigger after 30 seconds
    const timer = setTimeout(() => {
      triggerPrompt();
    }, 30000);

    // 2. Trigger if user is scrolling on the website (> 150px)
    const handleScroll = () => {
      if (window.scrollY > 150) {
        triggerPrompt();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [user, isDismissed]);

  if (!isOpen || user) return null;

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    try {
      await loginWithGoogle();
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    setIsDismissed(true);
    sessionStorage.setItem('vedaaya_google_prompt_dismissed', 'true');
  };

  return (
    <div
      id="google-auth-prompt-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
    >
      <div
        id="google-auth-prompt-card"
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#F0E6E1] text-neutral-900 animate-slide-up"
      >
        {/* Close Button */}
        <button
          id="google-auth-dismiss-btn"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand & Google Header */}
        <div className="flex items-center gap-3 mb-5">
          {/* Google Icon SVG */}
          <div className="w-10 h-10 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-lg font-bold text-[#7B2435]">NANDITA FASHION</span>
              <span className="text-[10px] uppercase font-bold bg-[#FFF2F4] text-[#7B2435] px-2 py-0.5 rounded-full">
                Instant Access
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">Continue with Google Account</p>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="mb-6 space-y-2.5">
          <h3 className="font-serif text-xl font-bold text-neutral-900">
            Sign in to unlock your curated ethnic wardrobe
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Get instant access to your saved wishlist, streamlined express checkout, and exclusive festive perks.
          </p>

          <div className="bg-[#FAF6F0] rounded-2xl p-3 border border-[#EADBDA] space-y-1.5 mt-3">
            <div className="flex items-center gap-2 text-xs text-neutral-700 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Instant <strong>Flat 20% OFF</strong> promo code applied automatically</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-700 font-medium">
              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Save delivery addresses & 1-click Razorpay checkout</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#7B2435] flex-shrink-0" />
              <span>Verified 100% secure Google Identity authentication</span>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="space-y-3">
          <button
            id="google-auth-login-btn"
            onClick={handleGoogleLogin}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-neutral-50 text-neutral-800 border-2 border-neutral-300 hover:border-neutral-400 rounded-full font-semibold text-sm shadow-sm transition active:scale-98 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isAuthenticating ? 'Signing in with Google...' : 'Continue with Google'}</span>
          </button>

          <p className="text-center text-[11px] text-neutral-400">
            By continuing, you agree to Nandita Fashion&apos;s Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
};
