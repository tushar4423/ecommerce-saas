export interface MegaMenuPromoCard {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  imageUrl: string;
  linkUrl: string;
  ctaText?: string;
}

export interface MegaMenuSubChildItem {
  id: string;
  title: string;
  url: string;
  badge?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  order: number;
}

export interface MegaMenuChildColumn {
  id: string;
  title: string;
  url?: string;
  items: MegaMenuSubChildItem[];
  order: number;
}

export type SubMenuItem = MegaMenuSubChildItem;
export type MenuColumn = MegaMenuChildColumn;
export type MenuPromoCard = MegaMenuPromoCard;



export interface MegaMenuItem {
  id: string;
  title: string;
  url: string;
  icon?: string;
  badge?: string;
  badgeColor?: string;
  isHighlight?: boolean;
  type: 'mega' | 'dropdown' | 'link';
  columns?: MegaMenuChildColumn[];
  promoCards?: MegaMenuPromoCard[];
  order: number;
  isActive: boolean;
}

export interface NavigationMenuConfig {
  id?: string;
  items: MegaMenuItem[];
  lastUpdated?: string;
}
