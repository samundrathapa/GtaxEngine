import React, { useState, useEffect } from "react";
import {
  Users,
  Calculator,
  Sliders,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Building,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  FileText
} from "lucide-react";

import { ApiController } from "../api/controller.ts";
import { tText, subscribeToTranslations, SupportedLang } from "../utils/i18n.ts";

interface MunicipalDashboardPanelProps {
  onNavigate: (tab: "taxpayer" | "calculation" | "masters" | "rate" | "users") => void;
  onOpenNewTaxpayer?: () => void;
  currentLang?: SupportedLang;
  activeFiscalYearCode?: string;
  activeFiscalYearId?: number;
}

export const MunicipalDashboardPanel: React.FC<MunicipalDashboardPanelProps> = ({
  onNavigate,
  onOpenNewTaxpayer,
  currentLang = "eng",
  activeFiscalYearCode,
  activeFiscalYearId
}) => {
  const [, setLangVersion] = useState(0);
  useEffect(() => {
    return subscribeToTranslations(() => setLangVersion((v) => v + 1));
  }, []);
  const tr = (text: string) => tText(text, currentLang);
  const initialFy = activeFiscalYearCode
    ? (activeFiscalYearCode.endsWith("BS") ? activeFiscalYearCode : `${activeFiscalYearCode} BS`)
    : (localStorage.getItem("gtax_active_fy_code") ? `${localStorage.getItem("gtax_active_fy_code")} BS` : "Active FY");

  const [stats, setStats] = useState({
    totalTaxpayers: 124,
    totalValuation: "Rs. 842.5M",
    collectedTax: "Rs. 18.42M",
    collectionRate: "84.6%",
    pendingAssessments: 12,
    activeFiscalYear: initialFy
  });

  const loadDashboardData = async () => {
    try {
      const [mastersRes, tpRes] = await Promise.all([
        ApiController.getPropertyMasters(),
        ApiController.getTaxpayers()
      ]);

      if (mastersRes.success && mastersRes.data) {
        const appSetting = mastersRes.data.applicationSettings?.[0];
        const fyId = appSetting?.fiscal_year_id;
        const fys = mastersRes.data.fiscalYears || [];
        const matchedFy = (fyId ? fys.find((f: any) => f.id === fyId) : null)
          || (activeFiscalYearCode ? fys.find((f: any) => f.code === activeFiscalYearCode) : null)
          || fys.find((f: any) => f.is_active)
          || fys[0];

        const fyCode = matchedFy?.code || activeFiscalYearCode || "2081/82";
        const formattedFy = fyCode.endsWith("BS") ? fyCode : `${fyCode} BS`;

        const tpCount = tpRes.success && Array.isArray(tpRes.data) ? tpRes.data.length : 124;

        setStats((prev) => ({
          ...prev,
          totalTaxpayers: tpCount > 0 ? tpCount : prev.totalTaxpayers,
          activeFiscalYear: formattedFy
        }));
      }
    } catch (err) {
      console.warn("Failed to load dynamic dashboard statistics:", err);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handleUpdate = (e?: any) => {
      if (e?.detail?.fiscalYearCode) {
        const code = e.detail.fiscalYearCode;
        setStats((prev) => ({
          ...prev,
          activeFiscalYear: code.endsWith("BS") ? code : `${code} BS`
        }));
      }
      loadDashboardData();
    };

    window.addEventListener("gtax:rates_updated", handleUpdate);
    window.addEventListener("gtax:active_fy_changed", handleUpdate);

    return () => {
      window.removeEventListener("gtax:rates_updated", handleUpdate);
      window.removeEventListener("gtax:active_fy_changed", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (activeFiscalYearCode) {
      const formatted = activeFiscalYearCode.endsWith("BS") ? activeFiscalYearCode : `${activeFiscalYearCode} BS`;
      setStats((prev) => ({
        ...prev,
        activeFiscalYear: formatted
      }));
    }
  }, [activeFiscalYearCode]);

  const yearDigits = stats.activeFiscalYear.replace(/[^0-9]/g, "").slice(0, 4) || "2081";

  const recentAssessments = [
    {
      id: 1,
      taxpayer: "Ram Bahadur Thapa (राम बहादुर थापा)",
      code: `TP-${yearDigits}-0001`,
      ward: 1,
      kitta: "२४९ (249)",
      assessed: "Rs. 9,052,000",
      taxDue: "Rs. 12,220",
      status: "Paid",
      date: `${yearDigits}-07-02`
    },
    {
      id: 2,
      taxpayer: "Sita Maya Shrestha (सीता माया श्रेष्ठ)",
      code: `TP-${yearDigits}-0002`,
      ward: 2,
      kitta: "५१८ (518)",
      assessed: "Rs. 14,250,000",
      taxDue: "Rs. 23,800",
      status: "Assessed",
      date: `${yearDigits}-07-03`
    },
    {
      id: 3,
      taxpayer: "Himalayan Trading Syndicate Ltd",
      code: `TP-${yearDigits}-0003`,
      ward: 1,
      kitta: "१०२/क (102A)",
      assessed: "Rs. 42,800,000",
      taxDue: "Rs. 74,500",
      status: "Pending",
      date: `${yearDigits}-07-04`
    },
    {
      id: 4,
      taxpayer: "Bishnu Prasad Adhikari",
      code: `TP-${yearDigits}-0004`,
      ward: 3,
      kitta: "४१२ (412)",
      assessed: "Rs. 6,400,000",
      taxDue: "Rs. 8,640",
      status: "Paid",
      date: `${yearDigits}-07-04`
    }
  ];

  return (
    <div className="space-y-2 m-[3px] animate-in fade-in duration-200">
      {/* Top Banner / Municipal Overview */}
      <div className="p-3.5 bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 rounded-full border border-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>FY {stats.activeFiscalYear} Live</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {tr("Municipal Property Tax Administration")}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate("taxpayer")}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>{tr("Taxpayer Registry")}</span>
            </button>
            <button
              onClick={() => onNavigate("calculation")}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Calculator className="w-4 h-4 text-amber-500" />
              <span>{tr("Valuation Window")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* Total Taxpayers */}
        <div
          onClick={() => onNavigate("taxpayer")}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {tr("Taxpayer Citizens")}
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {stats.totalTaxpayers}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+8 new this week</span>
          </div>
        </div>

        {/* Total Assessed Valuation */}
        <div
          onClick={() => onNavigate("calculation")}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {tr("assessedValuation")}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            {stats.totalValuation}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across 342 land &amp; house units
          </div>
        </div>

        {/* Tax Revenue Collected */}
        <div
          onClick={() => onNavigate("calculation")}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {tr("Tax Revenue")}
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.collectedTax}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{stats.collectionRate} collection efficiency</span>
          </div>
        </div>
      </div>

      {/* Main Core Action Hubs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          onClick={() => onNavigate("taxpayer")}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-xs text-left transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white">{tr("taxpayer")}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Registry, Dossier, Land & House Assets</div>
        </button>

        <button
          onClick={() => onNavigate("calculation")}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-xs text-left transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Calculator className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white">{tr("calculation")}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Frontend + Manual 5-Step Valuation</div>
        </button>

        <button
          onClick={() => onNavigate("masters")}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 shadow-xs text-left transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Sliders className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white">{tr("master")}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Fiscal Year, Rates & System Tables</div>
        </button>

        <button
          onClick={() => onNavigate("users")}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 shadow-xs text-left transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white">{tr("usersAndRoles")}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Accounts, Roles, Permissions & Logs</div>
        </button>
      </div>

      {/* Recent Tax Assessments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {tr("Recent Municipal Property Assessments")}
            </h3>
           
          </div>
          <button
            onClick={() => onNavigate("taxpayer")}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>{tr("View All in Taxpayer Hub")}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-200/75 text-slate-900 uppercase text-[11px] tracking-wider font-bold border-b border-slate-300">
              <tr>
                <th className="p-3.5 pl-5">{tr("Taxpayer Citizen")}</th>
                <th className="p-3.5">{tr("code")}</th>
                <th className="p-3.5">{tr("Ward / Parcel")}</th>
                <th className="p-3.5">{tr("assessedValuation")}</th>
                <th className="p-3.5">{tr("Tax Payable")}</th>
                <th className="p-3.5">{tr("Status")}</th>
                <th className="p-3.5 pr-5 text-right">{tr("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {recentAssessments.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onNavigate("taxpayer")}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition cursor-pointer"
                >
                  <td className="p-3.5 pl-5 font-sans font-bold text-slate-900 dark:text-white">
                    {item.taxpayer}
                  </td>
                  <td className="p-3.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                    {item.code}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300">
                    Ward #{item.ward} · {item.kitta}
                  </td>
                  <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                    {item.assessed}
                  </td>
                  <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                    {item.taxDue}
                  </td>
                  <td className="p-3.5 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === "Paid"
                          ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                          : item.status === "Assessed"
                          ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                          : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3.5 pr-5 text-right font-sans">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate("calculation");
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg transition"
                    >
                      Assess
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
