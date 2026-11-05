import React from "react";
import { IAuditLogRecord } from "../../serverside/AuditLogs/AuditLogsModel.ts";
import { X, ShieldAlert } from "lucide-react";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <span>Audit Log Details #{logItem.id}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Action / Event
            </span>
            <div className="font-mono text-indigo-600 font-bold">{logItem.action_type || "SYSTEM_EVENT"}</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                Module
              </span>
              <div className="font-medium">{logItem.module_name || "System"}</div>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                User / Operator ID
              </span>
              <div className="font-mono">{logItem.user_id || "SYSTEM"}</div>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Client IP Address
            </span>
            <div className="font-mono">{logItem.client_ip || "127.0.0.1"}</div>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              Payload / Event Details
            </span>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto max-h-48">
              {typeof logItem.details === "object" ? JSON.stringify(logItem.details, null, 2) : String(logItem.details || "No detail payload recorded")}
            </pre>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
