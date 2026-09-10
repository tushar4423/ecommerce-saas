export interface HeroBanner {
  id: string;
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string;
  desktopImage?: string;
  mobileImage?: string;
  badge?: string;
  active?: boolean;
  isActive?: boolean;
  displayOrder: number;
  textColor?: string;
  overlayOpacity?: number;
  startDate?: string;
  endDate?: string;
}
