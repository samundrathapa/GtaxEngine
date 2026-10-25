import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Calendar,
  User,
  ArrowRight,
  RefreshCw,
  Printer,
  Sparkles,
  Info,
  DollarSign,
  Building,
  MapPin,
  CheckCircle2,
  Percent,
  Sliders
} from "lucide-react";
import { ApiController } from "../api/controller.ts";
import { SupportedLang, translations } from "../utils/i18n.ts";

interface TaxLiabilityComparisonChartProps {
  currentLang?: SupportedLang;
  initialTaxpayerId?: number;
  onSelectTaxpayer?: (id: number) => void;
}

interface YearAssessmentData {
  fiscalYearId: number;
  code: string;
  fullname: string;
  bsYear: number;
  landValuation: number;
  houseValuation: number;
  totalValuation: number;
  taxSlabPercent: number;
  baseTaxLiability: number;
  fineAmount: number;
  rebateAmount: number;
  netPayable: number;
}

export const TaxLiabilityComparisonChart: React.FC<TaxLiabilityComparisonChartProps> = ({
  currentLang = "eng",
  initialTaxpayerId = 1,
  onSelectTaxpayer
}) => {
  const t = translations[currentLang];
  const [taxpayers, setTaxpayers] = useState<any[]>([]);
  const [fiscalYears, setFiscalYears] = useState<any[]>([]);
  const [selectedTaxpayerId, setSelectedTaxpayerId] = useState<number>(initialTaxpayerId);

  // Selected fiscal years to compare
  const [yearAId, setYearAId] = useState<number>(1); // e.g. 2080/81
  const [yearBId, setYearBId] = useState<number>(2); // e.g. 2081/82
  const [scope, setScope] = useState<"all" | "land" | "house">("all");
  const [activeChartView, setActiveChartView] = useState<"valuation" | "tax_breakdown" | "summary">("valuation");

  const [loading, setLoading] = useState<boolean>(false);
  const [dataA, setDataA] = useState<YearAssessmentData | null>(null);
  const [dataB, setDataB] = useState<YearAssessmentData | null>(null);
  const [taxpayerRecord, setTaxpayerRecord] = useState<any | null>(null);

  // Load masters on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [tpRes, mastersRes] = await Promise.all([
          ApiController.getTaxpayers(),
          ApiController.getPropertyMasters()
        ]);
        if (tpRes.success && Array.isArray(tpRes.data)) {
          setTaxpayers(tpRes.data);
        }
        if (mastersRes.success && mastersRes.data?.fiscalYears) {
          const sortedFys = mastersRes.data.fiscalYears.sort((a: any, b: any) => a.id - b.id);
          setFiscalYears(sortedFys);
          if (sortedFys.length >= 2) {
            setYearAId(sortedFys[0].id);
            setYearBId(sortedFys[sortedFys.length - 1].id);
          }
        }
      } catch (err) {
        console.error("Failed to load initial comparison data:", err);
      }
    };
    init();
  }, []);

  // Update selected taxpayer if prop changes
  useEffect(() => {
    if (initialTaxpayerId && initialTaxpayerId !== selectedTaxpayerId) {
      setSelectedTaxpayerId(initialTaxpayerId);
    }
  }, [initialTaxpayerId]);

  // Recalculate comparison when parameters change
  useEffect(() => {
    if (selectedTaxpayerId && yearAId && yearBId) {
      runComparison(selectedTaxpayerId, yearAId, yearBId, scope);
    }
  }, [selectedTaxpayerId, yearAId, yearBId, scope]);

  const runComparison = async (tpId: number, fyAId: number, fyBId: number, currentScope: "all" | "land" | "house") => {
    setLoading(true);
    try {
      // 1. Fetch taxpayer record
      const tpRes = await ApiController.getTaxpayerRecord(tpId);
      if (tpRes.success && tpRes.data) {
        setTaxpayerRecord(tpRes.data.taxpayer);
      }

      // 2. Compute Year A
      const resA = await ApiController.calculateMultiYearTax({
        taxpayerId: tpId,
        fromFiscalYearId: fyAId,
        toFiscalYearId: fyAId,
        scope: currentScope
      });

      // 3. Compute Year B
      const resB = await ApiController.calculateMultiYearTax({
        taxpayerId: tpId,
        fromFiscalYearId: fyBId,
        toFiscalYearId: fyBId,
        scope: currentScope
      });

      if (resA.success && resA.data?.yearlyBreakdowns?.[0]) {
        const itemA = resA.data.yearlyBreakdowns[0];
        setDataA({
          fiscalYearId: fyAId,
          code: itemA.fiscalYearCode,
          fullname: itemA.fiscalYearName,
          bsYear: itemA.bsYear,
          landValuation: itemA.landValuation,
          houseValuation: itemA.houseValuation,
          totalValuation: itemA.totalValuation,
          taxSlabPercent: itemA.taxSlabPercent,
          baseTaxLiability: itemA.baseTaxLiability,
          fineAmount: itemA.fineAmount,
          rebateAmount: itemA.rebateAmount,
          netPayable: itemA.netPayableYearTax
        });
      }

      if (resB.success && resB.data?.yearlyBreakdowns?.[0]) {
        const itemB = resB.data.yearlyBreakdowns[0];
        setDataB({
          fiscalYearId: fyBId,
          code: itemB.fiscalYearCode,
          fullname: itemB.fiscalYearName,
          bsYear: itemB.bsYear,
          landValuation: itemB.landValuation,
          houseValuation: itemB.houseValuation,
          totalValuation: itemB.totalValuation,
          taxSlabPercent: itemB.taxSlabPercent,
          baseTaxLiability: itemB.baseTaxLiability,
          fineAmount: itemB.fineAmount,
          rebateAmount: itemB.rebateAmount,
          netPayable: itemB.netPayableYearTax
        });
      }
    } catch (err) {
      console.error("Comparison computation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatNpr = (amount: number) => {
    return "Rs. " + Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  const calcDiff = (valB: number = 0, valA: number = 0) => {
    const diff = valB - valA;
    const pct = valA > 0 ? ((diff / valA) * 100).toFixed(1) : diff > 0 ? "100.0" : "0.0";
    return { diff, pct: Number(pct) };
  };

  const landDiff = calcDiff(dataB?.landValuation, dataA?.landValuation);
  const houseDiff = calcDiff(dataB?.houseValuation, dataA?.houseValuation);
  const totalValDiff = calcDiff(dataB?.totalValuation, dataA?.totalValuation);
  const baseTaxDiff = calcDiff(dataB?.baseTaxLiability, dataA?.baseTaxLiability);
  const netTaxDiff = calcDiff(dataB?.netPayable, dataA?.netPayable);

  // Recharts Chart Data
  const valuationChartData = [
    {
      category: "Land Valuation (जग्गा मुल्यांकन)",
      [dataA?.code || "Year A"]: dataA?.landValuation || 0,
      [dataB?.code || "Year B"]: dataB?.landValuation || 0,
      diff: landDiff.diff
    },
    {
      category: "House/Floor Valuation (घर मुल्यांकन)",
      [dataA?.code || "Year A"]: dataA?.houseValuation || 0,
      [dataB?.code || "Year B"]: dataB?.houseValuation || 0,
      diff: houseDiff.diff
    },
    {
      category: "Total Assessed Valuation (कुल सम्पत्ति)",
      [dataA?.code || "Year A"]: dataA?.totalValuation || 0,
      [dataB?.code || "Year B"]: dataB?.totalValuation || 0,
      diff: totalValDiff.diff
    }
  ];

  const taxBreakdownChartData = [
    {
      category: "Base Tax Liability (आधार कर)",
      [dataA?.code || "Year A"]: dataA?.baseTaxLiability || 0,
      [dataB?.code || "Year B"]: dataB?.baseTaxLiability || 0
    },
    {
      category: "Penalties / Fine (जरिवाना)",
      [dataA?.code || "Year A"]: dataA?.fineAmount || 0,
      [dataB?.code || "Year B"]: dataB?.fineAmount || 0
    },
    {
      category: "Rebates Deducted (छुट रकम)",
      [dataA?.code || "Year A"]: dataA?.rebateAmount || 0,
      [dataB?.code || "Year B"]: dataB?.rebateAmount || 0
    },
    {
      category: "Net Tax Payable (खुद बुझाउने रकम)",
      [dataA?.code || "Year A"]: dataA?.netPayable || 0,
      [dataB?.code || "Year B"]: dataB?.netPayable || 0
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header & Controls Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Tax Liability Side-by-Side Comparison
              </h2>
            </div>
           
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => runComparison(selectedTaxpayerId, yearAId, yearBId, scope)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Certificate</span>
            </button>
          </div>
        </div>

        {/* Selection Matrix Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
          {/* Taxpayer Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-indigo-500" />
              <span>Taxpayer (करदाता)</span>
            </label>
            <select
              value={selectedTaxpayerId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedTaxpayerId(id);
                if (onSelectTaxpayer) onSelectTaxpayer(id);
              }}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              {taxpayers.map((tp) => (
                <option key={tp.id} value={tp.id}>
                  {tp.fullanme} ({tp.code})
                </option>
              ))}
            </select>
          </div>

          {/* Fiscal Year A */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Baseline Year A (पहिलो आ.व.)</span>
            </label>
            <select
              value={yearAId}
              onChange={(e) => setYearAId(Number(e.target.value))}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              {fiscalYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.code} - {fy.fullname.split("(")[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Fiscal Year B */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span>Comparison Year B (तुलना आ.व.)</span>
            </label>
            <select
              value={yearBId}
              onChange={(e) => setYearBId(Number(e.target.value))}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              {fiscalYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.code} - {fy.fullname.split("(")[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Assessment Scope */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-purple-500" />
              <span>Property Scope (सम्पत्ति दायरा)</span>
            </label>
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as any)}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Consolidated (Land + House)</option>
              <option value="land">Land Parcels Only (जग्गा मात्र)</option>
              <option value="house">House & Floors Only (घर मात्र)</option>
            </select>
          </div>
        </div>

        {/* Selected Taxpayer Info Strip */}
        {taxpayerRecord && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">
                {taxpayerRecord.fullanme}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                Ward No: {taxpayerRecord.ward_no || 1}
              </span>
              {taxpayerRecord.citizenship_no && (
                <span className="text-[10px] text-slate-500 font-mono">
                  Citizenship: {taxpayerRecord.citizenship_no}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>
                Comparing: <strong className="text-blue-600 dark:text-blue-400">{dataA?.code}</strong> vs{" "}
                <strong className="text-emerald-600 dark:text-emerald-400">{dataB?.code}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Highlight Difference Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Land Valuation Difference */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Land Valuation (जग्गा)
            </span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <MapPin className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-xs text-slate-500">
              {dataA?.code}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatNpr(dataA?.landValuation || 0)}</span>
            </div>
            <div className="text-xs text-slate-500">
              {dataB?.code}: <span className="font-bold text-slate-900 dark:text-white">{formatNpr(dataB?.landValuation || 0)}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Difference</div>
            <div
              className={`flex items-center gap-1 text-xs font-black ${
                landDiff.diff > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : landDiff.diff < 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-500"
              }`}
            >
              {landDiff.diff > 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : landDiff.diff < 0 ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : null}
              <span>
                {landDiff.diff >= 0 ? "+" : ""}
                {formatNpr(landDiff.diff)} ({landDiff.pct >= 0 ? "+" : ""}
                {landDiff.pct}%)
              </span>
            </div>
          </div>
        </div>

        {/* House Valuation Difference */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              House Valuation (घर)
            </span>
            <div className="p-1.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg">
              <Building className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-xs text-slate-500">
              {dataA?.code}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatNpr(dataA?.houseValuation || 0)}</span>
            </div>
            <div className="text-xs text-slate-500">
              {dataB?.code}: <span className="font-bold text-slate-900 dark:text-white">{formatNpr(dataB?.houseValuation || 0)}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">
              Depreciation / Rate Diff
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-black ${
                houseDiff.diff > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : houseDiff.diff < 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-500"
              }`}
            >
              {houseDiff.diff > 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : houseDiff.diff < 0 ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : null}
              <span>
                {houseDiff.diff >= 0 ? "+" : ""}
                {formatNpr(houseDiff.diff)} ({houseDiff.pct >= 0 ? "+" : ""}
                {houseDiff.pct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Total Wealth Assessment */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Valuation (कुल सम्पत्ति)
            </span>
            <div className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-xs text-slate-500">
              {dataA?.code}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatNpr(dataA?.totalValuation || 0)}</span>
            </div>
            <div className="text-xs text-slate-500">
              {dataB?.code}: <span className="font-bold text-slate-900 dark:text-white">{formatNpr(dataB?.totalValuation || 0)}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Total Delta</div>
            <div
              className={`flex items-center gap-1 text-xs font-black ${
                totalValDiff.diff >= 0
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              <span>
                {totalValDiff.diff >= 0 ? "+" : ""}
                {formatNpr(totalValDiff.diff)} ({totalValDiff.pct >= 0 ? "+" : ""}
                {totalValDiff.pct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Net Tax Liability Difference */}
        <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Net Tax Payable (खुद कर)
            </span>
            <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-xs">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-xs text-slate-500">
              {dataA?.code}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatNpr(dataA?.netPayable || 0)}</span>
            </div>
            <div className="text-xs text-slate-500">
              {dataB?.code}: <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatNpr(dataB?.netPayable || 0)}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
            <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Liability Change</div>
            <div
              className={`flex items-center gap-1 text-xs font-black ${
                netTaxDiff.diff > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : netTaxDiff.diff < 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500"
              }`}
            >
              {netTaxDiff.diff > 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : netTaxDiff.diff < 0 ? (
                <TrendingDown className="w-3.5 h-3.5" />
              ) : null}
              <span>
                {netTaxDiff.diff >= 0 ? "+" : ""}
                {formatNpr(netTaxDiff.diff)} ({netTaxDiff.pct >= 0 ? "+" : ""}
                {netTaxDiff.pct}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization Component */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart className="w-4 h-4 text-indigo-500" />
              <span>
                {activeChartView === "valuation"
                  ? "Valuation Comparison Chart (मुल्यांकन तुलना)"
                  : "Tax Liabilities & Fine/Rebate Breakdown Chart"}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Side-by-side grouped bars for fiscal years {dataA?.code} vs {dataB?.code}
            </p>
          </div>

          {/* Chart View Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveChartView("valuation")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeChartView === "valuation"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Valuations (सम्पत्ति मुल्यांकन)
            </button>
            <button
              onClick={() => setActiveChartView("tax_breakdown")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeChartView === "tax_breakdown"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Tax & Penalties (कर दायित्व)
            </button>
          </div>
        </div>

        {/* Recharts Render Container */}
        <div className="pt-6 h-80 sm:h-96 w-full">
          {activeChartView === "valuation" ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={valuationChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(val) => `Rs. ${(val / 100000).toFixed(1)}L`}
                />
                <Tooltip
                  formatter={(value: any) => [formatNpr(value), ""]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px"
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "15px", fontSize: "12px" }}
                />
                <Bar
                  dataKey={dataA?.code || "Year A"}
                  name={`FY ${dataA?.code || "Year A"}`}
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
                <Bar
                  dataKey={dataB?.code || "Year B"}
                  name={`FY ${dataB?.code || "Year B"}`}
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={taxBreakdownChartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(val) => `Rs. ${Number(val).toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value: any) => [formatNpr(value), ""]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px"
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: "15px", fontSize: "12px" }}
                />
                <Bar
                  dataKey={dataA?.code || "Year A"}
                  name={`FY ${dataA?.code || "Year A"}`}
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
                <Bar
                  dataKey={dataB?.code || "Year B"}
                  name={`FY ${dataB?.code || "Year B"}`}
                  fill="#ec4899"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Side-by-Side Detailed Data Matrix Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs overflow-hidden">
        <h3 className="text-sm font-black text-slate-900 dark:text-white pb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500" />
          <span>Audit Variance Matrix (विवरणगत तुलना तालिका)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider border-y border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Evaluation Metric</th>
                <th className="py-3 px-4 text-blue-600 dark:text-blue-400">
                  FY {dataA?.code} (Baseline)
                </th>
                <th className="py-3 px-4 text-emerald-600 dark:text-emerald-400">
                  FY {dataB?.code} (Comparison)
                </th>
                <th className="py-3 px-4">Variance (NPR)</th>
                <th className="py-3 px-4">Variance (%)</th>
                <th className="py-3 px-4">Driver / Statutory Cause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                  Land Assessed Valuation (जग्गा)
                </td>
                <td className="py-3 px-4 font-mono">{formatNpr(dataA?.landValuation || 0)}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                  {formatNpr(dataB?.landValuation || 0)}
                </td>
                <td className={`py-3 px-4 font-mono font-bold ${landDiff.diff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {landDiff.diff >= 0 ? "+" : ""}{formatNpr(landDiff.diff)}
                </td>
                <td className={`py-3 px-4 font-mono font-bold ${landDiff.pct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {landDiff.pct >= 0 ? "+" : ""}{landDiff.pct}%
                </td>
                <td className="py-3 px-4 text-slate-500 text-[11px]">
                  {landDiff.diff > 0 ? "Updated municipal tariff" : "Same base matrix"}
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                  House / Floor Valuation (घर)
                </td>
                <td className="py-3 px-4 font-mono">{formatNpr(dataA?.houseValuation || 0)}</td>
                <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                  {formatNpr(dataB?.houseValuation || 0)}
                </td>
                <td className={`py-3 px-4 font-mono font-bold ${houseDiff.diff >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {houseDiff.diff >= 0 ? "+" : ""}{formatNpr(houseDiff.diff)}
                </td>
                <td className={`py-3 px-4 font-mono font-bold ${houseDiff.pct >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {houseDiff.pct >= 0 ? "+" : ""}{houseDiff.pct}%
                </td>
                <td className="py-3 px-4 text-slate-500 text-[11px]">
                  {houseDiff.diff < 0 ? "Annual depreciation schedule" : "Structural revaluation"}
                </td>
              </tr>

              <tr className="bg-slate-50/50 dark:bg-slate-950/30">
                <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                  Total Municipal Assessment (कुल सम्पत्ति)
                </td>
                <td className="py-3 px-4 font-mono font-bold">{formatNpr(dataA?.totalValuation || 0)}</td>
                <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-white">
                  {formatNpr(dataB?.totalValuation || 0)}
                </td>
                <td className={`py-3 px-4 font-mono font-black ${totalValDiff.diff >= 0 ? "text-blue-600" : "text-rose-600"}`}>
                  {totalValDiff.diff >= 0 ? "+" : ""}{formatNpr(totalValDiff.diff)}
                </td>
                <td className="py-3 px-4 font-mono font-black text-blue-600">
                  {totalValDiff.pct >= 0 ? "+" : ""}{totalValDiff.pct}%
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-semibold text-[11px]">
                  Combined Net Taxable Base
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                  Applied Tax Slab Bracket
                </td>
                <td className="py-3 px-4 font-mono">{dataA?.taxSlabPercent || 0.1}%</td>
                <td className="py-3 px-4 font-mono font-bold text-indigo-600">{dataB?.taxSlabPercent || 0.1}%</td>
                <td className="py-3 px-4 font-mono text-slate-400">-</td>
                <td className="py-3 px-4 font-mono text-slate-400">-</td>
                <td className="py-3 px-4 text-slate-500 text-[11px]">
                  Progressive bracket threshold
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                  Base Tax Liability (आधार कर)
                </td>
                <td className="py-3 px-4 font-mono">{formatNpr(dataA?.baseTaxLiability || 0)}</td>
                <td className="py-3 px-4 font-mono font-bold">{formatNpr(dataB?.baseTaxLiability || 0)}</td>
                <td className="py-3 px-4 font-mono font-bold">{formatNpr(baseTaxDiff.diff)}</td>
                <td className="py-3 px-4 font-mono font-bold">{baseTaxDiff.pct}%</td>
                <td className="py-3 px-4 text-slate-500 text-[11px]">Valuation * Slab %</td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400">
                  Fines & Overdue Penalty
                </td>
                <td className="py-3 px-4 font-mono text-rose-600">{formatNpr(dataA?.fineAmount || 0)}</td>
                <td className="py-3 px-4 font-mono text-rose-600">{formatNpr(dataB?.fineAmount || 0)}</td>
                <td className="py-3 px-4 font-mono text-slate-500">{formatNpr((dataB?.fineAmount || 0) - (dataA?.fineAmount || 0))}</td>
                <td className="py-3 px-4 font-mono text-slate-500">-</td>
                <td className="py-3 px-4 text-slate-500 text-[11px]">Arrears penalty policy</td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                  Early Rebate Discount
                </td>
                <td className="py-3 px-4 font-mono text-emerald-600">-{formatNpr(dataA?.rebateAmount || 0)}</td>
                <td className="py-3 px-4 font-mono text-emerald-600">-{formatNpr(dataB?.rebateAmount || 0)}</td>
                <td className="py-3 px-4 font-mono text-slate-500">-{formatNpr((dataB?.rebateAmount || 0) - (dataA?.rebateAmount || 0))}</td>
                <td className="py-3 px-4 font-mono text-slate-500">-</td>
                <td className="py-3 px-4 text-slate-500 text-[11px]">Early payment incentive rebate</td>
              </tr>

              <tr className="bg-indigo-50/70 dark:bg-indigo-950/40">
                <td className="py-3.5 px-4 font-black text-indigo-900 dark:text-indigo-200">
                  Net Tax Payable (खुद तिर्नुपर्ने कर)
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                  {formatNpr(dataA?.netPayable || 0)}
                </td>
                <td className="py-3.5 px-4 font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  {formatNpr(dataB?.netPayable || 0)}
                </td>
                <td className={`py-3.5 px-4 font-mono font-black ${netTaxDiff.diff > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {netTaxDiff.diff >= 0 ? "+" : ""}{formatNpr(netTaxDiff.diff)}
                </td>
                <td className={`py-3.5 px-4 font-mono font-black ${netTaxDiff.pct > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  {netTaxDiff.pct >= 0 ? "+" : ""}{netTaxDiff.pct}%
                </td>
                <td className="py-3.5 px-4 text-indigo-800 dark:text-indigo-300 font-bold text-[11px]">
                  Total Municipal Due
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
