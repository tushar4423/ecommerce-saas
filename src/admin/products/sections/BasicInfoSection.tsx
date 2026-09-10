import React from 'react';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Category, Product } from '../../../types';
import { slugify } from '../../../utils/formatters';

export interface BasicInfoSectionProps {
  formData: Partial<Product>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Product>>>;
  categories: Category[];
  errors: Record<string, string>;
}

const DEFAULT_CATEGORY_OPTIONS = [
  { value: 'Women', label: 'Women' },
  { value: 'Men', label: 'Men' },
  { value: 'Festive Edit', label: 'Festive Edit' },
  { value: 'Plus Size', label: 'Plus Size' },
];

const DEFAULT_SUBCATEGORIES = [
  'Kurtas & Kurtis',
  'Kurta Sets',
  'Anarkalis',
  'Sarees',
  'Co-ord Sets',
  'Ethnic Dresses',
  'Dupattas & Stoles',
];

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  setFormData,
  categories,
  errors,
}) => {
  const categoryOptions =
    categories && categories.length > 0
      ? categories.map((c) => ({ value: c.name, label: c.name }))
      : DEFAULT_CATEGORY_OPTIONS;

  const currentCat = formData.category || categoryOptions[0]?.value || 'Women';
  const selectedCategory = categories?.find(
    (c) => c.name === currentCat || c.slug === currentCat
  );

  const subcategories =
    selectedCategory?.subcategories && selectedCategory.subcategories.length > 0
      ? selectedCategory.subcategories
      : DEFAULT_SUBCATEGORIES;

  const handleNameChange = (name: string) => {
    setFormData((prev) => {
      // If slug was empty or auto-derived from prior name, keep updating slug
      const currentSlug = prev.slug || '';
      const prevExpectedSlug = prev.name ? slugify(prev.name) : '';
      const shouldAutoUpdateSlug = !currentSlug || currentSlug === prevExpectedSlug;

      return {
        ...prev,
        name,
        slug: shouldAutoUpdateSlug ? slugify(name) : currentSlug,
      };
    });
  };

  const handleCategoryChange = (newCat: string) => {
    const matchingCat = categories?.find((c) => c.name === newCat || c.slug === newCat);
    const newSubcats =
      matchingCat?.subcategories && matchingCat.subcategories.length > 0
        ? matchingCat.subcategories
        : DEFAULT_SUBCATEGORIES;

    setFormData((prev) => ({
      ...prev,
      category: newCat,
      subcategory: newSubcats[0] || 'Kurtas & Kurtis',
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Product Name"
          required
          placeholder="e.g. Maroon Handloom Cotton A-Line Kurti"
          value={formData.name || ''}
          onChange={(e) => handleNameChange(e.target.value)}
          error={errors.name}
        />

        <Input
          label="Product SKU"
          required
          placeholder="e.g. NF-KRT-101"
          value={formData.sku || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
          error={errors.sku}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select
          label="Category"
          required
          value={currentCat}
          onChange={(e) => handleCategoryChange(e.target.value)}
          options={categoryOptions}
        />

        <Select
          label="Subcategory"
          required
          value={formData.subcategory || subcategories[0] || 'Kurtas & Kurtis'}
          onChange={(e) => setFormData((prev) => ({ ...prev, subcategory: e.target.value }))}
          options={subcategories.map((s) => ({ value: s, label: s }))}
        />

        <Input
          label="URL Slug"
          placeholder="auto-generated-slug"
          value={formData.slug || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
          helperText="Unique web address identifier"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-neutral-700">Product Description</label>
        <textarea
          rows={3}
          value={formData.description || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the fabric weave, embroidery details, fit, and artisan touch..."
          className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#7B2435] focus:ring-2 focus:ring-[#7B2435]/15"
        />
      </div>

      <div className="flex items-center gap-6 pt-2">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-700">
          <input
            type="checkbox"
            checked={Boolean(formData.isBestseller)}
            onChange={(e) => setFormData((prev) => ({ ...prev, isBestseller: e.target.checked }))}
            className="w-4 h-4 rounded text-[#7B2435] accent-[#7B2435]"
          />
          <span>Mark as Bestseller</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-700">
          <input
            type="checkbox"
            checked={Boolean(formData.isNewArrival)}
            onChange={(e) => setFormData((prev) => ({ ...prev, isNewArrival: e.target.checked }))}
            className="w-4 h-4 rounded text-[#7B2435] accent-[#7B2435]"
          />
          <span>Mark as New Arrival</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-700">
          <input
            type="checkbox"
            checked={Boolean(formData.isTrending)}
            onChange={(e) => setFormData((prev) => ({ ...prev, isTrending: e.target.checked }))}
            className="w-4 h-4 rounded text-[#7B2435] accent-[#7B2435]"
          />
          <span>Trending Choice</span>
        </label>
      </div>
    </div>
  );
};
