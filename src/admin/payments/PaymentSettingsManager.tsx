import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Save, 
  ShieldCheck, 
  Lock, 
  Key, 
  CheckCircle2, 
  AlertTriangle, 
  Smartphone, 
  Landmark, 
  Wallet, 
  RefreshCcw,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { PaymentGatewayConfig } from '../../types';
import { 
  useGetPaymentSettingsQuery, 
  useUpdatePaymentSettingsMutation,
  useCreateAuditLogMutation 
} from '../../store/api/ecommerceApi';
import { useToast } from '../../hooks/useToast';

export const PaymentSettingsManager: React.FC = () => {
  const toast = useToast();
  const { data: paymentConfig, isLoading } = useGetPaymentSettingsQuery();
  const [updatePaymentSettings, { isLoading: isSaving }] = useUpdatePaymentSettingsMutation();
  const [createAuditLog] = useCreateAuditLogMutation();

  const [activeTab, setActiveTab] = useState<'gateways' | 'methods' | 'compliance'>('gateways');

  const [formData, setFormData] = useState<PaymentGatewayConfig>({
    primaryGateway: 'razorpay',
    currency: 'INR',
    currencySymbol: '₹',
    razorpay: {
      enabled: true,
      mode: 'test',
      keyId: 'rzp_test_1DP5mmOlF5G5ag',
      isSecretConfigured: true,
      webhookConfigured: true,
    },
    cashfree: {
      enabled: false,
      mode: 'test',
      appId: 'TEST_CF_APP_8831',
      isSecretConfigured: true,
    },
    stripe: {
      enabled: false,
      mode: 'test',
      publishableKey: 'pk_test_51...SAMPLE',
      isSecretConfigured: true,
    },
    cod: {
      enabled: true,
      maxLimit: 15000,
      extraFee: 49,
    },
    enabledMethods: {
      upi: true,
      cards: true,
      netbanking: true,
      wallets: true,
      emi: false,
    },
    autoRefundOnCancel: true,
  });

  useEffect(() => {
    if (paymentConfig) {
      setFormData(paymentConfig);
    }
  }, [paymentConfig]);

  const handleSave = async () => {
    try {
      await updatePaymentSettings(formData).unwrap();
      await createAuditLog({
        adminId: 'adm-current',
        adminName: 'Admin User',
        adminEmail: 'admin@vedaaya.in',
        action: 'settings_update',
        entityType: 'PaymentGatewayConfig',
        entityId: 'payment_settings',
        entityName: 'Store Payment Gateway Configuration',
        details: `Configured payment gateways (Primary: ${formData.primaryGateway}, Razorpay Mode: ${formData.razorpay?.mode}, COD: ${formData.cod?.enabled ? 'Active' : 'Disabled'})`,
        newValue: formData,
      });
      toast.success('Payment gateway settings updated successfully!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save payment settings');
    }
  };

  const tabs = [
    { id: 'gateways', label: '1. Payment Gateways (Razorpay / Cashfree / Stripe)', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'methods', label: '2. Payment Methods & UPI', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'compliance', label: '3. Security & Currency Rules', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-neutral-400">Loading payment gateway configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Payment Gateways & Secure Configuration"
        subtitle="Manage checkout payment gateways, sandbox/live mode, API keys, UPI, netbanking, cards, and secure backend secrets."
        actions={
          <Button
            variant="primary"
            size="md"
            isLoading={isSaving}
            onClick={handleSave}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Payment Settings
          </Button>
        }
      />

      {/* Security Architecture Callout */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900">
          <strong className="font-bold">Zero-Exposure Security Architecture:</strong>
          <span className="ml-1">
            Private Gateway Key Secrets (`RAZORPAY_KEY_SECRET`, `STRIPE_SECRET_KEY`) reside exclusively in backend environment variables. Only client-safe public Key IDs are exchanged with the browser.
          </span>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id: any) => setActiveTab(id)} variant="cards" />

      {/* Tab 1: Gateways */}
      {activeTab === 'gateways' && (
        <div className="space-y-6">
          {/* Primary Gateway Selector */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-neutral-900">Primary Payment Gateway</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label
                onClick={() => setFormData((p) => ({ ...p, primaryGateway: 'razorpay' }))}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between gap-2 ${
                  formData.primaryGateway === 'razorpay'
                    ? 'border-[#7B2435] bg-[#7B2435]/5'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-neutral-900">Razorpay (India)</span>
                  {formData.primaryGateway === 'razorpay' && <CheckCircle2 className="w-4 h-4 text-[#7B2435]" />}
                </div>
                <p className="text-[11px] text-neutral-500">Supports UPI QR, GPay, PhonePe, Cards, NetBanking, PayLater & Cred.</p>
              </label>

              <label
                onClick={() => setFormData((p) => ({ ...p, primaryGateway: 'cashfree' }))}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between gap-2 ${
                  formData.primaryGateway === 'cashfree'
                    ? 'border-[#7B2435] bg-[#7B2435]/5'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-neutral-900">Cashfree Payments</span>
                  {formData.primaryGateway === 'cashfree' && <CheckCircle2 className="w-4 h-4 text-[#7B2435]" />}
                </div>
                <p className="text-[11px] text-neutral-500">Instant settlements, native OTP, UPI auto-pay, and custom checkout.</p>
              </label>

              <label
                onClick={() => setFormData((p) => ({ ...p, primaryGateway: 'stripe' }))}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between gap-2 ${
                  formData.primaryGateway === 'stripe'
                    ? 'border-[#7B2435] bg-[#7B2435]/5'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-neutral-900">Stripe (Global)</span>
                  {formData.primaryGateway === 'stripe' && <CheckCircle2 className="w-4 h-4 text-[#7B2435]" />}
                </div>
                <p className="text-[11px] text-neutral-500">International cards, Apple Pay, Google Pay, and multi-currency billing.</p>
              </label>
            </div>
          </div>

          {/* Razorpay Configuration */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">Razorpay Configuration</h4>
                  <p className="text-xs text-neutral-500">Manage API keys and environment status</p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.razorpay?.enabled}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      razorpay: { ...(p.razorpay || { mode: 'test' }), enabled: e.target.checked },
                    }))
                  }
                  className="w-5 h-5 accent-[#7B2435]"
                />
                <span className="text-xs font-bold text-neutral-800">
                  {formData.razorpay?.enabled ? 'Active' : 'Disabled'}
                </span>
              </label>
            </div>

            {formData.razorpay?.enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Operating Environment</label>
                    <select
                      value={formData.razorpay?.mode || 'test'}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          razorpay: { ...(p.razorpay || {}), mode: e.target.value as 'test' | 'live' },
                        }))
                      }
                      className="w-full text-xs p-2.5 border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white font-medium"
                    >
                      <option value="test">🧪 Test / Sandbox Mode (Mock payments)</option>
                      <option value="live">🟢 Live / Production Mode (Real charges)</option>
                    </select>
                  </div>

                  <Input
                    label="Public Razorpay Key ID (Client-Safe)"
                    required
                    placeholder="rzp_test_..."
                    value={formData.razorpay?.keyId || ''}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        razorpay: { ...(p.razorpay || { mode: 'test' }), keyId: e.target.value },
                      }))
                    }
                  />
                </div>

                {/* Secret Key Status */}
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-neutral-800">Razorpay Secret Key</p>
                      <p className="text-[11px] text-neutral-500 font-mono">••••••••••••••••••••••••</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Backend Protected
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Cashfree & Stripe Accordions */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-neutral-900">Cashfree Gateway (Optional Backup)</h4>
                <p className="text-xs text-neutral-500">Enable as alternative payment routing</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.cashfree?.enabled}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      cashfree: { ...(p.cashfree || { mode: 'test' }), enabled: e.target.checked },
                    }))
                  }
                  className="w-5 h-5 accent-[#7B2435]"
                />
                <span className="text-xs font-bold text-neutral-800">
                  {formData.cashfree?.enabled ? 'Active' : 'Disabled'}
                </span>
              </label>
            </div>
            {formData.cashfree?.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Cashfree App ID"
                  value={formData.cashfree?.appId || ''}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      cashfree: { ...(p.cashfree || { mode: 'test' }), appId: e.target.value },
                    }))
                  }
                />
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between text-xs">
                  <span className="text-neutral-600 font-medium">Cashfree Secret Key:</span>
                  <span className="text-emerald-700 font-bold">Configured in Server .env</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Payment Methods */}
      {activeTab === 'methods' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-neutral-900">Enabled Customer Payment Methods</h3>
          <p className="text-xs text-neutral-500 -mt-4">
            Toggle which payment instruments customers can choose during checkout.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs">
                  UPI
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">UPI (GPay, PhonePe, Paytm, BHIM)</p>
                  <p className="text-[11px] text-neutral-500">Zero transaction fees for buyers with instant authorization</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.enabledMethods?.upi}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    enabledMethods: { ...(p.enabledMethods || {}), upi: e.target.checked },
                  }))
                }
                className="w-5 h-5 accent-[#7B2435]"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 cursor-pointer">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-neutral-900">Credit & Debit Cards</p>
                  <p className="text-[11px] text-neutral-500">Visa, Mastercard, RuPay, Maestro & Amex cards</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.enabledMethods?.cards}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    enabledMethods: { ...(p.enabledMethods || {}), cards: e.target.checked },
                  }))
                }
                className="w-5 h-5 accent-[#7B2435]"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 cursor-pointer">
              <div className="flex items-center gap-3">
                <Landmark className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-xs font-bold text-neutral-900">Net Banking</p>
                  <p className="text-[11px] text-neutral-500">50+ Indian banks including HDFC, ICICI, SBI, Axis, Kotak</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.enabledMethods?.netbanking}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    enabledMethods: { ...(p.enabledMethods || {}), netbanking: e.target.checked },
                  }))
                }
                className="w-5 h-5 accent-[#7B2435]"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 cursor-pointer">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-neutral-900">Digital Wallets</p>
                  <p className="text-[11px] text-neutral-500">Paytm Wallet, PhonePe Wallet, Amazon Pay, Mobikwik</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.enabledMethods?.wallets}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    enabledMethods: { ...(p.enabledMethods || {}), wallets: e.target.checked },
                  }))
                }
                className="w-5 h-5 accent-[#7B2435]"
              />
            </label>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Currency */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#7B2435]" />
              Store Currency & Invoice Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Currency Code"
                value={formData.currency || 'INR'}
                onChange={(e) => setFormData((p) => ({ ...p, currency: e.target.value }))}
              />
              <Input
                label="Currency Display Symbol"
                value={formData.currencySymbol || '₹'}
                onChange={(e) => setFormData((p) => ({ ...p, currencySymbol: e.target.value }))}
              />
            </div>

            {/* Auto Refund Toggle */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <RefreshCcw className="w-4 h-4 text-[#7B2435]" />
                  Automatic Instant Refund Trigger on Order Cancellation
                </p>
                <p className="text-[11px] text-neutral-500">When an order is cancelled by admin or customer before shipping, automatically trigger refund to source.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoRefundOnCancel}
                  onChange={(e) => setFormData((p) => ({ ...p, autoRefundOnCancel: e.target.checked }))}
                  className="w-5 h-5 accent-[#7B2435]"
                />
                <span className="text-xs font-bold text-neutral-800">
                  {formData.autoRefundOnCancel ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
