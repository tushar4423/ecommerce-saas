/**
 * Unit Tests: Multi-Variant Inventory & Stock Operations
 */

interface Variant {
  id: string;
  size: string;
  color: string;
  stock: number;
}

interface Product {
  id: string;
  name: string;
  variants: Variant[];
}

export function deductStock(
  product: Product,
  size: string,
  color: string,
  quantity: number
): { success: boolean; error?: string; updatedStock?: number } {
  const variant = product.variants.find(
    v => v.size === size && (!color || v.color === color)
  );

  if (!variant) {
    return { success: false, error: 'Variant not found' };
  }

  if (variant.stock < quantity) {
    return {
      success: false,
      error: `Insufficient stock for size ${size}. Available: ${variant.stock}, Requested: ${quantity}`,
    };
  }

  variant.stock -= quantity;
  return { success: true, updatedStock: variant.stock };
}

export function runInventoryTests(assert: (desc: string, passed: boolean, details?: any) => void) {
  console.log('\n--- 3. Running Inventory & Stock Deduction Tests ---');

  const testProduct: Product = {
    id: 'prod-anarkali-01',
    name: 'Royal Maroon Velvet Anarkali',
    variants: [
      { id: 'v-m', size: 'M', color: 'Maroon', stock: 5 },
      { id: 'v-l', size: 'L', color: 'Maroon', stock: 2 },
      { id: 'v-xl', size: 'XL', color: 'Maroon', stock: 0 },
    ],
  };

  // Test 1: Successful Deduction
  const res1 = deductStock(testProduct, 'M', 'Maroon', 2);
  assert('Successfully deducts 2 units from Size M (Stock 5 -> 3)', res1.success && res1.updatedStock === 3, res1);

  // Test 2: Out of Stock Rejection
  const resOos = deductStock(testProduct, 'XL', 'Maroon', 1);
  assert('Rejects order for Size XL with 0 stock', !resOos.success, resOos);

  // Test 3: Insufficient Stock Rejection
  const resExcess = deductStock(testProduct, 'L', 'Maroon', 5);
  assert('Rejects order when requested qty (5) exceeds available stock (2)', !resExcess.success, resExcess);

  // Test 4: Depleting Exact Stock
  const resExact = deductStock(testProduct, 'L', 'Maroon', 2);
  assert('Successfully drains stock to 0 when ordering exact quantity available', resExact.success && resExact.updatedStock === 0, resExact);
}
