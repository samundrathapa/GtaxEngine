import { AiProviderType, VoiceCommandParseResult } from "../../server/StartDomain/AiOrchestratorDomain.ts";

export interface AiChatMessage {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
  timestamp: string;
  provider?: AiProviderType;
  model?: string;
  parsedCommand?: VoiceCommandParseResult;
  taxHighlights?: string[];
  riskScore?: "LOW" | "MEDIUM" | "HIGH";
}

export interface AiAgentConfig {
  provider: AiProviderType;
  voiceAutoSpeak: boolean;
  confidenceThreshold: number;
  continuousListening: boolean;
}

export const initialAiConfig: AiAgentConfig = {
  provider: "gemini",
  voiceAutoSpeak: true,
  confidenceThreshold: 0.85,
  continuousListening: false
};
