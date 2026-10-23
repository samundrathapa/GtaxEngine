import React from "react";
import { X, Download, Copy, Check } from "lucide-react";

interface ArchWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchWindow: React.FC<ArchWindowProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const blueprint = `# gtax - Enterprise Architecture Specification
Frontend: Next.js / React Modular SPA (panel, controller, model, window)
Backend: FastAPI (BaseFrame, DbMigration, ApiServiceStruct, StartDomain)
Database: PostgreSQL with Mandatory Audit Columns (insert_by, insert_on, update_by, update_on, delete_by, deleted_on, is_active)
Cache: Redis with Dapper-style micro-ORM mapper
Reports: PDF, Excel XML, HTML, CSV
AI Agent: Multi-LLM (Gemini, OpenAI, Grok) with Voice Commands
Real-Time: Change-Data-Capture (CDC) Distributed Synchronization`;

    const blob = new Blob([blueprint], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "GTAX_ENTERPRISE_ARCHITECTURE.md";
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 shadow-2xl rounded-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-base font-semibold text-slate-900">
            Export Software Architecture Blueprint
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-600 leading-relaxed">
          <p>
            The <strong>gtax</strong> software architecture is fully realized across the filesystem:
          </p>
          <ul className="list-disc list-inside space-y-1 font-mono text-slate-700">
            <li>/backend/BaseFrame/ (controller, services, repo, cache, reports, response, helpers, auth, db)</li>
            <li>/backend/DbMigration/ (V001..V005 migrations enforcing mandatory 7 audit columns)</li>
            <li>/backend/ApiServiceStruct/ (inheriting CRUD property from BaseFrame)</li>
            <li>/backend/StartDomain/ (domain coordinators, AI agent with Gemini/OpenAI/Grok & voice)</li>
            <li>/src/modules/User/, TaxCalculation/, Jurisdiction/, AiAgent/, RealtimeSync/ (panel, controller, model, window pattern)</li>
          </ul>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Full Blueprint (.MD)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
