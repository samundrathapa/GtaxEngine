import React from "react";
import { IAuditLogRecord } from "../../serverside/AuditLogs/AuditLogsModel.ts";
import { X, ShieldAlert, FileText, Database, User, Calendar, Clock } from "lucide-react";

interface AuditLogsWindowProps {
  isOpen: boolean;
  onClose: () => void;
  logItem?: IAuditLogRecord | null;
}

export const AuditLogsWindow: React.FC<AuditLogsWindowProps> = ({
  isOpen,
  onClose,
  logItem
}) => {
  if (!isOpen || !logItem) return null;

  const timestamp = logItem.created_at || logItem.insert_on || new Date().toISOString();
  const dateStr = timestamp.split("T")[0] || timestamp;
  const timeStr = timestamp.includes("T") ? timestamp.split("T")[1]?.slice(0, 8) : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span>Audit Log Record Details #{logItem.id}</span>
              <p className="text-[10px] font-mono text-slate-500 font-normal">
                Table/Menu: {logItem.table_name || logItem.module_name || "System"}
              </p>
            </div>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Scrollable */}
        <div className="p-6 space-y-5 text-xs overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Operation / Action</span>
              <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-lg font-bold">
                {logItem.action_type || logItem.action_name || "SYSTEM_EVENT"}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                <User className="w-3 h-3" /> Operator / User
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {logItem.username_attempt || `User #${logItem.user_id || "1"}`}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Timestamp
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                {dateStr} {timeStr}
              </span>
            </div>
          </div>

          {/* Table & Field Changes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-indigo-500" /> Table Name (Menu Name)
              </span>
              <div className="font-mono font-bold text-slate-900 dark:text-white">
                {logItem.table_name || logItem.module_name || "tbl_general"}
              </div>
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-500" /> Field Name Changes
              </span>
              <div className="font-mono font-bold text-slate-900 dark:text-white">
                {logItem.field_name || "ALL"}
              </div>
            </div>
          </div>

          {/* Old Value vs New Value Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] uppercase font-semibold text-rose-500 block mb-1">
                Old Value
              </span>
              <pre className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 rounded-2xl text-xs font-mono overflow-x-auto max-h-40">
                {logItem.old_value || "No prior value (Insert event)"}
              </pre>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-emerald-600 block mb-1">
                New Value
              </span>
              <pre className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-mono overflow-x-auto max-h-40">
                {logItem.new_value || logItem.details || "No new value recorded"}
              </pre>
            </div>
          </div>

          {/* Client IP & Full Payload */}
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
              Client IP & Full Details Payload
            </span>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-2xl text-xs font-mono overflow-x-auto max-h-32">
              {logItem.details || `Client IP: ${logItem.client_ip || "127.0.0.1"}`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-600/30 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
