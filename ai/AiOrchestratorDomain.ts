export type AiProviderType = "gemini" | "openai" | "grok";

export interface VoiceCommandResult {
  action: "search_taxpayer" | "navigate_tab" | "calculate_tax" | "open_new_taxpayer" | "unknown";
  payload: Record<string, any>;
  transcript: string;
  confidence: number;
}

export class AiOrchestratorDomain {
  /**
   * Parse spoken or typed natural language commands into structured UI actions
   */
  public static parseVoiceCommand(transcript: string): VoiceCommandResult {
    const text = transcript.trim().toLowerCase();

    // 1. New Taxpayer / One Door Process
    if (
      text.includes("new taxpayer") ||
      text.includes("add taxpayer") ||
      text.includes("नयाँ करदाता") ||
      text.includes("दर्ता") ||
      text.includes("register taxpayer")
    ) {
      return {
        action: "open_new_taxpayer",
        payload: { step: 1 },
        transcript,
        confidence: 0.95
      };
    }

    // 2. Calculate Tax
    if (
      text.includes("calculate tax") ||
      text.includes("tax calculate") ||
      text.includes("कर हिसाब") ||
      text.includes("कर गणना") ||
      text.includes("compute tax")
    ) {
      return {
        action: "calculate_tax",
        payload: {},
        transcript,
        confidence: 0.92
      };
    }

    // 3. Search Taxpayer by name or code
    if (text.includes("search") || text.includes("find") || text.includes("खोज") || text.includes("taxpayer")) {
      const match = text.match(/(?:search|find|taxpayer|करदाता)\s+([a-zA-Z0-9\u0900-\u097F\s]+)/i);
      const query = match ? match[1].trim() : text;
      return {
        action: "search_taxpayer",
        payload: { query },
        transcript,
        confidence: 0.88
      };
    }

    // 4. Navigation
    if (text.includes("rate") || text.includes("दररेट")) {
      return {
        action: "navigate_tab",
        payload: { tab: "rate" },
        transcript,
        confidence: 0.9
      };
    }

    if (text.includes("report") || text.includes("प्रतिवेदन")) {
      return {
        action: "navigate_tab",
        payload: { tab: "reports" },
        transcript,
        confidence: 0.9
      };
    }

    return {
      action: "unknown",
      payload: {},
      transcript,
      confidence: 0.4
    };
  }
}
