import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon, 
  Calendar, 
  Eye, 
  EyeOff, 
  Smartphone, 
  Monitor, 
  Tag, 
  Clock,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { DataTable, Column } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ImageUploadDropzone } from '../../components/ui/ImageUploadDropzone';
import { HeroBanner } from '../../types';
import { 
  useGetBannersQuery, 
  useSaveBannerMutation, 
  useDeleteBannerMutation,
  useCreateAuditLogMutation 
} from '../../store/api/ecommerceApi';
import { useToast } from '../../hooks/useToast';

export const BannerManager: React.FC = () => {
  const toast = useToast();
  const { data: banners = [], isLoading } = useGetBannersQuery();
  const [saveBanner, { isLoading: isSaving }] = useSaveBannerMutation();
  const [deleteBanner, { isLoading: isDeleting }] = useDeleteBannerMutation();
  const [createAuditLog] = useCreateAuditLogMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [formData, setFormData] = useState<HeroBanner>({
    id: '',
    title: '',
    subtitle: '',
    badge: 'Festive Launch',
    ctaText: 'Explore Collection',
    ctaLink: '/catalog',
    imageUrl: '',
    desktopImage: '',
    mobileImage: '',
    active: true,
    isActive: true,
    displayOrder: 1,
    startDate: '',
    endDate: '',
  });

  const sortedBanners = [...banners].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const handleOpenCreate = () => {
    setFormData({
      id: `banner-${Date.now()}`,
      title: 'Royal Heritage Silk & Velvet Edit',
      subtitle: 'Handcrafted Zari & Gota Patti Ensembles | Exclusive Festive Offers',
      badge: 'Festive Launch',
      ctaText: 'Shop New Arrivals',
      ctaLink: '/catalog?category=anarkali-sets',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80',
      desktopImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80',
      mobileImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
      active: true,
      isActive: true,
      displayOrder: banners.length + 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    });
    setPreviewDevice('desktop');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: HeroBanner) => {
    const img = b.imageUrl || b.desktopImage || b.mobileImage || '';
    setFormData({
      ...b,
      imageUrl: img,
      desktopImage: b.desktopImage || img,
      mobileImage: b.mobileImage || img,
      active: b.active ?? b.isActive ?? true,
      isActive: b.active ?? b.isActive ?? true,
      badge: b.badge || '',
      startDate: b.startDate || '',
      endDate: b.endDate || '',
    });
    setPreviewDevice('desktop');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (banner: HeroBanner) => {
    const newStatus = !(banner.active ?? banner.isActive ?? true);
    const updatedBanner: HeroBanner = {
      ...banner,
      active: newStatus,
      isActive: newStatus,
    };
    try {
      await saveBanner(updatedBanner).unwrap();
      await createAuditLog({
        adminId: 'adm-current',
        adminName: 'Admin User',
        adminEmail: 'admin@vedaaya.in',
        action: 'banner_update',
        entityType: 'Banner',
        entityId: banner.id,
        entityName: banner.title,
        details: `Banner "${banner.title}" status toggled to ${newStatus ? 'Active' : 'Inactive'}`,
        previousValue: { active: !newStatus },
        newValue: { active: newStatus },
      });
      toast.success(`Banner is now ${newStatus ? 'Active' : 'Inactive'}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update banner status');
    }
  };

  const handleDelete = async (banner: HeroBanner) => {
    if (!window.confirm(`Are you sure you want to delete banner "${banner.title}"?`)) {
      return;
    }
    try {
      await deleteBanner(banner.id).unwrap();
      await createAuditLog({
        adminId: 'adm-current',
        adminName: 'Admin User',
        adminEmail: 'admin@vedaaya.in',
        action: 'banner_update',
        entityType: 'Banner',
        entityId: banner.id,
        entityName: banner.title,
        details: `Deleted promotional banner "${banner.title}"`,
      });
      toast.success('Banner removed successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete banner');
    }
  };

  const handleSave = async () => {
    const desktopImg = formData.desktopImage?.trim() || formData.imageUrl?.trim();
    const mobileImg = formData.mobileImage?.trim() || desktopImg;

    if (!formData.title.trim() || !desktopImg) {
      toast.error('Banner Title and Desktop Image are required');
      return;
    }

    try {
      const bannerPayload: HeroBanner = {
        ...formData,
        imageUrl: desktopImg,
        desktopImage: desktopImg,
        mobileImage: mobileImg,
        active: formData.active ?? formData.isActive ?? true,
        isActive: formData.active ?? formData.isActive ?? true,
        displayOrder: Number(formData.displayOrder) || 1,
      };

      await saveBanner(bannerPayload).unwrap();
      await createAuditLog({
        adminId: 'adm-current',
        adminName: 'Admin User',
        adminEmail: 'admin@vedaaya.in',
        action: 'banner_update',
        entityType: 'Banner',
        entityId: bannerPayload.id,
        entityName: bannerPayload.title,
        details: `Configured banner "${bannerPayload.title}" (Order: ${bannerPayload.displayOrder}, CTA: ${bannerPayload.ctaText})`,
        newValue: bannerPayload,
      });

      toast.success('Hero banner saved and published live!');
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save banner');
    }
  };

  const isScheduledActive = (b: HeroBanner) => {
    const isStatusActive = b.active ?? b.isActive ?? true;
    if (!isStatusActive) return false;
    const now = new Date();
    if (b.startDate && new Date(b.startDate) > now) return false;
    if (b.endDate && new Date(b.endDate) < now) return false;
    return true;
  };

  const columns: Column<HeroBanner>[] = [
    {
      key: 'image',
      header: 'Banner & Creatives',
      render: (b) => {
        const imgSrc = b.desktopImage || b.imageUrl || b.mobileImage || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b';
        const mobileSrc = b.mobileImage || imgSrc;
        const live = isScheduledActive(b);

        return (
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={imgSrc}
                alt={b.title}
                referrerPolicy="no-referrer"
                className="w-28 h-16 object-cover rounded-xl border border-neutral-200 shadow-xs"
              />
              <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-md bg-neutral-900 border border-white text-white flex items-center justify-center text-[10px] font-mono shadow-xs" title="Mobile ready">
                <Smartphone className="w-3 h-3" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-neutral-900">{b.title}</span>
                {b.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#7B2435]/10 text-[#7B2435]">
                    {b.badge}
                  </span>
                )}
                {live ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    Live Now
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-neutral-100 text-neutral-500">
                    Inactive / Scheduled
                  </span>
                )}
              </div>
              <span className="text-xs text-neutral-500 line-clamp-1">{b.subtitle}</span>
              {(b.startDate || b.endDate) && (
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                  <Clock className="w-3 h-3 text-neutral-400" />
                  <span>{b.startDate || 'Immediate'} → {b.endDate || 'Ongoing'}</span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'cta',
      header: 'CTA & Target',
      render: (b) => (
        <div className="flex flex-col text-xs gap-1">
          <span className="font-semibold text-neutral-800 flex items-center gap-1">
            <LinkIcon className="w-3 h-3 text-[#7B2435]" />
            {b.ctaText || 'Shop Now'}
          </span>
          <span className="text-neutral-400 font-mono text-[11px] truncate max-w-[180px]">
            {b.ctaLink || '/catalog'}
          </span>
        </div>
      ),
    },
    {
      key: 'displayOrder',
      header: 'Sequence',
      sortable: true,
      render: (b) => (
        <div className="flex items-center gap-1.5">
          <span className="w-7 h-7 rounded-lg bg-neutral-100 font-bold text-neutral-700 text-xs flex items-center justify-center">
            #{b.displayOrder}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (b) => {
        const isActive = b.active ?? b.isActive ?? true;
        return (
          <button
            type="button"
            onClick={() => handleToggleStatus(b)}
            className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              isActive 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'
            }`}
          >
            {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {isActive ? 'Published' : 'Hidden'}
          </button>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (b) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => handleOpenEdit(b)}
            className="p-2 text-neutral-500 hover:text-[#7B2435] hover:bg-[#FFF0F3] rounded-lg cursor-pointer transition-colors"
            title="Edit Banner"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(b)}
            className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
            title="Delete Banner"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Hero Banner & Marketing Slider"
        subtitle="Upload desktop and mobile banners, configure text overlays, set CTA buttons, schedule start/end dates, and manage display ordering."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Banner
          </Button>
        }
      />

      <DataTable 
        data={sortedBanners} 
        columns={columns} 
        keyExtractor={(b) => b.id} 
        isLoading={isLoading} 
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={formData.id ? 'Configure Hero Banner' : 'Create Hero Banner'}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" isLoading={isSaving} onClick={handleSave}>
              Save & Publish Banner
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Main Title & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Banner Headline / Title"
                required
                placeholder="e.g. Royal Jaipur Blockprints"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div>
              <Input
                label="Badge / Tag (Optional)"
                placeholder="e.g. FLAT 40% OFF"
                value={formData.badge || ''}
                onChange={(e) => setFormData((p) => ({ ...p, badge: e.target.value }))}
              />
            </div>
          </div>

          <Input
            label="Banner Subtitle / Promotional Caption"
            placeholder="e.g. Handcrafted Cotton Kurtis, Anarkalis & Festive Co-ord Sets"
            value={formData.subtitle || ''}
            onChange={(e) => setFormData((p) => ({ ...p, subtitle: e.target.value }))}
          />

          {/* Desktop & Mobile Image Creatives */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
            {/* Desktop Banner Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-[#7B2435]" />
                  Desktop Banner (16:9 / 21:9)
                </label>
              </div>
              <ImageUploadDropzone
                compact
                label="Upload Desktop Banner"
                helperText="Recommended: 1920x800 px (Max 10MB)"
                onImagesSelected={(urls) => {
                  if (urls.length > 0) {
                    setFormData((p) => ({
                      ...p,
                      desktopImage: urls[0],
                      imageUrl: urls[0],
                      mobileImage: p.mobileImage || urls[0],
                    }));
                  }
                }}
              />
              <Input
                label="Or Desktop Image URL"
                placeholder="https://..."
                value={formData.desktopImage || formData.imageUrl || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    desktopImage: e.target.value,
                    imageUrl: e.target.value,
                    mobileImage: p.mobileImage || e.target.value,
                  }))
                }
              />
            </div>

            {/* Mobile Banner Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#7B2435]" />
                  Mobile Banner (4:5 / 9:16)
                </label>
              </div>
              <ImageUploadDropzone
                compact
                label="Upload Mobile Banner"
                helperText="Recommended: 800x1000 px for quick mobile load"
                onImagesSelected={(urls) => {
                  if (urls.length > 0) {
                    setFormData((p) => ({
                      ...p,
                      mobileImage: urls[0],
                    }));
                  }
                }}
              />
              <Input
                label="Or Mobile Image URL"
                placeholder="https://..."
                value={formData.mobileImage || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    mobileImage: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Live Device Preview Switcher */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Creative Live Preview
              </label>
              <div className="flex items-center gap-1 bg-neutral-200 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all ${
                    previewDevice === 'desktop' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all ${
                    previewDevice === 'mobile' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-600'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile
                </button>
              </div>
            </div>

            <div className={`mx-auto rounded-2xl overflow-hidden border border-neutral-300 relative shadow-inner bg-neutral-900 ${
              previewDevice === 'desktop' ? 'w-full aspect-[21/9]' : 'max-w-[280px] aspect-[4/5]'
            }`}>
              <img
                src={
                  previewDevice === 'mobile'
                    ? (formData.mobileImage || formData.desktopImage || formData.imageUrl || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b')
                    : (formData.desktopImage || formData.imageUrl || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c')
                }
                alt="Banner preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
                {formData.badge && (
                  <span className="self-start px-2 py-0.5 rounded text-[10px] font-bold bg-[#B8860B] text-black mb-2 uppercase tracking-wider">
                    {formData.badge}
                  </span>
                )}
                <h4 className="font-serif font-bold text-base sm:text-xl line-clamp-1">
                  {formData.title || 'Your Banner Title Preview'}
                </h4>
                <p className="text-xs text-neutral-300 line-clamp-2 mt-1">
                  {formData.subtitle || 'Your banner subtitle and promotional text goes here.'}
                </p>
                <div className="mt-3">
                  <span className="inline-block px-4 py-1.5 rounded-lg bg-[#7B2435] text-white text-xs font-bold">
                    {formData.ctaText || 'Shop Collection'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button & Target URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="CTA Button Label"
              placeholder="Shop Collection"
              value={formData.ctaText || ''}
              onChange={(e) => setFormData((p) => ({ ...p, ctaText: e.target.value }))}
            />

            <Input
              label="Target Destination URL"
              placeholder="/catalog?category=festive"
              value={formData.ctaLink || ''}
              onChange={(e) => setFormData((p) => ({ ...p, ctaLink: e.target.value }))}
            />
          </div>

          {/* Scheduling & Ordering */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-100">
            <Input
              label="Start Date (Optional)"
              type="date"
              value={formData.startDate || ''}
              onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
            />

            <Input
              label="End Date (Optional)"
              type="date"
              value={formData.endDate || ''}
              onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
            />

            <Input
              label="Display Order (Sequence)"
              type="number"
              min={1}
              value={formData.displayOrder}
              onChange={(e) => setFormData((p) => ({ ...p, displayOrder: Number(e.target.value) || 1 }))}
            />
          </div>

          {/* Active Status Toggle */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-800">Banner Publication Status</p>
              <p className="text-[11px] text-neutral-500">When enabled, this banner will appear in the storefront hero carousel.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active ?? formData.isActive ?? true}
                onChange={(e) => setFormData((p) => ({ ...p, active: e.target.checked, isActive: e.target.checked }))}
                className="w-5 h-5 accent-[#7B2435]"
              />
              <span className="text-xs font-bold text-neutral-800">
                {(formData.active ?? formData.isActive ?? true) ? 'Active' : 'Draft / Hidden'}
              </span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};
