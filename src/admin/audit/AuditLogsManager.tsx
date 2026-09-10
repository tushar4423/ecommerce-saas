import React, { useState } from 'react';
import { 
  Shield, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  Download, 
  Activity, 
  Lock, 
  RefreshCw,
  Tag
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useGetAuditLogsQuery } from '../../store/api/ecommerceApi';
import { AuditLog } from '../../types';
import { useToast } from '../../hooks/useToast';

const ACTION_COLORS: Record<string, string> = {
  product_create: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  product_update: 'bg-blue-100 text-blue-800 border-blue-200',
  product_delete: 'bg-rose-100 text-rose-800 border-rose-200',
  price_change: 'bg-amber-100 text-amber-800 border-amber-200',
  stock_adjust: 'bg-purple-100 text-purple-800 border-purple-200',
  order_status_update: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  refund_issued: 'bg-rose-100 text-rose-800 border-rose-200',
  coupon_create: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  coupon_update: 'bg-blue-100 text-blue-800 border-blue-200',
  banner_update: 'bg-amber-100 text-amber-800 border-amber-200',
  cms_update: 'bg-purple-100 text-purple-800 border-purple-200',
  menu_update: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  settings_update: 'bg-neutral-800 text-white border-neutral-700',
  admin_login: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export const AuditLogsManager: React.FC = () => {
  const toast = useToast();
  const { data: auditLogs = [], isLoading, refetch } = useGetAuditLogsQuery();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedEntity, setSelectedEntity] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    if (selectedAction !== 'all' && log.action !== selectedAction) return false;
    if (selectedEntity !== 'all' && log.entityType !== selectedEntity) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = log.adminName.toLowerCase().includes(q);
      const matchEmail = log.adminEmail.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchEntity = log.entityName?.toLowerCase().includes(q) || log.entityId?.toLowerCase().includes(q);
      return matchName || matchEmail || matchDetails || matchEntity;
    }
    return true;
  });

  const handleExport = () => {
    const rows = [
      ['Timestamp', 'Admin Name', 'Admin Email', 'Action', 'Entity Type', 'Entity ID', 'Details', 'IP Address'],
      ...filteredLogs.map((l) => [
        l.createdAt,
        l.adminName,
        l.adminEmail,
        l.action,
        l.entityType,
        l.entityId || '',
        l.details,
        l.ipAddress || '',
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((x) => `"${x}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vedaaya_Audit_Logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit logs exported!');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrative Security & Operation Audit Logs"
        subtitle="Immutable ledger tracking all product edits, price revisions, inventory adjustments, order status changes, CMS updates, and credential events."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleExport}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export Audit Log
            </Button>
          </div>
        }
      />

      {/* Security Architecture Tag */}
      <div className="p-4 rounded-2xl bg-neutral-900 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">SOC2 & GDPR Compliant Audit Trail</h4>
            <p className="text-xs text-neutral-300">All administrative interventions are timestamped, indexed with actor credentials, and cryptographically verified.</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold bg-white/15 px-3 py-1.5 rounded-lg">
          {auditLogs.length} Total Operations Recorded
        </span>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[260px]">
          <Input
            placeholder="Search by admin name, email, entity or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-neutral-400" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="text-xs p-2 border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white font-medium"
            >
              <option value="all">All Action Types</option>
              <option value="product_create">Product Created</option>
              <option value="product_update">Product Updated</option>
              <option value="price_change">Price Revision</option>
              <option value="stock_adjust">Stock Adjusted</option>
              <option value="order_status_update">Order Status Changed</option>
              <option value="refund_issued">Refund Issued</option>
              <option value="coupon_create">Coupon Created</option>
              <option value="banner_update">Banner Updated</option>
              <option value="cms_update">CMS Layout Updated</option>
              <option value="menu_update">Menu Navigation Updated</option>
              <option value="settings_update">Settings Changed</option>
              <option value="admin_login">Admin Sign-in</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="text-xs p-2 border border-neutral-300 rounded-xl focus:border-[#7B2435] focus:outline-none bg-white font-medium"
            >
              <option value="all">All Entities</option>
              <option value="Product">Product</option>
              <option value="Order">Order</option>
              <option value="Coupon">Coupon</option>
              <option value="Banner">Banner</option>
              <option value="CMS">CMS</option>
              <option value="Menu">Menu</option>
              <option value="ShippingConfig">Shipping Config</option>
              <option value="PaymentGatewayConfig">Payment Config</option>
              <option value="AdminUser">Admin User</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Stream */}
      {isLoading ? (
        <div className="p-12 text-center text-neutral-400 text-sm">Loading security audit records...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-neutral-200">
          <Activity className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-neutral-700">No audit logs matching criteria</p>
          <p className="text-xs text-neutral-500 mt-1">Try resetting the filters or search keywords.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const actionClass = ACTION_COLORS[log.action] || 'bg-neutral-100 text-neutral-800 border-neutral-200';
            const formattedDate = new Date(log.createdAt).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'medium',
            });

            return (
              <div
                key={log.id}
                className="bg-white rounded-2xl border border-neutral-200 shadow-xs hover:border-neutral-300 transition-all overflow-hidden"
              >
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold text-xs shrink-0 border border-neutral-200">
                      {log.adminName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-neutral-900">{log.adminName}</span>
                        <span className="text-[11px] text-neutral-400">({log.adminEmail})</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${actionClass}`}>
                          {log.action.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-neutral-100 text-neutral-600">
                          {log.entityType}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-700 mt-1 font-medium">{log.details}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                    <div className="text-right text-[11px] text-neutral-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formattedDate}</span>
                    </div>
                    <button type="button" className="text-neutral-400 hover:text-neutral-700 p-1">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible JSON Diff / Details */}
                {isExpanded && (
                  <div className="p-4 bg-neutral-50 border-t border-neutral-200 text-xs space-y-3 font-mono">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {log.previousValue && (
                        <div className="p-3 bg-white rounded-xl border border-rose-200">
                          <span className="text-[10px] font-bold uppercase text-rose-700 block mb-1">Previous Value:</span>
                          <pre className="text-[11px] text-rose-900 whitespace-pre-wrap overflow-x-auto max-h-48">
                            {JSON.stringify(log.previousValue, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.newValue && (
                        <div className="p-3 bg-white rounded-xl border border-emerald-200">
                          <span className="text-[10px] font-bold uppercase text-emerald-700 block mb-1">Updated Value:</span>
                          <pre className="text-[11px] text-emerald-900 whitespace-pre-wrap overflow-x-auto max-h-48">
                            {JSON.stringify(log.newValue, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-200">
                      <span>IP Address: <strong className="text-neutral-700">{log.ipAddress || '127.0.0.1'}</strong></span>
                      <span>Log ID: <strong className="text-neutral-700">{log.id}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
