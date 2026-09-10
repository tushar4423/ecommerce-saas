/**
 * Unit Tests: Promo Coupons & Discount Engine
 */

interface CouponRule {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  expiryDate?: string;
  isActive?: boolean;
  firstOrderOnly?: boolean;
}

export function evaluateCoupon(
  coupon: CouponRule,
  subtotal: number,
  userId?: string,
  userOrderCount: number = 0
): { valid: boolean; discount: number; reason?: string } {
  if (coupon.isActive === false) {
    return { valid: false, discount: 0, reason: 'Coupon is inactive' };
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate).getTime() < Date.now()) {
    return { valid: false, discount: 0, reason: 'Coupon has expired' };
  }

  if (coupon.firstOrderOnly && userOrderCount > 0) {
    return { valid: false, discount: 0, reason: 'Valid only on your first purchase' };
  }

  const minAmount = coupon.minOrderAmount || 0;
  if (subtotal < minAmount) {
    return { valid: false, discount: 0, reason: `Minimum order of ₹${minAmount} required` };
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

  discount = Math.min(discount, subtotal);
  return { valid: true, discount };
}

export function runCouponTests(assert: (desc: string, passed: boolean, details?: any) => void) {
  console.log('\n--- 2. Running Coupon & Promotion Rule Tests ---');

  // Test 1: Percentage Discount
  const cpn15: CouponRule = {
    code: 'FESTIVE15',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 1500,
    isActive: true,
  };
  const res1 = evaluateCoupon(cpn15, 2000);
  assert('15% off on ₹2000 yields ₹300 discount', res1.valid && res1.discount === 300, res1);

  // Test 2: Min Order Threshold Rejection
  const resMin = evaluateCoupon(cpn15, 1200);
  assert('Coupon rejected when subtotal < minOrderAmount (₹1200 < ₹1500)', !resMin.valid && resMin.discount === 0, resMin);

  // Test 3: Capped Percentage Discount
  const cpnCapped: CouponRule = {
    code: 'BIGDISCOUNT',
    discountType: 'percentage',
    discountValue: 50,
    maxDiscountAmount: 500,
    minOrderAmount: 1000,
    isActive: true,
  };
  const resCapped = evaluateCoupon(cpnCapped, 4000);
  assert('50% on ₹4000 (₹2000) is capped at max ₹500', resCapped.valid && resCapped.discount === 500, resCapped);

  // Test 4: Flat Discount
  const cpnFlat: CouponRule = {
    code: 'FLAT500',
    discountType: 'flat',
    discountValue: 500,
    minOrderAmount: 2000,
    isActive: true,
  };
  const resFlat = evaluateCoupon(cpnFlat, 2500);
  assert('Flat ₹500 discount applies correctly', resFlat.valid && resFlat.discount === 500, resFlat);

  // Test 5: Expired Coupon
  const cpnExpired: CouponRule = {
    code: 'EXPIRED2020',
    discountType: 'flat',
    discountValue: 200,
    expiryDate: '2020-01-01T00:00:00Z',
    isActive: true,
  };
  const resExpired = evaluateCoupon(cpnExpired, 2500);
  assert('Expired coupon is strictly rejected', !resExpired.valid, resExpired);

  // Test 6: First-Order Only Coupon
  const cpnFirst: CouponRule = {
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: 10,
    firstOrderOnly: true,
    isActive: true,
  };
  const resFirstOk = evaluateCoupon(cpnFirst, 1000, 'user-1', 0);
  const resFirstFail = evaluateCoupon(cpnFirst, 1000, 'user-1', 2);
  assert('First order coupon accepted for new user (0 orders)', resFirstOk.valid && resFirstOk.discount === 100);
  assert('First order coupon rejected for returning user (2 past orders)', !resFirstFail.valid);
}
