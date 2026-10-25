import React, { useEffect, useState } from "react";
import { AuthController } from "./controller.ts";
import { TblUserLog, TblSessionLog } from "../../server/ApiServiceStruct/AuthSessionService.ts";
import { Shield, Clock, Radio, RefreshCw, Key, UserCheck, AlertTriangle } from "lucide-react";

export const SessionLogsPanel: React.FC = () => {
  const [logs, setLogs] = useState<{ userLogs: TblUserLog[]; sessionLogs: TblSessionLog[] }>({
    userLogs: [],
    sessionLogs: []
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const res = await AuthController.fetchSecurityLogs();
    if (res.success && res.data) {
      setLogs(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Security</span>
            <span aria-hidden="true">·</span>
            <span>Audit Trail</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-700">User Activity & Sessions</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Active Sessions & User Security Audit Ledger
          </h2>
          <p className="text-sm text-slate-500">
            Real-time session tracker and tamper-evident event log with audit columns.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          title="Reload logs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Active Session Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900">
              Active Sessions Ledger
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Active: <strong className="text-emerald-700">{logs.sessionLogs.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100/60 border-b border-slate-200 font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-2.5 px-4">Session ID</th>
                <th className="py-2.5 px-4">User ID</th>
                <th className="py-2.5 px-4">IP & User Agent</th>
                <th className="py-2.5 px-4">Login Time</th>
                <th className="py-2.5 px-4">Last Active</th>
                <th className="py-2.5 px-4">Audit Stamping</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.sessionLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                    No active sessions found. All sessions cleared on logout.
                  </td>
                </tr>
              ) : (
                logs.sessionLogs.map((ses) => (
                  <tr key={ses.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      {ses.session_id}
                    </td>
                    <td className="py-3 px-4 text-indigo-600 font-bold">
                      User #{ses.user_id}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-sans">
                      <div>{ses.ip_address}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{ses.user_agent}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(ses.login_time).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(ses.last_active).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 font-sans">
                      <div>insert_by: {ses.insert_by}</div>
                      <div>is_active: <span className="text-emerald-600 font-bold font-mono">TRUE</span></div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Event Stream Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              User Activity Event Stream
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Total Logged Events: {logs.userLogs.length}
          </span>
        </div>

        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100/60 border-b border-slate-200 font-semibold uppercase tracking-wider text-slate-600 sticky top-0 bg-slate-100">
              <tr>
                <th className="py-2.5 px-4">Event ID</th>
                <th className="py-2.5 px-4">User / Attempt</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Details</th>
                <th className="py-2.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.userLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-bold text-slate-800">
                    #{log.id}
                  </td>
                  <td className="py-2.5 px-4 text-slate-700">
                    <span className="font-semibold">{log.username_attempt}</span>
                    {log.user_id && <span className="text-[10px] text-slate-400 block font-mono">User ID: {log.user_id}</span>}
                  </td>
                  <td className="py-2.5 px-4 font-sans">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        log.action_name.includes("SUCCESS") || log.action_name.includes("BOOTSTRAP")
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : log.action_name.includes("LOGOUT")
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : log.action_name.includes("FAILED")
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      }`}
                    >
                      {log.action_name}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 font-sans max-w-sm truncate">
                    {log.details || "-"}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                    {new Date(log.insert_on).toLocaleString()}
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
