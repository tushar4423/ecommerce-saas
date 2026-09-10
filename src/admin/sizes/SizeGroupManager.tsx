import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Check, Layers, Sparkles, Tag, ShieldCheck } from 'lucide-react';
import { 
  useGetSizeGroupsQuery, 
  useCreateSizeGroupMutation, 
  useUpdateSizeGroupMutation, 
  useDeleteSizeGroupMutation 
} from '../../store/api/ecommerceApi';
import { SizeGroup } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const SizeGroupManager: React.FC = () => {
  const { data: sizeGroups = [], isLoading } = useGetSizeGroupsQuery();
  const [createSizeGroup] = useCreateSizeGroupMutation();
  const [updateSizeGroup] = useUpdateSizeGroupMutation();
  const [deleteSizeGroup] = useDeleteSizeGroupMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formState, setFormState] = useState<{
    name: string;
    description: string;
    sizesText: string;
    isActive: boolean;
    isDefault: boolean;
  }>({
    name: '',
    description: '',
    sizesText: 'XS, S, M, L, XL',
    isActive: true,
    isDefault: false,
  });

  const handleStartCreate = () => {
    setEditingId(null);
    setFormState({
      name: '',
      description: '',
      sizesText: 'XS, S, M, L, XL',
      isActive: true,
      isDefault: false,
    });
    setIsEditing(true);
  };

  const handleStartEdit = (group: SizeGroup) => {
    setEditingId(group.id);
    setFormState({
      name: group.name,
      description: group.description || '',
      sizesText: group.sizes.join(', '),
      isActive: group.isActive,
      isDefault: group.isDefault || false,
    });
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    const sizes = formState.sizesText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sizes.length === 0) return;

    if (editingId) {
      await updateSizeGroup({
        id: editingId,
        updates: {
          name: formState.name.trim(),
          description: formState.description.trim(),
          sizes,
          isActive: formState.isActive,
          isDefault: formState.isDefault,
        },
      });
    } else {
      await createSizeGroup({
        name: formState.name.trim(),
        description: formState.description.trim(),
        sizes,
        isActive: formState.isActive,
        isDefault: formState.isDefault,
      });
    }

    setIsEditing(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this size group?')) {
      await deleteSizeGroup(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FFF0F3] text-[#7B2435]">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Size Group Management</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Define dynamic size matrices (e.g., XS–XL, Extended M–3XL, Plus Curve 2XL–5XL, Free Size)
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
          Create Size Group
        </Button>
      </div>

      {/* Editor Modal / Form */}
      {isEditing && (
        <form onSubmit={handleSave} className="p-6 bg-white rounded-2xl border border-[#7B2435]/30 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <h3 className="font-bold text-neutral-900 text-sm">
              {editingId ? 'Edit Size Group' : 'Create New Size Group'}
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Group Name *"
              placeholder="e.g. Standard Ready-to-Wear (XS to XL)"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              required
            />

            <Input
              label="Description"
              placeholder="e.g. For straight fit everyday cotton kurtis"
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
              Sizes (Comma separated) *
            </label>
            <Input
              placeholder="XS, S, M, L, XL, 2XL, 3XL"
              value={formState.sizesText}
              onChange={(e) => setFormState({ ...formState, sizesText: e.target.value })}
              required
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              Example presets: <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-700">XS, S, M, L, XL</code> or <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-700">2XL, 3XL, 4XL, 5XL</code> or <code className="bg-neutral-100 px-1 py-0.5 rounded text-neutral-700">Free Size</code>
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 pt-1 overflow-x-auto">
            <span className="text-[11px] font-bold text-neutral-400 shrink-0">Quick Fill:</span>
            {[
              { label: 'XS to XL', val: 'XS, S, M, L, XL' },
              { label: 'S to 2XL', val: 'S, M, L, XL, 2XL' },
              { label: 'M to 3XL', val: 'M, L, XL, 2XL, 3XL' },
              { label: 'Plus 2XL-5XL', val: '2XL, 3XL, 4XL, 5XL' },
              { label: 'Free Size', val: 'Free Size' },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setFormState({ ...formState, sizesText: preset.val })}
                className="text-[11px] px-2.5 py-1 bg-neutral-100 hover:bg-[#FFF0F3] hover:text-[#7B2435] text-neutral-700 rounded-full border border-neutral-200 transition cursor-pointer font-medium"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
              <input
                type="checkbox"
                checked={formState.isActive}
                onChange={(e) => setFormState({ ...formState, isActive: e.target.checked })}
                className="rounded text-[#7B2435] focus:ring-[#7B2435]"
              />
              Active Group
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
              <input
                type="checkbox"
                checked={formState.isDefault}
                onChange={(e) => setFormState({ ...formState, isDefault: e.target.checked })}
                className="rounded text-[#7B2435] focus:ring-[#7B2435]"
              />
              Set as Default for New Products
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" leftIcon={<Check className="w-4 h-4" />}>
              Save Size Group
            </Button>
          </div>
        </form>
      )}

      {/* Grid of Size Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sizeGroups.map((group) => (
          <div
            key={group.id}
            className="p-5 bg-white rounded-2xl border border-neutral-200 shadow-xs hover:border-[#7B2435]/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-neutral-900 text-base">{group.name}</h3>
                    {group.isDefault && (
                      <span className="px-2 py-0.5 bg-[#FFF0F3] text-[#7B2435] text-[10px] font-bold rounded-full border border-[#7B2435]/20">
                        Default
                      </span>
                    )}
                    {!group.isActive && (
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 text-[10px] font-bold rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  {group.description && (
                    <p className="text-xs text-neutral-500 mt-1">{group.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(group)}
                    className="p-1.5 text-neutral-500 hover:text-[#7B2435] hover:bg-[#FFF0F3] rounded-lg transition cursor-pointer"
                    title="Edit Size Group"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(group.id)}
                    className="p-1.5 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Delete Size Group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Badges of Sizes */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {group.sizes.map((sz) => (
                  <span
                    key={sz}
                    className="px-2.5 py-1 bg-[#FAF6F0] text-[#7B2435] font-bold text-xs rounded-lg border border-neutral-200"
                  >
                    {sz}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
              <span>{group.sizes.length} sizes in matrix</span>
              <span className="font-mono text-[11px] text-neutral-300">ID: {group.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
