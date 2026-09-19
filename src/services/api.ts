import { 
  Product, 
  Category, 
  Collection, 
  Coupon, 
  HeroBanner, 
  Order, 
  ProductReview, 
  SiteSettings, 
  User, 
  UserAddress,
  StoreBranding,
  FilterState,
  MegaMenuItem,
  AnnouncementItem,
  HomepageSectionConfig,
  ProductAttributeGroup,
  SizeGroup,
  StoreColor,
  SizeGuide,
  SizeWidgetAppearanceSettings,
  BetweenSizeBoundaryTestCase,
  BoundaryTestExecutionResult,
  SizeGuideVersion,
  CustomerFitProfile,
  SizeFitAuditLogEntry,
  GranularSizeFitPermission,
  AuditLog,
  SalesReportFilter,
  DetailedSalesReport,
  PaymentGatewayConfig,
  ShippingConfig
} from '../types';
import { API_BASE_URL } from '../config/apiConfig';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CATEGORIES, 
  INITIAL_COLLECTIONS, 
  INITIAL_HERO_BANNERS, 
  INITIAL_COUPONS, 
  INITIAL_SETTINGS,
  INITIAL_MEGA_MENU,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_HOMEPAGE_SECTIONS,
  INITIAL_ATTRIBUTE_GROUPS,
  INITIAL_SIZE_GROUPS,
  INITIAL_STORE_COLORS,
  INITIAL_SIZE_GUIDES
} from '../data/mockData';


class BackendRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'BackendRequestError';
  }
}

function getStoredAuthToken(endpoint: string): string | null {
  if (typeof window === 'undefined') return null;

  const adminToken = window.localStorage.getItem('vedaaya_admin_token');
  if (endpoint.startsWith('/admin/')) return adminToken;

  return adminToken || window.localStorage.getItem('vedaaya_customer_token');
}

async function backendError(response: Response): Promise<BackendRequestError> {
  let message = `Backend request failed (${response.status})`;
  try {
    const payload = await response.clone().json();
    message = payload.error || payload.message || message;
  } catch {
    // The status code remains useful when an upstream proxy returns non-JSON.
  }
  return new BackendRequestError(message, response.status);
}

// Requests the configured PHP API. The local route is kept only for local development.
async function fetchFromBackend(endpoint: string, options?: RequestInit): Promise<Response | null> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const headers = new Headers(options?.headers);
  const token = getStoredAuthToken(cleanEndpoint);

  if (options?.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (API_BASE_URL && API_BASE_URL.startsWith('http')) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(`${API_BASE_URL}${cleanEndpoint}`, {
        ...options,
        signal: controller.signal,
        headers,
      });
      if (res.ok) return res;
      throw await backendError(res);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  try {
    const res = await fetch(`/api${cleanEndpoint}`, {
      ...options,
      headers,
    });
    if (res.ok) return res;
    throw await backendError(res);
  } catch (error) {
    if (error instanceof BackendRequestError) throw error;
    return null;
  }
}

export const api = {
  // Return API Base URL
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  // --------------------------------------------------------------------------
  // PRODUCTS API (Cloud-synced & Real-Time)
  // --------------------------------------------------------------------------
  async getProducts(filters?: FilterState): Promise<Product[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.set('category', filters.category);
      if (filters?.subcategory) params.set('subcategory', filters.subcategory);
      if (filters?.searchQuery) params.set('search', filters.searchQuery);
      const endpoint = params.size > 0 ? `/products?${params}` : '/products';
      const res = await fetchFromBackend(endpoint);
      if (!res) throw new Error('Catalog API is unavailable.');

      const json = await res.json();
      const items = Array.isArray(json) ? json : (json.data || json.products);
      return Array.isArray(items) ? items : [];
    } catch (error) {
      console.warn('Product API unavailable; using bundled catalog:', error);
      return INITIAL_PRODUCTS;
    }
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      const res = await fetchFromBackend(`/products/${encodeURIComponent(slug)}`);
      if (!res) throw new Error('Product API is unavailable.');
      return await res.json();
    } catch (error) {
      console.warn('Product lookup API unavailable:', error);
      const products = await this.getProducts();
      return (products || []).find((p) => p.slug === slug || p.id === slug) || null;
    }
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const res = await fetchFromBackend('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    if (!res) throw new Error('Product API is unavailable.');
    return await res.json();
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetchFromBackend(`/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!res) throw new Error('Product API is unavailable.');
    return await res.json();
  },

  async saveProduct(product: Product): Promise<Product> {
    return this.updateProduct(product.id, product);
  },

  async deleteProduct(id: string): Promise<boolean> {
    const res = await fetchFromBackend(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res) throw new Error('Product API is unavailable.');
    return true;
  },

  // --------------------------------------------------------------------------
  // CATEGORIES API
  // --------------------------------------------------------------------------
  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetchFromBackend('/categories');
      if (!res) throw new Error('Category API is unavailable.');
      const categories = await res.json();
      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      console.warn('Category API unavailable; using bundled categories:', error);
      return INITIAL_CATEGORIES;
    }
  },

  async createCategory(cat: Partial<Category>): Promise<Category> {
    const res = await fetchFromBackend('/categories', {
      method: 'POST',
      body: JSON.stringify(cat),
    });
    if (!res) throw new Error('Category API is unavailable.');
    return await res.json();
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const res = await fetchFromBackend(`/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!res) throw new Error('Category API is unavailable.');
    return await res.json();
  },

  async saveCategory(cat: Category): Promise<Category> {
    return this.updateCategory(cat.id, cat);
  },

  async deleteCategory(id: string): Promise<boolean> {
    const res = await fetchFromBackend(`/categories/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res) throw new Error('Category API is unavailable.');
    return true;
  },

  // --------------------------------------------------------------------------
  // COLLECTIONS API (Req 51)
  // --------------------------------------------------------------------------
  async getCollections(): Promise<Collection[]> {
    try {
      const res = await fetchFromBackend('/collections');
      if (res) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {}
    return INITIAL_COLLECTIONS as Collection[];
  },

  async createCollection(col: Partial<Collection>): Promise<Collection> {
    const payload = {
      ...col,
      id: col.id || `col-${Date.now()}`,
      isActive: col.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Collection;
    const res = await fetchFromBackend('/collections', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res) throw new Error('Collection API is unavailable.');
    return await res.json();
  },

  async updateCollection(id: string, updates: Partial<Collection>): Promise<Collection> {
    const res = await fetchFromBackend(`/collections/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!res) throw new Error('Collection API is unavailable.');
    return await res.json();
  },

  async deleteCollection(id: string): Promise<boolean> {
    const res = await fetchFromBackend(`/collections/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res) throw new Error('Collection API is unavailable.');
    return true;
  },

  // --------------------------------------------------------------------------
  // STORE BRANDING & SETTINGS API
  // --------------------------------------------------------------------------
  async getStoreBranding(): Promise<StoreBranding> {
    try {
      const res = await fetchFromBackend('/settings', { cache: 'no-store' });
      if (!res) throw new Error('Settings API is unavailable.');
      return await res.json();
    } catch (error) {
      console.warn('Settings API unavailable; using bundled settings:', error);
      return INITIAL_SETTINGS as any;
    }
  },

  async updateStoreBranding(updates: Partial<StoreBranding>): Promise<StoreBranding> {
    const res = await fetchFromBackend('/settings', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!res) throw new Error('Settings API is unavailable.');
    return await res.json();
  },

  // --------------------------------------------------------------------------
  // HERO BANNERS API
  // --------------------------------------------------------------------------
  async getHeroBanners(): Promise<HeroBanner[]> {
    try {
      const res = await fetchFromBackend('/banners');
      if (!res) throw new Error('Banner API is unavailable.');
      const banners = await res.json();
      return Array.isArray(banners) ? banners : [];
    } catch (error) {
      console.warn('Banner API unavailable; using bundled banners:', error);
      return INITIAL_HERO_BANNERS;
    }
  },

  async saveHeroBanner(banner: HeroBanner): Promise<HeroBanner> {
    const res = await fetchFromBackend('/banners', {
      method: 'POST',
      body: JSON.stringify(banner),
    });
    if (!res) throw new Error('Banner API is unavailable.');
    return await res.json();
  },

  async deleteHeroBanner(id: string): Promise<boolean> {
    const res = await fetchFromBackend(`/banners/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res) throw new Error('Banner API is unavailable.');
    return true;
  },

  // --------------------------------------------------------------------------
  // COUPONS API
  // --------------------------------------------------------------------------
  async getCoupons(): Promise<Coupon[]> {
    try {
      const res = await fetchFromBackend('/coupons');
      if (!res) throw new Error('Coupon API is unavailable.');
      const coupons = await res.json();
      return Array.isArray(coupons) ? coupons : [];
    } catch (error) {
      console.warn('Coupon API unavailable; using bundled coupons:', error);
      return INITIAL_COUPONS;
    }
  },

  async saveCoupon(coupon: Coupon): Promise<Coupon> {
    const res = await fetchFromBackend('/coupons', {
      method: 'POST',
      body: JSON.stringify(coupon),
    });
    if (!res) throw new Error('Coupon API is unavailable.');
    return await res.json();
  },

  async deleteCoupon(id: string): Promise<boolean> {
    const res = await fetchFromBackend(`/coupons/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res) throw new Error('Coupon API is unavailable.');
    return true;
  },

  async getSettings(): Promise<SiteSettings> {
    const branding = await this.getStoreBranding();
    return branding as any;
  },

  async validateCoupon(code: string, subtotal: number, userId?: string, items?: any[]): Promise<{ valid: boolean; discount: number; coupon?: any; message: string }> {
    try {
      const res = await fetchFromBackend('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal, userId, items }),
      });
      if (res) {
        return await res.json();
      }
    } catch {}

    const coupons = await this.getCoupons();
    const found = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && (c.active !== false && c.isActive !== false));

    if (!found) {
      return { valid: false, discount: 0, message: 'Invalid or inactive coupon code' };
    }

    const minAmount = found.minOrderAmount || found.minOrderValue || 0;
    if (subtotal < minAmount) {
      return { valid: false, discount: 0, message: `Minimum order of ₹${minAmount} required for this coupon` };
    }

    let discount = 0;
    if (found.discountType === 'percentage') {
      discount = Math.round((subtotal * found.discountValue) / 100);
      const maxDiscount = found.maxDiscountAmount || found.maxDiscount;
      if (maxDiscount && discount > maxDiscount) {
        discount = maxDiscount;
      }
    } else {
      discount = found.discountValue;
    }

    return {
      valid: true,
      discount: Math.min(discount, subtotal),
      coupon: found,
      message: `Coupon applied: ${found.title || found.code}`,
    };
  },

  // --------------------------------------------------------------------------
  // CHECKOUT & PAYMENT API (Server-Authoritative)
  // --------------------------------------------------------------------------
  async getCheckoutSummary(payload: {
    items: any[];
    couponCode?: string;
    shippingAddress?: any;
    deliveryType?: 'standard' | 'express';
    paymentMethod?: string;
  }) {
    const res = await fetchFromBackend('/checkout/summary', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res) throw new Error('Checkout API is unavailable. Please try again.');
    return await res.json();
  },

  async createRazorpayOrder(amount: number, currency = 'INR', receipt?: string, notes?: Record<string, any>) {
    const res = await fetchFromBackend('/payment/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount, currency, receipt, notes }),
    });
    if (!res) throw new Error('Payment API is unavailable. Please try again.');
    return await res.json();
  },

  async verifyRazorpayPayment(data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature?: string }) {
    const res = await fetchFromBackend('/payment/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res) throw new Error('Payment verification is unavailable. Please do not retry payment yet.');
    return await res.json();
  },

  // --------------------------------------------------------------------------
  // ORDERS API & TRACKING
  // --------------------------------------------------------------------------
  async getOrders(userId?: string, userEmail?: string): Promise<Order[]> {
    let endpoint = '/orders';
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    if (params.size > 0) endpoint += `?${params}`;

    const res = await fetchFromBackend(endpoint);
    if (!res) throw new Error('Order API is unavailable.');
    const orders = await res.json();
    return Array.isArray(orders) ? orders : [];
  },

  async getOrderById(id: string): Promise<Order | null> {
    const res = await fetchFromBackend(`/orders/${encodeURIComponent(id)}`);
    if (!res) throw new Error('Order API is unavailable.');
    return await res.json();
  },

  async trackOrder(query: string): Promise<{ success: boolean; order?: Order; error?: string }> {
    try {
      const res = await fetchFromBackend(`/orders/track/${encodeURIComponent(query)}`);
      if (!res) throw new Error('Order tracking API is unavailable.');
      return await res.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Order tracking failed.',
      };
    }
  },

  async createOrder(orderData: any): Promise<Order> {
    const res = await fetchFromBackend('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    if (!res) throw new Error('Order API is unavailable. Your order was not placed.');
    return await res.json();
  },

  async updateOrderStatus(orderId: string, status: Order['orderStatus'], trackingNumber?: string, courierPartner?: string): Promise<Order | null> {
    const res = await fetchFromBackend(`/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ orderStatus: status, trackingNumber, courierPartner }),
    });
    if (!res) throw new Error('Order API is unavailable.');
    return await res.json();
  },

  async cancelOrder(orderId: string, reason: string, comment?: string): Promise<{ success: boolean; order?: Order; message?: string; error?: string }> {
    const res = await fetchFromBackend(`/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason, comment }),
    });
    if (!res) throw new Error('Order cancellation API is unavailable.');
    return await res.json();
  },

  async requestOrderReturn(orderId: string, returnData: {
    reason: string;
    description: string;
    type: 'return' | 'exchange';
    exchangeSize?: string;
    exchangeColor?: string;
    images?: string[];
  }): Promise<{ success: boolean; order?: Order; message?: string; error?: string }> {
    const res = await fetchFromBackend(`/orders/${encodeURIComponent(orderId)}/return`, {
      method: 'POST',
      body: JSON.stringify(returnData),
    });
    if (!res) throw new Error('Return API is unavailable.');
    return await res.json();
  },

  // --------------------------------------------------------------------------
  // USERS & CUSTOMERS API
  // --------------------------------------------------------------------------
  async getUsers(): Promise<User[]> {
    const res = await fetchFromBackend('/users');
    if (!res) throw new Error('Customer API is unavailable.');
    const users = await res.json();
    return Array.isArray(users) ? users : [];
  },

  async getCustomers(): Promise<User[]> {
    return this.getUsers();
  },

  async createCoupon(coupon: Coupon): Promise<Coupon> {
    return this.saveCoupon(coupon);
  },

  async saveCustomer(user: User): Promise<User> {
    return this.saveUser(user);
  },

  async saveUser(user: User): Promise<User> {
    const res = await fetchFromBackend('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
    if (!res) throw new Error('Customer API is unavailable.');
    return await res.json();
  },

  // --------------------------------------------------------------------------
  // CUSTOMER ADDRESS API
  // --------------------------------------------------------------------------
  async getCustomerAddresses(customerId: string): Promise<UserAddress[]> {
    const res = await fetchFromBackend(`/customers/${encodeURIComponent(customerId)}/addresses`);
    if (!res) throw new Error('Address API is unavailable.');
    return await res.json();
  },

  async addCustomerAddress(customerId: string, address: Omit<UserAddress, 'id'>): Promise<UserAddress> {
    const res = await fetchFromBackend(`/customers/${encodeURIComponent(customerId)}/addresses`, {
      method: 'POST',
      body: JSON.stringify(address),
    });
    if (!res) throw new Error('Address API is unavailable.');
    return await res.json();
  },

  async updateCustomerAddress(customerId: string, addressId: string, updates: Partial<UserAddress>): Promise<UserAddress> {
    const res = await fetchFromBackend(`/customers/${encodeURIComponent(customerId)}/addresses/${encodeURIComponent(addressId)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!res) throw new Error('Address API is unavailable.');
    return await res.json();
  },

  async deleteCustomerAddress(customerId: string, addressId: string): Promise<boolean> {
    const res = await fetchFromBackend(`/customers/${encodeURIComponent(customerId)}/addresses/${encodeURIComponent(addressId)}`, {
      method: 'DELETE',
    });
    if (!res) throw new Error('Address API is unavailable.');
    return true;
  },

  async setDefaultCustomerAddress(customerId: string, addressId: string): Promise<boolean> {
    const res = await fetchFromBackend(`/customers/${encodeURIComponent(customerId)}/addresses/${encodeURIComponent(addressId)}/default`, {
      method: 'POST',
    });
    if (!res) throw new Error('Address API is unavailable.');
    return true;
  },

  // --------------------------------------------------------------------------
  // REVIEWS & RATINGS API
  // --------------------------------------------------------------------------
  async getReviews(productId?: string): Promise<ProductReview[]> {
    let endpoint = '/reviews';
    if (productId) endpoint += `?productId=${encodeURIComponent(productId)}`;
    const res = await fetchFromBackend(endpoint);
    if (!res) throw new Error('Review API is unavailable.');
    const reviews = await res.json();
    return Array.isArray(reviews) ? reviews : [];
  },

  async addReview(review: Omit<ProductReview, 'id' | 'createdAt' | 'helpfulCount' | 'status'>): Promise<ProductReview> {
    const res = await fetchFromBackend('/reviews', {
      method: 'POST',
      body: JSON.stringify(review),
    });
    if (!res) throw new Error('Review API is unavailable.');
    return await res.json();
  },

  async voteHelpfulReview(reviewId: string): Promise<number> {
    const res = await fetchFromBackend(`/reviews/${encodeURIComponent(reviewId)}/helpful`, {
      method: 'POST',
    });
    if (!res) throw new Error('Review API is unavailable.');
    const data = await res.json();
    return Number(data.helpfulCount || 0);
  },

  async updateReviewStatus(reviewId: string, status: 'Approved' | 'Pending' | 'Rejected' | 'Hidden'): Promise<ProductReview | null> {
    const res = await fetchFromBackend(`/reviews/${encodeURIComponent(reviewId)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    if (!res) throw new Error('Review API is unavailable.');
    return await res.json();
  },

  async deleteReview(reviewId: string): Promise<boolean> {
    const res = await fetchFromBackend(`/reviews/${encodeURIComponent(reviewId)}`, {
      method: 'DELETE',
    });
    if (!res) throw new Error('Review API is unavailable.');
    return true;
  },

  // --------------------------------------------------------------------------
  // MEGA MENU API
  // --------------------------------------------------------------------------
  async getNavigationMenu(): Promise<MegaMenuItem[]> {
    try {
      const res = await fetchFromBackend('/navigation-menu');
      if (!res) throw new Error('Navigation API is unavailable.');
      return await res.json();
    } catch (error) {
      console.warn('Navigation API unavailable; using bundled menu:', error);
      return INITIAL_MEGA_MENU;
    }
  },

  async saveNavigationMenu(items: MegaMenuItem[]): Promise<MegaMenuItem[]> {
    const res = await fetchFromBackend('/navigation-menu', {
      method: 'POST',
      body: JSON.stringify(items),
    });
    if (!res) throw new Error('Navigation API is unavailable.');
    return await res.json();
  },

  // --------------------------------------------------------------------------
  // ANNOUNCEMENTS API
  // --------------------------------------------------------------------------
  async getAnnouncements(): Promise<AnnouncementItem[]> {
    try {
      const res = await fetchFromBackend('/announcements');
      if (!res) throw new Error('Announcement API is unavailable.');
      return await res.json();
    } catch (error) {
      console.warn('Announcement API unavailable; using bundled announcements:', error);
      return INITIAL_ANNOUNCEMENTS;
    }
  },

  async saveAnnouncements(items: AnnouncementItem[]): Promise<AnnouncementItem[]> {
    const res = await fetchFromBackend('/announcements', {
      method: 'POST',
      body: JSON.stringify(items),
    });
    if (!res) throw new Error('Announcement API is unavailable.');
    return await res.json();
  },

  // --------------------------------------------------------------------------
  // HOMEPAGE CMS SECTIONS API
  // --------------------------------------------------------------------------
  async getHomepageSections(): Promise<HomepageSectionConfig[]> {
    try {
      const res = await fetchFromBackend('/homepage-sections');
      if (!res) throw new Error('Homepage API is unavailable.');
      return await res.json();
    } catch (error) {
      console.warn('Homepage API unavailable; using bundled sections:', error);
      return INITIAL_HOMEPAGE_SECTIONS;
    }
  },

  async saveHomepageSections(items: HomepageSectionConfig[]): Promise<HomepageSectionConfig[]> {
    const res = await fetchFromBackend('/homepage-sections', {
      method: 'POST',
      body: JSON.stringify(items),
    });
    if (!res) throw new Error('Homepage API is unavailable.');
    return await res.json();
  },

  // --------------------------------------------------------------------------
  // DYNAMIC PRODUCT ATTRIBUTES API
  // --------------------------------------------------------------------------
  async getAttributes(): Promise<ProductAttributeGroup[]> {
    try {
      const res = await fetchFromBackend('/attributes');
      if (res) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {}
    return INITIAL_ATTRIBUTE_GROUPS as ProductAttributeGroup[];
  },

  async createAttribute(attribute: Partial<ProductAttributeGroup>): Promise<ProductAttributeGroup> {
    const res = await fetchFromBackend('/attributes', {
      method: 'POST',
      body: JSON.stringify(attribute),
    });
    if (!res) throw new Error('Attribute API is unavailable.');
    return await res.json();
  },

  async updateAttribute(id: string, updates: Partial<ProductAttributeGroup>): Promise<ProductAttributeGroup> {
    const res = await fetchFromBackend(`/attributes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!res) throw new Error('Attribute API is unavailable.');
    return await res.json();
  },

  async deleteAttribute(id: string): Promise<boolean> {
    const res = await fetchFromBackend(`/attributes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!res) throw new Error('Attribute API is unavailable.');
    return true;
  },

  // --------------------------------------------------------------------------
  // LIVE SEARCH & SUGGESTIONS API
  // --------------------------------------------------------------------------
  async searchCatalog(query: string): Promise<{
    products: Product[];
    categories: Category[];
    collections: Collection[];
    suggestions: string[];
  }> {
    try {
      const res = await fetchFromBackend(`/search?q=${encodeURIComponent(query)}`);
      if (res) {
        return await res.json();
      }
    } catch {}

    // Fallback in-memory search
    const q = query.toLowerCase().trim();
    const products = (await this.getProducts()).filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.fabric?.toLowerCase().includes(q) ||
      p.work?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
    const categories = (await this.getCategories()).filter(c =>
      c.name.toLowerCase().includes(q)
    );
    const collections = (await this.getCollections()).filter(col =>
      col.name.toLowerCase().includes(q)
    );

    return {
      products: products.slice(0, 12),
      categories: categories.slice(0, 4),
      collections: collections.slice(0, 3),
      suggestions: ['Cotton Kurtis', 'Anarkali Sets', 'Chikankari Kurta', 'Festive Collection'].filter(s => s.toLowerCase().includes(q))
    };
  },

  // --------------------------------------------------------------------------
  // VARIANT INVENTORY STOCK & AUDIT LOGS API (Req 55)
  // --------------------------------------------------------------------------
  async getInventoryLogs(): Promise<any[]> {
    try {
      const res = await fetchFromBackend('/inventory/logs');
      if (res) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {}
    return [];
  },

  async updateVariantStock(
    productId: string, 
    variantId: string, 
    absoluteStock: number,
    reason?: string,
    notes?: string,
    adminEmail?: string,
    adminName?: string
  ): Promise<boolean> {
    const res = await fetchFromBackend('/inventory/update-variant', {
      method: 'POST',
      body: JSON.stringify({ productId, variantId, absoluteStock, reason, notes, adminEmail, adminName })
    });
    if (!res) throw new Error('Inventory API is unavailable.');
    return true;
  },

  // --------------------------------------------------------------------------
  // RETURNS & EXCHANGES MANAGEMENT API (Req 60)
  // --------------------------------------------------------------------------
  async getReturns(): Promise<Order[]> {
    try {
      const res = await fetchFromBackend('/returns');
      if (res) {
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    } catch {}
    const orders = await this.getOrders();
    return orders.filter(o => o.returnDetails || ['Return Requested', 'Return Approved', 'Return Rejected', 'Pickup Scheduled', 'Received', 'Refund Initiated', 'Refunded'].includes(o.orderStatus));
  },

  async updateReturnStatus(orderId: string, payload: {
    status: string;
    notes?: string;
    trackingNumber?: string;
    courierPartner?: string;
    refundAmount?: number;
  }): Promise<{ success: boolean; order?: Order }> {
    const res = await fetchFromBackend(`/returns/${encodeURIComponent(orderId)}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!res) throw new Error('Returns API is unavailable.');
    return await res.json();
  },

  // --------------------------------------------------------------------------
  // SIZE GROUPS API (Dynamic Size Management)
  // --------------------------------------------------------------------------
  async getSizeGroups(): Promise<SizeGroup[]> {
    try {
      const res = await fetchFromBackend('/size-groups');
      if (res) return await res.json();
    } catch {}
    return INITIAL_SIZE_GROUPS;
  },

  async createSizeGroup(group: Partial<SizeGroup>): Promise<SizeGroup> {
    const payload = {
      ...group,
      id: group.id || `sg-${Date.now()}`,
      isActive: group.isActive ?? true,
    } as SizeGroup;
    const res = await fetchFromBackend('/size-groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res) throw new Error('Size-group API is unavailable.');
    return await res.json();
  },

  async updateSizeGroup(id: string, updates: Partial<SizeGroup>): Promise<SizeGroup> {
    const res = await fetchFromBackend(`/size-groups/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!res) throw new Error('Size-group API is unavailable.');
    return await res.json();
  },

  async deleteSizeGroup(id: string): Promise<boolean> {
    const res = await fetchFromBackend(`/size-groups/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res) throw new Error('Size-group API is unavailable.');
    return true;
  },

  // --------------------------------------------------------------------------
  // STORE COLORS API (Dynamic Color Management)
  // --------------------------------------------------------------------------
  async getColors(): Promise<StoreColor[]> {
    try {
      const res = await fetchFromBackend('/colors');
      if (res) return await res.json();
    } catch {}
    return INITIAL_STORE_COLORS;
  },

  async createColor(color: Partial<StoreColor>): Promise<StoreColor> {
    const payload = {
      ...color,
      id: color.id || `col-${Date.now()}`,
      isActive: color.isActive ?? true,
    } as StoreColor;
    const res = await fetchFromBackend('/colors', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res) throw new Error('Color API is unavailable.');
    return await res.json();
  },

  async updateColor(id: string, updates: Partial<StoreColor>): Promise<StoreColor> {
    const res = await fetchFromBackend(`/colors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!res) throw new Error('Color API is unavailable.');
    return await res.json();
  },

  async deleteColor(id: string): Promise<boolean> {
    const res = await fetchFromBackend(`/colors/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res) throw new Error('Color API is unavailable.');
    return true;
  },

  // --------------------------------------------------------------------------
  // SIZE GUIDES & SMART FIT API (Dynamic Size Guide Management, Privacy & Boundary Testing)
  // --------------------------------------------------------------------------
  async getSizeGuides(): Promise<SizeGuide[]> {
    try {
      const res = await fetchFromBackend('/size-guides');
      if (res) return await res.json();
    } catch {}
    return INITIAL_SIZE_GUIDES;
  },

  async getSizeGuideConflicts(): Promise<{ success: boolean; totalConflicts: number; conflicts: any[] }> {
    const res = await fetchFromBackend('/size-guides/conflicts');
    if (!res) throw new Error('Size-guide API is unavailable.');
    return await res.json();
  },

  async getWidgetSettings(): Promise<SizeWidgetAppearanceSettings> {
    try {
      const res = await fetchFromBackend('/size-guides/widget-settings');
      if (res) return await res.json();
    } catch {}
    return {
      buttonText: 'Smart Size & Fit Assistant',
      buttonColorStyle: 'primary_crimson',
      placement: 'above_size_selector',
      layoutMode: 'modal',
      mobileBehavior: 'bottom_sheet',
      defaultUnit: 'inches',
      showConfidenceScores: true,
      showOutOfStockTradeOffs: true,
      enableGuestStorage: true,
      requireExplicitConsent: true,
    };
  },

  async updateWidgetSettings(settings: Partial<SizeWidgetAppearanceSettings>): Promise<SizeWidgetAppearanceSettings> {
    const res = await fetchFromBackend('/size-guides/widget-settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
    if (!res) throw new Error('Size widget API is unavailable.');
    const data = await res.json();
    return data.settings;
  },

  async getFitRecommendation(payload: any): Promise<any> {
    const res = await fetchFromBackend('/size-guides/recommend', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res) throw new Error('Fit recommendation API is unavailable.');
    return await res.json();
  },

  async getBoundaryTestSuite(): Promise<BetweenSizeBoundaryTestCase[]> {
    try {
      const res = await fetchFromBackend('/size-guides/boundary-test-suite');
      if (res) return await res.json();
    } catch {}
    return [];
  },

  async runBoundaryTests(testCases?: BetweenSizeBoundaryTestCase[]): Promise<{
    success: boolean;
    totalTests: number;
    passedCount: number;
    failedCount: number;
    passRate: number;
    results: BoundaryTestExecutionResult[];
  }> {
    const res = await fetchFromBackend('/size-guides/test-boundaries', {
      method: 'POST',
      body: JSON.stringify({ testCases }),
    });
    if (!res) throw new Error('Size boundary-test API is unavailable.');
    return await res.json();
  },

  async getSizeGuideVersions(id: string): Promise<SizeGuideVersion[]> {
    try {
      const res = await fetchFromBackend(`/size-guides/${id}/versions`);
      if (res) {
        const data = await res.json();
        return data.versions || [];
      }
    } catch {}
    return [];
  },

  async rollbackSizeGuideVersion(id: string, targetVersion: number, adminId?: string, adminName?: string): Promise<SizeGuide | null> {
    const res = await fetchFromBackend(`/size-guides/${encodeURIComponent(id)}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ targetVersion, adminId, adminName }),
    });
    if (!res) throw new Error('Size-guide API is unavailable.');
    const data = await res.json();
    return data.restoredGuide || null;
  },

  async getCustomerFitProfile(userId: string): Promise<CustomerFitProfile | null> {
    try {
      const res = await fetchFromBackend(`/fit-profiles/${userId}`);
      if (res && res.ok) {
        const data = await res.json();
        return data.profile || null;
      }
    } catch {}
    return null;
  },

  async saveCustomerFitProfile(profile: Partial<CustomerFitProfile>): Promise<CustomerFitProfile> {
    const res = await fetchFromBackend('/fit-profiles', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
    if (!res) throw new Error('Fit profile API is unavailable.');
    const data = await res.json();
    return data.profile;
  },

  async deleteCustomerFitProfile(userId: string): Promise<boolean> {
    const res = await fetchFromBackend(`/fit-profiles/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    if (!res) throw new Error('Fit profile API is unavailable.');
    return true;
  },

  async exportCustomerFitProfile(userId: string): Promise<any> {
    try {
      const res = await fetchFromBackend(`/fit-profiles/${userId}/export`);
      if (res) return await res.json();
    } catch {}
    return null;
  },

  async getSizeFitAuditLogs(): Promise<SizeFitAuditLogEntry[]> {
    try {
      const res = await fetchFromBackend('/size-guides/audit-logs');
      if (res) return await res.json();
    } catch {}
    return [];
  },

  async getSizeFitPermissions(): Promise<GranularSizeFitPermission[]> {
    try {
      const res = await fetchFromBackend('/size-guides/permissions');
      if (res) {
        const data = await res.json();
        return data.permissions || [];
      }
    } catch {}
    return [];
  },

  async logSizeOverride(payload: any): Promise<boolean> {
    const res = await fetchFromBackend('/size-guides/analytics/override', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res) throw new Error('Size analytics API is unavailable.');
    return true;
  },

  async getSizeOverrideAnalytics(): Promise<any[]> {
    try {
      const res = await fetchFromBackend('/size-guides/analytics/overrides');
      if (res) return await res.json();
    } catch {}
    return [];
  },

  async createSizeGuide(guide: Partial<SizeGuide>): Promise<SizeGuide> {
    const payload = {
      ...guide,
      id: guide.id || `sg-guide-${Date.now()}`,
      isActive: guide.isActive ?? true,
    } as SizeGuide;
    const res = await fetchFromBackend('/size-guides', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res) throw new Error('Size-guide API is unavailable.');
    return await res.json();
  },

  async updateSizeGuide(id: string, updates: Partial<SizeGuide>): Promise<SizeGuide> {
    const res = await fetchFromBackend(`/size-guides/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!res) throw new Error('Size-guide API is unavailable.');
    return await res.json();
  },

  async deleteSizeGuide(id: string): Promise<boolean> {
    const res = await fetchFromBackend(`/size-guides/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res) throw new Error('Size-guide API is unavailable.');
    return true;
  },

  // --------------------------------------------------------------------------
  // PRODUCT MEDIA UPLOAD API
  // --------------------------------------------------------------------------
  async uploadMedia(fileData: string, fileName?: string, altText?: string): Promise<{
    id: string;
    url: string;
    fileName: string;
    altText: string;
  }> {
    const res = await fetchFromBackend('/media/upload', {
      method: 'POST',
      body: JSON.stringify({ fileData, fileName, altText }),
    });
    if (!res) throw new Error('Media API is unavailable.');
    return await res.json();
  },

  // --------------------------------------------------------------------------
  // PERSISTENT WISHLIST API
  // --------------------------------------------------------------------------
  async getWishlist(userId: string): Promise<Product[]> {
    try {
      const res = await fetchFromBackend(`/wishlist/${userId}`);
      if (res) return await res.json();
    } catch {}
    return [];
  },

  async syncWishlist(userId: string, productIds: string[], mergeGuestIds?: string[]): Promise<Product[]> {
    const res = await fetchFromBackend(`/wishlist/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify({ productIds, mergeGuestIds }),
    });
    if (!res) throw new Error('Wishlist API is unavailable.');
    const json = await res.json();
    return json.wishlist || [];
  },

  // --------------------------------------------------------------------------
  // SERVER CART & PRICE/STOCK VALIDATION API
  // --------------------------------------------------------------------------
  async getServerCart(userId: string): Promise<any[]> {
    try {
      const res = await fetchFromBackend(`/cart/${userId}`);
      if (res) return await res.json();
    } catch {}
    return [];
  },

  async syncServerCart(userId: string, items: any[], mergeGuestItems?: any[]): Promise<any[]> {
    const res = await fetchFromBackend(`/cart/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify({ items, mergeGuestItems }),
    });
    if (!res) throw new Error('Cart API is unavailable.');
    const json = await res.json();
    return json.items || [];
  },

  async validateCart(items: any[], couponCode?: string): Promise<{
    valid: boolean;
    items: any[];
    subtotal: number;
    totalMrp: number;
    discountAmount: number;
    appliedCoupon: string | null;
    shippingFee: number;
    isFreeShipping: boolean;
    freeShippingThreshold: number;
    grandTotal: number;
    priceChangedWarnings: string[];
    stockWarnings: string[];
  }> {
    const res = await fetchFromBackend('/cart/validate', {
      method: 'POST',
      body: JSON.stringify({ items, couponCode }),
    });
    if (!res) throw new Error('Cart validation API is unavailable.');
    return await res.json();
  },

  // --------------------------------------------------------------------------
  // GOOGLE IDENTITY SERVICES BACKEND AUTH
  // --------------------------------------------------------------------------
  async verifyGoogleToken(payload: { credential?: string; token?: string; profile?: any; email?: string; name?: string; picture?: string }): Promise<{
    success: boolean;
    user: User;
    token?: string;
  }> {
    const res = await fetchFromBackend('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res) throw new Error('Google sign-in verification is unavailable.');
    return await res.json();
  },

  // --------------------------------------------------------------------------
  // RELATED & RECOMMENDED PRODUCTS (Req 42)
  // --------------------------------------------------------------------------
  async getRelatedProducts(productId: string): Promise<Product[]> {
    try {
      const res = await fetchFromBackend(`/products/${productId}/related`);
      if (res) {
        const json = await res.json();
        if (Array.isArray(json) && json.length > 0) return json;
      }
    } catch {}

    // Fallback: category + fabric + work matching
    const all = await this.getProducts();
    const current = all.find(p => p.id === productId || p.slug === productId);
    if (!current) return all.slice(0, 4);

    return all
      .filter(p => p.id !== current.id)
      .sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;
        if (a.category === current.category) scoreA += 20;
        if (b.category === current.category) scoreB += 20;
        if (a.subcategory && a.subcategory === current.subcategory) scoreA += 15;
        if (b.subcategory && b.subcategory === current.subcategory) scoreB += 15;
        if (a.fabric && a.fabric === current.fabric) scoreA += 10;
        if (b.fabric && b.fabric === current.fabric) scoreB += 10;
        return scoreB - scoreA;
      })
      .slice(0, 8);
  },

  // --------------------------------------------------------------------------
  // RECENTLY VIEWED PRODUCTS (Req 41)
  // --------------------------------------------------------------------------
  async getRecentlyViewed(userId?: string): Promise<Product[]> {
    const localKey = 'vedaaya_recently_viewed_ids';
    let localIds: string[] = [];
    try {
      const saved = localStorage.getItem(localKey);
      if (saved) localIds = JSON.parse(saved);
    } catch {}

    if (userId) {
      try {
        const res = await fetchFromBackend(`/recently-viewed/${userId}`);
        if (res) {
          const products = await res.json();
          if (Array.isArray(products) && products.length > 0) return products;
        }
      } catch {}
    }

    if (localIds.length > 0) {
      const all = await this.getProducts();
      return localIds
        .map(id => all.find(p => p.id === id))
        .filter(Boolean) as Product[];
    }

    return [];
  },

  async recordRecentlyViewed(productId: string, userId?: string): Promise<void> {
    const localKey = 'vedaaya_recently_viewed_ids';
    try {
      const saved = localStorage.getItem(localKey);
      let list: string[] = saved ? JSON.parse(saved) : [];
      list = [productId, ...list.filter(id => id !== productId)].slice(0, 24);
      localStorage.setItem(localKey, JSON.stringify(list));

      if (userId) {
        await fetchFromBackend(`/recently-viewed/${userId}`, {
          method: 'POST',
          body: JSON.stringify({ productId, mergeIds: list }),
        });
      }
    } catch {}
  },

  // --------------------------------------------------------------------------
  // CATEGORY REORDERING (Req 50)
  // --------------------------------------------------------------------------
  async reorderCategories(orderedIds: string[]): Promise<Category[]> {
    const res = await fetchFromBackend('/categories/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    });
    if (!res) throw new Error('Category API is unavailable.');
    const json = await res.json();
    return json.categories || [];
  },

  // --------------------------------------------------------------------------
  // ADMIN AUTHENTICATION & ANALYTICS (Req 43, 44, 45)
  // --------------------------------------------------------------------------
  async adminLogin(email: string, password?: string, googleToken?: string) {
    try {
      const res = await fetchFromBackend('/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, googleToken }),
      });
      if (res) {
        return await res.json();
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Admin login endpoint unavailable',
      };
    }
    return { success: false, error: 'Admin login endpoint unavailable' };
  },

  async adminGetMe(token?: string): Promise<{ authenticated: boolean; user?: any; error?: string; isNetworkError?: boolean }> {
    const activeToken = token || (typeof window !== 'undefined' ? window.localStorage.getItem('vedaaya_admin_token') : null);
    if (!activeToken) return { authenticated: false };

    try {
      const res = await fetchFromBackend('/admin/auth/me', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });
      if (res) {
        return await res.json();
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        return { authenticated: false, error: 'Session expired' };
      }
      // Return authenticated with network error flag so valid token is not wiped out on transient network glitches
      return { authenticated: true, isNetworkError: true };
    }
    return { authenticated: false };
  },

  async updateAdminProfile(updates: Partial<User>): Promise<User> {
    const res = await fetchFromBackend('/admin/auth/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!res) throw new Error('Administrator profile API is unavailable.');
    return await res.json();
  },

  async adminLogout(token?: string) {
    const activeToken = token || localStorage.getItem('vedaaya_admin_token');
    if (activeToken) {
      try {
        await fetchFromBackend('/admin/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        });
      } catch {}
    }
  },

  async getAdminDashboardAnalytics(): Promise<any> {
    const token = localStorage.getItem('vedaaya_admin_token');
    if (!token) return null;
    try {
      const res = await fetchFromBackend('/admin/analytics/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Failed to fetch admin analytics:', e);
    }
    return null;
  },

  async updateCustomer(id: string, updates: Partial<User>): Promise<User> {
    const res = await fetchFromBackend(`/customers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!res) throw new Error('Customer API is unavailable.');
    return await res.json();
  },

  async updateMyProfile(updates: Partial<User>): Promise<User> {
    const res = await fetchFromBackend('/users/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    if (!res) throw new Error('Profile API is unavailable.');
    return await res.json();
  },

  // --------------------------------------------------------------------------
  // AUDIT LOGS API (Req 68)
  // --------------------------------------------------------------------------
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetchFromBackend('/admin/audit-logs');
    if (!res) throw new Error('Audit-log API is unavailable.');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const res = await fetchFromBackend('/admin/audit-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
    if (!res) throw new Error('Audit-log API is unavailable.');
    return await res.json();
  },

  // --------------------------------------------------------------------------
  // DETAILED SALES & PERFORMANCE REPORTS API (Req 67)
  // --------------------------------------------------------------------------
  async getDetailedSalesReport(filter?: SalesReportFilter): Promise<DetailedSalesReport> {
    const res = await fetchFromBackend('/admin/reports/sales', {
      method: 'POST',
      body: JSON.stringify(filter || { dateRange: '30d' }),
    });
    if (!res) throw new Error('Sales-report API is unavailable.');
    return await res.json();
  },

  // --------------------------------------------------------------------------
  // PAYMENT & SHIPPING SETTINGS APIS (Req 65, 66)
  // --------------------------------------------------------------------------
  async getPaymentSettings(): Promise<PaymentGatewayConfig> {
    try {
      const res = await fetchFromBackend('/settings/payment');
      if (res) return await res.json();
    } catch {}

    const settings = await this.getSettings();
    return settings.paymentConfig || {
      razorpayEnabled: false,
      razorpayKeyId: '',
      isRazorpayTestMode: false,
      codEnabled: true,
      upiDirectEnabled: false,
      cardsEnabled: false,
      netBankingEnabled: false,
      walletsEnabled: false,
      webhookUrl: '',
      activeGateway: 'cod',
    };
  },

  async updatePaymentSettings(config: PaymentGatewayConfig): Promise<PaymentGatewayConfig> {
    const res = await fetchFromBackend('/settings/payment', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
    if (!res) throw new Error('Payment settings API is unavailable.');
    return await res.json();
  },

  async getShippingSettings(): Promise<ShippingConfig> {
    try {
      const res = await fetchFromBackend('/settings/shipping');
      if (res) return await res.json();
    } catch {}

    const settings = await this.getSettings();
    return settings.shippingConfig || {
      freeShippingThreshold: 999,
      standardShippingFee: 99,
      expressShippingFee: 199,
      codAvailable: true,
      codFee: 49,
      minCodOrderValue: 499,
      maxCodOrderValue: 15000,
      pincodeRuleMode: 'all_india',
      deliveryProviders: [
        { id: 'delhivery', name: 'Delhivery Surface & Air Express', isEnabled: true, isDefault: true, isReversePickup: true, estimatedDays: '2 - 4 business days', trackingUrlPrefix: 'https://www.delhivery.com/track/package/' },
        { id: 'bluedart', name: 'Blue Dart Apex Express', isEnabled: true, isDefault: false, isReversePickup: false, estimatedDays: '1 - 3 business days', trackingUrlPrefix: 'https://www.bluedart.com/tracking/' },
        { id: 'shiprocket', name: 'Shiprocket Multi-Carrier Hub', isEnabled: true, isDefault: false, isReversePickup: true, estimatedDays: '2 - 5 business days', trackingUrlPrefix: 'https://shiprocket.co/tracking/' },
        { id: 'shadowfax', name: 'Shadowfax Hyperlocal', isEnabled: false, isDefault: false, isReversePickup: false, estimatedDays: 'Same / Next day', trackingUrlPrefix: '' },
      ],
      serviceablePincodes: ['110001', '400001', '560001', '302001', '700001', '600001', '500001', '380001'],
      blockedCodPincodes: ['790001', '795001'],
    };
  },

  async updateShippingSettings(config: ShippingConfig): Promise<ShippingConfig> {
    const res = await fetchFromBackend('/settings/shipping', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
    if (!res) throw new Error('Shipping settings API is unavailable.');
    return await res.json();
  },
};
