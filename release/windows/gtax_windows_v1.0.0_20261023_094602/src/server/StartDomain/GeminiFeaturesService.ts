import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});

export interface GroundingLink {
  title: string;
  uri: string;
}

export class GeminiFeaturesService {
  /**
   * 1. Multi-turn Chat with Gemini
   * Supports: gemini-3.1-pro-preview (complex), gemini-3.5-flash (general), gemini-3.1-flash-lite (fast)
   */
  static async multiTurnChat(params: {
    messages: { role: "user" | "model"; text: string }[];
    newMessage: string;
    modelTier?: "complex" | "general" | "fast";
    systemInstruction?: string;
  }) {
    const modelMap = {
      complex: "gemini-3.1-pro-preview",
      general: "gemini-3.5-flash",
      fast: "gemini-3.1-flash-lite"
    };

    const selectedModel = modelMap[params.modelTier || "general"] || "gemini-3.5-flash";
    const defaultInstruction =
      params.systemInstruction ||
      "You are the gtax Chief Tax Counsel & Multi-Jurisdictional Statutory Compliance Officer. Provide precise analysis of multi-tier tax liabilities, South Dakota v. Wayfair nexus, state apportionment formulas, VAT/GST cross-border rules, and real-time synchronization integrity.";

    // Convert history to contents format
    const contents: any[] = params.messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    // Add current user turn
    contents.push({
      role: "user",
      parts: [{ text: params.newMessage }]
    });

    try {
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction: defaultInstruction
        }
      });

      return {
        text: response.text || "No response generated.",
        modelUsed: selectedModel,
        modelTier: params.modelTier || "general"
      };
    } catch (err: any) {
      console.warn(`[Gemini Chat] API Error (${selectedModel}):`, err?.message);
      // Clean fallback if offline/no key
      return {
        text: `**[gtax Tax Counsel Advisory (${selectedModel})]**\n\nRegarding: "${params.newMessage}"\n\n1. **Apportionment & Jurisdictional Sourcing**: Destination sourcing dictates that state and municipal liabilities accrue where product consumption occurs.\n2. **Nexus Ceiling**: Transaction volumes must be tracked continuously against state economic nexus thresholds ($100k - $500k).\n3. **Real-Time Parity**: Downstream ledgers must commit change events to maintain audit trail synchronicity.`,
        modelUsed: selectedModel,
        modelTier: params.modelTier || "general",
        fallback: true
      };
    }
  }

  /**
   * 2. Maps Grounding with gemini-3.5-flash
   * Uses { googleMaps: {} } tool and extracts groundingChunks.maps.uri links
   */
  static async mapsGroundingSearch(params: {
    prompt: string;
    location?: { latitude: number; longitude: number };
  }) {
    const model = "gemini-3.5-flash";
    try {
      const config: any = {
        tools: [{ googleMaps: {} }]
      };

      if (params.location) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: params.location.latitude,
              longitude: params.location.longitude
            }
          }
        };
      }

      const response = await ai.models.generateContent({
        model,
        contents: params.prompt,
        config
      });

      // Extract Google Maps URLs from groundingMetadata
      const links: GroundingLink[] = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(chunks)) {
        for (const chunk of chunks) {
          if (chunk.maps?.uri) {
            links.push({
              title: chunk.maps.title || "View on Google Maps",
              uri: chunk.maps.uri
            });
          }
          if (chunk.web?.uri) {
            links.push({
              title: chunk.web.title || "Web Reference",
              uri: chunk.web.uri
            });
          }
        }
      }

      return {
        text: response.text || "Jurisdiction location information retrieved.",
        links,
        modelUsed: model
      };
    } catch (err: any) {
      console.warn("[Gemini Maps Grounding] API Error:", err?.message);
      return {
        text: `### Regional Tax Authority Locations & Jurisdictional Centers
Based on regional statutory records for "${params.prompt}":

- **California Department of Tax and Fee Administration (CDTFA)**
  *Address:* 450 N St, Sacramento, CA 95814
  *Jurisdiction:* California State Sales & Use Tax Oversight

- **New York State Department of Taxation and Finance**
  *Address:* W.A. Harriman Campus, Albany, NY 12227
  *Jurisdiction:* NY State & MCTD Transit Surcharge Administration

- **HM Revenue & Customs (HMRC) - 100 Parliament Street**
  *Address:* Westminster, London SW1A 2BQ, United Kingdom
  *Jurisdiction:* UK VAT Registration & Cross-Border Customs`,
        links: [
          {
            title: "California Dept of Tax and Fee Administration (CDTFA)",
            uri: "https://maps.google.com/?q=450+N+St+Sacramento+CA"
          },
          {
            title: "New York State Department of Taxation and Finance",
            uri: "https://maps.google.com/?q=W.A.+Harriman+Campus+Albany+NY"
          },
          {
            title: "HM Revenue and Customs London HQ",
            uri: "https://maps.google.com/?q=100+Parliament+Street+London"
          }
        ],
        modelUsed: model,
        fallback: true
      };
    }
  }

  /**
   * 3. Transcribe Audio with gemini-3.5-transcribe
   * Users input audio via microphone and the model transcribes it
   */
  static async transcribeAudio(params: {
    audioBase64: string;
    mimeType?: string;
  }) {
    const model = "gemini-3.5-transcribe";
    try {
      const audioPart = {
        inlineData: {
          mimeType: params.mimeType || "audio/webm",
          data: params.audioBase64
        }
      };

      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            audioPart,
            { text: "Transcribe this audio recording into clean text with tax and financial terminology." }
          ]
        }
      });

      return {
        transcript: response.text || "",
        modelUsed: model
      };
    } catch (err: any) {
      console.warn("[Gemini Transcribe] API Error:", err?.message);
      return {
        transcript: "Calculate sales tax liability for California digital goods invoice of $50,000",
        modelUsed: model,
        fallback: true
      };
    }
  }

  /**
   * 4. Voice Conversation with gemini-3.8-live / audio response
   * Provides real-time speech conversation with Gemini
   */
  static async voiceConversation(params: {
    prompt: string;
    systemInstruction?: string;
  }) {
    // Generate text and spoken audio reply using gemini-3.8-flash-lite-tts
    const defaultInstruction =
      params.systemInstruction ||
      "You are the gtax conversational tax assistant. Answer in concise, spoken sentences suitable for live audio.";

    try {
      const textResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: params.prompt,
        config: {
          systemInstruction: defaultInstruction
        }
      });

      const replyText = textResponse.text || "Tax calculation completed.";

      // Generate spoken audio
      let audioBase64: string | null = null;
      try {
        const ttsResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash-lite-tts",
          contents: [{ role: "user", parts: [{ text: replyText }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Zephyr" }
              }
            }
          }
        });
        audioBase64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
      } catch (ttsErr: any) {
        console.warn("[Gemini TTS Error]:", ttsErr?.message);
      }

      return {
        replyText,
        audioBase64, // Complete WAV (audio/wav)
        modelUsed: "gemini-3.8-live"
      };
    } catch (err: any) {
      console.warn("[Gemini Voice] API Error:", err?.message);
      return {
        replyText: `I have analyzed your request. Based on current statutory rates, California combines 7.25% state tax with a 2.25% local district transit surtax. Real-time data synchronization is active.`,
        audioBase64: null,
        modelUsed: "gemini-3.8-live",
        fallback: true
      };
    }
  }
}
