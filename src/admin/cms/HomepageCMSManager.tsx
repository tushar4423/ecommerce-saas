import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  LayoutGrid, 
  Check, 
  Edit, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Layers, 
  Filter, 
  Image as ImageIcon, 
  Sliders, 
  ArrowRight,
  Database
} from 'lucide-react';
import { 
  useGetHomepageSectionsQuery, 
  useSaveHomepageSectionsMutation,
  useGetCategoriesQuery,
  useGetCollectionsQuery,
  useCreateAuditLogMutation
} from '../../store/api/ecommerceApi';
import { HomepageSectionConfig, HomepageSectionType } from '../../types';
import { useToast } from '../../hooks/useToast';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ImageUploadDropzone } from '../../components/ui/ImageUploadDropzone';

const SECTION_TYPE_LABELS: Record<HomepageSectionType, { label: string; desc: string; icon: string }> = {
  hero_banner_slider: { label: 'Hero Banner Slider', desc: 'Full-width cinematic responsive banner slider with CTAs', icon: '🖼️' },
  features_strip: { label: 'Trust & Features Strip', desc: '4-column promises bar (Free Shipping, COD, Handcrafted, Easy Returns)', icon: '🛡️' },
  category_circles: { label: 'Category Silhouettes', desc: 'Circular thumbnail shortcuts for top silhouettes & fabrics', icon: '⭕' },
  product_carousel: { label: 'Product Carousel Slider', desc: 'Horizontal scrollable showcase of filtered products', icon: '🎠' },
  product_grid: { label: 'Product Responsive Grid', desc: 'Bento/Multi-column curated product showcase with live filters', icon: '📐' },
  collection_banner: { label: 'Curated Collection Highlight', desc: 'Large editorial banner with shop link & rich copy', icon: '🎨' },
  promo_split_banner: { label: 'Dual Promo Split Banners', desc: 'Two side-by-side promotional offer tiles', icon: '🪟' },
  testimonials: { label: 'Patron Reviews & Testimonials', desc: 'Verified buyer testimonials and boutique star ratings', icon: '⭐' },
  instagram_feed: { label: 'Instagram UGC Wall', desc: 'Social proof boutique gallery with patron mentions', icon: '📸' },
  brand_story: { label: 'Brand Story & Heritage', desc: 'Editorial artisan craft story & studio roots', icon: '📜' },
  newsletter_signup: { label: 'VIP Newsletter & Rewards', desc: 'Email club subscription banner with discount perk', icon: '✉️' },
  custom_html: { label: 'Custom HTML / Rich Text', desc: 'Customizable rich content block', icon: '💻' },
};

export const HomepageCMSManager: React.FC = () => {
  const toast = useToast();
  const { data: sections = [], isLoading } = useGetHomepageSectionsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: collections = [] } = useGetCollectionsQuery();
  const [saveSections, { isLoading: isSaving }] = useSaveHomepageSectionsMutation();
  const [createAuditLog] = useCreateAuditLogMutation();

  const [editingSection, setEditingSection] = useState<Partial<HomepageSectionConfig> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToggleActive = async (id: string) => {
    const target = sections.find((s) => s.id === id);
    const newStatus = !target?.isActive;
    const updated = sections.map((sec) =>
      sec.id === id ? { ...sec, isActive: newStatus } : sec
    );
    try {
      await saveSections(updated).unwrap();
      await createAuditLog({
        adminId: 'adm-current',
        adminName: 'Admin User',
        adminEmail: 'admin@vedaaya.in',
        action: 'cms_update',
        entityType: 'CMS',
        entityId: id,
        entityName: target?.title || 'Homepage Section',
        details: `Toggled homepage section "${target?.title}" visibility to ${newStatus ? 'Active' : 'Hidden'}`,
        previousValue: { isActive: !newStatus },
        newValue: { isActive: newStatus },
      });
      toast.success(`Section "${target?.title || ''}" is now ${newStatus ? 'Active' : 'Hidden'}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update section visibility');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;

    const list = [...sections];
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;

    const reordered = list.map((sec, i) => ({ ...sec, order: i + 1 }));

    try {
      await saveSections(reordered).unwrap();
      toast.success('Homepage section layout sequence updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reorder sections');
    }
  };

  const handleDelete = async (id: string) => {
    const target = sections.find((s) => s.id === id);
    if (!window.confirm(`Remove section "${target?.title || 'this section'}" from the homepage layout?`)) return;
    const filtered = sections.filter((s) => s.id !== id).map((sec, idx) => ({ ...sec, order: idx + 1 }));
    try {
      await saveSections(filtered).unwrap();
      await createAuditLog({
        adminId: 'adm-current',
        adminName: 'Admin User',
        adminEmail: 'admin@vedaaya.in',
        action: 'cms_update',
        entityType: 'CMS',
        entityId: id,
        entityName: target?.title || 'Section',
        details: `Deleted homepage section "${target?.title}"`,
      });
      toast.success('Section removed from homepage');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove section');
    }
  };

  const handleSaveModal = async () => {
    if (!editingSection?.title?.trim()) {
      toast.error('Section Title is required');
      return;
    }

    let updatedList: HomepageSectionConfig[];
    if (editingSection.id) {
      updatedList = sections.map((s) =>
        s.id === editingSection.id ? ({ ...s, ...editingSection } as HomepageSectionConfig) : s
      );
    } else {
      const newSec: HomepageSectionConfig = {
        id: `sec-${Date.now()}`,
        type: (editingSection.type as HomepageSectionType) || 'product_carousel',
        title: editingSection.title,
        subtitle: editingSection.subtitle || '',
        badge: editingSection.badge || '',
        order: sections.length + 1,
        isActive: true,
        layout: editingSection.layout || 'carousel',
        categorySlug: editingSection.categorySlug,
        collectionSlug: editingSection.collectionSlug,
        filterCriteria: editingSection.filterCriteria || { limit: 8 },
        imageUrl: editingSection.imageUrl,
        linkUrl: editingSection.linkUrl,
        ctaText: editingSection.ctaText,
      };
      updatedList = [...sections, newSec];
    }

    try {
      await saveSections(updatedList).unwrap();
      await createAuditLog({
        adminId: 'adm-current',
        adminName: 'Admin User',
        adminEmail: 'admin@vedaaya.in',
        action: 'cms_update',
        entityType: 'CMS',
        entityId: editingSection.id || 'new_sec',
        entityName: editingSection.title,
        details: `Updated homepage section configuration for "${editingSection.title}" (Layout: ${editingSection.layout || 'default'})`,
        newValue: editingSection,
      });
      toast.success('Homepage section configuration saved!');
      setIsModalOpen(false);
      setEditingSection(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save section');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-[#7B2435]" />
            Homepage Section & CMS Builder
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Enable/disable sections, adjust display order, change titles, select layouts, and connect dynamic data sources without code changes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingSection({
              title: '',
              subtitle: '',
              badge: 'Exclusive',
              type: 'product_carousel',
              layout: 'carousel',
              isActive: true,
              filterCriteria: {
                isBestseller: false,
                isNewArrival: true,
                isTrending: false,
                isPlusSize: false,
                isFestive: false,
                limit: 8,
              },
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7B2435] hover:bg-[#621C2A] text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Storefront Section
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-neutral-400 text-sm">Loading dynamic homepage sections...</div>
      ) : sections.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-neutral-300">
          <Sparkles className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-neutral-700">No homepage sections defined</p>
          <p className="text-xs text-neutral-500 mt-1">Click &quot;Add Storefront Section&quot; to configure your homepage.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((sec, idx) => {
            const meta = SECTION_TYPE_LABELS[sec.type] || { label: sec.type, desc: '', icon: '📦' };
            return (
              <div
                key={sec.id}
                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border transition ${
                  sec.isActive ? 'bg-white border-neutral-200 shadow-xs' : 'bg-neutral-50 border-neutral-200 opacity-60'
                }`}
              >
                <div className="flex items-start md:items-center gap-4">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 text-neutral-400">
                    <button
                      type="button"
                      disabled={idx === 0 || isSaving}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1 hover:text-neutral-700 disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sections.length - 1 || isSaving}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1 hover:text-neutral-700 disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-700 shrink-0 border border-neutral-200">
                    #{idx + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">{meta.icon}</span>
                      <h4 className="text-sm font-bold text-neutral-900">{sec.title}</h4>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#7B2435]/10 text-[#7B2435]">
                        {meta.label}
                      </span>
                      {sec.layout && (
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-neutral-100 text-neutral-600">
                          Layout: {sec.layout}
                        </span>
                      )}
                      {sec.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
                          {sec.badge}
                        </span>
                      )}
                    </div>
                    {sec.subtitle && <p className="text-xs text-neutral-500 mt-0.5">{sec.subtitle}</p>}
                    
                    {/* Source Information */}
                    <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-1">
                      {sec.categorySlug && (
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3 text-neutral-400" /> Category: <strong className="text-neutral-600">{sec.categorySlug}</strong>
                        </span>
                      )}
                      {sec.collectionSlug && (
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3 text-neutral-400" /> Collection: <strong className="text-neutral-600">{sec.collectionSlug}</strong>
                        </span>
                      )}
                      {sec.filterCriteria?.isBestseller && <span className="text-amber-700 font-bold">• Bestsellers</span>}
                      {sec.filterCriteria?.isNewArrival && <span className="text-blue-700 font-bold">• New Arrivals</span>}
                      {sec.filterCriteria?.isFestive && <span className="text-purple-700 font-bold">• Festive</span>}
                      {sec.filterCriteria?.limit && <span>• Limit: {sec.filterCriteria.limit} items</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(sec.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                      sec.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                    }`}
                  >
                    {sec.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {sec.isActive ? 'Active' : 'Hidden'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSection(sec);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer transition"
                    title="Edit Section Configuration"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(sec.id)}
                    className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer transition"
                    title="Delete Section"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Create Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingSection?.id ? 'Configure Homepage Section' : 'Add New Homepage Section'}
          size="lg"
          footer={
            <>
              <Button variant="outline" size="md" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="md" isLoading={isSaving} onClick={handleSaveModal}>
                Save Section Configuration
              </Button>
            </>
          }
        >
          <div className="space-y-6">
            {/* Section Type & Layout Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Section Component Type *</label>
                <select
                  value={editingSection?.type || 'product_carousel'}
                  onChange={(e) =>
                    setEditingSection((prev) => ({ ...prev, type: e.target.value as HomepageSectionType }))
                  }
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white font-medium"
                >
                  {Object.entries(SECTION_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.icon} {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Display Layout Style *</label>
                <select
                  value={editingSection?.layout || 'carousel'}
                  onChange={(e) =>
                    setEditingSection((prev) => ({ ...prev, layout: e.target.value as any }))
                  }
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white font-medium"
                >
                  <option value="carousel">🎠 Carousel (Horizontal Scroll Slider)</option>
                  <option value="grid">📐 Grid (4 or 3 Column Responsive)</option>
                  <option value="split">🪟 Split (Side-by-side Dual Cards)</option>
                  <option value="banner">🖼️ Full Width Editorial Banner</option>
                  <option value="masonry">🧱 Bento / Masonry Gallery</option>
                </select>
              </div>
            </div>

            {/* Title, Subtitle, Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Section Title *"
                  required
                  placeholder="e.g. Trending Festive Anarkalis"
                  value={editingSection?.title || ''}
                  onChange={(e) => setEditingSection((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Input
                  label="Badge / Tag"
                  placeholder="e.g. Top Seller, Festive Edit"
                  value={editingSection?.badge || ''}
                  onChange={(e) => setEditingSection((prev) => ({ ...prev, badge: e.target.value }))}
                />
              </div>
            </div>

            <Input
              label="Subtitle / Description"
              placeholder="e.g. Handcrafted pure mulmul & chanderi sets curated for celebrations"
              value={editingSection?.subtitle || ''}
              onChange={(e) => setEditingSection((prev) => ({ ...prev, subtitle: e.target.value }))}
            />

            {/* Data Source Configuration */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#7B2435]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Data Source & Catalog Filtering
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Filter by Category</label>
                  <select
                    value={editingSection?.categorySlug || ''}
                    onChange={(e) =>
                      setEditingSection((prev) => ({
                        ...prev,
                        categorySlug: e.target.value || undefined,
                        filterCriteria: { ...(prev?.filterCriteria || {}), category: e.target.value || undefined },
                      }))
                    }
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white"
                  >
                    <option value="">All Categories (Default)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Filter by Collection</label>
                  <select
                    value={editingSection?.collectionSlug || ''}
                    onChange={(e) =>
                      setEditingSection((prev) => ({
                        ...prev,
                        collectionSlug: e.target.value || undefined,
                      }))
                    }
                    className="w-full text-xs p-2.5 border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white"
                  >
                    <option value="">No Collection Filter</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.slug}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tag / Flag Filters */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">Filter Flags & Tags</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-neutral-800 cursor-pointer p-2 rounded-lg bg-white border border-neutral-200">
                    <input
                      type="checkbox"
                      checked={editingSection?.filterCriteria?.isBestseller || false}
                      onChange={(e) =>
                        setEditingSection((prev) => ({
                          ...prev,
                          filterCriteria: { ...(prev?.filterCriteria || {}), isBestseller: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-[#7B2435]"
                    />
                    <span>Bestsellers</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-neutral-800 cursor-pointer p-2 rounded-lg bg-white border border-neutral-200">
                    <input
                      type="checkbox"
                      checked={editingSection?.filterCriteria?.isNewArrival || false}
                      onChange={(e) =>
                        setEditingSection((prev) => ({
                          ...prev,
                          filterCriteria: { ...(prev?.filterCriteria || {}), isNewArrival: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-[#7B2435]"
                    />
                    <span>New Arrivals</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-neutral-800 cursor-pointer p-2 rounded-lg bg-white border border-neutral-200">
                    <input
                      type="checkbox"
                      checked={editingSection?.filterCriteria?.isTrending || false}
                      onChange={(e) =>
                        setEditingSection((prev) => ({
                          ...prev,
                          filterCriteria: { ...(prev?.filterCriteria || {}), isTrending: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-[#7B2435]"
                    />
                    <span>Trending</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-medium text-neutral-800 cursor-pointer p-2 rounded-lg bg-white border border-neutral-200">
                    <input
                      type="checkbox"
                      checked={editingSection?.filterCriteria?.isFestive || false}
                      onChange={(e) =>
                        setEditingSection((prev) => ({
                          ...prev,
                          filterCriteria: { ...(prev?.filterCriteria || {}), isFestive: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-[#7B2435]"
                    />
                    <span>Festive Special</span>
                  </label>
                </div>
              </div>

              {/* Product Limit */}
              <div className="max-w-xs">
                <Input
                  label="Product Limit (Count)"
                  type="number"
                  min={2}
                  max={24}
                  value={editingSection?.filterCriteria?.limit ?? 8}
                  onChange={(e) =>
                    setEditingSection((prev) => ({
                      ...prev,
                      filterCriteria: { ...(prev?.filterCriteria || {}), limit: Number(e.target.value) || 8 },
                    }))
                  }
                />
              </div>
            </div>

            {/* Banner Media & CTA (if applicable) */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                Banner Artwork & Call-to-Action (For Banner Sections)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="CTA Button Label"
                  placeholder="e.g. Explore Kurti Sets"
                  value={editingSection?.ctaText || ''}
                  onChange={(e) => setEditingSection((prev) => ({ ...prev, ctaText: e.target.value }))}
                />
                <Input
                  label="CTA Link / URL"
                  placeholder="e.g. /catalog?category=anarkali"
                  value={editingSection?.linkUrl || ''}
                  onChange={(e) => setEditingSection((prev) => ({ ...prev, linkUrl: e.target.value }))}
                />
              </div>
              <Input
                label="Banner Image URL"
                placeholder="https://..."
                value={editingSection?.imageUrl || ''}
                onChange={(e) => setEditingSection((prev) => ({ ...prev, imageUrl: e.target.value }))}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
