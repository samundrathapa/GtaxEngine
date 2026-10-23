import React, { useState, useEffect } from "react";
import { ApiController } from "../../api/controller.ts";
import { SupportedLang, translations } from "../../utils/i18n.ts";
import {
  Calculator,
  Calendar,
  Layers,
  Percent,
  CheckCircle2,
  AlertCircle,
  Printer,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  FileText,
  Shield,
  MapPin,
  Home,
  User,
  Sliders,
  DollarSign
} from "lucide-react";

interface MultiYearTaxEngineProps {
  currentLang?: SupportedLang;
  initialTaxpayerId?: number;
}

export const MultiYearTaxEngine: React.FC<MultiYearTaxEngineProps> = ({
  currentLang = "nep",
  initialTaxpayerId
}) => {
  const t = translations[currentLang];
  const [loading, setLoading] = useState(false);
  const [computing, setComputing] = useState(false);
  const [taxpayers, setTaxpayers] = useState<any[]>([]);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [taxpayerDossier, setTaxpayerDossier] = useState<any>(null);

  // Form selections
  const [selectedTaxpayerId, setSelectedTaxpayerId] = useState<number>(initialTaxpayerId || 1);
  const [fromFiscalYearId, setFromFiscalYearId] = useState<number>(3); // 2079/80 default
  const [toFiscalYearId, setToFiscalYearId] = useState<number>(2); // 2081/82 default
  const [scope, setScope] = useState<"all" | "land" | "house">("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | undefined>(undefined);

  // Result state
  const [result, setResult] = useState<any | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Load masters and taxpayers
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const tpRes = await ApiController.getTaxpayers();
      if (tpRes.success && tpRes.data) {
        setTaxpayers(tpRes.data);
        if (!selectedTaxpayerId && tpRes.data.length > 0) {
          setSelectedTaxpayerId(tpRes.data[0].id);
        }
      }

      const mastersRes = await ApiController.getPropertyMasters();
      if (mastersRes.success && mastersRes.data) {
        const fys = mastersRes.data.fiscalYears || [];
        setFiscalYears(fys);
        if (fys.length >= 2) {
          // Sort chronologically
          const sorted = [...fys].sort((a: any, b: any) =>
            a.date_from_bs?.localeCompare(b.date_from_bs)
          );
          setFromFiscalYearId(sorted[0]?.id || 1);
          setToFiscalYearId(sorted[sorted.length - 1]?.id || 2);
        }
      }
    } catch (e) {
      console.warn("Failed to load initial data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // When selected taxpayer changes, load dossier to populate lands & houses dropdown
  useEffect(() => {
    if (!selectedTaxpayerId) return;
    const fetchDossier = async () => {
      try {
        const res = await ApiController.getTaxpayerDossier(selectedTaxpayerId);
        if (res.success && res.data) {
          setTaxpayerDossier(res.data);
          // Reset property selection if scope is specific
          setSelectedPropertyId(undefined);
        }
      } catch (e) {
        console.warn("Failed to fetch taxpayer dossier", e);
      }
    };
    fetchDossier();
  }, [selectedTaxpayerId]);

  // Handle calculation
  const handleCalculate = async () => {
    if (!selectedTaxpayerId || !fromFiscalYearId || !toFiscalYearId) {
      setStatusMsg("Please select a taxpayer and both From & To Fiscal Years.");
      return;
    }

    setComputing(true);
    setStatusMsg(null);
    try {
      const res = await ApiController.calculateMultiYearTax({
        taxpayerId: selectedTaxpayerId,
        fromFiscalYearId,
        toFiscalYearId,
        scope,
        propertyId: selectedPropertyId
      });

      if (res.success && res.data) {
        setResult(res.data);
        setStatusMsg("Multi-fiscal-year tax calculated successfully!");
      } else {
        setStatusMsg(res.message || "Calculation failed");
      }
    } catch (e: any) {
      setStatusMsg(e?.message || "Error running multi-year tax engine.");
    } finally {
      setComputing(false);
    }
  };

  // Run calculation initially when data is ready
  useEffect(() => {
    if (selectedTaxpayerId && fromFiscalYearId && toFiscalYearId) {
      handleCalculate();
    }
  }, [selectedTaxpayerId, fromFiscalYearId, toFiscalYearId, scope, selectedPropertyId]);

  const handlePrint = () => {
    window.print();
  };

  const selectedTaxpayer = taxpayers.find((t) => t.id === selectedTaxpayerId);
  const availableLands = taxpayerDossier?.lands || [];
  const availableHouses = taxpayerDossier?.houses || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>gtax Municipal Engine</span>
            <span>·</span>
            <span>बहु-आर्थिक वर्ष कर गणना प्रणाली</span>
            <span>·</span>
            <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              Multi-Fiscal-Year Assessment
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Multi-Fiscal-Year Tax Liability Engine (आ.व. कर दायित्व गणना)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Calculate progressive property tax liabilities, statutory depreciation, and fine/rebate across multiple fiscal years for consolidated taxpayers or individual properties.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Assessment Sheet</span>
            </button>
          )}

          <button
            onClick={handleCalculate}
            disabled={computing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${computing ? "animate-spin" : ""}`} />
            <span>{computing ? "Computing..." : "Re-Calculate"}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 text-xs bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 rounded-xl flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="font-bold underline text-indigo-700 dark:text-indigo-400">
            Dismiss
          </button>
        </div>
      )}

      {/* Control Panel: Parameters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>Calculation Parameters & Assessment Scope</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Taxpayer Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Taxpayer (करदाता छनोट)
            </label>
            <select
              value={selectedTaxpayerId}
              onChange={(e) => setSelectedTaxpayerId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs md:text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {taxpayers.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.fullanme} ({tp.code}) - Ward {tp.ward_no || 1}
                </option>
              ))}
            </select>
          </div>

          {/* From Fiscal Year */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              From Fiscal Year (शुरु आर्थिक वर्ष)
            </label>
            <select
              value={fromFiscalYearId}
              onChange={(e) => setFromFiscalYearId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs md:text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            >
              {fiscalYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.code} - {fy.fullname}
                </option>
              ))}
            </select>
          </div>

          {/* To Fiscal Year */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              To Fiscal Year (अन्तिम आर्थिक वर्ष)
            </label>
            <select
              value={toFiscalYearId}
              onChange={(e) => setToFiscalYearId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs md:text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            >
              {fiscalYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.code} - {fy.fullname}
                </option>
              ))}
            </select>
          </div>

          {/* Scope Mode: Consolidated vs Individual */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Assessment Scope (दायरा)
            </label>
            <select
              value={scope}
              onChange={(e) => {
                setScope(e.target.value as any);
                setSelectedPropertyId(undefined);
              }}
              className="w-full px-3 py-2 text-xs md:text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">Consolidated (All Land & Houses)</option>
              <option value="land">Individual Land Parcel (जग्गा कित्ता)</option>
              <option value="house">Individual House / Structure (घर)</option>
            </select>
          </div>
        </div>

        {/* Secondary Selector if Individual Scope is chosen */}
        {scope === "land" && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <div className="w-full max-w-md">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Specific Land Parcel (जग्गा छनोट)
              </label>
              <select
                value={selectedPropertyId || ""}
                onChange={(e) => setSelectedPropertyId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="">-- Choose Land Parcel --</option>
                {availableLands.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    Kitta No. {l.kitta_number} (Area: {l.area_sqfeet} sq.ft, Ward {l.ward_no})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {scope === "house" && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <div className="w-full max-w-md">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Specific House Structure (घर छनोट)
              </label>
              <select
                value={selectedPropertyId || ""}
                onChange={(e) => setSelectedPropertyId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="">-- Choose House Structure --</option>
                {availableHouses.map((h: any) => (
                  <option key={h.id} value={h.id}>
                    {h.house_no} (Plinth: {h.plinth_area} sq.ft, {h.floor_no} Floors)
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Display */}
      {result && (
        <div className="space-y-6 animate-in fade-in">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Assessed Span
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-1 font-mono">
                {result.fromFiscalYear?.code} - {result.toFiscalYear?.code}
              </div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                {result.yearsCount} Fiscal Year{result.yearsCount > 1 ? "s" : ""}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Base Tax Sum
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-1 font-mono">
                NPR {result.totalBaseTaxSum?.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Statutory slab tax</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 p-4 rounded-2xl shadow-xs bg-rose-50/20 dark:bg-rose-950/20">
              <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Total Overdue Fines
              </div>
              <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-1 font-mono">
                + NPR {result.totalFinesAccrued?.toLocaleString()}
              </div>
              <div className="text-[10px] text-rose-500 mt-0.5">बक्यौता जरिवाना / ब्याज</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 p-4 rounded-2xl shadow-xs bg-emerald-50/20 dark:bg-emerald-950/20">
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Total Rebates
              </div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                - NPR {result.totalRebatesDeducted?.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-500 mt-0.5">समयमै बुझाउने छुट</div>
            </div>

            <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-4 rounded-2xl shadow-md">
              <div className="text-[11px] font-semibold text-indigo-200 uppercase tracking-wider">
                Grand Total Payable
              </div>
              <div className="text-lg font-black mt-1 font-mono text-emerald-300">
                NPR {result.netGrandTotalPayable?.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">कुल बुझाउनुपर्ने कर दायित्व</div>
            </div>
          </div>

          {/* Assessment Target Card */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                {result.taxpayer?.fullanme?.charAt(0) || "T"}
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {result.taxpayer?.fullanme}
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  Code: {result.taxpayer?.code} · Citizenship: {result.taxpayer?.citizenship_no || "N/A"} · PAN: {result.taxpayer?.pan_vat_no || "N/A"} · Ward {result.taxpayer?.ward_no || 1}
                </div>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium">
              <span className="text-slate-400 mr-1.5 font-bold">Scope:</span>
              <span>{result.targetPropertyDescription}</span>
            </div>
          </div>

          {/* Detailed Year-by-Year Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Fiscal Year Progression & Itemized Breakdown
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Depreciation schedules & fine/rebate applied chronologically
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Fiscal Year</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Land Valuation</th>
                    <th className="px-4 py-3 text-right">Building (Net Dep.)</th>
                    <th className="px-4 py-3 text-right">Total Base</th>
                    <th className="px-4 py-3 text-center">Tax Slab</th>
                    <th className="px-4 py-3 text-right">Base Tax</th>
                    <th className="px-4 py-3 text-right">Fine / Rebate</th>
                    <th className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">Net Year Tax</th>
                    <th className="px-4 py-3 text-right font-bold">Cumulative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {result.yearlyBreakdowns?.map((item: any) => (
                    <tr
                      key={item.fiscalYearId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div>{item.fiscalYearCode}</div>
                        <div className="text-[10px] text-slate-400 font-normal">BS {item.bsYear}</div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.status === "arrears" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            Prior Arrears (बक्यौता)
                          </span>
                        )}
                        {item.status === "current" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            Current FY (चालु वर्ष)
                          </span>
                        )}
                        {item.status === "advance" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Advance (अग्रिम)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        NPR {item.landValuation?.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        NPR {item.houseValuation?.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                        NPR {item.totalValuation?.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-center font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        {item.taxSlabPercent}%
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        NPR {item.baseTaxLiability?.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                        {item.fineAmount > 0 && (
                          <div className="text-rose-600 dark:text-rose-400 font-semibold">
                            +{item.finePercent}% (NPR {item.fineAmount})
                          </div>
                        )}
                        {item.rebateAmount > 0 && (
                          <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            -{item.rebatePercent}% (NPR {item.rebateAmount})
                          </div>
                        )}
                        {item.fineAmount === 0 && item.rebateAmount === 0 && (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/20">
                        NPR {item.netPayableYearTax?.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        NPR {item.cumulativeRunningTotal?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
