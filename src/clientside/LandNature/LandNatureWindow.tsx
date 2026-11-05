import React, { useState, useEffect } from "react";
import { ILandNatureRecord } from "../../serverside/LandNature/LandNatureModel.ts";
import { X, Save } from "lucide-react";

interface LandNatureWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<ILandNatureRecord>) => Promise<void>;
  editNature?: ILandNatureRecord | null;
}

export const LandNatureWindow: React.FC<LandNatureWindowProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editNature
}) => {
  const [formData, setFormData] = useState<Partial<ILandNatureRecord>>({
    code: "",
    name: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editNature) {
      setFormData({
        id: editNature.id,
        code: editNature.code || "",
        name: editNature.name || ""
      });
    } else {
      setFormData({
        code: "",
        name: ""
      });
    }
  }, [editNature, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      console.error("[LandNatureWindow] Submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {editNature ? "Edit Land Nature Type" : "Add Land Nature Type"}
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
              Land Nature Name *
            </label>
            <input
              type="text"
              required
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="e.g. Commercial / Residential / Agricultural"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
              Nature Code *
            </label>
            <input
              type="text"
              required
              value={formData.code || ""}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="NAT-COMM"
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
              {submitting ? "Saving..." : "Save Land Nature"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
