import React from "react";
import { TaxTransactionRecord } from "../../server/ApiServiceStruct/TaxCalcApiService.ts";
import { X, CheckCircle, ExternalLink, ShieldCheck } from "lucide-react";

interface TaxDetailWindowProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TaxTransactionRecord | null;
}

export const TaxDetailWindow: React.FC<TaxDetailWindowProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span>Transaction ID: {transaction.transaction_id}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> {transaction.sync_status}
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Multi-Jurisdictional Tax Liability Breakdown
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Top Key Metrics */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-lg">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Taxable Gross Base</div>
              <div className="text-lg font-bold text-slate-900">
                ${transaction.taxable_amount?.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Total Tax Liability</div>
              <div className="text-lg font-bold text-indigo-600">
                ${transaction.total_tax_amount?.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Effective Tax Rate</div>
              <div className="text-lg font-bold text-slate-900">
                {transaction.effective_rate_pct}%
              </div>
            </div>
          </div>

          {/* Jurisdictions line items */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Statutory Apportionment Breakdown
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Jurisdiction</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Statutory Rate</th>
                    <th className="py-2.5 px-3 text-right">Tax Assessed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {transaction.line_breakdowns?.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-slate-900 font-sans">
                        {item.jurisdiction_name || item.jurisdiction || item.jurisdiction_code}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-sans uppercase text-[10px]">
                        {item.jurisdiction_type || "statutory"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {item.rate_percentage ?? item.rate}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ${(item.tax_liability ?? item.tax)?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Verification block */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800">
                BaseFrame Audit Immutability Confirmed
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                insert_by: {transaction.insert_by || "SYSTEM_BOOT"} · insert_on: {transaction.insert_on || "INITIAL"} · is_active: true
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
