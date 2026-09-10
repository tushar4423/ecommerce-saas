import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
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
  ProductAttributeGroup,
  Collection,
  SizeGroup,
  StoreColor,
  SizeGuide,
  AuditLog,
  SalesReportFilter,
  DetailedSalesReport,
  PaymentGatewayConfig,
  ShippingConfig
} from '../../types';
import { api } from '../../services/api';

export const ecommerceApi = createApi({
  reducerPath: 'ecommerceApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Product', 'Category', 'Collection', 'Banner', 'Coupon', 'Order', 'Return', 'Settings', 'Customer', 'Review', 'Menu', 'Announcement', 'CMS', 'Attribute', 'SizeGroup', 'StoreColor', 'SizeGuide', 'Wishlist', 'Cart', 'InventoryLog', 'AuditLog', 'Report', 'PaymentSettings', 'ShippingSettings'],
  endpoints: (builder) => ({

    // ----------------------------------------------------
    // PRODUCTS
    // ----------------------------------------------------
    getProducts: builder.query<Product[], FilterState | void>({
      async queryFn(filters) {
        try {
          const data = await api.getProducts(filters || undefined);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch products' } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Product' as const, id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),

    getProductBySlug: builder.query<Product | null, string>({
      async queryFn(slug) {
        try {
          const data = await api.getProductBySlug(slug);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Product not found' } };
        }
      },
      providesTags: (result, error, slug) => [{ type: 'Product', id: slug }],
    }),

    createProduct: builder.mutation<Product, Partial<Product>>({
      async queryFn(product) {
        try {
          const data = await api.createProduct(product);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to create product' } };
        }
      },
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    updateProduct: builder.mutation<Product, { id: string; updates: Partial<Product> }>({
      async queryFn({ id, updates }) {
        try {
          const data = await api.updateProduct(id, updates);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to update product' } };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    deleteProduct: builder.mutation<boolean, string>({
      async queryFn(id) {
        try {
          const data = await api.deleteProduct(id);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to delete product' } };
        }
      },
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // CATEGORIES
    // ----------------------------------------------------
    getCategories: builder.query<Category[], void>({
      async queryFn() {
        try {
          const data = await api.getCategories();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch categories' } };
        }
      },
      providesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    createCategory: builder.mutation<Category, Partial<Category>>({
      async queryFn(cat) {
        try {
          const data = await api.createCategory(cat);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to create category' } };
        }
      },
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    updateCategory: builder.mutation<Category, { id: string; updates: Partial<Category> }>({
      async queryFn({ id, updates }) {
        try {
          const data = await api.updateCategory(id, updates);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to update category' } };
        }
      },
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    deleteCategory: builder.mutation<boolean, string>({
      async queryFn(id) {
        try {
          const data = await api.deleteCategory(id);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to delete category' } };
        }
      },
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // BANNERS
    // ----------------------------------------------------
    getBanners: builder.query<HeroBanner[], void>({
      async queryFn() {
        try {
          const data = await api.getHeroBanners();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch banners' } };
        }
      },
      providesTags: [{ type: 'Banner', id: 'LIST' }],
    }),

    saveBanner: builder.mutation<HeroBanner, HeroBanner>({
      async queryFn(banner) {
        try {
          const data = await api.saveHeroBanner(banner);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to save banner' } };
        }
      },
      invalidatesTags: [{ type: 'Banner', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // COUPONS
    // ----------------------------------------------------
    getCoupons: builder.query<Coupon[], void>({
      async queryFn() {
        try {
          const data = await api.getCoupons();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch coupons' } };
        }
      },
      providesTags: [{ type: 'Coupon', id: 'LIST' }],
    }),

    saveCoupon: builder.mutation<Coupon, Coupon>({
      async queryFn(coupon) {
        try {
          const data = await api.saveCoupon(coupon);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to save coupon' } };
        }
      },
      invalidatesTags: [{ type: 'Coupon', id: 'LIST' }],
    }),

    deleteCoupon: builder.mutation<boolean, string>({
      async queryFn(id) {
        try {
          const data = await api.deleteCoupon(id);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to delete coupon' } };
        }
      },
      invalidatesTags: [{ type: 'Coupon', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // ORDERS
    // ----------------------------------------------------
    getOrders: builder.query<Order[], string | { userId?: string; userEmail?: string } | void>({
      async queryFn(params) {
        try {
          let data: Order[];
          if (typeof params === 'string') {
            data = await api.getOrders(params || undefined);
          } else if (params && typeof params === 'object') {
            data = await api.getOrders(params.userId, params.userEmail);
          } else {
            data = await api.getOrders();
          }
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch orders' } };
        }
      },
      providesTags: [{ type: 'Order', id: 'LIST' }],
    }),

    createOrder: builder.mutation<Order, any>({
      async queryFn(orderData) {
        try {
          const data = await api.createOrder(orderData);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to create order' } };
        }
      },
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),

    updateOrderStatus: builder.mutation<
      Order | null,
      { orderId: string; status: Order['orderStatus']; trackingNumber?: string; courierPartner?: string }
    >({
      async queryFn({ orderId, status, trackingNumber, courierPartner }) {
        try {
          const data = await api.updateOrderStatus(orderId, status, trackingNumber, courierPartner);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to update order status' } };
        }
      },
      invalidatesTags: [{ type: 'Order', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // SETTINGS & BRANDING
    // ----------------------------------------------------
    getSettings: builder.query<StoreBranding, void>({
      async queryFn() {
        try {
          const data = await api.getStoreBranding();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch settings' } };
        }
      },
      providesTags: [{ type: 'Settings', id: 'MAIN' }],
    }),

    updateSettings: builder.mutation<StoreBranding, Partial<StoreBranding>>({
      async queryFn(updates) {
        try {
          const data = await api.updateStoreBranding(updates);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to update settings' } };
        }
      },
      invalidatesTags: [{ type: 'Settings', id: 'MAIN' }],
    }),

    // ----------------------------------------------------
    // CUSTOMERS
    // ----------------------------------------------------
    getCustomers: builder.query<User[], void>({
      async queryFn() {
        try {
          const data = await api.getCustomers();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch customers' } };
        }
      },
      providesTags: [{ type: 'Customer', id: 'LIST' }],
    }),

    saveCustomer: builder.mutation<User, User>({
      async queryFn(customer) {
        try {
          const data = await api.saveCustomer(customer);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to save customer' } };
        }
      },
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // REVIEWS
    // ----------------------------------------------------
    getReviews: builder.query<ProductReview[], string | void>({
      async queryFn(productId) {
        try {
          const data = await api.getReviews(productId || undefined);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch reviews' } };
        }
      },
      providesTags: [{ type: 'Review', id: 'LIST' }],
    }),

    addReview: builder.mutation<ProductReview, Omit<ProductReview, 'id' | 'createdAt' | 'helpfulCount' | 'status'>>({
      async queryFn(review) {
        try {
          const data = await api.addReview(review);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to add review' } };
        }
      },
      invalidatesTags: [{ type: 'Review', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // MEGA MENU & NAVIGATION
    // ----------------------------------------------------
    getNavigationMenu: builder.query<MegaMenuItem[], void>({
      async queryFn() {
        try {
          const data = await api.getNavigationMenu();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch navigation menu' } };
        }
      },
      providesTags: [{ type: 'Menu', id: 'LIST' }],
    }),

    saveNavigationMenu: builder.mutation<MegaMenuItem[], MegaMenuItem[]>({
      async queryFn(items) {
        try {
          const data = await api.saveNavigationMenu(items);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to save navigation menu' } };
        }
      },
      invalidatesTags: [{ type: 'Menu', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // ANNOUNCEMENTS
    // ----------------------------------------------------
    getAnnouncements: builder.query<AnnouncementItem[], void>({
      async queryFn() {
        try {
          const data = await api.getAnnouncements();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch announcements' } };
        }
      },
      providesTags: [{ type: 'Announcement', id: 'LIST' }],
    }),

    saveAnnouncements: builder.mutation<AnnouncementItem[], AnnouncementItem[]>({
      async queryFn(items) {
        try {
          const data = await api.saveAnnouncements(items);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to save announcements' } };
        }
      },
      invalidatesTags: [{ type: 'Announcement', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // HOMEPAGE CMS SECTIONS
    // ----------------------------------------------------
    getHomepageSections: builder.query<HomepageSectionConfig[], void>({
      async queryFn() {
        try {
          const data = await api.getHomepageSections();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch homepage sections' } };
        }
      },
      providesTags: [{ type: 'CMS', id: 'LIST' }],
    }),

    saveHomepageSections: builder.mutation<HomepageSectionConfig[], HomepageSectionConfig[]>({
      async queryFn(items) {
        try {
          const data = await api.saveHomepageSections(items);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to save homepage sections' } };
        }
      },
      invalidatesTags: [{ type: 'CMS', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // DYNAMIC ATTRIBUTES
    // ----------------------------------------------------
    getAttributes: builder.query<ProductAttributeGroup[], void>({
      async queryFn() {
        try {
          const data = await api.getAttributes();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch attributes' } };
        }
      },
      providesTags: [{ type: 'Attribute', id: 'LIST' }],
    }),

    createAttribute: builder.mutation<ProductAttributeGroup, Partial<ProductAttributeGroup>>({
      async queryFn(attr) {
        try {
          const data = await api.createAttribute(attr);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to create attribute' } };
        }
      },
      invalidatesTags: [{ type: 'Attribute', id: 'LIST' }],
    }),

    updateAttribute: builder.mutation<ProductAttributeGroup, { id: string; updates: Partial<ProductAttributeGroup> }>({
      async queryFn({ id, updates }) {
        try {
          const data = await api.updateAttribute(id, updates);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to update attribute' } };
        }
      },
      invalidatesTags: [{ type: 'Attribute', id: 'LIST' }],
    }),

    deleteAttribute: builder.mutation<boolean, string>({
      async queryFn(id) {
        try {
          const data = await api.deleteAttribute(id);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to delete attribute' } };
        }
      },
      invalidatesTags: [{ type: 'Attribute', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // SEARCH & CATALOG
    // ----------------------------------------------------
    searchCatalog: builder.query<{
      products: Product[];
      categories: Category[];
      collections: Collection[];
      suggestions: string[];
    }, string>({
      async queryFn(query) {
        try {
          const data = await api.searchCatalog(query);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to search catalog' } };
        }
      },
    }),

    // ----------------------------------------------------
    // INVENTORY VARIANT UPDATE
    // ----------------------------------------------------
    updateVariantStock: builder.mutation<boolean, { productId: string; variantId: string; absoluteStock: number }>({
      async queryFn({ productId, variantId, absoluteStock }) {
        try {
          const data = await api.updateVariantStock(productId, variantId, absoluteStock);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to update variant stock' } };
        }
      },
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // SIZE GROUPS (Dynamic Size Management)
    // ----------------------------------------------------
    getSizeGroups: builder.query<SizeGroup[], void>({
      async queryFn() {
        try {
          const data = await api.getSizeGroups();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch size groups' } };
        }
      },
      providesTags: [{ type: 'SizeGroup', id: 'LIST' }],
    }),

    createSizeGroup: builder.mutation<SizeGroup, Partial<SizeGroup>>({
      async queryFn(group) {
        try {
          const data = await api.createSizeGroup(group);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to create size group' } };
        }
      },
      invalidatesTags: [{ type: 'SizeGroup', id: 'LIST' }],
    }),

    updateSizeGroup: builder.mutation<SizeGroup, { id: string; updates: Partial<SizeGroup> }>({
      async queryFn({ id, updates }) {
        try {
          const data = await api.updateSizeGroup(id, updates);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to update size group' } };
        }
      },
      invalidatesTags: [{ type: 'SizeGroup', id: 'LIST' }],
    }),

    deleteSizeGroup: builder.mutation<boolean, string>({
      async queryFn(id) {
        try {
          const data = await api.deleteSizeGroup(id);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to delete size group' } };
        }
      },
      invalidatesTags: [{ type: 'SizeGroup', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // STORE COLORS (Dynamic Color Management)
    // ----------------------------------------------------
    getColors: builder.query<StoreColor[], void>({
      async queryFn() {
        try {
          const data = await api.getColors();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch colors' } };
        }
      },
      providesTags: [{ type: 'StoreColor', id: 'LIST' }],
    }),

    createColor: builder.mutation<StoreColor, Partial<StoreColor>>({
      async queryFn(color) {
        try {
          const data = await api.createColor(color);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to create color' } };
        }
      },
      invalidatesTags: [{ type: 'StoreColor', id: 'LIST' }],
    }),

    updateColor: builder.mutation<StoreColor, { id: string; updates: Partial<StoreColor> }>({
      async queryFn({ id, updates }) {
        try {
          const data = await api.updateColor(id, updates);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to update color' } };
        }
      },
      invalidatesTags: [{ type: 'StoreColor', id: 'LIST' }],
    }),

    deleteColor: builder.mutation<boolean, string>({
      async queryFn(id) {
        try {
          const data = await api.deleteColor(id);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to delete color' } };
        }
      },
      invalidatesTags: [{ type: 'StoreColor', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // SIZE GUIDES (Dynamic Size Guide Management)
    // ----------------------------------------------------
    getSizeGuides: builder.query<SizeGuide[], void>({
      async queryFn() {
        try {
          const data = await api.getSizeGuides();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch size guides' } };
        }
      },
      providesTags: [{ type: 'SizeGuide', id: 'LIST' }],
    }),

    createSizeGuide: builder.mutation<SizeGuide, Partial<SizeGuide>>({
      async queryFn(guide) {
        try {
          const data = await api.createSizeGuide(guide);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to create size guide' } };
        }
      },
      invalidatesTags: [{ type: 'SizeGuide', id: 'LIST' }],
    }),

    updateSizeGuide: builder.mutation<SizeGuide, { id: string; updates: Partial<SizeGuide> }>({
      async queryFn({ id, updates }) {
        try {
          const data = await api.updateSizeGuide(id, updates);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to update size guide' } };
        }
      },
      invalidatesTags: [{ type: 'SizeGuide', id: 'LIST' }],
    }),

    deleteSizeGuide: builder.mutation<boolean, string>({
      async queryFn(id) {
        try {
          const data = await api.deleteSizeGuide(id);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to delete size guide' } };
        }
      },
      invalidatesTags: [{ type: 'SizeGuide', id: 'LIST' }],
    }),

    getSizeGuideConflicts: builder.query<{ success: boolean; totalConflicts: number; conflicts: any[] }, void>({
      async queryFn() {
        try {
          const data = await api.getSizeGuideConflicts();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch size guide conflicts' } };
        }
      },
      providesTags: [{ type: 'SizeGuide', id: 'CONFLICTS' }],
    }),

    getFitRecommendation: builder.mutation<any, any>({
      async queryFn(payload) {
        try {
          const data = await api.getFitRecommendation(payload);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to calculate fit recommendation' } };
        }
      },
    }),

    logSizeOverride: builder.mutation<boolean, any>({
      async queryFn(payload) {
        try {
          const data = await api.logSizeOverride(payload);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to log size override' } };
        }
      },
      invalidatesTags: [{ type: 'SizeGuide', id: 'OVERRIDES' }],
    }),

    getSizeOverrideAnalytics: builder.query<any[], void>({
      async queryFn() {
        try {
          const data = await api.getSizeOverrideAnalytics();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch size override analytics' } };
        }
      },
      providesTags: [{ type: 'SizeGuide', id: 'OVERRIDES' }],
    }),

    // ----------------------------------------------------
    // WISHLIST (Persistent Server-Side)
    // ----------------------------------------------------
    getWishlist: builder.query<Product[], string>({
      async queryFn(userId) {
        try {
          const data = await api.getWishlist(userId);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch wishlist' } };
        }
      },
      providesTags: (result, error, userId) => [{ type: 'Wishlist', id: userId }],
    }),

    syncWishlist: builder.mutation<Product[], { userId: string; productIds: string[]; mergeGuestIds?: string[] }>({
      async queryFn({ userId, productIds, mergeGuestIds }) {
        try {
          const data = await api.syncWishlist(userId, productIds, mergeGuestIds);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to sync wishlist' } };
        }
      },
      invalidatesTags: (result, error, { userId }) => [{ type: 'Wishlist', id: userId }],
    }),

    // ----------------------------------------------------
    // COLLECTIONS (Req 51)
    // ----------------------------------------------------
    getCollections: builder.query<Collection[], void>({
      async queryFn() {
        try {
          const data = await api.getCollections();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch collections' } };
        }
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Collection' as const, id })),
              { type: 'Collection', id: 'LIST' },
            ]
          : [{ type: 'Collection', id: 'LIST' }],
    }),

    createCollection: builder.mutation<Collection, Partial<Collection>>({
      async queryFn(collection) {
        try {
          const data = await api.createCollection(collection);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to create collection' } };
        }
      },
      invalidatesTags: [{ type: 'Collection', id: 'LIST' }],
    }),

    updateCollection: builder.mutation<Collection, { id: string; updates: Partial<Collection> }>({
      async queryFn({ id, updates }) {
        try {
          const data = await api.updateCollection(id, updates);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to update collection' } };
        }
      },
      invalidatesTags: (result, error, { id }) => [
        { type: 'Collection', id },
        { type: 'Collection', id: 'LIST' },
      ],
    }),

    deleteCollection: builder.mutation<boolean, string>({
      async queryFn(id) {
        try {
          const data = await api.deleteCollection(id);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to delete collection' } };
        }
      },
      invalidatesTags: [{ type: 'Collection', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // INVENTORY AUDIT LOGS & ADJUSTMENTS (Req 55)
    // ----------------------------------------------------
    getInventoryLogs: builder.query<any[], void>({
      async queryFn() {
        try {
          const data = await api.getInventoryLogs();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch inventory logs' } };
        }
      },
      providesTags: [{ type: 'InventoryLog', id: 'LIST' }],
    }),

    adjustVariantStock: builder.mutation<
      boolean,
      {
        productId: string;
        variantId: string;
        absoluteStock: number;
        reason?: string;
        notes?: string;
        adminEmail?: string;
        adminName?: string;
      }
    >({
      async queryFn({ productId, variantId, absoluteStock, reason, notes, adminEmail, adminName }) {
        try {
          const data = await api.updateVariantStock(productId, variantId, absoluteStock, reason, notes, adminEmail, adminName);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to adjust variant stock' } };
        }
      },
      invalidatesTags: [
        { type: 'Product', id: 'LIST' },
        { type: 'InventoryLog', id: 'LIST' },
      ],
    }),

    // ----------------------------------------------------
    // REVIEWS MODERATION (Req 59)
    // ----------------------------------------------------
    updateReviewStatus: builder.mutation<ProductReview | null, { id: string; status: 'Approved' | 'Pending' | 'Rejected' | 'Hidden' }>({
      async queryFn({ id, status }) {
        try {
          const data = await api.updateReviewStatus(id, status);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to update review status' } };
        }
      },
      invalidatesTags: [{ type: 'Review', id: 'LIST' }, { type: 'Product', id: 'LIST' }],
    }),

    deleteReview: builder.mutation<boolean, string>({
      async queryFn(id) {
        try {
          const data = await api.deleteReview(id);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to delete review' } };
        }
      },
      invalidatesTags: [{ type: 'Review', id: 'LIST' }, { type: 'Product', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // RETURNS MANAGEMENT (Req 60)
    // ----------------------------------------------------
    getReturns: builder.query<Order[], void>({
      async queryFn() {
        try {
          const data = await api.getReturns();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch returns' } };
        }
      },
      providesTags: [{ type: 'Return', id: 'LIST' }, { type: 'Order', id: 'LIST' }],
    }),

    updateReturnStatus: builder.mutation<
      { success: boolean; order?: Order },
      {
        orderId: string;
        status: string;
        notes?: string;
        trackingNumber?: string;
        courierPartner?: string;
        refundAmount?: number;
      }
    >({
      async queryFn({ orderId, ...payload }) {
        try {
          const data = await api.updateReturnStatus(orderId, payload);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to update return status' } };
        }
      },
      invalidatesTags: [
        { type: 'Return', id: 'LIST' },
        { type: 'Order', id: 'LIST' },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    // ----------------------------------------------------
    // CUSTOMER UPDATE (Req 57)
    // ----------------------------------------------------
    updateCustomer: builder.mutation<User, { id: string; updates: Partial<User> }>({
      async queryFn({ id, updates }) {
        try {
          const data = await api.updateCustomer(id, updates);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to update customer' } };
        }
      },
      invalidatesTags: [{ type: 'Customer', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // CART (Server Price/Stock Validation)
    // ----------------------------------------------------
    validateCart: builder.mutation<any, { items: any[]; couponCode?: string }>({
      async queryFn({ items, couponCode }) {
        try {
          const data = await api.validateCart(items, couponCode);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Cart validation failed' } };
        }
      },
    }),

    // ----------------------------------------------------
    // BANNER DELETION (Req 61)
    // ----------------------------------------------------
    deleteBanner: builder.mutation<boolean, string>({
      async queryFn(id) {
        try {
          const data = await api.deleteHeroBanner(id);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to delete banner' } };
        }
      },
      invalidatesTags: [{ type: 'Banner', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // AUDIT LOGS (Req 68)
    // ----------------------------------------------------
    getAuditLogs: builder.query<AuditLog[], void>({
      async queryFn() {
        try {
          const data = await api.getAuditLogs();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch audit logs' } };
        }
      },
      providesTags: [{ type: 'AuditLog', id: 'LIST' }],
    }),

    createAuditLog: builder.mutation<AuditLog, Omit<AuditLog, 'id' | 'createdAt'>>({
      async queryFn(log) {
        try {
          const data = await api.createAuditLog(log);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to record audit log' } };
        }
      },
      invalidatesTags: [{ type: 'AuditLog', id: 'LIST' }],
    }),

    // ----------------------------------------------------
    // DETAILED SALES & CMS REPORTS (Req 67)
    // ----------------------------------------------------
    getDetailedSalesReport: builder.query<DetailedSalesReport, SalesReportFilter | void>({
      async queryFn(filter) {
        try {
          const data = await api.getDetailedSalesReport(filter || undefined);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to generate sales report' } };
        }
      },
      providesTags: [{ type: 'Report', id: 'SALES' }],
    }),

    // ----------------------------------------------------
    // PAYMENT SETTINGS (Req 66)
    // ----------------------------------------------------
    getPaymentSettings: builder.query<PaymentGatewayConfig, void>({
      async queryFn() {
        try {
          const data = await api.getPaymentSettings();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch payment settings' } };
        }
      },
      providesTags: [{ type: 'PaymentSettings', id: 'CONFIG' }],
    }),

    updatePaymentSettings: builder.mutation<PaymentGatewayConfig, PaymentGatewayConfig>({
      async queryFn(config) {
        try {
          const data = await api.updatePaymentSettings(config);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to update payment settings' } };
        }
      },
      invalidatesTags: [
        { type: 'PaymentSettings', id: 'CONFIG' },
        { type: 'Settings', id: 'CONFIG' }
      ],
    }),

    // ----------------------------------------------------
    // SHIPPING SETTINGS (Req 65)
    // ----------------------------------------------------
    getShippingSettings: builder.query<ShippingConfig, void>({
      async queryFn() {
        try {
          const data = await api.getShippingSettings();
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to fetch shipping settings' } };
        }
      },
      providesTags: [{ type: 'ShippingSettings', id: 'CONFIG' }],
    }),

    updateShippingSettings: builder.mutation<ShippingConfig, ShippingConfig>({
      async queryFn(config) {
        try {
          const data = await api.updateShippingSettings(config);
          return { data };
        } catch (error: any) {
          return { error: { message: error?.message || 'Failed to update shipping settings' } };
        }
      },
      invalidatesTags: [
        { type: 'ShippingSettings', id: 'CONFIG' },
        { type: 'Settings', id: 'CONFIG' }
      ],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductBySlugQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCollectionsQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useGetBannersQuery,
  useSaveBannerMutation,
  useDeleteBannerMutation,
  useGetCouponsQuery,
  useSaveCouponMutation,
  useDeleteCouponMutation,
  useGetOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useGetCustomersQuery,
  useSaveCustomerMutation,
  useUpdateCustomerMutation,
  useGetReviewsQuery,
  useAddReviewMutation,
  useUpdateReviewStatusMutation,
  useDeleteReviewMutation,
  useGetReturnsQuery,
  useUpdateReturnStatusMutation,
  useGetInventoryLogsQuery,
  useAdjustVariantStockMutation,
  useGetNavigationMenuQuery,
  useSaveNavigationMenuMutation,
  useGetAnnouncementsQuery,
  useSaveAnnouncementsMutation,
  useGetHomepageSectionsQuery,
  useSaveHomepageSectionsMutation,
  useGetAttributesQuery,
  useCreateAttributeMutation,
  useUpdateAttributeMutation,
  useDeleteAttributeMutation,
  useSearchCatalogQuery,
  useLazySearchCatalogQuery,
  useUpdateVariantStockMutation,
  useGetSizeGroupsQuery,
  useCreateSizeGroupMutation,
  useUpdateSizeGroupMutation,
  useDeleteSizeGroupMutation,
  useGetColorsQuery,
  useCreateColorMutation,
  useUpdateColorMutation,
  useDeleteColorMutation,
  useGetSizeGuidesQuery,
  useCreateSizeGuideMutation,
  useUpdateSizeGuideMutation,
  useDeleteSizeGuideMutation,
  useGetSizeGuideConflictsQuery,
  useGetFitRecommendationMutation,
  useLogSizeOverrideMutation,
  useGetSizeOverrideAnalyticsQuery,
  useGetWishlistQuery,
  useSyncWishlistMutation,
  useValidateCartMutation,
  useGetAuditLogsQuery,
  useCreateAuditLogMutation,
  useGetDetailedSalesReportQuery,
  useGetPaymentSettingsQuery,
  useUpdatePaymentSettingsMutation,
  useGetShippingSettingsQuery,
  useUpdateShippingSettingsMutation,
} = ecommerceApi;


