import React, { useState, useEffect } from 'react';
import { 
  X, 
  Truck, 
  CheckCircle2, 
  FileText, 
  Ban,
  ShieldCheck
} from 'lucide-react';
import { Order, TrackingInfo } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';

interface OrderTrackingModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated?: (updatedOrder: Order) => void;
  onOpenInvoice?: (order: Order) => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpdated,
  onOpenInvoice,
}) => {
  const toast = useToast();
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [returnType, setReturnType] = useState<'return' | 'exchange'>('return');
  const [returnReason, setReturnReason] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnSuccessMsg, setReturnSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && order) {
      setLoadingTracking(true);
      api.trackOrder(order.id)
        .then((res: any) => {
          if (res?.order) {
            setTracking({
              orderId: res.order.id,
              orderNumber: res.order.orderNumber || res.order.id,
              trackingNumber: res.order.trackingNumber || 'Pending',
              courierPartner: res.order.courierPartner || 'Delhivery Express',
              currentStatus: res.order.orderStatus || 'Confirmed',
              estimatedDeliveryDate: res.order.estimatedDeliveryDate || '3-5 Business Days',
              origin: 'Jaipur, Rajasthan',
              destination: `${res.order.shippingAddress?.city || 'Customer'}, ${res.order.shippingAddress?.pincode || ''}`,
              checkpoints: [],
            });
          }
        })
        .catch((err) => console.warn('Could not fetch tracking:', err))
        .finally(() => setLoadingTracking(false));
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const currentStatus = order.orderStatus || (order as any).status || 'Confirmed';
  const isDelivered = currentStatus === 'Delivered';
  const isCancelled = currentStatus === 'Cancelled';
  const canCancel = ['Pending', 'Confirmed', 'Processing'].includes(currentStatus);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.warning('Please enter a cancellation reason.');
      return;
    }
    setIsCancelling(true);
    try {
      const updated: any = await api.cancelOrder(order.id, cancelReason);
      setIsCancelling(false);
      setShowCancelDialog(false);
      if (onOrderUpdated && updated) {
        if (updated.id) {
          onOrderUpdated(updated);
        } else {
          onOrderUpdated({ ...order, orderStatus: 'Cancelled' });
        }
      }
      toast.success('Order cancelled successfully.');
    } catch (err: any) {
      setIsCancelling(false);
      toast.error(err.message || 'Error cancelling order.');
    }
  };

  const handleRequestReturn = async () => {
    if (!returnReason.trim()) {
      toast.warning('Please enter a reason for return/exchange.');
      return;
    }
    setIsSubmittingReturn(true);
    try {
      const res: any = await api.requestOrderReturn(order.id, {
        reason: returnReason,
        description: returnReason,
        type: returnType,
      });
      setIsSubmittingReturn(false);
      setShowReturnDialog(false);
      const msg = res?.message || 'Return/Exchange requested successfully. Our team will verify and dispatch courier pickup.';
      setReturnSuccessMsg(msg);
      toast.success(msg);
    } catch (err: any) {
      setIsSubmittingReturn(false);
      toast.error(err.message || 'Failed to submit return request.');
    }
  };

  const milestones = [
    { key: 'Confirmed', label: 'Order Confirmed', desc: 'Order received and payment verified' },
    { key: 'Processing', label: 'Packed & Quality Checked', desc: 'Garment steamed and packed in dust bag' },
    { key: 'Shipped', label: 'Dispatched via Courier', desc: `${order.courierPartner || 'Delhivery Express'} - AWB: ${order.trackingNumber || 'Pending'}` },
    { key: 'Out for Delivery', label: 'Out for Delivery', desc: 'Courier agent is on the way' },
    { key: 'Delivered', label: 'Delivered to Doorstep', desc: 'Handed over to customer' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'Pending':
      case 'Confirmed': return 0;
      case 'Processing': return 1;
      case 'Shipped': return 2;
      case 'Out for Delivery': return 3;
      case 'Delivered': return 4;
      default: return 0;
    }
  };

  const activeStepIdx = isCancelled ? -1 : getStepIndex(currentStatus);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#F0E6E1] flex flex-col max-h-[90vh] animate-fade-in">
        {/* Modal Header */}
        <div className="bg-[#FAF6F0] p-5 sm:p-6 border-b border-[#EADBDA] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF2F4] text-[#7B2435] border border-[#F5D8DE] flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-neutral-900">
                Order Tracking & Details
              </h3>
              <p className="text-xs text-neutral-500 font-mono">
                Order #{order.orderNumber || order.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-200/60 text-neutral-500 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {returnSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Request Received</p>
                <p>{returnSuccessMsg}</p>
              </div>
            </div>
          )}

          {/* Status Bar */}
          <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EADBDA] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-neutral-500 block">Current Status</span>
              <span className="text-sm font-bold text-[#7B2435]">{currentStatus}</span>
            </div>
            {order.courierPartner && (
              <div className="text-right">
                <span className="text-[11px] text-neutral-500 block">Courier AWB</span>
                <span className="text-xs font-mono font-bold text-neutral-800">
                  {order.courierPartner}: {order.trackingNumber || 'In Dispatch'}
                </span>
              </div>
            )}
          </div>

          {/* Stepper Timeline */}
          {!isCancelled ? (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
              {milestones.map((ms, idx) => {
                const isPassed = idx <= activeStepIdx;
                const isCurrent = idx === activeStepIdx;
                return (
                  <div key={ms.key} className="relative flex items-start gap-3.5">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition ${
                        isPassed
                          ? 'bg-[#7B2435] border-[#7B2435] text-white shadow-xs'
                          : 'bg-white border-neutral-300 text-neutral-400'
                      }`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${isCurrent ? 'text-[#7B2435]' : isPassed ? 'text-neutral-900' : 'text-neutral-400'}`}>
                        {ms.label}
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        {ms.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-3">
              <Ban className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <p className="font-bold">This Order Has Been Cancelled</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Refund has been scheduled to the original payment method if already paid.
                </p>
              </div>
            </div>
          )}

          {/* Shipping Address & Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-white border border-[#F0E6E1] rounded-2xl space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Shipping Destination
              </span>
              <p className="font-bold text-neutral-900">{order.shippingAddress?.fullName || order.customerName}</p>
              <p className="text-neutral-600 leading-relaxed">
                {order.shippingAddress?.addressLine1} {order.shippingAddress?.addressLine2}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
              </p>
              <p className="text-neutral-500">Phone: {order.shippingAddress?.phone || order.customerPhone}</p>
            </div>

            <div className="p-4 bg-white border border-[#F0E6E1] rounded-2xl space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Payment Summary
                </span>
                <p className="font-bold text-neutral-900">
                  {order.paymentMethod} ({order.paymentStatus})
                </p>
                <p className="text-neutral-600 mt-1">
                  Grand Total: <strong className="text-[#7B2435]">₹{(order.grandTotal || order.totalAmount || 0).toLocaleString('en-IN')}</strong>
                </p>
              </div>

              {onOpenInvoice && (
                <button
                  onClick={() => onOpenInvoice(order)}
                  className="mt-2 py-1.5 px-3 bg-[#FAF6F0] hover:bg-[#F5ECE8] text-[#7B2435] border border-[#EADBDA] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download Tax Invoice</span>
                </button>
              )}
            </div>
          </div>

          {/* Cancel Order Section */}
          {canCancel && !showCancelDialog && (
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-neutral-800">Need to cancel this order?</h5>
                <p className="text-[11px] text-neutral-500">You can cancel before the item is dispatched for delivery.</p>
              </div>
              <button
                onClick={() => setShowCancelDialog(true)}
                className="px-4 py-2 bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-full transition cursor-pointer"
              >
                Cancel Order
              </button>
            </div>
          )}

          {showCancelDialog && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
              <h5 className="text-xs font-bold text-rose-900">Confirm Order Cancellation</h5>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (e.g., changed delivery address, ordered wrong size)..."
                rows={2}
                className="w-full bg-white border border-rose-300 rounded-xl p-2 text-xs text-neutral-900 focus:outline-none focus:border-rose-500"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 text-xs rounded-xl cursor-pointer"
                >
                  Keep Order
                </button>
              </div>
            </div>
          )}

          {/* 7-Day Return / Exchange Section */}
          {isDelivered && !showReturnDialog && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  7-Day Return & Size Exchange Window Active
                </h5>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Not the right fit? Request a free pickup exchange or hassle-free refund.
                </p>
              </div>
              <button
                onClick={() => setShowReturnDialog(true)}
                className="px-4 py-2 bg-[#7B2435] text-white hover:bg-[#621c2a] text-xs font-bold rounded-full transition cursor-pointer shrink-0"
              >
                Return / Exchange
              </button>
            </div>
          )}

          {showReturnDialog && (
            <div className="p-4 bg-white border border-[#EADBDA] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-neutral-900">Request Return or Size Exchange</h5>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setReturnType('return')}
                    className={`px-3 py-1 rounded-full font-bold cursor-pointer ${
                      returnType === 'return' ? 'bg-[#7B2435] text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    Return & Refund
                  </button>
                  <button
                    onClick={() => setReturnType('exchange')}
                    className={`px-3 py-1 rounded-full font-bold cursor-pointer ${
                      returnType === 'exchange' ? 'bg-[#7B2435] text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    Size Exchange
                  </button>
                </div>
              </div>

              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder={returnType === 'exchange' ? 'Specify needed size and feedback...' : 'Reason for return...'}
                rows={2}
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7B2435]"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRequestReturn}
                  disabled={isSubmittingReturn}
                  className="px-4 py-2 bg-[#7B2435] hover:bg-[#621c2a] text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  {isSubmittingReturn ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  onClick={() => setShowReturnDialog(false)}
                  className="px-4 py-2 bg-neutral-100 text-neutral-700 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
