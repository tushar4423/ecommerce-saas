import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Percent, Tag } from 'lucide-react';
import { DataTable, Column } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Coupon } from '../../types';
import {
  useGetCouponsQuery,
  useSaveCouponMutation,
  useDeleteCouponMutation,
} from '../../store/api/ecommerceApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useToast } from '../../hooks/useToast';

export const CouponManager: React.FC = () => {
  const toast = useToast();
  const { data: coupons = [], isLoading } = useGetCouponsQuery();
  const [saveCoupon] = useSaveCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Coupon>({
    id: '',
    code: '',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 999,
    maxDiscountAmount: 500,
    validUntil: '2027-12-31',
    active: true,
    description: '',
  });

  const handleOpenCreate = () => {
    setFormData({
      id: `cpn-${Date.now()}`,
      code: 'NANDITA15',
      discountType: 'percentage',
      discountValue: 15,
      minOrderAmount: 999,
      maxDiscountAmount: 500,
      validUntil: '2027-12-31',
      active: true,
      description: 'Get Flat 15% OFF on minimum purchase of ₹999',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setFormData(c);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this discount coupon?')) {
      try {
        await deleteCoupon(id).unwrap();
        toast.success('Coupon removed.');
      } catch (err: any) {
        toast.error(err?.message || 'Failed to delete coupon');
      }
    }
  };

  const handleSave = async () => {
    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }
    try {
      await saveCoupon({ ...formData, code: formData.code.toUpperCase().trim() }).unwrap();
      toast.success(`Coupon "${formData.code.toUpperCase()}" saved!`);
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save coupon');
    }
  };

  const columns: Column<Coupon>[] = [
    {
      key: 'code',
      header: 'Coupon Code',
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold bg-[#FFF0F3] text-[#7B2435] px-2.5 py-1 rounded-md border border-[#EADBDA]">
            {c.code}
          </span>
          <span className="text-xs text-neutral-500">{c.description}</span>
        </div>
      ),
    },
    {
      key: 'discount',
      header: 'Benefit',
      render: (c) => (
        <span className="font-bold text-emerald-700">
          {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `Flat ${formatCurrency(c.discountValue)} OFF`}
        </span>
      ),
    },
    {
      key: 'minOrderAmount',
      header: 'Min Order',
      render: (c) => <span>{formatCurrency(c.minOrderAmount)}</span>,
    },
    {
      key: 'validUntil',
      header: 'Valid Until',
      render: (c) => <span className="text-xs text-neutral-500">{formatDate(c.validUntil)}</span>,
    },
    {
      key: 'active',
      header: 'Status',
      render: (c) => <StatusBadge status={c.active ? 'Active' : 'Inactive'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => handleOpenEdit(c)}
            className="p-1.5 text-neutral-500 hover:text-[#7B2435] hover:bg-[#FFF0F3] rounded-lg cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(c.id || c.code)}
            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discounts & Promo Coupons"
        subtitle="Manage seasonal promo codes, first-order discounts, and cart voucher rules."
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenCreate}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Coupon
          </Button>
        }
      />

      <DataTable
        data={coupons}
        columns={columns}
        keyExtractor={(c) => c.id || c.code}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search coupons by code or description..."
        searchFilter={(c, q) => {
          const cleanQ = q.trim().toLowerCase();
          return (
            (c.code || '').toLowerCase().includes(cleanQ) ||
            (c.description || '').toLowerCase().includes(cleanQ)
          );
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Coupon Rule Configuration"
        footer={
          <>
            <Button variant="outline" size="md" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleSave}>
              Save Coupon
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Coupon Code"
              required
              placeholder="e.g. FESTIVE20"
              value={formData.code}
              onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
            />

            <Select
              label="Discount Type"
              value={formData.discountType}
              onChange={(e) => setFormData((p) => ({ ...p, discountType: e.target.value as any }))}
              options={[
                { value: 'percentage', label: 'Percentage (%)' },
                { value: 'flat', label: 'Flat Amount (₹)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Discount Value"
              type="number"
              value={formData.discountValue}
              onChange={(e) => setFormData((p) => ({ ...p, discountValue: Number(e.target.value) }))}
            />

            <Input
              label="Min Order Amount (₹)"
              type="number"
              value={formData.minOrderAmount}
              onChange={(e) => setFormData((p) => ({ ...p, minOrderAmount: Number(e.target.value) }))}
            />

            <Input
              label="Valid Until Date"
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData((p) => ({ ...p, validUntil: e.target.value }))}
            />
          </div>

          <Input
            label="Promo Description"
            placeholder="e.g. Flat 15% off on your festive ethnic wardrobe"
            value={formData.description || ''}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
};
