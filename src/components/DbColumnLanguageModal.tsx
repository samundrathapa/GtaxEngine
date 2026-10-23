import React, { useState, useEffect } from "react";
import {
  SupportedLang,
  getActiveDbColumnMapping,
  updateDbColumnMapping,
  resetDbColumnMappingToDefault,
  exportDbColumnMappingJson,
  subscribeToColumnMapping,
  tCol,
  DbColumnMappingDictionary
} from "../utils/i18n.ts";
import {
  Database,
  Languages,
  Code,
  Search,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  FileJson,
  Layers,
  Sparkles
} from "lucide-react";

interface DbColumnLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLang;
  onLanguageChange: (lang: SupportedLang) => void;
}

export const DbColumnLanguageModal: React.FC<DbColumnLanguageModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onLanguageChange
}) => {
  const [activeTab, setActiveTab] = useState<"table_view" | "json_editor">("table_view");
  const [mapping, setMapping] = useState<DbColumnMappingDictionary>(getActiveDbColumnMapping());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTableFilter, setSelectedTableFilter] = useState<string>("all");
  const [jsonText, setJsonText] = useState<string>("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Sync state with active column mapping
  useEffect(() => {
    const unsub = subscribeToColumnMapping((newMap) => {
      setMapping(newMap);
      setJsonText(exportDbColumnMappingJson());
    });
    setMapping(getActiveDbColumnMapping());
    setJsonText(exportDbColumnMappingJson());
    return unsub;
  }, [isOpen]);

  if (!isOpen) return null;

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const tableNames = Array.from(
    new Set(Object.values(mapping).map((v) => v.table || "common"))
  ).sort();

  const filteredColumns = Object.entries(mapping).filter(([colName, colData]) => {
    const matchesSearch =
      colName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (colData.eng || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (colData.nep || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (colData.ind || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTable =
      selectedTableFilter === "all" || (colData.table || "common") === selectedTableFilter;

    return matchesSearch && matchesTable;
  });

  const handleInlineChange = (colName: string, lang: SupportedLang, value: string) => {
    const updated = {
      ...mapping,
      [colName]: {
        ...mapping[colName],
        [lang]: value
      }
    };
    setMapping(updated);
  };

  const handleSaveInlineChanges = () => {
    updateDbColumnMapping(mapping);
    setJsonText(exportDbColumnMappingJson());
    showStatus("success", "DB Column language mapping saved! Changes auto-reflected across application.");
  };

  const handleApplyJsonEditor = () => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonText);
      let newColumns: DbColumnMappingDictionary = {};
      if (parsed.columns && typeof parsed.columns === "object") {
        newColumns = parsed.columns;
      } else if (typeof parsed === "object") {
        newColumns = parsed;
      }
      updateDbColumnMapping(newColumns);
      setMapping(newColumns);
      showStatus("success", "JSON mappings successfully parsed & applied live to application!");
    } catch (err: any) {
      setJsonError("Invalid JSON syntax: " + err.message);
      showStatus("error", "Failed to apply JSON. Please fix JSON syntax.");
    }
  };

  const handleResetToDefaults = () => {
    if (!confirm("Reset all column mappings back to the default json file? Custom changes will be cleared.")) return;
    resetDbColumnMappingToDefault();
    const def = getActiveDbColumnMapping();
    setMapping(def);
    setJsonText(exportDbColumnMappingJson());
    showStatus("success", "Mappings reset to default db_column_mapping.json successfully.");
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showStatus("success", "JSON copied to clipboard!");
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "db_column_mapping.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus("success", "db_column_mapping.json downloaded!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full h-[90vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Database Column Language Mapping (JSON)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                  Auto-Reflects Live
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Maps each <code className="font-mono text-indigo-600 dark:text-indigo-400">db_column_name</code> to localized text in English, Nepali, and Hindi. Any modification auto-reflects in the application.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Language Switcher + Tab Selector */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab("table_view")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "table_view"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Interactive Mapping Table ({Object.keys(mapping).length} Columns)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("json_editor");
                setJsonText(exportDbColumnMappingJson());
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "json_editor"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Raw JSON File Editor</span>
            </button>
          </div>

          {/* Active Application Language Switcher with Instant Preview */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              <Languages className="w-3.5 h-3.5 text-indigo-500" />
              <span>App Language:</span>
            </span>
            <div className="flex items-center gap-1">
              {(["eng", "nep", "ind"] as SupportedLang[]).map((langCode) => (
                <button
                  key={langCode}
                  type="button"
                  onClick={() => onLanguageChange(langCode)}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all uppercase ${
                    currentLang === langCode
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {langCode === "eng" ? "🇬🇧 English" : langCode === "nep" ? "🇳🇵 नेपाली" : "🇮🇳 हिन्दी"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all ${
              statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-b border-emerald-200"
                : "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-b border-rose-200"
            }`}
          >
            {statusMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* TAB 1: INTERACTIVE TABLE VIEW */}
        {activeTab === "table_view" && (
          <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 space-y-3">
            {/* Search and Table Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search column (e.g. kitta_number, area_sqfeet)..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={selectedTableFilter}
                  onChange={(e) => setSelectedTableFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="all">All Schema Tables ({tableNames.length})</option>
                  {tableNames.map((tbl) => (
                    <option key={tbl} value={tbl}>Table: {tbl}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveInlineChanges}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors text-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Auto-Reflect in App</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="p-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold"
                  title="Reset to default JSON"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Editable Columns Table */}
            <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px]">
                  <tr>
                    <th className="p-3 w-48">Database Column (db_column_name)</th>
                    <th className="p-3 w-32">Table Scope</th>
                    <th className="p-3">English Label (eng)</th>
                    <th className="p-3">Nepali Label (nep)</th>
                    <th className="p-3">Hindi Label (ind)</th>
                    <th className="p-3 w-28 text-center">Active Display ({currentLang.toUpperCase()})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredColumns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 font-sans">
                        No database columns matched "{searchTerm}".
                      </td>
                    </tr>
                  ) : (
                    filteredColumns.map(([colName, colData]) => {
                      const activeLabel = tCol(colName, currentLang);
                      return (
                        <tr key={colName} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                            <code>{colName}</code>
                          </td>
                          <td className="p-3 font-sans text-slate-500">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
                              {colData.table || "common"}
                            </span>
                          </td>
                          <td className="p-2.5 font-sans">
                            <input
                              type="text"
                              value={colData.eng || ""}
                              onChange={(e) => handleInlineChange(colName, "eng", e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="p-2.5 font-sans">
                            <input
                              type="text"
                              value={colData.nep || ""}
                              onChange={(e) => handleInlineChange(colName, "nep", e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="p-2.5 font-sans">
                            <input
                              type="text"
                              value={colData.ind || ""}
                              onChange={(e) => handleInlineChange(colName, "ind", e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="p-3 text-center font-sans">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-200 dark:border-emerald-800">
                              {activeLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Showing {filteredColumns.length} of {Object.keys(mapping).length} database columns mapped.</span>
              <span>Edits in this table save directly to the application state & localStorage.</span>
            </div>
          </div>
        )}

        {/* TAB 2: RAW JSON FILE EDITOR */}
        {activeTab === "json_editor" && (
          <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-indigo-600" />
                  <span>db_column_mapping.json Raw Code Editor</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Directly edit, copy, paste, or download the JSON mapping file. Clicking "Apply JSON Changes" auto-reflects the changes everywhere.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy JSON"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
                <button
                  type="button"
                  onClick={handleApplyJsonEditor}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors text-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apply JSON Changes</span>
                </button>
              </div>
            </div>

            {jsonError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{jsonError}</span>
              </div>
            )}

            <div className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950 p-3 shadow-inner">
              <textarea
                value={jsonText}
                onChange={(e) => {
                  setJsonText(e.target.value);
                  setJsonError(null);
                }}
                spellCheck={false}
                className="w-full h-full bg-transparent text-emerald-400 font-mono text-xs focus:outline-none resize-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs">
          <div className="text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Real-time Language & Database Column Synchronizer Active</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
