import React, { useState } from "react";
import { Database, CheckCircle2, AlertTriangle, RefreshCw, Server, Shield, HardDrive, Terminal, X } from "lucide-react";

export interface DbStatusData {
  connected: boolean;
  mode: string;
  host: string;
  port: number;
  database: string;
  user: string;
  ssl: boolean;
  serverVersion: string;
  activeDatabase: string;
  activeUser: string;
  activeHost: string;
  activePort: number;
  message: string;
  lastError: string | null;
  connectionStringMasked: string;
  setupHelp?: {
    sqlCreateScript?: string;
    schemaInitScript?: string;
    allInOneScript?: string;
    navicatScript?: string;
    migrationBatchScript?: string;
    migrationFolder?: string;
  };
}

interface DbStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DbStatusData | null;
  onRefresh: () => Promise<void>;
}

export const DbStatusModal: React.FC<DbStatusModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefresh
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; message: string; timestamp: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePing = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      const res = await fetch("/api/v1/db/ping", { method: "POST" });
      const data = await res.json();
      setPingResult({
        success: data?.data?.pingSuccess || data?.success || false,
        message: data?.message || (data?.data?.pingSuccess ? "Connected to PostgreSQL server" : "Connection failed"),
        timestamp: new Date().toLocaleTimeString()
      });
      await onRefresh();
    } catch (err: any) {
      setPingResult({
        success: false,
        message: err?.message || "Failed to contact database server endpoint",
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setIsPinging(false);
    }
  };

  const handleClearAndSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/v1/cache/clear-and-sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(data?.message || "Redis cache cleared and synced fresh from PostgreSQL database server");
      await onRefresh();
    } catch (err: any) {
      setSyncResult(`Re-sync error: ${err?.message || "Failed"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              status?.connected 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                PostgreSQL Server Connection Inspector
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  status?.connected
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status?.connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                  {status?.connected ? "LIVE CONNECTED" : "DISCONNECTED"}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exact connection parameters sourced directly from server environment variables (.env)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Active Config Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Host & Port */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                <Server className="w-4 h-4 text-indigo-500" />
                Database Host & Port
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                {status?.host || "127.0.0.1"}:{status?.port || 5432}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                From DB_HOST & DB_PORT
              </div>
            </div>

            {/* Database Name */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                <HardDrive className="w-4 h-4 text-indigo-500" />
                Active Database Name
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                {status?.database || "gtax_db"}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                From DB_NAME in .env
              </div>
            </div>

            {/* User Account */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                <Shield className="w-4 h-4 text-indigo-500" />
                Database User Account
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                {status?.user || "gtax_user"}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                From DB_USER in .env
              </div>
            </div>

            {/* Server Version & SSL */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                <Terminal className="w-4 h-4 text-indigo-500" />
                PostgreSQL Engine Version
              </div>
              <div className="font-mono text-xs font-semibold text-slate-900 dark:text-white truncate">
                {status?.serverVersion || "Connecting..."}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                SSL: {status?.ssl ? "Enabled" : "Disabled (Plain)"}
              </div>
            </div>
          </div>

          {/* Masked Connection URI */}
          <div className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-sans font-semibold">
              Active Connection URI (Password Masked)
            </div>
            <div className="text-emerald-400 break-all select-all">
              {status?.connectionStringMasked || `postgresql://${status?.user || "gtax_user"}:******@${status?.host || "127.0.0.1"}:${status?.port || 5432}/${status?.database || "gtax_db"}`}
            </div>
          </div>

          {/* Strict Remote Data Policy Notice */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
            <h4 className="font-semibold text-xs text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Strict Remote Server Data Policy Active
            </h4>
            <p className="text-xs text-blue-800 dark:text-blue-300/80 leading-relaxed">
              No local mock data is used. If the PostgreSQL database has 0 records, the application strictly displays 0 records. Taxpayers, land plots, houses, and rates are queried directly from the live database server specified above. Both the web client and mobile app read and write to this identical database server.
            </p>
          </div>

          {/* Error Banner if disconnected */}
          {!status?.connected && status?.lastError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 dark:text-rose-300 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                Connection Message:
              </div>
              <div className="font-mono text-xs text-rose-700 dark:text-rose-300/90 break-all">
                {status.lastError}
              </div>
              <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-1">
                Tip: Run <code className="bg-rose-100 dark:bg-rose-900 px-1 py-0.5 rounded">run_migrations.bat</code> to set up the database and schema in <code className="bg-rose-100 dark:bg-rose-900 px-1 py-0.5 rounded">backend/DbMigration</code>.
              </div>
            </div>
          )}

          {/* Migration Folder Location */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Database Migration Directory: </span>
            <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono">
              backend/DbMigration/
            </code>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Scripts: 01_create_database_and_user.sql, 02_init_gtax_schema.sql, setup_gtax_db.sql, navicat_setup_gtax_db.sql
            </div>
          </div>

          {/* Ping / Sync Result Alert */}
          {pingResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              pingResult.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}>
              <div className="flex items-center gap-2">
                {pingResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                <span>{pingResult.message}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-500 shrink-0">{pingResult.timestamp}</span>
            </div>
          )}

          {syncResult && (
            <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 text-xs">
              {syncResult}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePing}
              disabled={isPinging}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? "animate-spin" : ""}`} />
              {isPinging ? "Pinging DB..." : "Test Connection (Ping)"}
            </button>

            <button
              onClick={handleClearAndSync}
              disabled={isSyncing}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 font-medium text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Re-sync from Database"}
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
