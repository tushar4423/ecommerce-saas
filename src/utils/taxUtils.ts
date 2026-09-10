/**
 * Indian GST & E-Commerce Invoice Utilities
 * 
 * Slabs for Apparel/Garments (as per Indian GST notification & user rule):
 * - Items priced up to ₹2,500 -> 5% GST (2.5% CGST + 2.5% SGST for Intra-State, 5% IGST for Inter-State)
 * - Items priced above ₹2,500 -> 18% GST (9% CGST + 9% SGST for Intra-State, 18% IGST for Inter-State)
 */

export interface StateInfo {
  name: string;
  code: string;
}

export const INDIAN_STATES: Record<string, string> = {
  'JAMMU AND KASHMIR': '01',
  'HIMACHAL PRADESH': '02',
  'PUNJAB': '03',
  'CHANDIGARH': '04',
  'UTTARAKHAND': '05',
  'HARYANA': '06',
  'DELHI': '07',
  'RAJASTHAN': '08',
  'UTTAR PRADESH': '09',
  'BIHAR': '10',
  'SIKKIM': '11',
  'ARUNACHAL PRADESH': '12',
  'NAGALAND': '13',
  'MANIPUR': '14',
  'MIZORAM': '15',
  'TRIPURA': '16',
  'MEGHALAYA': '17',
  'ASSAM': '18',
  'WEST BENGAL': '19',
  'JHARKHAND': '20',
  'ODISHA': '21',
  'CHHATTISGARH': '22',
  'MADHYA PRADESH': '23',
  'GUJARAT': '24',
  'DAMAN AND DIU': '25',
  'DADRA AND NAGAR HAVELI': '26',
  'MAHARASHTRA': '27',
  'ANDHRA PRADESH': '37',
  'KARNATAKA': '29',
  'GOA': '30',
  'LAKSHADWEEP': '31',
  'KERALA': '32',
  'TAMIL NADU': '33',
  'PUDUCHERRY': '34',
  'ANDAMAN AND NICOBAR ISLANDS': '35',
  'TELANGANA': '36',
  'LADAKH': '38',
};

export const STORE_SELLER_INFO = {
  legalName: 'Nandita Fashion Retail Private Limited',
  tradeName: 'Nandita Fashion — Handcrafted Ethnic Studio',
  addressLine1: 'Plot 14-A, Sanganer Artisan Craft Cluster',
  addressLine2: 'Near Hand-Block Textile Park, Tonk Road',
  city: 'Jaipur',
  state: 'Rajasthan',
  stateCode: '08',
  pincode: '302029',
  country: 'India',
  gstin: '08AAACN1234F1Z8',
  pan: 'AAACN1234F',
  cin: 'U17299RJ2023PTC085432',
  email: 'care@nanditafashion.com',
  phone: '+91 98765 43210',
  supportTollFree: '1800-202-4589',
  website: 'https://nanditafashion.com',
  hsnCode: '6204', // HSN 6204: Women's Ethnic Kurtas, Suits, Ensembles & Dresses
};

export function getStateCode(stateName?: string): string {
  if (!stateName) return '08';
  const clean = stateName.trim().toUpperCase();
  for (const [key, code] of Object.entries(INDIAN_STATES)) {
    if (clean === key || clean.includes(key) || key.includes(clean)) {
      return code;
    }
  }
  return '08';
}

export function isIntraState(shippingState?: string, originState: string = 'Rajasthan'): boolean {
  if (!shippingState) return true;
  return shippingState.trim().toLowerCase() === originState.trim().toLowerCase();
}

/**
 * Returns GST percentage for a garment based on its unit selling price:
 * - Up to ₹2,500: 5%
 * - Above ₹2,500: 18%
 */
export function getGarmentGSTRate(unitPrice: number): number {
  return unitPrice > 2500 ? 18 : 5;
}

export interface CalculatedInvoiceItem {
  index: number;
  productId: string;
  name: string;
  size: string;
  color?: string;
  sku: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number; // MRP or selling price per unit
  mrp?: number;
  grossAmount: number; // unitPrice * qty
  discount: number; // allocated coupon or item discount
  netAmount: number; // grossAmount - discount (inclusive of tax)
  taxableValue: number; // Base price before tax = netAmount / (1 + gstRate/100)
  gstRate: number; // 5% or 18%
  is5PercentSlab: boolean;
  isIntraState: boolean;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number; // taxableValue + totalTax
}

export interface SlabBreakdown {
  rate: number;
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTax: number;
}

export interface FullInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  orderNumber: string;
  orderDate: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionId?: string;
  courierPartner?: string;
  trackingNumber?: string;
  seller: typeof STORE_SELLER_INFO;
  buyer: {
    name: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    stateCode: string;
    pincode: string;
    country: string;
  };
  placeOfSupply: string;
  placeOfSupplyCode: string;
  isIntraState: boolean;
  items: CalculatedInvoiceItem[];
  slabs: {
    fivePercent: SlabBreakdown;
    eighteenPercent: SlabBreakdown;
  };
  totals: {
    totalQuantity: number;
    grossAmount: number;
    discountAmount: number;
    taxableValue: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalTax: number;
    shippingFee: number;
    grandTotal: number;
    amountInWords: string;
  };
}

/**
 * Converts a number to words in Indian Numbering System
 * e.g., 1499 -> "Indian Rupees One Thousand Four Hundred Ninety-Nine Only"
 */
export function numberToWordsIndian(num: number): string {
  const rounded = Math.round(num);
  if (rounded === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  }

  const words = inWords(rounded).trim();
  return `Indian Rupees ${words} Only`;
}

/**
 * Calculates a complete, legally compliant GST tax invoice from an Order object
 */
export function calculateOrderInvoice(order: any): FullInvoiceData {
  const shippingState = order.shippingAddress?.state || 'Rajasthan';
  const intraState = isIntraState(shippingState, STORE_SELLER_INFO.state);
  const stateCode = getStateCode(shippingState);

  const rawItems = order.items || [];
  const totalSubtotal = order.subtotal || rawItems.reduce((acc: number, it: any) => acc + (it.price || 0) * (it.quantity || 1), 0);
  const totalDiscount = order.discountAmount || 0;

  // Calculate items with GST slabs
  const calculatedItems: CalculatedInvoiceItem[] = rawItems.map((it: any, idx: number) => {
    const qty = it.quantity || 1;
    const unitPrice = it.price || it.subtotal / qty || 0;
    const grossAmount = unitPrice * qty;

    // Allocate discount proportionally across items
    const itemDiscount = totalSubtotal > 0 ? (grossAmount / totalSubtotal) * totalDiscount : 0;
    const netAmount = Math.max(0, grossAmount - itemDiscount);

    // GST SLAB: <= 2500 is 5%, > 2500 is 18%
    const gstRate = getGarmentGSTRate(unitPrice);
    const is5Percent = gstRate === 5;

    // Compute Taxable Value (Base Price before GST)
    // Net Amount = Taxable Value * (1 + GST_Rate / 100)
    const taxableValue = netAmount / (1 + gstRate / 100);
    const totalTax = netAmount - taxableValue;

    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (intraState) {
      cgstRate = gstRate / 2; // 2.5% or 9%
      sgstRate = gstRate / 2; // 2.5% or 9%
      cgstAmount = totalTax / 2;
      sgstAmount = totalTax / 2;
    } else {
      igstRate = gstRate; // 5% or 18%
      igstAmount = totalTax;
    }

    return {
      index: idx + 1,
      productId: it.productId || it.id || `prod-${idx}`,
      name: it.productName || it.name || 'Artisanal Ethnic Kurti',
      size: it.size || 'Free Size',
      color: it.color,
      sku: it.sku || `NF-KUR-${it.size || 'M'}-${idx + 101}`,
      hsnCode: STORE_SELLER_INFO.hsnCode,
      quantity: qty,
      unitPrice,
      mrp: it.mrp || unitPrice,
      grossAmount,
      discount: itemDiscount,
      netAmount,
      taxableValue,
      gstRate,
      is5PercentSlab: is5Percent,
      isIntraState: intraState,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalTax,
      totalAmount: netAmount,
    };
  });

  // Calculate Slabs summary
  const slab5Items = calculatedItems.filter((it) => it.gstRate === 5);
  const slab18Items = calculatedItems.filter((it) => it.gstRate === 18);

  const fivePercent: SlabBreakdown = {
    rate: 5,
    taxableValue: slab5Items.reduce((acc, it) => acc + it.taxableValue, 0),
    cgstAmount: slab5Items.reduce((acc, it) => acc + it.cgstAmount, 0),
    sgstAmount: slab5Items.reduce((acc, it) => acc + it.sgstAmount, 0),
    igstAmount: slab5Items.reduce((acc, it) => acc + it.igstAmount, 0),
    totalTax: slab5Items.reduce((acc, it) => acc + it.totalTax, 0),
  };

  const eighteenPercent: SlabBreakdown = {
    rate: 18,
    taxableValue: slab18Items.reduce((acc, it) => acc + it.taxableValue, 0),
    cgstAmount: slab18Items.reduce((acc, it) => acc + it.cgstAmount, 0),
    sgstAmount: slab18Items.reduce((acc, it) => acc + it.sgstAmount, 0),
    igstAmount: slab18Items.reduce((acc, it) => acc + it.igstAmount, 0),
    totalTax: slab18Items.reduce((acc, it) => acc + it.totalTax, 0),
  };

  const totalQuantity = calculatedItems.reduce((acc, it) => acc + it.quantity, 0);
  const grossAmount = calculatedItems.reduce((acc, it) => acc + it.grossAmount, 0);
  const taxableValue = calculatedItems.reduce((acc, it) => acc + it.taxableValue, 0);
  const cgstAmount = calculatedItems.reduce((acc, it) => acc + it.cgstAmount, 0);
  const sgstAmount = calculatedItems.reduce((acc, it) => acc + it.sgstAmount, 0);
  const igstAmount = calculatedItems.reduce((acc, it) => acc + it.igstAmount, 0);
  const totalTax = calculatedItems.reduce((acc, it) => acc + it.totalTax, 0);
  const shippingFee = order.shippingFee || 0;
  const grandTotal = order.grandTotal || order.totalAmount || (taxableValue + totalTax + shippingFee);

  const invoiceNumber = order.invoiceNumber || `INV-NF-${order.orderNumber ? order.orderNumber.replace(/[^0-9]/g, '') : Date.now().toString().slice(-6)}`;
  const orderDateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return {
    invoiceNumber,
    invoiceDate: orderDateStr,
    orderNumber: order.orderNumber || order.id || 'NF-1001',
    orderDate: orderDateStr,
    paymentMethod: order.paymentMethod || 'Cash on Delivery',
    paymentStatus: order.paymentStatus || 'Pending',
    transactionId: order.razorpayPaymentId || order.transactionId,
    courierPartner: order.courierPartner || 'Delhivery Express Boutique Logistics',
    trackingNumber: order.trackingNumber || 'DEL-8921839',
    seller: STORE_SELLER_INFO,
    buyer: {
      name: order.shippingAddress?.fullName || order.shippingAddress?.name || order.customerName || 'Valued Patron',
      phone: order.shippingAddress?.phone || order.customerPhone || '+91 98765 43210',
      email: order.customerEmail || 'patron@example.com',
      addressLine1: order.shippingAddress?.addressLine1 || '',
      addressLine2: order.shippingAddress?.addressLine2,
      landmark: order.shippingAddress?.landmark,
      city: order.shippingAddress?.city || 'Jaipur',
      state: shippingState,
      stateCode,
      pincode: order.shippingAddress?.pincode || '302001',
      country: 'India',
    },
    placeOfSupply: `${shippingState} (State Code: ${stateCode})`,
    placeOfSupplyCode: stateCode,
    isIntraState: intraState,
    items: calculatedItems,
    slabs: {
      fivePercent,
      eighteenPercent,
    },
    totals: {
      totalQuantity,
      grossAmount,
      discountAmount: totalDiscount,
      taxableValue,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax,
      shippingFee,
      grandTotal,
      amountInWords: numberToWordsIndian(grandTotal),
    },
  };
}
