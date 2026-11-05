import React, { useState, useEffect } from "react";
import { IConstructionTypeRecord } from "../../serverside/ConstructionTypes/ConstructionTypesModel.ts";
import { X, Save } from "lucide-react";

interface ConstructionTypesWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<IConstructionTypeRecord>) => Promise<void>;
  editType?: IConstructionTypeRecord | null;
}

export const ConstructionTypesWindow: React.FC<ConstructionTypesWindowProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editType
}) => {
  const [formData, setFormData] = useState<Partial<IConstructionTypeRecord>>({
    code: "",
    name: "",
    depreciation_rate: 0
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editType) {
      setFormData({
        id: editType.id,
        code: editType.code || "",
        name: editType.name || "",
        depreciation_rate: editType.depreciation_rate || 0
      });
    } else {
      setFormData({
        code: "",
        name: "",
        depreciation_rate: 0
      });
    }
  }, [editType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error("[ConstructionTypesWindow] Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {editType ? "Edit Construction Type" : "Add Construction Type"}
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
              Construction Type Name *
            </label>
            <input
              type="text"
              required
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="e.g. RCC Frame Structure (पक्की)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Type Code *
              </label>
              <input
                type="text"
                required
                value={formData.code || ""}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="CONST-RCC"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Depreciation Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.depreciation_rate || 0}
                onChange={(e) => setFormData({ ...formData, depreciation_rate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
              {submitting ? "Saving..." : "Save Type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
