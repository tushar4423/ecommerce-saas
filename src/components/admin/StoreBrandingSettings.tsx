import React, { useState, useRef } from 'react';
import { 
  Palette, 
  Sparkles, 
  Upload, 
  Check, 
  RefreshCw, 
  Eye, 
  Save, 
  Image as ImageIcon, 
  Trash2, 
  Type, 
  Layers, 
  Globe, 
  ShoppingBag, 
  Tag, 
  Phone, 
  Mail, 
  MapPin, 
  Sliders
} from 'lucide-react';
import { useBranding } from '../../context/BrandingContext';
import { StoreBranding } from '../../types';

export const StoreBrandingSettings: React.FC = () => {
  const { branding, presets, updateBranding, applyPreset, resetToDefault, uploadLogo } = useBranding();
  
  const [formData, setFormData] = useState<StoreBranding>({ ...branding });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'themes' | 'identity' | 'announcements' | 'contact'>('themes');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof StoreBranding, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setFormData((prev) => ({
          ...prev,
          logoUrl: base64,
          logoType: 'both',
        }));
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File read error:', err);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);
    if (!preset) return;

    setFormData((prev) => ({
      ...prev,
      themeId: preset.id,
      primaryColor: preset.primaryColor,
      primaryHover: preset.primaryHover,
      primaryLight: preset.primaryLight,
      secondaryColor: preset.secondaryColor,
      accentColor: preset.accentColor,
      backgroundColor: preset.backgroundColor,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateBranding(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save branding error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADBDA] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF0F3] text-[#7B2435] text-xs font-bold uppercase tracking-wider mb-2">
            <Palette className="w-3.5 h-3.5" />
            <span>Store Theme & Brand Identity</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">
            Brand Studio & Theme Customizer
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 max-w-2xl leading-relaxed">
            Customize the storefront brand name, upload custom boutique logos, apply royal ethnic color palettes, and configure promotional banners in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={resetToDefault}
            className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#7B2435] hover:bg-[#621C2A] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Published Live!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Publish Live</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Storefront Preview Window */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EADBDA] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#7B2435]" />
            <span>Live Storefront Interactive Preview</span>
          </h3>
          <span className="text-[11px] font-semibold text-neutral-400">
            Updates dynamically as you edit
          </span>
        </div>

        {/* Mock Store Window */}
        <div 
          className="rounded-2xl border border-neutral-200 overflow-hidden shadow-inner transition-colors duration-300"
          style={{ backgroundColor: formData.backgroundColor }}
        >
          {/* Mock Announcement Bar */}
          {formData.announcementActive && (
            <div 
              className="py-1.5 px-4 text-center text-white text-[11px] font-medium transition-colors"
              style={{ backgroundColor: formData.primaryColor }}
            >
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                {formData.headerAnnouncementText}
              </span>
            </div>
          )}

          {/* Mock Header */}
          <div className="bg-white/95 backdrop-blur-sm border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
            {/* Mock Brand Logo */}
            <div className="flex items-center gap-3">
              {formData.logoUrl && (formData.logoType === 'image' || formData.logoType === 'both') && (
                <img 
                  src={formData.logoUrl} 
                  alt={formData.storeName} 
                  className="h-9 max-w-[120px] object-contain rounded"
                />
              )}
              {(formData.logoType === 'text' || formData.logoType === 'both' || !formData.logoUrl) && (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="font-serif text-xl font-bold tracking-tight uppercase"
                      style={{ color: formData.primaryColor }}
                    >
                      {formData.storeName || 'Nandita Fashion'}
                    </span>
                    <span 
                      className="w-1.5 h-1.5 rounded-full" 
                      style={{ backgroundColor: formData.secondaryColor }}
                    />
                  </div>
                  <span className="text-[8px] tracking-[0.2em] uppercase font-medium text-neutral-500 block -mt-0.5">
                    {formData.tagline || 'Ethnic & Kurti Studio'}
                  </span>
                </div>
              )}
            </div>

            {/* Mock Nav links */}
            <div className="hidden sm:flex items-center gap-5 text-xs font-semibold text-neutral-700">
              <span className="cursor-pointer hover:text-[#7B2435]">Kurtis & Sets</span>
              <span className="cursor-pointer hover:text-[#7B2435]">Plus Size (2XL-5XL)</span>
              <span className="cursor-pointer hover:text-[#7B2435]">Luxe Festive</span>
            </div>

            {/* Mock Action Buttons */}
            <div className="flex items-center gap-2">
              <button 
                className="px-3.5 py-1.5 rounded-full text-white text-xs font-bold shadow-xs transition"
                style={{ backgroundColor: formData.primaryColor }}
              >
                Explore Shop
              </button>
            </div>
          </div>

          {/* Mock Hero Snippet */}
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="max-w-md space-y-3">
              <div 
                className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ 
                  backgroundColor: formData.primaryLight,
                  color: formData.primaryColor 
                }}
              >
                <Sparkles className="w-3 h-3" />
                <span>Handcrafted Indian Weaves</span>
              </div>
              <h4 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 leading-tight">
                {formData.heroBannerTitle}
              </h4>
              <p className="text-xs text-neutral-600 leading-relaxed">
                {formData.heroBannerSubtitle}
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-xs"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  Shop New Arrivals
                </button>
                <span 
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold border border-dashed"
                  style={{ 
                    color: formData.primaryColor, 
                    borderColor: formData.secondaryColor,
                    backgroundColor: formData.primaryLight 
                  }}
                >
                  Use Code {formData.couponPromoCode}
                </span>
              </div>
            </div>

            <div className="w-36 h-44 rounded-2xl overflow-hidden shadow-md border-2 border-white flex-shrink-0">
              <img 
                src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80" 
                alt="Ethnic Preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-3 overflow-x-auto">
        {[
          { id: 'themes', label: 'Color Themes & Presets', icon: Palette },
          { id: 'identity', label: 'Store Name & Logo Upload', icon: Type },
          { id: 'announcements', label: 'Promotions & Announcements', icon: Tag },
          { id: 'contact', label: 'Studio & Support Contact', icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Color Themes & Presets */}
      {activeTab === 'themes' && (
        <div className="space-y-6">
          {/* Preset Cards */}
          <div>
            <h4 className="font-serif text-base font-bold text-neutral-900 mb-3">
              Curated Royal Ethnic Color Themes
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {presets.map((preset) => {
                const isSelected = formData.themeId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 space-y-3 relative ${
                      isSelected
                        ? 'border-[#7B2435] bg-[#FFF8F9] shadow-md ring-2 ring-[#7B2435]/20'
                        : 'border-neutral-200 bg-white hover:border-neutral-300 shadow-xs'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#7B2435] text-white flex items-center justify-center text-[10px] font-bold">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    
                    {/* Color Swatch Bar */}
                    <div className="flex items-center gap-1.5 h-6 rounded-lg overflow-hidden border border-black/10">
                      {preset.previewColors.map((color, cIdx) => (
                        <div
                          key={cIdx}
                          className="h-full flex-1"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>

                    <div>
                      <h5 className="text-xs font-bold text-neutral-900">{preset.name}</h5>
                      <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Color Palette Controls */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
            <h4 className="font-serif text-base font-bold text-neutral-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#7B2435]" />
              <span>Granular Custom Color Adjustments</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Primary Color */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-700">
                  Primary Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => {
                      handleInputChange('primaryColor', e.target.value);
                      handleInputChange('themeId', 'custom');
                    }}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-neutral-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="flex-1 font-mono text-xs uppercase px-3 py-2 border border-neutral-300 rounded-xl"
                  />
                </div>
                <p className="text-[11px] text-neutral-400">Buttons, Main Title, Active Badges</p>
              </div>

              {/* Primary Hover Color */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-700">
                  Primary Hover Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primaryHover}
                    onChange={(e) => handleInputChange('primaryHover', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-neutral-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.primaryHover}
                    onChange={(e) => handleInputChange('primaryHover', e.target.value)}
                    className="flex-1 font-mono text-xs uppercase px-3 py-2 border border-neutral-300 rounded-xl"
                  />
                </div>
                <p className="text-[11px] text-neutral-400">Hover states on interactive buttons</p>
              </div>

              {/* Secondary Accent */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-700">
                  Secondary Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-neutral-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    className="flex-1 font-mono text-xs uppercase px-3 py-2 border border-neutral-300 rounded-xl"
                  />
                </div>
                <p className="text-[11px] text-neutral-400">Borders, Subtitles, Highlights</p>
              </div>

              {/* Background Canvas Tint */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-neutral-700">
                  Store Canvas Background Tint
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-neutral-300 p-0.5"
                  />
                  <input
                    type="text"
                    value={formData.backgroundColor}
                    onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                    className="flex-1 font-mono text-xs uppercase px-3 py-2 border border-neutral-300 rounded-xl"
                  />
                </div>
                <p className="text-[11px] text-neutral-400">Warm Ivory, Silk, or Clean White</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Store Name & Logo Upload */}
      {activeTab === 'identity' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
          <h4 className="font-serif text-base font-bold text-neutral-900 flex items-center gap-2">
            <Type className="w-4 h-4 text-[#7B2435]" />
            <span>Store Brand Identity & Logo</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Store Name */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Brand / Store Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => handleInputChange('storeName', e.target.value)}
                placeholder="e.g. Nandita Fashion"
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold text-neutral-900 focus:outline-none focus:border-[#7B2435]"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Displayed in the main header, footer, invoices, and tab title.
              </p>
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Brand Tagline / Subtitle
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                placeholder="e.g. Ethnic & Kurti Studio"
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-none focus:border-[#7B2435]"
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Displayed below the brand logo in the navigation bar.
              </p>
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="pt-4 border-t border-neutral-100 space-y-4">
            <label className="block text-xs font-bold text-neutral-700">
              Brand Logo Image
            </label>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Logo Preview box */}
              <div className="w-32 h-24 rounded-2xl bg-[#FAF6F0] border-2 border-dashed border-[#C98C97] flex items-center justify-center p-2 relative overflow-hidden flex-shrink-0">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Brand Logo Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center text-neutral-400">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <span className="text-[10px]">No Logo Uploaded</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Image File (PNG, SVG, JPG)
                  </button>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => handleInputChange('logoUrl', '')}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Logo
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-neutral-500">Or Paste Image Direct URL:</span>
                  <input
                    type="text"
                    value={formData.logoUrl || ''}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    placeholder="https://example.com/nandita-logo.png"
                    className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-1.5 text-xs text-neutral-800"
                  />
                </div>
              </div>
            </div>

            {/* Logo Display Mode */}
            <div className="pt-3">
              <label className="block text-xs font-bold text-neutral-700 mb-2">
                Header Display Mode
              </label>
              <div className="flex items-center gap-4 text-xs font-medium">
                {[
                  { value: 'both', label: 'Logo Image + Brand Text' },
                  { value: 'image', label: 'Logo Image Only' },
                  { value: 'text', label: 'Typography Text Only' },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="logoType"
                      value={opt.value}
                      checked={formData.logoType === opt.value}
                      onChange={() => handleInputChange('logoType', opt.value)}
                      className="accent-[#7B2435]"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Announcements & Promo Codes */}
      {activeTab === 'announcements' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
          <h4 className="font-serif text-base font-bold text-neutral-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#7B2435]" />
            <span>Storefront Announcements & Promo Codes</span>
          </h4>

          {/* Announcement Bar text */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-neutral-700">
                Top Announcement Bar Message
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.announcementActive}
                  onChange={(e) => handleInputChange('announcementActive', e.target.checked)}
                  className="accent-[#7B2435] w-4 h-4 rounded"
                />
                <span>Enable Top Announcement Strip</span>
              </label>
            </div>

            <input
              type="text"
              value={formData.headerAnnouncementText}
              onChange={(e) => handleInputChange('headerAnnouncementText', e.target.value)}
              placeholder="e.g. Festive Launch: Use code NANDITA20 for Flat 20% OFF | COD Available Across India"
              className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-neutral-900"
            />
          </div>

          {/* Hero Banner Titles & Coupon Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-neutral-100">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Hero Banner Headline
              </label>
              <input
                type="text"
                value={formData.heroBannerTitle}
                onChange={(e) => handleInputChange('heroBannerTitle', e.target.value)}
                placeholder="The Royal Festive Weaves '26"
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-4 py-2.5 text-xs text-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Hero Subtitle Description
              </label>
              <input
                type="text"
                value={formData.heroBannerSubtitle}
                onChange={(e) => handleInputChange('heroBannerSubtitle', e.target.value)}
                placeholder="Handcrafted pure cotton, mulmul, and chanderi kurtas..."
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-4 py-2.5 text-xs text-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Storewide Featured Coupon Code
              </label>
              <input
                type="text"
                value={formData.couponPromoCode}
                onChange={(e) => handleInputChange('couponPromoCode', e.target.value.toUpperCase())}
                placeholder="NANDITA20"
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-4 py-2.5 font-mono text-xs font-bold uppercase text-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Free Shipping Threshold Amount (₹)
              </label>
              <input
                type="number"
                value={formData.freeShippingThreshold}
                onChange={(e) => handleInputChange('freeShippingThreshold', Number(e.target.value) || 0)}
                placeholder="999"
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-4 py-2.5 text-xs text-neutral-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Studio & Support Contact */}
      {activeTab === 'contact' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-xs space-y-6">
          <h4 className="font-serif text-base font-bold text-neutral-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#7B2435]" />
            <span>Store Contact & Footer Information</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Customer Care Email
              </label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                placeholder="care@nanditafashion.com"
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-4 py-2.5 text-xs text-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Customer Care Phone / WhatsApp
              </label>
              <input
                type="text"
                value={formData.supportPhone}
                onChange={(e) => handleInputChange('supportPhone', e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-4 py-2.5 text-xs text-neutral-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Studio Boutique Address
              </label>
              <input
                type="text"
                value={formData.addressText}
                onChange={(e) => handleInputChange('addressText', e.target.value)}
                placeholder="Nandita Fashion Studio, Indiranagar, Bengaluru"
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-4 py-2.5 text-xs text-neutral-900"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
