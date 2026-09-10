import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  MapPin, 
  Plus, 
  CreditCard, 
  Banknote, 
  ShieldCheck, 
  Truck, 
  Lock, 
  ArrowLeft, 
  Loader2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import { Order, UserAddress } from '../../types';
import { AddressFormModal } from './AddressFormModal';
import { RazorpayModal } from './RazorpayModal';

interface CheckoutViewProps {
  onNavigate: (route: string) => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ onNavigate, onOrderSuccess }) => {
  const { user, loginWithGoogle, addAddress } = useAuth();
  const { 
    cart, 
    subtotal, 
    totalMrp, 
    totalSavings, 
    shippingFee, 
    grandTotal, 
    appliedCoupon, 
    couponDiscount, 
    clearCart 
  } = useCart();

  // Selected address state
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    user?.addresses.find((a) => a.isDefault)?.id || user?.addresses[0]?.id || ''
  );
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'COD'>('Razorpay');
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'standard' | 'express'>('standard');

  // Address lookup
  const selectedAddress = user?.addresses.find((a) => a.id === selectedAddressId) || user?.addresses[0];

  const handlePlaceOrder = async (razorpayPaymentId?: string, razorpayOrderId?: string) => {
    if (!user) {
      await loginWithGoogle('/checkout');
      return;
    }
    if (!selectedAddress) {
      alert('Please add or select a delivery address first.');
      setIsAddressModalOpen(true);
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const orderItems = cart.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.images[0]?.url || '',
        variantId: item.variantId,
        sku: item.product.variants.find((v) => v.id === item.variantId)?.sku || item.product.sku,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        price: item.price,
        mrp: item.mrp,
        subtotal: item.price * item.quantity,
      }));

      // Verify calculation with backend summary API
      const summary = await api.getCheckoutSummary({
        items: orderItems,
        couponCode: appliedCoupon?.code,
        shippingAddress: selectedAddress,
        deliveryType,
        paymentMethod,
      });

      const effectiveShippingFee = summary?.shippingFee !== undefined ? summary.shippingFee : shippingFee;
      const effectiveGrandTotal = summary?.grandTotal !== undefined ? summary.grandTotal : grandTotal;
      const effectiveDiscount = summary?.discountAmount !== undefined ? summary.discountAmount : ((totalMrp - subtotal) + couponDiscount);

      const newOrder = await api.createOrder({
        userId: user.id,
        customerName: selectedAddress.fullName || user.name,
        customerEmail: user.email,
        customerPhone: selectedAddress.phone || user.phone || '',
        items: orderItems,
        shippingAddress: selectedAddress,
        paymentMethod,
        paymentStatus: paymentMethod === 'Razorpay' ? 'Paid' : 'Pending',
        razorpayPaymentId,
        razorpayOrderId,
        subtotal,
        discountAmount: effectiveDiscount,
        couponCode: appliedCoupon?.code,
        shippingFee: effectiveShippingFee,
        taxAmount: 0,
        grandTotal: effectiveGrandTotal,
        orderStatus: 'Confirmed',
      });

      // Fire festive celebration confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#7B2435', '#C98C97', '#E3A857', '#FAF6F0'],
      });

      clearCart();
      setIsSubmittingOrder(false);
      onOrderSuccess(newOrder);
    } catch (err) {
      console.error(err);
      setIsSubmittingOrder(false);
      alert('Error creating order. Please try again.');
    }
  };

  const handleProceedToPayment = () => {
    if (!user) {
      loginWithGoogle('/checkout');
      return;
    }
    if (!selectedAddress) {
      alert('Please add a delivery address to continue.');
      setIsAddressModalOpen(true);
      return;
    }

    if (paymentMethod === 'Razorpay') {
      setIsRazorpayModalOpen(true);
    } else {
      handlePlaceOrder();
    }
  };

  if (cart.length === 0) {
    return (
      <div className="bg-[#FAF6F0] min-h-screen py-16 text-center">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-[#F0E6E1] shadow-sm">
          <h2 className="font-serif text-2xl font-bold text-neutral-900 mb-2">
            Your Bag is Currently Empty
          </h2>
          <p className="text-xs text-neutral-500 mb-6">
            Please add items to your shopping bag before proceeding to checkout.
          </p>
          <button
            onClick={() => onNavigate('/kurtis')}
            className="px-8 py-3 bg-[#7B2435] text-white rounded-full text-xs font-bold shadow-md"
          >
            Explore Kurtis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF6F0] min-h-screen py-10 w-full">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Checkout Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#EADBDA] mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/cart')}
              className="p-2 bg-white rounded-full border border-neutral-200 hover:border-neutral-400 text-neutral-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900">
                Secure Express Checkout
              </h1>
              <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>256-bit Encrypted Transaction</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Multi-Step Stages (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Account / Authentication */}
            <div className="bg-white p-6 rounded-3xl border border-[#F0E6E1] shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#F5ECE8] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#7B2435] text-white font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <h3 className="font-serif text-base font-bold text-neutral-900">
                    Customer Account
                  </h3>
                </div>
                {user ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
                  </span>
                ) : null}
              </div>

              {user ? (
                <div className="flex items-center justify-between bg-[#FAF6F0] p-4 rounded-2xl border border-[#EADBDA]">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-neutral-300"
                    />
                    <div>
                      <h5 className="text-xs font-bold text-neutral-900">{user.name}</h5>
                      <p className="text-[11px] text-neutral-500">{user.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#FFF2F4] text-[#7B2435] rounded">
                    Google OAuth Verified
                  </span>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-neutral-600">
                    Sign in with Google to use saved addresses and track your delivery seamlessly:
                  </p>
                  <button
                    onClick={() => loginWithGoogle('/checkout')}
                    className="px-6 py-2.5 bg-white border border-[#7B2435] text-[#7B2435] font-bold text-xs rounded-full hover:bg-[#7B2435] hover:text-white transition shadow-sm"
                  >
                    Continue with Google
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Delivery Address Selection */}
            <div className="bg-white p-6 rounded-3xl border border-[#F0E6E1] shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#F5ECE8] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#7B2435] text-white font-bold text-xs flex items-center justify-center">
                    2
                  </div>
                  <h3 className="font-serif text-base font-bold text-neutral-900">
                    Delivery Address
                  </h3>
                </div>

                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="flex items-center gap-1 text-xs font-bold text-[#7B2435] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Address
                </button>
              </div>

              {user?.addresses && user.addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {user.addresses.map((addr) => {
                    const isSelected = (selectedAddressId || user.addresses[0].id) === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition relative ${
                          isSelected
                            ? 'border-[#7B2435] bg-[#FFF9F9] shadow-xs'
                            : 'border-neutral-200 hover:border-neutral-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-neutral-900">{addr.fullName}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                            {addr.type}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-600 leading-relaxed mb-2">
                          {addr.addressLine1} {addr.addressLine2}, {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                        </p>
                        <p className="text-[11px] text-neutral-500">Phone: {addr.phone}</p>

                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 text-[#7B2435]">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-xs text-neutral-500 mb-3">No delivery address saved yet.</p>
                  <button
                    onClick={() => setIsAddressModalOpen(true)}
                    className="px-5 py-2.5 bg-[#7B2435] text-white rounded-full text-xs font-bold"
                  >
                    Add Delivery Address
                  </button>
                </div>
              )}
            </div>

            {/* Step 3: Payment Method Selection */}
            <div className="bg-white p-6 rounded-3xl border border-[#F0E6E1] shadow-xs">
              <div className="flex items-center gap-2.5 pb-4 border-b border-[#F5ECE8] mb-4">
                <div className="w-7 h-7 rounded-full bg-[#7B2435] text-white font-bold text-xs flex items-center justify-center">
                  3
                </div>
                <h3 className="font-serif text-base font-bold text-neutral-900">
                  Payment Method
                </h3>
              </div>

              <div className="space-y-3">
                {/* Razorpay Option */}
                <label
                  onClick={() => setPaymentMethod('Razorpay')}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === 'Razorpay'
                      ? 'border-[#7B2435] bg-[#FFF9F9]'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_choice"
                    checked={paymentMethod === 'Razorpay'}
                    onChange={() => setPaymentMethod('Razorpay')}
                    className="accent-[#7B2435] mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">
                        Online Payment via Razorpay (UPI, Cards, NetBanking)
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Fastest & Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Pay instantly with Google Pay, PhonePe, Paytm, RuPay, Visa, or NetBanking.
                    </p>
                  </div>
                </label>

                {/* COD Option */}
                <label
                  onClick={() => setPaymentMethod('COD')}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === 'COD'
                      ? 'border-[#7B2435] bg-[#FFF9F9]'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_choice"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="accent-[#7B2435] mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">
                        Cash on Delivery (COD)
                      </span>
                      <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                        Pay Cash at Doorstep
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Pay cash or scan courier UPI QR when your order arrives at your address.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary Sidebar (4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-3xl border border-[#F0E6E1] shadow-sm sticky top-28 space-y-5">
              <h3 className="font-serif text-lg font-bold text-neutral-900 pb-3 border-b border-[#F5ECE8]">
                Order Summary ({cart.length} Items)
              </h3>

              {/* Items overview */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.product.images[0]?.url}
                      alt={item.product.name}
                      className="w-12 h-14 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-semibold text-neutral-900 truncate">
                        {item.product.name}
                      </h5>
                      <p className="text-[10px] text-neutral-500">
                        Size: {item.size} • Qty: {item.quantity}
                      </p>
                      <span className="text-xs font-bold text-[#7B2435]">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cost breakdown */}
              <div className="space-y-2 text-xs text-neutral-600 border-t border-[#F5ECE8] pt-3">
                <div className="flex justify-between">
                  <span>Total MRP</span>
                  <span>₹{totalMrp.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Product Discount</span>
                  <span>-₹{(totalMrp - subtotal).toLocaleString('en-IN')}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span>
                    {shippingFee === 0 ? (
                      <strong className="text-emerald-700 font-bold">FREE</strong>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-neutral-900 border-t border-[#F0E6E1] pt-3">
                  <span>Payable Amount</span>
                  <span className="text-[#7B2435] font-serif text-lg">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                onClick={handleProceedToPayment}
                disabled={isSubmittingOrder}
                className="w-full py-4 bg-[#7B2435] hover:bg-[#621c2a] text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-lg transition flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {isSubmittingOrder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <span>
                    {paymentMethod === 'Razorpay'
                      ? `Pay ₹${grandTotal.toLocaleString('en-IN')} via Razorpay`
                      : `Confirm COD Order (₹${grandTotal.toLocaleString('en-IN')})`}
                  </span>
                )}
              </button>

              <div className="p-3 bg-[#FAF6F0] rounded-xl text-[11px] text-neutral-500 space-y-1 text-center">
                <p>✨ 7-Day Hassle-Free Returns & Size Exchanges</p>
                <p>📦 Packed in sustainable cloth dust-bag</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Address Form Modal */}
      <AddressFormModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onSave={async (newAddr) => {
          const added = await addAddress(newAddr);
          if (added?.id) {
            setSelectedAddressId(added.id);
          }
        }}
      />

      {/* Razorpay Simulation Modal */}
      <RazorpayModal
        isOpen={isRazorpayModalOpen}
        amount={grandTotal}
        orderNumber={`ORD-${Date.now().toString().slice(-6)}`}
        customerName={selectedAddress?.fullName || user?.name || 'Customer'}
        customerEmail={user?.email || 'customer@example.com'}
        customerPhone={selectedAddress?.phone || '+91 98765 43210'}
        onClose={() => setIsRazorpayModalOpen(false)}
        onSuccess={(paymentId, rzpOrderId) => {
          setIsRazorpayModalOpen(false);
          handlePlaceOrder(paymentId, rzpOrderId);
        }}
      />
    </div>
  );
};
