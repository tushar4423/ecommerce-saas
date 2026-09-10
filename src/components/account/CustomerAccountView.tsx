import React, { useState, useEffect } from 'react';
import { 
  User, 
  Package, 
  MapPin, 
  Tag, 
  Heart, 
  LogOut, 
  Plus, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Sparkles,
  ShieldAlert,
  Trash2,
  FileText,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import { Order, UserAddress, Coupon } from '../../types';
import { AddressFormModal } from '../checkout/AddressFormModal';
import { EmptyState } from '../common/EmptyState';
import { InvoiceModal } from '../invoice/InvoiceModal';
import { OrderTrackingModal } from './OrderTrackingModal';

interface CustomerAccountViewProps {
  onNavigate: (route: string) => void;
  onSelectOrder?: (order: Order) => void;
}

export const CustomerAccountView: React.FC<CustomerAccountViewProps> = ({
  onNavigate,
  onSelectOrder,
}) => {
  const { user, loading, logout, addAddress, deleteAddress, loginWithGoogle } = useAuth();
  const { wishlist } = useCart();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'coupons' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchUserOrders = async () => {
      try {
        const data = await api.getOrders(user?.id, user?.email);
        if (isMounted) setOrders(data);
      } catch (err) {
        console.warn('Error loading orders:', err);
      }
    };
    fetchUserOrders();
    api.getCoupons().then((c) => {
      if (isMounted) setCoupons(c);
    });
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await loginWithGoogle('/account');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#FAF6F0] min-h-screen py-20 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7B2435] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-[#FAF6F0] min-h-screen py-16 px-4">
        <div className="max-w-md mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-[#F0E6E1] text-center space-y-5 shadow-lg animate-fade-in">
          <div className="w-16 h-16 bg-[#FFF6F7] text-[#7B2435] border border-[#F5D8DE] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-neutral-900">
              Sign In to Your Nandita Fashion Account
            </h2>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Access real-time order tracking, your saved delivery addresses, personalized ethnic size recommendations, and exclusive club perks.
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full py-3.5 bg-white hover:bg-neutral-50 text-neutral-800 border-2 border-neutral-300 hover:border-[#7B2435] rounded-2xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {isSigningIn ? (
              <div className="w-4 h-4 border-2 border-[#7B2435] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Authenticate with Google</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-neutral-400">
            Protected by Google OAuth & Firebase Cloud Security.
          </p>
        </div>
      </div>
    );
  }

  const addresses = user.addresses || [];

  return (
    <div className="bg-[#FAF6F0] min-h-screen py-10 w-full">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#F0E6E1] shadow-xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-[#C98C97]/40 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900">
                  {user.name}
                </h1>
                {user.role === 'admin' && (
                  <span className="px-2.5 py-0.5 bg-[#7B2435] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Store Administrator
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">{user.email} • {user.phone || '+91 98765 43210'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user.role === 'admin' && (
              <button
                onClick={() => onNavigate('/admin')}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-full text-xs font-bold transition shadow-xs"
              >
                Store Admin Portal
              </button>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 border border-neutral-300 hover:border-neutral-500 text-neutral-700 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-4 border-b border-[#EADBDA] mb-8">
          {[
            { id: 'orders', label: 'My Orders', icon: Package, count: orders.length },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin, count: addresses.length },
            { id: 'coupons', label: 'Coupons & Offers', icon: Tag, count: coupons.length },
            { id: 'profile', label: 'Profile Settings', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-[#7B2435] text-white shadow-sm'
                    : 'bg-white text-neutral-700 border border-neutral-200 hover:border-[#7B2435]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length > 0 ? (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl p-6 border border-[#F0E6E1] shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F5ECE8] pb-4">
                    <div>
                      <span className="text-xs text-neutral-400">Order ID</span>
                      <p className="font-mono text-sm font-bold text-neutral-900">#{order.orderNumber || order.id}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-neutral-500">
                        Placed on {new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        (order.orderStatus || (order as any).status) === 'Delivered'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : (order.orderStatus || (order as any).status) === 'Shipped' || (order.orderStatus || (order as any).status) === 'Out for Delivery'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : (order.orderStatus || (order as any).status) === 'Cancelled'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {order.orderStatus || (order as any).status || 'Confirmed'}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-neutral-100">
                    {(order.items || []).map((item: any, idx: number) => {
                      const itemImg = item.productImage || item.image || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=400';
                      const itemTitle = item.productName || item.name || 'Ethnic Kurti';
                      const itemSubtotal = item.subtotal || ((item.price || 0) * (item.quantity || 1));
                      return (
                        <div key={item.id || idx} className="py-3 flex items-center gap-4">
                          <img
                            src={itemImg}
                            alt={itemTitle}
                            className="w-16 h-20 object-cover rounded-xl border border-neutral-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-neutral-900 truncate">
                              {itemTitle}
                            </h4>
                            <p className="text-xs text-neutral-500 mt-0.5">
                              Size: {item.size || 'M'} • {item.color ? `Color: ${item.color} • ` : ''}Qty: {item.quantity || 1}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs font-bold text-[#7B2435]">
                                ₹{itemSubtotal.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#F5ECE8] text-xs text-neutral-500">
                    <p className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-[#7B2435]" />
                      Courier: <strong>{order.courierPartner || 'Delhivery Express'}</strong> ({order.trackingNumber || 'Tracking on Dispatch'})
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-neutral-900 text-sm mr-2">
                        Total: ₹{(order.grandTotal || order.totalAmount || order.subtotal || 0).toLocaleString('en-IN')}
                      </span>
                      <button
                        onClick={() => setInvoiceOrder(order)}
                        className="px-3 py-1.5 bg-[#FAF6F0] hover:bg-[#F5ECE8] text-[#7B2435] border border-[#EADBDA] rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Tax Invoice</span>
                      </button>
                      <button
                        onClick={() => {
                          if (onSelectOrder) onSelectOrder(order);
                          setTrackingOrder(order);
                        }}
                        className="text-xs font-bold text-[#7B2435] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Track Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<Package className="w-8 h-8 text-[#7B2435]" />}
                title="No Orders Yet"
                description="When you order our handcrafted ethnic garments, you will find tracking numbers and invoice receipts right here."
                actionText="Start Shopping"
                onAction={() => onNavigate('/kurtis')}
              />
            )}
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-lg font-bold text-neutral-900">
                Your Saved Shipping Addresses
              </h3>
              <button
                onClick={() => {
                  setEditingAddress(null);
                  setIsAddressModalOpen(true);
                }}
                className="px-4 py-2 bg-[#7B2435] text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Address
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="bg-white p-5 rounded-3xl border border-[#F0E6E1] shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-neutral-900">{addr.fullName}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                        {addr.type}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {addr.addressLine1} {addr.addressLine2}, {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-1">Phone: {addr.phone}</p>
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-[#F5ECE8] text-xs">
                    <button
                      onClick={() => deleteAddress(addr.id)}
                      className="font-semibold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coupons.map((c) => (
              <div
                key={c.code}
                className="bg-white p-5 rounded-3xl border-2 border-dashed border-[#C98C97] shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-[#FFF2F4] text-[#7B2435] font-mono text-xs font-bold rounded-lg tracking-wider">
                    {c.code}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold uppercase bg-emerald-50 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <div>
                  <h4 className="font-serif text-sm font-bold text-neutral-900">{c.description}</h4>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Min order: ₹{c.minOrderValue} • Max discount: ₹{c.maxDiscount}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(c.code);
                    alert(`Coupon ${c.code} copied!`);
                  }}
                  className="w-full py-2 bg-[#FAF6F0] hover:bg-[#7B2435] text-[#7B2435] hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Copy Coupon Code
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-xl bg-white p-6 sm:p-8 rounded-3xl border border-[#F0E6E1] shadow-xs space-y-4">
            <h3 className="font-serif text-lg font-bold text-neutral-900 pb-3 border-b border-[#F5ECE8]">
              Personal Information
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Full Name</label>
                <input
                  type="text"
                  readOnly
                  value={user.name}
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2 text-neutral-800"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Email Address</label>
                <input
                  type="email"
                  readOnly
                  value={user.email}
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2 text-neutral-800"
                />
              </div>
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Primary Phone</label>
                <input
                  type="tel"
                  readOnly
                  value={user.phone || '+91 98765 43210'}
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2 text-neutral-800"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <AddressFormModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        initialData={editingAddress}
        onSave={(newAddr) => {
          addAddress(newAddr);
        }}
      />

      <InvoiceModal
        isOpen={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
        order={invoiceOrder}
      />

      <OrderTrackingModal
        isOpen={!!trackingOrder}
        onClose={() => setTrackingOrder(null)}
        order={trackingOrder}
        onOrderUpdated={(updated) => {
          setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
          setTrackingOrder(updated);
        }}
        onOpenInvoice={(o) => setInvoiceOrder(o)}
      />
    </div>
  );
};
