import React, { useState, useEffect } from "react";
import { IFiscalYearRecord } from "../../serverside/FiscalYear/FiscalYearModel.ts";
import { X, Save } from "lucide-react";

interface FiscalYearWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<IFiscalYearRecord>) => Promise<void>;
  editFiscalYear?: IFiscalYearRecord | null;
}

export const FiscalYearWindow: React.FC<FiscalYearWindowProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editFiscalYear
}) => {
  const [formData, setFormData] = useState<Partial<IFiscalYearRecord>>({
    code: "",
    name: "",
    is_active: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editFiscalYear) {
      setFormData({
        id: editFiscalYear.id,
        code: editFiscalYear.code || "",
        name: editFiscalYear.name || "",
        is_active: editFiscalYear.is_active || false
      });
    } else {
      setFormData({
        code: "",
        name: "",
        is_active: false
      });
    }
  }, [editFiscalYear, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error("[FiscalYearWindow] Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {editFiscalYear ? "Edit Fiscal Year Record" : "Add New Fiscal Year"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Fiscal Year Code * (B.S.)
            </label>
            <input
              type="text"
              required
              value={formData.code || ""}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="e.g. 2081/82"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Fiscal Year Description / Name
            </label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="Fiscal Year 2081-2082 B.S."
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="fy_is_active"
              checked={formData.is_active || false}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
            />
            <label htmlFor="fy_is_active" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Set as Active Fiscal Year globally
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {submitting ? "Saving..." : "Save Fiscal Year"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
