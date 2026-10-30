import React, { useState, useEffect, useRef } from "react";
import { AuthPanel } from "./modules/Auth/panel.tsx";
import { AuthSessionState } from "./modules/Auth/model.ts";
import { AuthController } from "./modules/Auth/controller.ts";
import { SessionLogsPanel } from "./modules/Auth/sessionLogsPanel.tsx";
import { TaxpayerWorkflowPanel, TaxpayerSubView } from "./modules/TaxpayerWorkflow/panel.tsx";
import { RatesMasterPanel, RateTab } from "./modules/RatesMaster/panel.tsx";
import { ArchitectureExplorerPanel } from "./modules/ArchitectureExplorer/panel.tsx";
import { TaxCalculationPanel } from "./modules/TaxCalculation/panel.tsx";
import { OverallCalculationPanel } from "./modules/TaxCalculation/OverallCalculationPanel.tsx";
import { AiAgentPanel } from "./modules/AiAgent/panel.tsx";
import { RealtimeSyncPanel } from "./modules/RealtimeSync/panel.tsx";
import { JurisdictionPanel } from "./modules/Jurisdiction/panel.tsx";
import { UserPanel } from "./modules/User/panel.tsx";
import { ReportsPanel } from "./modules/Reports/panel.tsx";
import { translations, SupportedLang, SupportedTheme } from "./utils/i18n.ts";
import { UserMenu } from "./components/UserMenu.tsx";
import { GlobalTaxpayerSearch } from "./components/GlobalTaxpayerSearch.tsx";
import { AiTaxChatbotModal } from "./components/AiTaxChatbotModal.tsx";
import { DbColumnLanguageModal } from "./components/DbColumnLanguageModal.tsx";
import { FlutterMobileAppSimulator } from "./components/FlutterMobileAppSimulator.tsx";
import { MunicipalDashboardPanel } from "./components/MunicipalDashboardPanel.tsx";
import {
  LayoutDashboard,
  Layers,
  Calculator,
  Bot,
  Mic,
  Radio,
  Smartphone,
  Globe,
  Users,
  FileSpreadsheet,
  Shield,
  Activity,
  Database,
  LogOut,
  Landmark,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Calendar,
  Building,
  Sliders,
  Settings
} from "lucide-react";

type NavigationTab =
  | "dashboard"
  | "taxpayer"
  | "rate"
  | "masters"
  | "calculation"
  | "rbac"
  | "architecture"
  | "tax_calc"
  | "ai_agent"
  | "realtime_sync"
  | "jurisdictions"
  | "users"
  | "reports"
  | "security_logs";

export default function App() {
  const [session, setSession] = useState<AuthSessionState | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>("dashboard");
  const [taxpayerSubView, setTaxpayerSubView] = useState<TaxpayerSubView>("overview");
  const [taxpayerSubMenuOpen, setTaxpayerSubMenuOpen] = useState(false);

  // Rate & Masters Navigation Submenus
  const [rateSubTab, setRateSubTab] = useState<RateTab>("land_rate");
  const [rateSubMenuOpen, setRateSubMenuOpen] = useState(false);
  const [mastersSubTab, setMastersSubTab] = useState<RateTab>("fiscal_year");
  const [mastersSubMenuOpen, setMastersSubMenuOpen] = useState(false);
  const [rbacSubTab, setRbacSubTab] = useState<RateTab>("company");
  const [rbacSubMenuOpen, setRbacSubMenuOpen] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global Taxpayer Selection & AI Chatbot State
  const [selectedTaxpayerId, setSelectedTaxpayerId] = useState<number>(1);
  const [openNewTaxpayerTrigger, setOpenNewTaxpayerTrigger] = useState<number>(0);
  const [isAiChatbotOpen, setIsAiChatbotOpen] = useState<boolean>(false);
  const [isDbColMapOpen, setIsDbColMapOpen] = useState<boolean>(false);
  const [isFlutterMobileOpen, setIsFlutterMobileOpen] = useState<boolean>(false);
  const [initialChatQuery, setInitialChatQuery] = useState<string>("");
  const [isHeaderVoiceListening, setIsHeaderVoiceListening] = useState<boolean>(false);
  const [headerVoiceNotice, setHeaderVoiceNotice] = useState<string | null>(null);
  const headerRecognitionRef = useRef<any>(null);

  // Theme & Language (Controlled via User Menu)
  const [currentLang, setCurrentLang] = useState<SupportedLang>("eng");
  const [currentTheme, setCurrentTheme] = useState<SupportedTheme>("slate");

  const t = translations[currentLang];

  // Speech synthesis feedback helper
  const speakAudio = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLang === "nep" ? "ne-NP" : currentLang === "ind" ? "hi-IN" : "en-US";
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS error", e);
    }
  };

  // Global voice command router
  const executeVoiceCommand = (command: string) => {
    const lower = command.toLowerCase().trim();

    // 1. "open taxpayer" / "taxpayer" -> opens taxpayer registration form and closes chat box
    if (
      lower.includes("open taxpayer") ||
      lower.includes("open tax payer") ||
      lower.includes("new taxpayer") ||
      lower.includes("taxpayer") ||
      lower.includes("नयाँ करदाता") ||
      lower.includes("करदाता")
    ) {
      setActiveTab("taxpayer");
      setTaxpayerSubView("overview");
      setOpenNewTaxpayerTrigger((p) => p + 1);
      setIsAiChatbotOpen(false);
      speakAudio("Opening taxpayer registration form.");
      setHeaderVoiceNotice("Opened Taxpayer Registration Form");
      setTimeout(() => setHeaderVoiceNotice(null), 3000);
      return;
    }

    // 2. "close chat" / "close assistant" -> closes chat box
    if (
      lower.includes("close chat") ||
      lower.includes("close assistant") ||
      lower.includes("close box") ||
      lower.includes("बन्द")
    ) {
      setIsAiChatbotOpen(false);
      speakAudio("Closing chat assistant.");
      setHeaderVoiceNotice("Closed Assistant");
      setTimeout(() => setHeaderVoiceNotice(null), 2500);
      return;
    }

    // 3. "open chat" / "open assistant"
    if (lower.includes("open chat") || lower.includes("open assistant")) {
      setInitialChatQuery("");
      setIsAiChatbotOpen(true);
      speakAudio("Opening AI Tax Assistant.");
      setHeaderVoiceNotice("Opened AI Tax Assistant");
      setTimeout(() => setHeaderVoiceNotice(null), 2500);
      return;
    }

    // 4. "list taxpayer today registered" -> opens chat and displays today's list
    if (
      lower.includes("list taxpayer") ||
      lower.includes("today registered") ||
      lower.includes("registered today") ||
      lower.includes("today's taxpayer")
    ) {
      setInitialChatQuery("list taxpayer today registered");
      setIsAiChatbotOpen(true);
      speakAudio("Listing taxpayers registered today.");
      setHeaderVoiceNotice("Showing Today's Registered Taxpayers");
      setTimeout(() => setHeaderVoiceNotice(null), 3000);
      return;
    }

    // 5. "add landrate 1 to land rate" -> opens chat and auto-inserts Land Rate
    if (
      (lower.includes("add") || lower.includes("insert") || lower.includes("create")) &&
      (lower.includes("landrate") || lower.includes("land rate") || lower.includes("जग्गा दर"))
    ) {
      setInitialChatQuery(command);
      setIsAiChatbotOpen(true);
      setHeaderVoiceNotice(`Auto-inserting: ${command}`);
      setTimeout(() => setHeaderVoiceNotice(null), 3000);
      return;
    }

    // Default: Dispatch query to AI Tax Assistant modal
    setInitialChatQuery(command);
    setIsAiChatbotOpen(true);
  };

  const handleToggleHeaderVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isHeaderVoiceListening) {
      try {
        headerRecognitionRef.current?.stop();
      } catch (e) {}
      setIsHeaderVoiceListening(false);
      setHeaderVoiceNotice(null);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = currentLang === "nep" ? "ne-NP" : currentLang === "ind" ? "hi-IN" : "en-US";

      recognition.onstart = () => {
        setIsHeaderVoiceListening(true);
        setHeaderVoiceNotice("Listening... speak now ('open taxpayer', 'list taxpayer today registered', 'add landrate 1', 'close chat')");
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        const clean = transcript.trim();
        if (clean) {
          executeVoiceCommand(clean);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn("Header speech recognition error", err);
        setIsHeaderVoiceListening(false);
        setHeaderVoiceNotice("Voice command failed. Please try again.");
        setTimeout(() => setHeaderVoiceNotice(null), 2500);
      };

      recognition.onend = () => {
        setIsHeaderVoiceListening(false);
      };

      headerRecognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Failed to start voice recognition", e);
      setIsHeaderVoiceListening(false);
    }
  };

  // Check saved session on mount
  useEffect(() => {
    const initSession = async () => {
      const active = await AuthController.checkActiveSession();
      if (active) {
        setSession(active);
      }
      setCheckingSession(false);
    };
    initSession();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await AuthController.logout(session?.user?.id as number);
    setSession(null);
    setLoggingOut(false);
  };

  // Theme styling resolver
  const themeClasses: Record<SupportedTheme, { bg: string; sidebarBg: string; text: string; cardBg: string; headerBg: string }> = {
    dark: {
      bg: "bg-slate-950 text-slate-100",
      sidebarBg: "bg-slate-900 border-slate-800 text-slate-100",
      text: "text-slate-100",
      cardBg: "bg-slate-900 border-slate-800",
      headerBg: "bg-slate-900/90 border-slate-800"
    },
    slate: {
      bg: "bg-slate-50 text-slate-900",
      sidebarBg: "bg-slate-900 border-slate-800 text-white",
      text: "text-slate-900",
      cardBg: "bg-white border-slate-200",
      headerBg: "bg-white/90 border-slate-200"
    },
    emerald: {
      bg: "bg-emerald-950/20 text-slate-900",
      sidebarBg: "bg-emerald-950 border-emerald-900 text-white",
      text: "text-slate-900",
      cardBg: "bg-white border-emerald-100",
      headerBg: "bg-white/90 border-emerald-200"
    },
    light: {
      bg: "bg-zinc-50 text-zinc-900",
      sidebarBg: "bg-white border-zinc-200 text-zinc-900",
      text: "text-zinc-900",
      cardBg: "bg-white border-zinc-200",
      headerBg: "bg-white/90 border-zinc-200"
    }
  };

  const themeStyle = themeClasses[currentTheme];

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500 animate-spin" />
          <span>Verifying gtax session and database security credentials...</span>
        </div>
      </div>
    );
  }

  // Creative Login Screen if not authenticated
  if (!session || !session.isAuthenticated) {
    return <AuthPanel onLoginSuccess={(newSession) => setSession(newSession)} />;
  }

  return (
    <div className={`min-h-screen flex font-sans ${themeStyle.bg} selection:bg-indigo-500 selection:text-white`}>
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex flex-col justify-between p-3.5 border-r transition-transform duration-200 ${
          themeStyle.sidebarBg
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="space-y-3.5 overflow-y-auto pr-1 no-scrollbar">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-600/30">
                G
              </div>
              <div>
                <h1 className="font-black text-sm tracking-tight leading-none text-white">
                  Gtax Enterprise
                </h1>
                <p className="text-[10px] font-mono text-indigo-300 mt-1">
                  Municipal Tax Hub
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items - 5 Core Hubs with Middle-Sized Icons (w-5 h-5) */}
          <nav className="space-y-1.5 text-xs">
            {/* 1. Dashboard */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 font-bold rounded-xl transition-all ${
                  activeTab === "dashboard"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "hover:bg-white/5 text-slate-300"
                }`}
              >
                <LayoutDashboard className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="text-sm">Dashboard</span>
              </button>
            </div>

            {/* 2. Taxpayer */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("taxpayer");
                  setTaxpayerSubMenuOpen(!taxpayerSubMenuOpen);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 font-bold rounded-xl transition-all ${
                  activeTab === "taxpayer"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "hover:bg-white/5 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-sm">Taxpayer</span>
                </div>
                {taxpayerSubMenuOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {taxpayerSubMenuOpen && (
                <div className="pl-4 pt-1 space-y-1">
                  <button
                    onClick={() => {
                      setActiveTab("taxpayer");
                      setTaxpayerSubView("overview");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === "taxpayer" && taxpayerSubView === "overview"
                        ? "bg-white/15 text-white font-bold"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>Registry & Dossier</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("taxpayer");
                      setTaxpayerSubView("multi_year_calc");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === "taxpayer" && taxpayerSubView === "multi_year_calc"
                        ? "bg-white/15 text-white font-bold"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>Multi-Year Engine</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Calculation */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("calculation");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 font-bold rounded-xl transition-all ${
                  activeTab === "calculation"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "hover:bg-white/5 text-slate-300"
                }`}
              >
                <Calculator className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-sm">Calculation</span>
              </button>
            </div>

            {/* 4. Master */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("masters");
                  setMastersSubMenuOpen(!mastersSubMenuOpen);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 font-bold rounded-xl transition-all ${
                  activeTab === "masters" || activeTab === "rate"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "hover:bg-white/5 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sliders className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span className="text-sm">Master</span>
                </div>
                {mastersSubMenuOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {mastersSubMenuOpen && (
                <div className="pl-4 pt-1 space-y-1">
                  <button
                    onClick={() => {
                      setActiveTab("rate");
                      setRateSubTab("land_rate");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === "rate"
                        ? "bg-white/15 text-white font-bold"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Rate Masters</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("masters");
                      setMastersSubTab("fiscal_year");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === "masters" && mastersSubTab === "fiscal_year"
                        ? "bg-white/15 text-white font-bold"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span>Fiscal Year</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("masters");
                      setMastersSubTab("construction_type");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === "masters" && mastersSubTab === "construction_type"
                        ? "bg-white/15 text-white font-bold"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Building className="w-4 h-4 text-purple-400" />
                    <span>Construction Types</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("masters");
                      setMastersSubTab("unit");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === "masters" && mastersSubTab === "unit"
                        ? "bg-white/15 text-white font-bold"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span>Measurement Unit</span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. User */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("users");
                  setRbacSubMenuOpen(!rbacSubMenuOpen);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 font-bold rounded-xl transition-all ${
                  activeTab === "users" || activeTab === "rbac" || activeTab === "security_logs"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "hover:bg-white/5 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-rose-400 shrink-0" />
                  <span className="text-sm">User</span>
                </div>
                {rbacSubMenuOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {rbacSubMenuOpen && (
                <div className="pl-4 pt-1 space-y-1">
                  <button
                    onClick={() => {
                      setActiveTab("users");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === "users"
                        ? "bg-white/15 text-white font-bold"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span>Users & Roles</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("rbac");
                      setRbacSubTab("company");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === "rbac" && rbacSubTab === "company"
                        ? "bg-white/15 text-white font-bold"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Landmark className="w-4 h-4 text-amber-400" />
                    <span>Company Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("security_logs");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === "security_logs"
                        ? "bg-white/15 text-white font-bold"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Activity className="w-4 h-4 text-rose-400" />
                    <span>Audit Logs</span>
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>



        {/* Clean Sidebar Footer */}
        <div className="pt-2 border-t border-white/10">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? "Logging out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar with Global Taxpayer Search, AI Assistant, and UserMenu */}
        <header className={`sticky top-0 z-30 px-3 sm:px-6 py-2.5 border-b flex items-center justify-between gap-3 backdrop-blur-md ${themeStyle.headerBg}`}>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">Gtax Municipal</span>
                <span className="hidden sm:inline-block text-slate-400 dark:text-slate-600 text-xs">/</span>
                <span className="text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 capitalize truncate max-w-[120px] sm:max-w-none">
                  {activeTab === "dashboard" ? "Municipal Dashboard" : activeTab === "taxpayer" ? `Taxpayer > ${taxpayerSubView}` : activeTab === "calculation" ? "Frontend & Manual Calculation Window" : activeTab === "masters" ? "System Masters" : activeTab === "rate" ? "Rate Masters" : activeTab === "users" ? "Users & RBAC" : activeTab}
                </span>
              </div>
              <div className="hidden md:flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {/* <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span> */}
                {/* <span>PostgreSQL DB Active · Multi-Jurisdiction Engine</span> */}
              </div>
            </div>
          </div>

          {/* Global Taxpayer Search Bar (Name or Citizen / PAN ID) */}
          <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-1 sm:mx-3">
            <GlobalTaxpayerSearch
              currentLang={currentLang}
              onSelectTaxpayer={(id) => {
                setActiveTab("taxpayer");
                setTaxpayerSubView("overview");
                setSelectedTaxpayerId(id);
              }}
              onOpenNewTaxpayerModal={() => {
                setActiveTab("taxpayer");
                setTaxpayerSubView("overview");
                setOpenNewTaxpayerTrigger((prev) => prev + 1);
              }}
            />
          </div>

          {/* Right Header Actions: Mic Voice Command + Icon-Only AI Assistant + Icon-Only Mobile App + User Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Voice Command - Icon Only */}
            <button
              onClick={handleToggleHeaderVoice}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all flex items-center justify-center group ${
                isHeaderVoiceListening
                  ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/30 animate-pulse"
                  : "bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
              }`}
              title={isHeaderVoiceListening ? "Listening... click to stop" : "Voice Command (Say 'open taxpayer', 'list taxpayer today registered', 'add landrate 1', 'close chat')"}
              aria-label="Voice Command"
            >
              <Mic className={`w-4 h-4 ${isHeaderVoiceListening ? "text-white animate-bounce" : "text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform"}`} />
            </button>

            {/* AI Assistant - Icon Only */}
            <button
              onClick={() => {
                setInitialChatQuery("");
                setIsAiChatbotOpen(true);
              }}
              className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white shadow-xs transition-all border border-indigo-400/30 flex items-center justify-center group"
              title="AI Tax Assistant (Voice & Text)"
              aria-label="AI Tax Assistant"
            >
              <Bot className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform animate-pulse" />
            </button>

            {/* Mobile App - Icon Only */}
            <button
              onClick={() => setIsFlutterMobileOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs border border-blue-500/30 transition-all flex items-center justify-center group"
              title="Mobile App (Flutter iOS & Android Deployment Hub)"
              aria-label="Mobile App Deployment Hub"
            >
              <Smartphone className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            </button>

            <UserMenu
              session={session}
              currentLang={currentLang}
              currentTheme={currentTheme}
              onLanguageChange={(lang) => setCurrentLang(lang)}
              onThemeChange={(theme) => setCurrentTheme(theme)}
              onLogout={handleLogout}
              loggingOut={loggingOut}
              onOpenDbColumnModal={() => setIsDbColMapOpen(true)}
            />
          </div>
        </header>

        {/* Main Panel Content Render Area */}
        <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === "dashboard" && (
            <MunicipalDashboardPanel
              onNavigate={(tab) => {
                setActiveTab(tab as any);
              }}
              onOpenNewTaxpayer={() => {
                setActiveTab("taxpayer");
                setTaxpayerSubView("overview");
                setOpenNewTaxpayerTrigger((prev) => prev + 1);
              }}
              currentLang={currentLang}
            />
          )}

          {activeTab === "taxpayer" && (
            <TaxpayerWorkflowPanel
              initialSubView={taxpayerSubView}
              selectedTaxpayerIdProp={selectedTaxpayerId}
              openNewTaxpayerTrigger={openNewTaxpayerTrigger}
              currentLang={currentLang}
            />
          )}

          {activeTab === "rate" && (
            <RatesMasterPanel
              currentLang={currentLang}
              initialTab={rateSubTab}
              filterGroup="rate"
            />
          )}

          {activeTab === "masters" && (
            <RatesMasterPanel
              currentLang={currentLang}
              initialTab={mastersSubTab}
              filterGroup="masters"
            />
          )}

          {/* CALCULATION WINDOW WITH FULL FRONTEND AND MANUAL CALCULATION DETAILS */}
          {activeTab === "calculation" && <OverallCalculationPanel />}

          {activeTab === "tax_calc" && <TaxCalculationPanel />}
          {activeTab === "reports" && <ReportsPanel />}
          {activeTab === "architecture" && <ArchitectureExplorerPanel />}
          {activeTab === "ai_agent" && <AiAgentPanel />}
          {activeTab === "realtime_sync" && <RealtimeSyncPanel />}
          {activeTab === "jurisdictions" && <JurisdictionPanel />}
          {activeTab === "users" && <UserPanel />}
          {activeTab === "security_logs" && <SessionLogsPanel />}
          {activeTab === "rbac" && (
            <RatesMasterPanel
              currentLang={currentLang}
              initialTab={rbacSubTab}
              filterGroup="rbac"
            />
          )}
        </main>
      </div>



      {/* Floating Voice Command Status Pill */}
      {headerVoiceNotice && (
        <div className="fixed top-14 sm:top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white border border-indigo-500/40 px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top duration-200">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <Mic className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-medium">{headerVoiceNotice}</span>
          <button
            onClick={() => setHeaderVoiceNotice(null)}
            className="ml-2 text-slate-400 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* AI Tax Chatbot Modal */}
      <AiTaxChatbotModal
        isOpen={isAiChatbotOpen}
        onClose={() => {
          setIsAiChatbotOpen(false);
          setInitialChatQuery("");
        }}
        currentLang={currentLang}
        initialQuery={initialChatQuery}
        onOpenNewTaxpayer={() => {
          setActiveTab("taxpayer");
          setTaxpayerSubView("overview");
          setOpenNewTaxpayerTrigger((prev) => prev + 1);
        }}
        onSelectTaxpayer={(id) => {
          setActiveTab("taxpayer");
          setTaxpayerSubView("overview");
          setSelectedTaxpayerId(id);
        }}
        onOpenMultiYearTaxCalc={() => {
          setActiveTab("taxpayer");
          setTaxpayerSubView("multi_year_calc");
        }}
        onOpenRatesMaster={(subTab) => {
          setActiveTab("rate");
          if (subTab) {
            setRateSubTab(subTab as any);
          }
        }}
      />

      {/* Database Column Language Mapping Modal (JSON Auto-reflection) */}
      <DbColumnLanguageModal
        isOpen={isDbColMapOpen}
        onClose={() => setIsDbColMapOpen(false)}
        currentLang={currentLang}
        onLanguageChange={(lang) => setCurrentLang(lang)}
      />

      {/* Flutter Mobile App (iOS & Android) Simulator & Deployment Modal */}
      <FlutterMobileAppSimulator
        isOpen={isFlutterMobileOpen}
        onClose={() => setIsFlutterMobileOpen(false)}
        lang={currentLang}
      />
    </div>
  );
}
