import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Save, 
  MapPin, 
  DollarSign, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  PackageCheck,
  Building2,
  Clock,
  Ban
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { ShippingConfig, DeliveryProvider } from '../../types';
import { 
  useGetShippingSettingsQuery, 
  useUpdateShippingSettingsMutation,
  useCreateAuditLogMutation 
} from '../../store/api/ecommerceApi';
import { useToast } from '../../hooks/useToast';

export const ShippingSettingsManager: React.FC = () => {
  const toast = useToast();
  const { data: shippingConfig, isLoading } = useGetShippingSettingsQuery();
  const [updateShippingSettings, { isLoading: isSaving }] = useUpdateShippingSettingsMutation();
  const [createAuditLog] = useCreateAuditLogMutation();

  const [activeTab, setActiveTab] = useState<'rates' | 'providers' | 'pincodes'>('rates');

  const [formData, setFormData] = useState<ShippingConfig>({
    freeShippingThreshold: 999,
    standardShippingFee: 99,
    expressShippingFee: 199,
    expressAvailable: true,
    expressDeliveryDays: '1-2 business days',
    codAvailable: true,
    codFee: 49,
    codMinOrder: 299,
    codMaxOrder: 15000,
    deliveryProviders: [
      { id: 'prov-1', name: 'Shiprocket Multi-Carrier', code: 'shiprocket', isActive: true, trackingUrlTemplate: 'https://shiprocket.co/tracking/{tracking_id}', isPrimary: true },
      { id: 'prov-2', name: 'Blue Dart Air Express', code: 'bluedart', isActive: true, trackingUrlTemplate: 'https://www.bluedart.com/tracking?trackid={tracking_id}', isPrimary: false },
      { id: 'prov-3', name: 'Delhivery Surface & Express', code: 'delhivery', isActive: true, trackingUrlTemplate: 'https://www.delhivery.com/track/package/{tracking_id}', isPrimary: false },
      { id: 'prov-4', name: 'DTDC Courier', code: 'dtdc', isActive: false, trackingUrlTemplate: 'https://www.dtdc.in/tracking/{tracking_id}', isPrimary: false },
    ],
    pincodeRules: {
      restrictedPincodes: ['190001', '795001'],
      codBlacklistedPincodes: ['110099', '400099'],
      remoteAreaSurcharge: 120,
    },
  });

  const [newRestrictedPin, setNewRestrictedPin] = useState('');
  const [newCodBlockedPin, setNewCodBlockedPin] = useState('');

  useEffect(() => {
    if (shippingConfig) {
      setFormData(shippingConfig);
    }
  }, [shippingConfig]);

  const handleSave = async () => {
    try {
      await updateShippingSettings(formData).unwrap();
      await createAuditLog({
        adminId: 'adm-current',
        adminName: 'Admin User',
        adminEmail: 'admin@vedaaya.in',
        action: 'settings_update',
        entityType: 'ShippingConfig',
        entityId: 'shipping_settings',
        entityName: 'Store Shipping Settings',
        details: `Updated shipping rates (Free shipping at ₹${formData.freeShippingThreshold}, Standard ₹${formData.standardShippingFee}, COD fee ₹${formData.codFee})`,
        newValue: formData,
      });
      toast.success('Shipping settings & delivery configurations updated live!');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save shipping settings');
    }
  };

  const handleToggleProvider = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      deliveryProviders: (prev.deliveryProviders || []).map((prov) =>
        prov.id === id ? { ...prov, isActive: !prov.isActive } : prov
      ),
    }));
  };

  const handleSetPrimaryProvider = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      deliveryProviders: (prev.deliveryProviders || []).map((prov) => ({
        ...prov,
        isPrimary: prov.id === id,
      })),
    }));
  };

  const handleAddRestrictedPin = () => {
    if (!newRestrictedPin.trim()) return;
    if (formData.pincodeRules?.restrictedPincodes?.includes(newRestrictedPin.trim())) {
      toast.error('Pincode already in restricted list');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      pincodeRules: {
        ...(prev.pincodeRules || {}),
        restrictedPincodes: [...(prev.pincodeRules?.restrictedPincodes || []), newRestrictedPin.trim()],
      },
    }));
    setNewRestrictedPin('');
  };

  const handleRemoveRestrictedPin = (pin: string) => {
    setFormData((prev) => ({
      ...prev,
      pincodeRules: {
        ...(prev.pincodeRules || {}),
        restrictedPincodes: (prev.pincodeRules?.restrictedPincodes || []).filter((p) => p !== pin),
      },
    }));
  };

  const handleAddCodBlockedPin = () => {
    if (!newCodBlockedPin.trim()) return;
    if (formData.pincodeRules?.codBlacklistedPincodes?.includes(newCodBlockedPin.trim())) {
      toast.error('Pincode already in COD blacklist');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      pincodeRules: {
        ...(prev.pincodeRules || {}),
        codBlacklistedPincodes: [...(prev.pincodeRules?.codBlacklistedPincodes || []), newCodBlockedPin.trim()],
      },
    }));
    setNewCodBlockedPin('');
  };

  const handleRemoveCodBlockedPin = (pin: string) => {
    setFormData((prev) => ({
      ...prev,
      pincodeRules: {
        ...(prev.pincodeRules || {}),
        codBlacklistedPincodes: (prev.pincodeRules?.codBlacklistedPincodes || []).filter((p) => p !== pin),
      },
    }));
  };

  const tabs = [
    { id: 'rates', label: '1. Shipping Rates & COD Rules', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'providers', label: '2. Courier & Delivery Partners', icon: <Truck className="w-4 h-4" /> },
    { id: 'pincodes', label: '3. Pincode Restrictions & Zones', icon: <MapPin className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return <div className="p-8 text-center text-neutral-400">Loading shipping configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Shipping & Delivery Configuration"
        subtitle="Manage free shipping thresholds, standard/express rates, Cash on Delivery rules, delivery partners, and pincode restrictions."
        actions={
          <Button
            variant="primary"
            size="md"
            isLoading={isSaving}
            onClick={handleSave}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Shipping Rules
          </Button>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id: any) => setActiveTab(id)} variant="cards" />

      {/* Tab 1: Rates & COD */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#7B2435]" />
              Shipping Rates & Free Shipping Threshold
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="Free Shipping Order Minimum (₹)"
                type="number"
                min={0}
                required
                helperText="Orders with cart value at or above this amount get 100% Free Shipping"
                value={formData.freeShippingThreshold}
                onChange={(e) => setFormData((p) => ({ ...p, freeShippingThreshold: Number(e.target.value) || 0 }))}
              />

              <Input
                label="Standard Flat Shipping Fee (₹)"
                type="number"
                min={0}
                required
                helperText="Applied to orders below the free shipping threshold"
                value={formData.standardShippingFee}
                onChange={(e) => setFormData((p) => ({ ...p, standardShippingFee: Number(e.target.value) || 0 }))}
              />
            </div>

            {/* Express Delivery Options */}
            <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#7B2435]" />
                    Express Air Delivery Option
                  </h4>
                  <p className="text-xs text-neutral-500">Allow customers to choose priority 1-2 day express shipping during checkout.</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.expressAvailable}
                    onChange={(e) => setFormData((p) => ({ ...p, expressAvailable: e.target.checked }))}
                    className="w-5 h-5 accent-[#7B2435]"
                  />
                  <span className="text-xs font-bold text-neutral-800">
                    {formData.expressAvailable ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>

              {formData.expressAvailable && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <Input
                    label="Express Surcharge (₹)"
                    type="number"
                    value={formData.expressShippingFee || 199}
                    onChange={(e) => setFormData((p) => ({ ...p, expressShippingFee: Number(e.target.value) || 0 }))}
                  />
                  <Input
                    label="Express Delivery Estimate Text"
                    value={formData.expressDeliveryDays || '1-2 business days'}
                    onChange={(e) => setFormData((p) => ({ ...p, expressDeliveryDays: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Cash on Delivery (COD) Rules */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#7B2435]" />
                  Cash on Delivery (COD) Rules
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">Control COD availability, extra handling fee, and checkout order limits.</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.codAvailable}
                  onChange={(e) => setFormData((p) => ({ ...p, codAvailable: e.target.checked }))}
                  className="w-5 h-5 accent-[#7B2435]"
                />
                <span className="text-xs font-bold text-neutral-800">
                  {formData.codAvailable ? 'COD Enabled' : 'COD Disabled'}
                </span>
              </label>
            </div>

            {formData.codAvailable && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                <Input
                  label="COD Handling Charge (₹)"
                  type="number"
                  min={0}
                  helperText="Fixed COD fee added to invoice"
                  value={formData.codFee}
                  onChange={(e) => setFormData((p) => ({ ...p, codFee: Number(e.target.value) || 0 }))}
                />

                <Input
                  label="Minimum Cart Value for COD (₹)"
                  type="number"
                  min={0}
                  helperText="Orders below this amount must pay online"
                  value={formData.codMinOrder || 299}
                  onChange={(e) => setFormData((p) => ({ ...p, codMinOrder: Number(e.target.value) || 0 }))}
                />

                <Input
                  label="Maximum Cart Value for COD (₹)"
                  type="number"
                  min={0}
                  helperText="Orders above this amount must pay online"
                  value={formData.codMaxOrder || 15000}
                  onChange={(e) => setFormData((p) => ({ ...p, codMaxOrder: Number(e.target.value) || 0 }))}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Delivery Providers */}
      {activeTab === 'providers' && (
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#7B2435]" />
                Integrated Delivery & Courier Partners
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Enable 3PL courier integrations and set default tracking link templates for automatic customer SMS/Email alerts.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {(formData.deliveryProviders || []).map((prov) => (
              <div
                key={prov.id}
                className={`p-5 rounded-2xl border transition-all ${
                  prov.isActive ? 'bg-white border-neutral-300 shadow-xs' : 'bg-neutral-50 border-neutral-200 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#7B2435]/10 text-[#7B2435] flex items-center justify-center font-bold">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-neutral-900">{prov.name}</h4>
                        {prov.isPrimary && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                            ★ Primary Default
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-neutral-100 text-neutral-600">
                          {prov.code}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 font-mono mt-1">{prov.trackingUrlTemplate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {!prov.isPrimary && prov.isActive && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryProvider(prov.id)}
                        className="px-3 py-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer transition"
                      >
                        Make Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleProvider(prov.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition ${
                        prov.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                      }`}
                    >
                      {prov.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Pincode Restrictions */}
      {activeTab === 'pincodes' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#7B2435]" />
                Pincode Restrictions & Delivery Zones
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Block unserviceable pincodes and restrict COD delivery in high RTO (Return-to-Origin) geographic locations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Unserviceable Pincodes */}
              <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                    <Ban className="w-4 h-4 text-rose-600" />
                    Completely Unserviceable Pincodes
                  </h4>
                  <span className="text-xs font-bold text-neutral-500">
                    {formData.pincodeRules?.restrictedPincodes?.length || 0} Blocked
                  </span>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Enter 6-digit Pincode (e.g. 190001)"
                    value={newRestrictedPin}
                    onChange={(e) => setNewRestrictedPin(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddRestrictedPin}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                  >
                    Block Pincode
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {(formData.pincodeRules?.restrictedPincodes || []).map((pin) => (
                    <span
                      key={pin}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold"
                    >
                      {pin}
                      <button
                        type="button"
                        onClick={() => handleRemoveRestrictedPin(pin)}
                        className="hover:text-rose-900 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* COD Blacklisted Pincodes */}
              <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    COD-Restricted Pincodes (Prepaid Only)
                  </h4>
                  <span className="text-xs font-bold text-neutral-500">
                    {formData.pincodeRules?.codBlacklistedPincodes?.length || 0} Restrict COD
                  </span>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Enter 6-digit Pincode (e.g. 110099)"
                    value={newCodBlockedPin}
                    onChange={(e) => setNewCodBlockedPin(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddCodBlockedPin}
                    className="px-4 py-2 bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                  >
                    Restrict COD
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {(formData.pincodeRules?.codBlacklistedPincodes || []).map((pin) => (
                    <span
                      key={pin}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold"
                    >
                      {pin} (Prepaid Only)
                      <button
                        type="button"
                        onClick={() => handleRemoveCodBlockedPin(pin)}
                        className="hover:text-amber-900 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Remote Area Surcharge */}
            <div className="max-w-xs">
              <Input
                label="Remote / Island Area Special Surcharge (₹)"
                type="number"
                min={0}
                value={formData.pincodeRules?.remoteAreaSurcharge || 0}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    pincodeRules: {
                      ...(p.pincodeRules || {}),
                      remoteAreaSurcharge: Number(e.target.value) || 0,
                    },
                  }))
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
