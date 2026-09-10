import { Product } from './product';
import { UserAddress } from './customer';

export interface CartItem {
  id?: string;
  productId: string;
  name?: string;
  productName?: string;
  slug?: string;
  image?: string;
  productImage?: string;
  product?: Product;
  variantId?: string;
  sku?: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  mrp?: number;
  [key: string]: any;
}

export interface OrderItem {
  productId: string;
  name?: string;
  productName?: string;
  image?: string;
  productImage?: string;
  variantId?: string;
  sku?: string;
  size: string;
  color?: string;
  quantity: number;
  price: number;
  mrp?: number;
  subtotal?: number;
  [key: string]: any;
}

export type OrderStatus =
  | 'Pending'
  | 'Payment Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Return Requested'
  | 'Return Approved'
  | 'Return Rejected'
  | 'Returned'
  | 'Refunded';

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  comment?: string;
  updatedBy?: string;
}

export interface TrackingCheckpoint {
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

export interface TrackingInfo {
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  courierPartner: string;
  currentStatus: string;
  estimatedDeliveryDate: string;
  origin: string;
  destination: string;
  checkpoints: TrackingCheckpoint[];
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  userEmail?: string;
  items: OrderItem[] | CartItem[];
  shippingAddress: UserAddress;
  billingAddress?: UserAddress;
  paymentMethod: 'Razorpay' | 'COD' | 'Cash on Delivery' | 'UPI' | 'Card' | 'NetBanking' | string;
  paymentStatus: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  shippingFee?: number;
  taxAmount?: number;
  grandTotal?: number;
  totalAmount?: number;
  orderStatus: OrderStatus;
  statusHistory?: OrderStatusHistory[];
  trackingNumber?: string;
  courierPartner?: string;
  estimatedDeliveryDate?: string;
  invoiceNumber?: string;
  cancellationReason?: string;
  returnReason?: string;
  returnDetails?: {
    reason: string;
    description?: string;
    status: 'Requested' | 'Approved' | 'Rejected' | 'Pickup Scheduled' | 'Received' | 'Refund Initiated' | 'Refunded' | string;
    requestedAt?: string;
    customerComments?: string;
    resolutionType?: string;
    courierPartner?: string;
    trackingNumber?: string;
    refundAmount?: number;
    adminNotes?: string;
  };
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}
