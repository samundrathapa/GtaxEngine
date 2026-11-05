import React, { useState, useEffect } from "react";
import { ICalculationRecord } from "../../serverside/Calculation/CalculationModel.ts";
import { X, Save } from "lucide-react";

interface CalculationWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<ICalculationRecord>) => Promise<void>;
  editCalculation?: ICalculationRecord | null;
}

export const CalculationWindow: React.FC<CalculationWindowProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editCalculation
}) => {
  const [formData, setFormData] = useState<Partial<ICalculationRecord>>({
    taxpayer_id: 1,
    fiscal_year_id: 1,
    total_land_valuation: 0,
    total_house_valuation: 0,
    net_payable_tax: 0
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editCalculation) {
      setFormData({
        id: editCalculation.id,
        taxpayer_id: editCalculation.taxpayer_id || 1,
        fiscal_year_id: editCalculation.fiscal_year_id || 1,
        total_land_valuation: editCalculation.total_land_valuation || 0,
        total_house_valuation: editCalculation.total_house_valuation || 0,
        net_payable_tax: editCalculation.net_payable_tax || 0
      });
    } else {
      setFormData({
        taxpayer_id: 1,
        fiscal_year_id: 1,
        total_land_valuation: 0,
        total_house_valuation: 0,
        net_payable_tax: 0
      });
    }
  }, [editCalculation, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error("[CalculationWindow] Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {editCalculation ? "Edit Assessment Record" : "New Property Assessment Record"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Taxpayer ID *
              </label>
              <input
                type="number"
                required
                value={formData.taxpayer_id || 1}
                onChange={(e) => setFormData({ ...formData, taxpayer_id: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Fiscal Year ID *
              </label>
              <input
                type="number"
                required
                value={formData.fiscal_year_id || 1}
                onChange={(e) => setFormData({ ...formData, fiscal_year_id: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Land Valuation (NPR)
              </label>
              <input
                type="number"
                value={formData.total_land_valuation || 0}
                onChange={(e) => setFormData({ ...formData, total_land_valuation: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                House Valuation (NPR)
              </label>
              <input
                type="number"
                value={formData.total_house_valuation || 0}
                onChange={(e) => setFormData({ ...formData, total_house_valuation: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Net Payable Tax (NPR) *
            </label>
            <input
              type="number"
              required
              value={formData.net_payable_tax || 0}
              onChange={(e) => setFormData({ ...formData, net_payable_tax: Number(e.target.value) })}
              className="w-full px-3 py-2 text-sm font-bold border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
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
              {submitting ? "Saving..." : "Save Assessment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
