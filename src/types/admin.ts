export type AdminRole = 'super_admin' | 'admin' | 'inventory_manager' | 'order_manager' | 'content_manager';

export type AdminPermission = 
  | 'manage_products'
  | 'manage_categories'
  | 'manage_orders'
  | 'manage_customers'
  | 'manage_settings'
  | 'manage_cms'
  | 'manage_coupons'
  | 'manage_attributes'
  | 'manage_banners'
  | 'manage_inventory'
  | 'manage_reviews'
  | 'manage_returns'
  | 'view_analytics'
  | 'view_reports'
  | 'view_audit_logs'
  | 'manage_admins';

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: 
    | 'product_create'
    | 'product_update'
    | 'product_delete'
    | 'product_price_change' 
    | 'price_change'
    | 'stock_update' 
    | 'stock_adjust'
    | 'order_status_change' 
    | 'order_status_update'
    | 'return_status_change' 
    | 'coupon_create'
    | 'coupon_update'
    | 'coupon_change' 
    | 'refund_issued' 
    | 'settings_update' 
    | 'shipping_update'
    | 'payment_settings_update'
    | 'banner_update' 
    | 'cms_update' 
    | 'menu_update'
    | 'admin_login'
    | string;
  entityType: 'Product' | 'Order' | 'Coupon' | 'Inventory' | 'Return' | 'Settings' | 'Banner' | 'CMS' | 'Menu' | 'ShippingConfig' | 'PaymentGatewayConfig' | 'StoreBranding' | 'AdminUser' | string;
  entityId: string;
  entityName?: string;
  details: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  createdAt: string;
}

export interface SalesReportFilter {
  dateRange: 'today' | '7days' | '30days' | '7d' | '30d' | 'this_month' | 'month' | '90days' | 'year' | 'last_quarter' | 'custom' | string;
  startDate?: string;
  endDate?: string;
  category?: string;
  paymentMethod?: string;
  orderStatus?: string;
  groupBy?: 'daily' | 'weekly' | 'monthly' | string;
}

export interface DetailedSalesReport {
  summary: {
    grossRevenue: number;
    netSales: number;
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    returnedOrders: number;
    averageOrderValue: number;
    totalDiscounts: number;
    shippingCollected: number;
    taxCollected: number;
    refundsIssued: number;
    totalRevenue?: number;
    netRevenue?: number;
    totalUnitsSold?: number;
    returnRate?: number;
  };
  salesOverTime?: Array<{
    date: string;
    revenue: number;
    orders: number;
    units: number;
    aov?: number;
  }>;
  topProducts?: Array<{
    productId: string;
    title: string;
    unitsSold: number;
    revenue: number;
  }>;
  categoryBreakdown?: Array<{
    categoryId: string;
    categoryName: string;
    revenue: number;
    percentage: number;
  }>;
  productPerformance?: Array<{
    productId: string;
    productName: string;
    sku: string;
    category: string;
    image: string;
    unitsSold: number;
    grossRevenue: number;
    currentStock: number;
    returnRatePercent: number;
  }>;
  categoryPerformance?: Array<{
    category: string;
    orderCount: number;
    unitsSold: number;
    revenue: number;
    percentage: number;
  }>;
  couponUsage?: Array<{
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    timesUsed: number;
    totalDiscountGiven: number;
    revenueGenerated: number;
  }>;
  customerAcquisition?: {
    newCustomers: number;
    returningCustomers: number;
    repeatPurchaseRate: number;
    averageCustomerLifetimeValue: number;
  };
  inventoryValuation?: {
    totalSkus: number;
    totalUnitsInStock: number;
    totalCostValue: number;
    totalRetailValue: number;
    lowStockSkusCount: number;
    outOfStockSkusCount: number;
  };
  dailyTrend?: Array<{
    date: string;
    revenue: number;
    orders: number;
    units: number;
  }>;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatarUrl?: string;
  phone?: string;
  permissions: AdminPermission[];
  lastLoginAt?: string;
  createdAt: string;
  isActive: boolean;
}

export interface AdminSession {
  token: string;
  adminId: string;
  role: AdminRole;
  email: string;
  createdAt: string;
  expiresAt: string;
}

export interface AdminDashboardAnalytics {
  revenue: {
    totalRevenue: number;
    totalDiscountGiven: number;
    shippingCollected: number;
    averageOrderValue: number;
    periodGrowthPercent: number;
  };
  orders: {
    totalCount: number;
    pendingCount: number;
    packedCount: number;
    shippedCount: number;
    deliveredCount: number;
    returnRequestedCount: number;
    cancelledCount: number;
  };
  customers: {
    totalCount: number;
    newThisMonth: number;
    repeatCustomerRate: number;
  };
  inventory: {
    totalProducts: number;
    totalVariants: number;
    totalStockUnits: number;
    lowStockCount: number;
    outOfStockCount: number;
    lowStockList: Array<{
      productId: string;
      productName: string;
      sku: string;
      image: string;
      category: string;
      variantSize: string;
      variantColor: string;
      stock: number;
    }>;
  };
  bestSellers: Array<{
    productId: string;
    productName: string;
    sku: string;
    image: string;
    category: string;
    unitsSold: number;
    totalRevenue: number;
    sellingPrice: number;
  }>;
  revenueTimeline: Array<{
    date: string;
    label: string;
    revenue: number;
    orderCount: number;
  }>;
  categorySalesDistribution: Array<{
    category: string;
    unitsSold: number;
    revenue: number;
    percentage: number;
  }>;
}
