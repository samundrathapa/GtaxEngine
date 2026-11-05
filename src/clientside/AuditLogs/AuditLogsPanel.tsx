import React, { useEffect, useState } from "react";
import { auditLogsStoreInstance } from "./AuditLogsStore.ts";
import { AuditLogsController } from "./AuditLogsController.ts";
import { AuditLogsWindow } from "./AuditLogsWindow.tsx";
import { IAuditLogRecord } from "../../serverside/AuditLogs/AuditLogsModel.ts";
import { Search, Eye, ShieldAlert, RefreshCw } from "lucide-react";

export const AuditLogsPanel: React.FC = () => {
  const [storeState, setStoreState] = useState(auditLogsStoreInstance.getState());
  const [searchQuery, setSearchQuery] = useState("");
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<IAuditLogRecord | null>(null);

  useEffect(() => {
    const unsubscribe = auditLogsStoreInstance.subscribe(() => {
      setStoreState(auditLogsStoreInstance.getState());
    });
    return unsubscribe;
  }, []);

  const loadData = async (query: string = "") => {
    await AuditLogsController.GetSearchTemplate(query);
  };

  useEffect(() => {
    loadData(searchQuery);
  }, [searchQuery]);

  const { logs, loading } = storeState;

  return (
    <div className="space-y-6">
      {/* Header & Sub-toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Audit & Security Logs</span>
            <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full font-mono">
              clientside/AuditLogs & serverside/AuditLogs
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Powered by AuditLogsController, AuditLogsService, AuditLogsModel & AuditLogsRepo with GetSearchTemplate & GetComboTemplate
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(searchQuery)}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Reload via GetSearchTemplate API"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search via api/AuditLogs/GetSearchTemplate..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          {loading && (
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{logs.length}</span> audit logs in <span className="font-mono text-indigo-500">tbl_user_log</span>
        </div>
      </div>

      {/* Data Grid / Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <tr>
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Client IP</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div>No security/audit logs recorded in tbl_user_log.</div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        #{log.id}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        {log.action_type || "SYSTEM_EVENT"}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-700 dark:text-slate-300">
                        User #{log.user_id || "1"}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                        {log.client_ip || "127.0.0.1"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={async () => {
                            const editData = await AuditLogsController.GetItemTemplate(log.id);
                            setSelectedLog(editData || log);
                            setIsWindowOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="GetItemTemplate for inspection"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AuditLogsWindow
        isOpen={isWindowOpen}
        onClose={() => setIsWindowOpen(false)}
        logItem={selectedLog}
      />
    </div>
  );
};
