import React from 'react';
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Layers,
  Palette,
  Ruler,
  Sliders,
  Image,
  Megaphone,
  Compass,
  LayoutGrid,
  Tag,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  FolderKanban,
  Boxes,
  MessageSquare,
  RotateCcw,
  BarChart3,
  Truck,
  CreditCard,
  History,
  Sparkles,
} from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { AdminPermission } from '../../types/admin';

export type AdminSection =
  | 'overview'
  | 'products'
  | 'inventory'
  | 'orders'
  | 'returns'
  | 'reports'
  | 'categories'
  | 'collections'
  | 'attributes'
  | 'sizes'
  | 'colors'
  | 'sizeguides'
  | 'gini'
  | 'banners'
  | 'reviews'
  | 'announcements'
  | 'megaMenu'
  | 'cms'
  | 'coupons'
  | 'customers'
  | 'shipping'
  | 'payments'
  | 'settings'
  | 'audit';

interface SidebarItem {
  id: AdminSection;
  label: string;
  icon: React.ElementType;
  permission?: AdminPermission;
  badge?: string | number;
  group?: 'core' | 'catalog' | 'engagement' | 'system';
}

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSelectSection: (section: AdminSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  productCount?: number;
  orderCount?: number;
  pendingOrdersCount?: number;
  categoryCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeSection,
  onSelectSection,
  collapsed,
  onToggleCollapse,
  productCount = 0,
  orderCount = 0,
  pendingOrdersCount = 0,
  categoryCount = 0,
}) => {
  const { adminUser, hasPermission, logout, switchRolePreview, role } = useAdminAuth();

  const allItems: SidebarItem[] = [
    // Core
    { id: 'overview', label: 'Dashboard', icon: TrendingUp, permission: 'view_analytics', group: 'core' },
    { id: 'reports', label: 'Sales Reports & KPI', icon: BarChart3, permission: 'view_analytics', group: 'core' },
    {
      id: 'products',
      label: 'Products & Kurtis',
      icon: Package,
      permission: 'manage_products',
      badge: productCount > 0 ? productCount : undefined,
      group: 'catalog',
    },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      icon: Boxes,
      permission: 'manage_products',
      group: 'catalog',
    },
    {
      id: 'megaMenu',
      label: 'Menus & Submenus',
      icon: Compass,
      permission: 'manage_cms',
      badge: 'Nav Builder',
      group: 'catalog',
    },
    {
      id: 'categories',
      label: 'Categories & Taxonomy',
      icon: Layers,
      permission: 'manage_categories',
      badge: categoryCount > 0 ? categoryCount : undefined,
      group: 'catalog',
    },
    {
      id: 'collections',
      label: 'Collections & Curations',
      icon: FolderKanban,
      permission: 'manage_categories',
      group: 'catalog',
    },
    {
      id: 'orders',
      label: 'Orders & Shipments',
      icon: ShoppingBag,
      permission: 'manage_orders',
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} New` : (orderCount > 0 ? orderCount : undefined),
      group: 'core',
    },
    {
      id: 'returns',
      label: 'Returns & Exchanges',
      icon: RotateCcw,
      permission: 'manage_orders',
      group: 'core',
    },
    { id: 'attributes', label: 'Product Attributes', icon: Sliders, permission: 'manage_attributes', group: 'catalog' },
    { id: 'sizes', label: 'Size Groups (XS–5XL)', icon: Layers, permission: 'manage_attributes', group: 'catalog' },
    { id: 'colors', label: 'Color Catalog', icon: Palette, permission: 'manage_attributes', group: 'catalog' },
    { id: 'sizeguides', label: 'Size Guides', icon: Ruler, permission: 'manage_attributes', group: 'catalog' },

    // Engagement & CMS
    { id: 'gini', label: 'Gini Voice Assistant', icon: Sparkles, permission: 'manage_settings', badge: 'AI Voice', group: 'engagement' },
    { id: 'banners', label: 'Hero Banners', icon: Image, permission: 'manage_banners', group: 'engagement' },
    { id: 'reviews', label: 'Reviews & Ratings', icon: MessageSquare, permission: 'manage_cms', group: 'engagement' },
    { id: 'announcements', label: 'Announcement Bar', icon: Megaphone, permission: 'manage_cms', group: 'engagement' },
    { id: 'cms', label: 'Homepage CMS Grid', icon: LayoutGrid, permission: 'manage_cms', group: 'engagement' },
    { id: 'coupons', label: 'Coupons & Promos', icon: Tag, permission: 'manage_coupons', group: 'engagement' },

    // Customers & System
    { id: 'customers', label: 'Customers', icon: Users, permission: 'manage_customers', group: 'system' },
    { id: 'shipping', label: 'Shipping & Delivery', icon: Truck, permission: 'manage_settings', group: 'system' },
    { id: 'payments', label: 'Payment Gateways', icon: CreditCard, permission: 'manage_settings', group: 'system' },
    { id: 'settings', label: 'Store & Branding', icon: Settings, permission: 'manage_settings', group: 'system' },
    { id: 'audit', label: 'Audit Logs & Security', icon: History, permission: 'manage_settings', group: 'system' },
  ];

  // Filter items by current user permissions
  const visibleItems = allItems.filter((item) => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  return (
    <aside
      className={`min-h-0 bg-white border-r border-neutral-200 flex flex-col transition-all duration-200 shrink-0 ${
        collapsed ? 'w-20' : 'w-64 sm:w-72'
      }`}
    >
      <div className="min-h-0 p-4 flex flex-col flex-1 overflow-y-auto overscroll-contain">
        {/* User Card Pill */}
        {!collapsed && adminUser && (
          <div className="mb-4 p-3 bg-[#FAF6F0] rounded-2xl border border-[#EADBDA] flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={adminUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={adminUser.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border border-[#D4AF37]"
              />
              <div className="truncate">
                <p className="text-xs font-bold text-neutral-900 truncate">{adminUser.name}</p>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#7B2435]" />
                  <span className="text-[10px] font-bold text-[#7B2435] capitalize">
                    {adminUser.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation items */}
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                  isActive
                    ? 'bg-[#7B2435] text-white shadow-xs'
                    : 'text-neutral-600 hover:bg-[#FAF6F0] hover:text-[#7B2435]'
                } ${collapsed ? 'justify-center px-0' : 'justify-between'}`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : typeof item.badge === 'string' && item.badge.includes('New')
                        ? 'bg-amber-100 text-amber-900 font-black'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="shrink-0 p-3 border-t border-neutral-100 flex flex-col gap-2">
        {/* Role Switcher for Fast Evaluation */}
        {!collapsed && (
          <div className="px-2 py-1.5 bg-[#FAF6F0] rounded-xl border border-neutral-200 text-[10px]">
            <span className="text-neutral-400 font-bold block mb-1">Preview Role:</span>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => switchRolePreview('super_admin')}
                className={`px-1.5 py-1 rounded text-center font-bold ${
                  role === 'super_admin' ? 'bg-[#7B2435] text-white' : 'bg-white text-neutral-600'
                }`}
              >
                Super
              </button>
              <button
                type="button"
                onClick={() => switchRolePreview('inventory_manager')}
                className={`px-1.5 py-1 rounded text-center font-bold ${
                  role === 'inventory_manager' ? 'bg-[#7B2435] text-white' : 'bg-white text-neutral-600'
                }`}
              >
                Stock
              </button>
              <button
                type="button"
                onClick={() => switchRolePreview('order_manager')}
                className={`px-1.5 py-1 rounded text-center font-bold ${
                  role === 'order_manager' ? 'bg-[#7B2435] text-white' : 'bg-white text-neutral-600'
                }`}
              >
                Orders
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg cursor-pointer transition text-xs font-semibold flex items-center gap-1.5"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="text-[11px]">Collapse</span>}
          </button>

          <button
            type="button"
            onClick={logout}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition text-xs font-semibold flex items-center gap-1.5"
            title="Logout Admin Session"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="text-[11px]">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
