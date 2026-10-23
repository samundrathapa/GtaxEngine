import React, { useEffect, useState } from "react";
import { SyncNodeTelemetry, initialNodeTelemetry } from "./model.ts";
import { SyncEventRecord } from "../../server/ApiServiceStruct/SyncEventApiService.ts";
import { RealtimeSyncController } from "./controller.ts";
import { SyncEventWindow } from "./window.tsx";
import { Radio, RefreshCw, Eye, Send, CheckCircle2, Server, Clock, GitCommit } from "lucide-react";

export const RealtimeSyncPanel: React.FC = () => {
  const [nodes] = useState<SyncNodeTelemetry[]>(initialNodeTelemetry);
  const [events, setEvents] = useState<SyncEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SyncEventRecord | null>(null);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const list = await RealtimeSyncController.fetchSyncEvents();
    setEvents(list);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualBroadcast = async () => {
    setBroadcasting(true);
    const res = await RealtimeSyncController.broadcastSync("MANUAL_GLOBAL_DISPATCH");
    setStatusMsg(res.message);
    await loadData();
    setBroadcasting(false);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>BaseFrame</span>
            <span aria-hidden="true">·</span>
            <span>StartDomain</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-700">RealtimeSyncDomain</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Real-Time Data Synchronization & Microservices Mesh
          </h2>
          <p className="text-sm text-slate-500">
            Distributed Change-Data-Capture (CDC), transaction replication, and multi-jurisdictional synchronization.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Reload telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleManualBroadcast}
            disabled={broadcasting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
          >
            <Send className="w-4 h-4" />
            {broadcasting ? "Broadcasting..." : "Broadcast CDC Sync"}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center justify-between animate-in fade-in">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-xs text-emerald-600 font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Distributed Microservice Nodes Grid */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-600" />
          Active Microservice Cluster Nodes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {nodes.map((node, i) => (
            <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900 truncate">
                  {node.serviceId}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-500" />
                  {node.status}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {node.region}
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Latency:</span>
                <span className="font-bold text-slate-800">{node.latencyMs} ms</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Seq #{node.eventSequenceNumber}</span>
                <span>{node.lastSyncTimestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-Time CDC Event Stream Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Distributed CDC Event Store Log
            </h3>
            <p className="text-xs text-slate-500">
              Audit-verified real-time synchronization events committed across jurisdictional nodes.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Total Events: {events.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/60 border-b border-slate-200 font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-2.5 px-4">Event ID / Hash</th>
                <th className="py-2.5 px-4">Event Type</th>
                <th className="py-2.5 px-4">Source Service</th>
                <th className="py-2.5 px-4">Target Jurisdictions</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {events.map((evt) => (
                <tr key={evt.event_id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-sans">
                    <div className="font-mono text-xs font-bold text-slate-900">{evt.event_id}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-xs">{evt.checksum_hash}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <div className="font-bold text-slate-800">{evt.event_type}</div>
                    <div className="text-[11px] text-slate-400 font-sans">Aggregate: {evt.aggregate_type}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {evt.source_service}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <div className="flex flex-wrap gap-1">
                      {evt.target_jurisdictions?.map((j, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] rounded-sm">
                          {j}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {evt.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <button
                      onClick={() => {
                        setSelectedEvent(evt);
                        setIsWindowOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors"
                      title="Inspect packet payload"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SyncEventWindow
        isOpen={isWindowOpen}
        onClose={() => setIsWindowOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
};
