import React, { useState, useMemo } from 'react';
import {
  Eye,
  Truck,
  Package,
  CheckCircle2,
  Printer,
  FileText,
  Search,
  Filter,
  MapPin,
  TrendingUp,
  ArrowUpDown,
  Phone,
  User,
  SlidersHorizontal,
  X,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Order, OrderStatus } from '../../types';
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from '../../store/api/ecommerceApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import { OrderDetailView } from './OrderDetailView';
import { InvoiceModal } from '../../components/invoice/InvoiceModal';

export const OrdersManager: React.FC = () => {
  const toast = useToast();
  const { data: orders = [], isLoading } = useGetOrdersQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  // Full Page Detail View State
  const [activeOrderForPage, setActiveOrderForPage] = useState<Order | null>(null);

  // Quick Modal Management State
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('Pending');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierPartner, setCourierPartner] = useState('BlueDart / Delhivery');

  // Direct Invoice Modal State
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest'); // 'highest_volume', 'lowest_volume', 'most_items', 'newest', 'oldest', 'customer_az'
  const [paymentFilter, setPaymentFilter] = useState<string>('all'); // 'all', 'Paid', 'Pending'
  const [highValueOnly, setHighValueOnly] = useState<boolean>(false);

  // Extract unique locations for dropdowns (dynamically narrowed by selected state)
  const { uniqueStates, uniqueCities } = useMemo(() => {
    const stateMap = new Map<string, Set<string>>();
    const allStates = new Set<string>();
    const allCities = new Set<string>();

    orders.forEach((o) => {
      const rawState = o.shippingAddress?.state?.trim();
      const rawCity = o.shippingAddress?.city?.trim();
      if (rawState) {
        allStates.add(rawState);
        const stateKey = rawState.toLowerCase();
        if (!stateMap.has(stateKey)) {
          stateMap.set(stateKey, new Set());
        }
        if (rawCity) {
          stateMap.get(stateKey)!.add(rawCity);
        }
      }
      if (rawCity) {
        allCities.add(rawCity);
      }
    });

    const cityList =
      selectedState !== 'all' && stateMap.has(selectedState.trim().toLowerCase())
        ? Array.from(stateMap.get(selectedState.trim().toLowerCase())!).sort()
        : Array.from(allCities).sort();

    return {
      uniqueStates: Array.from(allStates).sort(),
      uniqueCities: cityList,
    };
  }, [orders, selectedState]);

  // Handle state change and auto-align city filter
  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    if (newState === 'all') {
      setSelectedCity('all');
    } else {
      const stateCities = orders
        .filter((o) => (o.shippingAddress?.state || '').trim().toLowerCase() === newState.trim().toLowerCase())
        .map((o) => (o.shippingAddress?.city || '').trim().toLowerCase());
      if (selectedCity !== 'all' && !stateCities.includes(selectedCity.trim().toLowerCase())) {
        setSelectedCity('all');
      }
    }
  };

  // Helper to match an order against search query
  const matchesSearch = (order: Order, query: string) => {
    if (!query.trim()) return true;
    const cleanQ = query.trim().toLowerCase();
    const digitsQ = cleanQ.replace(/\D/g, '');
    const tokens = cleanQ.split(/\s+/).filter(Boolean);

    const orderNum = (order.orderNumber || order.id || '').toLowerCase();
    const rawId = (order.id || '').toLowerCase();
    const invoiceNum = (order.invoiceNumber || '').toLowerCase();
    const custName = (order.customerName || order.shippingAddress?.fullName || order.shippingAddress?.name || '').toLowerCase();
    const custEmail = (order.customerEmail || (order.shippingAddress as any)?.email || '').toLowerCase();
    const rawPhone = (order.customerPhone || order.shippingAddress?.phone || '');
    const digitsPhone = rawPhone.replace(/\D/g, '');

    const addr1 = (order.shippingAddress?.addressLine1 || '').toLowerCase();
    const addr2 = (order.shippingAddress?.addressLine2 || '').toLowerCase();
    const landmark = (order.shippingAddress?.landmark || '').toLowerCase();
    const city = (order.shippingAddress?.city || '').toLowerCase();
    const state = (order.shippingAddress?.state || '').toLowerCase();
    const pincode = (order.shippingAddress?.pincode || '').toLowerCase();
    const courier = (order.courierPartner || '').toLowerCase();
    const tracking = (order.trackingNumber || '').toLowerCase();
    const paymentMode = (order.paymentMethod || '').toLowerCase();

    // Items summary
    const itemsText = (order.items || [])
      .map((it: any) => `${it.productName || it.name || ''} ${it.color || ''} ${it.size || ''} ${it.sku || ''}`)
      .join(' ')
      .toLowerCase();

    const fullHaystack = `${orderNum} ${rawId} ${invoiceNum} ${custName} ${custEmail} ${rawPhone} ${digitsPhone} ${addr1} ${addr2} ${landmark} ${city} ${state} ${pincode} ${courier} ${tracking} ${paymentMode} ${itemsText}`;

    // Direct phone matching
    if (digitsQ.length >= 4 && digitsPhone.includes(digitsQ)) {
      return true;
    }

    // Direct order number matching (strip punctuation like # and -)
    const strippedOrderNum = orderNum.replace(/[^a-z0-9]/gi, '');
    const strippedQuery = cleanQ.replace(/[^a-z0-9]/gi, '');
    if (strippedQuery.length >= 3 && strippedOrderNum.includes(strippedQuery)) {
      return true;
    }

    // Multi-token matching: all words in search must appear somewhere in order haystack
    return tokens.every((token) => fullHaystack.includes(token));
  };

  // Helper to match status tab
  const matchesStatus = (order: Order, tab: string) => {
    if (tab === 'all') return true;
    const stat = (order.orderStatus || (order as any).status || 'Confirmed').toLowerCase();
    if (tab === 'Confirmed') {
      return ['confirmed', 'processing', 'packed', 'order placed'].includes(stat);
    }
    if (tab === 'shipped') {
      return ['shipped', 'out for delivery', 'in transit', 'dispatched'].includes(stat);
    }
    if (tab === 'Delivered') {
      return ['delivered', 'completed'].includes(stat);
    }
    if (tab === 'pending') {
      return ['pending', 'payment pending', 'unpaid', 'on hold'].includes(stat);
    }
    if (tab === 'Cancelled') {
      return ['cancelled', 'canceled', 'refunded', 'returned'].includes(stat);
    }
    return stat === tab.toLowerCase();
  };

  // Check how many orders match search regardless of status tab
  const totalMatchesAcrossStatuses = useMemo(() => {
    if (!searchTerm.trim() && selectedState === 'all' && selectedCity === 'all' && paymentFilter === 'all' && !highValueOnly) {
      return orders.length;
    }
    return orders.filter((order) => {
      if (selectedState !== 'all') {
        const orderState = (order.shippingAddress?.state || '').trim().toLowerCase();
        if (orderState !== selectedState.trim().toLowerCase()) return false;
      }
      if (selectedCity !== 'all') {
        const orderCity = (order.shippingAddress?.city || '').trim().toLowerCase();
        if (orderCity !== selectedCity.trim().toLowerCase()) return false;
      }
      if (paymentFilter !== 'all') {
        const pStat = order.paymentStatus || (order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid');
        if (pStat !== paymentFilter) return false;
      }
      if (highValueOnly) {
        const orderTotal = Number(order.grandTotal || order.totalAmount || order.subtotal || 0);
        if (orderTotal < 3000) return false;
      }
      return matchesSearch(order, searchTerm);
    }).length;
  }, [orders, searchTerm, selectedState, selectedCity, paymentFilter, highValueOnly]);

  // Filtered and Sorted Orders
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Status filter
        if (!matchesStatus(order, selectedStatusTab)) {
          return false;
        }

        // State / Location filter
        if (selectedState !== 'all') {
          const orderState = (order.shippingAddress?.state || '').trim().toLowerCase();
          if (orderState !== selectedState.trim().toLowerCase()) return false;
        }

        // City filter
        if (selectedCity !== 'all') {
          const orderCity = (order.shippingAddress?.city || '').trim().toLowerCase();
          if (orderCity !== selectedCity.trim().toLowerCase()) return false;
        }

        // Payment status filter
        if (paymentFilter !== 'all') {
          const pStat = order.paymentStatus || (order.paymentMethod === 'COD' || order.paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid');
          if (pStat !== paymentFilter) return false;
        }

        // High value filter (> ₹3,000)
        if (highValueOnly) {
          const orderTotal = Number(order.grandTotal || order.totalAmount || order.subtotal || 0);
          if (orderTotal < 3000) return false;
        }

        // Multi-field text search
        if (!matchesSearch(order, searchTerm)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const totalA = Number(a.grandTotal ?? a.totalAmount ?? a.subtotal ?? 0);
        const totalB = Number(b.grandTotal ?? b.totalAmount ?? b.subtotal ?? 0);
        const itemsA = a.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
        const itemsB = b.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        const nameA = (a.customerName || a.shippingAddress?.name || '').toLowerCase();
        const nameB = (b.customerName || b.shippingAddress?.name || '').toLowerCase();

        switch (sortBy) {
          case 'highest_volume':
            return totalB - totalA;
          case 'lowest_volume':
            return totalA - totalB;
          case 'most_items':
            return itemsB - itemsA;
          case 'oldest':
            return dateA - dateB;
          case 'customer_az':
            return nameA.localeCompare(nameB);
          case 'newest':
          default:
            return dateB - dateA;
        }
      });
  }, [orders, selectedStatusTab, selectedState, selectedCity, paymentFilter, highValueOnly, searchTerm, sortBy]);

  // Overall Metrics & Highest Volume
  const stats = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => sum + Number(o.grandTotal || o.totalAmount || o.subtotal || 0), 0);
    const avgVal = orders.length ? Math.round(totalRev / orders.length) : 0;
    const highestOrder = orders.reduce((max, o) => {
      const val = Number(o.grandTotal || o.totalAmount || o.subtotal || 0);
      return val > max ? val : max;
    }, 0);
    const pendingCount = orders.filter(
      (o) => o.orderStatus === 'Pending' || o.orderStatus === 'Processing' || (o as any).status === 'Pending'
    ).length;
    const confirmedCount = orders.filter((o) => o.orderStatus === 'Confirmed' || (o as any).status === 'Confirmed').length;
    const shippedCount = orders.filter(
      (o) => o.orderStatus === 'Shipped' || o.orderStatus === 'Out for Delivery' || (o as any).status === 'Shipped'
    ).length;
    const deliveredCount = orders.filter((o) => o.orderStatus === 'Delivered' || (o as any).status === 'Delivered').length;

    return { totalRev, avgVal, highestOrder, pendingCount, confirmedCount, shippedCount, deliveredCount };
  }, [orders]);

  const handleOpenQuickModal = (order: Order) => {
    setSelectedOrderForModal(order);
    setNewStatus(order.orderStatus || 'Confirmed');
    setTrackingNumber(order.trackingNumber || '');
    setCourierPartner(order.courierPartner || 'BlueDart / Delhivery');
  };

  const handleSaveQuickStatus = async () => {
    if (!selectedOrderForModal) return;
    try {
      await updateStatus({
        orderId: selectedOrderForModal.id,
        status: newStatus,
        trackingNumber: trackingNumber || undefined,
        courierPartner: courierPartner || undefined,
      }).unwrap();
      toast.success(`Order #${selectedOrderForModal.orderNumber || selectedOrderForModal.id} updated to ${newStatus}!`);
      setSelectedOrderForModal(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update order status');
    }
  };

  // If viewing a full page detail view for an order
  if (activeOrderForPage) {
    return (
      <OrderDetailView
        order={activeOrderForPage}
        onBack={() => setActiveOrderForPage(null)}
      />
    );
  }

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      header: 'Order Details',
      sortable: true,
      render: (order) => (
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => setActiveOrderForPage(order)}
            className="font-bold text-neutral-900 hover:text-[#7B2435] text-left hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>#{order.orderNumber || order.id}</span>
            <ExternalLink className="w-3 h-3 text-[#7B2435] opacity-60" />
          </button>
          <span className="text-[11px] text-neutral-400 mt-0.5">{formatDate(order.createdAt)}</span>
          {order.invoiceNumber && (
            <span className="text-[10px] font-mono text-neutral-400">{order.invoiceNumber}</span>
          )}
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer & Location',
      render: (order) => {
        const name = order.customerName || order.shippingAddress?.fullName || order.shippingAddress?.name || 'Customer';
        const phone = order.customerPhone || order.shippingAddress?.phone || 'Not provided';
        const city = order.shippingAddress?.city;
        const state = order.shippingAddress?.state;
        return (
          <div className="flex flex-col max-w-[200px]">
            <span className="font-bold text-neutral-900 truncate">{name}</span>
            <span className="text-xs text-neutral-600 font-mono flex items-center gap-1 mt-0.5">
              <Phone className="w-2.5 h-2.5 text-neutral-400" />
              {phone}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-[#7B2435] font-semibold mt-0.5 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {city ? `${city}, ` : ''}{state || 'India'}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'items',
      header: 'Ordered Items',
      render: (order) => {
        const items = order.items || [];
        const totalItemsCount = items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);
        return (
          <div className="flex flex-col gap-1 max-w-[220px]">
            <span className="text-xs font-bold text-neutral-800">
              {totalItemsCount} item{totalItemsCount !== 1 ? 's' : ''} ({items.length} sku{items.length !== 1 ? 's' : ''})
            </span>
            <div className="flex flex-col gap-0.5">
              {items.slice(0, 2).map((item: any, idx: number) => (
                <span key={idx} className="text-[11px] text-neutral-600 truncate">
                  • {item.productName || item.name} ({item.size}) x{item.quantity || 1}
                </span>
              ))}
              {items.length > 2 && (
                <span className="text-[10px] text-neutral-400 font-medium">
                  +{items.length - 2} more item{items.length - 2 > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'totalAmount',
      header: 'Order Volume / Value',
      sortable: true,
      render: (order) => {
        const amount = Number(order.grandTotal || order.totalAmount || order.subtotal || 0);
        const isHighVal = amount >= 3000;
        return (
          <div className="flex flex-col">
            <span className="font-serif font-bold text-sm text-neutral-900">
              {formatCurrency(amount)}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] uppercase font-bold text-neutral-500 bg-[#FAF6F0] px-1.5 py-0.2 rounded border border-[#EADBDA]">
                {order.paymentMethod || 'COD'}
              </span>
              {isHighVal && (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                  High Volume
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'orderStatus',
      header: 'Fulfillment',
      sortable: true,
      render: (order) => <StatusBadge status={order.orderStatus || (order as any).status || 'Confirmed'} />,
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (order) => <StatusBadge status={order.paymentStatus || 'Pending'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (order) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="primary"
            size="xs"
            onClick={() => setActiveOrderForPage(order)}
            title="Open Full Order Detail Page"
          >
            Full Details
          </Button>

          <Button
            variant="light"
            size="xs"
            onClick={() => setSelectedOrderForInvoice(order)}
            title="View & Print Tax Invoice"
          >
            <Printer className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={() => handleOpenQuickModal(order)}
            title="Quick Status Update"
          >
            Status
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Orders & Logistics Fulfillment"
        subtitle="Manage customer orders, bifurcate by location/area, sort by volume, track dispatches, and print GST tax invoices."
      />

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Orders</span>
          <p className="font-serif text-2xl font-bold text-neutral-900 mt-1">{orders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Order Revenue</span>
          <p className="font-serif text-2xl font-bold text-[#7B2435] mt-1">{formatCurrency(stats.totalRev)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Avg Order Value</span>
          <p className="font-serif text-2xl font-bold text-neutral-900 mt-1">{formatCurrency(stats.avgVal)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Highest Volume Order</span>
          <p className="font-serif text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(stats.highestOrder)}</p>
        </div>
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-white p-4 rounded-2xl border border-neutral-100 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Dispatch Queue</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {stats.confirmedCount} Confirmed
            </span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {stats.shippedCount} Shipped
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Filter & Bifurcation Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-xs space-y-4">
        {/* Row 1: Search & Sort & Volume Toggle */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Main Multi-field Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, phone, order #, city, state, or pincode..."
              className="w-full pl-9 pr-8 py-2.5 bg-[#FAF6F0] border border-[#EADBDA] rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#7B2435]/20 focus:border-[#7B2435]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Volume / Value Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-semibold shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#7B2435]" />
              <span>Sort:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3 py-2 text-xs font-bold text-neutral-800 focus:outline-none cursor-pointer"
            >
              <option value="highest_volume">🏆 Highest Volume (Largest ₹)</option>
              <option value="lowest_volume">Lowest Volume (Smallest ₹)</option>
              <option value="most_items">📦 Most Items (Quantity)</option>
              <option value="newest">⏱️ Newest Orders First</option>
              <option value="oldest">⏳ Oldest Orders First</option>
              <option value="customer_az">👤 Customer Name (A-Z)</option>
            </select>
          </div>

          {/* High Volume Orders Quick Toggle */}
          <button
            type="button"
            onClick={() => setHighValueOnly(!highValueOnly)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              highValueOnly
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-[#FAF6F0] text-neutral-700 hover:bg-[#F5ECE8] border border-[#EADBDA]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Top Volume (₹3,000+)</span>
          </button>
        </div>

        {/* Row 2: Location & Area Bifurcation Filters + Payment Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 text-xs font-bold text-neutral-500 mr-1">
              <MapPin className="w-3.5 h-3.5 text-[#7B2435]" />
              <span>Area Bifurcation:</span>
            </div>

            {/* State Filter */}
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All States / Regions ({uniqueStates.length})</option>
              {uniqueStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {/* City Filter */}
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Cities ({uniqueCities.length})</option>
              {uniqueCities.map((ct) => (
                <option key={ct} value={ct}>
                  {ct}
                </option>
              ))}
            </select>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs text-neutral-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Payments</option>
              <option value="Paid">Paid (Online / Prepaid)</option>
              <option value="Pending">Pending (COD)</option>
            </select>

            {/* Reset Filter Button */}
            {(selectedState !== 'all' || selectedCity !== 'all' || paymentFilter !== 'all' || highValueOnly || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedState('all');
                  setSelectedCity('all');
                  setPaymentFilter('all');
                  setHighValueOnly(false);
                  setSearchTerm('');
                  setSortBy('newest');
                }}
                className="px-2.5 py-1.5 text-xs text-[#7B2435] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="text-xs text-neutral-500 font-medium">
            Showing <strong>{filteredOrders.length}</strong> of <strong>{orders.length}</strong> orders
          </div>
        </div>

        {/* Row 3: Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-neutral-100">
          {[
            { id: 'all', label: 'All Orders', count: orders.length },
            { id: 'Confirmed', label: 'Confirmed', count: stats.confirmedCount },
            { id: 'shipped', label: 'Shipped / In Transit', count: stats.shippedCount },
            { id: 'Delivered', label: 'Delivered', count: stats.deliveredCount },
            { id: 'pending', label: 'Pending Queue', count: stats.pendingCount },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatusTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                selectedStatusTab === tab.id
                  ? 'bg-[#7B2435] text-white shadow-xs'
                  : 'bg-[#FAF6F0] text-neutral-600 hover:bg-[#F5ECE8]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedStatusTab === tab.id ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Cross-Tab Matching Alert */}
      {filteredOrders.length === 0 && totalMatchesAcrossStatuses > 0 && selectedStatusTab !== 'all' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-800">💡 Tip:</span>
            <span>Found <strong>{totalMatchesAcrossStatuses}</strong> matching order{totalMatchesAcrossStatuses > 1 ? 's' : ''} in other status tabs.</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedStatusTab('all')}
            className="px-3 py-1.5 bg-[#7B2435] hover:bg-[#5C1B28] text-white font-bold rounded-xl cursor-pointer shrink-0 transition"
          >
            Switch to All Orders ({totalMatchesAcrossStatuses})
          </button>
        </div>
      )}

      {/* Orders Table */}
      <DataTable
        data={filteredOrders}
        columns={columns}
        keyExtractor={(o) => o.id || o.orderNumber}
        isLoading={isLoading}
        emptyTitle="No orders match your filter criteria"
        emptyDescription="Try clearing your search keyword, location filter, or status tabs to view other orders."
      />

      {/* Quick Status Update Modal */}
      <Modal
        isOpen={Boolean(selectedOrderForModal)}
        onClose={() => setSelectedOrderForModal(null)}
        title={`Manage Order #${selectedOrderForModal?.orderNumber || selectedOrderForModal?.id}`}
        subtitle={`Placed on ${selectedOrderForModal ? formatDate(selectedOrderForModal.createdAt) : ''}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => setSelectedOrderForModal(null)}>
              Cancel
            </Button>
            <Button
              variant="light"
              size="md"
              onClick={() => {
                const ord = selectedOrderForModal;
                setSelectedOrderForModal(null);
                if (ord) setActiveOrderForPage(ord);
              }}
            >
              Open Full Page Details
            </Button>
            <Button variant="primary" size="md" isLoading={isUpdating} onClick={handleSaveQuickStatus}>
              Update Fulfillment Status
            </Button>
          </>
        }
      >
        {selectedOrderForModal && (
          <div className="space-y-6">
            {/* Customer & Address Details */}
            <div className="p-4 rounded-xl bg-[#FAF6F0] border border-neutral-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                Shipping Address & Customer
              </h4>
              <p className="font-bold text-sm text-neutral-900">
                {selectedOrderForModal.customerName || selectedOrderForModal.shippingAddress?.fullName || selectedOrderForModal.shippingAddress?.name}
              </p>
              <p className="text-xs text-neutral-600 mt-0.5">
                {selectedOrderForModal.shippingAddress?.addressLine1}
                {selectedOrderForModal.shippingAddress?.addressLine2 ? `, ${selectedOrderForModal.shippingAddress.addressLine2}` : ''}
              </p>
              <p className="text-xs text-neutral-600">
                {selectedOrderForModal.shippingAddress?.city}, {selectedOrderForModal.shippingAddress?.state} - {selectedOrderForModal.shippingAddress?.pincode}
              </p>
              <p className="text-xs text-neutral-700 font-semibold mt-1">
                Phone: {selectedOrderForModal.customerPhone || selectedOrderForModal.shippingAddress?.phone}
              </p>
            </div>

            {/* Items List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                Ordered Kurtis ({selectedOrderForModal.items?.length || 0})
              </h4>
              <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100 overflow-hidden max-h-48 overflow-y-auto">
                {(selectedOrderForModal.items || []).map((item: any, i: number) => {
                  const img = item.productImage || item.image || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400';
                  const title = item.productName || item.name || 'Ethnic Kurti';
                  const price = item.price || 0;
                  const qty = item.quantity || 1;
                  return (
                    <div key={i} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={img}
                          alt={title}
                          className="w-10 h-12 object-cover rounded border border-neutral-200"
                        />
                        <div>
                          <p className="font-bold text-neutral-900">{title}</p>
                          <p className="text-neutral-500">
                            Size: {item.size || 'M'} • Shade: {item.color || 'Standard'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-neutral-900">
                          {formatCurrency(price * qty)}
                        </p>
                        <p className="text-neutral-400">
                          {formatCurrency(price)} x {qty}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Update Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Fulfillment Status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                options={[
                  'Pending',
                  'Confirmed',
                  'Processing',
                  'Packed',
                  'Shipped',
                  'Out for Delivery',
                  'Delivered',
                  'Cancelled',
                ]}
              />

              <Input
                label="Courier Partner"
                value={courierPartner}
                onChange={(e) => setCourierPartner(e.target.value)}
                placeholder="e.g. BlueDart / Delhivery / DTDC"
              />
            </div>

            <Input
              label="Tracking AWB / Number"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. BD98745231IN"
              helperText="Tracking code will be visible to customer in Order Tracker"
            />
          </div>
        )}
      </Modal>

      {/* Tax Invoice Modal */}
      <InvoiceModal
        isOpen={Boolean(selectedOrderForInvoice)}
        onClose={() => setSelectedOrderForInvoice(null)}
        order={selectedOrderForInvoice}
      />
    </div>
  );
};
