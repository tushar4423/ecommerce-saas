import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Truck, 
  CreditCard, 
  Sparkles, 
  MapPin, 
  Phone, 
  User as UserIcon, 
  Plus, 
  Edit2, 
  Trash2, 
  Home, 
  Briefcase, 
  Tag, 
  Check, 
  ArrowLeft, 
  ShieldCheck,
  FileText,
  Printer,
  Download
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Tabs } from '../ui/Tabs';
import { PriceDisplay } from '../common/PriceDisplay';
import { InvoiceModal } from '../invoice/InvoiceModal';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearCart } from '../../store/slices/cartSlice';
import { addAddress as reduxAddAddress, updateAddress as reduxUpdateAddress } from '../../store/slices/authSlice';
import { useCreateOrderMutation, useGetSettingsQuery } from '../../store/api/ecommerceApi';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import { Order, UserAddress } from '../../types';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

const GUEST_ADDRESSES_KEY = 'nandita_saved_addresses';

const getStoredGuestAddresses = (): UserAddress[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_ADDRESSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveGuestAddressesToStorage = (addrs: UserAddress[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(GUEST_ADDRESSES_KEY, JSON.stringify(addrs));
  } catch {}
};

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { 
    user: authUser, 
    addAddress: authAddAddress, 
    updateAddress: authUpdateAddress, 
    deleteAddress: authDeleteAddress,
    setDefaultAddress: authSetDefaultAddress,
    loginWithGoogle 
  } = useAuth();

  const cartItems = useAppSelector((state) => state.cart.items);
  const appliedCoupon = useAppSelector((state) => state.cart.appliedCoupon);
  const discountAmount = useAppSelector((state) => state.cart.discountAmount);
  const reduxUser = useAppSelector((state) => state.auth.user);

  const currentUser = authUser || reduxUser;

  const { data: settings } = useGetSettingsQuery();
  const [createOrder, { isLoading: isPlacingOrder }] = useCreateOrderMutation();

  const [activeStep, setActiveStep] = useState<'address' | 'payment' | 'confirmation'>('address');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [addressMode, setAddressMode] = useState<'choose' | 'new' | 'edit'>('choose');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Address form fields
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Jaipur');
  const [stateName, setStateName] = useState('Rajasthan');
  const [pincode, setPincode] = useState('302001');
  const [addressType, setAddressType] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [shouldSaveAddress, setShouldSaveAddress] = useState<boolean>(true);
  const [isDefaultAddress, setIsDefaultAddress] = useState<boolean>(false);

  // Payment form
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'COD' | 'Card' | 'NetBanking'>('UPI');
  const [upiId, setUpiId] = useState('');

  // Synchronize saved addresses from Auth / Redux / LocalStorage
  useEffect(() => {
    if (!isOpen) return;

    const guestAddrs = getStoredGuestAddresses();
    const userAddrs = (authUser?.addresses && authUser.addresses.length > 0)
      ? authUser.addresses
      : (reduxUser?.addresses || []);

    const addressMap = new Map<string, UserAddress>();
    [...userAddrs, ...guestAddrs].forEach((addr) => {
      if (addr && (addr.id || addr.addressLine1)) {
        const id = addr.id || `addr-${addr.pincode}-${addr.phone}`;
        addressMap.set(id, { ...addr, id });
      }
    });

    const combined = Array.from(addressMap.values());
    setSavedAddresses(combined);

    if (combined.length > 0) {
      setAddressMode('choose');
      // Pick default address or the first address
      const defaultAddr = combined.find((a) => a.isDefault) || combined[0];
      setSelectedAddressId(defaultAddr.id || '');
      populateFormFromAddress(defaultAddr);
    } else {
      setAddressMode('new');
      setName(currentUser?.name || '');
      setPhone(currentUser?.phone || '');
      setEmail(currentUser?.email || '');
    }
  }, [isOpen, authUser?.addresses, reduxUser?.addresses]);

  const populateFormFromAddress = (addr: UserAddress) => {
    setName(addr.fullName || addr.name || currentUser?.name || '');
    setPhone(addr.phone || currentUser?.phone || '');
    setEmail(currentUser?.email || '');
    setAddressLine1(addr.addressLine1 || '');
    setAddressLine2(addr.addressLine2 || '');
    setLandmark(addr.landmark || '');
    setCity(addr.city || 'Jaipur');
    setStateName(addr.state || 'Rajasthan');
    setPincode(addr.pincode || '302001');
    setAddressType((addr.type as any) || 'Home');
    setIsDefaultAddress(!!addr.isDefault);
  };

  const handleSelectSavedAddress = (addr: UserAddress) => {
    if (!addr.id) return;
    setSelectedAddressId(addr.id);
    populateFormFromAddress(addr);
  };

  const handleStartAddNewAddress = () => {
    setEditingAddressId(null);
    setName(currentUser?.name || '');
    setPhone(currentUser?.phone || '');
    setEmail(currentUser?.email || '');
    setAddressLine1('');
    setAddressLine2('');
    setLandmark('');
    setCity('Jaipur');
    setStateName('Rajasthan');
    setPincode('302001');
    setAddressType('Home');
    setShouldSaveAddress(true);
    setIsDefaultAddress(savedAddresses.length === 0);
    setAddressMode('new');
  };

  const handleStartEditAddress = (addr: UserAddress, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!addr.id) return;
    setEditingAddressId(addr.id);
    populateFormFromAddress(addr);
    setShouldSaveAddress(true);
    setAddressMode('edit');
  };

  const handleDeleteAddress = async (addrId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Are you sure you want to remove this saved address?')) return;

    try {
      if (authUser) {
        await authDeleteAddress(addrId);
      }
    } catch {}

    const updated = savedAddresses.filter((a) => a.id !== addrId);
    setSavedAddresses(updated);
    saveGuestAddressesToStorage(updated);

    if (selectedAddressId === addrId) {
      if (updated.length > 0) {
        const next = updated[0];
        setSelectedAddressId(next.id || '');
        populateFormFromAddress(next);
      } else {
        handleStartAddNewAddress();
      }
    }
    toast.success('Address removed.');
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const freeShippingThreshold = settings?.shippingConfig?.freeShippingThreshold ?? 999;
  const standardShippingFee = settings?.shippingConfig?.standardShippingFee ?? 99;
  const isFreeShipping = subtotal >= freeShippingThreshold;
  const shippingFee = isFreeShipping ? 0 : standardShippingFee;
  const codFee = paymentMethod === 'COD' && settings?.shippingConfig?.codFee ? settings.shippingConfig.codFee : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee + codFee);

  const validateAddress = () => {
    if (!name.trim() || !phone.trim() || !addressLine1.trim() || !city.trim() || !pincode.trim()) {
      toast.error('Please fill in all mandatory delivery address fields.');
      return false;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return false;
    }
    if (pincode.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit PIN code.');
      return false;
    }
    return true;
  };

  const handleProceedToPayment = async () => {
    if (addressMode === 'choose') {
      const selected = savedAddresses.find((a) => a.id === selectedAddressId);
      if (!selected) {
        toast.error('Please choose a delivery address or add a new one.');
        return;
      }
      populateFormFromAddress(selected);
      setActiveStep('payment');
      return;
    }

    // When in 'new' or 'edit' mode
    if (!validateAddress()) return;

    const addressObj: UserAddress = {
      id: editingAddressId || `addr-${Date.now()}`,
      fullName: name.trim(),
      name: name.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      landmark: landmark.trim() || undefined,
      city: city.trim(),
      state: stateName.trim(),
      pincode: pincode.trim(),
      type: addressType,
      isDefault: isDefaultAddress || savedAddresses.length === 0,
    };

    if (shouldSaveAddress || addressMode === 'edit') {
      if (authUser) {
        if (editingAddressId) {
          await authUpdateAddress(editingAddressId, addressObj);
        } else {
          await authAddAddress(addressObj);
        }
      }

      // Update local and Redux
      let updatedList = [...savedAddresses];
      if (editingAddressId) {
        updatedList = updatedList.map((a) => (a.id === editingAddressId ? addressObj : a));
        dispatch(reduxUpdateAddress(addressObj));
      } else {
        if (addressObj.isDefault) {
          updatedList = updatedList.map((a) => ({ ...a, isDefault: false }));
        }
        updatedList.unshift(addressObj);
        dispatch(reduxAddAddress(addressObj));
      }

      setSavedAddresses(updatedList);
      saveGuestAddressesToStorage(updatedList);
      toast.success(editingAddressId ? 'Address updated!' : 'Address saved for future checkouts!');
    }

    setSelectedAddressId(addressObj.id || '');
    setActiveStep('payment');
  };

  const handlePlaceOrder = async () => {
    try {
      const activeUserId = authUser?.id || (authUser as any)?.uid || currentUser?.id;
      const resolvedName = name || authUser?.name || currentUser?.name || 'Customer';
      const resolvedEmail = email || authUser?.email || currentUser?.email || '';
      const resolvedPhone = phone || authUser?.phone || currentUser?.phone || '';

      const orderPayload = {
        ...(activeUserId ? { userId: activeUserId } : {}),
        customerName: resolvedName,
        customerEmail: resolvedEmail,
        customerPhone: resolvedPhone,
        items: cartItems,
        totalAmount: finalTotal,
        grandTotal: finalTotal,
        subtotal,
        discountAmount,
        couponCode: appliedCoupon || undefined,
        shippingFee: isFreeShipping ? 0 : shippingFee,
        taxAmount: Math.round((subtotal - discountAmount) * 0.05),
        shippingAddress: {
          id: selectedAddressId || `addr-${Date.now()}`,
          name: resolvedName,
          fullName: resolvedName,
          phone: resolvedPhone,
          email: resolvedEmail,
          addressLine1,
          addressLine2,
          landmark,
          city,
          state: stateName,
          pincode,
          type: addressType,
          isDefault: true,
        },
        paymentMethod: paymentMethod === 'COD' ? 'Cash on Delivery' : paymentMethod,
        paymentStatus: (paymentMethod === 'COD' ? 'Pending' : 'Paid') as any,
        orderStatus: 'Confirmed' as any,
      };

      const newOrder = await createOrder(orderPayload).unwrap();
      setPlacedOrder(newOrder);
      dispatch(clearCart());
      toast.success(`🎉 Order #${newOrder.orderNumber} confirmed successfully!`);
      setActiveStep('confirmation');
      onOrderSuccess(newOrder);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to place order. Please try again.');
    }
  };

  const steps = [
    { id: 'address', label: '1. Delivery Address' },
    { id: 'payment', label: '2. Payment' },
    { id: 'confirmation', label: '3. Order Receipt' },
  ];

  const selectedAddrObj = savedAddresses.find((a) => a.id === selectedAddressId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        activeStep === 'confirmation'
          ? '🎉 Order Placed Successfully!'
          : 'Express Checkout — Nandita Fashion'
      }
      subtitle={
        activeStep === 'confirmation'
          ? `Receipt for Order #${placedOrder?.orderNumber}`
          : 'Handcrafted Heritage Kurtis Delivered to Your Doorstep'
      }
    >
      <div className="space-y-6">
        {/* Step Indicator */}
        {activeStep !== 'confirmation' && (
          <Tabs
            tabs={steps}
            activeTab={activeStep}
            onChange={(s) => {
              if (s === 'payment') {
                if (addressMode !== 'choose' && !validateAddress()) return;
              }
              if (s !== 'confirmation') setActiveStep(s as any);
            }}
            variant="pills"
          />
        )}

        {/* STEP 1: ADDRESS */}
        {activeStep === 'address' && (
          <div className="space-y-5">
            {/* View A: CHOOSE SAVED ADDRESS */}
            {addressMode === 'choose' && savedAddresses.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#7B2435]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Choose Saved Delivery Address ({savedAddresses.length})
                    </h4>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartAddNewAddress}
                    className="flex items-center gap-1.5 text-xs text-[#7B2435] border-[#7B2435]/30 hover:bg-[#FFF0F3]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New Address
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    const TypeIcon = addr.type === 'Work' ? Briefcase : (addr.type === 'Other' ? Tag : Home);

                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectSavedAddress(addr)}
                        className={`p-4 rounded-2xl border transition-all text-left cursor-pointer relative ${
                          isSelected
                            ? 'border-[#7B2435] bg-[#FFF9F9] shadow-sm ring-2 ring-[#7B2435]/15'
                            : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
                        }`}
                      >
                        {/* Header: Type and Default tag */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                              <TypeIcon className="w-3 h-3" /> {addr.type || 'Home'}
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Default
                              </span>
                            )}
                          </div>

                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                            isSelected ? 'border-[#7B2435] bg-[#7B2435] text-white' : 'border-neutral-300 bg-white'
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Name & Phone */}
                        <div className="mb-1.5">
                          <span className="font-bold text-sm text-neutral-900">
                            {addr.fullName || addr.name}
                          </span>
                          <span className="text-xs text-neutral-500 ml-2">
                            {addr.phone}
                          </span>
                        </div>

                        {/* Full Address */}
                        <p className="text-xs text-neutral-600 leading-relaxed mb-3 line-clamp-2">
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                          {addr.landmark ? ` (Near ${addr.landmark})` : ''}, {addr.city}, {addr.state} -{' '}
                          <strong className="text-neutral-800">{addr.pincode}</strong>
                        </p>

                        {/* Actions bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-neutral-100/80 text-xs">
                          <span className={`text-[11px] font-semibold ${isSelected ? 'text-[#7B2435]' : 'text-neutral-400'}`}>
                            {isSelected ? '✓ Deliver to this Address' : 'Click to Select'}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleStartEditAddress(addr, e)}
                              className="p-1 rounded-md text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition"
                              title="Edit this address"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteAddress(addr.id!, e)}
                              className="p-1 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Delete this address"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-neutral-100">
                  <span className="text-xs text-neutral-500">
                    Cart Total: <strong>{formatCurrency(finalTotal)}</strong> ({cartItems.length} items)
                  </span>
                  <Button variant="primary" size="md" onClick={handleProceedToPayment}>
                    Continue to Payment →
                  </Button>
                </div>
              </div>
            )}

            {/* View B: NEW / EDIT ADDRESS FORM */}
            {(addressMode === 'new' || addressMode === 'edit' || savedAddresses.length === 0) && (
              <div className="space-y-4">
                {savedAddresses.length > 0 && (
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                    <button
                      type="button"
                      onClick={() => setAddressMode('choose')}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#7B2435] hover:underline cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Saved Addresses ({savedAddresses.length})
                    </button>
                    <span className="text-xs font-bold text-neutral-700">
                      {addressMode === 'edit' ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    required
                    placeholder="e.g. Ananya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <Input
                    label="Mobile Phone Number"
                    required
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <Input
                  label="Email Address (for Order Updates & Invoice)"
                  type="email"
                  placeholder="e.g. ananya@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                  label="House / Flat / Building No. & Street"
                  required
                  placeholder="e.g. Flat 302, Royal Palms Apartment, 100 Feet Road"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Area / Colony"
                    placeholder="e.g. Near Hawa Mahal Circle"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                  />

                  <Input
                    label="Landmark (Optional)"
                    placeholder="e.g. Opposite City Hospital"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />

                  <Input
                    label="State"
                    required
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                  />

                  <Input
                    label="PIN Code"
                    required
                    maxLength={6}
                    placeholder="6-digit PIN"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                {/* Address Type Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Address Type
                  </label>
                  <div className="flex gap-3">
                    {(['Home', 'Work', 'Other'] as const).map((t) => {
                      const Icon = t === 'Work' ? Briefcase : (t === 'Other' ? Tag : Home);
                      const isSelected = addressType === t;
                      return (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setAddressType(t)}
                          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-[#7B2435] text-white border-[#7B2435] shadow-xs'
                              : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{t}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save address options checkboxes */}
                <div className="bg-[#FAF6F0] p-3.5 rounded-xl border border-neutral-200 space-y-2 text-xs">
                  <label className="flex items-center gap-2.5 cursor-pointer text-neutral-800">
                    <input
                      type="checkbox"
                      checked={shouldSaveAddress}
                      onChange={(e) => setShouldSaveAddress(e.target.checked)}
                      className="w-4 h-4 rounded text-[#7B2435] accent-[#7B2435]"
                    />
                    <span className="font-semibold">
                      💾 Save this address for faster checkout in future
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-neutral-700">
                    <input
                      type="checkbox"
                      checked={isDefaultAddress}
                      onChange={(e) => setIsDefaultAddress(e.target.checked)}
                      className="w-4 h-4 rounded text-[#7B2435] accent-[#7B2435]"
                    />
                    <span>Set as primary default delivery address</span>
                  </label>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-neutral-100">
                  {savedAddresses.length > 0 ? (
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => setAddressMode('choose')}
                    >
                      Cancel
                    </Button>
                  ) : (
                    <span className="text-xs text-neutral-500">
                      Total: <strong>{formatCurrency(finalTotal)}</strong>
                    </span>
                  )}
                  <Button variant="primary" size="md" onClick={handleProceedToPayment}>
                    {editingAddressId ? 'Save & Continue to Payment →' : 'Deliver Here & Proceed →'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: PAYMENT */}
        {activeStep === 'payment' && (
          <div className="space-y-5">
            {/* Delivery Address Summary with quick change */}
            <div className="p-4 rounded-2xl bg-[#FFF9F9] border border-[#EADBDA] flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#7B2435] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900">{name}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                      {addressType}
                    </span>
                    <span className="text-neutral-500 font-medium">({phone})</span>
                  </div>
                  <p className="text-neutral-600 mt-1">
                    {addressLine1}
                    {addressLine2 ? `, ${addressLine2}` : ''}
                    {landmark ? ` (Near ${landmark})` : ''}, {city}, {stateName} -{' '}
                    <strong className="text-neutral-900">{pincode}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveStep('address');
                  setAddressMode(savedAddresses.length > 0 ? 'choose' : 'new');
                }}
                className="text-xs font-bold text-[#7B2435] hover:underline shrink-0 cursor-pointer"
              >
                Change Address
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Select Payment Mode
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'UPI'
                      ? 'border-[#7B2435] bg-[#FFF0F3] shadow-xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-neutral-900">Instant UPI</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Fastest
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Google Pay, PhonePe, Paytm, BHIM</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentMethod === 'COD'
                      ? 'border-[#7B2435] bg-[#FFF0F3] shadow-xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-neutral-900">Cash on Delivery</span>
                    <span className="text-[10px] bg-neutral-100 text-neutral-700 font-bold px-2 py-0.5 rounded-full">
                      Pay at Home
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Pay when your parcel arrives</p>
                </button>
              </div>
            </div>

            {paymentMethod === 'UPI' && (
              <div className="p-4 rounded-xl bg-[#FAF6F0] border border-neutral-200 space-y-3">
                <Input
                  label="Enter UPI ID (e.g. 9876543210@paytm / name@okaxis)"
                  placeholder="yourname@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <p className="text-[11px] text-neutral-500">
                  ⚡ Seamless payment request will be sent to your UPI app for instant confirmation.
                </p>
              </div>
            )}

            {/* Order Price Summary Breakdown */}
            <div className="p-4 bg-white rounded-xl border border-neutral-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount ({appliedCoupon})</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span>{isFreeShipping ? 'FREE' : formatCurrency(shippingFee)}</span>
              </div>
              {codFee > 0 && (
                <div className="flex justify-between">
                  <span>COD Handling Fee</span>
                  <span>{formatCurrency(codFee)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-neutral-200 flex justify-between font-bold text-sm text-neutral-900">
                <span>Total Amount to Pay</span>
                <span className="text-[#7B2435]">{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setActiveStep('address');
                  setAddressMode(savedAddresses.length > 0 ? 'choose' : 'new');
                }}
              >
                ← Back to Address
              </Button>
              <Button
                variant="primary"
                size="lg"
                isLoading={isPlacingOrder}
                onClick={handlePlaceOrder}
              >
                Confirm & Place Order ({formatCurrency(finalTotal)})
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: ORDER CONFIRMATION */}
        {activeStep === 'confirmation' && placedOrder && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="font-serif text-2xl font-bold text-neutral-900">
                Thank You, {placedOrder.shippingAddress.name}!
              </h3>
              <p className="text-sm text-neutral-600 mt-1">
                Your order <strong>#{placedOrder.orderNumber}</strong> has been received and is being prepared with artisanal love.
              </p>
            </div>

            <div className="bg-[#FAF6F0] p-4 rounded-xl border border-neutral-200 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <span className="font-bold text-neutral-800">Invoice Number:</span>
                <span className="font-mono font-bold text-[#7B2435]">{placedOrder.invoiceNumber || `INV-NF-${placedOrder.orderNumber}`}</span>
              </div>
              <p>
                <strong>Delivery To:</strong> {placedOrder.shippingAddress.addressLine1}, {placedOrder.shippingAddress.city}, {placedOrder.shippingAddress.state} - {placedOrder.shippingAddress.pincode}
              </p>
              <p>
                <strong>Payment Mode:</strong> {placedOrder.paymentMethod} ({formatCurrency(placedOrder.totalAmount)})
              </p>
              <p>
                <strong>GST Slabs Applied:</strong> 5% (Items ≤ ₹2,500) • 18% (Items &gt; ₹2,500)
              </p>
              <p>
                <strong>Estimated Delivery:</strong> 3 - 5 Business Days via Express Courier
              </p>
            </div>

            {/* Invoice & Shopping Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsInvoiceModalOpen(true)}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 border-[#7B2435] text-[#7B2435] hover:bg-[#FFF6F7]"
              >
                <FileText className="w-4 h-4" />
                <span>View Tax Invoice</span>
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsInvoiceModalOpen(true)}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white"
              >
                <Download className="w-4 h-4" />
                <span>Download (PDF)</span>
              </Button>
            </div>

            <div className="pt-2 flex justify-center">
              <Button variant="primary" size="md" onClick={onClose} className="w-full max-w-md">
                Continue Exploring Kurtis
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Official GST Tax Invoice Modal */}
      {placedOrder && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          order={placedOrder}
        />
      )}
    </Modal>
  );
};
