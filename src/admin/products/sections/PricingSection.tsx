import React from 'react';
import { Input } from '../../../components/ui/Input';
import { Product } from '../../../types';
import { calculateDiscount, formatCurrency } from '../../../utils/formatters';

export interface PricingSectionProps {
  formData: Partial<Product>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Product>>>;
  errors: Record<string, string>;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  formData,
  setFormData,
  errors,
}) => {
  const mrp = typeof formData.mrp === 'number' ? formData.mrp : Number(formData.mrp) || 0;
  const sellingPrice =
    typeof formData.sellingPrice === 'number'
      ? formData.sellingPrice
      : Number(formData.sellingPrice) || 0;

  const discountPercent =
    mrp > sellingPrice && mrp > 0 ? calculateDiscount(mrp, sellingPrice) : 0;
  const savings = mrp > sellingPrice && mrp > 0 ? mrp - sellingPrice : 0;

  const handleMrpChange = (val: string) => {
    const numMrp = val === '' ? 0 : Number(val);
    setFormData((prev) => {
      const sp = Number(prev.sellingPrice) || 0;
      const disc = numMrp > sp && numMrp > 0 ? calculateDiscount(numMrp, sp) : 0;
      return { ...prev, mrp: numMrp, discountPercent: disc };
    });
  };

  const handleSellingPriceChange = (val: string) => {
    const sp = val === '' ? 0 : Number(val);
    setFormData((prev) => {
      const m = Number(prev.mrp) || 0;
      const disc = m > sp && m > 0 ? calculateDiscount(m, sp) : 0;
      return { ...prev, sellingPrice: sp, discountPercent: disc };
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Maximum Retail Price (MRP in ₹)"
          required
          type="number"
          min={1}
          placeholder="e.g. 1999"
          value={formData.mrp !== undefined && formData.mrp !== 0 ? formData.mrp : ''}
          onChange={(e) => handleMrpChange(e.target.value)}
          error={errors.mrp}
          helperText="The original tag price before discount"
        />

        <Input
          label="Discounted Selling Price (₹)"
          required
          type="number"
          min={1}
          placeholder="e.g. 1499"
          value={formData.sellingPrice !== undefined && formData.sellingPrice !== 0 ? formData.sellingPrice : ''}
          onChange={(e) => handleSellingPriceChange(e.target.value)}
          error={errors.sellingPrice}
          helperText="The final price the customer pays"
        />
      </div>

      {/* Real-time Pricing Summary Card */}
      <div className="p-4 rounded-xl bg-[#FFF0F3] border border-[#EADBDA] flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#7B2435]">
            Calculated Discount
          </span>
          <p className="text-xl font-bold text-neutral-900 mt-0.5">
            {discountPercent}% OFF
          </p>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Customer Savings
          </span>
          <p className="text-lg font-bold text-emerald-700 mt-0.5">
            {formatCurrency(savings)}
          </p>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Tax Inclusion
          </span>
          <p className="text-xs text-neutral-600 font-semibold mt-1">
            Inclusive of 5% GST on Apparels
          </p>
        </div>
      </div>
    </div>
  );
};
