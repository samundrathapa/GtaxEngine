/**
 * gtax Enterprise - Next.js ClientHeader Component
 * Clean top navigation bar with municipal branding, voice command mic, and language controls
 */

import React from "react";
import { Building2, Bot, Smartphone, Globe } from "lucide-react";
import { VoiceMicAction } from "./VoiceMicAction.tsx";
import { VoiceCommandAction } from "../types.ts";

interface ClientHeaderProps {
  onVoiceCommand?: (action: VoiceCommandAction) => void;
  onOpenChatbot?: () => void;
  onOpenMobileSim?: () => void;
  currentLang?: string;
  onToggleLang?: () => void;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({
  onVoiceCommand,
  onOpenChatbot,
  onOpenMobileSim,
  currentLang = "EN",
  onToggleLang,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between shadow-md">
      {/* Brand & Municipal Identity */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg shadow-sm">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm sm:text-base tracking-tight text-white">
              gtax Enterprise
            </h1>
            <span className="text-[10px] font-mono bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 px-1.5 py-0.5 rounded">
              Next.js Client
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Municipal Property & Integrated Tax Liabilities Engine
          </p>
        </div>
      </div>

      {/* Actions: Voice Mic + Chatbot + Mobile Sim + Lang Switcher */}
      <div className="flex items-center gap-2">
        {/* Quick Voice Command Mic */}
        <VoiceMicAction onCommand={onVoiceCommand} />

        {/* AI Assistant Chatbot */}
        <button
          type="button"
          onClick={onOpenChatbot}
          title="Open AI Tax Assistant"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Bot className="w-5 h-5" />
        </button>

        {/* Mobile Simulator */}
        <button
          type="button"
          onClick={onOpenMobileSim}
          title="Open Mobile App (Flutter) Simulator"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Smartphone className="w-5 h-5" />
        </button>

        {/* Language Switcher */}
        {onToggleLang && (
          <button
            type="button"
            onClick={onToggleLang}
            title="Toggle Language (EN / NP)"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentLang}</span>
          </button>
        )}
      </div>
    </header>
  );
};
