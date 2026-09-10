/**
 * Centralized Design System Tokens & Configuration
 * Master design tokens for Nandita Fashion Storefront & Administration Panel.
 */

export const THEME_TOKENS = {
  colors: {
    // Primary Brand Palette (Ethnic Jamun / Maroon)
    primary: {
      50: '#FDF2F4',
      100: '#FBE8EB',
      200: '#F5D1D8',
      300: '#EAAFB9',
      400: '#DC8293',
      500: '#C9566E',
      600: '#A8384E',
      700: '#7B2435', // Master Primary
      800: '#621C2A', // Master Primary Hover
      900: '#4D121F', // Master Primary Dark
      950: '#2F0811',
      DEFAULT: '#7B2435',
      hover: '#621C2A',
      light: '#FFF0F3',
      dark: '#4D121F',
      border: '#EADBDA',
    },
    // Secondary Brand Palette (Dusty Rose / Blush)
    secondary: {
      50: '#FAF0F2',
      100: '#F5E1E5',
      200: '#EBC7CE',
      300: '#DFA7B3',
      400: '#C98C97', // Master Secondary
      500: '#B06B78',
      600: '#945864',
      700: '#7A434E',
      800: '#63353E',
      900: '#522E35',
      DEFAULT: '#C98C97',
      light: '#FAF0F2',
      dark: '#945864',
    },
    // Accent & Heritage Palette
    accent: {
      blush: '#E6A4B4',
      blushLight: '#FFF5F7',
      gold: '#D4AF37', // Festive Indian Zari Gold
      goldLight: '#FDF8EC',
      goldDark: '#A6841E',
      emerald: '#047857', // Festive Peacock Emerald
      emeraldLight: '#ECFDF5',
      rose: '#E11D48',
      amber: '#D97706',
      amberLight: '#FFFBEB',
      indigo: '#4338CA',
      DEFAULT: '#E6A4B4',
    },
    // Surface & Neutral Canvas Palette
    neutral: {
      bg: '#FAF6F0', // Soft Warm Linen Canvas
      surface: '#FFFFFF',
      surfaceAlt: '#F5EFE6',
      surfaceMuted: '#EDE6DA',
      border: '#EBE3D5',
      borderLight: '#F3EDE2',
      borderDark: '#D8CEBF',
      text: '#1C1917', // Warm Charcoal
      textMuted: '#78716C', // Stone 500
      textSubtle: '#A8A29E', // Stone 400
      textInverse: '#FFFFFF',
    },
    // Semantic Status Colors
    status: {
      success: '#059669',
      successBg: '#ECFDF5',
      successBorder: '#A7F3D0',
      warning: '#D97706',
      warningBg: '#FFFBEB',
      warningBorder: '#FDE68A',
      error: '#DC2626',
      errorBg: '#FEF2F2',
      errorBorder: '#FECACA',
      info: '#2563EB',
      infoBg: '#EFF6FF',
      infoBorder: '#BFDBFE',
    },
  },

  typography: {
    fonts: {
      serif: '"Playfair Display", "Cinzel", "Bodoni MT", Georgia, serif',
      sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    },
    fontSizes: {
      '2xs': ['0.625rem', { lineHeight: '0.875rem' }], // 10px
      xs: ['0.75rem', { lineHeight: '1rem' }],         // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],     // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],         // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],      // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],       // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],     // 36px
      '5xl': ['3rem', { lineHeight: '1.15' }],          // 48px
      '6xl': ['3.75rem', { lineHeight: '1.1' }],        // 60px
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem',  // 8px
    md: '0.75rem', // 12px
    lg: '1rem',    // 16px
    xl: '1.5rem',  // 24px
    '2xl': '2rem', // 32px
    '3xl': '3rem', // 48px
    '4xl': '4rem', // 64px
  },

  radius: {
    none: '0',
    xs: '0.25rem',  // 4px
    sm: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
    '2xl': '1.25rem', // 20px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },

  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
    sm: '0 2px 6px -1px rgba(123, 36, 53, 0.06), 0 1px 3px -1px rgba(0, 0, 0, 0.03)',
    md: '0 4px 14px -2px rgba(123, 36, 53, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
    lg: '0 12px 28px -4px rgba(123, 36, 53, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
    xl: '0 20px 36px -6px rgba(123, 36, 53, 0.15), 0 8px 18px -4px rgba(0, 0, 0, 0.06)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  },

  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  },
} as const;

export type ThemeTokens = typeof THEME_TOKENS;
export const theme = THEME_TOKENS;
