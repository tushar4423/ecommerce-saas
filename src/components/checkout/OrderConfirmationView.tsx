import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Download, 
  Share2, 
  Sparkles,
  FileText,
  Printer
} from 'lucide-react';
import { Order } from '../../types';
import { InvoiceModal } from '../invoice/InvoiceModal';

interface OrderConfirmationViewProps {
  order: Order;
  onNavigate: (route: string) => void;
}

export const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({
  order,
  onNavigate,
}) => {
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const steps = [
    { label: 'Order Confirmed', date: 'Just now', done: true },
    { label: 'Artisan Quality Check & Packing', date: 'Expected Tomorrow', done: true },
    { label: 'Dispatched via Express Courier', date: 'Expected 24-48 hrs', done: false },
    { label: 'Out for Delivery', date: 'Expected in 3-4 days', done: false },
  ];

  return (
    <div className="bg-[#FAF6F0] min-h-screen py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#F0E6E1] shadow-md space-y-8">
          {/* Header Banner */}
          <div className="text-center space-y-2 pb-6 border-b border-[#F5ECE8]">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-[#7B2435]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Thank You for Shopping Artisanal
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-neutral-900">
              Your Order Has Been Confirmed!
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
              We have generated your GST tax invoice for <strong>{order.customerEmail}</strong>.
            </p>
          </div>

          {/* Quick Order Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#FAF6F0] rounded-2xl border border-[#EADBDA] text-xs text-neutral-700">
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">Order Number</span>
              <strong className="text-neutral-900">{order.orderNumber}</strong>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">Invoice No.</span>
              <strong className="font-mono text-[#7B2435]">{order.invoiceNumber || `INV-NF-${order.orderNumber}`}</strong>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">Tracking No.</span>
              <strong className="text-[#7B2435]">{order.trackingNumber || 'DEL-8921839'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase block">Total Amount</span>
              <strong className="text-[#7B2435] font-serif text-sm">₹{order.grandTotal?.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {/* Tax Slab Notice Banner */}
          <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#7B2435]" />
              <span className="text-neutral-700">
                Official GST Tax Invoice (5% / 18% Slabs) Generated
              </span>
            </div>
            <button
              onClick={() => setIsInvoiceOpen(true)}
              className="text-[#7B2435] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View / Print Invoice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tracking Timeline */}
          <div className="space-y-4">
            <h3 className="font-serif text-base font-bold text-neutral-900">
              Live Shipment Progress
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200">
              {steps.map((st, i) => (
                <div key={i} className="relative flex items-start gap-3">
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                      st.done
                        ? 'bg-[#7B2435] border-[#7B2435] text-white'
                        : 'bg-white border-neutral-300 text-neutral-400'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold ${st.done ? 'text-neutral-900' : 'text-neutral-500'}`}>
                      {st.label}
                    </h5>
                    <p className="text-[11px] text-neutral-400">{st.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Itemized list */}
          <div className="space-y-4 pt-4 border-t border-[#F5ECE8]">
            <h3 className="font-serif text-base font-bold text-neutral-900">
              Purchased Items ({order.items.length})
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.variantId || item.productId}
                  className="flex items-center justify-between p-3 bg-[#FAF6F0] rounded-xl border border-[#EADBDA]"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.productImage || item.image}
                      alt={item.productName || item.name}
                      className="w-14 h-16 object-cover rounded-lg border border-neutral-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">{item.productName || item.name}</h4>
                      <p className="text-[11px] text-neutral-500">
                        Size: {item.size} {item.color && `• Color: ${item.color}`} • Qty: {item.quantity}
                      </p>
                      <span className="text-xs font-bold text-[#7B2435]">
                        ₹{(item.subtotal || item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="p-4 bg-[#FAF6F0] rounded-2xl border border-[#EADBDA] text-xs text-neutral-700">
            <h4 className="font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#7B2435]" /> Shipping to:
            </h4>
            <p>
              <strong>{order.shippingAddress.fullName || order.shippingAddress.name}</strong> ({order.shippingAddress.phone})
            </p>
            <p>
              {order.shippingAddress.addressLine1} {order.shippingAddress.addressLine2}, {order.shippingAddress.city},{' '}
              {order.shippingAddress.state} - {order.shippingAddress.pincode}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[#F5ECE8]">
            <button
              onClick={() => setIsInvoiceOpen(true)}
              className="w-full sm:flex-1 py-3.5 bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md hover:bg-neutral-800 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>View & Download Invoice</span>
            </button>
            <button
              onClick={() => onNavigate('/')}
              className="w-full sm:flex-1 py-3.5 bg-[#7B2435] text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md hover:bg-[#621c2a] transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue Shopping</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tax Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        order={order}
      />
    </div>
  );
};
