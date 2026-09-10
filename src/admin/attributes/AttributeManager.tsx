import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Tag, Sparkles, Sliders, Layers } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  useGetAttributesQuery, 
  useCreateAttributeMutation, 
  useUpdateAttributeMutation, 
  useDeleteAttributeMutation 
} from '../../store/api/ecommerceApi';
import { ProductAttributeGroup, ProductAttributeOption } from '../../types';

export const AttributeManager: React.FC = () => {
  const { data: attributes = [], isLoading } = useGetAttributesQuery();
  const [createAttribute] = useCreateAttributeMutation();
  const [updateAttribute] = useUpdateAttributeMutation();
  const [deleteAttribute] = useDeleteAttributeMutation();

  const [selectedAttrId, setSelectedAttrId] = useState<string>('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupKey, setNewGroupKey] = useState('');

  // Editing option states
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');
  const [newOptionColor, setNewOptionColor] = useState('');

  const activeAttribute = attributes.find((a) => a.id === selectedAttrId) || attributes[0];

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    const cleanKey = (newGroupKey || newGroupName).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    await createAttribute({
      id: `attr-${cleanKey}-${Date.now()}`,
      name: newGroupName.trim(),
      key: cleanKey,
      options: [],
    });
    setNewGroupName('');
    setNewGroupKey('');
    setIsCreatingGroup(false);
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete attribute group "${name}"?`)) {
      await deleteAttribute(id);
      if (selectedAttrId === id && attributes.length > 1) {
        setSelectedAttrId(attributes.find((a) => a.id !== id)?.id || '');
      }
    }
  };

  const handleAddOption = async () => {
    if (!activeAttribute || !newOptionLabel.trim()) return;
    const cleanVal = newOptionValue.trim() || newOptionLabel.trim();
    const newOpt: ProductAttributeOption = {
      id: `opt-${Date.now()}`,
      label: newOptionLabel.trim(),
      value: cleanVal,
      colorHex: newOptionColor.trim() || undefined,
    };

    const updatedOptions = [...(activeAttribute.options || []), newOpt];
    await updateAttribute({
      id: activeAttribute.id,
      updates: { options: updatedOptions },
    });

    setNewOptionLabel('');
    setNewOptionValue('');
    setNewOptionColor('');
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!activeAttribute) return;
    const updatedOptions = (activeAttribute.options || []).filter((opt) => opt.id !== optionId);
    await updateAttribute({
      id: activeAttribute.id,
      updates: { options: updatedOptions },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div>
          <h2 className="font-serif font-bold text-xl text-neutral-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#7B2435]" />
            <span>Dynamic Product Attributes</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Configure custom attribute dimensions (Fabric, Workmanship, Neck, Sleeve, Occasion, etc.) and their selectable values.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreatingGroup(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Attribute Group
        </Button>
      </div>

      {/* New Group Creator Modal / Drawer */}
      {isCreatingGroup && (
        <div className="bg-[#FAF6F0] p-5 rounded-2xl border border-[#E8DCC4] shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif font-bold text-sm text-neutral-900">
              Create New Attribute Group
            </h3>
            <button
              onClick={() => setIsCreatingGroup(false)}
              className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <Input
              label="Attribute Display Name"
              placeholder="e.g. Dupatta Fabric, Lining Material"
              value={newGroupName}
              onChange={(e) => {
                setNewGroupName(e.target.value);
                if (!newGroupKey) {
                  setNewGroupKey(e.target.value.toLowerCase().replace(/\s+/g, '_'));
                }
              }}
            />
            <Input
              label="Internal Key (lowercase, snake_case)"
              placeholder="e.g. dupatta_fabric"
              value={newGroupKey}
              onChange={(e) => setNewGroupKey(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <Button variant="ghost" size="sm" onClick={() => setIsCreatingGroup(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateGroup}>
              Save Attribute Group
            </Button>
          </div>
        </div>
      )}

      {/* Two-Column Management Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: Attribute Groups List */}
        <div className="md:col-span-4 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">
            Attribute Dimension
          </span>
          <div className="bg-white rounded-2xl border border-neutral-200/80 divide-y divide-neutral-100 overflow-hidden shadow-xs">
            {attributes.map((attr) => {
              const isSelected = (activeAttribute?.id === attr.id);
              return (
                <div
                  key={attr.id}
                  onClick={() => setSelectedAttrId(attr.id)}
                  className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#FAF6F0] border-l-4 border-l-[#7B2435]' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                      <span>{attr.name}</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      key: {attr.key} • {attr.options?.length || 0} values
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(attr.id, attr.name);
                    }}
                    className="p-1.5 text-neutral-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete Group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Values & Options for Active Group */}
        <div className="md:col-span-8">
          {activeAttribute ? (
            <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                <div>
                  <h3 className="font-serif font-bold text-lg text-neutral-900">
                    {activeAttribute.name} Values
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Manage choices that appear in product filters and product editing dropdowns.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-[#FAF6F0] text-[#7B2435] text-xs font-bold rounded-lg border border-[#F0E6E1]">
                  {activeAttribute.options?.length || 0} Options Configured
                </span>
              </div>

              {/* Add New Option Form */}
              <div className="p-4 rounded-xl bg-[#FAF6F0] border border-[#F0E6E1] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                  + Add Option Value
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <Input
                    label="Display Label"
                    placeholder="e.g. 100% Pure Cotton"
                    value={newOptionLabel}
                    onChange={(e) => setNewOptionLabel(e.target.value)}
                  />
                  <Input
                    label="Filter / Internal Value"
                    placeholder="e.g. Cotton"
                    value={newOptionValue}
                    onChange={(e) => setNewOptionValue(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input
                        label="Color Hex (Optional)"
                        placeholder="#7B2435"
                        value={newOptionColor}
                        onChange={(e) => setNewOptionColor(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleAddOption}
                      className="shrink-0 mb-0.5"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Options Table */}
              <div className="overflow-x-auto rounded-xl border border-neutral-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-neutral-600 font-bold uppercase border-b border-neutral-200">
                    <tr>
                      <th className="py-2.5 px-3">Option Label</th>
                      <th className="py-2.5 px-3">Stored Value</th>
                      <th className="py-2.5 px-3">Color Preview</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {(!activeAttribute.options || activeAttribute.options.length === 0) ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-neutral-400 italic">
                          No option values defined yet. Add the first option above.
                        </td>
                      </tr>
                    ) : (
                      activeAttribute.options.map((opt) => (
                        <tr key={opt.id} className="hover:bg-[#FAF6F0]/40 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-neutral-900">
                            {opt.label}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-neutral-500">
                            {opt.value}
                          </td>
                          <td className="py-2.5 px-3">
                            {opt.colorHex ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-4 h-4 rounded-full border border-neutral-300 shadow-xs"
                                  style={{ backgroundColor: opt.colorHex }}
                                />
                                <span className="font-mono text-[11px] text-neutral-600">
                                  {opt.colorHex}
                                </span>
                              </div>
                            ) : (
                              <span className="text-neutral-300">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteOption(opt.id)}
                              className="p-1 text-neutral-300 hover:text-rose-600 rounded-md transition-colors"
                              title="Delete option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-neutral-200 text-center text-neutral-400">
              Select an attribute group from the left to configure its values.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
