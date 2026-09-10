import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  ArrowUpDown,
  ExternalLink,
  Package,
  Layers,
  HelpCircle,
  Filter,
  Check,
} from 'lucide-react';
import {
  useGetCollectionsQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useGetProductsQuery,
  useGetCategoriesQuery,
} from '../../store/api/ecommerceApi';
import { Collection, CollectionRule, Product } from '../../types';

export const CollectionManager: React.FC = () => {
  const { data: collections = [], isLoading } = useGetCollectionsQuery();
  const { data: products = [] } = useGetProductsQuery();
  const { data: categories = [] } = useGetCategoriesQuery();

  const [createCollection, { isLoading: isCreating }] = useCreateCollectionMutation();
  const [updateCollection, { isLoading: isUpdating }] = useUpdateCollectionMutation();
  const [deleteCollection, { isLoading: isDeleting }] = useDeleteCollectionMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [previewCollection, setPreviewCollection] = useState<Collection | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    bannerUrl: string;
    imageUrl: string;
    featured: boolean;
    displayOrder: number;
    isActive: boolean;
    assignmentType: 'manual' | 'dynamic' | 'both';
    productIds: string[];
    rules: CollectionRule;
  }>({
    name: '',
    slug: '',
    title: '',
    subtitle: '',
    description: '',
    bannerUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
    featured: true,
    displayOrder: 1,
    isActive: true,
    assignmentType: 'dynamic',
    productIds: [],
    rules: {
      isNewArrival: false,
      isBestseller: false,
      isFestive: false,
      isPlusSize: false,
      category: '',
      fabric: '',
      occasion: '',
      minPrice: undefined,
      maxPrice: undefined,
      minDiscount: undefined,
    },
  });

  const [productSearch, setProductSearch] = useState('');

  // Filter collections
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? c.isActive !== false
          : c.isActive === false;
      return matchSearch && matchStatus;
    });
  }, [collections, searchQuery, statusFilter]);

  // Helper to compute matching products for rules or manual
  const getMatchingProducts = (
    assignmentType: 'manual' | 'dynamic' | 'both',
    productIds: string[],
    rules: CollectionRule
  ): Product[] => {
    let result = new Map<string, Product>();

    if (assignmentType === 'manual' || assignmentType === 'both') {
      productIds.forEach((id) => {
        const found = products.find((p) => p.id === id);
        if (found) result.set(found.id, found);
      });
    }

    if (assignmentType === 'dynamic' || assignmentType === 'both') {
      products.forEach((p) => {
        let match = true;
        if (rules.isNewArrival && !p.isNewArrival) match = false;
        if (rules.isBestseller && !p.isBestseller) match = false;
        if (rules.isFestive && !p.isFestive) match = false;
        if (rules.isPlusSize && !p.isPlusSize) match = false;
        if (rules.category && p.category !== rules.category) match = false;
        if (rules.fabric && (!p.fabric || !p.fabric.toLowerCase().includes(rules.fabric.toLowerCase()))) match = false;
        if (rules.occasion && (!p.occasion || !p.occasion.toLowerCase().includes(rules.occasion.toLowerCase()))) match = false;
        if (rules.minPrice !== undefined && (p.sellingPrice || 0) < rules.minPrice) match = false;
        if (rules.maxPrice !== undefined && (p.sellingPrice || 0) > rules.maxPrice) match = false;
        if (rules.minDiscount !== undefined && (p.discountPercent || 0) < rules.minDiscount) match = false;

        if (match) {
          result.set(p.id, p);
        }
      });
    }

    return Array.from(result.values());
  };

  // Preview count in form
  const matchedInForm = useMemo(() => {
    return getMatchingProducts(formData.assignmentType, formData.productIds, formData.rules);
  }, [formData, products]);

  const openCreateModal = () => {
    setEditingCollection(null);
    setFormData({
      name: '',
      slug: '',
      title: '',
      subtitle: '',
      description: '',
      bannerUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
      featured: true,
      displayOrder: collections.length + 1,
      isActive: true,
      assignmentType: 'dynamic',
      productIds: [],
      rules: {
        isNewArrival: false,
        isBestseller: false,
        isFestive: false,
        isPlusSize: false,
        category: '',
        fabric: '',
        occasion: '',
        minPrice: undefined,
        maxPrice: undefined,
        minDiscount: undefined,
      },
    });
    setIsModalOpen(true);
  };

  const openEditModal = (col: Collection) => {
    setEditingCollection(col);
    setFormData({
      name: col.name || '',
      slug: col.slug || '',
      title: col.title || col.name || '',
      subtitle: col.subtitle || '',
      description: col.description || '',
      bannerUrl: col.bannerUrl || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
      imageUrl: col.imageUrl || col.bannerUrl || '',
      featured: col.featured ?? false,
      displayOrder: col.displayOrder ?? 1,
      isActive: col.isActive !== false,
      assignmentType: col.assignmentType || 'dynamic',
      productIds: col.productIds || [],
      rules: {
        isNewArrival: col.rules?.isNewArrival ?? (col.slug === 'new-arrivals'),
        isBestseller: col.rules?.isBestseller ?? (col.slug === 'bestsellers'),
        isFestive: col.rules?.isFestive ?? (col.slug === 'festive'),
        isPlusSize: col.rules?.isPlusSize ?? (col.slug === 'plus-size'),
        category: col.rules?.category || '',
        fabric: col.rules?.fabric || '',
        occasion: col.rules?.occasion || '',
        minPrice: col.rules?.minPrice,
        maxPrice: col.rules?.maxPrice,
        minDiscount: col.rules?.minDiscount,
      },
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const autoSlug =
      formData.slug.trim() ||
      formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const payload: Partial<Collection> = {
      name: formData.name.trim(),
      slug: autoSlug,
      title: formData.title.trim() || formData.name.trim(),
      subtitle: formData.subtitle.trim(),
      description: formData.description.trim(),
      bannerUrl: formData.bannerUrl,
      imageUrl: formData.imageUrl || formData.bannerUrl,
      featured: formData.featured,
      displayOrder: Number(formData.displayOrder) || 1,
      isActive: formData.isActive,
      assignmentType: formData.assignmentType,
      productIds: formData.productIds,
      rules: formData.rules,
      productCount: matchedInForm.length,
    };

    if (editingCollection) {
      await updateCollection({ id: editingCollection.id, updates: payload });
    } else {
      await createCollection(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the collection "${name}"?`)) {
      await deleteCollection(id);
    }
  };

  const toggleProductSelection = (prodId: string) => {
    setFormData((prev) => {
      const exists = prev.productIds.includes(prodId);
      return {
        ...prev,
        productIds: exists
          ? prev.productIds.filter((id) => id !== prodId)
          : [...prev.productIds, prodId],
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900">Collections Management</h1>
            <span className="bg-[#7B2435]/10 text-[#7B2435] text-xs font-bold px-2.5 py-0.5 rounded-full">
              {collections.length} Curations
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Curate New Arrivals, Bestsellers, Festive, Office Wear, and custom rules-based or manual product lines.
          </p>
        </div>

        <button
          id="btn-create-collection"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-[#7B2435] hover:bg-[#631B2A] text-white px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Collection
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FAF6F0] p-4 rounded-xl border border-[#EADBDA] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#7B2435]/10 text-[#7B2435] flex items-center justify-center font-bold">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">Total Collections</p>
            <p className="text-lg font-bold text-neutral-900">{collections.length}</p>
          </div>
        </div>

        <div className="bg-[#FAF6F0] p-4 rounded-xl border border-[#EADBDA] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">Active Curations</p>
            <p className="text-lg font-bold text-emerald-800">
              {collections.filter((c) => c.isActive !== false).length}
            </p>
          </div>
        </div>

        <div className="bg-[#FAF6F0] p-4 rounded-xl border border-[#EADBDA] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">Featured on Homepage</p>
            <p className="text-lg font-bold text-amber-800">
              {collections.filter((c) => c.featured).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            id="input-collection-search"
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#7B2435]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#7B2435] text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All ({collections.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'active'
                ? 'bg-emerald-700 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Active ({collections.filter((c) => c.isActive !== false).length})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-neutral-800 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Inactive ({collections.filter((c) => c.isActive === false).length})
          </button>
        </div>
      </div>

      {/* Collections Grid */}
      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-neutral-200">
          <p className="text-neutral-500 text-sm animate-pulse">Loading collections...</p>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-neutral-200">
          <FolderKanban className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-800">No collections found</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search keywords.' : 'Create your first boutique ethnic collection.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCollections.map((col) => {
            const resolvedProds = getMatchingProducts(
              col.assignmentType || 'dynamic',
              col.productIds || [],
              col.rules || {}
            );

            return (
              <div
                key={col.id}
                id={`collection-card-${col.id}`}
                className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Banner Header */}
                <div className="relative h-36 bg-neutral-100 overflow-hidden group">
                  <img
                    src={col.bannerUrl || col.imageUrl || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80'}
                    alt={col.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                    {col.featured && (
                      <span className="bg-[#D4AF37] text-neutral-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3 h-3" /> Featured
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
                        col.isActive !== false
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {col.isActive !== false ? 'Active' : 'Draft'}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-bold text-base truncate drop-shadow-xs">{col.name}</h3>
                    <p className="text-xs text-neutral-200 truncate">{col.subtitle || col.title}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span className="font-mono bg-neutral-100 px-2 py-0.5 rounded">
                        /{col.slug}
                      </span>
                      <span className="font-semibold text-neutral-700 bg-[#FAF6F0] px-2 py-0.5 rounded border border-[#EADBDA]">
                        Order #{col.displayOrder ?? 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-[#7B2435]" />
                        Mode:
                      </span>
                      <span className="font-bold text-neutral-800 capitalize">
                        {col.assignmentType || 'Dynamic Rules'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500 flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-neutral-400" />
                        Resolved Products:
                      </span>
                      <span className="font-bold text-[#7B2435] bg-[#7B2435]/10 px-2 py-0.5 rounded-full">
                        {resolvedProds.length} Products
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPreviewCollection(col)}
                      className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(col)}
                        className="p-1.5 rounded-lg text-neutral-600 hover:bg-neutral-100 hover:text-[#7B2435] transition-colors"
                        title="Edit collection"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(col.id, col.name)}
                        className="p-1.5 rounded-lg text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete collection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-[#FAF6F0]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#7B2435]/10 text-[#7B2435] flex items-center justify-center">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-base">
                    {editingCollection ? 'Edit Collection' : 'Create New Collection'}
                  </h3>
                  <p className="text-xs text-neutral-500">Configure collection metadata, dynamic rules, and product assignments</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Festive Edit"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-[#7B2435]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Slug / URL Path
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. festive-edit"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-[#7B2435]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Hero Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Handcrafted Festive Opulence"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-[#7B2435]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Subtitle / Tagline
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pure Zari & Velvet Drapes"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-[#7B2435]"
                  />
                </div>
              </div>

              {/* Banner & Cover Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Banner URL (Desktop 1200x400)
                  </label>
                  <input
                    type="text"
                    value={formData.bannerUrl}
                    onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-[#7B2435]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Card Cover URL (Portrait 600x800)
                  </label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-[#7B2435]"
                  />
                </div>
              </div>

              {/* Assignment Mode */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <label className="block text-xs font-bold text-neutral-800">
                  Product Assignment Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, assignmentType: 'dynamic' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      formData.assignmentType === 'dynamic'
                        ? 'bg-[#7B2435] text-white border-[#7B2435]'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    Dynamic Rules
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, assignmentType: 'manual' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      formData.assignmentType === 'manual'
                        ? 'bg-[#7B2435] text-white border-[#7B2435]'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    Manual Multi-Pick
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, assignmentType: 'both' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      formData.assignmentType === 'both'
                        ? 'bg-[#7B2435] text-white border-[#7B2435]'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    Hybrid (Rules + Manual)
                  </button>
                </div>
              </div>

              {/* Dynamic Rules Configuration */}
              {(formData.assignmentType === 'dynamic' || formData.assignmentType === 'both') && (
                <div className="p-4 bg-[#FAF6F0] rounded-xl border border-[#EADBDA] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#7B2435] flex items-center gap-1.5">
                      <Sliders className="w-4 h-4" /> Configurable Rules
                    </h4>
                    <span className="text-[11px] font-semibold text-neutral-600">
                      Live match: <b>{matchedInForm.length} products</b>
                    </span>
                  </div>

                  {/* Flag Toggles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={formData.rules.isNewArrival ?? false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rules: { ...formData.rules, isNewArrival: e.target.checked },
                          })
                        }
                        className="rounded text-[#7B2435]"
                      />
                      <span className="font-semibold text-neutral-800">New Arrivals</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={formData.rules.isBestseller ?? false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rules: { ...formData.rules, isBestseller: e.target.checked },
                          })
                        }
                        className="rounded text-[#7B2435]"
                      />
                      <span className="font-semibold text-neutral-800">Bestsellers</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={formData.rules.isFestive ?? false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rules: { ...formData.rules, isFestive: e.target.checked },
                          })
                        }
                        className="rounded text-[#7B2435]"
                      />
                      <span className="font-semibold text-neutral-800">Festive Wear</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-neutral-200 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={formData.rules.isPlusSize ?? false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rules: { ...formData.rules, isPlusSize: e.target.checked },
                          })
                        }
                        className="rounded text-[#7B2435]"
                      />
                      <span className="font-semibold text-neutral-800">Plus Size</span>
                    </label>
                  </div>

                  {/* Category & Fabric & Occasion Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        Category Constraint
                      </label>
                      <select
                        value={formData.rules.category || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rules: { ...formData.rules, category: e.target.value },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg"
                      >
                        <option value="">Any Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        Fabric Constraint
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Cotton, Velvet"
                        value={formData.rules.fabric || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rules: { ...formData.rules, fabric: e.target.value },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        Occasion Constraint
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Daily, Festive"
                        value={formData.rules.occasion || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rules: { ...formData.rules, occasion: e.target.value },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Price & Discount Limits */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        Min Price (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.rules.minPrice ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rules: {
                              ...formData.rules,
                              minPrice: e.target.value ? Number(e.target.value) : undefined,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        Max Price (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 1999"
                        value={formData.rules.maxPrice ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rules: {
                              ...formData.rules,
                              maxPrice: e.target.value ? Number(e.target.value) : undefined,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                        Min Discount (% off)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 20"
                        value={formData.rules.minDiscount ?? ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            rules: {
                              ...formData.rules,
                              minDiscount: e.target.value ? Number(e.target.value) : undefined,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Multi-Picker */}
              {(formData.assignmentType === 'manual' || formData.assignmentType === 'both') && (
                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-neutral-800">
                      Pick Specific Products ({formData.productIds.length} Selected)
                    </label>
                    <input
                      type="text"
                      placeholder="Search store products..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-white border border-neutral-300 rounded-lg w-48"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-neutral-200 p-2 rounded-lg bg-white">
                    {products
                      .filter((p) =>
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(productSearch.toLowerCase())
                      )
                      .slice(0, 30)
                      .map((p) => {
                        const isSelected = formData.productIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => toggleProductSelection(p.id)}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#7B2435]/10 border border-[#7B2435]/30'
                                : 'hover:bg-neutral-50 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <img
                                src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=100&q=80'}
                                alt={p.name}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded object-cover shrink-0"
                              />
                              <div className="truncate">
                                <p className="font-semibold text-neutral-900 truncate">{p.name}</p>
                                <p className="text-[10px] text-neutral-500 font-mono">{p.sku} • ₹{p.sellingPrice}</p>
                              </div>
                            </div>
                            <div className="shrink-0 ml-2">
                              {isSelected ? (
                                <Check className="w-4 h-4 text-[#7B2435]" />
                              ) : (
                                <div className="w-4 h-4 rounded border border-neutral-300" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Display Options */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-neutral-100">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:border-[#7B2435]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-neutral-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="rounded text-[#7B2435]"
                    />
                    Featured on Home
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-neutral-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded text-[#7B2435]"
                    />
                    Active Collection
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="px-5 py-2 text-sm font-bold text-white bg-[#7B2435] hover:bg-[#631B2A] rounded-xl shadow-xs disabled:opacity-50"
                >
                  {editingCollection ? 'Update Collection' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collection Live Preview Drawer / Modal */}
      {previewCollection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-[#FAF6F0]">
              <div>
                <h3 className="font-bold text-base text-neutral-900">{previewCollection.name}</h3>
                <p className="text-xs text-neutral-500">Live Resolved Products ({getMatchingProducts(previewCollection.assignmentType || 'dynamic', previewCollection.productIds || [], previewCollection.rules || {}).length} Items)</p>
              </div>
              <button
                onClick={() => setPreviewCollection(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1.5"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Cover Banner */}
              <div className="relative h-44 rounded-xl overflow-hidden mb-6">
                <img
                  src={previewCollection.bannerUrl || previewCollection.imageUrl}
                  alt={previewCollection.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5 text-white">
                  <h2 className="text-xl font-bold">{previewCollection.title || previewCollection.name}</h2>
                  <p className="text-xs text-neutral-200">{previewCollection.subtitle}</p>
                </div>
              </div>

              {/* Resolved Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {getMatchingProducts(
                  previewCollection.assignmentType || 'dynamic',
                  previewCollection.productIds || [],
                  previewCollection.rules || {}
                ).map((p) => (
                  <div key={p.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
                    <img
                      src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=300&q=80'}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-2.5">
                      <p className="font-bold text-xs text-neutral-900 truncate">{p.name}</p>
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <span className="font-bold text-[#7B2435]">₹{p.sellingPrice}</span>
                        <span className="text-[10px] text-neutral-400 font-mono">{p.sku}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
