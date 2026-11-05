import React, { useEffect, useState } from "react";
import { taxpayerStoreInstance } from "./TaxpayerStore.ts";
import { TaxpayerController } from "./TaxpayerController.ts";
import { TaxpayerWindow } from "./TaxpayerWindow.tsx";
import { ITaxpayerRecord } from "../../serverside/Taxpayer/TaxpayerModel.ts";
import { Plus, Search, Trash2, Edit2, Users, RefreshCw, CheckCircle2, Phone, Hash } from "lucide-react";

export const TaxpayerPanel: React.FC = () => {
  const [storeState, setStoreState] = useState(taxpayerStoreInstance.getState());
  const [searchQuery, setSearchQuery] = useState("");
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [selectedTaxpayer, setSelectedTaxpayer] = useState<ITaxpayerRecord | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = taxpayerStoreInstance.subscribe(() => {
      setStoreState(taxpayerStoreInstance.getState());
    });
    return unsubscribe;
  }, []);

  const loadData = async (query: string = "") => {
    await TaxpayerController.GetSearchTemplate(query);
  };

  useEffect(() => {
    loadData(searchQuery);
  }, [searchQuery]);

  const handleCreateOrUpdate = async (formData: Partial<ITaxpayerRecord>) => {
    let res;
    if (selectedTaxpayer) {
      const targetId = selectedTaxpayer.taxpayer_id || selectedTaxpayer.id;
      res = await TaxpayerController.updateTaxpayer(targetId, formData);
    } else {
      res = await TaxpayerController.createTaxpayer(formData);
    }
    setActionMessage(res.message);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleDelete = async (taxpayer: ITaxpayerRecord) => {
    const targetId = taxpayer.taxpayer_id || taxpayer.id;
    if (confirm(`Are you sure you want to delete taxpayer ${taxpayer.fullname || targetId}?`)) {
      const res = await TaxpayerController.deleteTaxpayer(targetId);
      setActionMessage(res.message);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const { taxpayers, loading } = storeState;

  return (
    <div className="space-y-6">
      {/* Header & Sub-toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Taxpayer Directory</span>
            <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full font-mono">
              clientside/Taxpayer & serverside/Taxpayer
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Powered by TaxpayerController, TaxpayerService, TaxpayerModel & TaxpayerRepo with GetSearchTemplate & GetComboTemplate
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(searchQuery)}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Reload via GetSearchTemplate API"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              setSelectedTaxpayer(null);
              setIsWindowOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Taxpayer
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 text-sm bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs text-emerald-600 font-semibold hover:underline">
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search via api/Taxpayer/GetSearchTemplate..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          {loading && (
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{taxpayers.length}</span> taxpayers in <span className="font-mono text-indigo-500">tbl_taxpayer</span>
        </div>
      </div>

      {/* Data Grid / Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <tr>
                <th className="py-3 px-4">Taxpayer / Name</th>
                <th className="py-3 px-4">Ward No</th>
                <th className="py-3 px-4">PAN & Citizenship</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {taxpayers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div>No taxpayers found in tbl_taxpayer.</div>
                    <button
                      onClick={() => {
                        setSelectedTaxpayer(null);
                        setIsWindowOpen(true);
                      }}
                      className="mt-3 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      + Register First Taxpayer
                    </button>
                  </td>
                </tr>
              ) : (
                taxpayers.map((tp) => {
                  const displayName = tp.fullname || tp.full_name || "Taxpayer";
                  return (
                    <tr key={tp.taxpayer_id || String(tp.id)} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center font-bold text-xs text-emerald-700 dark:text-emerald-300 shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{displayName}</span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              ID: {tp.taxpayer_id || `TP-${tp.id}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">
                          <Hash className="w-3 h-3 text-indigo-500" />
                          Ward {tp.ward_no || 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                        <div>PAN: <span className="font-mono font-medium">{tp.pan_number || "N/A"}</span></div>
                        <div>Citizen: <span className="font-mono">{tp.citizenship_no || "N/A"}</span></div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {tp.phone || tp.mobile ? (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{tp.phone || tp.mobile}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">No phone</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={async () => {
                              const editData = await TaxpayerController.GetItemTemplate(tp.taxpayer_id || tp.id);
                              setSelectedTaxpayer(editData || tp);
                              setIsWindowOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title="GetItemTemplate for editing"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tp)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title="Delete taxpayer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TaxpayerWindow
        isOpen={isWindowOpen}
        onClose={() => setIsWindowOpen(false)}
        onSubmit={handleCreateOrUpdate}
        editTaxpayer={selectedTaxpayer}
      />
    </div>
  );
};
