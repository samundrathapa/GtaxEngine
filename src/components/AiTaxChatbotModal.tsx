import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  User,
  Send,
  Mic,
  MicOff,
  Sparkles,
  X,
  ArrowRight,
  UserPlus,
  Search,
  Calculator,
  Volume2,
  VolumeX,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Layers,
  Calendar,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  FileText
} from "lucide-react";
import { ApiController } from "../api/controller.ts";
import { SupportedLang, translations } from "../utils/i18n.ts";

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  actionTaken?:
    | "opened_taxpayer_form"
    | "searched_taxpayer"
    | "listed_today_taxpayers"
    | "inserted_land_rate"
    | "opened_calculator"
    | "closed_chat"
    | null;
  taxpayerResults?: any[];
  landRateResult?: any;
  timestamp: string;
}

interface AiTaxChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang: SupportedLang;
  onOpenNewTaxpayer: () => void;
  onSelectTaxpayer: (id: number) => void;
  onOpenMultiYearTaxCalc?: () => void;
  onOpenRatesMaster?: (subTab?: string) => void;
  initialQuery?: string;
}

export const AiTaxChatbotModal: React.FC<AiTaxChatbotModalProps> = ({
  isOpen,
  onClose,
  currentLang,
  onOpenNewTaxpayer,
  onSelectTaxpayer,
  onOpenMultiYearTaxCalc,
  onOpenRatesMaster,
  initialQuery
}) => {
  const t = translations[currentLang];
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "नमस्ते! I am your AI Municipal Tax Assistant (कर एआई सहायक). You can give voice commands:\n• 'open taxpayer' → Opens registration & closes chat box\n• 'list taxpayer today registered' → Shows today's registered citizens\n• 'add landrate 1 to land rate' → Automatically inserts Land Rate 1\n• 'close chat' → Closes this assistant window",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSpokenRef = useRef<string>("");
  const autoSubmitTimeoutRef = useRef<any>(null);

  // Text-to-Speech audio response
  const speakText = (text: string) => {
    if (isMuted || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Remove markdown/technical symbols for cleaner voice speech
      const cleanSpeech = text
        .replace(/[*_#`•→\n]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      utterance.lang = currentLang === "nep" ? "ne-NP" : currentLang === "ind" ? "hi-IN" : "en-US";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  // Initialize Speech Recognition with Auto-Execution
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = currentLang === "nep" ? "ne-NP" : currentLang === "ind" ? "hi-IN" : "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript("");
        lastSpokenRef.current = "";
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        let isFinal = false;
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }
        setVoiceTranscript(currentTranscript);
        setInputText(currentTranscript);
        lastSpokenRef.current = currentTranscript;

        // Auto execute when final utterance is recognized
        if (isFinal && currentTranscript.trim()) {
          if (autoSubmitTimeoutRef.current) clearTimeout(autoSubmitTimeoutRef.current);
          autoSubmitTimeoutRef.current = setTimeout(() => {
            const queryToRun = lastSpokenRef.current.trim();
            if (queryToRun) {
              handleSendMessage(queryToRun);
            }
          }, 400);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // If user spoke something and it was not yet submitted, execute automatically!
        const queryToRun = lastSpokenRef.current.trim();
        if (queryToRun) {
          if (autoSubmitTimeoutRef.current) clearTimeout(autoSubmitTimeoutRef.current);
          autoSubmitTimeoutRef.current = setTimeout(() => {
            handleSendMessage(queryToRun);
          }, 350);
        }
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (autoSubmitTimeoutRef.current) clearTimeout(autoSubmitTimeoutRef.current);
    };
  }, [currentLang]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Focus input on open or handle initial query
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      if (initialQuery && initialQuery.trim()) {
        handleSendMessage(initialQuery.trim());
      }
    }
  }, [isOpen, initialQuery]);

  const toggleListening = () => {
    if (!speechSupported) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or an audio-supported browser.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        console.warn("Recognition stop error", e);
      }
      setIsListening(false);
    } else {
      try {
        lastSpokenRef.current = "";
        setVoiceTranscript("");
        recognitionRef.current?.start();
      } catch (e) {
        console.warn("Recognition start error", e);
      }
    }
  };

  // Intent parsing & workflow execution
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    setInputText("");
    setVoiceTranscript("");
    lastSpokenRef.current = "";
    if (autoSubmitTimeoutRef.current) clearTimeout(autoSubmitTimeoutRef.current);

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    const lower = query.toLowerCase();

    // =========================================================================
    // 1. Intent: "close chat" / "close assistant" / "बन्द गर"
    // =========================================================================
    const closeChatKeywords = [
      "close chat",
      "close chat box",
      "close chatbot",
      "close assistant",
      "close modal",
      "close window",
      "close box",
      "close",
      "minimize chat",
      "hide chat",
      "exit chat",
      "बन्द गर्नुहोस्",
      "बन्द गर",
      "च्याट बन्द",
      "च्याट बन्द गर",
      "बन्द"
    ];

    const isCloseChatIntent = closeChatKeywords.some(
      (kw) => lower === kw || lower.startsWith(kw + " ") || lower.includes("close chat") || lower.includes("close assistant")
    );

    if (isCloseChatIntent) {
      speakText("Closing chat box.");
      setIsProcessing(false);
      onClose();
      return;
    }

    // =========================================================================
    // 2. Intent: "open taxpayer" / "taxpayer" / "नयाँ करदाता"
    // Requirement: It should open taxpayer registration AND close that chat box!
    // =========================================================================
    const openTaxpayerKeywords = [
      "open taxpayer",
      "open tax payer",
      "open taxpayer form",
      "new taxpayer",
      "create taxpayer",
      "add taxpayer",
      "register taxpayer",
      "new citizen",
      "taxpayer",
      "करदाता",
      "नयाँ करदाता",
      "करदाता खोल्नुहोस्",
      "करदाता दर्ता",
      "नया करदाता"
    ];

    const isOpenTaxpayerIntent = openTaxpayerKeywords.some((kw) => lower.includes(kw));

    if (isOpenTaxpayerIntent) {
      speakText("Opening Taxpayer Registration form and closing chat box.");
      onOpenNewTaxpayer();
      setIsProcessing(false);
      onClose();
      return;
    }

    // =========================================================================
    // 3. Intent: "list taxpayer today registered" / "show today registered"
    // Requirement: Show the list of taxpayers registered today!
    // =========================================================================
    const isListTodayIntent =
      lower.includes("list taxpayer today") ||
      lower.includes("taxpayer today registered") ||
      lower.includes("taxpayers today registered") ||
      lower.includes("registered today") ||
      lower.includes("today registered") ||
      lower.includes("list today taxpayer") ||
      lower.includes("today's taxpayer") ||
      lower.includes("todays taxpayer") ||
      lower.includes("list taxpayer") ||
      lower.includes("list taxpayers") ||
      lower.includes("show taxpayer") ||
      lower.includes("show taxpayers") ||
      lower.includes("आज दर्ता") ||
      lower.includes("आजका करदाता") ||
      lower.includes("करदाता सूची");

    if (isListTodayIntent) {
      try {
        const tpRes = await ApiController.getTaxpayers();
        const allTps: any[] = tpRes.data || [];

        const todayIso = new Date().toISOString().slice(0, 10);

        // Filter today's registered taxpayers
        const todayTps = allTps.filter((tp) => {
          const dt = (tp.insert_on || tp.created_at || "").slice(0, 10);
          return dt === todayIso;
        });

        // Use today's taxpayers if any; otherwise display recent active taxpayers with clear notice
        const displayList = todayTps.length > 0 ? todayTps : allTps.slice(0, 5);
        const countText =
          todayTps.length > 0
            ? `Found ${todayTps.length} taxpayer${todayTps.length > 1 ? "s" : ""} registered today (${todayIso}):`
            : `Showing ${displayList.length} active municipal taxpayers in the system (0 registered today so far):`;

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: countText,
          actionTaken: "listed_today_taxpayers",
          taxpayerResults: displayList,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsProcessing(false);
        speakText(
          todayTps.length > 0
            ? `Found ${todayTps.length} taxpayers registered today. Here is the list.`
            : `Showing ${displayList.length} registered taxpayers in the system. You can open any dossier or register a new taxpayer.`
        );
        return;
      } catch (err) {
        console.error("Failed to load today taxpayers:", err);
      }
    }

    // =========================================================================
    // 4. Intent: "add landrate 1 to land rate" / "insert land rate"
    // Requirement: By giving 'add landrate 1 to land rate' it should auto insert!
    // =========================================================================
    const isAddLandRateIntent =
      (lower.includes("add") || lower.includes("insert") || lower.includes("create") || lower.includes("थप")) &&
      (lower.includes("landrate") || lower.includes("land rate") || lower.includes("जग्गा दर"));

    if (isAddLandRateIntent) {
      try {
        // Extract rate number/identifier if mentioned (e.g., "1", "2", "prime")
        const numberMatch =
          lower.match(/(?:landrate|land\s*rate)\s*(\d+|[a-zA-Z0-9]+)/i) ||
          lower.match(/\b(\d+)\b/);
        const rateIdentifier = numberMatch ? numberMatch[1] : "1";

        // Extract rate per unit if spoken (e.g. "rate 1500000" or "at 1200000")
        const rateAmountMatch = lower.match(/(?:rate|at|of|amount)\s*(?:of|is|equals)?\s*([0-9,]+)/i);
        const parsedRateAmount = rateAmountMatch
          ? parseFloat(rateAmountMatch[1].replace(/,/g, ""))
          : 1200000;

        const newLandRateData = {
          code: `LR-${rateIdentifier}`,
          fullanme: `Land Rate ${rateIdentifier} (जग्गा मुल्यांकन दर ${rateIdentifier}) - Municipal Sector`,
          rate_name: `Land Rate ${rateIdentifier}`,
          fiscal_year_id: 2, // Current FY 2081/82
          unit_id: 3, // Aana
          rate_per_unit: parsedRateAmount,
          area_per_unit: 1.0,
          area_upto: 10000.0,
          ward_no_ids: "1,2,3",
          is_parent: true,
          parent_id: null
        };

        const res = await ApiController.saveRateItem("land_rate", newLandRateData);
        if (res.success && res.data) {
          // Broadcast event to notify RatesMasterPanel and other UI components
          window.dispatchEvent(new CustomEvent("gtax:rates_updated", { detail: res.data }));

          const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: `✅ Land Rate ${rateIdentifier} has been automatically inserted into the database (tbl_land_rate):\n• Code: ${res.data.code}\n• Rate per Aana: NPR ${Number(res.data.rate_per_unit || parsedRateAmount).toLocaleString()}\n• Ward Coverage: Wards ${res.data.ward_no_ids || "1,2,3"}\n• Fiscal Year: FY 2081/82`,
            actionTaken: "inserted_land_rate",
            landRateResult: res.data,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          };

          setMessages((prev) => [...prev, botMsg]);
          setIsProcessing(false);
          speakText(
            `Land Rate ${rateIdentifier} has been automatically inserted with rate of ${parsedRateAmount.toLocaleString()} rupees per aana.`
          );
          return;
        } else {
          throw new Error(res.message || "Insertion failed");
        }
      } catch (err: any) {
        console.error("Failed to auto-insert land rate:", err);
        const errorMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `⚠️ Could not auto-insert Land Rate: ${err?.message || "Internal server error"}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, errorMsg]);
        setIsProcessing(false);
        return;
      }
    }

    // =========================================================================
    // 5. Intent: "calculate tax" / "multi year" / "tax calc" / "कर गणना"
    // =========================================================================
    const isCalcIntent =
      lower.includes("calculate tax") ||
      lower.includes("multi year") ||
      lower.includes("fiscal year") ||
      lower.includes("tax liability") ||
      lower.includes("कर गणना") ||
      lower.includes("हिसाब");

    if (isCalcIntent && onOpenMultiYearTaxCalc) {
      setTimeout(() => {
        onOpenMultiYearTaxCalc();
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: "Launching the Multi-Fiscal-Year Property Tax Engine. You can choose a taxpayer and assess liabilities spanning across any fiscal year range.",
          actionTaken: "opened_calculator",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsProcessing(false);
        speakText("Launching property tax calculation engine.");
      }, 300);
      return;
    }

    // =========================================================================
    // 6. Intent: Search taxpayer by name or citizenship ID
    // =========================================================================
    const isSearchIntent =
      lower.includes("search") ||
      lower.includes("find") ||
      lower.includes("who is") ||
      lower.includes("citizen") ||
      lower.includes("खोजी") ||
      lower.includes("नागरिकता");

    try {
      const tpRes = await ApiController.getTaxpayers();
      const allTps: any[] = tpRes.data || [];

      const cleanTerm = lower
        .replace("search", "")
        .replace("find", "")
        .replace("taxpayer", "")
        .replace("citizen", "")
        .replace("खोजी", "")
        .replace("नागरिकता", "")
        .replace("गर्नुहोस्", "")
        .trim();

      const matchedTps = allTps.filter((tp) => {
        if (!cleanTerm) return false;
        return (
          tp.fullanme?.toLowerCase().includes(cleanTerm) ||
          tp.citizenship_no?.toLowerCase().includes(cleanTerm) ||
          tp.code?.toLowerCase().includes(cleanTerm) ||
          tp.mobile_no?.includes(cleanTerm)
        );
      });

      if (matchedTps.length > 0) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `Found ${matchedTps.length} matching taxpayer record${matchedTps.length > 1 ? "s" : ""} for "${cleanTerm || query}":`,
          actionTaken: "searched_taxpayer",
          taxpayerResults: matchedTps,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, botMsg]);
        setIsProcessing(false);
        speakText(`Found ${matchedTps.length} matching taxpayer records.`);
        return;
      }
    } catch (e) {
      console.warn("Local search error", e);
    }

    // =========================================================================
    // 7. Default: Query Gemini AI Municipal Tax Engine
    // =========================================================================
    try {
      const geminiRes = await ApiController.geminiChat({
        messages: [{ role: "user", text: query }],
        newMessage: query,
        modelTier: "general",
        systemInstruction:
          "You are the senior municipal tax AI assistant for Nepal local government property taxation. Explain property tax assessment rules, land valuation rates, construction depreciation schedules, and fine/rebate policies clearly and concisely. Also note that users can say 'open taxpayer' to register a new citizen, 'list taxpayer today registered' to view today's entries, or 'add landrate 1 to land rate' to insert rates."
      });

      const replyText =
        geminiRes?.data?.text ||
        "I understand your municipal property tax question. You can use voice commands anytime: 'open taxpayer' to launch registration, 'list taxpayer today registered' to view taxpayers, or 'add landrate 1 to land rate' to auto-insert rates.";

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, botMsg]);
      speakText(replyText.slice(0, 160));
    } catch (err) {
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: "Municipal Tax Voice Assistant: You can prompt me to 'open taxpayer' to register a new citizen, 'list taxpayer today registered' to view registrations, or 'add landrate 1 to land rate' to insert land rates.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[650px] max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">AI Tax Chatbot (एआई कर सहायक)</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Voice Auto-Execution Active
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Voice commands auto-execute on speech end: "open taxpayer", "list taxpayer today registered", "add landrate 1", "close chat"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title={isMuted ? "Unmute Voice Audio" : "Mute Voice Audio"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Close chat box"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Action Chips */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
          <span className="text-slate-400 font-medium shrink-0">Try Voice or Click:</span>

          <button
            onClick={() => handleSendMessage("open taxpayer")}
            className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 font-medium flex items-center gap-1.5 shrink-0 transition-colors"
            title="Opens taxpayer form and closes chat box"
          >
            <UserPlus className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>"open taxpayer"</span>
          </button>

          <button
            onClick={() => handleSendMessage("list taxpayer today registered")}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 font-medium flex items-center gap-1.5 shrink-0 transition-colors"
            title="List taxpayers registered today"
          >
            <FileText className="w-3 h-3 text-emerald-600" />
            <span>"list taxpayer today registered"</span>
          </button>

          <button
            onClick={() => handleSendMessage("add landrate 1 to land rate")}
            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800 font-medium flex items-center gap-1.5 shrink-0 transition-colors"
            title="Auto-insert Land Rate 1 into tbl_land_rate"
          >
            <DollarSign className="w-3 h-3 text-amber-600" />
            <span>"add landrate 1 to land rate"</span>
          </button>

          <button
            onClick={() => handleSendMessage("close chat")}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <X className="w-3 h-3 text-slate-500" />
            <span>"close chat"</span>
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-slate-950/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 dark:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50"
                }`}
              >
                {msg.sender === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Auto-Inserted Land Rate Card */}
                {msg.actionTaken === "inserted_land_rate" && msg.landRateResult && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                        Database Auto-Inserted (tbl_land_rate)
                      </span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-mono">
                        ID: #{msg.landRateResult.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Matrix Code:</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white">
                          {msg.landRateResult.code}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Valuation Rate:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">
                          NPR {Number(msg.landRateResult.rate_per_unit).toLocaleString()} / Aana
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Jurisdiction:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          Wards {msg.landRateResult.ward_no_ids || "1, 2, 3"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Fiscal Year:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          FY 2081/82 (Current)
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Live in calculation engine
                      </span>
                      <button
                        onClick={() => {
                          onClose();
                          if (onOpenRatesMaster) onOpenRatesMaster("land_rate");
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <span>Open Land Rates Matrix</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Taxpayer Search / Today's Registered List Cards */}
                {msg.taxpayerResults && msg.taxpayerResults.length > 0 && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Registered Citizens ({msg.taxpayerResults.length})</span>
                      <button
                        onClick={() => {
                          onOpenNewTaxpayer();
                          onClose();
                        }}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Register New Today</span>
                      </button>
                    </div>

                    {msg.taxpayerResults.map((tp) => (
                      <div
                        key={tp.id}
                        className="p-2.5 bg-slate-50 dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white text-xs truncate flex items-center gap-2">
                            <span>{tp.fullanme}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                              {tp.code}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 font-mono">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-slate-400" />
                              वडा {tp.ward_no || 1}
                            </span>
                            <span>· नागरिकता: {tp.citizenship_no || "N/A"}</span>
                            {tp.mobile_no && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5 text-slate-400" />
                                {tp.mobile_no}
                              </span>
                            )}
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {tp.insert_on ? `Registered: ${tp.insert_on.slice(0, 10)}` : "Registered Active"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => {
                              onSelectTaxpayer(tp.id);
                              onClose();
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                            title="Open taxpayer dossier and property records"
                          >
                            <span>Open Dossier</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className={`text-[9px] mt-1.5 font-mono text-right ${
                    msg.sender === "user" ? "text-indigo-200" : "text-slate-400"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 italic py-2">
              <Bot className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Analyzing command & executing automatic workflow...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Listening Wave Banner */}
        {isListening && (
          <div className="px-4 py-2.5 bg-rose-500/10 border-t border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-between text-xs animate-pulse shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="font-bold">
                Listening for command... Speak now! Auto-executes upon finish.
              </span>
            </div>
            <button
              onClick={toggleListening}
              className="text-[11px] underline font-semibold hover:text-rose-700"
            >
              Stop Listening
            </button>
          </div>
        )}

        {/* Voice & Text Input Bar */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/30 animate-pulse"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 border-slate-200 dark:border-slate-700"
              }`}
              title={isListening ? "Stop listening" : "Click to speak voice command"}
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Speak or type: 'open taxpayer', 'list taxpayer today registered', 'add landrate 1', 'close chat'..."
              className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isProcessing}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
