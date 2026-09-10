import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Truck,
  Clock,
  IndianRupee,
  PackageCheck,
  AlertCircle,
  FileText,
  Save,
  ArrowRight,
  ExternalLink,
  Tag,
} from 'lucide-react';
import {
  useGetReturnsQuery,
  useUpdateReturnStatusMutation,
} from '../../store/api/ecommerceApi';
import { Order } from '../../types';

export const ReturnManager: React.FC = () => {
  const { data: returnOrders = [], isLoading, refetch } = useGetReturnsQuery();
  const [updateReturn, { isLoading: isUpdating }] = useUpdateReturnStatusMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Modal form state
  const [newStatus, setNewStatus] = useState<string>('Return Approved');
  const [courierPartner, setCourierPartner] = useState<string>('Delhivery');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter returns
  const filteredOrders = useMemo(() => {
    return returnOrders.filter((order) => {
      const currentStatus = (order.returnDetails?.status || order.orderStatus) as string;
      const matchSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.shippingAddress?.fullName && order.shippingAddress.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.customerEmail && order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.returnDetails?.trackingNumber &&
          order.returnDetails.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'all' ? true : currentStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [returnOrders, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    let requested = 0;
    let approved = 0;
    let pickupScheduled = 0;
    let received = 0;
    let refunded = 0;

    returnOrders.forEach((o) => {
      const st = (o.returnDetails?.status || o.orderStatus) as string;
      if (st === 'Return Requested') requested++;
      else if (st === 'Return Approved') approved++;
      else if (st === 'Pickup Scheduled') pickupScheduled++;
      else if (st === 'Received') received++;
      else if (st === 'Refunded' || st === 'Refund Initiated') refunded++;
    });

    return {
      total: returnOrders.length,
      requested,
      approved,
      pickupScheduled,
      received,
      refunded,
    };
  }, [returnOrders]);

  const openProcessModal = (order: Order) => {
    setSelectedOrder(order);
    const current = (order.returnDetails?.status || order.orderStatus) as string;
    setNewStatus(current === 'Return Requested' ? 'Return Approved' : current);
    setCourierPartner(order.returnDetails?.courierPartner || 'Delhivery');
    setTrackingNumber(order.returnDetails?.trackingNumber || '');
    setRefundAmount(order.returnDetails?.refundAmount || order.totalAmount || 0);
    setAdminNotes(order.returnDetails?.adminNotes || '');
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      await updateReturn({
        orderId: selectedOrder.id,
        status: newStatus,
        courierPartner,
        trackingNumber,
        refundAmount: Number(refundAmount),
        notes: adminNotes,
      }).unwrap();

      showToast(`Updated Return status for #${selectedOrder.orderNumber} to "${newStatus}"`);
      setSelectedOrder(null);
      refetch();
    } catch (err: any) {
      alert(`Failed to update return: ${err?.message || 'Error'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
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
            <h1 className="text-xl font-bold text-neutral-900">Returns & Exchanges Desk</h1>
            <span className="bg-[#7B2435]/10 text-[#7B2435] text-xs font-bold px-2.5 py-0.5 rounded-full">
              {returnOrders.length} Cases
            </span>
          </div>
          <p className="text-sm text-neutral-500 mt-1">
            Manage customer return authorizations, reverse courier pickup logistics, inspection verification, and instant refunds.
          </p>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200">
          <p className="text-xs text-neutral-500 font-medium">Total Cases</p>
          <p className="text-lg font-bold text-neutral-900 mt-0.5">{stats.total}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/40">
          <p className="text-xs text-amber-700 font-medium">Pending Requests</p>
          <p className="text-lg font-bold text-amber-900 mt-0.5">{stats.requested}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/40">
          <p className="text-xs text-blue-700 font-medium">Pickup Scheduled</p>
          <p className="text-lg font-bold text-blue-900 mt-0.5">{stats.pickupScheduled}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-purple-200 bg-purple-50/40">
          <p className="text-xs text-purple-700 font-medium">Warehouse Received</p>
          <p className="text-lg font-bold text-purple-900 mt-0.5">{stats.received}</p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
          <p className="text-xs text-emerald-700 font-medium">Refund Completed</p>
          <p className="text-lg font-bold text-emerald-900 mt-0.5">{stats.refunded}</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            id="input-returns-search"
            type="text"
            placeholder="Search by order #, customer, tracking AWB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#7B2435]"
          />
        </div>

        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All Cases' },
            { id: 'Return Requested', label: 'Requested' },
            { id: 'Return Approved', label: 'Approved' },
            { id: 'Pickup Scheduled', label: 'Pickup' },
            { id: 'Received', label: 'Received' },
            { id: 'Refunded', label: 'Refunded' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Return Orders List */}
      {isLoading ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-neutral-200">
          <p className="text-neutral-500 text-sm animate-pulse">Loading return authorizations...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-neutral-200">
          <RotateCcw className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-800">No return cases found</h3>
          <p className="text-xs text-neutral-500 mt-1">All customer orders are currently active and delivered.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const ret = order.returnDetails;
            const currentStatus = ret?.status || order.orderStatus;

            return (
              <div
                key={order.id}
                id={`return-card-${order.orderNumber}`}
                className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs hover:border-neutral-300 transition-colors space-y-4"
              >
                {/* Top Row: Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] text-[#7B2435] flex items-center justify-center font-mono font-bold text-xs">
                      #{order.orderNumber.slice(-4)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-neutral-900">{order.orderNumber}</span>
                        <span className="text-xs text-neutral-400">•</span>
                        <span className="text-xs text-neutral-500">
                          Ordered {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600 mt-0.5">
                        Customer: <b className="text-neutral-900">{order.shippingAddress?.fullName || order.userEmail}</b> ({order.shippingAddress?.city}, {order.shippingAddress?.state})
                      </p>
                    </div>
                  </div>

                  {/* Status Badge & Action */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        currentStatus === 'Return Requested'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : currentStatus === 'Return Approved'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : currentStatus === 'Pickup Scheduled'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200'
                          : currentStatus === 'Received'
                          ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                          : currentStatus === 'Refunded' || currentStatus === 'Refund Initiated'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {currentStatus}
                    </span>

                    <button
                      onClick={() => openProcessModal(order)}
                      className="px-3.5 py-1.5 bg-[#7B2435] hover:bg-[#631B2A] text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                    >
                      Process Return
                    </button>
                  </div>
                </div>

                {/* Middle Row: Return Items & Reason */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#FAF6F0]/50 p-3.5 rounded-xl border border-[#EADBDA]/60">
                  {/* Items to return */}
                  <div>
                    <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                      Items Under Return:
                    </p>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 bg-white p-2 rounded-lg border border-neutral-200">
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-md object-cover border border-neutral-200"
                          />
                          <div className="truncate flex-1">
                            <p className="text-xs font-bold text-neutral-900 truncate">{item.productName}</p>
                            <p className="text-[10px] text-neutral-500">
                              Size: <b>{item.size}</b> • Qty: {item.quantity} • ₹{item.price}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Return details & Reason */}
                  <div className="space-y-2 text-xs">
                    <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                      Customer Reason & Feedback:
                    </p>
                    <div className="bg-white p-2.5 rounded-lg border border-neutral-200 space-y-1">
                      <p className="font-semibold text-neutral-800">
                        Reason: <span className="text-[#7B2435] font-bold">{ret?.reason || 'Size fitting issue'}</span>
                      </p>
                      {ret?.customerComments && (
                        <p className="text-neutral-600 italic">"{ret.customerComments}"</p>
                      )}
                      <div className="pt-1 flex items-center justify-between text-[11px] text-neutral-500">
                        <span>Resolution: <b>{ret?.resolutionType || 'Refund to Original Source'}</b></span>
                        <span className="font-bold text-neutral-900">Refund Amount: ₹{order.totalAmount}</span>
                      </div>
                    </div>

                    {ret?.trackingNumber && (
                      <div className="flex items-center gap-2 text-[11px] bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Reverse Logistics: <b>{ret.courierPartner || 'Delhivery'}</b> (AWB: {ret.trackingNumber})</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Return Process Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-[#FAF6F0] border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#7B2435]/10 text-[#7B2435] flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-sm">Update Return Case</h3>
                  <p className="text-xs text-neutral-500">Order #{selectedOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="p-6 space-y-4">
              {/* Return Status Dropdown */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Workflow Step / Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-xl focus:outline-none focus:border-[#7B2435] font-semibold"
                >
                  <option value="Return Approved">Return Approved (Generate Reverse AWB)</option>
                  <option value="Pickup Scheduled">Pickup Scheduled with Courier</option>
                  <option value="Received">Received at Jaipur Warehouse & Verified</option>
                  <option value="Refund Initiated">Refund Initiated to Payment Gateway</option>
                  <option value="Refunded">Refund Completed / Settled</option>
                  <option value="Return Rejected">Reject Return (Condition Violated)</option>
                </select>
              </div>

              {/* Courier Partner & AWB */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Reverse Courier
                  </label>
                  <select
                    value={courierPartner}
                    onChange={(e) => setCourierPartner(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-neutral-300 rounded-xl"
                  >
                    <option value="Delhivery">Delhivery Reverse</option>
                    <option value="BlueDart">Blue Dart Apex</option>
                    <option value="Shiprocket">Shiprocket Reverse</option>
                    <option value="Shadowfax">Shadowfax Local</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    Tracking AWB #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DL98234710IN"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs font-mono border border-neutral-300 rounded-xl focus:outline-none focus:border-[#7B2435]"
                  />
                </div>
              </div>

              {/* Refund Amount */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Settlement Refund Amount (₹)
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold font-mono border border-neutral-300 rounded-xl focus:outline-none focus:border-[#7B2435]"
                />
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Warehouse QC & Processing Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Tags verified intact. Processed UPI refund."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-xl focus:outline-none focus:border-[#7B2435]"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#7B2435] hover:bg-[#631B2A] rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {isUpdating ? 'Saving...' : 'Save Return Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
