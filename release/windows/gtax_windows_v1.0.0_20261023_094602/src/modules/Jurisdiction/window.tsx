import React, { useState } from "react";
import { JurisdictionFormData, initialJurisdictionForm, JurisdictionLevel } from "./model.ts";
import { X, Check, Globe } from "lucide-react";

interface JurisdictionWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JurisdictionFormData) => Promise<void>;
}

export const JurisdictionWindow: React.FC<JurisdictionWindowProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [form, setForm] = useState<JurisdictionFormData>(initialJurisdictionForm);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jurisdiction_code || !form.jurisdiction_name) {
      setErrorMsg("Please provide both a code and jurisdiction authority name.");
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      await onSubmit(form);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 shadow-2xl rounded-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Register Tax Jurisdiction Authority
              </h3>
              <p className="text-xs text-slate-500">
                Creates statutory nexus boundaries with BaseFrame audit fields
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Jurisdiction Code
              </label>
              <input
                type="text"
                value={form.jurisdiction_code}
                onChange={(e) => setForm({ ...form, jurisdiction_code: e.target.value.toUpperCase() })}
                placeholder="US-WA"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Country ISO (3-Letter)
              </label>
              <input
                type="text"
                value={form.country_iso}
                onChange={(e) => setForm({ ...form, country_iso: e.target.value.toUpperCase() })}
                placeholder="USA"
                maxLength={3}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono uppercase"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Statutory Authority Official Name
            </label>
            <input
              type="text"
              value={form.jurisdiction_name}
              onChange={(e) => setForm({ ...form, jurisdiction_name: e.target.value })}
              placeholder="e.g. Washington State Department of Revenue"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Hierarchy Level
              </label>
              <select
                value={form.jurisdiction_level}
                onChange={(e) => setForm({ ...form, jurisdiction_level: e.target.value as JurisdictionLevel })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="federal">Federal / Central</option>
                <option value="state">State / Provincial</option>
                <option value="county">County / District</option>
                <option value="city">City / Municipal</option>
                <option value="vat_zone">VAT / Cross-Border Zone</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Statutory Base Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.default_rate_pct}
                onChange={(e) => setForm({ ...form, default_rate_pct: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Nexus Sales Threshold ($)
              </label>
              <input
                type="number"
                step="1000"
                value={form.nexus_sales_threshold}
                onChange={(e) => setForm({ ...form, nexus_sales_threshold: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Nexus Transaction Threshold
              </label>
              <input
                type="number"
                value={form.nexus_tx_threshold}
                onChange={(e) => setForm({ ...form, nexus_tx_threshold: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {submitting ? "Persisting..." : "Register Jurisdiction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
