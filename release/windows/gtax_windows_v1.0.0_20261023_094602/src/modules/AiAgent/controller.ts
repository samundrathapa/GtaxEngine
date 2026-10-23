import { ApiController } from "../../api/controller.ts";
import { AiProviderType, VoiceCommandParseResult } from "../../server/StartDomain/AiOrchestratorDomain.ts";

export class AiAgentController {
  private static recognitionInstance: any = null;

  static isSpeechRecognitionSupported(): boolean {
    return typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  }

  static createSpeechRecognizer(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: string) => void,
    onEnd: () => void
  ) {
    if (!this.isSpeechRecognitionSupported()) {
      onError("Web Speech Recognition API is not supported in this browser. Please use keyboard input or quick voice templates.");
      return null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognizer = new SpeechRecognition();
    recognizer.continuous = false;
    recognizer.interimResults = true;
    recognizer.lang = "en-US";

    recognizer.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      onResult(final || interim, Boolean(final));
    };

    recognizer.onerror = (event: any) => {
      onError(event.error || "Speech recognition error");
    };

    recognizer.onend = () => {
      onEnd();
    };

    this.recognitionInstance = recognizer;
    return recognizer;
  }

  static speakText(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Strip markdown asterisks and hash tags for clean spoken voice
      const cleanSpoken = text.replace(/[#*`_]/g, "").replace(/\n/g, " ").slice(0, 300);
      const utterance = new SpeechSynthesisUtterance(cleanSpoken);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }

  static stopSpeaking() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  static async parseVoiceCommand(transcript: string): Promise<VoiceCommandParseResult> {
    const res = await ApiController.parseVoiceCommand(transcript);
    if (res.success && res.data) {
      return res.data as VoiceCommandParseResult;
    }
    return {
      rawTranscript: transcript,
      detectedIntent: "UNKNOWN",
      parameters: {},
      suggestedAction: "Evaluate request"
    };
  }

  static async queryAdvisory(
    prompt: string,
    provider: AiProviderType,
    context?: any
  ) {
    const res = await ApiController.consultAi(prompt, provider, context);
    return res;
  }
}
