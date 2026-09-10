import {
  useGetNavigationMenuQuery,
  useGetAnnouncementsQuery,
  useGetHomepageSectionsQuery,
  useGetBannersQuery,
} from '../store/api/ecommerceApi';

export function useCMS() {
  const { data: navigationMenu, isLoading: isMenuLoading } = useGetNavigationMenuQuery();
  const { data: announcements, isLoading: isAnnouncementsLoading } = useGetAnnouncementsQuery();
  const { data: homepageSections, isLoading: isSectionsLoading } = useGetHomepageSectionsQuery();
  const { data: banners, isLoading: isBannersLoading } = useGetBannersQuery();

  const activeAnnouncements = (announcements || []).filter((a) => a.isActive);
  const activeMenuItems = (navigationMenu || []).filter((m) => m.isActive);
  const activeSections = (homepageSections || [])
    .filter((s) => s.isActive)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const activeBanners = (banners || [])
    .filter((b) => b.isActive !== false && b.active !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  return {
    navigationMenu: activeMenuItems,
    rawNavigationMenu: navigationMenu || [],
    announcements: activeAnnouncements,
    rawAnnouncements: announcements || [],
    homepageSections: activeSections,
    rawHomepageSections: homepageSections || [],
    banners: activeBanners,
    rawBanners: banners || [],
    isLoading: isMenuLoading || isAnnouncementsLoading || isSectionsLoading || isBannersLoading,
  };
}
