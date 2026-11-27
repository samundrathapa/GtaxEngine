import React, { useEffect, useState } from "react";
import { auditLogsStoreInstance } from "./AuditLogsStore.ts";
import { AuditLogsController } from "./AuditLogsController.ts";
import { AuditLogsWindow } from "./AuditLogsWindow.tsx";
import { IAuditLogRecord } from "../../serverside/AuditLogs/AuditLogsModel.ts";
import { Search, Eye, ShieldAlert, RefreshCw, Calendar, Clock, User, Filter } from "lucide-react";

export const AuditLogsPanel: React.FC = () => {
  const [storeState, setStoreState] = useState(auditLogsStoreInstance.getState());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [filterOperation, setFilterOperation] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterTime, setFilterTime] = useState("");

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

  // Filter logs based on user, operation type, date range, and time
  const filteredLogs = logs.filter((log: any) => {
    // General text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = (
        (log.action_type || log.action_name || "") +
        " " +
        (log.table_name || log.module_name || "") +
        " " +
        (log.username_attempt || log.user_id || "") +
        " " +
        (log.details || "")
      ).toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    // Username / Operator search
    if (filterUser.trim()) {
      const uQ = filterUser.toLowerCase();
      const uStr = String(log.username_attempt || log.user_id || "").toLowerCase();
      if (!uStr.includes(uQ)) return false;
    }

    // Operation type search
    if (filterOperation && filterOperation !== "all") {
      const op = filterOperation.toLowerCase();
      const actType = String(log.action_type || log.action_name || "").toLowerCase();
      if (!actType.includes(op)) return false;
    }

    const logDate = (log.created_at || log.insert_on || "").split("T")[0] || "";
    const logTime = (log.created_at || log.insert_on || "").includes("T")
      ? (log.created_at || log.insert_on).split("T")[1].slice(0, 5)
      : "";

    // Date From
    if (filterDateFrom && logDate) {
      if (logDate < filterDateFrom) return false;
    }

    // Date To
    if (filterDateTo && logDate) {
      if (logDate > filterDateTo) return false;
    }

    // Time search
    if (filterTime.trim() && logTime) {
      if (!logTime.includes(filterTime.trim())) return false;
    }

    return true;
  });

  return (
    <div className="space-y-2 m-[3px]">
      {/* Header & Reload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Audit &amp; Security Logs</span>
            <span className="text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Live Event Tracking
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Every insert, update, delete, login, logout, and search event is logged with table name, field changes, old value, and new value.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(searchQuery)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Reload Logs</span>
          </button>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Advanced Audit Log Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* General Keyword Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keyword..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Username / Operator Search */}
          <div className="relative">
            <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              placeholder="Filter by username / operator..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Operation Type Filter */}
          <div>
            <select
              value={filterOperation}
              onChange={(e) => setFilterOperation(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl font-semibold"
            >
              <option value="all">All Operations (Insert, Update, Delete, Login, Logout, Search)</option>
              <option value="insert">INSERT / NEW</option>
              <option value="update">UPDATE / EDIT</option>
              <option value="delete">DELETE</option>
              <option value="login">LOGIN</option>
              <option value="logout">LOGOUT</option>
              <option value="search">SEARCH</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-2 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl font-mono text-[11px]"
              title="Date From"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-2 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl font-mono text-[11px]"
              title="Date To"
            />
          </div>

          {/* Time Search */}
          <div className="relative">
            <Clock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              placeholder="Time (e.g. 14:30)..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl font-mono"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong className="text-slate-800 dark:text-white">{filteredLogs.length}</strong> of {logs.length} audit records
          </span>
          {(filterUser || filterOperation !== "all" || filterDateFrom || filterDateTo || filterTime || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterUser("");
                setFilterOperation("all");
                setFilterDateFrom("");
                setFilterDateTo("");
                setFilterTime("");
              }}
              className="text-emerald-600 hover:underline font-semibold"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Data Grid / Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs relative">
        {loading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-10">
            <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-200/75 border-b border-slate-300 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Log ID</th>
                <th className="p-3.5">Operation</th>
                <th className="p-3.5">Table (Menu)</th>
                <th className="p-3.5">Operator</th>
                <th className="p-3.5">Field Changed</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5 text-right">Inspect Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-sans">
                    <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div>No audit logs match the specified search criteria.</div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => {
                  const ts = log.created_at || log.insert_on || "";
                  return (
                    <tr
                      key={log.id}
                      onClick={() => {
                        setSelectedLog(log);
                        setIsWindowOpen(true);
                      }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        #{log.id}
                      </td>
                      <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                        {log.action_type || log.action_name || "EVENT"}
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">
                        {log.table_name || log.module_name || "General"}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                        {log.username_attempt || `User #${log.user_id || "1"}`}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {log.field_name || "ALL"}
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {ts}
                      </td>
                      <td className="p-3.5 text-right font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                            setIsWindowOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition text-xs font-bold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
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
