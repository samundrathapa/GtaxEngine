import React from "react";
import { IDashboardRecord } from "../../serverside/Dashboard/DashboardModel.ts";
import { X, Activity } from "lucide-react";

interface DashboardWindowProps {
  isOpen: boolean;
  onClose: () => void;
  metrics?: IDashboardRecord | null;
}

export const DashboardWindow: React.FC<DashboardWindowProps> = ({
  isOpen,
  onClose,
  metrics
}) => {
  if (!isOpen || !metrics) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <span>Executive Dashboard Diagnostics</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 block">Total Taxpayers</span>
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{metrics.total_taxpayers || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 block">Total Properties</span>
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{metrics.total_properties || 0}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 block">Total Revenue Assessed</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">NPR {Number(metrics.total_revenue_collected || 0).toLocaleString()}</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-500 block">Active Fiscal Year</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{metrics.active_fiscal_year || "2081/82"}</span>
            </div>
            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full">
              {metrics.system_status || "HEALTHY_LIVE_DB"}
            </span>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close Diagnostics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
