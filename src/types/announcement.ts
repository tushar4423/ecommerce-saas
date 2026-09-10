export interface AnnouncementItem {
  id: string;
  text: string;
  highlightText?: string;
  linkText?: string;
  linkUrl?: string;
  badge?: string;
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
  isActive: boolean;
  order: number;
  startDate?: string;
  endDate?: string;
}

export interface AnnouncementBarConfig {
  enabled: boolean;
  autoplay: boolean;
  autoplayIntervalSeconds: number;
  announcements: AnnouncementItem[];
  showCountdown?: boolean;
  countdownTarget?: string;
}
