import React, { useState } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, Tag, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { EmptyState } from '../ui/EmptyState';
import { PriceDisplay } from '../common/PriceDisplay';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setCartDrawerOpen } from '../../store/slices/uiSlice';
import {
  removeFromCart,
  updateQuantity,
  applyCouponDiscount,
  removeCouponDiscount,
} from '../../store/slices/cartSlice';
import { useGetCouponsQuery, useGetSettingsQuery } from '../../store/api/ecommerceApi';
import { formatCurrency } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';

export interface CartDrawerProps {
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onProceedToCheckout,
  onContinueShopping,
}) => {
  const dispatch = useAppDispatch();
  const toast = useToast();

  const isOpen = useAppSelector((state) => state.ui.isCartDrawerOpen);
  const cartItems = useAppSelector((state) => state.cart.items);
  const appliedCoupon = useAppSelector((state) => state.cart.appliedCoupon);
  const discountAmount = useAppSelector((state) => state.cart.discountAmount);

  const { data: coupons = [] } = useGetCouponsQuery();
  const { data: settings } = useGetSettingsQuery();

  const [couponCodeInput, setCouponCodeInput] = useState('');

  const freeShippingThreshold = settings?.shippingConfig?.freeShippingThreshold ?? 999;
  const standardShippingFee = settings?.shippingConfig?.standardShippingFee ?? 99;

  // Totals Calculation
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalMrp = cartItems.reduce((acc, item) => acc + (item.mrp || item.price) * item.quantity, 0);
  const isFreeShipping = subtotal >= freeShippingThreshold || subtotal === 0;
  const shippingFee = isFreeShipping ? 0 : standardShippingFee;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);
  const totalSavings = totalMrp > subtotal ? totalMrp - subtotal + discountAmount : discountAmount;

  // Free shipping progress
  const freeShippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) return;

    const coupon = coupons.find((c) => c.code.toUpperCase() === code && c.active);
    if (!coupon) {
      toast.error(`Coupon code "${code}" is invalid or expired`);
      return;
    }

    if (subtotal < coupon.minOrderAmount) {
      toast.warning(`Minimum cart value of ${formatCurrency(coupon.minOrderAmount)} required for this code.`);
      return;
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.discountValue;
    }

    dispatch(applyCouponDiscount({ code: coupon.code, discountAmount: discount }));
    toast.success(`Applied ${coupon.code}! You saved ${formatCurrency(discount)}`);
    setCouponCodeInput('');
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCouponDiscount());
    toast.info('Coupon discount removed');
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={() => dispatch(setCartDrawerOpen(false))}
      title={`Shopping Bag (${cartItems.reduce((a, b) => a + b.quantity, 0)})`}
      subtitle="Handcrafted ethnic kurtis"
      size="md"
      footer={
        cartItems.length > 0 ? (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-neutral-900">Total Payable Amount:</span>
              <span className="font-serif text-lg font-black text-neutral-900">
                {formatCurrency(finalTotal)}
              </span>
            </div>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => {
                dispatch(setCartDrawerOpen(false));
                onProceedToCheckout();
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Proceed to Secure Checkout
            </Button>
          </div>
        ) : null
      }
    >
      {cartItems.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8 text-[#7B2435]" />}
          title="Your Shopping Bag is Empty"
          description="Explore our latest collection of handcrafted cotton, chikankari and festive kurtis."
          primaryActionText="Explore Kurtis Catalog"
          onPrimaryAction={() => {
            dispatch(setCartDrawerOpen(false));
            onContinueShopping();
          }}
        />
      ) : (
        <div className="space-y-6">
          {/* Free Shipping Progress Indicator */}
          <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 text-neutral-800">
                <Truck className="w-4 h-4 text-[#7B2435]" />
                <span>
                  {isFreeShipping
                    ? '🎉 You have unlocked 100% Free Shipping!'
                    : `Add ${formatCurrency(amountNeededForFreeShipping)} more for FREE Delivery!`}
                </span>
              </div>
              <span className="text-[#7B2435]">{freeShippingProgress}%</span>
            </div>
            <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#7B2435] h-full transition-all duration-500 rounded-full"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="divide-y divide-neutral-100">
            {cartItems.map((item) => (
              <div key={`${item.productId}-${item.size}`} className="py-4 flex gap-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-18 h-24 object-cover rounded-xl border border-neutral-200 bg-neutral-50 shrink-0"
                />

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif font-bold text-sm text-neutral-900 line-clamp-1">
                        {item.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          dispatch(
                            removeFromCart({ productId: item.productId, size: item.size })
                          )
                        }
                        className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
                        Size: {item.size}
                      </span>
                      {item.color && (
                        <span className="text-xs text-neutral-500">• {item.color}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-neutral-200 rounded-lg bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              productId: item.productId,
                              size: item.size,
                              quantity: item.quantity - 1,
                            })
                          )
                        }
                        className="p-1.5 text-neutral-500 hover:bg-neutral-100 cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-xs font-bold text-neutral-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          dispatch(
                            updateQuantity({
                              productId: item.productId,
                              size: item.size,
                              quantity: item.quantity + 1,
                            })
                          )
                        }
                        className="p-1.5 text-neutral-500 hover:bg-neutral-100 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <span className="font-bold text-sm text-neutral-900">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      {item.mrp && item.mrp > item.price && (
                        <span className="text-xs text-neutral-400 line-through block">
                          {formatCurrency(item.mrp * item.quantity)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Coupon Code Section */}
          <div className="pt-2">
            {appliedCoupon ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-bold text-emerald-800">'{appliedCoupon}' Applied</span>
                    <span className="text-emerald-700 block">
                      Saved {formatCurrency(discountAmount)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo coupon (e.g. NANDITA15)"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  className="uppercase text-xs"
                />
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => handleApplyCoupon()}
                  disabled={!couponCodeInput.trim()}
                >
                  Apply
                </Button>
              </div>
            )}
          </div>

          {/* Bill Summary */}
          <div className="bg-[#FAF6F0]/60 p-4 rounded-xl space-y-2 text-xs text-neutral-600 border border-neutral-100">
            <div className="flex justify-between">
              <span>Bag MRP Total</span>
              <span>{formatCurrency(totalMrp)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Product Discounts</span>
              <span>-{formatCurrency(totalMrp - subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Coupon Discount ({appliedCoupon})</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>
                {isFreeShipping ? (
                  <span className="text-emerald-700 font-bold">FREE</span>
                ) : (
                  formatCurrency(shippingFee)
                )}
              </span>
            </div>
            <div className="pt-2 border-t border-neutral-200 flex justify-between font-bold text-neutral-900 text-sm">
              <span>Total Payable</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
            {totalSavings > 0 && (
              <p className="text-[11px] font-bold text-emerald-700 text-center pt-1">
                🎉 Total Savings on this order: {formatCurrency(totalSavings)}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>100% Authentic Handloom • 7-Day Easy Returns</span>
          </div>
        </div>
      )}
    </Drawer>
  );
};
