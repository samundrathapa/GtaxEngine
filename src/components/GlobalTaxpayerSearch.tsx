import React, { useState, useEffect, useRef } from "react";
import { Search, User, Shield, Phone, MapPin, X, ArrowRight, Plus, Sparkles, Building, Hash } from "lucide-react";
import { ApiController } from "../api/controller.ts";
import { SupportedLang, translations } from "../utils/i18n.ts";

interface GlobalTaxpayerSearchProps {
  currentLang: SupportedLang;
  onSelectTaxpayer: (taxpayerId: number) => void;
  onOpenNewTaxpayerModal: () => void;
}

export const GlobalTaxpayerSearch: React.FC<GlobalTaxpayerSearchProps> = ({
  currentLang,
  onSelectTaxpayer,
  onOpenNewTaxpayerModal
}) => {
  const t = translations[currentLang];
  const [searchTerm, setSearchTerm] = useState("");
  const [taxpayers, setTaxpayers] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch taxpayers list on mount and when dropdown opens
  const fetchTaxpayers = async () => {
    try {
      setLoading(true);
      const res = await ApiController.getTaxpayers();
      if (res.success && res.data) {
        setTaxpayers(res.data);
      }
    } catch (e) {
      console.warn("Global search taxpayer fetch error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxpayers();
  }, []);

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered taxpayers matching name, citizen id, code, pan, or mobile
  const query = searchTerm.trim().toLowerCase();
  const matchingTaxpayers = taxpayers.filter((tp) => {
    if (!query) return true;
    const nameMatch = tp.fullanme?.toLowerCase().includes(query);
    const codeMatch = tp.code?.toLowerCase().includes(query);
    const citizenMatch = tp.citizenship_no?.toLowerCase().includes(query);
    const panMatch = tp.pan_vat_no?.toLowerCase().includes(query);
    const mobileMatch = tp.mobile_no?.toLowerCase().includes(query);
    const wardMatch = String(tp.ward_no) === query;
    return nameMatch || codeMatch || citizenMatch || panMatch || mobileMatch || wardMatch;
  });

  const handleSelect = (tpId: number) => {
    onSelectTaxpayer(tpId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < matchingTaxpayers.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : matchingTaxpayers.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < matchingTaxpayers.length) {
        handleSelect(matchingTaxpayers[activeIndex].id);
      } else if (matchingTaxpayers.length > 0) {
        handleSelect(matchingTaxpayers[0].id);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md md:max-w-lg">
      <div className="relative flex items-center">
        <div className="absolute left-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
          <Search className="w-4 h-4 text-indigo-500" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
            fetchTaxpayers();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search Taxpayer by Name, Citizen ID, PAN (Ctrl+K)..."
          className="w-full pl-10 pr-20 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-xs"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm("")}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-200/60 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded shadow-xs">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden max-h-96 flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold uppercase tracking-wider">
              {matchingTaxpayers.length} Taxpayer{matchingTaxpayers.length === 1 ? "" : "s"} Found
            </span>
            <span className="text-[10px]">Use ↑↓ to navigate, Enter to select</span>
          </div>

          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {matchingTaxpayers.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  No taxpayer matched "{searchTerm}"
                </p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenNewTaxpayerModal();
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register as New Taxpayer</span>
                </button>
              </div>
            ) : (
              matchingTaxpayers.map((tp, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <button
                    key={tp.id}
                    onClick={() => handleSelect(tp.id)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full text-left p-3 flex items-start gap-3 transition-colors ${
                      isSelected
                        ? "bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-100"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 border border-indigo-200 dark:border-indigo-800">
                      {tp.fullanme?.charAt(0) || "T"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs md:text-sm text-slate-900 dark:text-white truncate">
                          {tp.fullanme}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold shrink-0">
                          {tp.code}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {tp.citizenship_no && (
                          <div className="flex items-center gap-1 font-mono text-[10px]">
                            <Shield className="w-3 h-3 text-emerald-500" />
                            <span>नागरिकता: {tp.citizenship_no}</span>
                          </div>
                        )}
                        {tp.pan_vat_no && (
                          <div className="flex items-center gap-1 font-mono text-[10px]">
                            <Hash className="w-3 h-3 text-amber-500" />
                            <span>PAN: {tp.pan_vat_no}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-indigo-400" />
                          <span>वडा नं. {tp.ward_no || 1}</span>
                        </div>
                        {tp.mobile_no && (
                          <div className="flex items-center gap-1 font-mono text-[10px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{tp.mobile_no}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-slate-400 dark:text-slate-500 shrink-0 self-center">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Register Footer */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              Can't find the citizen record?
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenNewTaxpayerModal();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Register New Taxpayer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
