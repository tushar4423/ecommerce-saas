import React, { useState } from 'react';
import {
  FolderPlus,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  Layers,
  Sparkles,
  ArrowRight,
  X,
  Check,
  ExternalLink,
  Copy,
  Link2,
  ShoppingBag,
  Sparkle,
  Compass
} from 'lucide-react';
import { Category, SubCategory, SubSubCategory } from '../../types';
import { api } from '../../services/api';
import { store } from '../../store';
import { ecommerceApi } from '../../store/api/ecommerceApi';

interface CategoryManagerProps {
  categories: Category[];
  onRefresh: () => void;
  onNavigateToCatalog?: (cat?: string, subcat?: string, subSubCat?: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  categories, 
  onRefresh,
  onNavigateToCatalog 
}) => {
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(categories[0]?.id || null);
  const [isAddingHeaderCat, setIsAddingHeaderCat] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // New Header Category form state
  const [headerName, setHeaderName] = useState('');
  const [headerSlug, setHeaderSlug] = useState('');
  const [headerDesc, setHeaderDesc] = useState('');
  const [headerImage, setHeaderImage] = useState('');

  // SubMenu column form state
  const [targetCatIdForSub, setTargetCatIdForSub] = useState<string | null>(null);
  const [subMenuName, setSubMenuName] = useState('');
  const [subMenuSlug, setSubMenuSlug] = useState('');

  // Sub-SubCategory form state
  const [targetSubForSubSub, setTargetSubForSubSub] = useState<{ catId: string; subId: string } | null>(null);
  const [subSubName, setSubSubName] = useState('');
  const [subSubSlug, setSubSubSlug] = useState('');

  // Editing existing category
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Editing existing SubMenu
  const [editingSubMenu, setEditingSubMenu] = useState<{ catId: string; subMenu: SubCategory } | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubSlug, setEditSubSlug] = useState('');

  // Editing existing Sub-SubCategory
  const [editingSubSub, setEditingSubSub] = useState<{ catId: string; subId: string; item: SubSubCategory } | null>(null);
  const [editSubSubName, setEditSubSubName] = useState('');
  const [editSubSubSlug, setEditSubSubSlug] = useState('');

  // Helper: compute destination URL
  const getCategoryDestUrl = (catName: string) => {
    return `/catalog?category=${encodeURIComponent(catName)}`;
  };

  const getSubMenuDestUrl = (catName: string, subName: string) => {
    return `/catalog?category=${encodeURIComponent(catName)}&subcategory=${encodeURIComponent(subName)}`;
  };

  const getSubSubDestUrl = (catName: string, subName: string, subSub: string) => {
    return `/catalog?category=${encodeURIComponent(catName)}&subcategory=${encodeURIComponent(subName)}&subSubCategory=${encodeURIComponent(subSub)}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Preset accessory template generator
  const handleApplyAccessoryPreset = async () => {
    const existingAccessories = categories.find(c => c.name.toLowerCase().includes('accessories'));
    if (existingAccessories) {
      alert('Accessories category already exists in your menu hierarchy! You can expand it below to customize submenus.');
      setExpandedCategoryId(existingAccessories.id);
      return;
    }

    const accessoriesCategory: Category = {
      id: `cat-${Date.now()}`,
      name: 'Accessories',
      slug: 'accessories',
      description: 'Handcrafted potlis, dupattas, ethnic footwear, and jewellery to complete your royal ensemble.',
      imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80',
      displayOrder: categories.length + 1,
      subcategories: ['Bags & Potlis', 'Jewellery', 'Dupattas & Stoles', 'Footwear & Juttis'],
      subMenus: [
        {
          id: `sub-${Date.now()}-1`,
          name: 'Bags & Potlis',
          slug: 'bags-and-potlis',
          subcategories: [
            { id: `ss-${Date.now()}-1`, name: 'Embroidered Potlis', slug: 'embroidered-potlis' },
            { id: `ss-${Date.now()}-2`, name: 'Clutches & Batwas', slug: 'clutches-and-batwas' },
            { id: `ss-${Date.now()}-3`, name: 'Tote & Shoulder Bags', slug: 'tote-bags' },
          ]
        },
        {
          id: `sub-${Date.now()}-2`,
          name: 'Traditional Jewellery',
          slug: 'traditional-jewellery',
          subcategories: [
            { id: `ss-${Date.now()}-4`, name: 'Kundan & Polki Sets', slug: 'kundan-sets' },
            { id: `ss-${Date.now()}-5`, name: 'Oxidised Silver Jhumkas', slug: 'oxidised-jhumkas' },
            { id: `ss-${Date.now()}-6`, name: 'Bangles & Kadas', slug: 'bangles-kadas' },
          ]
        },
        {
          id: `sub-${Date.now()}-3`,
          name: 'Dupattas & Stoles',
          slug: 'dupattas-and-stoles',
          subcategories: [
            { id: `ss-${Date.now()}-7`, name: 'Banarasi Silk Dupattas', slug: 'banarasi-silk' },
            { id: `ss-${Date.now()}-8`, name: 'Chanderi & Organza', slug: 'chanderi-organza' },
            { id: `ss-${Date.now()}-9`, name: 'Phulkari & Bandhani', slug: 'phulkari-bandhani' },
          ]
        },
        {
          id: `sub-${Date.now()}-4`,
          name: 'Footwear',
          slug: 'footwear',
          subcategories: [
            { id: `ss-${Date.now()}-10`, name: 'Mojaris & Juttis', slug: 'mojaris-juttis' },
            { id: `ss-${Date.now()}-11`, name: 'Kolhapuri Flats', slug: 'kolhapuri-flats' },
          ]
        }
      ]
    };

    await api.createCategory(accessoriesCategory);
    try {
      store.dispatch(ecommerceApi.util.invalidateTags([{ type: 'Category', id: 'LIST' }, { type: 'Product', id: 'LIST' }]));
    } catch {}
    onRefresh();
  };

  const handleAddHeaderCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerName.trim()) return;

    const slug = headerSlug.trim() || headerName.toLowerCase().replace(/[\s&]+/g, '-');
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: headerName.trim(),
      slug: slug,
      description: headerDesc.trim() || `Curated handcrafted styles in ${headerName}`,
      imageUrl: headerImage.trim() || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
      displayOrder: categories.length + 1,
      subcategories: ['All ' + headerName.trim()],
      subMenus: [
        {
          id: `sub-${Date.now()}-1`,
          name: 'Featured Collection',
          slug: 'featured-collection',
          subcategories: [
            { id: `ss-${Date.now()}-1`, name: 'All ' + headerName.trim(), slug: 'all' },
            { id: `ss-${Date.now()}-2`, name: 'New In Store', slug: 'new' }
          ]
        }
      ]
    };

    await api.createCategory(newCategory);
    try {
      store.dispatch(ecommerceApi.util.invalidateTags([{ type: 'Category', id: 'LIST' }, { type: 'Product', id: 'LIST' }]));
    } catch {}
    setHeaderName('');
    setHeaderSlug('');
    setHeaderDesc('');
    setHeaderImage('');
    setIsAddingHeaderCat(false);
    onRefresh();
  };

  const handleUpdateHeaderCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    await api.updateCategory(editingCategory.id, editingCategory);
    try {
      store.dispatch(ecommerceApi.util.invalidateTags([{ type: 'Category', id: 'LIST' }, { type: 'Product', id: 'LIST' }]));
    } catch {}
    setEditingCategory(null);
    onRefresh();
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete header category "${name}"? This updates the navbar instantly.`)) {
      await api.deleteCategory(id);
      try {
        store.dispatch(ecommerceApi.util.invalidateTags([{ type: 'Category', id: 'LIST' }, { type: 'Product', id: 'LIST' }]));
      } catch {}
      onRefresh();
    }
  };

  const handleAddSubMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCatIdForSub || !subMenuName.trim()) return;

    const cat = categories.find((c) => c.id === targetCatIdForSub);
    if (!cat) return;

    const newSub: SubCategory = {
      id: `sub-${Date.now()}`,
      name: subMenuName.trim(),
      slug: subMenuSlug.trim() || subMenuName.toLowerCase().replace(/[\s&]+/g, '-'),
      subcategories: [
        { id: `ss-${Date.now()}-1`, name: 'All ' + subMenuName.trim(), slug: 'all' }
      ]
    };

    const updatedSubMenus = [...(cat.subMenus || []), newSub];
    const updatedSubcategories = Array.from(new Set([...cat.subcategories, subMenuName.trim()]));

    await api.updateCategory(cat.id, {
      ...cat,
      subcategories: updatedSubcategories,
      subMenus: updatedSubMenus
    });
    try {
      store.dispatch(ecommerceApi.util.invalidateTags([{ type: 'Category', id: 'LIST' }, { type: 'Product', id: 'LIST' }]));
    } catch {}

    setSubMenuName('');
    setSubMenuSlug('');
    setTargetCatIdForSub(null);
    onRefresh();
  };

  const handleSaveEditSubMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubMenu || !editSubName.trim()) return;

    const { catId, subMenu } = editingSubMenu;
    const cat = categories.find(c => c.id === catId);
    if (!cat || !cat.subMenus) return;

    const updatedSubMenus = cat.subMenus.map(s => {
      if (s.id === subMenu.id) {
        return {
          ...s,
          name: editSubName.trim(),
          slug: editSubSlug.trim() || editSubName.toLowerCase().replace(/[\s&]+/g, '-')
        };
      }
      return s;
    });

    await api.updateCategory(cat.id, { ...cat, subMenus: updatedSubMenus });
    try {
      store.dispatch(ecommerceApi.util.invalidateTags([{ type: 'Category', id: 'LIST' }, { type: 'Product', id: 'LIST' }]));
    } catch {}

    setEditingSubMenu(null);
    onRefresh();
  };

  const handleDeleteSubMenu = async (catId: string, subMenuId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat || !cat.subMenus) return;

    if (confirm('Delete this submenu column and its child items?')) {
      const updatedSubMenus = cat.subMenus.filter((s) => s.id !== subMenuId);
      await api.updateCategory(cat.id, { ...cat, subMenus: updatedSubMenus });
      try {
        store.dispatch(ecommerceApi.util.invalidateTags([{ type: 'Category', id: 'LIST' }, { type: 'Product', id: 'LIST' }]));
      } catch {}
      onRefresh();
    }
  };

  const handleAddSubSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSubForSubSub || !subSubName.trim()) return;

    const { catId, subId } = targetSubForSubSub;
    const cat = categories.find((c) => c.id === catId);
    if (!cat || !cat.subMenus) return;

    const updatedSubMenus = cat.subMenus.map((subMenu) => {
      if (subMenu.id === subId) {
        const currentSubs = subMenu.subcategories || [];
        const newSubSub: SubSubCategory = {
          id: `ss-${Date.now()}`,
          name: subSubName.trim(),
          slug: subSubSlug.trim() || subSubName.toLowerCase().replace(/[\s&]+/g, '-')
        };
        return {
          ...subMenu,
          subcategories: [...currentSubs, newSubSub]
        };
      }
      return subMenu;
    });

    await api.updateCategory(cat.id, { ...cat, subMenus: updatedSubMenus });
    try {
      store.dispatch(ecommerceApi.util.invalidateTags([{ type: 'Category', id: 'LIST' }, { type: 'Product', id: 'LIST' }]));
    } catch {}
    setSubSubName('');
    setSubSubSlug('');
    setTargetSubForSubSub(null);
    onRefresh();
  };

  const handleSaveEditSubSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubSub || !editSubSubName.trim()) return;

    const { catId, subId, item } = editingSubSub;
    const cat = categories.find(c => c.id === catId);
    if (!cat || !cat.subMenus) return;

    const updatedSubMenus = cat.subMenus.map(subMenu => {
      if (subMenu.id === subId) {
        const updatedSubs = (subMenu.subcategories || []).map(ss => {
          if (ss.id === item.id) {
            return {
              ...ss,
              name: editSubSubName.trim(),
              slug: editSubSubSlug.trim() || editSubSubName.toLowerCase().replace(/[\s&]+/g, '-')
            };
          }
          return ss;
        });
        return { ...subMenu, subcategories: updatedSubs };
      }
      return subMenu;
    });

    await api.updateCategory(cat.id, { ...cat, subMenus: updatedSubMenus });
    try {
      store.dispatch(ecommerceApi.util.invalidateTags([{ type: 'Category', id: 'LIST' }, { type: 'Product', id: 'LIST' }]));
    } catch {}

    setEditingSubSub(null);
    onRefresh();
  };

  const handleDeleteSubSub = async (catId: string, subId: string, subSubId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat || !cat.subMenus) return;

    const updatedSubMenus = cat.subMenus.map((subMenu) => {
      if (subMenu.id === subId) {
        return {
          ...subMenu,
          subcategories: (subMenu.subcategories || []).filter((ss) => ss.id !== subSubId)
        };
      }
      return subMenu;
    });

    await api.updateCategory(cat.id, { ...cat, subMenus: updatedSubMenus });
    try {
      store.dispatch(ecommerceApi.util.invalidateTags([{ type: 'Category', id: 'LIST' }, { type: 'Product', id: 'LIST' }]));
    } catch {}
    onRefresh();
  };

  return (
    <div id="admin-menu-submenu-manager" className="space-y-8 animate-fadeIn">
      {/* Category Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-[#F0E6E1] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 bg-[#FFF2F4] text-[#7B2435] text-[10px] font-bold uppercase rounded-full">
              Menu & Submenu Manager
            </span>
            <span className="text-xs text-neutral-500 font-medium">
              3-Tier MegaMenu Engine (Header Menu → SubMenu Column → Subcategory Items)
            </span>
          </div>
          <h3 className="font-serif text-xl font-bold text-neutral-900">
            Store Navigation & Dynamic Destination URLs
          </h3>
          <p className="text-xs text-neutral-600 max-w-2xl mt-1">
            Add and edit menus like <strong>Women, Men, Accessories, Jewellery, Festive Edit</strong>. Destination URLs are dynamically calculated and linked to storefront product catalog filters in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleApplyAccessoryPreset}
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            title="Auto-generate complete Accessories hierarchy"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>+ Add Accessories Preset</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddingHeaderCat(true)}
            className="px-4 py-2.5 bg-[#7B2435] hover:bg-[#621c2a] text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Header Menu
          </button>
        </div>
      </div>

      {/* Add Header Category Modal Card */}
      {isAddingHeaderCat && (
        <div className="bg-white p-6 rounded-3xl border-2 border-[#7B2435] shadow-lg animate-fade-in space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0E6E1]">
            <h4 className="font-serif text-base font-bold text-[#7B2435] flex items-center gap-2">
              <FolderPlus className="w-4 h-4" /> Add New Top-Level Header Menu
            </h4>
            <button
              onClick={() => setIsAddingHeaderCat(false)}
              className="p-1 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddHeaderCategory} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-neutral-800 mb-1">Menu Title *</label>
                <input
                  type="text"
                  required
                  value={headerName}
                  onChange={(e) => {
                    setHeaderName(e.target.value);
                    if (!headerSlug) setHeaderSlug(e.target.value.toLowerCase().replace(/[\s&]+/g, '-'));
                  }}
                  placeholder="e.g. Accessories, Men, Festive Edit"
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3 py-2 text-neutral-800 font-semibold focus:outline-none focus:border-[#7B2435]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={headerSlug}
                  onChange={(e) => setHeaderSlug(e.target.value)}
                  placeholder="e.g. accessories, men, festive"
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3 py-2 text-neutral-800 font-mono focus:outline-none focus:border-[#7B2435]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Banner / Image URL</label>
                <input
                  type="url"
                  value={headerImage}
                  onChange={(e) => setHeaderImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3 py-2 text-neutral-800 focus:outline-none focus:border-[#7B2435]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Description</label>
                <input
                  type="text"
                  value={headerDesc}
                  onChange={(e) => setHeaderDesc(e.target.value)}
                  placeholder="Short tagline for store mega menu"
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3 py-2 text-neutral-800 focus:outline-none focus:border-[#7B2435]"
                />
              </div>
            </div>

            {/* Live Dynamically Calculated Destination URL Preview */}
            <div className="bg-[#FAF6F0] p-3 rounded-2xl border border-[#EADBDA] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-neutral-700">
                <Link2 className="w-4 h-4 text-[#7B2435] shrink-0" />
                <span className="font-bold">Live Dynamic Destination URL:</span>
                <code className="bg-white px-2.5 py-1 rounded-md text-[#7B2435] font-mono text-xs font-bold border border-[#EADBDA]">
                  {getCategoryDestUrl(headerName || 'Category')}
                </code>
              </div>
              <span className="text-[11px] text-neutral-500 italic">
                Automatically filtered in Catalog
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingHeaderCat(false)}
                className="px-4 py-2 border border-neutral-300 rounded-full font-bold text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#7B2435] text-white rounded-full font-bold shadow hover:bg-[#621c2a] transition cursor-pointer"
              >
                Save Header Menu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Header Category Modal Card */}
      {editingCategory && (
        <div className="bg-white p-6 rounded-3xl border-2 border-amber-600 shadow-lg animate-fade-in space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0E6E1]">
            <h4 className="font-serif text-base font-bold text-amber-900 flex items-center gap-2">
              <Edit2 className="w-4 h-4" /> Edit Menu: {editingCategory.name}
            </h4>
            <button
              onClick={() => setEditingCategory(null)}
              className="p-1 text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleUpdateHeaderCategory} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block font-bold text-neutral-800 mb-1">Menu Title *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3 py-2 text-neutral-800 font-semibold focus:outline-none focus:border-[#7B2435]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">URL Slug</label>
                <input
                  type="text"
                  value={editingCategory.slug}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3 py-2 text-neutral-800 font-mono focus:outline-none focus:border-[#7B2435]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Banner / Image URL</label>
                <input
                  type="url"
                  value={editingCategory.imageUrl}
                  onChange={(e) => setEditingCategory({ ...editingCategory, imageUrl: e.target.value })}
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3 py-2 text-neutral-800 focus:outline-none focus:border-[#7B2435]"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Description</label>
                <input
                  type="text"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3 py-2 text-neutral-800 focus:outline-none focus:border-[#7B2435]"
                />
              </div>
            </div>

            {/* Live Destination URL Preview */}
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-900">
                <Link2 className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-bold">Destination URL:</span>
                <code className="bg-white px-2.5 py-1 rounded-md text-amber-900 font-mono text-xs font-bold border border-amber-300">
                  {getCategoryDestUrl(editingCategory.name)}
                </code>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 border border-neutral-300 rounded-full font-bold text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-amber-700 text-white rounded-full font-bold shadow hover:bg-amber-800 transition cursor-pointer"
              >
                Update Menu
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Hierarchical Categories Accordion Cards */}
      <div className="space-y-4">
        {categories.map((category) => {
          const isExpanded = expandedCategoryId === category.id;
          const totalSubSubs = (category.subMenus || []).reduce(
            (acc, curr) => acc + (curr.subcategories?.length || 0),
            0
          );
          const catDestUrl = getCategoryDestUrl(category.name);

          return (
            <div
              key={category.id}
              className="bg-white rounded-3xl border border-[#F0E6E1] overflow-hidden shadow-xs transition-all"
            >
              {/* Level 0: Top Menu Header Bar */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-[#FAF6F4] border-b border-[#F5ECE8]">
                <div className="flex items-center gap-4 flex-1">
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-13 h-13 rounded-2xl object-cover border border-[#EADBDA] shadow-xs shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-serif text-lg font-bold text-[#7B2435]">
                        {category.name}
                      </h4>
                      <span className="font-mono text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
                        /{category.slug}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        {category.subMenus?.length || 0} SubMenus • {totalSubSubs} Subcategories
                      </span>
                    </div>

                    {/* Destination URL preview tag */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] text-neutral-500 font-bold">Destination URL:</span>
                      <span className="font-mono text-[11px] text-[#7B2435] bg-[#FFF2F4] px-2 py-0.5 rounded border border-[#F5D5DC]">
                        {catDestUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(window.location.origin + catDestUrl)}
                        className="text-[10px] text-neutral-500 hover:text-[#7B2435] flex items-center gap-1 cursor-pointer"
                        title="Copy Destination URL"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedUrl === window.location.origin + catDestUrl ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => setTargetCatIdForSub(category.id)}
                    className="px-3.5 py-1.5 bg-[#FFF2F4] hover:bg-[#FFE5E9] text-[#7B2435] rounded-full text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add SubMenu Column
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCategory(category)}
                    className="p-2 text-neutral-500 hover:text-amber-700 hover:bg-amber-50 rounded-full transition cursor-pointer"
                    title="Edit Menu Details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-full transition cursor-pointer"
                    title="Delete Menu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedCategoryId(isExpanded ? null : category.id)}
                    className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition cursor-pointer"
                  >
                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#7B2435]' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Inline Add SubMenu Form for this Category */}
              {targetCatIdForSub === category.id && (
                <div className="p-4 bg-[#FFF9F8] border-b border-[#F5D5DC] animate-fade-in space-y-3">
                  <form onSubmit={handleAddSubMenu} className="space-y-3 text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold text-[#7B2435] flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> New SubMenu in {category.name}:
                      </span>
                      <input
                        type="text"
                        required
                        value={subMenuName}
                        onChange={(e) => {
                          setSubMenuName(e.target.value);
                          if (!subMenuSlug) setSubMenuSlug(e.target.value.toLowerCase().replace(/[\s&]+/g, '-'));
                        }}
                        placeholder="e.g. Bags & Potlis, Footwear, Jewellery"
                        className="bg-white border border-[#EADBDA] rounded-xl px-3 py-1.5 text-neutral-800 text-xs w-64 focus:outline-none focus:border-[#7B2435]"
                      />
                      <input
                        type="text"
                        value={subMenuSlug}
                        onChange={(e) => setSubMenuSlug(e.target.value)}
                        placeholder="slug (e.g. bags-potlis)"
                        className="bg-white border border-[#EADBDA] rounded-xl px-3 py-1.5 text-neutral-800 text-xs font-mono w-40 focus:outline-none focus:border-[#7B2435]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#7B2435] text-white rounded-full font-bold text-xs shadow-xs hover:bg-[#621c2a] transition cursor-pointer"
                      >
                        Save SubMenu
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetCatIdForSub(null)}
                        className="px-3 py-1.5 text-neutral-500 hover:text-neutral-800 text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Dynamic destination URL preview while typing */}
                    <div className="flex items-center gap-2 text-[11px] text-neutral-600 bg-white/70 p-2 rounded-xl border border-[#F5D5DC]">
                      <Link2 className="w-3.5 h-3.5 text-[#7B2435]" />
                      <span>Destination URL:</span>
                      <code className="font-mono text-[#7B2435] font-bold">
                        {getSubMenuDestUrl(category.name, subMenuName || 'Submenu')}
                      </code>
                    </div>
                  </form>
                </div>
              )}

              {/* Edit SubMenu Modal inline */}
              {editingSubMenu && editingSubMenu.catId === category.id && (
                <div className="p-4 bg-amber-50 border-b border-amber-200 animate-fade-in">
                  <form onSubmit={handleSaveEditSubMenu} className="flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-bold text-amber-900 flex items-center gap-1">
                      <Edit2 className="w-3.5 h-3.5" /> Edit SubMenu Column:
                    </span>
                    <input
                      type="text"
                      required
                      value={editSubName}
                      onChange={(e) => setEditSubName(e.target.value)}
                      className="bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-neutral-800 text-xs w-64"
                    />
                    <input
                      type="text"
                      value={editSubSlug}
                      onChange={(e) => setEditSubSlug(e.target.value)}
                      className="bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-neutral-800 text-xs font-mono w-40"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-amber-700 text-white rounded-full font-bold text-xs shadow-xs hover:bg-amber-800 cursor-pointer"
                    >
                      Update
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingSubMenu(null)}
                      className="px-3 py-1.5 text-neutral-600 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              )}

              {/* Level 1 & Level 2 Nested Hierarchy View */}
              {isExpanded && (
                <div className="p-6 bg-[#FCFAF8] space-y-6">
                  {category.subMenus && category.subMenus.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {category.subMenus.map((subMenu) => {
                        const isAddingSubSub = targetSubForSubSub?.catId === category.id && targetSubForSubSub?.subId === subMenu.id;
                        const subMenuDestUrl = getSubMenuDestUrl(category.name, subMenu.name);

                        return (
                          <div
                            key={subMenu.id}
                            className="bg-white p-5 rounded-2xl border border-[#F0E6E1] shadow-2xs space-y-3"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-[#F5ECE8]">
                              <div>
                                <h5 className="font-bold text-xs text-[#7B2435] uppercase tracking-wider">
                                  {subMenu.name}
                                </h5>
                                <span className="text-[10px] text-neutral-400 font-mono">
                                  /{subMenu.slug}
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setTargetSubForSubSub({ catId: category.id, subId: subMenu.id })}
                                  className="p-1.5 text-[#7B2435] hover:bg-[#FFF2F4] rounded-lg transition cursor-pointer"
                                  title="Add Child Subcategory Item"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSubMenu({ catId: category.id, subMenu });
                                    setEditSubName(subMenu.name);
                                    setEditSubSlug(subMenu.slug);
                                  }}
                                  className="p-1.5 text-neutral-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                  title="Edit Submenu Name"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubMenu(category.id, subMenu.id)}
                                  className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                                  title="Delete Submenu"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Destination URL row for this submenu */}
                            <div className="p-2 bg-[#FAF6F4] rounded-xl text-[10px] flex items-center justify-between gap-1 text-neutral-600">
                              <span className="truncate font-mono text-[#7B2435]">
                                {subMenuDestUrl}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(window.location.origin + subMenuDestUrl)}
                                className="text-neutral-500 hover:text-[#7B2435] shrink-0 font-bold"
                              >
                                {copiedUrl === window.location.origin + subMenuDestUrl ? 'Copied' : 'Copy'}
                              </button>
                            </div>

                            {/* Form to add Level 2 Sub-subcategory */}
                            {isAddingSubSub && (
                              <form onSubmit={handleAddSubSubCategory} className="space-y-2 bg-[#FFF6F4] p-3 rounded-xl border border-[#F5D5DC] animate-fadeIn">
                                <span className="text-[11px] font-bold text-[#7B2435] block">
                                  + Add item to {subMenu.name}:
                                </span>
                                <input
                                  type="text"
                                  required
                                  value={subSubName}
                                  onChange={(e) => {
                                    setSubSubName(e.target.value);
                                    if (!subSubSlug) setSubSubSlug(e.target.value.toLowerCase().replace(/[\s&]+/g, '-'));
                                  }}
                                  placeholder="e.g. Potli Bags, Juttis, Kundan Sets..."
                                  className="w-full bg-white border border-[#EADBDA] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#7B2435]"
                                />
                                
                                <div className="text-[10px] text-neutral-500 font-mono bg-white/60 p-1.5 rounded">
                                  Dest: {getSubSubDestUrl(category.name, subMenu.name, subSubName || 'Item')}
                                </div>

                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setTargetSubForSubSub(null)}
                                    className="text-[11px] text-neutral-500 hover:text-neutral-800 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    className="px-3 py-1 bg-[#7B2435] text-white rounded-full text-[11px] font-bold shadow-xs hover:bg-[#621c2a] cursor-pointer"
                                  >
                                    Add Item
                                  </button>
                                </div>
                              </form>
                            )}

                            {/* Edit Sub-sub item modal */}
                            {editingSubSub && editingSubSub.catId === category.id && editingSubSub.subId === subMenu.id && (
                              <form onSubmit={handleSaveEditSubSub} className="space-y-2 bg-amber-50 p-3 rounded-xl border border-amber-200 animate-fadeIn">
                                <span className="text-[11px] font-bold text-amber-900 block">
                                  Edit Item:
                                </span>
                                <input
                                  type="text"
                                  required
                                  value={editSubSubName}
                                  onChange={(e) => setEditSubSubName(e.target.value)}
                                  className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs"
                                />
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingSubSub(null)}
                                    className="text-[11px] text-neutral-500 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    className="px-3 py-1 bg-amber-700 text-white rounded-full text-[11px] font-bold cursor-pointer"
                                  >
                                    Update
                                  </button>
                                </div>
                              </form>
                            )}

                            {/* List of Sub-subcategories */}
                            <ul className="space-y-1.5">
                              {subMenu.subcategories && subMenu.subcategories.length > 0 ? (
                                subMenu.subcategories.map((subSub) => {
                                  const itemDestUrl = getSubSubDestUrl(category.name, subMenu.name, subSub.name);
                                  return (
                                    <li
                                      key={subSub.id}
                                      className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl hover:bg-[#FAF6F4] text-neutral-700 group transition"
                                    >
                                      <div className="flex flex-col min-w-0 pr-2">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#7B2435]"></span>
                                          <span className="font-semibold text-neutral-800">{subSub.name}</span>
                                        </div>
                                        <span className="text-[10px] text-neutral-400 font-mono truncate">
                                          {itemDestUrl}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingSubSub({ catId: category.id, subId: subMenu.id, item: subSub });
                                            setEditSubSubName(subSub.name);
                                            setEditSubSubSlug(subSub.slug);
                                          }}
                                          className="p-1 text-neutral-400 hover:text-amber-700 rounded transition cursor-pointer"
                                          title="Edit item name"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteSubSub(category.id, subMenu.id, subSub.id)}
                                          className="p-1 text-neutral-400 hover:text-red-600 rounded transition cursor-pointer"
                                          title="Delete subcategory item"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </li>
                                  );
                                })
                              ) : (
                                <li className="text-[11px] text-neutral-400 italic py-1">
                                  No items yet. Click + above.
                                </li>
                              )}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-white rounded-2xl border border-dashed border-[#EADBDA]">
                      <p className="text-xs text-neutral-500 mb-2">No submenu columns configured for this menu yet.</p>
                      <button
                        type="button"
                        onClick={() => setTargetCatIdForSub(category.id)}
                        className="px-3.5 py-1.5 bg-[#FFF2F4] text-[#7B2435] rounded-full text-xs font-bold hover:bg-[#FFE5E9] transition cursor-pointer"
                      >
                        + Add First SubMenu Column
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
