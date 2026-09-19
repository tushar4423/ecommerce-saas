import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  Palette, 
  Truck, 
  Phone, 
  Globe, 
  Shield, 
  Image as ImageIcon, 
  Upload, 
  Building2, 
  FileText, 
  Sparkles, 
  Check, 
  Share2, 
  MessageSquare, 
  Instagram, 
  Facebook, 
  DollarSign
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { ImageUploadDropzone } from '../../components/ui/ImageUploadDropzone';
import { StoreBranding } from '../../types';
import { 
  useGetSettingsQuery, 
  useUpdateSettingsMutation,
} from '../../store/api/ecommerceApi';
import { useToast } from '../../hooks/useToast';
import { api } from '../../services/api';
import { INITIAL_SETTINGS } from '../../data/mockData';

export const StoreBrandingSettings: React.FC = () => {
  const toast = useToast();
  const { data: branding, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [activeTab, setActiveTab] = useState<'general' | 'colors' | 'contact' | 'tax'>('general');
  const [formData, setFormData] = useState<StoreBranding>({
    brandName: INITIAL_SETTINGS.storeName,
    tagline: INITIAL_SETTINGS.tagline,
    logoUrl: '',
    faviconUrl: '',
    announcementBar: {
      enabled: true,
      text: '✨ Festive Exclusive: Extra 15% OFF with code VEDAAYA15 | Free Shipping on orders above ₹999',
      link: '/catalog',
    },
    primaryColor: '#7B2435',
    secondaryColor: '#C98C97',
    accentColor: '#B8860B',
    contact: {
      phone: INITIAL_SETTINGS.supportPhone,
      whatsapp: '',
      email: INITIAL_SETTINGS.supportEmail,
      address: '',
    },
    socialLinks: {
      instagram: '',
      facebook: '',
      pinterest: '',
    },
    shippingConfig: {
      freeShippingThreshold: 999,
      standardShippingFee: 99,
      codAvailable: true,
      codFee: 49,
    },
    taxSettings: {
      gstin: INITIAL_SETTINGS.gstNumber || '',
      legalBusinessName: '',
      defaultHsnCode: '6204',
      taxIncludedInPrice: true,
      gstRate: 5,
    },
  });

  useEffect(() => {
    if (branding) {
      const phoneVal = branding.contact?.phone || branding.supportPhone || '';
      const whatsappVal = branding.contact?.whatsapp || branding.socialWhatsapp || '';
      const emailVal = branding.contact?.email || branding.supportEmail || '';
      const addressVal = branding.contact?.address || branding.addressText || '';

      setFormData((current) => ({
        ...current,
        ...branding,
        brandName: branding.brandName || branding.storeName || current.brandName,
        supportPhone: phoneVal || current.supportPhone,
        socialWhatsapp: whatsappVal || current.socialWhatsapp,
        supportEmail: emailVal || current.supportEmail,
        addressText: addressVal || current.addressText,
        contact: {
          ...current.contact,
          ...(branding.contact || {}),
          phone: phoneVal || current.contact?.phone || '',
          whatsapp: whatsappVal || current.contact?.whatsapp || '',
          email: emailVal || current.contact?.email || '',
          address: addressVal || current.contact?.address || '',
        },
        socialLinks: {
          ...current.socialLinks,
          ...(branding.socialLinks || {}),
          instagram: branding.socialInstagram ?? branding.socialLinks?.instagram ?? current.socialLinks?.instagram,
        },
        shippingConfig: {
          ...current.shippingConfig,
          ...(branding.shippingConfig || {}),
          freeShippingThreshold: branding.freeShippingThreshold ?? branding.shippingConfig?.freeShippingThreshold ?? current.shippingConfig?.freeShippingThreshold,
        },
        taxSettings: {
          ...current.taxSettings,
          ...(branding.taxSettings || {}),
          gstin: branding.gstNumber ?? branding.taxSettings?.gstin ?? current.taxSettings?.gstin,
        },
        announcementBar: {
          ...current.announcementBar,
          ...(branding.announcementBar || {}),
          enabled: branding.announcementActive ?? branding.announcementBar?.enabled ?? current.announcementBar?.enabled,
          text: branding.headerAnnouncementText ?? branding.announcementText ?? branding.announcementBar?.text ?? current.announcementBar?.text,
        },
      }));
    }
  }, [branding]);

  const handleLogoSelected = async (images: string[]) => {
    const image = images[0];
    if (!image) return;
    if (image.startsWith('data:image/svg+xml')) {
      toast.error('Please use a PNG, JPG, or WebP logo. SVG uploads are not supported by the server.');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const extension = image.startsWith('data:image/png') ? 'png' : image.startsWith('data:image/webp') ? 'webp' : 'jpg';
      const uploaded = await api.uploadMedia(image, `store-logo-${Date.now()}.${extension}`, formData.brandName || formData.storeName || 'Store logo');
      setFormData((current) => ({ ...current, logoUrl: uploaded.url }));
      toast.success('Logo uploaded. Save all settings to apply it to the storefront.');
    } catch (error: any) {
      toast.error(error?.message || 'Logo upload failed. Please try again.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    const brandName = (formData.brandName ?? formData.storeName ?? '').trim();
    if (!brandName) {
      toast.error('Brand name is required');
      return;
    }

    try {
      const announcementText = formData.announcementBar?.text ?? formData.announcementText;
      const cleanPhone = formData.contact?.phone ?? formData.supportPhone ?? '';
      const cleanEmail = formData.contact?.email ?? formData.supportEmail ?? '';
      const cleanWhatsapp = formData.contact?.whatsapp ?? formData.socialWhatsapp ?? '';
      const cleanAddress = formData.contact?.address ?? formData.addressText ?? '';

      const payload = {
        ...formData,
        brandName,
        storeName: brandName,
        supportPhone: cleanPhone,
        supportEmail: cleanEmail,
        addressText: cleanAddress,
        socialInstagram: formData.socialLinks?.instagram ?? formData.socialInstagram,
        socialWhatsapp: cleanWhatsapp,
        contact: {
          ...(formData.contact || {}),
          phone: cleanPhone,
          whatsapp: cleanWhatsapp,
          email: cleanEmail,
          address: cleanAddress,
        },
        freeShippingThreshold: formData.shippingConfig?.freeShippingThreshold ?? formData.freeShippingThreshold,
        gstNumber: formData.taxSettings?.gstin ?? formData.gstNumber,
        announcementActive: formData.announcementBar?.enabled ?? formData.announcementActive,
        announcementText,
        headerAnnouncementText: announcementText,
      };

      const result = await updateSettings(payload).unwrap();
      try {
        localStorage.setItem('vedaaya_store_branding_v2', JSON.stringify({ ...formData, ...result, contact: payload.contact }));
      } catch {}
      toast.success('Store branding, colors & global settings saved!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save settings');
    }
  };

  const tabs = [
    { id: 'general', label: '1. Brand Identity & Logo', icon: <Building2 className="w-4 h-4" /> },
    { id: 'colors', label: '2. Colors & Typography Theme', icon: <Palette className="w-4 h-4" /> },
    { id: 'contact', label: '3. Contact, WhatsApp & Socials', icon: <Phone className="w-4 h-4" /> },
    { id: 'tax', label: '4. GST, Invoicing & Legal Values', icon: <FileText className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-neutral-400">Loading store settings...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Brand Identity & Global Website Configuration"
        subtitle="Configure your brand name, studio logo, theme color palette, GST compliance, WhatsApp support channels, and announcement banner."
        actions={
          <Button
            variant="primary"
            size="md"
            isLoading={isSaving || isUploadingLogo}
            onClick={handleSave}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save All Settings
          </Button>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id: any) => setActiveTab(id)} variant="cards" />

      {/* Tab 1: General Brand Identity */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#7B2435]" />
              Store Identity & Trademarks
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Brand / Boutique Name *"
                required
                value={formData.brandName}
                onChange={(e) => setFormData((p) => ({ ...p, brandName: e.target.value }))}
              />

              <Input
                label="Brand Tagline / Slogan"
                value={formData.tagline || ''}
                onChange={(e) => setFormData((p) => ({ ...p, tagline: e.target.value }))}
              />
            </div>

            {/* Logo Upload Dropzone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#7B2435]" />
                  Brand Header Logo
                </label>
                <ImageUploadDropzone
                  compact
                  label="Upload Logo (PNG / JPG / WebP)"
                  helperText="PNG, JPG, or WebP; transparent background recommended"
                  showProcessingToast={false}
                  accept="image/png, image/jpeg, image/webp"
                  onImagesSelected={handleLogoSelected}
                />
                <Input
                  label="Or Direct Logo URL"
                  placeholder="https://..."
                  value={formData.logoUrl || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, logoUrl: e.target.value }))}
                />
              </div>

              {/* Live Preview Card */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  Storefront Header Live Preview
                </label>
                <div
                  style={{ borderColor: formData.primaryColor }}
                  className="p-6 rounded-2xl border-2 bg-white flex flex-col items-center justify-center text-center shadow-xs min-h-[160px]"
                >
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt={formData.brandName}
                      referrerPolicy="no-referrer"
                      className="max-h-12 max-w-[200px] object-contain mb-2"
                    />
                  ) : (
                    <h2
                      style={{ color: formData.primaryColor }}
                      className="text-xl font-serif font-bold tracking-wider uppercase"
                    >
                      {formData.brandName}
                    </h2>
                  )}
                  <p className="text-xs text-neutral-500 font-sans tracking-wide mt-1">
                    {formData.tagline || 'Handcrafted Heritage Ethnic Wear'}
                  </p>
                </div>
              </div>
            </div>

            {/* Global Top Announcement Bar */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#7B2435]" />
                    Global Top Announcement Bar
                  </h4>
                  <p className="text-xs text-neutral-500">Displayed at the very top of all storefront pages.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.announcementBar?.enabled ?? true}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        announcementBar: { ...(p.announcementBar || {}), enabled: e.target.checked },
                      }))
                    }
                    className="w-5 h-5 accent-[#7B2435]"
                  />
                  <span className="text-xs font-bold text-neutral-800">
                    {(formData.announcementBar?.enabled ?? true) ? 'Active' : 'Disabled'}
                  </span>
                </label>
              </div>

              {(formData.announcementBar?.enabled ?? true) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="sm:col-span-2">
                    <Input
                      label="Announcement Text"
                      placeholder="✨ Free Shipping on orders above ₹999 | Extra 15% OFF"
                      value={formData.announcementBar?.text || ''}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          announcementBar: { ...(p.announcementBar || {}), text: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Input
                      label="Target Link (Optional)"
                      placeholder="/catalog"
                      value={formData.announcementBar?.link || ''}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          announcementBar: { ...(p.announcementBar || {}), link: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Colors & Theme */}
      {activeTab === 'colors' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#7B2435]" />
            Boutique Color Palette & Visual Theme
          </h3>
          <p className="text-xs text-neutral-500 -mt-4">
            Changes to brand colors dynamically style primary buttons, active badges, navigation highlights, and checkout accents.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Primary Color */}
            <div className="p-4 rounded-xl border border-neutral-200 space-y-3">
              <label className="text-xs font-bold text-neutral-800 block">Primary Brand Color (Royal Maroon)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.primaryColor || '#7B2435'}
                  onChange={(e) => setFormData((p) => ({ ...p, primaryColor: e.target.value }))}
                  className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 shadow-xs"
                />
                <Input
                  value={formData.primaryColor || '#7B2435'}
                  onChange={(e) => setFormData((p) => ({ ...p, primaryColor: e.target.value }))}
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div className="p-4 rounded-xl border border-neutral-200 space-y-3">
              <label className="text-xs font-bold text-neutral-800 block">Secondary Accent (Blush Rose)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.secondaryColor || '#C98C97'}
                  onChange={(e) => setFormData((p) => ({ ...p, secondaryColor: e.target.value }))}
                  className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 shadow-xs"
                />
                <Input
                  value={formData.secondaryColor || '#C98C97'}
                  onChange={(e) => setFormData((p) => ({ ...p, secondaryColor: e.target.value }))}
                />
              </div>
            </div>

            {/* Accent Gold Color */}
            <div className="p-4 rounded-xl border border-neutral-200 space-y-3">
              <label className="text-xs font-bold text-neutral-800 block">Highlight Accent (Jaipur Gold)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.accentColor || '#B8860B'}
                  onChange={(e) => setFormData((p) => ({ ...p, accentColor: e.target.value }))}
                  className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 shadow-xs"
                />
                <Input
                  value={formData.accentColor || '#B8860B'}
                  onChange={(e) => setFormData((p) => ({ ...p, accentColor: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Theme Palette Buttons Preview */}
          <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700">UI Controls Component Preview</h4>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                style={{ backgroundColor: formData.primaryColor }}
                className="px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-xs"
              >
                Primary Button
              </button>
              <button
                type="button"
                style={{ borderColor: formData.primaryColor, color: formData.primaryColor }}
                className="px-5 py-2.5 rounded-xl border font-bold text-xs bg-white"
              >
                Outline Button
              </button>
              <span
                style={{ backgroundColor: `${formData.primaryColor}15`, color: formData.primaryColor }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold"
              >
                Badge Tag
              </span>
              <span
                style={{ backgroundColor: formData.accentColor, color: '#000000' }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                Gold Exclusive
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Contact & Socials */}
      {activeTab === 'contact' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <Phone className="w-5 h-5 text-[#7B2435]" />
            Customer Support & Social Channels
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Support Phone Number"
              placeholder="+91 98765 43210"
              value={formData.contact?.phone || formData.supportPhone || ''}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  supportPhone: e.target.value,
                  contact: { ...(p.contact || {}), phone: e.target.value },
                }))
              }
            />

            <Input
              label="WhatsApp Direct Support Number"
              placeholder="+91 98765 43210"
              helperText="Connected to floating WhatsApp button"
              value={formData.contact?.whatsapp || formData.socialWhatsapp || ''}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  socialWhatsapp: e.target.value,
                  contact: { ...(p.contact || {}), whatsapp: e.target.value },
                }))
              }
            />

            <Input
              label="Support Email Address"
              placeholder="care@vedaaya.in"
              value={formData.contact?.email || formData.supportEmail || ''}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  supportEmail: e.target.value,
                  contact: { ...(p.contact || {}), email: e.target.value },
                }))
              }
            />

            <Input
              label="Boutique / Atelier Physical Address"
              placeholder="Plot 42, Heritage Craft Lane, Jaipur, Rajasthan 302001"
              value={formData.contact?.address || formData.addressText || ''}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  addressText: e.target.value,
                  contact: { ...(p.contact || {}), address: e.target.value },
                }))
              }
            />
          </div>

          <div className="pt-4 border-t border-neutral-100 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#7B2435]" />
              Official Social Media Handles
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Instagram Profile URL"
                placeholder="https://instagram.com/vedaaya.ethnic"
                value={formData.socialLinks?.instagram || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    socialLinks: { ...(p.socialLinks || {}), instagram: e.target.value },
                  }))
                }
              />

              <Input
                label="Facebook Page URL"
                placeholder="https://facebook.com/vedaaya.ethnic"
                value={formData.socialLinks?.facebook || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    socialLinks: { ...(p.socialLinks || {}), facebook: e.target.value },
                  }))
                }
              />

              <Input
                label="Pinterest Profile URL"
                placeholder="https://pinterest.com/vedaaya.ethnic"
                value={formData.socialLinks?.pinterest || ''}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    socialLinks: { ...(p.socialLinks || {}), pinterest: e.target.value },
                  }))
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: GST & Legal Values */}
      {activeTab === 'tax' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#7B2435]" />
            GST Registration & Invoice Compliance
          </h3>
          <p className="text-xs text-neutral-500 -mt-4">
            Required for automated GST invoices, tax summaries, and customer dispatch receipts.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GSTIN Number (15-Digit)"
              placeholder="08AAAAA0000A1Z5"
              value={formData.taxSettings?.gstin || ''}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  taxSettings: { ...(p.taxSettings || {}), gstin: e.target.value },
                }))
              }
            />

            <Input
              label="Legal Registered Business Entity"
              placeholder="Vedaaya Ethnic Apparels Pvt Ltd"
              value={formData.taxSettings?.legalBusinessName || ''}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  taxSettings: { ...(p.taxSettings || {}), legalBusinessName: e.target.value },
                }))
              }
            />

            <Input
              label="Default Apparels HSN Code"
              placeholder="6204 (Women's Suits & Ensembles)"
              value={formData.taxSettings?.defaultHsnCode || '6204'}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  taxSettings: { ...(p.taxSettings || {}), defaultHsnCode: e.target.value },
                }))
              }
            />

            <Input
              label="Standard GST Tax Rate (%)"
              type="number"
              value={formData.taxSettings?.gstRate || 5}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  taxSettings: { ...(p.taxSettings || {}), gstRate: Number(e.target.value) || 5 },
                }))
              }
            />
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-900">Tax-Inclusive Pricing Mode</p>
              <p className="text-[11px] text-neutral-500">All catalog retail prices shown to customers already include GST.</p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.taxSettings?.taxIncludedInPrice ?? true}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    taxSettings: { ...(p.taxSettings || {}), taxIncludedInPrice: e.target.checked },
                  }))
                }
                className="w-5 h-5 accent-[#7B2435]"
              />
              <span className="text-xs font-bold text-neutral-800">
                {(formData.taxSettings?.taxIncludedInPrice ?? true) ? 'Inclusive' : 'Exclusive'}
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
