import React, { useState, useEffect, useMemo } from "react";
import {
  SupportedLang,
  MappingCategory,
  getActiveDbColumnMapping,
  getActiveGeneralMapping,
  updateLanguageMappings,
  resetDbColumnMappingToDefault,
  exportDbColumnMappingJson,
  subscribeToColumnMapping,
  subscribeToTranslations,
  getTranslationSource,
  translateTextNow,
  tCol,
  DbColumnMappingDictionary,
  GeneralMappingDictionary
} from "../utils/i18n.ts";
import { useMessageBox } from "./MessageBox.tsx";
import {
  Database,
  Languages,
  Search,
  Save,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  FileJson,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Tag
} from "lucide-react";

interface DbColumnLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLang;
  onLanguageChange: (lang: SupportedLang) => void;
}

const GENERAL_SCOPE_PRESETS = [
  "sidebar_menu",
  "dashboard",
  "taxpayer",
  "calculation",
  "rates_master",
  "user_management",
  "window_modal",
  "audit_logs",
  "reports",
  "common"
];

function slugifyKey(text: string, prefix: string): string {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!slug) return "";
  return slug.startsWith(prefix) ? slug : `${prefix}${slug}`;
}

export const DbColumnLanguageModal: React.FC<DbColumnLanguageModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onLanguageChange
}) => {
  const { showConfirm, showSuccess, showError, MessageBoxModal } = useMessageBox();
  const [activeTab, setActiveTab] = useState<"table_view" | "json_editor">("table_view");
  const [categoryFilter, setCategoryFilter] = useState<"all" | MappingCategory>("all");
  const [colMapping, setColMapping] = useState<DbColumnMappingDictionary>(getActiveDbColumnMapping());
  const [genMapping, setGenMapping] = useState<GeneralMappingDictionary>(getActiveGeneralMapping());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedScopeFilter, setSelectedScopeFilter] = useState<string>("all");
  const [jsonText, setJsonText] = useState<string>("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoTranslating, setAutoTranslating] = useState(false);
  const [autoFillingNew, setAutoFillingNew] = useState(false);
  const [showAddForm, setShowAddForm] = useState(true);

  // Add new mapping entry state
  const [newCategory, setNewCategory] = useState<MappingCategory>("general");
  const [newScope, setNewScope] = useState<string>("sidebar_menu");
  const [newKey, setNewKey] = useState<string>("");
  const [newEng, setNewEng] = useState<string>("");
  const [newNep, setNewNep] = useState<string>("");
  const [newInd, setNewInd] = useState<string>("");

  const [, setLangVersion] = useState(0);

  // Sync state with active column + general mappings and Google Translate cache updates
  useEffect(() => {
    const unsubMap = subscribeToColumnMapping((newCols, newGen) => {
      setColMapping(newCols);
      setGenMapping(newGen);
      setJsonText(exportDbColumnMappingJson());
    });
    const unsubTrans = subscribeToTranslations(() => setLangVersion((v) => v + 1));
    setColMapping(getActiveDbColumnMapping());
    setGenMapping(getActiveGeneralMapping());
    setJsonText(exportDbColumnMappingJson());
    return () => {
      unsubMap();
      unsubTrans();
    };
  }, [isOpen]);

  type CombinedRow = {
    category: MappingCategory;
    key: string;
    scopeOrTable: string;
    eng: string;
    nep: string;
    ind: string;
  };

  const combinedRows: CombinedRow[] = useMemo(() => {
    const rows: CombinedRow[] = [];
    if (categoryFilter === "all" || categoryFilter === "general") {
      for (const [key, entry] of Object.entries(genMapping)) {
        rows.push({
          category: "general",
          key,
          scopeOrTable: entry.scope || "common",
          eng: entry.eng || "",
          nep: entry.nep || "",
          ind: entry.ind || ""
        });
      }
    }
    if (categoryFilter === "all" || categoryFilter === "columns") {
      for (const [key, entry] of Object.entries(colMapping)) {
        rows.push({
          category: "columns",
          key,
          scopeOrTable: entry.table || "common",
          eng: entry.eng || "",
          nep: entry.nep || "",
          ind: entry.ind || ""
        });
      }
    }
    return rows;
  }, [categoryFilter, genMapping, colMapping]);

  const scopeNames = useMemo(() => {
    return Array.from(new Set(combinedRows.map((r) => r.scopeOrTable || "common"))).sort();
  }, [combinedRows]);

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return combinedRows.filter((row) => {
      const matchesSearch =
        !q ||
        row.key.toLowerCase().includes(q) ||
        row.eng.toLowerCase().includes(q) ||
        row.nep.toLowerCase().includes(q) ||
        row.ind.toLowerCase().includes(q) ||
        row.scopeOrTable.toLowerCase().includes(q);
      const matchesScope = selectedScopeFilter === "all" || row.scopeOrTable === selectedScopeFilter;
      return matchesSearch && matchesScope;
    });
  }, [combinedRows, searchTerm, selectedScopeFilter]);

  if (!isOpen) return null;

  const showStatus = (type: "success" | "error", text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleInlineChange = (
    category: MappingCategory,
    key: string,
    lang: SupportedLang,
    value: string
  ) => {
    if (category === "general") {
      setGenMapping((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [lang]: value
        }
      }));
    } else {
      setColMapping((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          [lang]: value
        }
      }));
    }
  };

  const handleDeleteRow = (category: MappingCategory, key: string) => {
    if (category === "general") {
      setGenMapping((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setColMapping((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    showStatus("success", `Removed '${key}' from draft list. Click "Save & Auto-Reflect" to apply.`);
  };

  const handleAutoFillNewEntry = async () => {
    const sourceEng = newEng.trim();
    if (!sourceEng) {
      showStatus("error", "Enter the English name/label first before auto-translating.");
      return;
    }
    setAutoFillingNew(true);
    try {
      const [resNep, resInd] = await Promise.all([
        translateTextNow(sourceEng, "nep"),
        translateTextNow(sourceEng, "ind")
      ]);
      if (resNep.translatedText) setNewNep(resNep.translatedText);
      if (resInd.translatedText) setNewInd(resInd.translatedText);
      if (!newKey.trim()) {
        setNewKey(slugifyKey(sourceEng, newCategory === "general" ? "gen_" : ""));
      }
      showStatus("success", "Populated Nepali & Hindi labels using JSON / Google Translate.");
    } catch {
      showStatus("error", "Failed to auto-translate new entry.");
    } finally {
      setAutoFillingNew(false);
    }
  };

  const handleAddNewEntry = () => {
    const engTrimmed = newEng.trim();
    if (!engTrimmed) {
      showStatus("error", "English Name / Label is required.");
      return;
    }
    const resolvedKey =
      newKey.trim() || slugifyKey(engTrimmed, newCategory === "general" ? "gen_" : "");
    if (!resolvedKey) {
      showStatus("error", "Please enter a valid Key name.");
      return;
    }

    if (newCategory === "general") {
      const nextGen: GeneralMappingDictionary = {
        [resolvedKey]: {
          scope: newScope.trim() || "common",
          eng: engTrimmed,
          nep: newNep.trim(),
          ind: newInd.trim()
        },
        ...genMapping
      };
      setGenMapping(nextGen);
      updateLanguageMappings(colMapping, nextGen);
    } else {
      const nextCols: DbColumnMappingDictionary = {
        [resolvedKey]: {
          table: newScope.trim() || "common",
          eng: engTrimmed,
          nep: newNep.trim(),
          ind: newInd.trim()
        },
        ...colMapping
      };
      setColMapping(nextCols);
      updateLanguageMappings(nextCols, genMapping);
    }

    setJsonText(exportDbColumnMappingJson());
    setNewKey("");
    setNewEng("");
    setNewNep("");
    setNewInd("");
    showStatus(
      "success",
      `Added ${newCategory === "general" ? "General Name" : "DB Column"} '${resolvedKey}' & reflected across app!`
    );
  };

  const handleSaveInlineChanges = () => {
    showConfirm("Do you want to save language mapping changes?", () => {
      updateLanguageMappings(colMapping, genMapping);
      setJsonText(exportDbColumnMappingJson());
      showSuccess("Record saved successfully!");
      showStatus("success", "Language mappings (General Names + DB Columns) saved & auto-reflected across app!");
    }, "Do you want to save?");
  };

  const handleApplyJsonEditor = () => {
    setJsonError(null);
    showConfirm("Do you want to save and apply JSON language mappings?", () => {
      try {
        const parsed = JSON.parse(jsonText);
        let nextCols: DbColumnMappingDictionary = colMapping;
        let nextGen: GeneralMappingDictionary = genMapping;

        if (parsed.columns && typeof parsed.columns === "object") {
          nextCols = parsed.columns;
        } else if (!parsed.general && typeof parsed === "object") {
          nextCols = parsed;
        }
        if (parsed.general && typeof parsed.general === "object") {
          nextGen = parsed.general;
        }

        updateLanguageMappings(nextCols, nextGen);
        setColMapping(nextCols);
        setGenMapping(nextGen);
        showSuccess("Record saved successfully!");
        showStatus("success", "JSON mappings (General Names + DB Columns) parsed & applied live!");
      } catch (err: any) {
        setJsonError("Invalid JSON syntax: " + err.message);
        showError("Failed to apply JSON: " + err.message);
        showStatus("error", "Failed to apply JSON. Please fix JSON syntax.");
      }
    }, "Do you want to save?");
  };

  const handleResetToDefaults = () => {
    showConfirm("Reset all General & DB Column mappings back to the default JSON file? Custom edits will be cleared.", () => {
      resetDbColumnMappingToDefault();
      const defCols = getActiveDbColumnMapping();
      const defGen = getActiveGeneralMapping();
      setColMapping(defCols);
      setGenMapping(defGen);
      setJsonText(exportDbColumnMappingJson());
      showSuccess("Mappings reset to default.");
      showStatus("success", "All mappings reset to default db_column_mapping.json.");
    }, "Reset Mappings?");
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

  const handleAutoTranslateMissing = async () => {
    setAutoTranslating(true);
    try {
      const updatedCols = { ...colMapping };
      const updatedGen = { ...genMapping };
      let translatedCount = 0;

      for (const [key, entry] of Object.entries(updatedGen)) {
        const engSource = entry.eng || key.replace(/_/g, " ");
        let changed = false;
        const copy = { ...entry };
        if (!copy.nep || !copy.nep.trim()) {
          const resNep = await translateTextNow(engSource, "nep", key);
          if (resNep.translatedText) {
            copy.nep = resNep.translatedText;
            changed = true;
            translatedCount++;
          }
        }
        if (!copy.ind || !copy.ind.trim()) {
          const resInd = await translateTextNow(engSource, "ind", key);
          if (resInd.translatedText) {
            copy.ind = resInd.translatedText;
            changed = true;
            translatedCount++;
          }
        }
        if (changed) updatedGen[key] = copy;
      }

      for (const [colName, colData] of Object.entries(updatedCols)) {
        const engSource = colData.eng || colName.replace(/_/g, " ");
        let changed = false;
        const copy = { ...colData };
        if (!copy.nep || !copy.nep.trim()) {
          const resNep = await translateTextNow(engSource, "nep", colName);
          if (resNep.translatedText) {
            copy.nep = resNep.translatedText;
            changed = true;
            translatedCount++;
          }
        }
        if (!copy.ind || !copy.ind.trim()) {
          const resInd = await translateTextNow(engSource, "ind", colName);
          if (resInd.translatedText) {
            copy.ind = resInd.translatedText;
            changed = true;
            translatedCount++;
          }
        }
        if (changed) updatedCols[colName] = copy;
      }

      if (translatedCount > 0) {
        setColMapping(updatedCols);
        setGenMapping(updatedGen);
        updateLanguageMappings(updatedCols, updatedGen);
        setJsonText(exportDbColumnMappingJson());
        showStatus("success", `Google Translate filled ${translatedCount} missing label(s) and saved to active JSON!`);
      } else {
        showStatus("success", "All General & DB Column labels are populated in JSON.");
      }
    } catch (err: any) {
      showStatus("error", err?.message || "Auto-translation encountered an issue.");
    } finally {
      setAutoTranslating(false);
    }
  };

  const totalGenCount = Object.keys(genMapping).length;
  const totalColCount = Object.keys(colMapping).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-6xl w-full h-[92vh] max-h-[880px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Language Mapping Manager (General Names &amp; DB Columns)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                  Auto-Reflects Live
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Maps both General Menu / Window / Button names and <code className="font-mono text-indigo-600 dark:text-indigo-400">db_column_name</code> entries to English, Nepali, and Hindi (with Google Translate fallback).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab("table_view")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "table_view"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Interactive Mappings ({totalGenCount + totalColCount})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("json_editor");
                setJsonText(exportDbColumnMappingJson());
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "json_editor"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>Raw JSON File Editor</span>
            </button>
          </div>

          {/* Language Switcher */}
          <div
            data-no-translate="true"
            className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
          >
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
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] transition-all uppercase cursor-pointer ${
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

        {/* Status Banner */}
        {statusMsg && (
          <div
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all ${
              statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-b border-emerald-200"
                : "bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-b border-rose-200"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* TAB 1: INTERACTIVE MAPPING TABLE */}
        {activeTab === "table_view" && (
          <div
            data-no-translate="true"
            className="flex-1 flex flex-col min-h-0 p-4 sm:p-5 space-y-3"
          >
            {/* Category Filter & Actions Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* General vs DB Columns switcher */}
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter("all");
                      setSelectedScopeFilter("all");
                    }}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                      categoryFilter === "all"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-300 shadow-2xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    All ({totalGenCount + totalColCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter("general");
                      setSelectedScopeFilter("all");
                    }}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all flex items-center gap-1 ${
                      categoryFilter === "general"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    <span>General / Menu Names ({totalGenCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryFilter("columns");
                      setSelectedScopeFilter("all");
                    }}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all flex items-center gap-1 ${
                      categoryFilter === "columns"
                        ? "bg-indigo-600 text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <Database className="w-3 h-3" />
                    <span>DB Columns ({totalColCount})</span>
                  </button>
                </div>

                {/* Search */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search key or English/Nepali/Hindi..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Scope Filter */}
                <select
                  value={selectedScopeFilter}
                  onChange={(e) => setSelectedScopeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="all">All Scopes ({scopeNames.length})</option>
                  {scopeNames.map((scp) => (
                    <option key={scp} value={scp}>
                      {scp.replace(/^tbl_/, "").replace(/_/g, " ").toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowAddForm((prev) => !prev)}
                  className="px-3 py-2 border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddForm ? "Hide Add Form" : "Add General / Column Name"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleAutoTranslateMissing}
                  disabled={autoTranslating}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors text-xs flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                  title="Use Google Translate to populate any blank Nepali or Hindi fields"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${autoTranslating ? "animate-spin" : ""}`} />
                  <span>{autoTranslating ? "Translating..." : "Auto-Translate Missing"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveInlineChanges}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save &amp; Auto-Reflect</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="p-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
                  title="Reset to default JSON"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Add General Name / DB Column Panel */}
            {showAddForm && (
              <div className="p-3 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-indigo-800 dark:text-indigo-300">
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    Add New General Name (Menu / Panel / Window / Button) or DB Column Mapping
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setNewCategory("general");
                        setNewScope("sidebar_menu");
                      }}
                      className={`px-2 py-0.5 rounded-lg border cursor-pointer ${
                        newCategory === "general"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      General Name / Menu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCategory("columns");
                        setNewScope("tbl_taxpayer");
                      }}
                      className={`px-2 py-0.5 rounded-lg border cursor-pointer ${
                        newCategory === "columns"
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      DB Column Name
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 items-center text-xs">
                  <input
                    type="text"
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value)}
                    list="gtax-scope-presets"
                    placeholder={newCategory === "general" ? "Scope (e.g. sidebar_menu)" : "Table (e.g. tbl_taxpayer)"}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                  <datalist id="gtax-scope-presets">
                    {GENERAL_SCOPE_PRESETS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>

                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Key (auto if blank)"
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  />

                  <input
                    type="text"
                    value={newEng}
                    onChange={(e) => setNewEng(e.target.value)}
                    placeholder="English Name *"
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />

                  <input
                    type="text"
                    value={newNep}
                    onChange={(e) => setNewNep(e.target.value)}
                    placeholder="Nepali Label (nep)"
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />

                  <input
                    type="text"
                    value={newInd}
                    onChange={(e) => setNewInd(e.target.value)}
                    placeholder="Hindi Label (ind)"
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAutoFillNewEntry}
                      disabled={autoFillingNew}
                      title="Auto-fill Nepali & Hindi via Google Translate"
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 disabled:opacity-60 cursor-pointer shrink-0"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${autoFillingNew ? "animate-spin" : ""}`} />
                      <span>Translate</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewEntry}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Editable Mapping Table */}
            <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-200 sticky top-0 z-10 border-b border-slate-300 text-slate-900 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="p-2.5 w-24">Type</th>
                    <th className="p-2.5 w-44">Key / Column</th>
                    <th className="p-2.5 w-28">Scope / Table</th>
                    <th className="p-2.5">English Label (eng)</th>
                    <th className="p-2.5">Nepali Label (nep)</th>
                    <th className="p-2.5">Hindi Label (ind)</th>
                    <th className="p-2.5 w-32 text-center">Active ({currentLang.toUpperCase()})</th>
                    <th className="p-2.5 w-12 text-center">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                        No language mappings matched "{searchTerm}".
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {
                      const activeLabel = tCol(row.key, currentLang);
                      const source = getTranslationSource(row.key, currentLang);
                      return (
                        <tr
                          key={`${row.category}:${row.key}`}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                        >
                          <td className="p-2.5 font-sans">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                row.category === "general"
                                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                  : "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                              }`}
                            >
                              {row.category === "general" ? "General" : "DB Col"}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-indigo-600 dark:text-indigo-400 truncate max-w-[180px]" title={row.key}>
                            <code>{row.key}</code>
                          </td>
                          <td className="p-2.5 font-sans text-slate-500">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono">
                              {row.scopeOrTable.replace(/^tbl_/, "").replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="p-2 font-sans">
                            <input
                              type="text"
                              value={row.eng}
                              onChange={(e) => handleInlineChange(row.category, row.key, "eng", e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="p-2 font-sans">
                            <input
                              type="text"
                              value={row.nep}
                              onChange={(e) => handleInlineChange(row.category, row.key, "nep", e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="p-2 font-sans">
                            <input
                              type="text"
                              value={row.ind}
                              onChange={(e) => handleInlineChange(row.category, row.key, "ind", e.target.value)}
                              className="w-full px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="p-2 text-center font-sans">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-200 dark:border-emerald-800 max-w-[130px] truncate" title={activeLabel}>
                                {activeLabel}
                              </span>
                              <span className="text-[9px] font-mono uppercase text-slate-400">
                                {source === "google_translate" ? "Google Translate" : source === "json" ? "JSON" : "Fallback"}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 text-center font-sans">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.category, row.key)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title={`Remove '${row.key}'`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>
                Showing {filteredRows.length} of {totalGenCount + totalColCount} entries ({totalGenCount} General Names, {totalColCount} DB Columns).
              </span>
              <span>Unmapped UI strings across menus, panels &amp; windows auto-translate via Google Translate.</span>
            </div>
          </div>
        )}

        {/* TAB 2: RAW JSON FILE EDITOR */}
        {activeTab === "json_editor" && (
          <div
            data-no-translate="true"
            className="flex-1 flex flex-col min-h-0 p-4 sm:p-6 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-indigo-600" />
                  <span>db_column_mapping.json Raw Code Editor (columns + general)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Edit both &quot;columns&quot; (DB columns) and &quot;general&quot; (menus, panels, windows, buttons) directly in JSON.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy JSON"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
                <button
                  type="button"
                  onClick={handleApplyJsonEditor}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
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
            <span>Real-time General Name &amp; Database Column Synchronizer Active</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
      <MessageBoxModal />
    </div>
  );
};
