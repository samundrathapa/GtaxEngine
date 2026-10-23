import React, { useState, useEffect, useRef } from "react";
import { ApiController } from "../../api/controller.ts";
import {
  Bot,
  User,
  Send,
  Mic,
  MicOff,
  MapPin,
  FileAudio,
  Radio,
  Sparkles,
  ExternalLink,
  Volume2,
  VolumeX,
  Play,
  Square,
  RefreshCw,
  Copy,
  Check,
  Compass,
  ArrowRight
} from "lucide-react";

interface AiAgentPanelProps {
  onExecuteTaxCalculation?: (params: { grossAmount: number; destinationCountry: string; destinationRegion: string }) => void;
  onNavigateToSync?: () => void;
}

type AiSubFeature = "multiturn_chat" | "live_voice" | "maps_grounding" | "transcribe_audio";

export const AiAgentPanel: React.FC<AiAgentPanelProps> = ({
  onExecuteTaxCalculation,
  onNavigateToSync
}) => {
  const [activeFeature, setActiveFeature] = useState<AiSubFeature>("multiturn_chat");

  // ----------------------------------------------------
  // 1. Multi-turn Chat State (gemini-3.1-pro-preview, gemini-3.5-flash, gemini-3.1-flash-lite)
  // ----------------------------------------------------
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "model"; text: string; modelUsed?: string }[]>([
    {
      role: "model",
      text: "Greetings. I am your gtax Enterprise Tax Intelligence Partner powered by Google Gemini. How can I assist you with multi-jurisdictional tax liabilities, Wayfair nexus statutes, or real-time ledger compliance today?",
      modelUsed: "gemini-3.5-flash"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatModelTier, setChatModelTier] = useState<"complex" | "general" | "fast">("general");
  const [systemRole, setSystemRole] = useState("Chief Multi-Jurisdictional Tax Counsel");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const userText = chatInput;
    setChatInput("");

    const updated = [...chatMessages, { role: "user" as const, text: userText }];
    setChatMessages(updated);
    setChatLoading(true);

    try {
      const res = await ApiController.geminiChat({
        messages: updated.slice(0, -1),
        newMessage: userText,
        modelTier: chatModelTier,
        systemInstruction: `You are the gtax ${systemRole}. Provide authoritative, structured analysis of multi-jurisdictional tax liabilities and compliance.`
      });

      if (res.success && res.data) {
        setChatMessages((prev) => [
          ...prev,
          { role: "model", text: res.data?.text || "", modelUsed: res.data?.modelUsed }
        ]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: "model", text: `Error: ${err?.message || "Failed to query Gemini model."}` }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // ----------------------------------------------------
  // 2. Google Maps Grounding State (gemini-3.5-flash with googleMaps)
  // ----------------------------------------------------
  const [mapsPrompt, setMapsPrompt] = useState("Where are the headquarters of the California Department of Tax and Fee Administration and local tax filing offices?");
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsResponse, setMapsResponse] = useState<string | null>(null);
  const [mapsLinks, setMapsLinks] = useState<{ title: string; uri: string }[]>([]);

  const handleMapsSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapsPrompt.trim() || mapsLoading) return;
    setMapsLoading(true);
    setMapsResponse(null);
    setMapsLinks([]);

    try {
      const res = await ApiController.geminiMapsGrounding(mapsPrompt);
      if (res.success && res.data) {
        setMapsResponse(res.data.text);
        setMapsLinks(res.data.links || []);
      }
    } catch (err: any) {
      setMapsResponse("Failed to retrieve Google Maps grounded information.");
    } finally {
      setMapsLoading(false);
    }
  };

  // ----------------------------------------------------
  // 3. Audio Transcription State (gemini-3.5-transcribe)
  // ----------------------------------------------------
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());

        // Convert Blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(",")[1];
          setTranscribing(true);
          try {
            const res = await ApiController.geminiTranscribeAudio(base64Data, "audio/webm");
            if (res.success && res.data?.transcript) {
              setTranscribedText(res.data.transcript);
            }
          } catch (err) {
            setTranscribedText("Audio transcription error.");
          } finally {
            setTranscribing(false);
          }
        };
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      alert("Microphone access permission required for audio recording.");
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordTimerRef.current);
    }
  };

  // ----------------------------------------------------
  // 4. Live Voice Conversations (gemini-3.8-live)
  // ----------------------------------------------------
  const [voiceQuery, setVoiceQuery] = useState("");
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceReply, setVoiceReply] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const handleVoiceInteraction = async (promptText: string) => {
    if (!promptText.trim()) return;
    setVoiceLoading(true);
    setVoiceReply(null);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    try {
      const res = await ApiController.geminiLiveVoice(promptText);
      if (res.success && res.data) {
        setVoiceReply(res.data.replyText);

        if (res.data.audioBase64) {
          const audioUrl = `data:audio/wav;base64,${res.data.audioBase64}`;
          const audio = new Audio(audioUrl);
          audioElementRef.current = audio;
          audio.onended = () => setIsPlayingAudio(false);
          setIsPlayingAudio(true);
          audio.play().catch((e) => console.log("Audio autoplay prevented", e));
        } else if ("speechSynthesis" in window) {
          // Native browser speech fallback
          const utterance = new SpeechSynthesisUtterance(res.data.replyText.slice(0, 250));
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (err) {
      setVoiceReply("Live voice service error.");
    } finally {
      setVoiceLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>StartDomain</span>
            <span aria-hidden="true">·</span>
            <span>Gemini AI Suite</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-700">@google/genai TypeScript SDK</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            AI Tax Intelligence Suite
          </h2>
          <p className="text-sm text-slate-500">
            Conversational reasoning, Google Maps grounding, live voice, and audio transcription.
          </p>
        </div>

        {/* Feature Segmented Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveFeature("multiturn_chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg transition-colors ${
              activeFeature === "multiturn_chat"
                ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Multi-turn Chat</span>
          </button>

          <button
            onClick={() => setActiveFeature("live_voice")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg transition-colors ${
              activeFeature === "live_voice"
                ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-rose-600" />
            <span>gemini-3.8-live</span>
          </button>

          <button
            onClick={() => setActiveFeature("maps_grounding")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg transition-colors ${
              activeFeature === "maps_grounding"
                ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>Maps Grounding</span>
          </button>

          <button
            onClick={() => setActiveFeature("transcribe_audio")}
            className={`flex items-center gap-1.5 px-3 py-1.5 font-semibold rounded-lg transition-colors ${
              activeFeature === "transcribe_audio"
                ? "bg-white text-indigo-700 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileAudio className="w-3.5 h-3.5 text-purple-600" />
            <span>Audio Transcribe</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1. Multi-turn Chat Interface                         */}
      {/* ==================================================== */}
      {activeFeature === "multiturn_chat" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col h-[600px] bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Top Chat Subheader */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">Role:</span>
                <span className="font-mono text-indigo-700 font-bold">{systemRole}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                <span>Model:</span>
                <span className="font-bold text-slate-800">
                  {chatModelTier === "complex"
                    ? "gemini-3.1-pro-preview"
                    : chatModelTier === "general"
                    ? "gemini-3.5-flash"
                    : "gemini-3.1-flash-lite"}
                </span>
              </div>
            </div>

            {/* Scrollable Conversation Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "model" && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-none shadow-xs space-y-2"
                    }`}
                  >
                    {msg.role === "model" && msg.modelUsed && (
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-200/50 pb-1">
                        {msg.modelUsed}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div className="flex gap-3 items-center text-slate-500 text-xs animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <span>Reasoning with {chatModelTier.toUpperCase()} Gemini model...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendChat} className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about multi-tier tax liabilities, Wayfair economic nexus, or VAT rules..."
                className="flex-1 px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="p-2.5 text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Controls: Model Tier & Role Selector */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Gemini Model Tier
              </h3>
              <div className="space-y-2">
                {[
                  { id: "complex", name: "gemini-3.1-pro-preview", label: "Complex Tasks", desc: "Advanced reasoning, intricate tax laws" },
                  { id: "general", name: "gemini-3.5-flash", label: "General Tasks", desc: "Balanced speed and statutory depth" },
                  { id: "fast", name: "gemini-3.1-flash-lite", label: "Fast Tasks", desc: "Ultra-low latency quick lookups" }
                ].map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setChatModelTier(tier.id as any)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      chatModelTier === tier.id
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold"
                        : "border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{tier.label}</span>
                      <span className="text-[10px] font-mono text-slate-500">{tier.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5">{tier.desc}</p>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Chatbot Role Specialization
                </label>
                <select
                  value={systemRole}
                  onChange={(e) => setSystemRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                >
                  <option value="Chief Multi-Jurisdictional Tax Counsel">Chief Tax Counsel (Corporate)</option>
                  <option value="State Sales & Use Tax Nexus Auditor">State Sales & Use Tax Auditor</option>
                  <option value="European Union Cross-Border VAT Specialist">EU Cross-Border VAT Specialist</option>
                  <option value="Real-Time Distributed Financial Data Architect">Financial Data Systems Architect</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-xs text-indigo-900 space-y-1">
              <span className="font-bold">Multi-Turn Context Preservation:</span>
              <p className="text-[11px] text-indigo-700 leading-relaxed">
                Conversation state is maintained in memory across turns. Switch model tiers dynamically without losing context.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. Google Maps Grounding                            */}
      {/* ==================================================== */}
      {activeFeature === "maps_grounding" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Google Maps Grounding Engine
                </h3>
                <p className="text-xs text-slate-500">
                  Powered by <code>gemini-3.5-flash</code> with <code>googleMaps</code> tool
                </p>
              </div>
            </div>

            <form onSubmit={handleMapsSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Tax Authority / Jurisdiction Geographic Search
                </label>
                <textarea
                  rows={3}
                  value={mapsPrompt}
                  onChange={(e) => setMapsPrompt(e.target.value)}
                  placeholder="e.g. Where are the headquarters of the New York Department of Taxation and Finance?"
                  className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Sample Quick Searches */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  Preset Locations:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "California Department of Tax and Fee Administration HQ",
                    "New York State Tax Department Harriman Campus",
                    "London HM Revenue & Customs Westminster",
                    "Germany BZSt Federal Central Tax Office Bonn"
                  ].map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setMapsPrompt(preset)}
                      className="px-2.5 py-1 text-[11px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={mapsLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {mapsLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Querying Google Maps Grounding...</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-4 h-4" />
                    <span>Search with Google Maps Grounding</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col h-[520px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-2 border-b border-slate-100">
              Grounded Results & Official Map Links
            </h3>

            {mapsResponse ? (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {mapsResponse}
                </div>

                {mapsLinks.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                      Extracted Google Maps Grounding Links:
                    </span>
                    <div className="space-y-1.5">
                      {mapsLinks.map((link, idx) => (
                        <a
                          key={idx}
                          href={link.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 font-medium transition-colors group"
                        >
                          <span className="truncate">{link.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <MapPin className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-xs text-slate-500">
                  Search tax authority jurisdictions to retrieve Google Maps verified geographic addresses and interactive links.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. Live Voice Conversations (gemini-3.8-live)        */}
      {/* ==================================================== */}
      {activeFeature === "live_voice" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-3xl mx-auto space-y-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full text-rose-700 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>gemini-3.8-live Conversational Agent</span>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Real-Time Voice Tax Conversations
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Have natural voice dialogues with the Live API model and receive spoken auditory feedback in real time.
            </p>
          </div>

          {/* Quick Voice Prompt Buttons */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "What is California's combined sales tax rate for software?",
              "Explain economic nexus rules for remote sellers in New York",
              "How does cross-border reverse charge VAT work in Germany?"
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  setVoiceQuery(q);
                  handleVoiceInteraction(q);
                }}
                className="px-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-colors"
              >
                "{q}"
              </button>
            ))}
          </div>

          {/* Voice Input Field */}
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              value={voiceQuery}
              onChange={(e) => setVoiceQuery(e.target.value)}
              placeholder="Type or select a voice prompt..."
              className="w-full pl-4 pr-12 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
            <button
              onClick={() => handleVoiceInteraction(voiceQuery)}
              disabled={voiceLoading || !voiceQuery.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {voiceLoading && (
            <div className="flex items-center justify-center gap-2 text-rose-600 text-xs font-semibold animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Streaming conversational audio with gemini-3.8-live...</span>
            </div>
          )}

          {voiceReply && (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-800">Spoken Gemini Response</span>
                <span className="font-mono text-rose-600 text-[11px] font-semibold">gemini-3.8-live</span>
              </div>
              <p className="text-sm text-slate-800 leading-relaxed">{voiceReply}</p>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. Audio Transcription (gemini-3.5-transcribe)       */}
      {/* ==================================================== */}
      {activeFeature === "transcribe_audio" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5 text-center flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-purple-700 text-xs font-semibold mb-3">
                <FileAudio className="w-3.5 h-3.5" />
                <span>gemini-3.5-transcribe</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Microphone Audio Transcriber
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Record speech with your microphone and transcribe it using <code>gemini-3.5-transcribe</code>.
              </p>
            </div>

            {/* Microphone Record Center */}
            <div className="py-6 flex flex-col items-center justify-center space-y-4">
              <button
                type="button"
                onClick={isRecording ? stopAudioRecording : startAudioRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-rose-600 text-white shadow-xl shadow-rose-600/30 ring-4 ring-rose-400/40 animate-pulse"
                    : "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/30"
                }`}
              >
                {isRecording ? <Square className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </button>

              <div className="text-xs font-semibold text-slate-700">
                {isRecording ? (
                  <span className="text-rose-600 font-mono">Recording: {recordingSeconds}s · Click to Stop</span>
                ) : (
                  <span>Click microphone to begin recording</span>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono">
              Captures clean audio/webm and dispatches to Gemini Transcription engine.
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Transcribed Output
                </h3>
                {transcribedText && (
                  <button
                    onClick={() => navigator.clipboard.writeText(transcribedText)}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                )}
              </div>

              {transcribing ? (
                <div className="py-16 text-center text-purple-600 text-xs space-y-2 animate-pulse">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                  <span>Transcribing with gemini-3.5-transcribe...</span>
                </div>
              ) : transcribedText ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed font-mono mt-3">
                  {transcribedText}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Record audio on the left to see the generated statutory transcript here.
                </div>
              )}
            </div>

            {/* Quick Action: Send to Tax Engine */}
            {transcribedText && onExecuteTaxCalculation && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Use transcript in calculation:</span>
                <button
                  onClick={() => {
                    onExecuteTaxCalculation({
                      grossAmount: 50000,
                      destinationCountry: "US",
                      destinationRegion: "CA"
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  <span>Open in Tax Engine</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
