import React, { useEffect, useMemo } from 'react';
import { THEME_TOKENS } from './tokens';
import { ThemeContext, ThemeContextValue } from './useTheme';
import { useBranding } from '../hooks/useBranding';

export * from './tokens';
export * from './useTheme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const branding = useBranding();

  const primary = branding.primaryColor || THEME_TOKENS.colors.primary.DEFAULT;
  const primaryHover = THEME_TOKENS.colors.primary.hover;
  const primaryLight = THEME_TOKENS.colors.primary.light;
  const secondary = branding.secondaryColor || THEME_TOKENS.colors.secondary.DEFAULT;
  const accent = branding.accentColor || THEME_TOKENS.colors.accent.DEFAULT;
  const background = branding.backgroundColor || THEME_TOKENS.colors.neutral.bg;
  const surface = THEME_TOKENS.colors.neutral.surface;
  const border = THEME_TOKENS.colors.neutral.border;
  const text = THEME_TOKENS.colors.neutral.text;

  useEffect(() => {
    const root = document.documentElement;

    // Brand Colors
    root.style.setProperty('--brand-primary', primary);
    root.style.setProperty('--brand-primary-hover', primaryHover);
    root.style.setProperty('--brand-primary-light', primaryLight);
    root.style.setProperty('--brand-secondary', secondary);
    root.style.setProperty('--brand-accent', accent);
    root.style.setProperty('--brand-bg', background);
    root.style.setProperty('--brand-surface', surface);
    root.style.setProperty('--brand-border', border);
    root.style.setProperty('--brand-text', text);

    // Festive & Semantic Accents
    root.style.setProperty('--brand-gold', THEME_TOKENS.colors.accent.gold);
    root.style.setProperty('--brand-emerald', THEME_TOKENS.colors.accent.emerald);

    // Typography
    root.style.setProperty('--font-serif', THEME_TOKENS.typography.fonts.serif);
    root.style.setProperty('--font-sans', THEME_TOKENS.typography.fonts.sans);

    // Radii
    root.style.setProperty('--radius-sm', THEME_TOKENS.radius.sm);
    root.style.setProperty('--radius-md', THEME_TOKENS.radius.md);
    root.style.setProperty('--radius-lg', THEME_TOKENS.radius.lg);
    root.style.setProperty('--radius-xl', THEME_TOKENS.radius.xl);
    root.style.setProperty('--radius-2xl', THEME_TOKENS.radius['2xl']);
    root.style.setProperty('--radius-full', THEME_TOKENS.radius.full);

    // Shadows
    root.style.setProperty('--shadow-theme-sm', THEME_TOKENS.shadows.sm);
    root.style.setProperty('--shadow-theme-md', THEME_TOKENS.shadows.md);
    root.style.setProperty('--shadow-theme-lg', THEME_TOKENS.shadows.lg);
    root.style.setProperty('--shadow-theme-xl', THEME_TOKENS.shadows.xl);
  }, [primary, primaryHover, primaryLight, secondary, accent, background, surface, border, text]);

  const contextValue: ThemeContextValue = useMemo(() => ({
    tokens: THEME_TOKENS,
    branding,
    colors: {
      primary,
      primaryHover,
      primaryLight,
      secondary,
      accent,
      background,
      surface,
      border,
      text,
    },
  }), [branding, primary, primaryHover, primaryLight, secondary, accent, background, surface, border, text]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
