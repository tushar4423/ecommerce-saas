export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  primaryHover: string;
  primaryLight: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor?: string;
  textColor?: string;
  previewColors: string[];
}

export interface DesignTokens {
  colors: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    textMain: string;
    textMuted: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
    info: string;
  };
  typography: {
    fontDisplay: string;
    fontBody: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}
