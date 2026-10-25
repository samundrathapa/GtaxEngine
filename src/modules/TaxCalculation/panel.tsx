import React, { useEffect, useState } from "react";
import { TaxCalculationParams, defaultTaxCalcParams, TaxCalculationResponseData } from "./model.ts";
import { TaxCalculationController } from "./controller.ts";
import { TaxDetailWindow } from "./window.tsx";
import { TaxTransactionRecord } from "../../server/ApiServiceStruct/TaxCalcApiService.ts";
import { TaxLiabilityComparisonChart } from "../../components/TaxLiabilityComparisonChart.tsx";
import { Calculator, ArrowRight, CheckCircle2, AlertTriangle, Layers, Eye, RefreshCw, Radio, TrendingUp } from "lucide-react";

export const TaxCalculationPanel: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"comparison_chart" | "transaction_engine">("comparison_chart");
  const [params, setParams] = useState<TaxCalculationParams>(defaultTaxCalcParams);
  const [computing, setComputing] = useState(false);
  const [lastResult, setLastResult] = useState<TaxCalculationResponseData | null>(null);
  const [transactions, setTransactions] = useState<TaxTransactionRecord[]>([]);
  const [selectedTx, setSelectedTx] = useState<TaxTransactionRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadPastTransactions = async () => {
    const list = await TaxCalculationController.fetchTransactions();
    setTransactions(list);
  };

  useEffect(() => {
    loadPastTransactions();
  }, []);

  const handleCompute = async (e: React.FormEvent) => {
    e.preventDefault();
    setComputing(true);
    setStatusMessage(null);
    try {
      const res = await TaxCalculationController.computeLiability(params);
      if (res.success && res.data) {
        setLastResult(res.data);
        setStatusMessage(res.message);
        await loadPastTransactions();
      } else {
        setStatusMessage(res.message || "Calculation failed");
      }
    } catch (err: any) {
      setStatusMessage(err?.message || "Calculation error");
    } finally {
      setComputing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
        
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Complex Tax Liability Engine
          </h2>
       
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>CDC Real-Time Sync Active</span>
          </div>
        </div>
      </div>

      {/* Sub Tabs: Tax Liability Cross-Year Comparison Chart vs Microservice Engine */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab("comparison_chart")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "comparison_chart"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Cross-Fiscal-Year Valuation & Tax Liability Comparison (Recharts)</span>
        </button>

        <button
          onClick={() => setActiveSubTab("transaction_engine")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === "transaction_engine"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>General Microservice Transaction Calc</span>
        </button>
      </div>

      {activeSubTab === "comparison_chart" && (
        <TaxLiabilityComparisonChart />
      )}

      {activeSubTab === "transaction_engine" && (
        <>
          {statusMessage && (
            <div className="p-3 text-sm bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg flex items-center justify-between animate-in fade-in">
              <span className="font-medium">{statusMessage}</span>
              <button onClick={() => setStatusMessage(null)} className="text-xs text-indigo-700 font-semibold hover:underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Main Calculation Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Parameter Input */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Calculator className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Transaction Liability Parameters
            </h3>
          </div>

          <form onSubmit={handleCompute} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Invoice Reference #
              </label>
              <input
                type="text"
                value={params.invoiceNumber}
                onChange={(e) => setParams({ ...params, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Gross Taxable Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  step="100"
                  min="1"
                  value={params.grossAmount}
                  onChange={(e) => setParams({ ...params, grossAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-7 pr-3 py-2 text-sm font-bold font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Origin Country
                </label>
                <select
                  value={params.originCountry}
                  onChange={(e) => setParams({ ...params, originCountry: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="US">United States (US)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="DE">Germany (DE)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Origin State/Region
                </label>
                <input
                  type="text"
                  value={params.originRegion}
                  onChange={(e) => setParams({ ...params, originRegion: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Destination Country
                </label>
                <select
                  value={params.destinationCountry}
                  onChange={(e) => setParams({ ...params, destinationCountry: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="US">United States (US)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="DE">Germany (DE)</option>
                  <option value="JP">Japan (JP)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Destination State/Region
                </label>
                <select
                  value={params.destinationRegion}
                  onChange={(e) => setParams({ ...params, destinationRegion: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-mono"
                >
                  <option value="CA">CA - California</option>
                  <option value="NY">NY - New York</option>
                  <option value="TX">TX - Texas</option>
                  <option value="WA">WA - Washington</option>
                  <option value="IL">IL - Illinois</option>
                  <option value="FL">FL - Florida</option>
                  <option value="ENG">ENG - England (UK)</option>
                  <option value="BER">BER - Berlin (DE)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Product Tax Code (PTC)
              </label>
              <select
                value={params.productTaxCode}
                onChange={(e) => setParams({ ...params, productTaxCode: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="DIGITAL_SAAS">DIGITAL_SAAS - Cloud Software Subscription</option>
                <option value="PHYSICAL_GOODS">PHYSICAL_GOODS - Manufactured Hardware</option>
                <option value="FIN_SERVICES">FIN_SERVICES - Cross-Border Payment Services</option>
                <option value="TELECOM_EXCISE">TELECOM_EXCISE - Telephony & Bandwidth</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={computing}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {computing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Multi-Tier Liabilities...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  <span>Calculate & Synchronize Liability</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Panel: Live Calculation Result & Nexus */}
        <div className="lg:col-span-7 space-y-5">
          {lastResult ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Calculated Liability Result
                  </h3>
                  <div className="text-xs text-slate-500 font-mono">
                    Ref: {lastResult.transaction.invoice_number} · CDC Event: {lastResult.syncEventId}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-slate-500">Effective Tax Rate</div>
                  <div className="text-xl font-extrabold text-indigo-600">
                    {lastResult.calculation.net_effective_tax_rate}%
                  </div>
                </div>
              </div>

              {/* Total Card */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Gross Base</div>
                  <div className="text-xl font-bold text-slate-900 font-mono">
                    ${lastResult.calculation.base_taxable_amount?.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider">Total Assessed Tax</div>
                  <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                    ${lastResult.calculation.total_tax_liability?.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Multi-Jurisdiction Table Breakdown */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Jurisdictional Apportionment Matrix
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2 px-3">Jurisdiction</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Rate</th>
                        <th className="py-2 px-3 text-right">Tax Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lastResult.calculation.jurisdiction_breakdown.map((row) => (
                        <tr key={row.rule_id} className="hover:bg-slate-50/70 font-mono">
                          <td className="py-2.5 px-3 font-medium font-sans text-slate-900">
                            {row.jurisdiction_name}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] font-sans uppercase text-slate-500">
                            {row.jurisdiction_type}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            {row.rate_percentage}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            ${row.tax_liability.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Economic Nexus Meter */}
              <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Wayfair Economic Nexus Evaluator
                    </span>
                  </div>
                  <span className={`text-xs font-bold ${lastResult.economicNexus.has_nexus ? "text-amber-700" : "text-emerald-700"}`}>
                    {lastResult.economicNexus.has_nexus ? "NEXUS ESTABLISHED" : "BELOW NEXUS CEILING"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Annual Gross Volume</span>
                      <span className="font-mono font-semibold">${lastResult.economicNexus.sales_volume.toLocaleString()} / $100k</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, lastResult.economicNexus.sales_progress_pct)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Annual Transaction Count</span>
                      <span className="font-mono font-semibold">{lastResult.economicNexus.transaction_count} / 200 tx</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, lastResult.economicNexus.transaction_progress_pct)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 bg-white">
              <Calculator className="w-10 h-10 text-slate-300 mb-3" />
              <h4 className="text-sm font-semibold text-slate-700">Ready for Calculation</h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Configure your multi-jurisdiction transaction on the left and click calculate to assess Federal, State, and Municipal tax liabilities.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Historical Assessed Transactions */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Assessed Tax Transactions Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Synchronized records committed to PostgreSQL with BaseFrame audit columns.
            </p>
          </div>
          <button
            onClick={loadPastTransactions}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/50"
            title="Refresh transactions"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/60 border-b border-slate-200 font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-2.5 px-4">Invoice / ID</th>
                <th className="py-2.5 px-4">Destination</th>
                <th className="py-2.5 px-4">Gross Base</th>
                <th className="py-2.5 px-4">Total Tax</th>
                <th className="py-2.5 px-4">Effective Rate</th>
                <th className="py-2.5 px-4">Sync Status</th>
                <th className="py-2.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {transactions.map((tx) => (
                <tr key={tx.transaction_id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-sans">
                    <div className="font-semibold text-slate-900">{tx.invoice_number}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{tx.transaction_id}</div>
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-700">
                    {tx.destination_country} - {tx.destination_region}
                  </td>
                  <td className="py-3 px-4 text-slate-900">
                    ${tx.taxable_amount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-indigo-600">
                    ${tx.total_tax_amount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    {tx.effective_rate_pct}%
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {tx.sync_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <button
                      onClick={() => {
                        setSelectedTx(tx);
                        setIsDetailOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                      title="Inspect line items"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TaxDetailWindow
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        transaction={selectedTx}
      />
        </>
      )}
    </div>
  );
};
