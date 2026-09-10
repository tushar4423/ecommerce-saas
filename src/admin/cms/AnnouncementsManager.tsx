import React, { useState } from 'react';
import { Plus, Trash2, MoveUp, MoveDown, Check, X, Sparkles, Megaphone, Edit } from 'lucide-react';
import { useGetAnnouncementsQuery, useSaveAnnouncementsMutation } from '../../store/api/ecommerceApi';
import { AnnouncementItem } from '../../types';
import { useToast } from '../../hooks/useToast';

export const AnnouncementsManager: React.FC = () => {
  const { data: announcements = [], isLoading } = useGetAnnouncementsQuery();
  const [saveAnnouncements, { isLoading: isSaving }] = useSaveAnnouncementsMutation();
  const { toast } = useToast();

  const [editingItem, setEditingItem] = useState<Partial<AnnouncementItem> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToggleActive = async (id: string) => {
    const updated = announcements.map((item) =>
      item.id === id ? { ...item, isActive: !item.isActive } : item
    );
    try {
      await saveAnnouncements(updated).unwrap();
      toast('Announcement status updated', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to update announcement', 'error');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= announcements.length) return;

    const list = [...announcements];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // re-index
    const reordered = list.map((item, idx) => ({ ...item, order: idx + 1 }));

    try {
      await saveAnnouncements(reordered).unwrap();
      toast('Display order updated', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to reorder', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    const filtered = announcements.filter((item) => item.id !== id);
    try {
      await saveAnnouncements(filtered).unwrap();
      toast('Announcement deleted', 'success');
    } catch (err: any) {
      toast(err?.message || 'Failed to delete', 'error');
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.text?.trim()) {
      toast('Announcement text is required', 'error');
      return;
    }

    let updatedList: AnnouncementItem[];
    if (editingItem.id) {
      updatedList = announcements.map((item) =>
        item.id === editingItem.id ? ({ ...item, ...editingItem } as AnnouncementItem) : item
      );
    } else {
      const newItem: AnnouncementItem = {
        id: `ann-${Date.now()}`,
        text: editingItem.text,
        highlightText: editingItem.highlightText || '',
        linkText: editingItem.linkText || 'Shop Now',
        linkUrl: editingItem.linkUrl || '/catalog',
        badge: editingItem.badge || 'PROMO',
        backgroundColor: editingItem.backgroundColor || '#7B2435',
        textColor: editingItem.textColor || '#FFFFFF',
        isActive: true,
        order: announcements.length + 1,
      };
      updatedList = [...announcements, newItem];
    }

    try {
      await saveAnnouncements(updatedList).unwrap();
      toast('Announcement saved successfully', 'success');
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      toast(err?.message || 'Failed to save announcement', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#7B2435]" />
            Announcement Bar Manager
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Manage top banner rotating messages, discount coupon highlights, and promotional links.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingItem({
              text: '',
              highlightText: '',
              linkText: 'Shop Now',
              linkUrl: '/catalog',
              badge: 'PROMO',
              backgroundColor: '#7B2435',
              textColor: '#FFFFFF',
              isActive: true,
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7B2435] hover:bg-[#621C2A] text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Announcement
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-stone-400 text-sm">Loading announcements from database...</div>
      ) : announcements.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-stone-300">
          <Sparkles className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-stone-700">No active announcements</p>
          <p className="text-xs text-stone-500 mt-1">Click &quot;Add Announcement&quot; to create your first top bar message.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((item, idx) => (
            <div
              key={item.id}
              className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border transition ${
                item.isActive ? 'bg-white border-stone-200 shadow-xs' : 'bg-stone-50 border-stone-200 opacity-60'
              }`}
            >
              <div className="flex items-start md:items-center gap-3">
                <div className="flex flex-col gap-1 text-stone-400">
                  <button
                    type="button"
                    disabled={idx === 0 || isSaving}
                    onClick={() => handleMoveOrder(idx, 'up')}
                    className="p-1 hover:text-stone-700 disabled:opacity-30 cursor-pointer"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === announcements.length - 1 || isSaving}
                    onClick={() => handleMoveOrder(idx, 'down')}
                    className="p-1 hover:text-stone-700 disabled:opacity-30 cursor-pointer"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="px-2 py-0.5 text-[10px] font-bold rounded-md"
                    style={{ backgroundColor: item.backgroundColor || '#7B2435', color: item.textColor || '#fff' }}
                  >
                    {item.badge || 'PROMO'}
                  </span>
                  <p className="text-xs font-medium text-stone-800">{item.text}</p>
                  {item.linkUrl && (
                    <span className="text-[11px] text-[#7B2435] font-semibold underline">
                      {item.linkText || 'Link'} &rarr; {item.linkUrl}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleActive(item.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                    item.isActive
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                  }`}
                >
                  {item.isActive ? 'Active' : 'Disabled'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(item);
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer transition"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">
                {editingItem?.id ? 'Edit Announcement' : 'Create New Announcement'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Announcement Message *</label>
                <textarea
                  required
                  rows={2}
                  value={editingItem?.text || ''}
                  onChange={(e) => setEditingItem((prev) => ({ ...prev, text: e.target.value }))}
                  placeholder="e.g. ✨ Festive Launch: Use code NANDITA20 for Flat 20% OFF"
                  className="w-full text-xs p-3 border border-stone-300 rounded-xl focus:border-[#7B2435] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={editingItem?.badge || ''}
                    onChange={(e) => setEditingItem((prev) => ({ ...prev, badge: e.target.value }))}
                    placeholder="e.g. NEW, 20% OFF, LIMITED"
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:border-[#7B2435] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Highlight Keyword</label>
                  <input
                    type="text"
                    value={editingItem?.highlightText || ''}
                    onChange={(e) => setEditingItem((prev) => ({ ...prev, highlightText: e.target.value }))}
                    placeholder="e.g. NANDITA20"
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:border-[#7B2435] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Link CTA Text</label>
                  <input
                    type="text"
                    value={editingItem?.linkText || ''}
                    onChange={(e) => setEditingItem((prev) => ({ ...prev, linkText: e.target.value }))}
                    placeholder="e.g. Shop Now, Explore"
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:border-[#7B2435] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Target URL</label>
                  <input
                    type="text"
                    value={editingItem?.linkUrl || ''}
                    onChange={(e) => setEditingItem((prev) => ({ ...prev, linkUrl: e.target.value }))}
                    placeholder="e.g. /catalog?collection=festive"
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:border-[#7B2435] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingItem?.backgroundColor || '#7B2435'}
                      onChange={(e) => setEditingItem((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300"
                    />
                    <input
                      type="text"
                      value={editingItem?.backgroundColor || '#7B2435'}
                      onChange={(e) => setEditingItem((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-full text-xs p-2 border border-stone-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Text Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingItem?.textColor || '#FFFFFF'}
                      onChange={(e) => setEditingItem((prev) => ({ ...prev, textColor: e.target.value }))}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-stone-300"
                    />
                    <input
                      type="text"
                      value={editingItem?.textColor || '#FFFFFF'}
                      onChange={(e) => setEditingItem((prev) => ({ ...prev, textColor: e.target.value }))}
                      className="w-full text-xs p-2 border border-stone-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#7B2435] hover:bg-[#621C2A] text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
