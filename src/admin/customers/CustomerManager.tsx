import React from 'react';
import { User, Phone, Mail, MapPin } from 'lucide-react';
import { DataTable, Column } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusBadge } from '../../components/common/StatusBadge';
import { User as CustomerUser } from '../../types';
import { useGetCustomersQuery } from '../../store/api/ecommerceApi';
import { formatDate } from '../../utils/formatters';

export const CustomerManager: React.FC = () => {
  const { data: customers = [], isLoading } = useGetCustomersQuery();

  const columns: Column<CustomerUser>[] = [
    {
      key: 'name',
      header: 'Customer Details',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFF0F3] text-[#7B2435] flex items-center justify-center font-bold font-serif">
            {c.name ? c.name[0].toUpperCase() : 'U'}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-neutral-900">{c.name}</span>
            <span className="text-xs text-neutral-500">{c.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (c) => <span className="font-mono text-xs">{c.phone || '+91 98765 43210'}</span>,
    },
    {
      key: 'addresses',
      header: 'Saved Addresses',
      render: (c) => (
        <div className="flex flex-col text-xs text-neutral-600">
          <span>{c.addresses?.length || 0} addresses</span>
          {c.addresses?.[0] && (
            <span className="text-[11px] text-neutral-400">
              {c.addresses[0].city}, {c.addresses[0].state}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined Date',
      render: (c) => (
        <span className="text-xs text-neutral-500">
          {c.createdAt ? formatDate(c.createdAt) : 'Aug 2024'}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (c) => <StatusBadge status={c.role || 'customer'} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers & User Base"
        subtitle="View registered shoppers, contact numbers, order histories and delivery addresses."
      />

      <DataTable
        data={customers}
        columns={columns}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        searchable
        searchPlaceholder="Search customer by name, email, phone..."
        searchFilter={(c, q) => {
          const cleanQ = q.trim().toLowerCase();
          const digitsQ = cleanQ.replace(/\D/g, '');
          const name = (c.name || '').toLowerCase();
          const email = (c.email || '').toLowerCase();
          const phone = (c.phone || '');
          const digitsPhone = phone.replace(/\D/g, '');
          const addrText = (c.addresses || [])
            .map((a) => `${a.fullName || ''} ${a.city || ''} ${a.state || ''} ${a.pincode || ''} ${a.phone || ''}`)
            .join(' ')
            .toLowerCase();

          if (digitsQ.length >= 4 && digitsPhone.includes(digitsQ)) return true;
          return (
            name.includes(cleanQ) ||
            email.includes(cleanQ) ||
            phone.toLowerCase().includes(cleanQ) ||
            addrText.includes(cleanQ)
          );
        }}
      />
    </div>
  );
};
