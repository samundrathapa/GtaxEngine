import React from "react";
import { X, FileText, CheckCircle2 } from "lucide-react";

interface PdfPreviewWindowProps {
  isOpen: boolean;
  onClose: () => void;
  spec: any;
}

export const PdfPreviewWindow: React.FC<PdfPreviewWindowProps> = ({ isOpen, onClose, spec }) => {
  if (!isOpen || !spec) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 shadow-2xl rounded-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-semibold text-slate-900">
              PDF Render Specification Preview
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>BaseFrame headless PDF print pipeline generated successfully.</span>
          </div>

          <div className="bg-slate-900 p-4 rounded-lg font-mono text-xs text-emerald-300 max-h-72 overflow-y-auto">
            <pre>{JSON.stringify(spec, null, 2)}</pre>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
