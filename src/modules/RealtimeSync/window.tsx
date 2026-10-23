import React from "react";
import { SyncEventRecord } from "../../server/ApiServiceStruct/SyncEventApiService.ts";
import { X, CheckCircle2, Shield, Activity } from "lucide-react";

interface SyncEventWindowProps {
  isOpen: boolean;
  onClose: () => void;
  event: SyncEventRecord | null;
}

export const SyncEventWindow: React.FC<SyncEventWindowProps> = ({
  isOpen,
  onClose,
  event
}) => {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 shadow-2xl rounded-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span>Event ID: {event.event_id}</span>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {event.status}
              </span>
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              CDC Sync Packet Payload Inspector
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
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div>
              <span className="text-slate-400">Source Microservice:</span>
              <div className="font-mono font-semibold text-slate-800">{event.source_service}</div>
            </div>
            <div>
              <span className="text-slate-400">Aggregate Type / ID:</span>
              <div className="font-mono font-semibold text-slate-800">{event.aggregate_type} ({event.aggregate_id})</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Target Broadcast Jurisdictions
            </label>
            <div className="flex flex-wrap gap-1.5">
              {event.target_jurisdictions?.map((jur, i) => (
                <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-xs rounded-sm">
                  {jur}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Replication Data Payload (JSON)
            </label>
            <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto max-h-48 border border-slate-800">
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600" />
              Cryptographic Checksum Hash
            </div>
            <div className="font-mono text-[11px] text-slate-500 break-all">
              {event.checksum_hash}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
