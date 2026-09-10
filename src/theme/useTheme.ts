import React, { createContext, useContext, useMemo } from 'react';
import { THEME_TOKENS, ThemeTokens } from './tokens';
import { useBranding } from '../hooks/useBranding';

export interface ThemeContextValue {
  tokens: ThemeTokens;
  branding: ReturnType<typeof useBranding>;
  colors: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    border: string;
    text: string;
  };
}

export const ThemeContext = createContext<ThemeContextValue>({
  tokens: THEME_TOKENS,
  branding: {} as any,
  colors: {
    primary: THEME_TOKENS.colors.primary.DEFAULT,
    primaryHover: THEME_TOKENS.colors.primary.hover,
    primaryLight: THEME_TOKENS.colors.primary.light,
    secondary: THEME_TOKENS.colors.secondary.DEFAULT,
    accent: THEME_TOKENS.colors.accent.DEFAULT,
    background: THEME_TOKENS.colors.neutral.bg,
    surface: THEME_TOKENS.colors.neutral.surface,
    border: THEME_TOKENS.colors.neutral.border,
    text: THEME_TOKENS.colors.neutral.text,
  },
});

export const useTheme = () => useContext(ThemeContext);
