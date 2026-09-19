import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { api } from '../services/api';
import { User, UserAddress } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  isAdminAuthenticated: boolean;
  loginWithGoogle: (redirectUrl?: string) => Promise<User | null>;
  loginAdminWithGoogle: () => Promise<User | null>;
  loginWithCredentials: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  lockAdminSession: () => void;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  addAddress: (address: Omit<UserAddress, 'id'>) => Promise<UserAddress>;
  updateAddress: (id: string, address: Partial<UserAddress>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
}

const ADMIN_TOKEN_KEY = 'vedaaya_admin_token';
const CUSTOMER_TOKEN_KEY = 'vedaaya_customer_token';
const ADMIN_REDIRECT_KEY = 'vedaaya_admin_google_redirect';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function asUser(value: Partial<User>, role: 'admin' | 'customer'): User {
  return {
    ...value,
    id: String(value.id || ''),
    name: value.name || (role === 'admin' ? 'Vedaaya Administrator' : 'Vedaaya Customer'),
    email: value.email || '',
    phone: value.phone || '',
    avatarUrl: value.avatarUrl,
    role,
    authProvider: value.authProvider || 'google',
    addresses: value.addresses || [],
    createdAt: value.createdAt,
    lastLoginAt: value.lastLoginAt || new Date().toISOString(),
  } as User;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const adminLoginInProgress = useRef(false);

  const applyCustomerSession = async (fbUser: FirebaseUser): Promise<User> => {
    const idToken = await fbUser.getIdToken();
    const response = await api.verifyGoogleToken({ credential: idToken });
    if (!response.success || !response.token || !response.user) {
      throw new Error('The server did not create a customer session.');
    }

    localStorage.setItem(CUSTOMER_TOKEN_KEY, response.token);
    const customer = asUser(response.user, 'customer');
    setUser(customer);
    setIsAdminAuthenticated(false);
    return customer;
  };

  const applyAdminSession = (response: any): User => {
    if (!response?.success || !response?.token || !response?.user) {
      throw new Error(response?.error || 'Administrator authentication failed.');
    }

    localStorage.setItem(ADMIN_TOKEN_KEY, response.token);
    const administrator = asUser(response.user, 'admin');
    setUser(administrator);
    setIsAdminAuthenticated(true);
    return administrator;
  };

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!active) return;
      setFirebaseUser(fbUser);

      try {
        const storedAdminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
        if (storedAdminToken) {
          const session = await api.adminGetMe(storedAdminToken);
          if (session?.authenticated && session.user) {
            setUser(asUser(session.user, 'admin'));
            setIsAdminAuthenticated(true);
            return;
          } else if (session?.isNetworkError) {
            setIsAdminAuthenticated(true);
            return;
          }
          if (session?.error === 'Session expired') {
            localStorage.removeItem(ADMIN_TOKEN_KEY);
          }
        }

        if (fbUser && !adminLoginInProgress.current) {
          await applyCustomerSession(fbUser);
        } else if (!fbUser) {
          localStorage.removeItem(CUSTOMER_TOKEN_KEY);
          const hasAdminToken = !!localStorage.getItem(ADMIN_TOKEN_KEY);
          if (!hasAdminToken) {
            setUser(null);
            setIsAdminAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Authentication session restore failed:', error);
        localStorage.removeItem(CUSTOMER_TOKEN_KEY);
        const hasAdminToken = !!localStorage.getItem(ADMIN_TOKEN_KEY);
        if (!hasAdminToken) {
          setUser(null);
          setIsAdminAuthenticated(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    void getRedirectResult(auth).then(async (result) => {
      if (!active || !result?.user) return;
      const isAdminRedirect = localStorage.getItem(ADMIN_REDIRECT_KEY) === '1';
      localStorage.removeItem(ADMIN_REDIRECT_KEY);

      if (isAdminRedirect) {
        adminLoginInProgress.current = true;
        try {
          const idToken = await result.user.getIdToken();
          const response = await api.adminLogin(result.user.email || '', undefined, idToken);
          applyAdminSession(response);
          window.location.hash = '/admin';
        } finally {
          adminLoginInProgress.current = false;
        }
      }
    }).catch((error) => {
      console.error('Google redirect sign-in failed:', error);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async (redirectUrl?: string): Promise<User | null> => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const customer = await applyCustomerSession(result.user);
      if (redirectUrl) window.location.hash = redirectUrl;
      return customer;
    } catch (error: any) {
      if (error?.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      console.error('Google sign-in failed:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loginAdminWithGoogle = async (): Promise<User | null> => {
    adminLoginInProgress.current = true;
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const response = await api.adminLogin(result.user.email || '', undefined, idToken);
      const administrator = applyAdminSession(response);
      window.location.hash = '/admin';
      return administrator;
    } catch (error: any) {
      if (error?.code === 'auth/popup-blocked') {
        localStorage.setItem(ADMIN_REDIRECT_KEY, '1');
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      console.error('Administrator Google sign-in failed:', error);
      return null;
    } finally {
      adminLoginInProgress.current = false;
      setLoading(false);
    }
  };

  const loginWithCredentials = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.adminLogin(email.trim().toLowerCase(), password);
      applyAdminSession(response);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: errorMessage(error, 'Invalid administrator email or password.'),
      };
    }
  };

  const lockAdminSession = () => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setIsAdminAuthenticated(false);
    if (user?.role === 'admin') setUser(null);
    void api.adminLogout(token || undefined);
  };

  const logout = async () => {
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    await api.adminLogout(adminToken || undefined);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);

    try {
      await firebaseSignOut(auth);
    } catch {
      // The local server sessions have already been cleared.
    }

    setFirebaseUser(null);
    setIsAdminAuthenticated(false);
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const updated = user.role === 'admin'
      ? await api.updateAdminProfile(data)
      : await api.updateMyProfile(data);
    setUser(asUser(updated, user.role === 'admin' ? 'admin' : 'customer'));
  };

  const addAddress = async (addressData: Omit<UserAddress, 'id'>): Promise<UserAddress> => {
    if (!user) throw new Error('Please sign in before adding an address.');
    const address = await api.addCustomerAddress(user.id, addressData);
    const addresses = await api.getCustomerAddresses(user.id);
    setUser({ ...user, addresses });
    return address;
  };

  const updateAddress = async (id: string, addressData: Partial<UserAddress>) => {
    if (!user) throw new Error('Please sign in before updating an address.');
    await api.updateCustomerAddress(user.id, id, addressData);
    const addresses = await api.getCustomerAddresses(user.id);
    setUser({ ...user, addresses });
  };

  const deleteAddress = async (id: string) => {
    if (!user) throw new Error('Please sign in before deleting an address.');
    await api.deleteCustomerAddress(user.id, id);
    const addresses = await api.getCustomerAddresses(user.id);
    setUser({ ...user, addresses });
  };

  const setDefaultAddress = async (id: string) => {
    if (!user) throw new Error('Please sign in before updating an address.');
    await api.setDefaultCustomerAddress(user.id, id);
    const addresses = await api.getCustomerAddresses(user.id);
    setUser({ ...user, addresses });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isAdmin: user?.role === 'admin' && isAdminAuthenticated,
        isAdminAuthenticated,
        loginWithGoogle,
        loginAdminWithGoogle,
        loginWithCredentials,
        lockAdminSession,
        logout,
        updateProfile,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
