import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AdminUser, AdminRole, AdminPermission } from '../../types/admin';
import { api } from '../../services/api';

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  token: string | null;
  role: AdminRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, googleToken?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: AdminPermission) => boolean;
  hasAnyRole: (roles: AdminRole[]) => boolean;
  switchRolePreview: (role: AdminRole) => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vedaaya_admin_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    async function checkSession() {
      const savedToken = localStorage.getItem('vedaaya_admin_token');
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await api.adminGetMe(savedToken);
        if (res && res.authenticated && res.user) {
          setAdminUser(res.user);
          setToken(savedToken);
        } else {
          // Token expired or invalid
          localStorage.removeItem('vedaaya_admin_token');
          setAdminUser(null);
          setToken(null);
        }
      } catch (e) {
        console.warn('Admin session validation failed:', e);
      } finally {
        setIsLoading(false);
      }
    }

    checkSession();
  }, []);

  const login = async (email: string, password?: string, googleToken?: string) => {
    setIsLoading(true);
    try {
      const res = await api.adminLogin(email, password, googleToken);
      if (res && res.success && res.token && res.user) {
        localStorage.setItem('vedaaya_admin_token', res.token);
        setToken(res.token);
        setAdminUser(res.user);
        return { success: true };
      }
      return { success: false, error: res?.error || 'Authentication failed' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error occurred during login' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.adminLogout(token);
      }
    } catch {}
    localStorage.removeItem('vedaaya_admin_token');
    setToken(null);
    setAdminUser(null);
  };

  const hasPermission = useCallback(
    (permission: AdminPermission): boolean => {
      if (!adminUser) return false;
      if (adminUser.role === 'super_admin') return true;
      return adminUser.permissions?.includes(permission) ?? false;
    },
    [adminUser]
  );

  const hasAnyRole = useCallback(
    (roles: AdminRole[]): boolean => {
      if (!adminUser) return false;
      if (adminUser.role === 'super_admin') return true;
      return roles.includes(adminUser.role);
    },
    [adminUser]
  );

  // Quick switch between roles for demo/testing purposes
  const switchRolePreview = (role: AdminRole) => {
    if (!adminUser) return;
    const rolePermissions: Record<AdminRole, AdminPermission[]> = {
      super_admin: [
        'manage_products',
        'manage_categories',
        'manage_orders',
        'manage_customers',
        'manage_settings',
        'manage_cms',
        'manage_coupons',
        'manage_attributes',
        'manage_banners',
        'view_analytics',
        'manage_admins',
      ],
      admin: [
        'manage_products',
        'manage_categories',
        'manage_orders',
        'manage_customers',
        'manage_settings',
        'manage_cms',
        'manage_coupons',
        'manage_attributes',
        'manage_banners',
        'view_analytics',
      ],
      inventory_manager: [
        'manage_products',
        'manage_categories',
        'manage_attributes',
        'manage_banners',
      ],
      order_manager: [
        'manage_orders',
        'manage_customers',
        'view_analytics',
      ],
      content_manager: [
        'manage_cms',
        'manage_banners',
        'manage_coupons',
        'manage_categories',
      ],
    };

    setAdminUser({
      ...adminUser,
      role,
      permissions: rolePermissions[role] || [],
    });
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        token,
        role: adminUser?.role || null,
        isAuthenticated: !!adminUser && !!token,
        isLoading,
        login,
        logout,
        hasPermission,
        hasAnyRole,
        switchRolePreview,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
