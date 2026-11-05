import React, { useState, useEffect } from "react";
import { ITaxpayerRecord } from "../../serverside/Taxpayer/TaxpayerModel.ts";
import { X, Save } from "lucide-react";

interface TaxpayerWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<ITaxpayerRecord>) => Promise<void>;
  editTaxpayer?: ITaxpayerRecord | null;
}

export const TaxpayerWindow: React.FC<TaxpayerWindowProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editTaxpayer
}) => {
  const [formData, setFormData] = useState<Partial<ITaxpayerRecord>>({
    fullname: "",
    ward_no: 1,
    pan_number: "",
    phone: "",
    citizenship_no: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editTaxpayer) {
      setFormData({
        id: editTaxpayer.id,
        taxpayer_id: editTaxpayer.taxpayer_id,
        fullname: editTaxpayer.fullname || editTaxpayer.full_name || "",
        ward_no: editTaxpayer.ward_no || 1,
        pan_number: editTaxpayer.pan_number || "",
        phone: editTaxpayer.phone || editTaxpayer.mobile || "",
        citizenship_no: editTaxpayer.citizenship_no || ""
      });
    } else {
      setFormData({
        fullname: "",
        ward_no: 1,
        pan_number: "",
        phone: "",
        citizenship_no: ""
      });
    }
  }, [editTaxpayer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error("[TaxpayerWindow] Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {editTaxpayer ? "Edit Taxpayer Record" : "Register New Taxpayer"}
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
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.fullname || ""}
              onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="e.g. Ram Bahadur Shrestha"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Ward Number *
              </label>
              <input
                type="number"
                min={1}
                max={32}
                required
                value={formData.ward_no || 1}
                onChange={(e) => setFormData({ ...formData, ward_no: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                value={formData.pan_number || ""}
                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="600123456"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Phone / Mobile
              </label>
              <input
                type="text"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="9851012345"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Citizenship No
              </label>
              <input
                type="text"
                value={formData.citizenship_no || ""}
                onChange={(e) => setFormData({ ...formData, citizenship_no: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="27-01-75-1234"
              />
            </div>
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
              {submitting ? "Saving..." : "Save Taxpayer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
