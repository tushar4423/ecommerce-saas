import React from 'react';
import { Input } from '../../../components/ui/Input';
import { Product } from '../../../types';

export interface SeoSectionProps {
  formData: Partial<Product>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Product>>>;
}

export const SeoSection: React.FC<SeoSectionProps> = ({ formData, setFormData }) => {
  const metaTitle = formData.seo?.metaTitle || formData.name || '';
  const metaDescription =
    formData.seo?.metaDescription ||
    `Shop ${formData.name || 'Ethnic Kurti'} crafted with premium ${formData.fabric || 'Cotton'} at Nandita Fashion. Best prices, fast shipping.`;
  const keywords = formData.seo?.keywords?.join(', ') || 'kurti, ethnic wear, nandita fashion, cotton kurti';

  const handleMetaTitleChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      seo: {
        metaTitle: val,
        metaDescription: prev.seo?.metaDescription || '',
        keywords: prev.seo?.keywords || [],
      },
    }));
  };

  const handleMetaDescChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      seo: {
        metaTitle: prev.seo?.metaTitle || '',
        metaDescription: val,
        keywords: prev.seo?.keywords || [],
      },
    }));
  };

  const handleKeywordsChange = (val: string) => {
    const list = val.split(',').map((k) => k.trim()).filter(Boolean);
    setFormData((prev) => ({
      ...prev,
      seo: {
        metaTitle: prev.seo?.metaTitle || '',
        metaDescription: prev.seo?.metaDescription || '',
        keywords: list,
      },
    }));
  };

  return (
    <div className="space-y-4">
      <Input
        label="SEO Meta Title"
        placeholder="e.g. Pure Cotton Maroon Kurti | Nandita Fashion Ethnic Store"
        value={metaTitle}
        onChange={(e) => handleMetaTitleChange(e.target.value)}
        helperText={`${metaTitle.length} / 60 characters recommended`}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-neutral-700">SEO Meta Description</label>
        <textarea
          rows={3}
          value={metaDescription}
          onChange={(e) => handleMetaDescChange(e.target.value)}
          placeholder="Brief meta description for search engine result snippets..."
          className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#7B2435] focus:ring-2 focus:ring-[#7B2435]/15"
        />
        <p className="text-xs text-neutral-400">{metaDescription.length} / 160 characters recommended</p>
      </div>

      <Input
        label="Target Keywords (comma-separated)"
        placeholder="cotton kurti, handloom, festive kurti set, a-line kurti"
        value={keywords}
        onChange={(e) => handleKeywordsChange(e.target.value)}
      />

      {/* Google Search Snippet Live Preview */}
      <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-xs space-y-1">
        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
          Search Engine Live Preview
        </span>
        <div className="text-xs text-emerald-800 font-mono">
          https://nanditafashion.com/products/{formData.slug || 'handcrafted-ethnic-kurti'}
        </div>
        <div className="text-sm font-medium text-blue-800 hover:underline cursor-pointer">
          {metaTitle || 'Handcrafted Ethnic Kurti | Nandita Fashion'}
        </div>
        <div className="text-xs text-neutral-600 line-clamp-2">
          {metaDescription || 'Explore authentic handcrafted kurtis made with love.'}
        </div>
      </div>
    </div>
  );
};
