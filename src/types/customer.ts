export interface UserAddress {
  id?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  type?: 'Home' | 'Work' | 'Other' | string;
  isDefault?: boolean;
  [key: string]: any;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role?: 'customer' | 'admin' | 'staff' | string;
  authProvider?: 'google' | 'email' | 'phone' | 'guest';
  totalOrders?: number;
  totalSpent?: number;
  lastLoginAt?: string;
  addresses?: UserAddress[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  registeredUsers: number;
  guestUsers: number;
  repeatCustomers: number;
  averageOrdersPerCustomer: number;
  totalLifetimeRevenue: number;
}
