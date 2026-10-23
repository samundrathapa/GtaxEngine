/**
 * gtax Enterprise - Next.js useVoiceCommands Hook
 * Handles Web Speech Recognition, auto-execution on final speech, and text-to-speech audio feedback
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { VoiceCommandAction } from "../types.ts";

// Web Speech API interface declarations
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: unknown) => void) | null;
  onresult: ((event: {
    resultIndex: number;
    results: {
      length: number;
      [index: number]: {
        isFinal: boolean;
        [index: number]: { transcript: string };
      };
    };
  }) => void) | null;
}

interface WindowWithSpeech extends Window {
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  SpeechRecognition?: new () => SpeechRecognitionInstance;
}

export function useVoiceCommands(onExecuteCommand?: (action: VoiceCommandAction) => void) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [lastAction, setLastAction] = useState<VoiceCommandAction | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const speak = useCallback((text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const evaluateVoiceIntent = useCallback((text: string): VoiceCommandAction => {
    const lower = text.toLowerCase().trim();

    if (lower.includes("open taxpayer") || lower.includes("register taxpayer") || lower.includes("add taxpayer")) {
      return {
        command: text,
        intent: "NAVIGATE_TAXPAYER",
        autoExecuted: true,
        speechResponse: "Opening Taxpayer registration window.",
      };
    }

    if (lower.includes("close chat") || lower.includes("close assistant") || lower.includes("close bot")) {
      return {
        command: text,
        intent: "CLOSE_CHAT",
        autoExecuted: true,
        speechResponse: "Closing AI Tax Chat Assistant.",
      };
    }

    if (lower.includes("list taxpayer") || lower.includes("registered today") || lower.includes("today registered")) {
      return {
        command: text,
        intent: "LIST_TODAY_TAXPAYERS",
        autoExecuted: true,
        speechResponse: "Fetching list of taxpayers registered today.",
      };
    }

    if (lower.includes("land rate") || lower.includes("add landrate")) {
      return {
        command: text,
        intent: "INSERT_LAND_RATE",
        parameters: { rateName: "Land Rate 1", rateValue: 1200 },
        autoExecuted: true,
        speechResponse: "Land Rate 1 has been automatically inserted into the database.",
      };
    }

    if (lower.includes("calculate") || lower.includes("tax calculation") || lower.includes("property valuation")) {
      return {
        command: text,
        intent: "CALCULATE_TAX",
        autoExecuted: true,
        speechResponse: "Opening Tax Calculation and Valuation Engine.",
      };
    }

    return {
      command: text,
      intent: "UNKNOWN",
      autoExecuted: false,
      speechResponse: `Processed voice input: "${text}"`,
    };
  }, []);

  const startListening = useCallback(() => {
    const win = typeof window !== "undefined" ? (window as unknown as WindowWithSpeech) : null;
    const SpeechClass = win?.SpeechRecognition || win?.webkitSpeechRecognition;

    if (!SpeechClass) {
      speak("Speech recognition is not supported in this browser environment.");
      return;
    }

    try {
      const recognition = new SpeechClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("");
      };

      recognition.onresult = (event) => {
        let currentTranscript = "";
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          currentTranscript += res[0].transcript;
          if (res.isFinal) isFinal = true;
        }

        setTranscript(currentTranscript);

        if (isFinal && currentTranscript.trim().length > 0) {
          const action = evaluateVoiceIntent(currentTranscript);
          setLastAction(action);
          speak(action.speechResponse);
          if (onExecuteCommand) {
            onExecuteCommand(action);
          }
          recognition.stop();
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Failed to initialize speech recognition", e);
      setIsListening(false);
    }
  }, [evaluateVoiceIntent, onExecuteCommand, speak]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    lastAction,
    startListening,
    stopListening,
    speak,
  };
}
