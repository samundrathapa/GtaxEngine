import React from "react";
import { AiAgentConfig } from "./model.ts";
import { X, Cpu, Sparkles, Volume2, Shield } from "lucide-react";

interface AiConfigWindowProps {
  isOpen: boolean;
  onClose: () => void;
  config: AiAgentConfig;
  onChangeConfig: (newConfig: AiAgentConfig) => void;
}

export const AiConfigWindow: React.FC<AiConfigWindowProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 shadow-2xl rounded-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                AI Orchestrator Engine Settings
              </h3>
              <p className="text-xs text-slate-500">
                Configure provider routing between Gemini, OpenAI, and Grok
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Primary LLM Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["gemini", "openai", "grok"] as const).map((prov) => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, provider: prov })}
                  className={`p-3 text-left border rounded-lg transition-colors ${
                    config.provider === prov
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className="text-xs uppercase font-semibold">{prov}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {prov === "gemini" && "gemini-3.8-flash"}
                    {prov === "openai" && "gpt-4o Enterprise"}
                    {prov === "grok" && "grok-2-latest"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Voice Command Pipeline
            </label>

            <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-600" />
                <div>
                  <div className="text-xs font-semibold text-slate-800">Text-to-Speech Audio Feedback</div>
                  <div className="text-[11px] text-slate-500">Read AI tax assessments aloud upon response</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.voiceAutoSpeak}
                onChange={(e) => onChangeConfig({ ...config, voiceAutoSpeak: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded-sm"
              />
            </label>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2">
            <Shield className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <strong>Audit Logging:</strong> All AI prompts, reasoning tokens, and voice transcripts are logged in the BaseFrame audit ledger with user identity and timestamp.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
