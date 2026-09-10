import React, { useRef } from 'react';
import { 
  Printer, 
  Download, 
  FileText, 
  CheckCircle2, 
  Building, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  ExternalLink,
  QrCode,
  Sparkles
} from 'lucide-react';
import { Order } from '../../types';
import { calculateOrderInvoice, FullInvoiceData } from '../../utils/taxUtils';
import { formatCurrency } from '../../utils/formatters';

interface InvoiceViewProps {
  order: Order | any;
  onClose?: () => void;
  showActions?: boolean;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({
  order,
  onClose,
  showActions = true,
}) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const data: FullInvoiceData = calculateOrderInvoice(order);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white text-neutral-900 selection:bg-[#7B2435] selection:text-white">
      {/* Top Action Bar (hidden in print) */}
      {showActions && (
        <div className="print:hidden sticky top-0 z-20 bg-neutral-900 text-white px-4 py-3 sm:px-6 rounded-t-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Official Tax Invoice • {data.invoiceNumber}
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              GST Compliant (5% / 18% Slabs)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#7B2435] hover:bg-[#621c2a] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {/* Invoice Document Body */}
      <div 
        ref={invoiceRef}
        className="p-6 sm:p-10 font-sans text-neutral-800 text-xs leading-relaxed max-w-4xl mx-auto print:p-0 print:max-w-full"
      >
        {/* =========================================================================
            1. HEADER SECTION
        ========================================================================= */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2 border-neutral-900">
          {/* Brand & Seller Details */}
          <div className="space-y-1.5 max-w-md">
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-tight text-[#7B2435]">
                Nandita Fashion
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-[#FAF6F0] border border-[#EADBDA] rounded text-neutral-700">
                Boutique Studio
              </span>
            </div>
            <p className="font-bold text-neutral-900 text-xs">
              {data.seller.legalName}
            </p>
            <p className="text-[11px] text-neutral-600">
              {data.seller.addressLine1}, {data.seller.addressLine2}, {data.seller.city}, {data.seller.state} - {data.seller.pincode}, {data.seller.country}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-neutral-700 pt-1 font-medium">
              <div><strong>GSTIN:</strong> <span className="font-mono text-neutral-900">{data.seller.gstin}</span></div>
              <div><strong>PAN:</strong> <span className="font-mono text-neutral-900">{data.seller.pan}</span></div>
              <div><strong>State Code:</strong> {data.seller.stateCode} (Rajasthan)</div>
              <div><strong>CIN:</strong> <span className="font-mono">{data.seller.cin}</span></div>
              <div><strong>Email:</strong> {data.seller.email}</div>
              <div><strong>Phone:</strong> {data.seller.phone}</div>
            </div>
          </div>

          {/* Invoice Document Meta Box */}
          <div className="bg-[#FAF6F0] p-4 rounded-xl border border-neutral-300 w-full sm:w-72 space-y-1.5 text-right sm:text-right print:bg-neutral-50 print:border-neutral-400">
            <div className="text-center sm:text-right pb-1 mb-1 border-b border-neutral-200">
              <h2 className="font-serif text-lg font-bold text-neutral-900 uppercase tracking-wide">
                TAX INVOICE
              </h2>
              <span className="text-[10px] text-neutral-500 block">
                Issued under Section 31 of CGST Act, 2017
              </span>
            </div>

            <div className="flex justify-between text-[11px]">
              <span className="text-neutral-500 font-semibold">Invoice No:</span>
              <strong className="font-mono text-neutral-900">{data.invoiceNumber}</strong>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-neutral-500 font-semibold">Invoice Date:</span>
              <strong className="text-neutral-900">{data.invoiceDate}</strong>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-neutral-500 font-semibold">Order ID:</span>
              <strong className="font-mono text-[#7B2435]">#{data.orderNumber}</strong>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-neutral-500 font-semibold">Order Date:</span>
              <span>{data.orderDate}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-neutral-500 font-semibold">Place of Supply:</span>
              <strong className="text-neutral-900">{data.placeOfSupply}</strong>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-neutral-500 font-semibold">Reverse Charge:</span>
              <span>No</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. BILLING & SHIPPING ADDRESSES
        ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-neutral-200">
          {/* Bill To / Ship To */}
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B2435] block">
              Bill To & Ship To (Recipient):
            </span>
            <h4 className="font-bold text-neutral-900 text-sm">
              {data.buyer.name}
            </h4>
            <p className="text-[11px] text-neutral-600">
              {data.buyer.addressLine1} {data.buyer.addressLine2 && `, ${data.buyer.addressLine2}`}
              {data.buyer.landmark && ` (Near ${data.buyer.landmark})`}
            </p>
            <p className="text-[11px] text-neutral-600">
              {data.buyer.city}, <strong>{data.buyer.state}</strong> - {data.buyer.pincode}, {data.buyer.country}
            </p>
            <div className="pt-1 text-[11px] text-neutral-700 flex flex-wrap gap-x-4">
              <span><strong>Phone:</strong> {data.buyer.phone}</span>
              {data.buyer.email && <span><strong>Email:</strong> {data.buyer.email}</span>}
              <span><strong>State Code:</strong> {data.buyer.stateCode}</span>
            </div>
          </div>

          {/* Dispatch & Payment Information */}
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5 text-[11px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B2435] block">
              Dispatch & Payment Summary:
            </span>
            <div className="flex justify-between py-0.5 border-b border-neutral-200/60">
              <span className="text-neutral-500">Payment Mode:</span>
              <strong className="text-neutral-900">{data.paymentMethod}</strong>
            </div>
            <div className="flex justify-between py-0.5 border-b border-neutral-200/60">
              <span className="text-neutral-500">Payment Status:</span>
              <span className={`font-bold ${data.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {data.paymentStatus === 'Paid' ? '✓ Paid Online' : 'Cash on Delivery (To be Collected)'}
              </span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-neutral-200/60">
              <span className="text-neutral-500">Courier Partner:</span>
              <span>{data.courierPartner}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-neutral-500">AWB Tracking No:</span>
              <strong className="font-mono text-neutral-900">{data.trackingNumber}</strong>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. ITEM SCHEDULE & TAX SLAB TABLE
        ========================================================================= */}
        <div className="py-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-neutral-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-2.5 text-center w-8">#</th>
                  <th className="p-2.5">Item Description & SKU</th>
                  <th className="p-2.5 text-center">HSN</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Gross (₹)</th>
                  <th className="p-2.5 text-right">Disc (₹)</th>
                  <th className="p-2.5 text-right">Taxable (₹)</th>
                  <th className="p-2.5 text-center">GST Slab</th>
                  {data.isIntraState ? (
                    <>
                      <th className="p-2.5 text-right">CGST (₹)</th>
                      <th className="p-2.5 text-right">SGST (₹)</th>
                    </>
                  ) : (
                    <th className="p-2.5 text-right">IGST (₹)</th>
                  )}
                  <th className="p-2.5 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 border-b border-neutral-300">
                {data.items.map((it) => (
                  <tr key={it.index} className="hover:bg-neutral-50">
                    <td className="p-2.5 text-center text-neutral-500 font-mono">{it.index}</td>
                    <td className="p-2.5">
                      <strong className="text-neutral-900 text-xs block">{it.name}</strong>
                      <span className="text-neutral-500 text-[10px]">
                        Size: <strong>{it.size}</strong> {it.color && `• Color: ${it.color}`} • SKU: <span className="font-mono">{it.sku}</span>
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono text-neutral-600">{it.hsnCode}</td>
                    <td className="p-2.5 text-center font-bold text-neutral-900">{it.quantity}</td>
                    <td className="p-2.5 text-right text-neutral-700">₹{it.grossAmount.toFixed(2)}</td>
                    <td className="p-2.5 text-right text-emerald-700">
                      {it.discount > 0 ? `-₹${it.discount.toFixed(2)}` : '₹0.00'}
                    </td>
                    <td className="p-2.5 text-right font-medium text-neutral-900">₹{it.taxableValue.toFixed(2)}</td>
                    <td className="p-2.5 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        it.is5PercentSlab ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}>
                        {it.gstRate}%
                      </span>
                    </td>
                    {data.isIntraState ? (
                      <>
                        <td className="p-2.5 text-right text-neutral-700">
                          ₹{it.cgstAmount.toFixed(2)}
                          <span className="block text-[9px] text-neutral-400">({it.cgstRate}%)</span>
                        </td>
                        <td className="p-2.5 text-right text-neutral-700">
                          ₹{it.sgstAmount.toFixed(2)}
                          <span className="block text-[9px] text-neutral-400">({it.sgstRate}%)</span>
                        </td>
                      </>
                    ) : (
                      <td className="p-2.5 text-right text-neutral-700">
                        ₹{it.igstAmount.toFixed(2)}
                        <span className="block text-[9px] text-neutral-400">({it.igstRate}%)</span>
                      </td>
                    )}
                    <td className="p-2.5 text-right font-bold text-neutral-900">
                      ₹{it.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            4. GST SLAB SUMMARY BREAKDOWN & TOTALS GRID
        ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-2 border-b border-neutral-200">
          {/* Left Column: Tax Slabs Summary */}
          <div className="md:col-span-7 space-y-3">
            <h5 className="font-bold text-[11px] uppercase tracking-wider text-neutral-800 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> GST Tax Schedule Breakdown
            </h5>
            
            <div className="border border-neutral-200 rounded-xl overflow-hidden text-[10px]">
              <table className="w-full text-left">
                <thead className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-200">
                  <tr>
                    <th className="p-2">Slab / Rule</th>
                    <th className="p-2 text-right">Taxable Val</th>
                    {data.isIntraState ? (
                      <>
                        <th className="p-2 text-right">CGST</th>
                        <th className="p-2 text-right">SGST</th>
                      </>
                    ) : (
                      <th className="p-2 text-right">IGST</th>
                    )}
                    <th className="p-2 text-right">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {data.slabs.fivePercent.taxableValue > 0 && (
                    <tr>
                      <td className="p-2 font-medium">
                        5% GST <span className="text-[9px] text-neutral-400">(Price ≤ ₹2,500)</span>
                      </td>
                      <td className="p-2 text-right">₹{data.slabs.fivePercent.taxableValue.toFixed(2)}</td>
                      {data.isIntraState ? (
                        <>
                          <td className="p-2 text-right">₹{data.slabs.fivePercent.cgstAmount.toFixed(2)}</td>
                          <td className="p-2 text-right">₹{data.slabs.fivePercent.sgstAmount.toFixed(2)}</td>
                        </>
                      ) : (
                        <td className="p-2 text-right">₹{data.slabs.fivePercent.igstAmount.toFixed(2)}</td>
                      )}
                      <td className="p-2 text-right font-bold">₹{data.slabs.fivePercent.totalTax.toFixed(2)}</td>
                    </tr>
                  )}
                  {data.slabs.eighteenPercent.taxableValue > 0 && (
                    <tr>
                      <td className="p-2 font-medium">
                        18% GST <span className="text-[9px] text-neutral-400">(Price &gt; ₹2,500)</span>
                      </td>
                      <td className="p-2 text-right">₹{data.slabs.eighteenPercent.taxableValue.toFixed(2)}</td>
                      {data.isIntraState ? (
                        <>
                          <td className="p-2 text-right">₹{data.slabs.eighteenPercent.cgstAmount.toFixed(2)}</td>
                          <td className="p-2 text-right">₹{data.slabs.eighteenPercent.sgstAmount.toFixed(2)}</td>
                        </>
                      ) : (
                        <td className="p-2 text-right">₹{data.slabs.eighteenPercent.igstAmount.toFixed(2)}</td>
                      )}
                      <td className="p-2 text-right font-bold">₹{data.slabs.eighteenPercent.totalTax.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr className="bg-neutral-50 font-bold text-neutral-900 border-t border-neutral-200">
                    <td className="p-2">Aggregate Total</td>
                    <td className="p-2 text-right">₹{data.totals.taxableValue.toFixed(2)}</td>
                    {data.isIntraState ? (
                      <>
                        <td className="p-2 text-right">₹{data.totals.cgstAmount.toFixed(2)}</td>
                        <td className="p-2 text-right">₹{data.totals.sgstAmount.toFixed(2)}</td>
                      </>
                    ) : (
                      <td className="p-2 text-right">₹{data.totals.igstAmount.toFixed(2)}</td>
                    )}
                    <td className="p-2 text-right">₹{data.totals.totalTax.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-2.5 bg-[#FAF6F0] rounded-xl border border-[#EADBDA] text-[10px] text-neutral-600">
              <strong>Statutory Declaration:</strong> Tax invoice is compliant with the notification governing readymade garments under Chapter 62 of GST Tariff. Applicable taxes are included in unit MRP.
            </div>
          </div>

          {/* Right Column: Financial Final Total Box */}
          <div className="md:col-span-5 bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-2 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>Gross Total Subtotal:</span>
              <span>₹{data.totals.grossAmount.toFixed(2)}</span>
            </div>
            {data.totals.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Promotional Discount:</span>
                <span>-₹{data.totals.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-700 pt-1 border-t border-neutral-200">
              <span>Net Taxable Base Value:</span>
              <span>₹{data.totals.taxableValue.toFixed(2)}</span>
            </div>
            {data.isIntraState ? (
              <>
                <div className="flex justify-between text-neutral-600 text-[11px]">
                  <span>Total CGST:</span>
                  <span>₹{data.totals.cgstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-600 text-[11px]">
                  <span>Total SGST:</span>
                  <span>₹{data.totals.sgstAmount.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-neutral-600 text-[11px]">
                <span>Total IGST (Inter-State):</span>
                <span>₹{data.totals.igstAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-neutral-600 text-[11px]">
              <span>Delivery & Freight:</span>
              <span className="font-semibold text-emerald-700">
                {data.totals.shippingFee > 0 ? `₹${data.totals.shippingFee.toFixed(2)}` : 'FREE'}
              </span>
            </div>

            <div className="pt-2 border-t-2 border-neutral-900 flex justify-between items-baseline">
              <span className="font-serif text-sm font-bold text-neutral-900">
                Grand Invoice Total:
              </span>
              <strong className="font-serif text-xl font-bold text-[#7B2435]">
                {formatCurrency(data.totals.grandTotal)}
              </strong>
            </div>

            <div className="pt-1.5 border-t border-neutral-200 text-[10px] text-neutral-600">
              <span className="font-bold text-neutral-800">Amount in Words:</span>
              <p className="italic font-serif text-neutral-900 text-[11px] mt-0.5">
                {data.totals.amountInWords}
              </p>
            </div>
          </div>
        </div>

        {/* =========================================================================
            5. FOOTER & LEGAL AUTHORIZATION
        ========================================================================= */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-end">
          {/* Terms & Conditions */}
          <div className="sm:col-span-8 space-y-1.5 text-[10px] text-neutral-500">
            <p className="font-bold text-neutral-800">Terms & Conditions:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Goods once sold can be exchanged or returned within 7 days of delivery as per brand return policy.</li>
              <li>Handcrafted artisanal block prints & embroidery may exhibit natural subtle variations which celebrate authenticity.</li>
              <li>All disputes are subject to the exclusive jurisdiction of courts in Jaipur, Rajasthan.</li>
              <li>This is a digitally generated tax invoice and does not require physical stamp signatures.</li>
            </ul>
          </div>

          {/* Digital Signature & Stamp Box */}
          <div className="sm:col-span-4 text-center sm:text-right space-y-2">
            <div className="border border-neutral-300 rounded-xl p-3 bg-[#FAF6F0] inline-block text-center min-w-[200px] print:border-neutral-400">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-1 border border-emerald-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[9px] uppercase font-mono tracking-wider text-neutral-500 block">
                Digitally Signed & Certified
              </span>
              <strong className="text-xs font-serif text-neutral-900 block mt-0.5">
                For {data.seller.legalName}
              </strong>
              <span className="text-[9px] text-[#7B2435] font-bold block">
                Authorized Signatory
              </span>
            </div>
          </div>
        </div>

        {/* Watermark/Footer Note */}
        <div className="mt-8 pt-4 border-t border-neutral-200 text-center text-[10px] text-neutral-400 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Official Tax Invoice — Nandita Fashion / Vedaaya Ethnic</span>
          <span>Support Desk: care@nanditafashion.com | Toll-Free: 1800-202-4589</span>
          <span>Thank you for patronizing Indian Handloom Artisans</span>
        </div>
      </div>
    </div>
  );
};
