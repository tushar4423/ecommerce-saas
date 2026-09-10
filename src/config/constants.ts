/**
 * Production Centralized Store Constants
 */

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL', '5XL'] as const;
export type SizeType = typeof SIZES[number];

export const FABRICS = [
  'Pure Cotton',
  'Cambric Cotton',
  'Mulmul Cotton',
  'Chanderi Silk',
  'Lucknowi Chikankari',
  'Rayon Slub',
  'Georgette',
  'Organza',
  'Silk Blend',
  'Kota Doria',
] as const;

export const OCCASIONS = [
  'Daily Wear',
  'Office & Workwear',
  'Festive',
  'Wedding & Reception',
  'Party & Evening',
  'Casual Outings',
  'Puja & Traditional',
] as const;

export const WORKS = [
  'Hand Block Print',
  'Zari Embroidery',
  'Chikankari Thread Work',
  'Gota Patti',
  'Mirror Work',
  'Digital Floral Print',
  'Sequin Detail',
  'Solid / Plain',
] as const;
export const WORK_TYPES = WORKS;

export const COLORS = [
  { name: 'Maroon', hex: '#7B2435' },
  { name: 'Pink', hex: '#E75480' },
  { name: 'Mustard', hex: '#D4AF37' },
  { name: 'Emerald', hex: '#0B6623' },
  { name: 'Navy Blue', hex: '#1B2F5C' },
  { name: 'Ivory / White', hex: '#FDFBF7' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Black', hex: '#232323' },
  { name: 'Peach', hex: '#FFE5B4' },
  { name: 'Sage Green', hex: '#87A96B' },
] as const;

export const FITS = ['Regular Fit', 'A-Line Fit', 'Straight Fit', 'Anarkali Flare', 'Relaxed Fit'] as const;

export const SLEEVES = ['3/4th Sleeve', 'Full Sleeve', 'Half Sleeve', 'Sleeveless', 'Cap Sleeve'] as const;

export const NECK_TYPES = ['Round Neck', 'V-Neck', 'Mandarin Collar', 'Sweetheart Neck', 'Keyhole Neck', 'Angrakha Neck'] as const;

export const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned',
] as const;

export const SIZE_CHART = [
  { size: 'XS', bust: 34, waist: 30, hip: 38, length: 44, shoulder: 13.5 },
  { size: 'S', bust: 36, waist: 32, hip: 40, length: 45, shoulder: 14.0 },
  { size: 'M', bust: 38, waist: 34, hip: 42, length: 45, shoulder: 14.5 },
  { size: 'L', bust: 40, waist: 36, hip: 44, length: 46, shoulder: 15.0 },
  { size: 'XL', bust: 42, waist: 38, hip: 46, length: 46, shoulder: 15.5 },
  { size: 'XXL', bust: 44, waist: 40, hip: 48, length: 47, shoulder: 16.0 },
  { size: '3XL', bust: 46, waist: 42, hip: 50, length: 47, shoulder: 16.5 },
  { size: '4XL', bust: 48, waist: 44, hip: 52, length: 48, shoulder: 17.0 },
  { size: '5XL', bust: 50, waist: 46, hip: 54, length: 48, shoulder: 17.5 },
];

export const PAYMENT_METHODS = [
  { id: 'UPI', name: 'Instant UPI (Google Pay, PhonePe, Paytm)', desc: 'Zero gateway fees, instant confirmation', badge: 'Recommended' },
  { id: 'CARD', name: 'Credit / Debit Cards', desc: 'Visa, MasterCard, RuPay & Amex supported' },
  { id: 'NETBANKING', name: 'Net Banking', desc: '50+ Indian banks supported' },
  { id: 'COD', name: 'Cash on Delivery (COD)', desc: 'Pay with cash or UPI at your doorstep' },
] as const;
