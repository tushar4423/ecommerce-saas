import { Product, Order, CartItem, OrderItem } from '../types';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

/**
 * GA4 Standard Ecommerce Analytics Engine
 * Pushes structured ecommerce telemetry events to Google Tag Manager dataLayer.
 */
class AnalyticsService {
  private logEvent(eventName: string, params: Record<string, any>) {
    if (typeof window === 'undefined') return;

    window.dataLayer = window.dataLayer || [];
    const eventPayload = {
      event: eventName,
      ecommerce: params,
      timestamp: new Date().toISOString(),
    };

    window.dataLayer.push(eventPayload);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`📊 [GA4 Ecommerce Event]: ${eventName}`, params);
    }
  }

  // 1. View Item List (Catalog / Category)
  public trackViewItemList(items: Product[], listName = 'Product Catalog') {
    this.logEvent('view_item_list', {
      item_list_name: listName,
      items: items.slice(0, 10).map((p, idx) => ({
        item_id: p.sku || p.id,
        item_name: p.name,
        price: p.sellingPrice,
        item_brand: 'Nandita Fashion',
        item_category: p.category,
        index: idx + 1,
      })),
    });
  }

  // 2. View Single Item (PDP)
  public trackViewItem(product: Product) {
    this.logEvent('view_item', {
      currency: 'INR',
      value: product.sellingPrice,
      items: [
        {
          item_id: product.sku || product.id,
          item_name: product.name,
          price: product.sellingPrice,
          item_brand: 'Nandita Fashion',
          item_category: product.category,
          item_variant: product.variants?.[0]?.color || 'Standard',
        },
      ],
    });
  }

  // 3. Search
  public trackSearch(searchTerm: string, resultsCount: number) {
    this.logEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount,
    });
  }

  // 4. Add to Wishlist
  public trackAddToWishlist(product: Product) {
    this.logEvent('add_to_wishlist', {
      currency: 'INR',
      value: product.sellingPrice,
      items: [
        {
          item_id: product.sku || product.id,
          item_name: product.name,
          price: product.sellingPrice,
          item_brand: 'Nandita Fashion',
          item_category: product.category,
        },
      ],
    });
  }

  // 5. Add to Cart
  public trackAddToCart(product: Product, size: string, color?: string, quantity = 1) {
    this.logEvent('add_to_cart', {
      currency: 'INR',
      value: product.sellingPrice * quantity,
      items: [
        {
          item_id: product.sku || product.id,
          item_name: product.name,
          price: product.sellingPrice,
          item_brand: 'Nandita Fashion',
          item_category: product.category,
          item_variant: `${size} / ${color || product.variants?.[0]?.color || 'Standard'}`,
          quantity,
        },
      ],
    });
  }

  // 6. Remove from Cart
  public trackRemoveFromCart(product: Product, size: string, quantity = 1) {
    this.logEvent('remove_from_cart', {
      currency: 'INR',
      value: product.sellingPrice * quantity,
      items: [
        {
          item_id: product.sku || product.id,
          item_name: product.name,
          price: product.sellingPrice,
          item_variant: size,
          quantity,
        },
      ],
    });
  }

  // 7. Begin Checkout
  public trackBeginCheckout(items: CartItem[], totalAmount: number, couponCode?: string) {
    this.logEvent('begin_checkout', {
      currency: 'INR',
      value: totalAmount,
      coupon: couponCode,
      items: items.map((ci) => ({
        item_id: ci.productId,
        item_name: ci.name || ci.productName || 'Handcrafted Kurti',
        price: ci.price,
        item_variant: `${ci.size} / ${ci.color || 'Standard'}`,
        quantity: ci.quantity,
      })),
    });
  }

  // 8. Add Shipping Info
  public trackAddShippingInfo(shippingTier: string, totalAmount: number, items: CartItem[]) {
    this.logEvent('add_shipping_info', {
      currency: 'INR',
      value: totalAmount,
      shipping_tier: shippingTier,
      items: items.map((ci) => ({
        item_id: ci.productId,
        item_name: ci.name || ci.productName || 'Handcrafted Kurti',
        price: ci.price,
        quantity: ci.quantity,
      })),
    });
  }

  // 9. Add Payment Info
  public trackAddPaymentInfo(paymentType: string, totalAmount: number, items: CartItem[]) {
    this.logEvent('add_payment_info', {
      currency: 'INR',
      value: totalAmount,
      payment_type: paymentType,
      items: items.map((ci) => ({
        item_id: ci.productId,
        item_name: ci.name || ci.productName || 'Handcrafted Kurti',
        price: ci.price,
        quantity: ci.quantity,
      })),
    });
  }

  // 10. Purchase Completed
  public trackPurchase(order: Order) {
    const totalVal = order.totalAmount ?? order.grandTotal ?? order.subtotal;
    this.logEvent('purchase', {
      transaction_id: order.orderNumber || order.id,
      value: totalVal,
      tax: order.taxAmount || 0,
      shipping: order.shippingFee || 0,
      currency: 'INR',
      coupon: order.couponCode,
      items: (order.items || []).map((it: OrderItem | CartItem) => ({
        item_id: it.productId,
        item_name: it.name || it.productName || 'Handcrafted Kurti',
        price: it.price,
        item_variant: `${it.size} / ${it.color || 'Standard'}`,
        quantity: it.quantity,
      })),
    });
  }

  // 11. Refund
  public trackRefund(orderId: string, refundAmount: number) {
    this.logEvent('refund', {
      transaction_id: orderId,
      value: refundAmount,
      currency: 'INR',
    });
  }
}

export const analytics = new AnalyticsService();
