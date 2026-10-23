import React, { useState } from "react";
import { architectureFileTree, ArchFolderItem } from "./model.ts";
import { ArchWindow } from "./window.tsx";
import {
  Folder,
  FileCode,
  Layers,
  Database,
  Server,
  Share2,
  ChevronRight,
  Code2,
  Download,
  ShieldCheck,
  CheckCircle2,
  Cpu
} from "lucide-react";

export const ArchitectureExplorerPanel: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<ArchFolderItem>(
    architectureFileTree[0].children![0]
  );
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>gtax Core Architecture</span>
            <span aria-hidden="true">·</span>
            <span>Microservices System Design</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-700">Production Specification</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Enterprise Architecture & Microservices Blueprint
          </h2>
          <p className="text-sm text-slate-500">
            Interactive explorer for BaseFrame, DbMigration, ApiServiceStruct, and StartDomain.
          </p>
        </div>

        <button
          onClick={() => setIsExportOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Export Architecture Spec
        </button>
      </div>

      {/* Visual Microservices Architecture Map */}
      <div className="p-5 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Microservices Topology & Data-Flow Integration
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Real-Time CDC Mesh
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between text-indigo-400 font-bold">
              <span>Frontend Tier</span>
              <span className="text-[10px] font-mono bg-indigo-950 px-1.5 py-0.5 rounded text-indigo-300">Next.js / React</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Modular structure per domain: <code>User/</code>, <code>TaxCalculation/</code>, etc. with <code>panel</code>, <code>controller</code>, <code>model</code>, <code>window</code> files.
            </p>
          </div>

          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>FastAPI Backend</span>
              <span className="text-[10px] font-mono bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-300">BaseFrame</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Shared BaseFrame controllers, services, raw SQL repos, Redis cache, Dapper ORM, and RBAC Bearer token authorization.
            </p>
          </div>

          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between text-amber-400 font-bold">
              <span>PostgreSQL & Auditing</span>
              <span className="text-[10px] font-mono bg-amber-950 px-1.5 py-0.5 rounded text-amber-300">DbMigration</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Versioned migrations (V001..V005) with 7 mandatory audit columns on every table: <code>insert_by</code>, <code>insert_on</code>, <code>is_active</code>, etc.
            </p>
          </div>

          <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between text-cyan-400 font-bold">
              <span>AI & Voice Engine</span>
              <span className="text-[10px] font-mono bg-cyan-950 px-1.5 py-0.5 rounded text-cyan-300">StartDomain</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Multi-LLM orchestrator (Gemini, OpenAI, Grok) with live Web Speech microphone voice parser & text-to-speech feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Explorer Workspace: Left Folder Tree, Right Code Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Tree */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Folder className="w-4 h-4 text-indigo-600" />
              <span>Server-Side Architecture Structure</span>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-1">
            {["ALL", "BaseFrame", "DbMigration", "ApiServiceStruct", "StartDomain"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  activeCategory === cat
                    ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Hierarchy Navigator */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {architectureFileTree
              .filter((folder) => activeCategory === "ALL" || folder.category === activeCategory)
              .map((folder) => (
                <div key={folder.id} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-100 rounded-lg">
                    <Folder className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{folder.name}</span>
                  </div>

                  <div className="pl-3 space-y-1 border-l-2 border-slate-100 ml-2">
                    {folder.children?.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => setSelectedItem(child)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center justify-between group ${
                          selectedItem?.id === child.id
                            ? "bg-indigo-600 text-white shadow-xs font-semibold"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileCode className={`w-3.5 h-3.5 shrink-0 ${selectedItem?.id === child.id ? "text-white" : "text-slate-400 group-hover:text-indigo-600"}`} />
                          <span className="truncate">{child.name}</span>
                        </div>
                        <ChevronRight className={`w-3 h-3 shrink-0 ${selectedItem?.id === child.id ? "text-white" : "text-slate-300 opacity-0 group-hover:opacity-100"}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right Code & Architectural Detail Inspector */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col h-[600px]">
          {selectedItem ? (
            <div className="flex flex-col h-full space-y-3">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mb-1">
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">{selectedItem.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedItem.path}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedItem.name}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>BaseFrame Compliant</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                {selectedItem.description}
              </p>

              <div className="flex items-center justify-between text-xs font-bold text-slate-700 pt-1">
                <span className="flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-indigo-600" />
                  Source Code Implementation
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Python / FastAPI / TypeScript</span>
              </div>

              {/* Code Editor Preview */}
              <div className="flex-1 bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs overflow-auto border border-slate-800 leading-relaxed">
                <pre className="text-emerald-300 whitespace-pre-wrap">{selectedItem.contentSnippet}</pre>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              Select an architectural module on the left to inspect its implementation.
            </div>
          )}
        </div>
      </div>

      <ArchWindow isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
    </div>
  );
};
