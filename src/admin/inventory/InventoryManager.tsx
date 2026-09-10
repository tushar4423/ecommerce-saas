import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  History,
  ArrowUpDown,
  Plus,
  Minus,
  Save,
  RefreshCw,
  Clock,
  UserCheck,
  Package,
} from 'lucide-react';
import {
  useGetProductsQuery,
  useGetInventoryLogsQuery,
  useAdjustVariantStockMutation,
} from '../../store/api/ecommerceApi';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { Product, ProductVariant } from '../../types';

interface FlattenedVariantItem {
  productId: string;
  productName: string;
  productImage: string;
  productCategory: string;
  variantId: string;
  sku: string;
  size: string;
  colorName: string;
  colorHex: string;
  stock: number;
}

export const InventoryManager: React.FC = () => {
  const { data: products = [], isLoading: isProductsLoading, refetch: refetchProducts } = useGetProductsQuery();
  const { data: logs = [], isLoading: isLogsLoading, refetch: refetchLogs } = useGetInventoryLogsQuery();
  const [adjustStock, { isLoading: isAdjusting }] = useAdjustVariantStockMutation();
  const { adminUser } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<'variants' | 'audit_logs'>('variants');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Adjustment Modal State
  const [selectedVariant, setSelectedVariant] = useState<FlattenedVariantItem | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'set' | 'add' | 'subtract'>('set');
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);
  const [reason, setReason] = useState<string>('Stock Audit / Cycle Count');
  const [notes, setNotes] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Flatten all product variants
  const flattenedVariants = useMemo<FlattenedVariantItem[]>(() => {
    const list: FlattenedVariantItem[] = [];
    products.forEach((p) => {
      const pImg = p.images?.[0]?.url || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=150&q=80';
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v) => {
          list.push({
            productId: p.id,
            productName: p.name,
            productImage: pImg,
            productCategory: p.category || 'Kurtis',
            variantId: v.id,
            sku: v.sku || `${p.sku}-${v.size}-${v.color || 'VAR'}`,
            size: v.size,
            colorName: v.color || 'Default',
            colorHex: v.colorHex || '#7B2435',
            stock: v.stock ?? 0,
          });
        });
      } else {
        // Product without explicit variants
        list.push({
          productId: p.id,
          productName: p.name,
          productImage: pImg,
          productCategory: p.category || 'Kurtis',
          variantId: `single-${p.id}`,
          sku: p.sku,
          size: 'Standard',
          colorName: 'Standard',
          colorHex: '#7B2435',
          stock: 15,
        });
      }
    });
    return list;
  }, [products]);

  // Overall Inventory Stats
  const stats = useMemo(() => {
    let totalUnits = 0;
    let totalVariants = flattenedVariants.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    flattenedVariants.forEach((item) => {
      totalUnits += item.stock;
      if (item.stock === 0) {
        outOfStockCount++;
      } else if (item.stock <= 5) {
        lowStockCount++;
      }
    });

    return {
      totalUnits,
      totalVariants,
      inStockCount: totalVariants - lowStockCount - outOfStockCount,
      lowStockCount,
      outOfStockCount,
    };
  }, [flattenedVariants]);

  // Filtered variants
  const filteredVariants = useMemo(() => {
    return flattenedVariants.filter((item) => {
      const matchSearch =
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.colorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.size.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        categoryFilter === 'all' ? true : item.productCategory === categoryFilter;

      let matchStock = true;
      if (stockFilter === 'out_of_stock') matchStock = item.stock === 0;
      else if (stockFilter === 'low_stock') matchStock = item.stock > 0 && item.stock <= 5;
      else if (stockFilter === 'in_stock') matchStock = item.stock > 5;

      return matchSearch && matchCategory && matchStock;
    });
  }, [flattenedVariants, searchQuery, categoryFilter, stockFilter]);

  // Unique categories for filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    flattenedVariants.forEach((v) => set.add(v.productCategory));
    return Array.from(set);
  }, [flattenedVariants]);

  // Open adjustment modal
  const openAdjustmentModal = (v: FlattenedVariantItem) => {
    setSelectedVariant(v);
    setAdjustmentType('set');
    setAdjustmentValue(v.stock);
    setReason('Stock Audit / Cycle Count');
    setNotes('');
  };

  // Submit stock adjustment
  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    let targetStock = selectedVariant.stock;
    if (adjustmentType === 'set') {
      targetStock = Math.max(0, Number(adjustmentValue));
    } else if (adjustmentType === 'add') {
      targetStock = selectedVariant.stock + Math.max(0, Number(adjustmentValue));
    } else if (adjustmentType === 'subtract') {
      targetStock = Math.max(0, selectedVariant.stock - Math.max(0, Number(adjustmentValue)));
    }

    try {
      await adjustStock({
        productId: selectedVariant.productId,
        variantId: selectedVariant.variantId,
        absoluteStock: targetStock,
        reason,
        notes,
        adminEmail: adminUser?.email || 'admin@vedaaya.com',
        adminName: adminUser?.name || 'Store Admin',
      }).unwrap();

      showToast(`Updated SKU ${selectedVariant.sku} stock to ${targetStock} units.`);
      setSelectedVariant(null);
      refetchProducts();
      refetchLogs();
    } catch (err: any) {
      alert(`Failed to update stock: ${err?.message || 'Server error'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900">Variant Inventory Management</h1>
            <span className="bg-[#7B2435]/10 text-[#7B2435] text-xs font-bold px-2.5 py-0.5 rounded-full">
              {stats.totalVariants} SKU Variants
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Real-time multi-variant inventory control, automated low-stock warnings, and detailed audit history.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('variants')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'variants'
                ? 'bg-white text-[#7B2435] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Boxes className="w-4 h-4" /> SKU Matrix
          </button>
          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'audit_logs'
                ? 'bg-white text-[#7B2435] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <History className="w-4 h-4" /> Audit Trail ({logs.length})
          </button>
        </div>
      </div>

      {/* Stats Summary Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FAF6F0] text-[#7B2435] flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">Total In-Stock Units</p>
            <p className="text-lg font-bold text-neutral-900">{stats.totalUnits.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">Healthy Stock Variants</p>
            <p className="text-lg font-bold text-emerald-800">{stats.inStockCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-amber-700 font-medium">Low Stock (≤ 5 units)</p>
            <p className="text-lg font-bold text-amber-900">{stats.lowStockCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/40 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 text-red-800 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-red-700 font-medium">Out of Stock</p>
            <p className="text-lg font-bold text-red-900">{stats.outOfStockCount}</p>
          </div>
        </div>
      </div>

      {activeTab === 'variants' ? (
        <>
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                id="input-inventory-search"
                type="text"
                placeholder="Search by SKU, product, size, or color..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#7B2435]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-700 font-medium"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
                <button
                  onClick={() => setStockFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    stockFilter === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
                  }`}
                >
                  All ({flattenedVariants.length})
                </button>
                <button
                  onClick={() => setStockFilter('in_stock')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    stockFilter === 'in_stock' ? 'bg-emerald-700 text-white' : 'text-neutral-600'
                  }`}
                >
                  In Stock
                </button>
                <button
                  onClick={() => setStockFilter('low_stock')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    stockFilter === 'low_stock' ? 'bg-amber-600 text-white' : 'text-neutral-600'
                  }`}
                >
                  Low Stock
                </button>
                <button
                  onClick={() => setStockFilter('out_of_stock')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    stockFilter === 'out_of_stock' ? 'bg-red-700 text-white' : 'text-neutral-600'
                  }`}
                >
                  Out of Stock
                </button>
              </div>

              <button
                onClick={() => refetchProducts()}
                className="p-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600"
                title="Refresh Inventory"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Variants Table */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF6F0] border-b border-neutral-200 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Product & Base Info</th>
                    <th className="py-3.5 px-4">Variant SKU</th>
                    <th className="py-3.5 px-4">Size</th>
                    <th className="py-3.5 px-4">Color Shade</th>
                    <th className="py-3.5 px-4">Stock Level</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs text-neutral-700">
                  {isProductsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-neutral-400">
                        Loading variant catalog...
                      </td>
                    </tr>
                  ) : filteredVariants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-neutral-400">
                        <Boxes className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                        No variant items match your search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredVariants.map((item) => {
                      const isOutOfStock = item.stock === 0;
                      const isLowStock = item.stock > 0 && item.stock <= 5;

                      return (
                        <tr
                          key={`${item.productId}-${item.variantId}`}
                          className={`hover:bg-neutral-50/70 transition-colors ${
                            isOutOfStock ? 'bg-red-50/20' : isLowStock ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-lg object-cover border border-neutral-200 shrink-0"
                              />
                              <div className="truncate max-w-xs">
                                <p className="font-bold text-neutral-900 truncate">{item.productName}</p>
                                <p className="text-[10px] text-neutral-500">{item.productCategory}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-semibold text-neutral-900">
                            {item.sku}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold bg-neutral-100 px-2 py-0.5 rounded text-neutral-800 border border-neutral-200">
                              {item.size}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-neutral-300 shadow-2xs"
                                style={{ backgroundColor: item.colorHex }}
                              />
                              <span className="font-medium text-neutral-700">{item.colorName}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded-full ${
                                isOutOfStock
                                  ? 'bg-red-100 text-red-800'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {item.stock} units
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                <XCircle className="w-3 h-3" /> Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3" /> Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> In Stock
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              id={`btn-adjust-stock-${item.sku}`}
                              onClick={() => openAdjustmentModal(item)}
                              className="px-3 py-1.5 bg-[#FAF6F0] hover:bg-[#7B2435] text-[#7B2435] hover:text-white border border-[#EADBDA] rounded-lg font-bold text-xs transition-all shadow-2xs"
                            >
                              Adjust Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Audit Trail Table */
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-neutral-200 bg-[#FAF6F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#7B2435]" />
              <h3 className="font-bold text-sm text-neutral-900">Inventory Adjustment Audit Log</h3>
            </div>
            <button
              onClick={() => refetchLogs()}
              className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-xs font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Product / SKU</th>
                  <th className="py-3 px-4">Stock Shift</th>
                  <th className="py-3 px-4">Adjustment Reason</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs text-neutral-700">
                {isLogsLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-neutral-400">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-400">
                      <Clock className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                      No inventory adjustments recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => {
                    const diff = (log.newStock ?? 0) - (log.previousStock ?? 0);
                    return (
                      <tr key={log.id} className="hover:bg-neutral-50/70">
                        <td className="py-3 px-4 whitespace-nowrap text-neutral-500 font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-bold text-neutral-900">{log.productName}</p>
                          <p className="text-[10px] text-neutral-500 font-mono">{log.sku}</p>
                        </td>

                        <td className="py-3 px-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="text-neutral-400">{log.previousStock}</span>
                            <span>→</span>
                            <span className="font-bold text-neutral-900">{log.newStock}</span>
                            <span
                              className={`font-bold text-[11px] px-1.5 py-0.2 rounded ${
                                diff > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : diff < 0
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-medium text-neutral-800">
                          {log.reason || 'General Adjustment'}
                        </td>

                        <td className="py-3 px-4 text-neutral-500 max-w-xs truncate">
                          {log.notes || '—'}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="font-semibold text-neutral-800">{log.adminName || log.adminEmail || 'Admin'}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {selectedVariant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-[#FAF6F0] border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#7B2435]/10 text-[#7B2435] flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm">Adjust Variant Stock</h3>
                  <p className="text-xs text-neutral-500 font-mono">{selectedVariant.sku}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVariant(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4">
              {/* Product Info Mini Pill */}
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center gap-3">
                <img
                  src={selectedVariant.productImage}
                  alt={selectedVariant.productName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-lg object-cover border border-neutral-200"
                />
                <div className="truncate">
                  <p className="font-bold text-xs text-neutral-900 truncate">{selectedVariant.productName}</p>
                  <p className="text-[11px] text-neutral-500">
                    Size: <b>{selectedVariant.size}</b> • Color: <b>{selectedVariant.colorName}</b>
                  </p>
                </div>
              </div>

              {/* Current Stock */}
              <div className="flex items-center justify-between p-3 bg-[#FAF6F0] rounded-xl border border-[#EADBDA]">
                <span className="text-xs text-neutral-600 font-medium">Current Stock on Hand:</span>
                <span className="text-base font-bold font-mono text-[#7B2435]">
                  {selectedVariant.stock} units
                </span>
              </div>

              {/* Adjustment Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Adjustment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustmentType('set');
                      setAdjustmentValue(selectedVariant.stock);
                    }}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      adjustmentType === 'set'
                        ? 'bg-[#7B2435] text-white border-[#7B2435]'
                        : 'bg-white text-neutral-700 border-neutral-200'
                    }`}
                  >
                    Set Exact (Count)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustmentType('add');
                      setAdjustmentValue(10);
                    }}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      adjustmentType === 'add'
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white text-neutral-700 border-neutral-200'
                    }`}
                  >
                    + Add Units
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustmentType('subtract');
                      setAdjustmentValue(5);
                    }}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      adjustmentType === 'subtract'
                        ? 'bg-red-700 text-white border-red-700'
                        : 'bg-white text-neutral-700 border-neutral-200'
                    }`}
                  >
                    - Deduct Units
                  </button>
                </div>
              </div>

              {/* Input Value */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  {adjustmentType === 'set' ? 'New Total Stock Quantity' : 'Quantity to Shift'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold font-mono border border-neutral-300 rounded-xl focus:outline-none focus:border-[#7B2435]"
                />
              </div>

              {/* Reason Selector */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Reason for Adjustment *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-[#7B2435]"
                >
                  <option value="Purchase Shipment Received">Purchase Shipment Received (Stock In)</option>
                  <option value="Stock Audit / Cycle Count">Stock Audit / Physical Cycle Count</option>
                  <option value="Customer Return Restock">Customer Return Restocked</option>
                  <option value="Damaged / Fabric Defect">Damaged / Fabric Defect Written Off</option>
                  <option value="Sample / Studio Photoshoot">Sample for Studio Photoshoot</option>
                  <option value="Manual Correction">Manual Correction</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Internal Notes / PO Ref
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. PO-8924 received from Jaipur warehouse"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-[#7B2435]"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVariant(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#7B2435] hover:bg-[#631B2A] rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {isAdjusting ? 'Updating...' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
