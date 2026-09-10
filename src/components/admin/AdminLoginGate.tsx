import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Key, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminLoginGateProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({ onSuccess, onCancel }) => {
  const { loginWithCredentials, loginAdminWithGoogle } = useAuth();
  const [email, setEmail] = useState('admin@vedaaya.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await loginWithCredentials(email, password);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMessage(res.error || 'Invalid administrator email or password.');
      }
    } catch {
      setErrorMessage('Authentication service error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const gUser = await loginAdminWithGoogle();
      if (gUser) {
        onSuccess();
      }
    } catch {
      setErrorMessage('Google Authentication failed. Please try password login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-4 sm:p-6 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#F0E6E1] shadow-xl overflow-hidden animate-fade-in">
        
        {/* Top Decorative Header */}
        <div className="bg-linear-to-r from-[#7B2435] to-[#5C1A27] p-6 text-white text-center relative">
          <button
            onClick={onCancel}
            className="absolute left-4 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            title="Return to store"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-6 h-6 text-amber-300" />
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 text-[10px] uppercase font-bold tracking-widest mb-1.5">
            <ShieldCheck className="w-3 h-3 text-amber-300" /> Secure Admin Access
          </span>
          <h2 className="font-serif text-2xl font-bold tracking-tight">Vedaaya Merchant Suite</h2>
          <p className="text-xs text-rose-100/80 mt-1">
            Please enter your administrator credentials to manage inventory & orders.
          </p>
        </div>

        {/* Credentials Form */}
        <div className="p-6 sm:p-8 space-y-6">

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vedaaya.com"
                  className="w-full bg-[#FAF6F0] text-xs text-neutral-900 pl-9 pr-4 py-3 rounded-xl border border-[#EADBDA] focus:outline-none focus:border-[#7B2435] focus:bg-white transition"
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FAF6F0] text-xs text-neutral-900 pl-9 pr-10 py-3 rounded-xl border border-[#EADBDA] focus:outline-none focus:border-[#7B2435] focus:bg-white transition font-mono"
                />
                <Key className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#7B2435] hover:bg-[#621c2a] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Authenticate & Open Admin Suite</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#F0E6E1] w-full"></div>
            <span className="bg-white px-3 text-[11px] uppercase font-bold text-neutral-400 absolute">
              Or
            </span>
          </div>

          {/* Google One-Tap Admin OAuth */}
          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={isLoading}
            className="w-full py-3 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Continue with Google Administrator Account</span>
          </button>

          <div className="text-center pt-2">
            <button
              onClick={onCancel}
              className="text-xs text-neutral-500 hover:text-neutral-800 underline transition"
            >
              Cancel and return to storefront
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
