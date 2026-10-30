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

interface MunicipalDashboardPanelProps {
  onNavigate: (tab: "taxpayer" | "calculation" | "masters" | "rate" | "users") => void;
  onOpenNewTaxpayer?: () => void;
  currentLang?: "nep" | "ind" | "eng";
}

export const MunicipalDashboardPanel: React.FC<MunicipalDashboardPanelProps> = ({
  onNavigate,
  onOpenNewTaxpayer,
  currentLang = "eng"
}) => {
  const [stats, setStats] = useState({
    totalTaxpayers: 124,
    totalValuation: "Rs. 842.5M",
    collectedTax: "Rs. 18.42M",
    collectionRate: "84.6%",
    pendingAssessments: 12,
    activeFiscalYear: "2081/2082 BS"
  });

  const recentAssessments = [
    {
      id: 1,
      taxpayer: "Ram Bahadur Thapa (राम बहादुर थापा)",
      code: "TP-2081-0001",
      ward: 1,
      kitta: "२४९ (249)",
      assessed: "Rs. 9,052,000",
      taxDue: "Rs. 12,220",
      status: "Paid",
      date: "2081-07-02"
    },
    {
      id: 2,
      taxpayer: "Sita Maya Shrestha (सीता माया श्रेष्ठ)",
      code: "TP-2081-0002",
      ward: 2,
      kitta: "५१८ (518)",
      assessed: "Rs. 14,250,000",
      taxDue: "Rs. 23,800",
      status: "Assessed",
      date: "2081-07-03"
    },
    {
      id: 3,
      taxpayer: "Himalayan Trading Syndicate Ltd",
      code: "TP-2081-0003",
      ward: 1,
      kitta: "१०२/क (102A)",
      assessed: "Rs. 42,800,000",
      taxDue: "Rs. 74,500",
      status: "Pending",
      date: "2081-07-04"
    },
    {
      id: 4,
      taxpayer: "Bishnu Prasad Adhikari",
      code: "TP-2081-0004",
      ward: 3,
      kitta: "४१२ (412)",
      assessed: "Rs. 6,400,000",
      taxDue: "Rs. 8,640",
      status: "Paid",
      date: "2081-07-04"
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Municipal Overview */}
      <div className="p-6 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 rounded-full border border-indigo-400/30">
                FY {stats.activeFiscalYear} Live
              </span>
             
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Municipal Property Tax Administration
            </h1>
           
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate("taxpayer")}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
            >
              <Users className="w-4 h-4" />
              <span>Taxpayer Registry</span>
            </button>
            <button
              onClick={() => onNavigate("calculation")}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-amber-600/30 flex items-center gap-2 transition"
            >
              <Calculator className="w-4 h-4" />
              <span>Valuation Window</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Taxpayers */}
        <div
          onClick={() => onNavigate("taxpayer")}
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Taxpayer Citizens
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
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
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assessed Valuation
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {stats.totalValuation}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across 342 land & house units
          </div>
        </div>

        {/* Tax Revenue Collected */}
        <div
          onClick={() => onNavigate("calculation")}
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tax Revenue
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
          <div className="font-bold text-sm text-slate-900 dark:text-white">Taxpayer</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Registry, Dossier, Land & House Assets</div>
        </button>

        <button
          onClick={() => onNavigate("calculation")}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-xs text-left transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Calculator className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white">Calculation</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Frontend + Manual 5-Step Valuation</div>
        </button>

        <button
          onClick={() => onNavigate("masters")}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 shadow-xs text-left transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Sliders className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white">Master</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Fiscal Year, Rates & System Tables</div>
        </button>

        <button
          onClick={() => onNavigate("users")}
          className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 shadow-xs text-left transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white">User & RBAC</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Accounts, Roles, Permissions & Logs</div>
        </button>
      </div>

      {/* Recent Tax Assessments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Recent Municipal Property Assessments
            </h3>
           
          </div>
          <button
            onClick={() => onNavigate("taxpayer")}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>View All in Taxpayer Hub</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 pl-5">Taxpayer Citizen</th>
                <th className="p-3.5">Code</th>
                <th className="p-3.5">Ward / Parcel</th>
                <th className="p-3.5">Assessed Valuation</th>
                <th className="p-3.5">Tax Payable</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 pr-5 text-right">Actions</th>
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
