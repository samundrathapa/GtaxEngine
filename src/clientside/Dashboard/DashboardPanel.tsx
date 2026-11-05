import React, { useEffect, useState } from "react";
import { dashboardStoreInstance } from "./DashboardStore.ts";
import { DashboardController } from "./DashboardController.ts";
import { DashboardWindow } from "./DashboardWindow.tsx";
import { LayoutDashboard, Users, Building, DollarSign, Calendar, RefreshCw, Activity } from "lucide-react";

export const DashboardPanel: React.FC = () => {
  const [storeState, setStoreState] = useState(dashboardStoreInstance.getState());
  const [isWindowOpen, setIsWindowOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = dashboardStoreInstance.subscribe(() => {
      setStoreState(dashboardStoreInstance.getState());
    });
    return unsubscribe;
  }, []);

  const loadData = async () => {
    await DashboardController.GetSearchTemplate();
  };

  useEffect(() => {
    loadData();
  }, []);

  const { metrics, loading } = storeState;

  return (
    <div className="space-y-6">
      {/* Header & Sub-toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Executive Municipal Dashboard</span>
            <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full font-mono">
              clientside/Dashboard & serverside/Dashboard
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Powered by DashboardController, DashboardService, DashboardModel & DashboardRepo with GetSearchTemplate & GetComboTemplate
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Reload via GetSearchTemplate API"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsWindowOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Activity className="w-4 h-4" />
            Inspect Diagnostics
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Total Taxpayers</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {metrics?.total_taxpayers || 0}
            </div>
            <div className="text-[11px] text-indigo-500 mt-1">Live DB tbl_taxpayer</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Total Properties</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {metrics?.total_properties || 0}
            </div>
            <div className="text-[11px] text-blue-500 mt-1">tbl_land + tbl_house</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Revenue Assessed</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              NPR {Number(metrics?.total_revenue_collected || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-500 mt-1">tax_transactions sum</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Active Fiscal Year</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 font-mono">
              {metrics?.active_fiscal_year || "2081/82"}
            </div>
            <div className="text-[11px] text-purple-500 mt-1">System Active Target</div>
          </div>
        </div>
      </div>

      <DashboardWindow
        isOpen={isWindowOpen}
        onClose={() => setIsWindowOpen(false)}
        metrics={metrics}
      />
    </div>
  );
};
