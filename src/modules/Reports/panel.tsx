import React, { useState } from "react";
import { ReportConfig, initialReportConfig, ReportFormat } from "./model.ts";
import { ReportController } from "./controller.ts";
import { PdfPreviewWindow } from "./window.tsx";
import { FileText, Download, Check, ShieldCheck } from "lucide-react";

export const ReportsPanel: React.FC = () => {
  const [config, setConfig] = useState<ReportConfig>(initialReportConfig);
  const [exporting, setExporting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [pdfSpec, setPdfSpec] = useState<any>(null);
  const [isPdfOpen, setIsPdfOpen] = useState(false);

  // Sample data for export
  const headers = [
    "invoice_number",
    "customer_id",
    "destination_country",
    "destination_region",
    "gross_amount",
    "total_tax_amount",
    "effective_rate_pct",
    "sync_status",
    "insert_by",
    "insert_on",
    "is_active"
  ];

  const sampleRows = [
    {
      invoice_number: "INV-US-CA-9921",
      customer_id: "CUST-ACME-CORP",
      destination_country: "US",
      destination_region: "CA",
      gross_amount: 150000,
      total_tax_amount: 13875,
      effective_rate_pct: 9.25,
      sync_status: "SYNCED",
      insert_by: "SYSTEM_BOOT",
      insert_on: "2026-10-10T05:00:00Z",
      is_active: "true"
    },
    {
      invoice_number: "INV-EU-GER-4109",
      customer_id: "CUST-SIEMENS-AG",
      destination_country: "DE",
      destination_region: "BER",
      gross_amount: 84000,
      total_tax_amount: 15960,
      effective_rate_pct: 19.0,
      sync_status: "SYNCED",
      insert_by: "SYSTEM_BOOT",
      insert_on: "2026-10-10T05:15:00Z",
      is_active: "true"
    },
    {
      invoice_number: "INV-UK-LON-3301",
      customer_id: "CUST-BARCLAYS-UK",
      destination_country: "GB",
      destination_region: "ENG",
      gross_amount: 62000,
      total_tax_amount: 12400,
      effective_rate_pct: 20.0,
      sync_status: "SYNCED",
      insert_by: "SYSTEM_BOOT",
      insert_on: "2026-10-10T05:30:00Z",
      is_active: "true"
    }
  ];

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExporting(true);
    setStatusMsg(null);
    const res = await ReportController.exportReport(config, headers, sampleRows, {
      "Total Invoices": sampleRows.length,
      "Total Gross Base": "$296,000.00",
      "Total Assessed Tax": "$42,235.00"
    });
    setStatusMsg(res.message);
    if (res.pdfSpec) {
      setPdfSpec(res.pdfSpec);
      setIsPdfOpen(true);
    }
    setExporting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>BaseFrame</span>
            <span aria-hidden="true">·</span>
            <span>reports/report_engine</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-700">PDF, Excel, HTML, CSV</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Multi-Format Tax Liability Reports Engine
          </h2>
          <p className="text-sm text-slate-500">
            Export compliant audit reports in PDF, Excel Spreadsheet XML, HTML, or CSV formats.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center justify-between animate-in fade-in">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-xs text-emerald-600 font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <form onSubmit={handleExport} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Report Title
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Output Format Configuration
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["csv", "excel", "html", "pdf"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setConfig({ ...config, format: fmt })}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      config.format === fmt
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold"
                        : "border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="text-xs uppercase font-bold">{fmt}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {fmt === "csv" && "Raw Tabular Data"}
                      {fmt === "excel" && "MS Excel XML (.xls)"}
                      {fmt === "html" && "Styled Web View"}
                      {fmt === "pdf" && "Headless Document"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeAuditColumns}
                onChange={(e) => setConfig({ ...config, includeAuditColumns: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded-sm"
              />
              <span className="text-xs font-semibold text-slate-700">
                Include mandatory BaseFrame audit fields in output
              </span>
            </label>

            <button
              type="submit"
              disabled={exporting}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Generating Report..." : `Generate & Download ${config.format.toUpperCase()}`}
            </button>
          </form>
        </div>

        {/* Preview of Report Content */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Live Data Sample Preview
            </h3>
            <span className="text-xs font-mono text-slate-500">
              3 records ready for output
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                <tr>
                  <th className="py-2 px-3">Invoice</th>
                  <th className="py-2 px-3">Destination</th>
                  <th className="py-2 px-3">Gross</th>
                  <th className="py-2 px-3">Tax</th>
                  <th className="py-2 px-3">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sampleRows.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-900">{r.invoice_number}</td>
                    <td className="py-2 px-3 text-slate-700">{r.destination_country}-{r.destination_region}</td>
                    <td className="py-2 px-3">${r.gross_amount.toLocaleString()}</td>
                    <td className="py-2 px-3 font-bold text-indigo-600">${r.total_tax_amount.toLocaleString()}</td>
                    <td className="py-2 px-3 text-[10px] text-slate-500">{r.insert_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Configured via <code>/backend/BaseFrame/reports/report_engine.py</code></span>
          </div>
        </div>
      </div>

      <PdfPreviewWindow isOpen={isPdfOpen} onClose={() => setIsPdfOpen(false)} spec={pdfSpec} />
    </div>
  );
};
