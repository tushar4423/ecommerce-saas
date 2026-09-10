/**
 * Unit Tests: Pricing, Taxes, Discounts, Shipping & Totals
 */

export function runPricingTests(assert: (desc: string, passed: boolean, details?: any) => void) {
  console.log('\n--- 1. Running Pricing & Financial Calculation Tests ---');

  // Test 1: MRP Discount Percentage
  const calculateDiscountPercent = (mrp: number, price: number) => {
    if (mrp <= price || mrp <= 0) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };

  const disc1 = calculateDiscountPercent(3999, 1999);
  assert('MRP Discount % should compute accurately (₹3999 -> ₹1999 is 50%)', disc1 === 50, { disc1 });

  const disc2 = calculateDiscountPercent(2499, 2499);
  assert('MRP Discount % should be 0 when MRP equals selling price', disc2 === 0, { disc2 });

  // Test 2: Subtotal Calculation
  const items = [
    { price: 1499, quantity: 2 },
    { price: 2999, quantity: 1 },
    { price: 899, quantity: 3 },
  ];
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  assert('Subtotal correctly sums (1499*2 + 2999*1 + 899*3 = ₹8694)', subtotal === 8694, { subtotal });

  // Test 3: Shipping Threshold Rule
  const calculateShipping = (cartSubtotal: number, threshold = 999, fee = 99) => {
    if (cartSubtotal === 0) return 0;
    return cartSubtotal >= threshold ? 0 : fee;
  };

  assert('Orders >= ₹999 qualify for Free Shipping (₹1299 subtotal -> ₹0 fee)', calculateShipping(1299) === 0);
  assert('Orders < ₹999 incur standard shipping fee (₹699 subtotal -> ₹99 fee)', calculateShipping(699) === 99);
  assert('Empty cart incurs ₹0 shipping', calculateShipping(0) === 0);

  // Test 4: GST Tax Calculation (5% included)
  const calculateTax = (netTaxableAmount: number) => Math.round(netTaxableAmount * 0.05);
  const tax = calculateTax(5000);
  assert('5% GST on ₹5,000 equals ₹250', tax === 250, { tax });

  // Test 5: Grand Total Composition
  const computeGrandTotal = (sub: number, disc: number, ship: number, codFee: number) => {
    return Math.max(0, sub - disc + ship + codFee);
  };

  const total1 = computeGrandTotal(2500, 500, 0, 0);
  assert('Grand total computes correctly (₹2500 - ₹500 + ₹0 + ₹0 = ₹2000)', total1 === 2000, { total1 });

  const totalWithCod = computeGrandTotal(800, 0, 99, 49);
  assert('Grand total with shipping & COD computes correctly (₹800 + ₹99 + ₹49 = ₹948)', totalWithCod === 948, { totalWithCod });
}
