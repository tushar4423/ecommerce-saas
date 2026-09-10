import React, { useState } from 'react';
import { X, MapPin, Sparkles } from 'lucide-react';
import { UserAddress } from '../../types';

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Omit<UserAddress, 'id'>) => void;
  initialData?: UserAddress | null;
}

const PINCODE_LOOKUP: Record<string, { city: string; state: string }> = {
  '560038': { city: 'Bengaluru', state: 'Karnataka' },
  '560001': { city: 'Bengaluru', state: 'Karnataka' },
  '560100': { city: 'Bengaluru', state: 'Karnataka' },
  '110001': { city: 'New Delhi', state: 'Delhi' },
  '110016': { city: 'New Delhi', state: 'Delhi' },
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '400050': { city: 'Mumbai', state: 'Maharashtra' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu' },
  '700001': { city: 'Kolkata', state: 'West Bengal' },
  '500001': { city: 'Hyderabad', state: 'Telangana' },
  '380001': { city: 'Ahmedabad', state: 'Gujarat' },
  '302001': { city: 'Jaipur', state: 'Rajasthan' },
  '226001': { city: 'Lucknow', state: 'Uttar Pradesh' },
  '411001': { city: 'Pune', state: 'Maharashtra' },
  '682001': { city: 'Kochi', state: 'Kerala' },
  '452001': { city: 'Indore', state: 'Madhya Pradesh' },
  '395001': { city: 'Surat', state: 'Gujarat' },
  '160017': { city: 'Chandigarh', state: 'Punjab' },
};

export const AddressFormModal: React.FC<AddressFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [fullName, setFullName] = useState(initialData?.fullName || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [addressLine1, setAddressLine1] = useState(initialData?.addressLine1 || '');
  const [addressLine2, setAddressLine2] = useState(initialData?.addressLine2 || '');
  const [landmark, setLandmark] = useState(initialData?.landmark || '');
  const [city, setCity] = useState(initialData?.city || 'Bengaluru');
  const [state, setState] = useState(initialData?.state || 'Karnataka');
  const [pincode, setPincode] = useState(initialData?.pincode || '560038');
  const [type, setType] = useState<'Home' | 'Work' | 'Other'>((initialData?.type as 'Home' | 'Work' | 'Other') || 'Home');
  const [isDefault, setIsDefault] = useState(initialData?.isDefault || false);
  const [pincodeMessage, setPincodeMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePincodeChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    if (clean.length === 6) {
      if (PINCODE_LOOKUP[clean]) {
        setCity(PINCODE_LOOKUP[clean].city);
        setState(PINCODE_LOOKUP[clean].state);
        setPincodeMessage(`Auto-detected: ${PINCODE_LOOKUP[clean].city}, ${PINCODE_LOOKUP[clean].state}`);
      } else {
        setPincodeMessage('Valid Indian pincode');
      }
    } else {
      setPincodeMessage(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !addressLine1 || !pincode || !city || !state) {
      alert('Please fill all mandatory address fields marked with *');
      return;
    }

    onSave({
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      type,
      isDefault,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#F0E6E1] animate-fade-in overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-[#F0E6E1] mb-6">
          <div className="flex items-center gap-2 text-[#7B2435]">
            <MapPin className="w-5 h-5" />
            <h3 className="font-serif text-lg font-bold text-neutral-900">
              {initialData ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-neutral-800 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800 focus:outline-none focus:border-[#7B2435]"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-800 mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800 focus:outline-none focus:border-[#7B2435]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-neutral-800 mb-1">Flat / House No. / Building / Street *</label>
            <input
              type="text"
              required
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="e.g. Flat 402, Royal Palms, 100 Ft Road"
              className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800 focus:outline-none focus:border-[#7B2435]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-neutral-800 mb-1">Area / Locality</label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="e.g. Indiranagar"
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800 focus:outline-none focus:border-[#7B2435]"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-800 mb-1">Landmark (Optional)</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Metro Gate 2"
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800 focus:outline-none focus:border-[#7B2435]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-neutral-800 mb-1">PIN Code *</label>
              <input
                type="text"
                maxLength={6}
                required
                value={pincode}
                onChange={(e) => handlePincodeChange(e.target.value)}
                placeholder="6-digit PIN"
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800 focus:outline-none focus:border-[#7B2435]"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-800 mb-1">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800 focus:outline-none focus:border-[#7B2435]"
              />
            </div>
            <div>
              <label className="block font-bold text-neutral-800 mb-1">State *</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
                className="w-full bg-[#FAF6F0] border border-[#EADBDA] rounded-xl px-3.5 py-2.5 text-neutral-800 focus:outline-none focus:border-[#7B2435]"
              />
            </div>
          </div>

          {pincodeMessage && (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{pincodeMessage}</span>
            </div>
          )}

          {/* Address Type */}
          <div>
            <label className="block font-bold text-neutral-800 mb-1.5">Address Type</label>
            <div className="flex gap-3">
              {(['Home', 'Work', 'Other'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-xl font-bold transition border ${
                    type === t
                      ? 'bg-[#7B2435] text-white border-[#7B2435]'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="set-default-check"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="accent-[#7B2435] w-4 h-4 rounded"
            />
            <label htmlFor="set-default-check" className="text-xs text-neutral-700 cursor-pointer">
              Set as primary default delivery address
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#7B2435] hover:bg-[#621c2a] text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition mt-4 cursor-pointer"
          >
            Save Address
          </button>
        </form>
      </div>
    </div>
  );
};
