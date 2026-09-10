import React, { useState } from 'react';
import { Plus, Trash2, Layers, Palette, Sparkles, Check } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Product, ProductVariant } from '../../../types';
import { useGetSizeGroupsQuery, useGetColorsQuery } from '../../../store/api/ecommerceApi';

export interface VariantsInventorySectionProps {
  formData: Partial<Product>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Product>>>;
}

export const VariantsInventorySection: React.FC<VariantsInventorySectionProps> = ({
  formData,
  setFormData,
}) => {
  const variants = formData.variants || [];
  const { data: sizeGroups = [] } = useGetSizeGroupsQuery();
  const { data: storeColors = [] } = useGetColorsQuery();

  const [selectedSizeGroupId, setSelectedSizeGroupId] = useState<string>('');
  const [newSize, setNewSize] = useState<string>('M');
  const [newColor, setNewColor] = useState<string>('Maroon');
  const [newColorHex, setNewColorHex] = useState<string>('#7B2435');
  const [newStock, setNewStock] = useState<number>(15);

  // Quick generate variants for an entire size group
  const handleApplySizeGroup = (groupId: string) => {
    const group = sizeGroups.find((g) => g.id === groupId);
    if (!group) return;

    const baseSku = formData.sku || 'VDY-KRT';
    const generated: ProductVariant[] = group.sizes.map((sz) => ({
      id: `v-${Date.now()}-${sz}`,
      sku: `${baseSku}-${sz}`,
      size: sz as any,
      color: newColor,
      colorHex: newColorHex,
      stock: newStock || 15,
    }));

    setFormData((prev) => ({
      ...prev,
      variants: generated,
    }));
  };

  const handleAddVariant = () => {
    const sku = `${formData.sku || 'VDY'}-${newSize}-${newColor.slice(0, 3).toUpperCase()}`;
    const newVar: ProductVariant = {
      id: `v-${Date.now()}-${newSize}`,
      sku,
      size: newSize as any,
      color: newColor,
      colorHex: newColorHex,
      stock: Number(newStock) || 0,
    };

    setFormData((prev) => ({
      ...prev,
      variants: [...(prev.variants || []), newVar],
    }));
  };

  const handleRemoveVariant = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      variants: (prev.variants || []).filter((v) => v.id !== id),
    }));
  };

  const handleUpdateStock = (id: string, stock: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((v) => (v.id === id ? { ...v, stock } : v)),
    }));
  };

  const totalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0);

  // Available sizes derived dynamically from all active size groups or defaults
  const dynamicSizeOptions = Array.from(
    new Set([
      'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'Free Size',
      ...sizeGroups.flatMap((g) => g.sizes),
    ])
  );

  return (
    <div className="space-y-4">
      {/* 1. Dynamic Size Group Auto-Populator */}
      <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-neutral-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-white border border-neutral-200 text-[#7B2435]">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                Dynamic Size Matrix Auto-Populator
              </h4>
              <p className="text-[11px] text-neutral-500">
                Populate all sizes in a single click from your size group catalog
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSizeGroupId}
              onChange={(e) => {
                setSelectedSizeGroupId(e.target.value);
                if (e.target.value) handleApplySizeGroup(e.target.value);
              }}
              className="bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-medium text-neutral-800 cursor-pointer shadow-xs focus:ring-1 focus:ring-[#7B2435]"
            >
              <option value="">-- Select Size Group to Apply --</option>
              {sizeGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.sizes.join(', ')})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Color Palette Picker from Color Catalog */}
        <div className="pt-2 border-t border-neutral-200/60">
          <label className="text-[11px] font-bold text-neutral-500 uppercase block mb-1.5">
            Quick Select from Color Library:
          </label>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {storeColors.map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => {
                  setNewColor(sc.name);
                  setNewColorHex(sc.hex);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition cursor-pointer shrink-0 ${
                  newColor === sc.name
                    ? 'bg-[#7B2435] text-white border-[#7B2435] shadow-xs'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: sc.hex }}
                />
                {sc.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Manual Variant Adder */}
      <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-xs">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 block mb-3">
          Add Individual Variant
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
          <Select
            label="Size"
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            options={dynamicSizeOptions.map((s) => ({ value: s, label: s }))}
          />

          <Input
            label="Color Name"
            placeholder="e.g. Maroon"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-700">Color Hex</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-9 h-9 rounded-lg border border-neutral-200 p-0.5 cursor-pointer bg-white"
              />
              <input
                type="text"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-xs text-neutral-800 font-mono uppercase"
              />
            </div>
          </div>

          <Input
            label="Inventory Stock"
            type="number"
            min={0}
            value={newStock}
            onChange={(e) => setNewStock(Number(e.target.value))}
          />

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleAddVariant}
            leftIcon={<Plus className="w-4 h-4" />}
            className="w-full"
          >
            Add Variant
          </Button>
        </div>
      </div>

      {/* 3. Variants List Table */}
      <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF6F0] text-neutral-600 font-bold border-b border-neutral-200">
            <tr>
              <th className="py-2.5 px-3">Size</th>
              <th className="py-2.5 px-3">Color</th>
              <th className="py-2.5 px-3">Variant SKU</th>
              <th className="py-2.5 px-3">Stock Units</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {variants.map((v) => (
              <tr key={v.id} className="hover:bg-neutral-50">
                <td className="py-2.5 px-3 font-bold text-neutral-900">{v.size}</td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: v.colorHex }}
                    />
                    <span>{v.color}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 font-mono text-neutral-500">{v.sku}</td>
                <td className="py-2.5 px-3">
                  <input
                    type="number"
                    min={0}
                    value={v.stock}
                    onChange={(e) => handleUpdateStock(v.id, Number(e.target.value))}
                    className="w-20 bg-white border border-neutral-200 rounded-lg px-2 py-1 text-xs font-bold text-neutral-800"
                  />
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(v.id)}
                    className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {variants.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-neutral-400">
                  No variants configured. Select a Size Group above or add custom sizes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold px-1">
        <span>Total Variants: {variants.length}</span>
        <span>
          Total In-Stock Units:{' '}
          <strong className="text-neutral-900 font-bold">{totalStock}</strong>
        </span>
      </div>
    </div>
  );
};
