import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import {
  Product,
  Category,
  HeroBanner,
  Coupon,
  Order,
  StoreBranding,
  SiteSettings,
  User,
  ProductReview,
  FilterState,
  MegaMenuItem,
  AnnouncementItem,
  HomepageSectionConfig,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_HERO_BANNERS,
  INITIAL_COUPONS,
  INITIAL_SETTINGS,
  INITIAL_CUSTOMERS,
  INITIAL_MEGA_MENU,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_HOMEPAGE_SECTIONS,
} from '../data/mockData';
import { matchProductToCategory } from '../utils/filterUtils';

export type OperationType = 'create' | 'read' | 'update' | 'delete' | 'list';

export interface FirestoreErrorInfo {
  error: string;
  operation: OperationType;
  path: string | null;
  authInfo: {
    isAuthenticated: boolean;
    userId: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operation: OperationType,
  path: string | null
): never {
  const err = error as any;
  const message = err?.message || 'Unknown Firestore error';
  const info: FirestoreErrorInfo = {
    error: message,
    operation,
    path,
    authInfo: {
      isAuthenticated: false,
      userId: null,
    },
  };
  console.error(`[Firestore Error] [${operation}] at ${path}:`, message, info);
  throw new Error(`Firestore ${operation} failed at ${path}: ${message}`);
}

// Memory / Local fallback cache keys to guarantee instant response & resilience
const CACHE_KEYS = {
  PRODUCTS: 'vedaaya_fs_products',
  CATEGORIES: 'vedaaya_fs_categories',
  BANNERS: 'vedaaya_fs_banners',
  COUPONS: 'vedaaya_fs_coupons',
  ORDERS: 'vedaaya_fs_orders',
  SETTINGS: 'vedaaya_fs_settings',
  USERS: 'vedaaya_fs_users',
  REVIEWS: 'vedaaya_fs_reviews',
  MENU: 'vedaaya_fs_mega_menu',
  ANNOUNCEMENTS: 'vedaaya_fs_announcements',
  CMS_SECTIONS: 'vedaaya_fs_cms_sections',
};


// Helper to sanitize undefined values before writing to Firestore
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
        cleaned[k] = sanitizeForFirestore(v);
      } else if (Array.isArray(v)) {
        cleaned[k] = v.map((item) =>
          item !== null && typeof item === 'object' ? sanitizeForFirestore(item) : item
        );
      } else {
        cleaned[k] = v;
      }
    }
  }
  return cleaned as T;
}

export const firestoreService = {
  // --------------------------------------------------------------------------
  // PRODUCTS
  // --------------------------------------------------------------------------
  async getProducts(filters?: FilterState): Promise<Product[]> {
    let products: Product[] = [];
    let fetchedFromCloud = false;

    try {
      const colRef = collection(db, 'products');
      const snap = await getDocs(colRef);

      if (snap.empty) {
        // First-time auto seed to cloud Firestore so catalog is never empty
        console.log('[Firestore] Products collection empty. Seeding initial catalog into Firestore...');
        await Promise.all(
          INITIAL_PRODUCTS.map((prod) => {
            const docRef = doc(db, 'products', prod.id);
            return setDoc(docRef, sanitizeForFirestore(prod));
          })
        );
        products = [...INITIAL_PRODUCTS];
      } else {
        snap.forEach((docSnap) => {
          const data = docSnap.data() as Product;
          products.push({ ...data, id: docSnap.id });
        });
      }
      fetchedFromCloud = true;
    } catch (err) {
      console.warn('[Firestore] getProducts error, falling back to local cache:', err);
    }

    // Merge with local storage cache to ensure newly created admin products are never lost
    let cachedProds: Product[] = [];
    try {
      const cached = localStorage.getItem(CACHE_KEYS.PRODUCTS);
      if (cached) {
        cachedProds = JSON.parse(cached);
      }
    } catch {}

    if (products.length === 0 && cachedProds.length === 0) {
      products = [...INITIAL_PRODUCTS];
    } else if (products.length === 0) {
      products = cachedProds;
    } else {
      // Merge by ID, prioritizing local updates for the same ID
      const prodMap = new Map<string, Product>();
      products.forEach((p) => prodMap.set(p.id, p));
      cachedProds.forEach((cp) => prodMap.set(cp.id, cp));
      products = Array.from(prodMap.values());
    }

    // Update local storage cache with the comprehensive merged list
    try {
      localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch {}

    // Filter by category or special collection if requested
    if (filters?.category && filters.category !== 'all') {
      products = products.filter((p) =>
        matchProductToCategory(p, filters.category as string, filters.subcategory, INITIAL_CATEGORIES)
      );
    }

    return products;
  },

  async getProductBySlug(slug: string): Promise<Product | null> {
    try {
      // First check by direct ID
      const docRef = doc(db, 'products', slug);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...(snap.data() as Product), id: snap.id };
      }

      // Otherwise query by slug
      const colRef = collection(db, 'products');
      const q = query(colRef, where('slug', '==', slug), limit(1));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        const first = qSnap.docs[0];
        return { ...(first.data() as Product), id: first.id };
      }

      // Check all products
      const all = await this.getProducts();
      return all.find((p) => p.slug === slug || p.id === slug) || null;
    } catch (err) {
      console.warn(`[Firestore] getProductBySlug(${slug}) error:`, err);
      const all = await this.getProducts();
      return all.find((p) => p.slug === slug || p.id === slug) || null;
    }
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const id = product.id || `prod-${Date.now()}`;
    const name = product.name?.trim() || 'New Ethnic Kurti';
    const cleanSlug =
      product.slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const mrp = Number(product.mrp) || 1999;
    const sellingPrice = Number(product.sellingPrice) || 1499;
    const discountPercent =
      mrp > sellingPrice ? Math.round(((mrp - sellingPrice) / mrp) * 100) : (product.discountPercent ?? 0);

    const sku = product.sku?.trim() || `NF-KRT-${Math.floor(100 + Math.random() * 900)}`;

    const newProduct: Product = {
      ...product,
      id,
      sku,
      name,
      slug: cleanSlug,
      category: product.category || 'Women',
      subcategory: product.subcategory || 'Kurtas & Kurtis',
      collections: product.collections || ['New Arrivals', 'Festive Edit'],
      description: product.description || '',
      mrp,
      sellingPrice,
      discountPercent,
      fabric: product.fabric || 'Pure Handloom Cotton',
      work: product.work || 'Hand-Block Floral Print',
      pattern: product.pattern || 'Printed',
      sleeve: product.sleeve || '3/4th Sleeves',
      neckType: product.neckType || product.neck || 'Mandarin Collar',
      neck: product.neck || product.neckType || 'Mandarin Collar',
      occasion: product.occasion || 'Daily & Office Wear',
      fit: product.fit || 'Regular Fit',
      length: product.length || 'Calf Length (44")',
      washCare: product.washCare || 'Gentle Machine Wash',
      dupattaIncluded: product.dupattaIncluded ?? false,
      careInstructions: product.careInstructions || ['Gentle Machine Wash', 'Dry in Shade'],
      features: product.features || ['Pure Breathable Cotton', 'Authentic Handcraft Dye'],
      images:
        product.images && product.images.length > 0
          ? product.images
          : [
              {
                id: `img-${Date.now()}`,
                url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
                altText: name,
                isPrimary: true,
              },
            ],
      variants:
        product.variants && product.variants.length > 0
          ? product.variants
          : [
              { id: `v-${Date.now()}-s`, sku: `${sku}-S`, size: 'S', color: 'Maroon', colorHex: '#7B2435', stock: 10 },
              { id: `v-${Date.now()}-m`, sku: `${sku}-M`, size: 'M', color: 'Maroon', colorHex: '#7B2435', stock: 15 },
              { id: `v-${Date.now()}-l`, sku: `${sku}-L`, size: 'L', color: 'Maroon', colorHex: '#7B2435', stock: 20 },
              { id: `v-${Date.now()}-xl`, sku: `${sku}-XL`, size: 'XL', color: 'Maroon', colorHex: '#7B2435', stock: 12 },
              { id: `v-${Date.now()}-xxl`, sku: `${sku}-XXL`, size: 'XXL', color: 'Maroon', colorHex: '#7B2435', stock: 8 },
            ],
      isNewArrival: product.isNewArrival ?? true,
      isBestseller: product.isBestseller ?? false,
      isTrending: product.isTrending ?? false,
      badge: product.badge || (product.isNewArrival ?? true ? 'New Arrival' : undefined),
      tags: product.tags || ['Ethnic', 'Kurti', 'Cotton', 'New Arrival', 'Festive'],
      rating: product.rating || 4.9,
      reviewCount: product.reviewCount || 1,
      createdAt: new Date().toISOString(),
    };

    // 1. Try persisting to Firestore
    try {
      const docRef = doc(db, 'products', id);
      await setDoc(docRef, sanitizeForFirestore(newProduct));
      console.log(`[Firestore] Product "${newProduct.name}" successfully created with ID: ${id}`);
    } catch (err) {
      console.warn(`[Firestore] Product create fallback to local cache:`, err);
    }

    // 2. Always update local storage cache for instant zero-latency UI reactivity
    try {
      const cached = localStorage.getItem(CACHE_KEYS.PRODUCTS);
      const current: Product[] = cached ? JSON.parse(cached) : INITIAL_PRODUCTS;
      const updated = [newProduct, ...current.filter((p: Product) => p.id !== id)];
      localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Local cache update error:', e);
    }

    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    let fullProduct: Product = { ...updates, id } as Product;

    // 1. Try persisting to Firestore
    try {
      const docRef = doc(db, 'products', id);
      const sanitized = sanitizeForFirestore({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(docRef, sanitized, { merge: true });
      console.log(`[Firestore] Product ${id} updated.`);

      const snap = await getDoc(docRef);
      if (snap.exists()) {
        fullProduct = { ...(snap.data() as Product), id };
      }
    } catch (err) {
      console.warn(`[Firestore] Product update fallback to local cache:`, err);
    }

    // 2. Update local storage cache
    try {
      const cached = localStorage.getItem(CACHE_KEYS.PRODUCTS);
      const current: Product[] = cached ? JSON.parse(cached) : INITIAL_PRODUCTS;
      const updated = current.map((p) => (p.id === id ? { ...p, ...fullProduct } : p));
      localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(updated));
    } catch {}

    return fullProduct;
  },

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, 'products', id);
      await deleteDoc(docRef);
      console.log(`[Firestore] Product ${id} deleted.`);
    } catch (err) {
      console.warn(`[Firestore] Product delete fallback to local cache:`, err);
    }

    try {
      const cached = localStorage.getItem(CACHE_KEYS.PRODUCTS);
      const current: Product[] = cached ? JSON.parse(cached) : INITIAL_PRODUCTS;
      const updated = current.filter((p) => p.id !== id);
      localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(updated));
    } catch {}

    return true;
  },

  // --------------------------------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------------------------------
  async getCategories(): Promise<Category[]> {
    try {
      const colRef = collection(db, 'categories');
      const snap = await getDocs(colRef);

      if (snap.empty) {
        console.log('[Firestore] Categories collection empty. Seeding initial categories...');
        await Promise.all(
          INITIAL_CATEGORIES.map((cat) => {
            const docRef = doc(db, 'categories', cat.id);
            return setDoc(docRef, sanitizeForFirestore(cat));
          })
        );
        return INITIAL_CATEGORIES;
      }

      const categories: Category[] = [];
      snap.forEach((docSnap) => {
        categories.push({ ...(docSnap.data() as Category), id: docSnap.id });
      });

      try {
        localStorage.setItem(CACHE_KEYS.CATEGORIES, JSON.stringify(categories));
      } catch {}

      return categories;
    } catch (err) {
      console.warn('[Firestore] getCategories error, using cache:', err);
      try {
        const cached = localStorage.getItem(CACHE_KEYS.CATEGORIES);
        if (cached) return JSON.parse(cached);
      } catch {}
      return INITIAL_CATEGORIES;
    }
  },

  async createCategory(cat: Partial<Category>): Promise<Category> {
    const id = cat.id || `cat-${Date.now()}`;
    const newCat: Category = {
      id,
      name: cat.name || 'New Category',
      slug:
        cat.slug ||
        (cat.name || 'new-category')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      description: cat.description || '',
      imageUrl:
        cat.imageUrl ||
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
      bannerUrl:
        cat.bannerUrl ||
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
      subcategories: cat.subcategories || ['Kurtas & Kurtis', 'Kurta Sets', 'Anarkalis', 'Sarees'],
      displayOrder: cat.displayOrder ?? 99,
      featured: cat.featured ?? true,
      subMenus: cat.subMenus || [],
    };

    try {
      const docRef = doc(db, 'categories', id);
      await setDoc(docRef, sanitizeForFirestore(newCat));
    } catch (err) {
      handleFirestoreError(err, 'create', `categories/${id}`);
    }

    try {
      const all = await this.getCategories();
      localStorage.setItem(CACHE_KEYS.CATEGORIES, JSON.stringify([...all, newCat]));
    } catch {}

    return newCat;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    try {
      const docRef = doc(db, 'categories', id);
      await setDoc(docRef, sanitizeForFirestore(updates), { merge: true });
      const snap = await getDoc(docRef);
      return snap.exists() ? ({ ...snap.data(), id } as Category) : ({ ...updates, id } as Category);
    } catch (err) {
      handleFirestoreError(err, 'update', `categories/${id}`);
    }
  },

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, 'categories', id);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      handleFirestoreError(err, 'delete', `categories/${id}`);
    }
  },

  // --------------------------------------------------------------------------
  // HERO BANNERS
  // --------------------------------------------------------------------------
  async getHeroBanners(): Promise<HeroBanner[]> {
    try {
      const colRef = collection(db, 'banners');
      const snap = await getDocs(colRef);

      if (snap.empty) {
        console.log('[Firestore] Banners collection empty. Seeding initial banners...');
        await Promise.all(
          INITIAL_HERO_BANNERS.map((b) => {
            const docRef = doc(db, 'banners', b.id);
            return setDoc(docRef, sanitizeForFirestore(b));
          })
        );
        return INITIAL_HERO_BANNERS;
      }

      const banners: HeroBanner[] = [];
      snap.forEach((docSnap) => {
        const raw = docSnap.data() as any;
        const img = raw.imageUrl || raw.desktopImage || raw.mobileImage || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=85';
        const banner: HeroBanner = {
          ...raw,
          id: docSnap.id,
          imageUrl: img,
          desktopImage: raw.desktopImage || img,
          mobileImage: raw.mobileImage || img,
          active: raw.active ?? raw.isActive ?? true,
          isActive: raw.isActive ?? raw.active ?? true,
        };
        banners.push(banner);
      });

      return banners.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    } catch (err) {
      console.warn('[Firestore] getHeroBanners error:', err);
      return INITIAL_HERO_BANNERS;
    }
  },

  async saveHeroBanner(banner: HeroBanner): Promise<HeroBanner> {
    try {
      const id = banner.id || `banner-${Date.now()}`;
      const img = banner.imageUrl || banner.desktopImage || banner.mobileImage || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=85';
      const docRef = doc(db, 'banners', id);
      const clean = sanitizeForFirestore({
        ...banner,
        id,
        imageUrl: img,
        desktopImage: banner.desktopImage || img,
        mobileImage: banner.mobileImage || img,
        active: banner.active ?? banner.isActive ?? true,
        isActive: banner.isActive ?? banner.active ?? true,
      });
      await setDoc(docRef, clean, { merge: true });
      return {
        ...banner,
        id,
        imageUrl: img,
        desktopImage: banner.desktopImage || img,
        mobileImage: banner.mobileImage || img,
        active: true,
        isActive: true,
      };
    } catch (err) {
      handleFirestoreError(err, 'update', `banners/${banner.id}`);
    }
  },

  // --------------------------------------------------------------------------
  // COUPONS
  // --------------------------------------------------------------------------
  async getCoupons(): Promise<Coupon[]> {
    try {
      const colRef = collection(db, 'coupons');
      const snap = await getDocs(colRef);

      if (snap.empty) {
        console.log('[Firestore] Coupons collection empty. Seeding initial coupons...');
        await Promise.all(
          INITIAL_COUPONS.map((c) => {
            const docRef = doc(db, 'coupons', c.id || c.code);
            return setDoc(docRef, sanitizeForFirestore(c));
          })
        );
        return INITIAL_COUPONS;
      }

      const coupons: Coupon[] = [];
      snap.forEach((docSnap) => {
        coupons.push({ ...(docSnap.data() as Coupon), id: docSnap.id });
      });

      return coupons;
    } catch (err) {
      console.warn('[Firestore] getCoupons error:', err);
      return INITIAL_COUPONS;
    }
  },

  async saveCoupon(coupon: Coupon): Promise<Coupon> {
    try {
      const id = coupon.id || coupon.code || `cpn-${Date.now()}`;
      const docRef = doc(db, 'coupons', id);
      const clean = sanitizeForFirestore({ ...coupon, id });
      await setDoc(docRef, clean, { merge: true });
      return { ...coupon, id };
    } catch (err) {
      handleFirestoreError(err, 'update', `coupons/${coupon.id}`);
    }
  },

  async deleteCoupon(id: string): Promise<boolean> {
    try {
      const docRef = doc(db, 'coupons', id);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      handleFirestoreError(err, 'delete', `coupons/${id}`);
    }
  },

  // --------------------------------------------------------------------------
  // ORDERS
  // --------------------------------------------------------------------------
  async getOrders(userId?: string, userEmail?: string): Promise<Order[]> {
    try {
      const colRef = collection(db, 'orders');
      const snap = await getDocs(colRef);

      const firestoreOrders: Order[] = [];
      snap.forEach((docSnap) => {
        firestoreOrders.push({ ...(docSnap.data() as Order), id: docSnap.id });
      });

      // Get local cached orders
      let localOrders: Order[] = [];
      try {
        const cached = localStorage.getItem(CACHE_KEYS.ORDERS);
        if (cached) localOrders = JSON.parse(cached);
      } catch {}

      // Get local placed order IDs from this browser
      let localPlacedIds: string[] = [];
      try {
        const savedIds = localStorage.getItem('nandita_placed_order_ids');
        if (savedIds) localPlacedIds = JSON.parse(savedIds);
      } catch {}

      // Merge and deduplicate by ID or orderNumber
      const orderMap = new Map<string, Order>();
      [...firestoreOrders, ...localOrders].forEach((o) => {
        if (o && (o.id || o.orderNumber)) {
          const key = o.id || o.orderNumber;
          if (!orderMap.has(key) || !orderMap.get(key)?.createdAt) {
            orderMap.set(key, o);
          }
        }
      });

      const allOrders = Array.from(orderMap.values());

      // If specific user/customer requested
      if (userId || userEmail) {
        const emailLower = userEmail?.trim().toLowerCase();
        const currentFbUid = auth?.currentUser?.uid;

        const filtered = allOrders.filter((o) => {
          // Match by userId
          if (userId && (o.userId === userId || o.userId === currentFbUid)) return true;
          // Match by customer email
          if (emailLower && o.customerEmail && o.customerEmail.toLowerCase() === emailLower) return true;
          if (emailLower && (o.shippingAddress as any)?.email && (o.shippingAddress as any).email.toLowerCase() === emailLower) return true;
          // Match by locally placed order ID in this browser session
          if (localPlacedIds.includes(o.id) || localPlacedIds.includes(o.orderNumber)) return true;
          return false;
        });

        return filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      }

      // Admin or all orders
      return allOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (err) {
      console.warn('[Firestore] getOrders error:', err);
      try {
        const cached = localStorage.getItem(CACHE_KEYS.ORDERS);
        if (cached) return JSON.parse(cached);
      } catch {}
      return [];
    }
  },

  async createOrder(orderData: any): Promise<Order> {
    const id = orderData.id || `ord-${Date.now()}`;
    const orderNumber = orderData.orderNumber || `NF-${Date.now().toString().slice(-6)}`;
    const invoiceNumber = orderData.invoiceNumber || `INV-NF-${Date.now().toString().slice(-6)}`;
    const grandTotal = Number(orderData.grandTotal ?? orderData.totalAmount ?? 0);

    const newOrder: Order = {
      id,
      orderNumber,
      invoiceNumber,
      userId: orderData.userId || auth?.currentUser?.uid || 'guest-user',
      customerName: orderData.customerName || orderData.shippingAddress?.fullName || orderData.shippingAddress?.name || 'Customer',
      customerEmail: orderData.customerEmail || (orderData.shippingAddress as any)?.email || auth?.currentUser?.email || 'customer@nanditafashion.in',
      customerPhone: orderData.customerPhone || orderData.shippingAddress?.phone || '',
      items: orderData.items || [],
      shippingAddress: orderData.shippingAddress,
      billingAddress: orderData.billingAddress || orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod || 'COD',
      paymentStatus: orderData.paymentStatus || (orderData.paymentMethod === 'COD' || orderData.paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid'),
      razorpayPaymentId: orderData.razorpayPaymentId,
      razorpayOrderId: orderData.razorpayOrderId,
      subtotal: Number(orderData.subtotal) || 0,
      discountAmount: Number(orderData.discountAmount) || 0,
      couponCode: orderData.couponCode,
      shippingFee: Number(orderData.shippingFee) || 0,
      taxAmount: Number(orderData.taxAmount) || 0,
      grandTotal,
      totalAmount: grandTotal,
      orderStatus: orderData.orderStatus || 'Confirmed',
      statusHistory: [
        {
          status: (orderData.orderStatus as any) || 'Confirmed',
          timestamp: new Date().toISOString(),
          comment: 'Order confirmed and registered in boutique dispatch queue',
        },
      ],
      createdAt: orderData.createdAt || new Date().toISOString(),
    };

    try {
      const docRef = doc(db, 'orders', id);
      await setDoc(docRef, sanitizeForFirestore(newOrder));
    } catch (err) {
      console.warn('[Firestore] createOrder error:', err);
    }

    try {
      // Record placed order ID in localStorage for persistent client tracking
      const savedIds = JSON.parse(localStorage.getItem('nandita_placed_order_ids') || '[]');
      if (!savedIds.includes(id)) {
        savedIds.push(id);
      }
      if (!savedIds.includes(orderNumber)) {
        savedIds.push(orderNumber);
      }
      localStorage.setItem('nandita_placed_order_ids', JSON.stringify(savedIds));

      // Update local cached orders list
      const cached = JSON.parse(localStorage.getItem(CACHE_KEYS.ORDERS) || '[]');
      const filtered = cached.filter((o: any) => o.id !== id && o.orderNumber !== orderNumber);
      localStorage.setItem(CACHE_KEYS.ORDERS, JSON.stringify([newOrder, ...filtered]));
    } catch {}

    return newOrder;
  },

  async updateOrderStatus(
    orderId: string,
    status: Order['orderStatus'],
    trackingNumber?: string,
    courierPartner?: string
  ): Promise<Order | null> {
    try {
      const docRef = doc(db, 'orders', orderId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;

      const current = snap.data() as Order;
      const updated: Order = {
        ...current,
        orderStatus: status,
        trackingNumber: trackingNumber || current.trackingNumber,
        courierPartner: courierPartner || current.courierPartner,
        statusHistory: [
          ...(current.statusHistory || []),
          {
            status,
            timestamp: new Date().toISOString(),
            comment: `Status updated to ${status}${trackingNumber ? ` (Tracking: ${trackingNumber})` : ''}`,
          },
        ],
      };

      await setDoc(docRef, sanitizeForFirestore(updated), { merge: true });
      return updated;
    } catch (err) {
      handleFirestoreError(err, 'update', `orders/${orderId}`);
    }
  },

  // --------------------------------------------------------------------------
  // STORE SETTINGS & BRANDING
  // --------------------------------------------------------------------------
  async getStoreBranding(): Promise<StoreBranding> {
    try {
      const docRef = doc(db, 'settings', 'branding');
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data() as StoreBranding;
        try {
          localStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(data));
        } catch {}
        return data;
      }

      // Seed initial branding
      console.log('[Firestore] Seeding default store branding settings...');
      const defaultSettings: StoreBranding = {
        storeName: 'Nandita Fashion',
        tagline: 'Ethnic & Kurti Studio',
        logoUrl: '',
        logoType: 'both',
        themeId: 'nandita-maroon',
        primaryColor: '#7B2435',
        primaryHover: '#621C2A',
        primaryLight: '#FFF0F3',
        secondaryColor: '#C98C97',
        accentColor: '#E6A4B4',
        backgroundColor: '#FAF6F0',
        headerAnnouncementText:
          'Festive Launch: Use code NANDITA20 for Flat 20% OFF | COD Available Across India',
        announcementActive: true,
        freeShippingThreshold: 999,
        supportEmail: 'care@nanditafashion.com',
        supportPhone: '+91 98765 43210',
        addressText: 'Nandita Fashion Studio, Indiranagar, Bengaluru, Karnataka 560038',
        heroBannerTitle: "The Royal Festive Weaves '26",
        heroBannerSubtitle:
          'Handcrafted pure cotton, mulmul, and chanderi kurtas styled for every celebratory moment.',
        couponPromoCode: 'NANDITA20',
        couponPromoDiscount: 'Flat 20% OFF',
      };

      await setDoc(docRef, sanitizeForFirestore(defaultSettings));
      return defaultSettings;
    } catch (err) {
      console.warn('[Firestore] getStoreBranding error:', err);
      try {
        const cached = localStorage.getItem(CACHE_KEYS.SETTINGS);
        if (cached) return JSON.parse(cached);
      } catch {}
      return {
        storeName: 'Nandita Fashion',
        tagline: 'Ethnic & Kurti Studio',
        logoUrl: '',
        logoType: 'both',
        themeId: 'nandita-maroon',
        primaryColor: '#7B2435',
        primaryHover: '#621C2A',
        primaryLight: '#FFF0F3',
        secondaryColor: '#C98C97',
        accentColor: '#E6A4B4',
        backgroundColor: '#FAF6F0',
        headerAnnouncementText:
          'Festive Launch: Use code NANDITA20 for Flat 20% OFF | COD Available Across India',
        announcementActive: true,
        freeShippingThreshold: 999,
        supportEmail: 'care@nanditafashion.com',
        supportPhone: '+91 98765 43210',
        addressText: 'Nandita Fashion Studio, Indiranagar, Bengaluru, Karnataka 560038',
        heroBannerTitle: "The Royal Festive Weaves '26",
        heroBannerSubtitle:
          'Handcrafted pure cotton, mulmul, and chanderi kurtas styled for every celebratory moment.',
        couponPromoCode: 'NANDITA20',
        couponPromoDiscount: 'Flat 20% OFF',
      };
    }
  },

  async updateStoreBranding(updates: Partial<StoreBranding>): Promise<StoreBranding> {
    try {
      const docRef = doc(db, 'settings', 'branding');
      const current = await this.getStoreBranding();
      const updated = { ...current, ...updates };
      await setDoc(docRef, sanitizeForFirestore(updated), { merge: true });

      try {
        localStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(updated));
      } catch {}

      return updated;
    } catch (err) {
      handleFirestoreError(err, 'update', 'settings/branding');
    }
  },

  // --------------------------------------------------------------------------
  // USERS & CUSTOMERS
  // --------------------------------------------------------------------------
  async getUsers(): Promise<User[]> {
    try {
      const colRef = collection(db, 'users');
      const snap = await getDocs(colRef);

      if (snap.empty) {
        console.log('[Firestore] Users collection empty. Seeding initial customers...');
        await Promise.all(
          INITIAL_CUSTOMERS.map((u) => {
            const docRef = doc(db, 'users', u.id);
            return setDoc(docRef, sanitizeForFirestore(u));
          })
        );
        return INITIAL_CUSTOMERS;
      }

      const users: User[] = [];
      snap.forEach((docSnap) => {
        users.push({ ...(docSnap.data() as User), id: docSnap.id });
      });

      return users;
    } catch (err) {
      console.warn('[Firestore] getUsers error:', err);
      return INITIAL_CUSTOMERS;
    }
  },

  async saveUser(user: User): Promise<User> {
    try {
      const id = user.id || `usr-${Date.now()}`;
      const docRef = doc(db, 'users', id);
      const clean = sanitizeForFirestore({ ...user, id });
      await setDoc(docRef, clean, { merge: true });
      return { ...user, id };
    } catch (err) {
      handleFirestoreError(err, 'update', `users/${user.id}`);
    }
  },

  // --------------------------------------------------------------------------
  // REVIEWS
  // --------------------------------------------------------------------------
  async getReviews(productId?: string): Promise<ProductReview[]> {
    try {
      const colRef = collection(db, 'reviews');
      let snap;
      if (productId) {
        const q = query(colRef, where('productId', '==', productId));
        snap = await getDocs(q);
      } else {
        snap = await getDocs(colRef);
      }

      const reviews: ProductReview[] = [];
      snap.forEach((docSnap) => {
        reviews.push({ ...(docSnap.data() as ProductReview), id: docSnap.id });
      });

      return reviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (err) {
      console.warn('[Firestore] getReviews error:', err);
      return [];
    }
  },

  async addReview(review: Omit<ProductReview, 'id' | 'createdAt' | 'helpfulCount' | 'status'>): Promise<ProductReview> {
    const id = `rev-${Date.now()}`;
    const newRev: ProductReview = {
      ...review,
      id,
      helpfulCount: 0,
      status: 'Approved',
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = doc(db, 'reviews', id);
      await setDoc(docRef, sanitizeForFirestore(newRev));
      return newRev;
    } catch (err) {
      handleFirestoreError(err, 'create', `reviews/${id}`);
    }
  },

  // --------------------------------------------------------------------------
  // MEGA MENU & NAVIGATION
  // --------------------------------------------------------------------------
  async getNavigationMenu(): Promise<MegaMenuItem[]> {
    try {
      const docRef = doc(db, 'cms', 'navigation_menu');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.items) && data.items.length > 0) {
          return data.items.sort((a: MegaMenuItem, b: MegaMenuItem) => (a.order || 0) - (b.order || 0));
        }
      }

      console.log('[Firestore] Navigation menu empty. Seeding initial mega menu...');
      await setDoc(docRef, sanitizeForFirestore({ items: INITIAL_MEGA_MENU, updatedAt: new Date().toISOString() }));
      return INITIAL_MEGA_MENU;
    } catch (err) {
      console.warn('[Firestore] getNavigationMenu error:', err);
      try {
        const cached = localStorage.getItem(CACHE_KEYS.MENU);
        if (cached) return JSON.parse(cached);
      } catch {}
      return INITIAL_MEGA_MENU;
    }
  },

  async saveNavigationMenu(items: MegaMenuItem[]): Promise<MegaMenuItem[]> {
    try {
      const docRef = doc(db, 'cms', 'navigation_menu');
      const clean = sanitizeForFirestore({ items, updatedAt: new Date().toISOString() });
      await setDoc(docRef, clean);
      try {
        localStorage.setItem(CACHE_KEYS.MENU, JSON.stringify(items));
      } catch {}
      return items;
    } catch (err) {
      handleFirestoreError(err, 'update', 'cms/navigation_menu');
    }
  },

  // --------------------------------------------------------------------------
  // ANNOUNCEMENTS
  // --------------------------------------------------------------------------
  async getAnnouncements(): Promise<AnnouncementItem[]> {
    try {
      const docRef = doc(db, 'cms', 'announcements');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.items) && data.items.length > 0) {
          return data.items.sort((a: AnnouncementItem, b: AnnouncementItem) => (a.order || 0) - (b.order || 0));
        }
      }

      console.log('[Firestore] Announcements empty. Seeding initial announcements...');
      await setDoc(docRef, sanitizeForFirestore({ items: INITIAL_ANNOUNCEMENTS, updatedAt: new Date().toISOString() }));
      return INITIAL_ANNOUNCEMENTS;
    } catch (err) {
      console.warn('[Firestore] getAnnouncements error:', err);
      try {
        const cached = localStorage.getItem(CACHE_KEYS.ANNOUNCEMENTS);
        if (cached) return JSON.parse(cached);
      } catch {}
      return INITIAL_ANNOUNCEMENTS;
    }
  },

  async saveAnnouncements(items: AnnouncementItem[]): Promise<AnnouncementItem[]> {
    try {
      const docRef = doc(db, 'cms', 'announcements');
      const clean = sanitizeForFirestore({ items, updatedAt: new Date().toISOString() });
      await setDoc(docRef, clean);
      try {
        localStorage.setItem(CACHE_KEYS.ANNOUNCEMENTS, JSON.stringify(items));
      } catch {}
      return items;
    } catch (err) {
      handleFirestoreError(err, 'update', 'cms/announcements');
    }
  },

  // --------------------------------------------------------------------------
  // HOMEPAGE CMS SECTIONS
  // --------------------------------------------------------------------------
  async getHomepageSections(): Promise<HomepageSectionConfig[]> {
    try {
      const docRef = doc(db, 'cms', 'homepage_sections');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data?.items) && data.items.length > 0) {
          return data.items.sort((a: HomepageSectionConfig, b: HomepageSectionConfig) => (a.order || 0) - (b.order || 0));
        }
      }

      console.log('[Firestore] Homepage sections empty. Seeding initial CMS...');
      await setDoc(docRef, sanitizeForFirestore({ items: INITIAL_HOMEPAGE_SECTIONS, updatedAt: new Date().toISOString() }));
      return INITIAL_HOMEPAGE_SECTIONS;
    } catch (err) {
      console.warn('[Firestore] getHomepageSections error:', err);
      try {
        const cached = localStorage.getItem(CACHE_KEYS.CMS_SECTIONS);
        if (cached) return JSON.parse(cached);
      } catch {}
      return INITIAL_HOMEPAGE_SECTIONS;
    }
  },

  async saveHomepageSections(items: HomepageSectionConfig[]): Promise<HomepageSectionConfig[]> {
    try {
      const docRef = doc(db, 'cms', 'homepage_sections');
      const clean = sanitizeForFirestore({ items, updatedAt: new Date().toISOString() });
      await setDoc(docRef, clean);
      try {
        localStorage.setItem(CACHE_KEYS.CMS_SECTIONS, JSON.stringify(items));
      } catch {}
      return items;
    } catch (err) {
      handleFirestoreError(err, 'update', 'cms/homepage_sections');
    }
  },
};

