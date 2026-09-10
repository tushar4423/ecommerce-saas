import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Globe,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import { DataTable, Column } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ImageUploadDropzone } from '../../components/ui/ImageUploadDropzone';
import { Category } from '../../types';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../../store/api/ecommerceApi';
import { slugify } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import { api } from '../../services/api';

export const CategoryManager: React.FC = () => {
  const toast = useToast();
  const { data: categories = [], isLoading, refetch } = useGetCategoriesQuery();
  const [createCategory] = useCreateCategoryMutation();
  const [updateCategory] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'seo' | 'banner'>('basic');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
    bannerImage: '',
    parentId: '',
    subcategories: 'Straight Kurtis, Anarkali Kurtis, A-Line Kurtis, Short Kurtis',
    featured: true,
    showInNavbar: true,
    showInHome: true,
    displayOrder: 1,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
      bannerImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80',
      parentId: '',
      subcategories: 'Straight Kurtis, Anarkali Kurtis, A-Line Kurtis, Short Kurtis',
      featured: true,
      showInNavbar: true,
      showInHome: true,
      displayOrder: categories.length + 1,
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      image: cat.image || '',
      bannerImage: cat.bannerImage || '',
      parentId: cat.parentId || '',
      subcategories: cat.subcategories ? cat.subcategories.join(', ') : '',
      featured: Boolean(cat.featured),
      showInNavbar: cat.showInNavbar !== false,
      showInHome: cat.showInHome !== false,
      displayOrder: cat.displayOrder || 1,
      seoTitle: cat.seo?.title || '',
      seoDescription: cat.seo?.description || '',
      seoKeywords: cat.seo?.keywords?.join(', ') || '',
    });
    setActiveTab('basic');
    setIsModalOpen(true);
  };

  const handleDelete = async (cat: Category) => {
    if (window.confirm(`Delete category "${cat.name}"? This may affect products categorized under it.`)) {
      try {
        await deleteCategory(cat.id).unwrap();
        toast.success(`Category "${cat.name}" deleted.`);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete category');
      }
    }
  };

  const handleToggleVisibility = async (cat: Category, field: 'showInNavbar' | 'showInHome' | 'featured') => {
    const currentVal = (cat as any)[field] ?? (field === 'featured' ? false : true);
    try {
      await updateCategory({ id: cat.id, updates: { [field]: !currentVal } }).unwrap();
      toast.success(`Updated ${field} for "${cat.name}".`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update visibility');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newOrder = [...categories];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    const orderedIds = newOrder.map((c) => c.id);
    try {
      await api.reorderCategories(orderedIds);
      toast.success('Category order updated!');
      refetch();
    } catch {
      toast.error('Failed to reorder categories');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    const subcats = formData.subcategories
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const keywords = formData.seoKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const payload: Partial<Category> = {
      name: formData.name,
      slug: formData.slug || slugify(formData.name),
      description: formData.description,
      image: formData.image,
      bannerImage: formData.bannerImage,
      parentId: formData.parentId || undefined,
      subcategories: subcats,
      featured: formData.featured,
      showInNavbar: formData.showInNavbar,
      showInHome: formData.showInHome,
      displayOrder: Number(formData.displayOrder) || 1,
      seo: {
        title: formData.seoTitle || `${formData.name} Collection | Nandita Fashion`,
        description: formData.seoDescription || formData.description,
        keywords,
      },
    };

    try {
      if (editingCategory) {
        await updateCategory({ id: editingCategory.id, updates: payload }).unwrap();
        toast.success(`Category "${formData.name}" updated!`);
      } else {
        await createCategory(payload).unwrap();
        toast.success(`Created new category "${formData.name}"!`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save category');
    }
  };

  const sortedCategories = [...categories].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const columns: Column<Category>[] = [
    {
      key: 'displayOrder',
      header: 'Order',
      className: 'w-20 text-center',
      render: (cat, idx) => (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            disabled={idx === 0}
            onClick={() => handleMove(idx, 'up')}
            className="p-1 text-neutral-400 hover:text-[#7B2435] disabled:opacity-20 cursor-pointer"
            title="Move Up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-bold text-neutral-600">{idx + 1}</span>
          <button
            type="button"
            disabled={idx === categories.length - 1}
            onClick={() => handleMove(idx, 'down')}
            className="p-1 text-neutral-400 hover:text-[#7B2435] disabled:opacity-20 cursor-pointer"
            title="Move Down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Category & Image',
      render: (cat) => {
        const parentCat = categories.find((c) => c.id === cat.parentId);
        return (
          <div className="flex items-center gap-3">
            {cat.image ? (
              <img
                src={cat.image}
                alt={cat.name}
                referrerPolicy="no-referrer"
                className="w-11 h-11 object-cover rounded-xl border border-neutral-200"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-[#FAF6F0] text-[#7B2435] flex items-center justify-center font-serif font-black text-sm border border-[#EADBDA]">
                {cat.name[0]}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                {cat.name}
                {parentCat && (
                  <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.2 rounded font-normal">
                    Sub of {parentCat.name}
                  </span>
                )}
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">/{cat.slug}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'subcategories',
      header: 'Subcategories',
      render: (cat) => (
        <div className="flex flex-wrap gap-1 max-w-sm">
          {cat.subcategories?.map((s, idx) => (
            <span
              key={idx}
              className="text-[10px] bg-[#FAF6F0] text-neutral-700 border border-[#EADBDA] px-2 py-0.5 rounded-full font-medium"
            >
              {s}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'visibility',
      header: 'Display Visibility',
      render: (cat) => (
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleToggleVisibility(cat, 'showInNavbar')}
            className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition cursor-pointer border ${
              cat.showInNavbar !== false
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-neutral-100 text-neutral-400 border-neutral-200'
            }`}
          >
            Navbar: {cat.showInNavbar !== false ? 'ON' : 'OFF'}
          </button>
          <button
            type="button"
            onClick={() => handleToggleVisibility(cat, 'showInHome')}
            className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition cursor-pointer border ${
              cat.showInHome !== false
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-neutral-100 text-neutral-400 border-neutral-200'
            }`}
          >
            Home: {cat.showInHome !== false ? 'ON' : 'OFF'}
          </button>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (cat) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenEdit(cat)}
            className="p-1.5 text-neutral-500 hover:text-[#7B2435] hover:bg-[#FAF6F0] rounded-lg cursor-pointer transition"
            title="Edit Category"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(cat)}
            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
            title="Delete Category"
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
        title="Category & Menu Taxonomy"
        subtitle="Manage storefront categories, parent-child hierarchies, SEO tags, reordering, and hero banners."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Category
          </Button>
        }
      />

      <DataTable
        data={sortedCategories}
        columns={columns}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search categories by name, slug or subcategory..."
        searchFilter={(c, q) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          (c.subcategories || []).some((s) => s.toLowerCase().includes(q))
        }
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleSave}>
              Save Category
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Modal Tabs */}
          <div className="flex border-b border-neutral-200 gap-4 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`pb-2 text-xs font-bold transition border-b-2 ${
                activeTab === 'basic'
                  ? 'border-[#7B2435] text-[#7B2435]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              General & Hierarchy
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('banner')}
              className={`pb-2 text-xs font-bold transition border-b-2 ${
                activeTab === 'banner'
                  ? 'border-[#7B2435] text-[#7B2435]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Media & Banners
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('seo')}
              className={`pb-2 text-xs font-bold transition border-b-2 ${
                activeTab === 'seo'
                  ? 'border-[#7B2435] text-[#7B2435]'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Search Engine SEO
            </button>
          </div>

          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Category Name"
                  required
                  placeholder="e.g. Daily Wear Kurtis"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      name: e.target.value,
                      slug: p.slug || slugify(e.target.value),
                    }))
                  }
                />

                <Input
                  label="Category URL Slug"
                  placeholder="daily-wear-kurtis"
                  value={formData.slug}
                  onChange={(e) => setFormData((p) => ({ ...p, slug: slugify(e.target.value) }))}
                />
              </div>

              {/* Parent Category Hierarchy */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-700">
                  Parent Category (Optional Hierarchy)
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData((p) => ({ ...p, parentId: e.target.value }))}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7B2435]"
                >
                  <option value="">None (Top-Level Primary Category)</option>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <Input
                label="Subcategories (comma-separated tags)"
                placeholder="Straight Kurtis, Anarkali Kurtis, A-Line, Short Kurtis"
                value={formData.subcategories}
                onChange={(e) => setFormData((p) => ({ ...p, subcategories: e.target.value }))}
                helperText="Subcategories appear in store navigation dropdowns and PLP filters."
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-700">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description for category banner and meta tags..."
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#7B2435]"
                />
              </div>

              {/* Visibility checkboxes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-[#FAF6F0] rounded-2xl border border-[#EADBDA]">
                <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showInNavbar}
                    onChange={(e) => setFormData((p) => ({ ...p, showInNavbar: e.target.checked }))}
                    className="accent-[#7B2435] rounded"
                  />
                  <span>Show in Top Navbar</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showInHome}
                    onChange={(e) => setFormData((p) => ({ ...p, showInHome: e.target.checked }))}
                    className="accent-[#7B2435] rounded"
                  />
                  <span>Show on Homepage</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData((p) => ({ ...p, featured: e.target.checked }))}
                    className="accent-[#7B2435] rounded"
                  />
                  <span>Featured Collection</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'banner' && (
            <div className="space-y-4">
              <ImageUploadDropzone
                compact
                label="Square Tile Image (Category Carousel & Card)"
                onImagesSelected={(urls) => {
                  if (urls.length > 0) setFormData((p) => ({ ...p, image: urls[0] }));
                }}
              />

              <Input
                label="Tile Image URL"
                placeholder="https://images.unsplash.com/..."
                value={formData.image}
                onChange={(e) => setFormData((p) => ({ ...p, image: e.target.value }))}
              />

              <div className="pt-2 border-t border-neutral-100">
                <Input
                  label="Category Header Banner Image URL"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.bannerImage}
                  onChange={(e) => setFormData((p) => ({ ...p, bannerImage: e.target.value }))}
                  helperText="Displayed at the top of the collection listing page (wide banner format 1200x350)"
                />
              </div>

              {formData.bannerImage && (
                <div className="rounded-xl overflow-hidden border border-neutral-200 h-28 relative">
                  <img
                    src={formData.bannerImage}
                    alt="Banner preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center px-4">
                    <span className="text-white font-serif font-bold text-lg">{formData.name || 'Category Header'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="space-y-4">
              <Input
                label="SEO Meta Title"
                placeholder="Designer Kurtis Online | Nandita Fashion"
                value={formData.seoTitle}
                onChange={(e) => setFormData((p) => ({ ...p, seoTitle: e.target.value }))}
                helperText="Optimal length: 50-60 characters"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-neutral-700">SEO Meta Description</label>
                <textarea
                  rows={3}
                  value={formData.seoDescription}
                  onChange={(e) => setFormData((p) => ({ ...p, seoDescription: e.target.value }))}
                  placeholder="Explore handcrafted festive kurtis in Chanderi, Silk, and Cotton..."
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7B2435]"
                />
              </div>

              <Input
                label="SEO Keywords (comma-separated)"
                placeholder="kurtis, ethnic wear, anarkali, chanderi silk"
                value={formData.seoKeywords}
                onChange={(e) => setFormData((p) => ({ ...p, seoKeywords: e.target.value }))}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
