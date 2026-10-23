/**
 * gtax Enterprise - Next.js VoiceMicAction Component
 * Icon-only pulsing microphone button for instant speech command execution
 */

import React from "react";
import { Mic, MicOff } from "lucide-react";
import { useVoiceCommands } from "../hooks/useVoiceCommands.ts";
import { VoiceCommandAction } from "../types.ts";

interface VoiceMicActionProps {
  onCommand?: (action: VoiceCommandAction) => void;
  className?: string;
}

export const VoiceMicAction: React.FC<VoiceMicActionProps> = ({ onCommand, className = "" }) => {
  const { isListening, startListening, stopListening, lastAction } = useVoiceCommands(onCommand);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        title={
          isListening
            ? "Listening... Speak 'open taxpayer', 'list taxpayer today registered', or 'add landrate'"
            : "Quick Voice Command: Speak 'open taxpayer', 'list taxpayer today registered', or 'add landrate'"
        }
        className={`relative p-2 rounded-lg transition-all ${
          isListening
            ? "bg-rose-600 text-white shadow-md ring-2 ring-rose-400 animate-pulse"
            : "text-slate-400 hover:text-white hover:bg-slate-800"
        } ${className}`}
      >
        {isListening ? <MicOff className="w-5 h-5 text-white animate-bounce" /> : <Mic className="w-5 h-5" />}
      </button>

      {/* Floating status tooltip when active */}
      {isListening && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 border border-rose-500/50 text-rose-300 text-xs px-2.5 py-1 rounded-full shadow-lg z-50">
          Listening... Speak command
        </div>
      )}

      {lastAction?.autoExecuted && (
        <div className="sr-only" aria-live="polite">
          {lastAction.speechResponse}
        </div>
      )}
    </div>
  );
};
