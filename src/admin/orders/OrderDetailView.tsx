import React, { useState } from 'react';
import {
  ArrowLeft,
  Printer,
  FileText,
  Truck,
  Package,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  MessageCircle,
  ShieldCheck,
  Building,
  RefreshCw,
  Send,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import { useUpdateOrderStatusMutation } from '../../store/api/ecommerceApi';
import { InvoiceModal } from '../../components/invoice/InvoiceModal';

interface OrderDetailViewProps {
  order: Order;
  onBack: () => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({ order, onBack }) => {
  const toast = useToast();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.orderStatus || 'Confirmed');
  const [courierPartner, setCourierPartner] = useState(order.courierPartner || 'BlueDart / Delhivery');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [statusComment, setStatusComment] = useState('');
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const customerName = order.customerName || order.shippingAddress?.fullName || order.shippingAddress?.name || 'Customer';
  const customerEmail = order.customerEmail || (order.shippingAddress as any)?.email || 'Not provided';
  const customerPhone = order.customerPhone || order.shippingAddress?.phone || 'Not provided';

  const handleUpdateStatus = async () => {
    try {
      await updateStatus({
        orderId: order.id,
        status: currentStatus,
        trackingNumber: trackingNumber || undefined,
        courierPartner: courierPartner || undefined,
      }).unwrap();

      toast.success(`Order #${order.orderNumber || order.id} updated to ${currentStatus}!`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update order status');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  // WhatsApp link format for Indian numbers
  const cleanPhone = customerPhone.replace(/\D/g, '');
  const whatsappUrl = cleanPhone
    ? `https://wa.me/91${cleanPhone.slice(-10)}?text=Hello%20${encodeURIComponent(
        customerName
      )},%20greetings%20from%20Nandita%20Fashion.%20Regarding%20your%20Order%20%23${order.orderNumber || order.id}...`
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-neutral-100 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-neutral-200 hover:bg-[#FAF6F0] text-neutral-700 transition cursor-pointer"
            title="Back to Orders List"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900">
                Order #{order.orderNumber || order.id}
              </h1>
              <StatusBadge status={currentStatus} />
              <StatusBadge status={order.paymentStatus || 'Pending'} />
            </div>
            <p className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>Placed on {formatDate(order.createdAt)}</span>
              <span>•</span>
              <span>Invoice: {order.invoiceNumber || `INV-${order.orderNumber}`}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsInvoiceOpen(true)}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print GST Invoice
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
          >
            Back to Orders
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Details & Right Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Products & Financials & Customer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Profile & Address Card */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#7B2435]/10 text-[#7B2435] flex items-center justify-center font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">Customer & Delivery Information</h3>
                  <p className="text-xs text-neutral-400">Recipient contact & dispatch destination</p>
                </div>
              </div>

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Customer</span>
                </a>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Contact Info */}
              <div className="space-y-3 bg-[#FAF6F0]/60 p-4 rounded-xl border border-[#EADBDA]/60">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Customer Contact Details
                </span>
                <div>
                  <span className="text-neutral-500 font-medium">Full Name:</span>
                  <p className="font-bold text-sm text-neutral-900">{customerName}</p>
                </div>
                <div>
                  <span className="text-neutral-500 font-medium">Phone Number:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="font-bold text-neutral-900">{customerPhone}</p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(customerPhone, 'Phone number')}
                      className="p-1 hover:bg-neutral-200 rounded text-neutral-500"
                      title="Copy Phone"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <a
                      href={`tel:${customerPhone}`}
                      className="text-[#7B2435] hover:underline font-semibold text-[11px]"
                    >
                      Call
                    </a>
                  </div>
                </div>
                <div>
                  <span className="text-neutral-500 font-medium">Email Address:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="font-semibold text-neutral-800 break-all">{customerEmail}</p>
                    {customerEmail !== 'Not provided' && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(customerEmail, 'Email')}
                        className="p-1 hover:bg-neutral-200 rounded text-neutral-500"
                        title="Copy Email"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-neutral-500 font-medium">Customer Type:</span>
                  <p className="font-semibold text-neutral-700">
                    {order.userId && order.userId !== 'guest' && order.userId !== 'guest-user'
                      ? 'Registered Studio Member'
                      : 'Storefront Guest Checkout'}
                  </p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-3 bg-[#FAF6F0]/60 p-4 rounded-xl border border-[#EADBDA]/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Shipping & Delivery Address
                  </span>
                  <span className="text-[10px] bg-white border border-[#EADBDA] px-2 py-0.5 rounded-full font-bold text-[#7B2435]">
                    {order.shippingAddress?.type || 'Home'}
                  </span>
                </div>

                <div className="text-neutral-800 space-y-1">
                  <p className="font-bold text-sm text-neutral-900">
                    {order.shippingAddress?.fullName || order.shippingAddress?.name || customerName}
                  </p>
                  <p className="text-neutral-700 leading-relaxed">
                    {order.shippingAddress?.addressLine1}
                    {order.shippingAddress?.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
                  </p>
                  {order.shippingAddress?.landmark && (
                    <p className="text-neutral-500 italic">
                      Landmark: {order.shippingAddress.landmark}
                    </p>
                  )}
                  <div className="pt-1 font-semibold text-neutral-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#7B2435] shrink-0" />
                    <span>
                      {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                    </span>
                  </div>
                  <p className="text-neutral-500 text-[11px]">
                    Country: {order.shippingAddress?.country || 'India'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ordered Kurtis & Items Table */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#7B2435]/10 text-[#7B2435] flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900">
                    Ordered Ethnic Kurtis & Sets ({order.items?.length || 0})
                  </h3>
                  <p className="text-xs text-neutral-400">Inventory items packed for this parcel</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-neutral-100">
              {(order.items || []).map((item: any, idx: number) => {
                const itemImg =
                  item.productImage ||
                  item.image ||
                  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400';
                const itemName = item.productName || item.name || 'Ethnic Kurti';
                const itemPrice = item.price || 0;
                const itemQty = item.quantity || 1;
                const itemSubtotal = item.subtotal || itemPrice * itemQty;

                return (
                  <div key={item.id || idx} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={itemImg}
                        alt={itemName}
                        className="w-16 h-20 object-cover rounded-xl border border-neutral-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-neutral-900 truncate">{itemName}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 flex-wrap">
                          <span className="bg-[#FAF6F0] px-2 py-0.5 rounded border border-[#EADBDA] font-semibold text-[#7B2435]">
                            Size: {item.size || 'M'}
                          </span>
                          {item.color && (
                            <span className="bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">
                              Shade: {item.color}
                            </span>
                          )}
                          {item.sku && (
                            <span className="text-[11px] font-mono text-neutral-400">
                              SKU: {item.sku}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">
                          Unit Price: {formatCurrency(itemPrice)} × {itemQty} unit{itemQty > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-serif font-bold text-base text-neutral-900">
                        {formatCurrency(itemSubtotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Breakdown Summary */}
            <div className="mt-6 pt-4 border-t border-neutral-100 bg-[#FAF6F0]/40 p-4 rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-neutral-900">
                  {formatCurrency(order.subtotal || order.totalAmount || 0)}
                </span>
              </div>
              {Boolean(order.discountAmount && order.discountAmount > 0) && (
                <div className="flex justify-between text-emerald-700">
                  <span className="flex items-center gap-1.5">
                    <span>Coupon Discount</span>
                    {order.couponCode && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 border border-emerald-200 rounded font-mono font-bold text-[10px]">
                        {order.couponCode}
                      </span>
                    )}
                  </span>
                  <span className="font-bold">-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Shipping & Boutique Courier</span>
                <span className="font-semibold text-neutral-900">
                  {order.shippingFee && order.shippingFee > 0 ? formatCurrency(order.shippingFee) : 'FREE'}
                </span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Estimated GST / Tax (Included)</span>
                <span className="font-semibold text-neutral-900">
                  {formatCurrency(order.taxAmount || Math.round(((order.subtotal || 0) - (order.discountAmount || 0)) * 0.05))}
                </span>
              </div>
              <div className="pt-2.5 border-t border-neutral-200 flex justify-between items-center text-sm font-bold text-neutral-900">
                <span>Grand Total Amount</span>
                <span className="font-serif text-lg text-[#7B2435]">
                  {formatCurrency(order.grandTotal || order.totalAmount || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Fulfillment & Logistics Controls */}
        <div className="space-y-6">
          {/* Fulfillment Status Management Box */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs p-6 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-900">Fulfillment & Logistics</h3>
                <p className="text-xs text-neutral-400">Update dispatch & AWB code</p>
              </div>
            </div>

            <div className="space-y-4">
              <Select
                label="Order Fulfillment Status"
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value as OrderStatus)}
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

              <Input
                label="Tracking AWB / Consignment Code"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. BD89172635IN"
                helperText="Customer can track live parcel with this AWB number."
              />

              <Button
                variant="primary"
                size="md"
                className="w-full justify-center"
                isLoading={isUpdating}
                onClick={handleUpdateStatus}
              >
                Save Fulfillment Update
              </Button>
            </div>
          </div>

          {/* Payment & Gateway Breakdown */}
          <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-neutral-900">Payment Details</h3>
                <p className="text-xs text-neutral-400">Transaction & gateway records</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-500 font-medium">Payment Mode</span>
                <span className="font-bold text-neutral-900 uppercase bg-[#FAF6F0] px-2 py-0.5 rounded border border-[#EADBDA]">
                  {order.paymentMethod || 'COD'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-500 font-medium">Payment Status</span>
                <StatusBadge status={order.paymentStatus || 'Pending'} />
              </div>
              {order.razorpayPaymentId && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-500 font-medium">Razorpay ID</span>
                  <span className="font-mono text-[11px] text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
                    {order.razorpayPaymentId}
                  </span>
                </div>
              )}
              {order.razorpayOrderId && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-neutral-500 font-medium">Gateway Order ID</span>
                  <span className="font-mono text-[11px] text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
                    {order.razorpayOrderId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Invoice Action Card */}
          <div className="bg-gradient-to-br from-[#7B2435] to-[#5C1A27] text-white rounded-2xl p-6 shadow-md space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-300" />
              <h4 className="font-serif font-bold text-base">GST Bill of Supply</h4>
            </div>
            <p className="text-xs text-rose-100/90 leading-relaxed">
              Generate, print, or download the official HSN/SAC compliant GST Tax Invoice for this order.
            </p>
            <button
              type="button"
              onClick={() => setIsInvoiceOpen(true)}
              className="w-full py-2.5 px-4 bg-white hover:bg-neutral-100 text-[#7B2435] rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Open Invoice & Print PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Modal Component */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={order}
      />
    </div>
  );
};
