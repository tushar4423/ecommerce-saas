import React, { useEffect, useRef, useState } from 'react';
import { useGetProductsQuery, useGetOrdersQuery, useGetCategoriesQuery } from '../store/api/ecommerceApi';
import { AdminAuthProvider, useAdminAuth } from './auth/AdminAuthContext';
import { AdminLoginPage } from './auth/AdminLoginPage';
import { AdminHeader } from './layout/AdminHeader';
import { AdminSidebar, AdminSection } from './layout/AdminSidebar';
import { AdminDashboardOverview } from './dashboard/AdminDashboardOverview';
import { ProductList } from './products/ProductList';
import { OrdersManager } from './orders/OrdersManager';
import { CategoryManager } from './categories/CategoryManager';
import { BannerManager } from './banners/BannerManager';
import { CouponManager } from './coupons/CouponManager';
import { CustomerManager } from './customers/CustomerManager';
import { StoreBrandingSettings } from './settings/StoreBrandingSettings';
import { ShippingSettingsManager } from './shipping/ShippingSettingsManager';
import { PaymentSettingsManager } from './payments/PaymentSettingsManager';
import { DetailedSalesReportManager } from './reports/DetailedSalesReportManager';
import { AuditLogsManager } from './audit/AuditLogsManager';
import { AnnouncementsManager, MegaMenuManager, HomepageCMSManager } from './cms';
import { AttributeManager } from './attributes/AttributeManager';
import { SizeGroupManager } from './sizes/SizeGroupManager';
import { ColorCatalogManager } from './colors/ColorCatalogManager';
import { SizeGuideManager } from './sizeguides/SizeGuideManager';
import { CollectionManager } from './collections/CollectionManager';
import { InventoryManager } from './inventory/InventoryManager';
import { ReviewModerator } from './reviews/ReviewModerator';
import { ReturnManager } from './returns/ReturnManager';
import { GiniAdminPlugin } from './gini/GiniAdminPlugin';
import { Product } from '../types';

export interface AdminDashboardProps {
  onReturnToStore: () => void;
  onViewProductOnStore?: (product: Product) => void;
}

const AdminDashboardInner: React.FC<AdminDashboardProps> = ({
  onReturnToStore,
  onViewProductOnStore,
}) => {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const handleSelectSection = (section: AdminSection) => {
    setActiveSection(section);
    setMobileSidebarOpen(false);
    if (mainRef.current) mainRef.current.scrollTop = 0;
  };

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileSidebarOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileSidebarOpen]);

  const { data: products = [], refetch: refetchProducts } = useGetProductsQuery();
  const { data: orders = [], refetch: refetchOrders } = useGetOrdersQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: categories = [], refetch: refetchCategories } = useGetCategoriesQuery();

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchProducts(), refetchOrders(), refetchCategories()]);
    } catch {}
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[#7B2435] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-neutral-600">Verifying Admin Access Credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginPage onCancel={onReturnToStore} />;
  }

  const pendingOrders = orders.filter((o) => o.orderStatus === 'Pending' || o.orderStatus === 'Processing');

  return (
    <div className="h-screen h-dvh overflow-hidden bg-[#FAF6F0] text-neutral-900 flex flex-col">
      {/* Top Header */}
      <AdminHeader
        onReturnToStore={onReturnToStore}
        onRefreshData={handleRefreshData}
        isRefreshing={isRefreshing}
        onOpenMobileSidebar={() => {
          setSidebarCollapsed(false);
          setMobileSidebarOpen(true);
        }}
      />

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 min-h-0 flex max-w-[1920px] w-full mx-auto overflow-hidden">
        {/* Left Sidebar */}
        {mobileSidebarOpen && (
          <button
            type="button"
            aria-label="Close admin navigation"
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
        )}
        <AdminSidebar
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          productCount={products.length}
          orderCount={orders.length}
          pendingOrdersCount={pendingOrders.length}
          categoryCount={categories.length}
        />

        {/* Content Body */}
        <main ref={mainRef} className="flex-1 min-w-0 min-h-0 p-4 sm:p-8 overflow-y-auto overscroll-contain">
          {activeSection === 'overview' && (
            <AdminDashboardOverview
              onNavigateSection={handleSelectSection}
            />
          )}

          {activeSection === 'reports' && <DetailedSalesReportManager />}

          {activeSection === 'products' && (
            <ProductList
              categories={categories}
              onViewProductOnStore={onViewProductOnStore}
            />
          )}

          {activeSection === 'inventory' && <InventoryManager />}

          {activeSection === 'orders' && <OrdersManager />}

          {activeSection === 'returns' && <ReturnManager />}

          {activeSection === 'categories' && <CategoryManager />}

          {activeSection === 'collections' && <CollectionManager />}

          {activeSection === 'sizes' && <SizeGroupManager />}

          {activeSection === 'colors' && <ColorCatalogManager />}

          {activeSection === 'sizeguides' && <SizeGuideManager />}

          {activeSection === 'gini' && <GiniAdminPlugin />}

          {activeSection === 'attributes' && <AttributeManager />}

          {activeSection === 'banners' && <BannerManager />}

          {activeSection === 'reviews' && <ReviewModerator />}

          {activeSection === 'announcements' && <AnnouncementsManager />}

          {activeSection === 'megaMenu' && <MegaMenuManager />}

          {activeSection === 'cms' && <HomepageCMSManager />}

          {activeSection === 'coupons' && <CouponManager />}

          {activeSection === 'customers' && <CustomerManager />}

          {activeSection === 'shipping' && <ShippingSettingsManager />}

          {activeSection === 'payments' && <PaymentSettingsManager />}

          {activeSection === 'settings' && <StoreBrandingSettings />}

          {activeSection === 'audit' && <AuditLogsManager />}
        </main>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = (props) => {
  return (
    <AdminAuthProvider>
      <AdminDashboardInner {...props} />
    </AdminAuthProvider>
  );
};

export default AdminDashboard;
