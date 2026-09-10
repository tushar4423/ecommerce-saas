import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Check, Palette, Sparkles, Image as ImageIcon } from 'lucide-react';
import { 
  useGetColorsQuery, 
  useCreateColorMutation, 
  useUpdateColorMutation, 
  useDeleteColorMutation 
} from '../../store/api/ecommerceApi';
import { StoreColor } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const ColorCatalogManager: React.FC = () => {
  const { data: colors = [], isLoading } = useGetColorsQuery();
  const [createColor] = useCreateColorMutation();
  const [updateColor] = useUpdateColorMutation();
  const [deleteColor] = useDeleteColorMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formState, setFormState] = useState<{
    name: string;
    hex: string;
    textureUrl: string;
    isActive: boolean;
  }>({
    name: '',
    hex: '#7B2435',
    textureUrl: '',
    isActive: true,
  });

  const handleStartCreate = () => {
    setEditingId(null);
    setFormState({
      name: '',
      hex: '#7B2435',
      textureUrl: '',
      isActive: true,
    });
    setIsEditing(true);
  };

  const handleStartEdit = (color: StoreColor) => {
    setEditingId(color.id);
    setFormState({
      name: color.name,
      hex: color.hex,
      textureUrl: color.textureUrl || '',
      isActive: color.isActive,
    });
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    if (editingId) {
      await updateColor({
        id: editingId,
        updates: {
          name: formState.name.trim(),
          hex: formState.hex,
          textureUrl: formState.textureUrl.trim() || undefined,
          isActive: formState.isActive,
        },
      });
    } else {
      await createColor({
        name: formState.name.trim(),
        hex: formState.hex,
        textureUrl: formState.textureUrl.trim() || undefined,
        isActive: formState.isActive,
      });
    }

    setIsEditing(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this color swatch?')) {
      await deleteColor(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FFF0F3] text-[#7B2435]">
              <Palette className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Color Palette & Swatches</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Centralized color library used by product variants and storefront filters
              </p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={handleStartCreate}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shrink-0"
        >
          Add Color Swatch
        </Button>
      </div>

      {/* Editor Modal / Form */}
      {isEditing && (
        <form onSubmit={handleSave} className="p-6 bg-white rounded-2xl border border-[#7B2435]/30 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="font-bold text-neutral-900 text-sm">
              {editingId ? 'Edit Color' : 'Add New Color Swatch'}
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            <Input
              label="Color Name *"
              placeholder="e.g. Royal Ruby Maroon"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              required
            />

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
                Color Hex Code *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formState.hex}
                  onChange={(e) => setFormState({ ...formState, hex: e.target.value })}
                  className="w-10 h-10 rounded-xl border border-neutral-200 p-0.5 cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={formState.hex}
                  onChange={(e) => setFormState({ ...formState, hex: e.target.value })}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs font-mono uppercase text-neutral-800"
                  required
                />
              </div>
            </div>

            <Input
              label="Texture / Fabric Swatch Image (Optional)"
              placeholder="https://..."
              value={formState.textureUrl}
              onChange={(e) => setFormState({ ...formState, textureUrl: e.target.value })}
            />
          </div>

          {/* Quick Indian Ethnic Color Presets */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto">
            <span className="text-[11px] font-bold text-neutral-400 shrink-0">Ethnic Swatch Presets:</span>
            {[
              { name: 'Maroon', hex: '#7B2435' },
              { name: 'Teal Blue', hex: '#1E6B7B' },
              { name: 'Mustard', hex: '#E5A93C' },
              { name: 'Emerald', hex: '#225E48' },
              { name: 'Dusty Rose', hex: '#D88B97' },
              { name: 'Ivory', hex: '#FDFBF7' },
              { name: 'Gold', hex: '#D4AF37' },
              { name: 'Indigo', hex: '#2A3F6D' },
            ].map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setFormState({ ...formState, name: p.name, hex: p.hex })}
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 bg-neutral-100 hover:bg-[#FFF0F3] text-neutral-700 rounded-full border border-neutral-200 transition cursor-pointer"
              >
                <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: p.hex }} />
                {p.name}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
              <input
                type="checkbox"
                checked={formState.isActive}
                onChange={(e) => setFormState({ ...formState, isActive: e.target.checked })}
                className="rounded text-[#7B2435] focus:ring-[#7B2435]"
              />
              Active Color
            </label>

            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" leftIcon={<Check className="w-4 h-4" />}>
                Save Color Swatch
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Grid of Colors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {colors.map((col) => (
          <div
            key={col.id}
            className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs hover:border-[#7B2435]/40 transition-all flex flex-col items-center text-center group"
          >
            {/* Color Swatch Circle */}
            <div className="relative mb-3">
              <div
                className="w-14 h-14 rounded-full border-2 border-neutral-200 shadow-inner flex items-center justify-center overflow-hidden"
                style={{ backgroundColor: col.hex }}
              >
                {col.textureUrl && (
                  <img
                    src={col.textureUrl}
                    alt={col.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {!col.isActive && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-neutral-400 rounded-full border border-white" title="Inactive" />
              )}
            </div>

            <h3 className="font-bold text-neutral-900 text-xs truncate max-w-full">{col.name}</h3>
            <span className="text-[11px] font-mono text-neutral-500 uppercase mt-0.5">{col.hex}</span>

            <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => handleStartEdit(col)}
                className="p-1.5 text-neutral-500 hover:text-[#7B2435] hover:bg-[#FFF0F3] rounded-lg transition cursor-pointer"
                title="Edit Color"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(col.id)}
                className="p-1.5 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                title="Delete Color"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
