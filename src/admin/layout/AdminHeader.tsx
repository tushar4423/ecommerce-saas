import React from 'react';
import { ExternalLink, Bell, Search, Shield, RefreshCw, FileText, Download } from 'lucide-react';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { Button } from '../../components/ui/Button';
import { buildVedaayaFeaturesPdf } from '../../utils/generatePdfDocument';

interface AdminHeaderProps {
  onReturnToStore: () => void;
  title?: string;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onReturnToStore,
  title,
  onRefreshData,
  isRefreshing = false,
}) => {
  const { adminUser, role } = useAdminAuth();

  const handleDownloadPdf = () => {
    try {
      const doc = buildVedaayaFeaturesPdf();
      doc.save('Vedaaya_Ethnic_App_Features_Specification.pdf');
    } catch {
      window.open('/api/docs/features-pdf', '_blank');
    }
  };

  return (
    <header className="shrink-0 bg-white border-b border-neutral-200 sticky top-0 z-30 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#7B2435] text-white flex items-center justify-center font-serif font-black text-sm shadow-xs">
          N
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-sm sm:text-base text-neutral-900 leading-none">
              Nandita Fashion Management Suite
            </h2>
            <span className="hidden sm:inline-block text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold uppercase">
              Production DB
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
            Role: <span className="text-[#7B2435] font-bold capitalize">{role?.replace('_', ' ')}</span> • Logged in as {adminUser?.email}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#7B2435] bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 transition cursor-pointer"
          title="Download complete system features documentation as PDF"
        >
          <FileText className="w-3.5 h-3.5 text-[#7B2435]" />
          <span>Features Doc (PDF)</span>
          <Download className="w-3 h-3 text-neutral-400" />
        </button>

        {onRefreshData && (
          <button
            type="button"
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="p-2 text-neutral-500 hover:text-[#7B2435] hover:bg-[#FAF6F0] rounded-xl border border-neutral-200 transition cursor-pointer"
            title="Sync latest live database records"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#7B2435]' : ''}`} />
          </button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onReturnToStore}
          rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
        >
          <span className="hidden sm:inline">View Live Storefront</span>
          <span className="sm:hidden">Store</span>
        </Button>
      </div>
    </header>
  );
};
