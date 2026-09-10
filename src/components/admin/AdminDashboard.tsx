import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ShoppingBag, 
  DollarSign, 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  Filter, 
  Truck, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  ArrowLeft, 
  Tag, 
  Save, 
  X,
  Layers,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  ExternalLink,
  UserCheck,
  HelpCircle,
  Image as ImageIcon,
  Palette,
  Lock,
  FileText
} from 'lucide-react';
import { Product, Order, Coupon, ProductVariant, Category, User } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';
import { CategoryManager } from './CategoryManager';
import { AdminLoginGate } from './AdminLoginGate';
import { StoreBrandingSettings } from './StoreBrandingSettings';
import { InvoiceModal } from '../invoice/InvoiceModal';
import { store } from '../../store';
import { ecommerceApi } from '../../store/api/ecommerceApi';

interface AdminDashboardProps {
  onNavigate: (route: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const { user, isAdmin, isAdminAuthenticated, lockAdminSession, logout } = useAuth();
  const { branding } = useBranding();
  const [activeTab, setActiveTab] = useState<'overview' | 'branding' | 'categories' | 'products' | 'orders' | 'coupons' | 'customers'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Edit/Create Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const [editingVariants, setEditingVariants] = useState<{ size: string; stock: number }[]>([
    { size: 'XS', stock: 5 },
    { size: 'S', stock: 10 },
    { size: 'M', stock: 15 },
    { size: 'L', stock: 12 },
    { size: 'XL', stock: 8 },
    { size: '2XL', stock: 6 },
    { size: '3XL', stock: 4 },
    { size: '4XL', stock: 2 },
    { size: '5XL', stock: 2 },
  ]);
  const [editingImageUrls, setEditingImageUrls] = useState<string[]>([
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'
  ]);

  // Create Customer Modal State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerCity, setNewCustomerCity] = useState('');
  const [newCustomerState, setNewCustomerState] = useState('');

  // Create Coupon State
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState(20);
  const [newCouponMinOrder, setNewCouponMinOrder] = useState(1499);
  const [newCouponDesc, setNewCouponDesc] = useState('');

  const loadData = async () => {
    const [pList, cList, oList, coupList, custList] = await Promise.all([
      api.getProducts(),
      api.getCategories(),
      api.getOrders(),
      api.getCoupons(),
      api.getCustomers(),
    ]);
    setProducts(pList);
    setCategories(cList);
    setOrders(oList);
    setCoupons(coupList);
    setCustomers(custList);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute analytics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  
  // Find low stock variants
  const lowStockItems: { productName: string; size: string; stock: number }[] = [];
  products.forEach((p) => {
    (p.variants || []).forEach((v) => {
      if (v.stock < 5) {
        lowStockItems.push({ productName: p.name, size: v.size, stock: v.stock });
      }
    });
  });

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct.sellingPrice) return;

    const formattedVariants: ProductVariant[] = editingVariants.map((v, i) => ({
      id: editingProduct.variants?.[i]?.id || `v-${Date.now()}-${v.size.toLowerCase()}`,
      size: v.size as any,
      color: 'Default',
      colorHex: '#C98C97',
      stock: Number(v.stock) || 0,
      sku: `${editingProduct.sku || 'VDY'}-${v.size}`,
    }));

    const validImages = editingImageUrls
      .filter((url) => url.trim().length > 0)
      .map((url, idx) => ({
        id: `img-${Date.now()}-${idx}`,
        url: url.trim(),
        altText: `${editingProduct.name} - View ${idx + 1}`,
        isPrimary: idx === 0,
        type: idx === 0 ? ('front' as const) : idx === 1 ? ('detail' as const) : ('back' as const),
      }));

    if (validImages.length === 0) {
      validImages.push({
        id: `img-${Date.now()}-0`,
        url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
        altText: editingProduct.name,
        isPrimary: true,
        type: 'front',
      });
    }

    const isNew = editingProduct.isNewArrival !== undefined ? !!editingProduct.isNewArrival : true;
    const isBest = !!editingProduct.isBestseller;

    if (editingProduct.id) {
      await api.updateProduct(editingProduct.id, {
        ...editingProduct,
        subcategory: editingProduct.subcategory || 'Kurti with Pant',
        subSubCategory: editingProduct.subSubCategory || 'Kurtas & Kurtis',
        gender: editingProduct.gender || ((editingProduct.category || '').toLowerCase().includes('men') && !(editingProduct.category || '').toLowerCase().includes('women') ? 'Men' : 'Women'),
        variants: formattedVariants,
        images: validImages,
        isNewArrival: isNew,
        isBestseller: isBest,
        badge: isNew ? 'New Arrival' : (isBest ? 'Bestseller' : undefined),
        collections: Array.from(new Set([
          'Everyday Elegance',
          'Pure Cotton Comfort',
          ...(editingProduct.collections || []),
          ...(isNew ? ['New Arrivals', 'Fresh Season', 'New'] : [])
        ])),
        tags: Array.from(new Set([
          'ethnic',
          'kurti',
          'kurtas',
          'cotton',
          editingProduct.fabric?.toLowerCase() || 'cotton',
          editingProduct.work?.toLowerCase() || 'printed',
          ...(editingProduct.tags || []),
          ...(isNew ? ['new arrival', 'new-arrivals', 'new', 'fresh'] : [])
        ])).filter(Boolean) as string[],
      });
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: editingProduct.name,
        slug: editingProduct.name.toLowerCase().replace(/[\s&]+/g, '-'),
        sku: editingProduct.sku || `VDY-${Date.now().toString().slice(-4)}`,
        category: editingProduct.category || 'Kurta Sets',
        subcategory: editingProduct.subcategory || 'Kurti with Pant',
        subSubCategory: editingProduct.subSubCategory || 'Kurtas & Kurtis',
        gender: editingProduct.gender || ((editingProduct.category || '').toLowerCase().includes('men') && !(editingProduct.category || '').toLowerCase().includes('women') ? 'Men' : 'Women'),
        description: editingProduct.description || 'Authentic handcrafted ethnic apparel designed in pure comfortable fabrics.',
        sellingPrice: Number(editingProduct.sellingPrice),
        mrp: Number(editingProduct.mrp || editingProduct.sellingPrice * 1.5),
        discountPercent: Math.round(((Number(editingProduct.mrp || editingProduct.sellingPrice * 1.5) - Number(editingProduct.sellingPrice)) / Number(editingProduct.mrp || editingProduct.sellingPrice * 1.5)) * 100) || 25,
        fabric: editingProduct.fabric || 'Cotton',
        work: editingProduct.work || 'Hand Block Print',
        fit: editingProduct.fit || 'Straight',
        neckType: editingProduct.neckType || 'Round Neck',
        sleeve: editingProduct.sleeve || '3/4th Sleeve',
        occasion: editingProduct.occasion || 'Casual',
        tags: Array.from(new Set([
          'ethnic',
          'kurti',
          'kurtas',
          'cotton',
          'plus size',
          editingProduct.fabric?.toLowerCase() || 'cotton',
          editingProduct.work?.toLowerCase() || 'printed',
          ...(editingProduct.tags || []),
          ...(isNew ? ['new arrival', 'new-arrivals', 'new', 'fresh'] : [])
        ])).filter(Boolean) as string[],
        isNewArrival: isNew,
        isBestseller: isBest,
        badge: isNew ? 'New Arrival' : (isBest ? 'Bestseller' : 'New'),
        rating: 4.8,
        reviewCount: 1,
        pattern: 'Floral',
        dupattaIncluded: true,
        features: ['Pure breathable natural fabric', 'Reinforced stitch comfort fit', 'Twin functional deep pockets', 'Handcrafted artisan detailing'],
        collections: Array.from(new Set([
          'Everyday Elegance',
          'Pure Cotton Comfort',
          ...(editingProduct.collections || []),
          ...(isNew ? ['New Arrivals', 'Fresh Season', 'New'] : ['New Arrivals'])
        ])),
        careInstructions: ['Hand wash cold separately', 'Dry in shade', 'Iron inside out'],
        images: validImages,
        variants: formattedVariants,
        createdAt: new Date().toISOString(),
      };
      await api.createProduct(newProd);
    }

    try {
      store.dispatch(ecommerceApi.util.invalidateTags([{ type: 'Product', id: 'LIST' }]));
    } catch {}

    setIsProductModalOpen(false);
    setEditingProduct(null);
    loadData();
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await api.deleteProduct(id);
      try {
        store.dispatch(ecommerceApi.util.invalidateTags([{ type: 'Product', id: 'LIST' }]));
      } catch {}
      loadData();
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: Order['orderStatus']) => {
    await api.updateOrderStatus(orderId, newStatus);
    try {
      store.dispatch(ecommerceApi.util.invalidateTags([{ type: 'Order', id: 'LIST' }]));
    } catch {}
    loadData();
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;

    await api.createCoupon({
      code: newCouponCode.toUpperCase().trim(),
      title: newCouponDesc || 'Store Discount',
      discountType: 'percentage',
      discountValue: newCouponDiscount,
      minOrderAmount: newCouponMinOrder,
      maxDiscountAmount: 1500,
      description: newCouponDesc || `Flat ${newCouponDiscount}% OFF across entire store`,
      isActive: true,
      expiryDate: '2026-12-31',
      usageCount: 0,
    });

    try {
      store.dispatch(ecommerceApi.util.invalidateTags([{ type: 'Coupon', id: 'LIST' }]));
    } catch {}

    setNewCouponCode('');
    setNewCouponDesc('');
    loadData();
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerEmail) return;

    const newCust: User = {
      id: `usr-cust-${Date.now()}`,
      name: newCustomerName,
      email: newCustomerEmail,
      phone: newCustomerPhone || '+91 98000 00000',
      role: 'customer',
      authProvider: 'google',
      totalOrders: 0,
      totalSpent: 0,
      lastLoginAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
      addresses: newCustomerCity ? [
        {
          id: `addr-${Date.now()}`,
          fullName: newCustomerName,
          phone: newCustomerPhone || '+91 98000 00000',
          addressLine1: 'Main Street',
          city: newCustomerCity,
          state: newCustomerState || 'India',
          pincode: '560001',
          type: 'Home',
          isDefault: true,
        }
      ] : [],
    };

    await api.saveCustomer(newCust);
    setIsCustomerModalOpen(false);
    setNewCustomerName('');
    setNewCustomerEmail('');
    setNewCustomerPhone('');
    setNewCustomerCity('');
    setNewCustomerState('');
    loadData();
  };

  const handleExportCustomersCSV = () => {
    const headers = ['ID,Name,Email,Phone,Auth Provider,Total Orders,Total Spent (INR),City,State,Registered Date\n'];
    const rows = customers.map((c) => {
      const addr = c.addresses?.[0];
      return `"${c.id}","${c.name}","${c.email}","${c.phone || ''}","${c.authProvider || 'google'}","${c.totalOrders || 0}","${c.totalSpent || 0}","${addr?.city || ''}","${addr?.state || ''}","${c.createdAt || ''}"\n`;
    });
    const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vedaaya_enrolled_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAdminAuthenticated) {
    return (
      <AdminLoginGate
        onSuccess={() => {
          loadData();
        }}
        onCancel={() => onNavigate('/')}
      />
    );
  }

  return (
    <div className="bg-[#FAF6F0] min-h-screen py-8 w-full">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-12">
        
        {/* Top bar & Quick Guide */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EADBDA] mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="p-2 bg-white rounded-full border border-neutral-200 hover:border-neutral-400 text-neutral-700 transition"
              title="Return to Storefront"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-[#7B2435] text-white font-bold text-[10px] uppercase rounded-full tracking-wider">
                  Admin Suite
                </span>
                <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                  <ShieldCheck className="w-3.5 h-3.5" /> Authenticated as Administrator
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 mt-0.5">
                {branding.storeName || 'Nandita Fashion'} Merchant Control Center
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => {
                lockAdminSession();
                onNavigate('/');
              }}
              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-full text-xs font-bold flex items-center gap-1.5 transition"
              title="Lock Admin Session and return to store"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Admin Session</span>
            </button>

            <button
              onClick={() => setShowHelpModal(true)}
              className="px-4 py-2 bg-white border border-[#EADBDA] hover:border-[#7B2435] text-neutral-800 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <HelpCircle className="w-4 h-4 text-[#7B2435]" />
              <span>Credentials Guide</span>
            </button>

            <button
              onClick={() => {
                setEditingProduct({
                  name: '',
                  category: 'Kurta Sets',
                  subcategory: 'Kurti with Pant',
                  fabric: 'Cotton',
                  work: 'Hand Block Print',
                  sellingPrice: 1499,
                  mrp: 2999,
                  isNewArrival: true,
                });
                setEditingVariants([
                  { size: 'XS', stock: 5 },
                  { size: 'S', stock: 10 },
                  { size: 'M', stock: 15 },
                  { size: 'L', stock: 12 },
                  { size: 'XL', stock: 8 },
                  { size: '2XL', stock: 6 },
                  { size: '3XL', stock: 4 },
                  { size: '4XL', stock: 2 },
                  { size: '5XL', stock: 2 },
                ]);
                setEditingImageUrls([
                  'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
                  'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80'
                ]);
                setIsProductModalOpen(true);
              }}
              className="px-5 py-2.5 bg-[#7B2435] hover:bg-[#621c2a] text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add New Ethnic Product
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-4 border-b border-[#EADBDA] mb-8">
          {[
            { id: 'overview', label: 'Overview & Metrics', icon: DollarSign },
            { id: 'branding', label: 'Store Branding & Themes', icon: Palette },
            { id: 'customers', label: `Customers & Enrollments (${customers.length})`, icon: Users },
            { id: 'products', label: `Inventory & Stock Catalog (${products.length})`, icon: ShoppingBag },
            { id: 'categories', label: `Menu & Submenu Manager (${categories.length})`, icon: Layers },
            { id: 'orders', label: `Customer Orders (${orders.length})`, icon: Package },
            { id: 'coupons', label: `Coupons & Promos (${coupons.length})`, icon: Tag },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-[#7B2435] text-white shadow-sm'
                    : 'bg-white text-neutral-700 border border-neutral-200 hover:border-[#7B2435]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab: Customers & Enrollments */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            {/* Top Customer Stats & Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#F0E6E1] shadow-xs">
                <span className="text-xs text-neutral-500 font-bold uppercase block mb-1">
                  Enrolled Customers
                </span>
                <h3 className="font-serif text-2xl font-bold text-neutral-900">
                  {customers.length} Accounts
                </h3>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> 100% Google Authenticated & Verified
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#F0E6E1] shadow-xs">
                <span className="text-xs text-neutral-500 font-bold uppercase block mb-1">
                  Total Customer Spend (LTV)
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#7B2435]">
                  ₹{customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0).toLocaleString('en-IN')}
                </h3>
                <span className="text-[11px] text-neutral-500 mt-1 block">
                  Across {customers.reduce((acc, c) => acc + (c.totalOrders || 0), 0)} completed orders
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#F0E6E1] flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <span className="text-xs text-neutral-500 font-bold uppercase block mb-1">
                    Customer Database
                  </span>
                  <p className="text-xs text-neutral-600">Export or manually enroll members</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCustomersCSV}
                    className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                    title="Export to CSV Spreadsheet"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                  <button
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="px-3.5 py-2 bg-[#7B2435] hover:bg-[#621c2a] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Enroll
                  </button>
                </div>
              </div>
            </div>

            {/* Customer Search & Filter */}
            <div className="bg-white p-4 rounded-2xl border border-[#F0E6E1] flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search enrolled customers by name, email, phone, city..."
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-800 focus:outline-none focus:border-[#7B2435]"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <span className="text-xs text-neutral-500 font-medium">
                Showing {customers.filter((c) => 
                  c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                  c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
                  (c.phone && c.phone.includes(customerSearch))
                ).length} enrolled members
              </span>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-3xl border border-[#F0E6E1] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-700">
                  <thead className="bg-[#FAF6F0] text-neutral-900 uppercase font-bold border-b border-[#EADBDA]">
                    <tr>
                      <th className="p-4">Customer Details</th>
                      <th className="p-4">Authentication</th>
                      <th className="p-4">Contact & Location</th>
                      <th className="p-4">Lifetime Orders</th>
                      <th className="p-4">Total Spent</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {customers
                      .filter((c) => 
                        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                        c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
                        (c.phone && c.phone.includes(customerSearch))
                      )
                      .map((cust) => {
                        const defaultAddr = cust.addresses?.[0];
                        return (
                          <tr key={cust.id} className="hover:bg-[#FFF9F9] transition">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={cust.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                                  alt={cust.name}
                                  className="w-10 h-10 rounded-full object-cover border border-[#EADBDA] flex-shrink-0"
                                />
                                <div>
                                  <strong className="text-neutral-900 block text-sm font-serif">{cust.name}</strong>
                                  <span className="text-[11px] text-neutral-400">ID: {cust.id}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full w-max text-[10px] font-bold border border-blue-100">
                                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                <span>Google Authenticated</span>
                              </div>
                              <span className="text-[10px] text-neutral-400 block mt-1">
                                Enrolled: {new Date(cust.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-neutral-800">
                                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>{cust.email}</span>
                                </div>
                                {cust.phone && (
                                  <div className="flex items-center gap-1.5 text-neutral-600">
                                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                                    <span>{cust.phone}</span>
                                  </div>
                                )}
                                {defaultAddr && (
                                  <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                                    <span>{defaultAddr.city}, {defaultAddr.state}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-neutral-900 block text-sm">
                                {cust.totalOrders || 0} Orders
                              </span>
                              <span className="text-[10px] text-neutral-400">
                                Active buyer
                              </span>
                            </td>
                            <td className="p-4">
                              <strong className="text-[#7B2435] text-sm block">
                                ₹{(cust.totalSpent || 0).toLocaleString('en-IN')}
                              </strong>
                              <span className="text-[10px] text-emerald-700 font-semibold">
                                Verified Paid
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setSelectedCustomer(cust)}
                                className="px-3 py-1.5 bg-[#FAF6F0] hover:bg-[#7B2435] hover:text-white text-neutral-700 rounded-lg text-xs font-bold transition border border-[#EADBDA]"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Categories & Navigation Management */}
        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            onRefresh={loadData}
          />
        )}

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-[#F0E6E1] shadow-xs">
                <span className="text-xs text-neutral-500 font-bold uppercase block mb-1">
                  Gross Revenue
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#7B2435]">
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </h3>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                  +18.4% vs last month
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#F0E6E1] shadow-xs">
                <span className="text-xs text-neutral-500 font-bold uppercase block mb-1">
                  Total Orders
                </span>
                <h3 className="font-serif text-2xl font-bold text-neutral-900">
                  {totalOrders}
                </h3>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                  100% fulfillment rate
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#F0E6E1] shadow-xs">
                <span className="text-xs text-neutral-500 font-bold uppercase block mb-1">
                  Enrolled Customers
                </span>
                <h3 className="font-serif text-2xl font-bold text-neutral-900">
                  {customers.length}
                </h3>
                <span className="text-[11px] text-blue-600 font-semibold mt-1 block">
                  Google One-Tap enabled
                </span>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-[#F0E6E1] shadow-xs">
                <span className="text-xs text-neutral-500 font-bold uppercase block mb-1">
                  Active SKU Count
                </span>
                <h3 className="font-serif text-2xl font-bold text-neutral-900">
                  {products.length} Designs
                </h3>
                <span className="text-[11px] text-[#7B2435] font-semibold mt-1 block">
                  XS through 5XL coverage
                </span>
              </div>
            </div>

            {/* Low stock alerts */}
            {lowStockItems.length > 0 && (
              <div className="bg-[#FFF4F2] p-5 rounded-3xl border border-red-200 space-y-3">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  <h4 className="font-bold text-xs uppercase tracking-wider">
                    Inventory Alerts ({lowStockItems.length} Variants Low in Stock)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {lowStockItems.map((item, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl border border-red-200 text-xs">
                      <strong className="text-neutral-900 truncate block">{item.productName}</strong>
                      <span className="text-red-700 font-bold">
                        Size: {item.size} • Only {item.stock} left in studio
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Products Catalog */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-[#F0E6E1] flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by title, fabric, SKU..."
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-800 focus:outline-none focus:border-[#7B2435]"
                />
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <span className="text-xs text-neutral-500 font-medium">
                Showing {(products || []).filter((p) => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())).length} products
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-[#F0E6E1] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-700">
                  <thead className="bg-[#FAF6F0] text-neutral-900 uppercase font-bold border-b border-[#EADBDA]">
                    <tr>
                      <th className="p-4">Product & Photos</th>
                      <th className="p-4">Category / Fabric</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Sizes & Stock</th>
                      <th className="p-4">Flags</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {(products || [])
                      .filter((p) => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((product) => {
                        const totalStock = (product.variants || []).reduce((acc, v) => acc + (v.stock || 0), 0);
                        return (
                          <tr key={product.id} className="hover:bg-[#FFF9F9] transition">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <img
                                    src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80'}
                                    alt={product.name}
                                    className="w-12 h-14 object-cover rounded-xl border border-neutral-200 flex-shrink-0"
                                  />
                                  <span className="absolute -bottom-1 -right-1 bg-black/70 text-white text-[9px] px-1 rounded font-mono">
                                    {product.images?.length || 1}📷
                                  </span>
                                </div>
                                <div>
                                  <strong className="text-neutral-900 block line-clamp-1">{product.name}</strong>
                                  <span className="text-[10px] text-neutral-400 font-mono">SKU: {product.sku}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold text-neutral-800 block">{product.category}</span>
                              <span className="text-[11px] text-neutral-500">{product.fabric} • {product.work}</span>
                            </td>
                            <td className="p-4">
                              <strong className="text-[#7B2435] block">₹{product.sellingPrice}</strong>
                              <span className="text-[10px] text-neutral-400 line-through">₹{product.mrp}</span>
                            </td>
                            <td className="p-4">
                              <span className={`font-bold ${totalStock < 10 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                {totalStock} in stock
                              </span>
                              <div className="flex gap-1 text-[9px] text-neutral-500 mt-1 flex-wrap">
                                {product.variants.map((v) => (
                                  <span key={v.id} className="bg-neutral-100 px-1 py-0.5 rounded">
                                    {v.size}:{v.stock}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1">
                                {product.isBestseller && (
                                  <span className="px-2 py-0.5 bg-[#FFF2F4] text-[#7B2435] rounded-full text-[9px] font-bold uppercase w-max">
                                    Bestseller
                                  </span>
                                )}
                                {product.isNewArrival && (
                                  <span className="px-2 py-0.5 bg-neutral-900 text-white rounded-full text-[9px] font-bold uppercase w-max">
                                    New
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingProduct(product);
                                    const defaultSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
                                    const mappedVariants = defaultSizes.map((sz) => {
                                      const existing = product.variants?.find((v) => v.size === sz);
                                      return { size: sz, stock: existing ? existing.stock : 0 };
                                    });
                                    setEditingVariants(mappedVariants);
                                    const urls = product.images && product.images.length > 0 
                                      ? product.images.map(img => img.url)
                                      : ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'];
                                    setEditingImageUrls(urls);
                                    setIsProductModalOpen(true);
                                  }}
                                  className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-600 transition"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Menu and Submenu Management Section directly below Inventory and Stock */}
            <div className="pt-8 border-t-2 border-[#EADBDA] space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 bg-[#FFF2F4] text-[#7B2435] text-[10px] font-bold uppercase rounded-full">
                    Navigation Architecture
                  </span>
                  <h3 className="font-serif text-xl font-bold text-neutral-900 mt-1">
                    Menu & Submenu Structure (Positioned below Inventory & Stock)
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Add and edit menus (e.g. Women, Men, Accessories) and column submenus with dynamic destination URLs.
                  </p>
                </div>
              </div>

              <CategoryManager
                categories={categories}
                onRefresh={loadData}
                onNavigateToCatalog={(cat, subcat, subSubCat) => {
                  let query = '/catalog?';
                  if (cat) query += `category=${encodeURIComponent(cat)}`;
                  if (subcat) query += `&subcategory=${encodeURIComponent(subcat)}`;
                  if (subSubCat) query += `&subSubCategory=${encodeURIComponent(subSubCat)}`;
                  onNavigate(query);
                }}
              />
            </div>
          </div>
        )}

        {/* Tab: Orders Manager */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-6 rounded-3xl border border-[#F0E6E1] shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#F5ECE8]">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-neutral-900 text-sm">
                          Order #{order.orderNumber}
                        </span>
                        <span className="text-xs text-neutral-500 font-medium">
                          Customer: {order.customerName} ({order.customerEmail})
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        Date: {new Date(order.createdAt).toLocaleString('en-IN')} • Payment: {order.paymentMethod} ({order.paymentStatus})
                      </span>
                    </div>

                    {/* Status Changer */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-600">Status:</span>
                      <select
                        value={order.orderStatus}
                        onChange={(e) => handleOrderStatusChange(order.id, e.target.value as any)}
                        className="bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3 py-1.5 text-xs font-bold text-[#7B2435] focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Order item rows */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {order.items.map((it) => (
                      <div key={it.variantId} className="flex items-center gap-3 bg-[#FAF6F0] p-2.5 rounded-xl border border-[#EADBDA]">
                        <img src={it.productImage} alt={it.productName} className="w-10 h-12 object-cover rounded-lg" />
                        <div className="text-xs">
                          <strong className="text-neutral-900 block truncate">{it.productName}</strong>
                          <span className="text-neutral-500 text-[11px]">Size: {it.size} • Qty: {it.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-neutral-600 pt-2 border-t border-[#F5ECE8] gap-2">
                    <span>Shipping to: {order.shippingAddress.addressLine1}, {order.shippingAddress.city} ({order.shippingAddress.pincode})</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setInvoiceOrder(order)}
                        className="px-3 py-1.5 bg-[#FAF6F0] hover:bg-[#F5ECE8] text-[#7B2435] border border-[#EADBDA] rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View / Print GST Invoice</span>
                      </button>
                      <span className="font-serif text-sm font-bold text-[#7B2435]">Grand Total: ₹{order.grandTotal}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Coupons */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-[#F0E6E1] shadow-xs space-y-4">
              <h3 className="font-serif text-lg font-bold text-neutral-900">
                Create New Coupon Code
              </h3>
              <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FESTIVE25"
                    className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2 text-neutral-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="5"
                    max="80"
                    required
                    value={newCouponDiscount}
                    onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                    className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2 text-neutral-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={newCouponMinOrder}
                    onChange={(e) => setNewCouponMinOrder(Number(e.target.value))}
                    className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2 text-neutral-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Promo Description</label>
                  <input
                    type="text"
                    value={newCouponDesc}
                    onChange={(e) => setNewCouponDesc(e.target.value)}
                    placeholder="e.g. Flat 25% OFF on all Festive Anarkalis"
                    className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2 text-neutral-800"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#7B2435] text-white rounded-full font-bold text-xs shadow-md hover:bg-[#621c2a] transition"
                >
                  Publish Coupon
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-serif text-lg font-bold text-neutral-900">
                Active Store Promo Codes ({coupons.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {coupons.map((c) => (
                  <div key={c.code} className="bg-white p-5 rounded-3xl border-2 border-dashed border-[#C98C97] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-xs bg-[#FFF2F4] text-[#7B2435] px-2.5 py-1 rounded">
                        {c.code}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">{c.discountValue}% OFF</span>
                    </div>
                    <p className="text-xs text-neutral-600 font-medium">{c.description}</p>
                    <p className="text-[11px] text-neutral-400">Min Order: ₹{c.minOrderAmount || c.minOrderValue} • Max Discount: ₹{c.maxDiscountAmount || c.maxDiscount || 800}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Store Branding & Themes */}
        {activeTab === 'branding' && (
          <StoreBrandingSettings />
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#F0E6E1] overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0E6E1] mb-6">
              <div className="flex items-center gap-3">
                <img
                  src={selectedCustomer.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={selectedCustomer.name}
                  className="w-12 h-12 rounded-full object-cover border border-[#EADBDA]"
                />
                <div>
                  <h3 className="font-serif text-lg font-bold text-neutral-900">{selectedCustomer.name}</h3>
                  <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Google Authenticated Customer
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EADBDA] space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-bold">Email:</span>
                  <span className="font-semibold text-neutral-900">{selectedCustomer.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-bold">Phone:</span>
                  <span className="font-semibold text-neutral-900">{selectedCustomer.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-bold">Joined:</span>
                  <span className="font-semibold text-neutral-900">
                    {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-bold">Lifetime Spend:</span>
                  <span className="font-bold text-[#7B2435] text-sm">₹{(selectedCustomer.totalSpent || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-neutral-900 uppercase text-[11px] mb-2 tracking-wider">
                  Saved Delivery Addresses
                </h4>
                {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                  selectedCustomer.addresses.map((addr) => (
                    <div key={addr.id} className="p-3 bg-white border border-[#EADBDA] rounded-xl mb-2">
                      <div className="font-bold text-neutral-900">{addr.fullName} ({addr.type})</div>
                      <div className="text-neutral-600">{addr.addressLine1} {addr.addressLine2}</div>
                      {addr.landmark && <div className="text-neutral-500">Landmark: {addr.landmark}</div>}
                      <div className="text-neutral-700 font-semibold">{addr.city}, {addr.state} - {addr.pincode}</div>
                      <div className="text-neutral-500">Phone: {addr.phone}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-400 italic">No saved delivery addresses yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Customer Enrollment Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#F0E6E1]">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0E6E1] mb-6">
              <h3 className="font-serif text-lg font-bold text-neutral-900">
                Enroll New Customer Account
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-800 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Shalini Roy"
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newCustomerEmail}
                  onChange={(e) => setNewCustomerEmail(e.target.value)}
                  placeholder="e.g. shalini.roy@gmail.com"
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">City</label>
                  <input
                    type="text"
                    value={newCustomerCity}
                    onChange={(e) => setNewCustomerCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">State</label>
                  <input
                    type="text"
                    value={newCustomerState}
                    onChange={(e) => setNewCustomerState(e.target.value)}
                    placeholder="e.g. Maharashtra"
                    className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#7B2435] text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-md hover:bg-[#621c2a] transition mt-2"
              >
                Save Customer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Help & Google Auth Guide Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#F0E6E1] overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0E6E1] mb-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#7B2435]" />
                <h3 className="font-serif text-lg font-bold text-neutral-900">
                  Admin Access, Google Auth & Product Guide
                </h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-xs text-neutral-700">
              {/* Point 1: Admin Login */}
              <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EADBDA]">
                <h4 className="font-bold text-sm text-neutral-900 mb-2 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#7B2435] text-white flex items-center justify-center text-[10px]">1</span>
                  Admin Access & Session Control
                </h4>
                <p className="leading-relaxed mb-3">
                  You are authenticated with full administrator privileges. You can lock your admin session at any time using the button below.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      lockAdminSession();
                      setShowHelpModal(false);
                      onNavigate('/');
                    }}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock Admin Session</span>
                  </button>
                </div>
              </div>

              {/* Point 2: Adding Products */}
              <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EADBDA]">
                <h4 className="font-bold text-sm text-neutral-900 mb-2 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#7B2435] text-white flex items-center justify-center text-[10px]">2</span>
                  How to Add Products to Catalog
                </h4>
                <p className="leading-relaxed mb-2">
                  Click the <strong>"+ Add New Ethnic Product"</strong> button in the Admin Dashboard or Catalog tab. You can provide:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-neutral-600">
                  <li><strong>Multiple Photo URLs:</strong> Add primary front photo, neckline embroidery close-up, and back flare photos.</li>
                  <li><strong>Sizes XS to 5XL:</strong> Specify exact warehouse stock quantity for each individual size.</li>
                  <li><strong>Fabric & Craft:</strong> Pure Cotton, Chanderi Silk, Lucknowi Chikankari, Hand Block Print, Gotta Patti.</li>
                  <li><strong>Hierarchy:</strong> Assign to Header category (Women, Men, Kurtis), SubMenu Column, and SubCategory.</li>
                </ul>
              </div>

              {/* Point 3: Admin Credentials */}
              <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EADBDA]">
                <h4 className="font-bold text-sm text-neutral-900 mb-2 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#7B2435] text-white flex items-center justify-center text-[10px]">3</span>
                  Administrator Credentials
                </h4>
                <p className="leading-relaxed mb-2 text-xs">
                  Use the administrator account issued securely by the server administrator.
                </p>
                <div className="p-3 bg-white rounded-xl border border-neutral-200 font-mono text-xs text-neutral-800 space-y-1">
                  <div>Credentials are never embedded in frontend source code.</div>
                </div>
              </div>

              {/* Point 4: Checking Enrolled Customers */}
              <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EADBDA]">
                <h4 className="font-bold text-sm text-neutral-900 mb-2 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#7B2435] text-white flex items-center justify-center text-[10px]">4</span>
                  How to Check Enrolled Customer Information
                </h4>
                <p className="leading-relaxed">
                  Open the <strong>"Customers & Enrollments"</strong> tab inside the Admin Dashboard. You will see every registered customer's full name, email, phone number, saved delivery address, total orders placed, lifetime spend, and registration date. You can also export the database to CSV.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-[#F0E6E1] overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0E6E1] mb-6">
              <h3 className="font-serif text-lg font-bold text-neutral-900">
                {editingProduct?.id ? 'Edit Ethnic Product' : 'Add New Ethnic Garment to Catalog'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-800 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={editingProduct?.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="e.g. Royal Dusty Rose Zari Silk Anarkali Set"
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#FAF6F0] p-3 rounded-2xl border border-[#EADBDA]">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Header Category *</label>
                  <select
                    value={editingProduct?.category || categories[0]?.name || 'Kurta Sets'}
                    onChange={(e) => {
                      const selectedCatName = e.target.value;
                      const matchedCat = categories.find(c => c.name === selectedCatName);
                      const defaultSub = matchedCat?.subMenus?.[0]?.name || '';
                      const defaultSubSub = matchedCat?.subMenus?.[0]?.subcategories?.[0]?.name || '';
                      setEditingProduct({
                        ...editingProduct,
                        category: selectedCatName,
                        subcategory: defaultSub,
                        subSubCategory: defaultSubSub,
                        gender: selectedCatName.toLowerCase().includes('men') && !selectedCatName.toLowerCase().includes('women') ? 'Men' : 'Women'
                      });
                    }}
                    className="w-full bg-white border border-[#EADBDA] rounded-xl px-3 py-2 text-neutral-800 text-xs font-semibold"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">SubMenu Column</label>
                  <select
                    value={editingProduct?.subcategory || ''}
                    onChange={(e) => {
                      const selSub = e.target.value;
                      const matchedCat = categories.find(c => c.name === (editingProduct?.category || 'Kurta Sets'));
                      const matchedSubMenu = matchedCat?.subMenus?.find(s => s.name === selSub);
                      const defaultSubSub = matchedSubMenu?.subcategories?.[0]?.name || '';
                      setEditingProduct({
                        ...editingProduct,
                        subcategory: selSub,
                        subSubCategory: defaultSubSub
                      });
                    }}
                    className="w-full bg-white border border-[#EADBDA] rounded-xl px-3 py-2 text-neutral-800 text-xs font-semibold"
                  >
                    {(() => {
                      const matchedCat = categories.find(c => c.name === (editingProduct?.category || categories[0]?.name));
                      if (matchedCat?.subMenus && matchedCat.subMenus.length > 0) {
                        return matchedCat.subMenus.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ));
                      }
                      return <option value="Kurti with Pant">Kurti with Pant</option>;
                    })()}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Specific Sub-Category</label>
                  <select
                    value={editingProduct?.subSubCategory || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subSubCategory: e.target.value })}
                    className="w-full bg-white border border-[#EADBDA] rounded-xl px-3 py-2 text-neutral-800 text-xs font-semibold"
                  >
                    {(() => {
                      const matchedCat = categories.find(c => c.name === (editingProduct?.category || categories[0]?.name));
                      const matchedSubMenu = matchedCat?.subMenus?.find(s => s.name === (editingProduct?.subcategory || matchedCat?.subMenus?.[0]?.name));
                      if (matchedSubMenu?.subcategories && matchedSubMenu.subcategories.length > 0) {
                        return matchedSubMenu.subcategories.map(ss => (
                          <option key={ss.id} value={ss.name}>{ss.name}</option>
                        ));
                      }
                      return <option value="Kurtas & Kurtis">Kurtas & Kurtis</option>;
                    })()}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct?.sellingPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sellingPrice: Number(e.target.value) })}
                    className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct?.mrp || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, mrp: Number(e.target.value) })}
                    className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Fabric</label>
                  <select
                    value={editingProduct?.fabric || 'Cotton'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, fabric: e.target.value })}
                    className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800"
                  >
                    <option value="Cotton">Pure Cotton</option>
                    <option value="Chanderi">Chanderi Silk</option>
                    <option value="Mulmul">Pure Mulmul Muslin</option>
                    <option value="Rayon">Viscose Rayon</option>
                    <option value="Linen">European Flax Linen</option>
                    <option value="Silk">Raw & Pure Silk</option>
                    <option value="Georgette">Georgette</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-neutral-800 mb-1">Craftsmanship / Work</label>
                  <select
                    value={editingProduct?.work || 'Hand Block Print'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, work: e.target.value })}
                    className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800"
                  >
                    <option value="Hand Block Print">Jaipur Hand Block Print</option>
                    <option value="Chikankari">Lucknowi Chikankari</option>
                    <option value="Zari Work">Zari Silk Embroidery</option>
                    <option value="Gotta Patti">Gotta Patti Handwork</option>
                    <option value="Neck Embroidery">Neck Needle Embroidery</option>
                    <option value="Solid">Solid Minimalist</option>
                  </select>
                </div>
              </div>

              {/* Multi-Image URL list */}
              <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EADBDA] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-neutral-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#7B2435]" />
                    <span>Multi-Angle Catalog Images (Allows customers to view full gallery on card)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditingImageUrls([...editingImageUrls, ''])}
                    className="text-[11px] font-bold text-[#7B2435] hover:underline"
                  >
                    + Add Another Image URL
                  </button>
                </div>

                {editingImageUrls.map((url, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="w-16 text-neutral-500 font-bold text-[10px]">
                      {idx === 0 ? '1. Front (Main)' : idx === 1 ? '2. Detail' : `3. View ${idx + 1}`}
                    </span>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        const updated = [...editingImageUrls];
                        updated[idx] = e.target.value;
                        setEditingImageUrls(updated);
                      }}
                      placeholder={`https://images.unsplash.com/... for view ${idx + 1}`}
                      className="flex-1 bg-white border border-[#EADBDA] rounded-xl px-3 py-2 text-neutral-800 text-xs"
                    />
                    {url && (
                      <img
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        className="w-8 h-10 object-cover rounded-lg border border-[#EADBDA]"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                    {editingImageUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingImageUrls(editingImageUrls.filter((_, i) => i !== idx));
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Sizes and Inventory Stock Matrix */}
              <div>
                <label className="block font-bold text-neutral-800 mb-1">
                  Sizes & Inventory Stock (Units Available across XS - 5XL)
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-9 gap-1.5 bg-[#FAF6F0] p-3 rounded-2xl border border-[#EADBDA]">
                  {editingVariants.map((variant, idx) => (
                    <div key={variant.size} className="text-center">
                      <span className="block font-bold text-neutral-800 text-[10px] mb-1">
                        {variant.size}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={variant.stock}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          const updated = [...editingVariants];
                          updated[idx] = { ...updated[idx], stock: val };
                          setEditingVariants(updated);
                        }}
                        className="w-full text-center bg-white border border-neutral-300 rounded-lg py-1 px-1 text-xs font-bold text-neutral-900 focus:border-[#7B2435]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-800 mb-1">Product Description</label>
                <textarea
                  rows={3}
                  value={editingProduct?.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Detailed description of craftsmanship, embroidery, fit and styling..."
                  className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl p-3 text-neutral-800"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingProduct?.isBestseller}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isBestseller: e.target.checked })}
                    className="accent-[#7B2435]"
                  />
                  <span className="font-semibold">Mark as Bestseller</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!editingProduct?.isNewArrival}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isNewArrival: e.target.checked })}
                    className="accent-[#7B2435]"
                  />
                  <span className="font-semibold">Mark as New Arrival</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#7B2435] text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-md hover:bg-[#621c2a] transition mt-4"
              >
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin GST Tax Invoice Modal */}
      <InvoiceModal
        isOpen={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
        order={invoiceOrder}
      />
    </div>
  );
};
