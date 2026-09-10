import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  Users,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Layers,
  ArrowDownRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { api } from '../../services/api';
import { AdminDashboardAnalytics } from '../../types/admin';
import { Button } from '../../components/ui/Button';

interface AdminDashboardOverviewProps {
  onNavigateSection: (section: any) => void;
  onQuickRestockProduct?: (productId: string) => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  onNavigateSection,
  onQuickRestockProduct,
}) => {
  const [analytics, setAnalytics] = useState<AdminDashboardAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timelineFilter, setTimelineFilter] = useState<'7d' | '30d'>('7d');

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminDashboardAnalytics();
      if (data) {
        setAnalytics(data);
      }
    } catch (e) {
      console.warn('Failed to load dashboard analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading && !analytics) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-[#7B2435] animate-spin" />
        <p className="text-xs font-semibold text-neutral-500">
          Aggregating store metrics from live database...
        </p>
      </div>
    );
  }

  const {
    revenue = { totalRevenue: 0, averageOrderValue: 0, totalDiscountGiven: 0, periodGrowthPercent: 0 },
    orders = { totalCount: 0, pendingCount: 0, packedCount: 0, shippedCount: 0, deliveredCount: 0, returnRequestedCount: 0, cancelledCount: 0 },
    customers = { totalCount: 0, newThisMonth: 0, repeatCustomerRate: 0 },
    inventory = { totalProducts: 0, totalStockUnits: 0, lowStockCount: 0, lowStockList: [] },
    bestSellers = [],
    revenueTimeline = [],
    categorySalesDistribution = [],
  } = analytics || {};

  // Maximum revenue value for timeline chart normalization
  const maxRevenue = Math.max(...revenueTimeline.map((t) => t.revenue), 10000);

  return (
    <div className="space-y-8">
      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Gross Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-serif font-black text-neutral-900">
              {formatCurrency(revenue.totalRevenue)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-700 font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{revenue.periodGrowthPercent}% vs last period</span>
            </div>
          </div>
        </div>

        {/* Total Orders & Status */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Total Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-serif font-black text-neutral-900">
              {orders.totalCount}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-neutral-500 font-medium">
              <span className="text-amber-700 font-bold">{orders.pendingCount} pending</span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">{orders.deliveredCount} delivered</span>
            </div>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Avg. Order Value
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-serif font-black text-neutral-900">
              {formatCurrency(revenue.averageOrderValue)}
            </h3>
            <p className="text-xs text-neutral-400 mt-1.5">
              Across {orders.totalCount} completed checkouts
            </p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Low Stock Alerts
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-serif font-black text-rose-600">
              {inventory.lowStockCount}
            </h3>
            <button
              type="button"
              onClick={() => onNavigateSection('products')}
              className="text-xs text-[#7B2435] font-bold hover:underline mt-1.5 flex items-center gap-1 cursor-pointer"
            >
              <span>Review variants in catalog</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Row: Revenue Trend & Order Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Timeline Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-neutral-900">
                Revenue Trend & Daily Volume
              </h3>
              <p className="text-xs text-neutral-400">
                Aggregated sales from confirmed Indian payment gateways
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#FAF6F0] p-1 rounded-xl border border-neutral-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setTimelineFilter('7d')}
                className={`px-3 py-1 rounded-lg transition ${
                  timelineFilter === '7d' ? 'bg-[#7B2435] text-white shadow-xs' : 'text-neutral-600'
                }`}
              >
                Last 7 Days
              </button>
            </div>
          </div>

          {/* SVG Bar / Area Visualization */}
          <div className="h-48 w-full flex items-end justify-between gap-3 pt-6 pb-2 border-b border-neutral-100">
            {revenueTimeline.map((item, index) => {
              const heightPercent = Math.min(100, Math.max(15, (item.revenue / maxRevenue) * 100));
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 bg-neutral-900 text-white text-[10px] py-1 px-2 rounded-md font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition shadow-lg pointer-events-none z-10">
                    {formatCurrency(item.revenue)} ({item.orderCount} orders)
                  </div>

                  <div className="w-full bg-[#FAF6F0] rounded-xl flex items-end justify-center h-36 overflow-hidden">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-[#7B2435] to-[#9E3347] rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-neutral-500">{item.label}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 text-xs text-neutral-500">
            <span>Peak Day: {revenueTimeline.reduce((prev, curr) => (curr.revenue > prev.revenue ? curr : prev), revenueTimeline[0] || { label: 'Today', revenue: 0, orderCount: 0, date: '' }).label}</span>
            <span>Total Catalog Products: <strong className="text-neutral-800">{inventory.totalProducts}</strong></span>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-neutral-900 mb-1">
              Order Fulfillment Breakdown
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              Live statuses across warehouse & logistics
            </p>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3 bg-amber-50/70 border border-amber-200/60 rounded-2xl text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Pending / Packing</span>
                </div>
                <span className="font-black text-amber-900 text-sm">{orders.pendingCount + orders.packedCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200/60 rounded-2xl text-xs">
                <div className="flex items-center gap-2 text-blue-900 font-bold">
                  <Truck className="w-4 h-4 text-blue-700" />
                  <span>In Transit / Shipped</span>
                </div>
                <span className="font-black text-blue-900 text-sm">{orders.shippedCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Delivered & Completed</span>
                </div>
                <span className="font-black text-emerald-900 text-sm">{orders.deliveredCount}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-rose-50/70 border border-rose-200/60 rounded-2xl text-xs">
                <div className="flex items-center gap-2 text-rose-900 font-bold">
                  <RotateCcw className="w-4 h-4 text-rose-700" />
                  <span>Returns & Cancellations</span>
                </div>
                <span className="font-black text-rose-900 text-sm">{orders.returnRequestedCount + orders.cancelledCount}</span>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateSection('orders')}
            className="w-full mt-4"
          >
            Manage All Orders ({orders.totalCount})
          </Button>
        </div>
      </div>

      {/* Second Row: Best Selling Kurtis & Low Stock Urgent Restock Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling Kurtis */}
        <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-neutral-900">
                Top-Selling Kurtis & Sets
              </h3>
              <p className="text-xs text-neutral-400">
                High-velocity products ranked by actual revenue
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('products')}
              className="text-xs text-[#7B2435] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Catalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {bestSellers.slice(0, 5).map((prod, idx) => (
              <div key={prod.productId} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center text-xs font-bold text-neutral-400">
                    #{idx + 1}
                  </span>
                  <img
                    src={prod.image || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=100&q=80'}
                    alt={prod.productName}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 object-cover rounded-xl border border-neutral-200 shrink-0"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">
                      {prod.productName}
                    </h4>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      SKU: {prod.sku} • {prod.category}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-[#7B2435]">
                    {formatCurrency(prod.totalRevenue)}
                  </div>
                  <span className="text-[10px] text-neutral-500 font-semibold">
                    {prod.unitsSold} units sold
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Urgent Table */}
        <div className="bg-white rounded-3xl p-6 border border-neutral-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-neutral-900">
                Low Stock Threshold Alerts (≤ 5 Units)
              </h3>
              <p className="text-xs text-neutral-400">
                Products nearing zero stock in fulfillment center
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateSection('products')}
              className="text-xs text-[#7B2435] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {inventory.lowStockList && inventory.lowStockList.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {inventory.lowStockList.slice(0, 5).map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=100&q=80'}
                      alt={item.productName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover rounded-xl border border-neutral-200 shrink-0"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">
                        {item.productName}
                      </h4>
                      <span className="text-[10px] text-neutral-500 font-semibold">
                        Size: <strong>{item.variantSize}</strong> | Color: <strong>{item.variantColor}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-black">
                      {item.stock} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-neutral-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span>All product inventory levels are healthy above safety threshold.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
