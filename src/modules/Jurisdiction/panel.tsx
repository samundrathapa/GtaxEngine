import React, { useEffect, useState } from "react";
import { JurisdictionRecord } from "../../server/ApiServiceStruct/JurisdictionApiService.ts";
import { JurisdictionFormData } from "./model.ts";
import { JurisdictionController } from "./controller.ts";
import { JurisdictionWindow } from "./window.tsx";
import { Globe, Plus, RefreshCw, Search } from "lucide-react";

export const JurisdictionPanel: React.FC = () => {
  const [jurisdictions, setJurisdictions] = useState<JurisdictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await JurisdictionController.fetchJurisdictions();
    setJurisdictions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (form: JurisdictionFormData) => {
    const res = await JurisdictionController.createJurisdiction(form);
    setMsg(res.message);
    await loadData();
    setTimeout(() => setMsg(null), 4000);
  };

  const filtered = jurisdictions.filter((j) =>
    j.jurisdiction_name.toLowerCase().includes(search.toLowerCase()) ||
    j.jurisdiction_code.toLowerCase().includes(search.toLowerCase()) ||
    j.jurisdiction_level.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>BaseFrame</span>
            <span aria-hidden="true">·</span>
            <span>ApiServiceStruct</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-700">/api/v1/jurisdictions</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Multi-Jurisdictional Tax Authority Registry
          </h2>
          <p className="text-sm text-slate-500">
            Federal, State, Municipal, District, and Cross-Border VAT tax zones.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Reload from API"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsWindowOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Register Jurisdiction
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center justify-between animate-in fade-in">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-xs text-emerald-600 font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jurisdiction name or code..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filtered.length}</span> active tax zones
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Statutory Rate</th>
                <th className="py-3 px-4">Economic Nexus Threshold</th>
                <th className="py-3 px-4">Audit Tag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((j) => (
                <tr key={j.jurisdiction_id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{j.jurisdiction_name}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          {j.jurisdiction_code} ({j.country_iso})
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs uppercase font-medium text-slate-700 tracking-wide">
                      {j.jurisdiction_level}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {j.default_rate_pct}%
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                    {j.nexus_sales_threshold > 0 ? (
                      <span>${j.nexus_sales_threshold?.toLocaleString()} / {j.nexus_tx_threshold} tx</span>
                    ) : (
                      <span className="text-slate-400">N/A (Federal)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-[11px] font-mono text-slate-500">
                    {j.insert_by}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <JurisdictionWindow
        isOpen={isWindowOpen}
        onClose={() => setIsWindowOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};
