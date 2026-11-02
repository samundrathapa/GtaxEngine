import React, { useState, useEffect, useRef, useCallback } from "react";
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
import { DbStatusModal, DbStatusData } from "./components/DbStatusModal.tsx";
import { PrivacyPolicyPage } from "./components/PrivacyPolicyPage.tsx";
import { useIdleSessionTimeout } from "./hooks/useIdleSessionTimeout.ts";
import { IdleSessionWarningModal } from "./components/IdleSessionWarningModal.tsx";
import { ApiController } from "./api/controller.ts";
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
  ChevronLeft,
  DollarSign,
  Calendar,
  Building,
  Sliders,
  Settings,
  TrendingUp
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
  | "security_logs"
  | "privacy";

const parseRouteFromLocation = (): {
  tab: NavigationTab;
  subView?: TaxpayerSubView;
  calculationTab?: "calculator" | "multi_year" | "history" | "comparison";
  rateTab?: RateTab;
  mastersTab?: RateTab;
  rbacTab?: RateTab;
} => {
  try {
    // 0. Check pathname for direct /privacy or /privacypage or /terms routes
    const pathname = window.location.pathname.toLowerCase().trim();
    if (
      pathname === "/privacy" ||
      pathname === "/privacypage" ||
      pathname === "/privacy-policy" ||
      pathname === "/terms" ||
      pathname === "/terms-of-service"
    ) {
      return { tab: "privacy" };
    }

    // 1. Try URL hash e.g. #/calculation, #/taxpayer, #/privacy, #/privacypage
    const hash = window.location.hash.replace(/^#\/?/, "").toLowerCase().trim();
    if (hash) {
      const parts = hash.split("/").map((p) => p.trim());
      const mainSegment = parts[0];
      if (
        mainSegment === "privacy" ||
        mainSegment === "privacypage" ||
        mainSegment === "privacy-policy" ||
        mainSegment === "terms"
      ) {
        return { tab: "privacy" };
      }
      const validTabs: NavigationTab[] = [
        "dashboard",
        "taxpayer",
        "calculation",
        "rate",
        "masters",
        "rbac",
        "architecture",
        "tax_calc",
        "ai_agent",
        "realtime_sync",
        "jurisdictions",
        "users",
        "reports",
        "security_logs",
        "privacy"
      ];
      if (validTabs.includes(mainSegment as NavigationTab)) {
        const result: any = { tab: mainSegment as NavigationTab };
        if (mainSegment === "taxpayer") {
          result.subView = "overview";
        }
        if (mainSegment === "calculation" && parts[1]) {
          result.calculationTab = parts[1] === "multi_year" ? "multi_year" : "calculator";
        }
        if (mainSegment === "masters" && parts[1]) {
          result.mastersTab = parts[1] as RateTab;
        }
        if (mainSegment === "rate" && parts[1]) {
          result.rateTab = parts[1] as RateTab;
        }
        if (mainSegment === "rbac" && parts[1]) {
          result.rbacTab = parts[1] as RateTab;
        }
        return result;
      }
    }

    // 2. Try URL search params e.g. ?tab=calculation or ?page=privacy
    const params = new URLSearchParams(window.location.search);
    const paramTab = params.get("tab")?.toLowerCase().trim();
    const paramPage = params.get("page")?.toLowerCase().trim();
    if (
      paramTab === "privacy" ||
      paramTab === "privacypage" ||
      paramPage === "privacy" ||
      paramPage === "privacypage"
    ) {
      return { tab: "privacy" };
    }
    if (paramTab) {
      return { tab: paramTab as NavigationTab };
    }

    // 3. Fallback to localStorage e.g. "gtax_active_tab"
    const saved = localStorage.getItem("gtax_active_tab")?.toLowerCase().trim();
    if (saved) {
      const savedCalcTab = localStorage.getItem("gtax_calculation_tab") as any;
      return {
        tab: saved as NavigationTab,
        subView: "overview",
        calculationTab: savedCalcTab || "calculator"
      };
    }
  } catch (err) {
    console.warn("Routing parse error:", err);
  }

  return { tab: "dashboard" };
};

export default function App() {
  const initialRoute = parseRouteFromLocation();
  const [session, setSession] = useState<AuthSessionState | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>(initialRoute.tab);
  const [taxpayerSubView, setTaxpayerSubView] = useState<TaxpayerSubView>(initialRoute.subView || "overview");
  const [calculationTab, setCalculationTab] = useState<"calculator" | "multi_year" | "history" | "comparison">(initialRoute.calculationTab || "calculator");
  const [calculationSubMenuOpen, setCalculationSubMenuOpen] = useState(initialRoute.tab === "calculation");

  // Rate & Masters Navigation Submenus
  const [rateSubTab, setRateSubTab] = useState<RateTab>(initialRoute.rateTab || "land_rate");
  const [rateSubMenuOpen, setRateSubMenuOpen] = useState(initialRoute.tab === "rate");
  const [mastersSubTab, setMastersSubTab] = useState<RateTab>(initialRoute.mastersTab || "fiscal_year");
  const [mastersSubMenuOpen, setMastersSubMenuOpen] = useState(initialRoute.tab === "masters");
  const [rbacSubTab, setRbacSubTab] = useState<RateTab>(initialRoute.rbacTab || "company");
  const [rbacSubMenuOpen, setRbacSubMenuOpen] = useState(initialRoute.tab === "users" || initialRoute.tab === "rbac");

  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const handleToggleNavigation = () => {
    if (window.innerWidth >= 1024) {
      setIsSidebarCollapsed((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  // Synchronize route to URL hash and localStorage whenever activeTab or subviews change
  useEffect(() => {
    try {
      let hashString = `#/${activeTab}`;
      if (activeTab === "calculation" && calculationTab) {
        hashString = `#/${activeTab}/${calculationTab}`;
      } else if (activeTab === "masters" && mastersSubTab) {
        hashString = `#/${activeTab}/${mastersSubTab}`;
      } else if (activeTab === "rate" && rateSubTab) {
        hashString = `#/${activeTab}/${rateSubTab}`;
      } else if (activeTab === "rbac" && rbacSubTab) {
        hashString = `#/${activeTab}/${rbacSubTab}`;
      }

      if (window.location.hash !== hashString) {
        window.history.replaceState(null, "", hashString);
      }
      localStorage.setItem("gtax_active_tab", activeTab);
      if (activeTab === "calculation") {
        localStorage.setItem("gtax_calculation_tab", calculationTab);
      }
    } catch (_) {}
  }, [activeTab, taxpayerSubView, mastersSubTab, rateSubTab, rbacSubTab, calculationTab]);

  // Handle browser back/forward buttons and external hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const route = parseRouteFromLocation();
      if (route.tab && route.tab !== activeTab) {
        setActiveTab(route.tab);
      }
      if (route.calculationTab && route.calculationTab !== calculationTab) {
        setCalculationTab(route.calculationTab);
      }
      if (route.subView && route.subView !== taxpayerSubView) {
        setTaxpayerSubView(route.subView);
      }
      if (route.mastersTab && route.mastersTab !== mastersSubTab) {
        setMastersSubTab(route.mastersTab);
      }
      if (route.rateTab && route.rateTab !== rateSubTab) {
        setRateSubTab(route.rateTab);
      }
      if (route.rbacTab && route.rbacTab !== rbacSubTab) {
        setRbacSubTab(route.rbacTab);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, [activeTab, taxpayerSubView, mastersSubTab, rateSubTab, rbacSubTab]);

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

  // Live PostgreSQL Database Connection Inspector State
  const [dbStatus, setDbStatus] = useState<DbStatusData | null>(null);
  const [isDbStatusModalOpen, setIsDbStatusModalOpen] = useState<boolean>(false);

  const fetchDbStatus = async () => {
    try {
      const res = await fetch("/api/v1/db/status");
      const json = await res.json();
      if (json && json.data) {
        setDbStatus(json.data);
      }
    } catch (e) {
      console.warn("Failed to fetch database status:", e);
    }
  };

  useEffect(() => {
    fetchDbStatus();
    const interval = setInterval(fetchDbStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // Theme & Language (Controlled via User Menu)
  const [currentLang, setCurrentLang] = useState<SupportedLang>("eng");
  const [currentTheme, setCurrentTheme] = useState<SupportedTheme>("slate");

  // Global Dynamic Active Fiscal Year State (Derived from application_settings & tbl_fiscal_year)
  const [activeFiscalYearCode, setActiveFiscalYearCode] = useState<string>(() => {
    return localStorage.getItem("gtax_active_fy_code") || "2081/82";
  });
  const [activeFiscalYearId, setActiveFiscalYearId] = useState<number>(() => {
    const saved = localStorage.getItem("gtax_active_fy_id");
    return saved ? Number(saved) : 2;
  });

  const fetchActiveFiscalYear = async () => {
    try {
      const res = await ApiController.getPropertyMasters();
      if (res.success && res.data) {
        const appSetting = res.data.applicationSettings?.[0];
        const fyId = appSetting?.fiscal_year_id;
        const fys = res.data.fiscalYears || [];
        const matchedFy = (fyId ? fys.find((f: any) => f.id === fyId) : null)
          || fys.find((f: any) => f.is_active)
          || fys[0];

        if (matchedFy) {
          setActiveFiscalYearCode(matchedFy.code);
          setActiveFiscalYearId(matchedFy.id);
          localStorage.setItem("gtax_active_fy_code", matchedFy.code);
          localStorage.setItem("gtax_active_fy_id", String(matchedFy.id));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch active fiscal year in App:", err);
    }
  };

  useEffect(() => {
    fetchActiveFiscalYear();

    const handleFyUpdate = (e?: any) => {
      if (e?.detail?.fiscalYearCode) {
        setActiveFiscalYearCode(e.detail.fiscalYearCode);
      }
      if (e?.detail?.fiscal_year_id) {
        setActiveFiscalYearId(Number(e.detail.fiscal_year_id));
      }
      fetchActiveFiscalYear();
    };

    window.addEventListener("gtax:rates_updated", handleFyUpdate);
    window.addEventListener("gtax:active_fy_changed", handleFyUpdate);

    return () => {
      window.removeEventListener("gtax:rates_updated", handleFyUpdate);
      window.removeEventListener("gtax:active_fy_changed", handleFyUpdate);
    };
  }, []);

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
    if (session?.user?.id) {
      await AuthController.logout(session.user.id as number);
    }
    setSession(null);
    setLoggingOut(false);
  };

  const handleIdleTimeout = useCallback(async () => {
    localStorage.setItem("gtax_logout_reason", "idle_timeout");
    if (session?.user?.id) {
      await AuthController.logout(session.user.id as number);
    }
    setSession(null);
  }, [session]);

  const {
    isWarningOpen: isIdleWarningOpen,
    secondsRemaining: idleSecondsRemaining,
    timeoutMinutes: idleTimeoutMinutes,
    resetTimer: resetIdleTimer
  } = useIdleSessionTimeout({
    onTimeout: handleIdleTimeout,
    enabled: Boolean(session && session.isAuthenticated),
    warningSeconds: 60
  });

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

  // Public Privacy Policy & Terms of Service View (accessible with or without authentication)
  if (activeTab === "privacy") {
    return (
      <PrivacyPolicyPage
        isAuthenticated={Boolean(session && session.isAuthenticated)}
        onBackToApp={() => {
          if (session && session.isAuthenticated) {
            setActiveTab("dashboard");
            window.location.hash = "#/dashboard";
          } else {
            setActiveTab("dashboard");
            window.location.hash = "";
            if (window.location.pathname === "/privacy" || window.location.pathname === "/privacypage") {
              window.history.pushState(null, "", "/");
            }
          }
        }}
      />
    );
  }

  // Creative Login Screen if not authenticated
  if (!session || !session.isAuthenticated) {
    return (
      <AuthPanel
        onLoginSuccess={(newSession) => setSession(newSession)}
        onOpenPrivacy={() => {
          setActiveTab("privacy");
          window.location.hash = "#/privacy";
        }}
      />
    );
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
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col justify-between border-r transition-all duration-300 ease-in-out ${
          themeStyle.sidebarBg
        } ${
          sidebarOpen
            ? "translate-x-0 w-64 p-3.5 shadow-2xl"
            : isSidebarCollapsed
            ? "-translate-x-full lg:-translate-x-full w-0 p-0 overflow-hidden border-none pointer-events-none"
            : "-translate-x-full lg:translate-x-0 w-64 p-3.5"
        }`}
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

            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              title="Close navigation menu"
              aria-label="Close menu"
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

            {/* 2. Taxpayer (Direct Register & Dossier Hub) */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("taxpayer");
                  setTaxpayerSubView("overview");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 font-bold rounded-xl transition-all ${
                  activeTab === "taxpayer"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "hover:bg-white/5 text-slate-300"
                }`}
              >
                <Users className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="text-sm">Taxpayer</span>
              </button>
            </div>

            {/* 3. Calculation (Calculation Studio & Multi-Year Engine) */}
            <div>
              <button
                onClick={() => {
                  setActiveTab("calculation");
                  setCalculationSubMenuOpen(!calculationSubMenuOpen);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 font-bold rounded-xl transition-all ${
                  activeTab === "calculation"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "hover:bg-white/5 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calculator className="w-5 h-5 text-amber-400 shrink-0" />
                  <span className="text-sm">Calculation</span>
                </div>
                {calculationSubMenuOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {calculationSubMenuOpen && (
                <div className="pl-4 pt-1 space-y-1">
                  <button
                    onClick={() => {
                      setActiveTab("calculation");
                      setCalculationTab("calculator");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === "calculation" && calculationTab === "calculator"
                        ? "bg-white/15 text-white font-bold shadow-xs"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Calculator className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Calculation Studio</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab("calculation");
                      setCalculationTab("multi_year");
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === "calculation" && calculationTab === "multi_year"
                        ? "bg-white/15 text-white font-bold shadow-xs"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Multi-Year Engine</span>
                  </button>
                </div>
              )}
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

                  {/* <button
                    onClick={() => {
                      setActiveTab("privacy");
                      setSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Privacy Policy</span>
                  </button> */}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Clean Sidebar Footer with Idle Session Timeout info */}
        <div className="pt-2 border-t border-white/10 space-y-1.5">
          {/* <div className="flex items-center justify-between px-1 text-[10px] text-slate-400">
            <span className="font-mono">Timeout: {idleTimeoutMinutes}m</span>
            <button
              onClick={() => {
                setActiveTab("privacy");
                setSidebarOpen(false);
              }}
              className="text-indigo-400 hover:text-white underline cursor-pointer"
            >
              Privacy Policy
            </button>
          </div> */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{loggingOut ? "Logging out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar with Global Taxpayer Search, AI Assistant, DB Status Chip, and UserMenu */}
        <header className={`sticky top-0 z-30 px-[3px] sm:px-3 py-1.5 sm:py-2 border-b flex items-center justify-between gap-2 sm:gap-3 backdrop-blur-md ${themeStyle.headerBg}`}>
          <div className="flex items-center gap-2 shrink-0">
            {/* Navigation Menu Button (on click hides / shows sidebar) */}
            <button
              onClick={handleToggleNavigation}
              className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center shadow-2xs"
              title="Navigation Menu"
              aria-label="Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              {/* <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight">Gtax Municipal</span>
                <span className="hidden sm:inline-block text-slate-400 dark:text-slate-600 text-xs">/</span>
                <span className="text-[11px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400 capitalize truncate max-w-[120px] sm:max-w-none">
                  {activeTab === "dashboard" ? "Municipal Dashboard" : activeTab === "taxpayer" ? `Taxpayer > ${taxpayerSubView}` : activeTab === "calculation" ? "Frontend & Manual Calculation Window" : activeTab === "masters" ? "System Masters" : activeTab === "rate" ? "Rate Masters" : activeTab === "users" ? "Users & RBAC" : activeTab}
                </span>
              </div> */}
            </div>

            {/* Active Fiscal Year Topbar Display Pill */}
            <button
              onClick={() => {
                setActiveTab("masters");
                setMastersSubTab("application_setting");
              }}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 font-semibold text-xs shadow-2xs transition-all group shrink-0 cursor-pointer"
              title={`Active Fiscal Year: FY ${activeFiscalYearCode} BS (Click to modify in Application Settings)`}
              aria-label="Active Fiscal Year"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="font-mono font-bold text-[11px] sm:text-xs tracking-tight">
                FY {activeFiscalYearCode} BS
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-200/70 dark:bg-indigo-800/70 text-indigo-800 dark:text-indigo-200">
                Active
              </span>
            </button>
          </div>

          {/* Global Taxpayer Search Bar (Name or Citizen / PAN ID) */}
          <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-1 sm:mx-2">
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

          {/* Right Header Actions: Live DB Status Chip + Voice + AI Assistant + Mobile App + User Menu */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Mobile Compact Active Fiscal Year Badge */}
            <button
              onClick={() => {
                setActiveTab("masters");
                setMastersSubTab("application_setting");
              }}
              className="md:hidden flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-bold shadow-2xs"
              title={`Active Fiscal Year: FY ${activeFiscalYearCode} BS (Click to modify in settings)`}
            >
              <Calendar className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>FY {activeFiscalYearCode}</span>
            </button>
            {/* Live DB Connection Badge / Inspector Button */}
            {/* <button
              onClick={() => setIsDbStatusModalOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs group"
              title={`PostgreSQL Database: ${dbStatus?.user || "gtax_user"}@${dbStatus?.host || "127.0.0.1"}:${dbStatus?.port || 5432}/${dbStatus?.database || "gtax_db"} (${dbStatus?.connected ? "Live Connected" : "Disconnected"}). Click to inspect exact parameters & test connection.`}
              aria-label="Database Status Inspector"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${dbStatus?.connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              <Database className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
              <span className="hidden xl:inline font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {dbStatus ? `${dbStatus.user}@${dbStatus.host}:${dbStatus.port}/${dbStatus.database}` : "DB Connecting..."}
              </span>
              <span className="xl:hidden font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {dbStatus?.database || "DB"}
              </span>
            </button> */}

            {/* Quick Voice Command - Icon Only */}
            <button
              onClick={handleToggleHeaderVoice}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all flex items-center justify-center group ${
                isHeaderVoiceListening
                  ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/30 animate-pulse"
                  : "bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
              }`}
              title={isHeaderVoiceListening ? "Listening... click to stop" : "Voice Command"}
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
              className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white shadow-xs transition-all border border-indigo-400/30 flex items-center justify-center group"
              title="AI Tax Assistant (Voice & Text)"
              aria-label="AI Tax Assistant"
            >
              <Bot className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform animate-pulse" />
            </button>

            {/* Mobile App - Icon Only */}
            <button
              onClick={() => setIsFlutterMobileOpen(true)}
              className="p-1.5 sm:p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs border border-blue-500/30 transition-all flex items-center justify-center group"
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
              onOpenPrivacy={() => {
                setActiveTab("privacy");
                window.location.hash = "#/privacy";
              }}
            />
          </div>
        </header>

        {/* Main Panel Content Render Area - exactly 3px edge fit with zero horizontal gaps */}
        <main className="flex-1 p-[3px] w-full min-w-0">
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
              activeFiscalYearCode={activeFiscalYearCode}
              activeFiscalYearId={activeFiscalYearId}
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
          {activeTab === "calculation" && (
            <OverallCalculationPanel
              initialTab={calculationTab}
              onTabChange={(tab) => setCalculationTab(tab)}
              selectedTaxpayerIdProp={selectedTaxpayerId}
            />
          )}

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
          setActiveTab("calculation");
          setCalculationTab("multi_year");
          setCalculationSubMenuOpen(true);
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

      {/* Database Connection & Health Inspector Modal */}
      <DbStatusModal
        isOpen={isDbStatusModalOpen}
        onClose={() => setIsDbStatusModalOpen(false)}
        status={dbStatus}
        onRefresh={fetchDbStatus}
      />

      {/* Inactivity & Idle Session Warning Modal */}
      <IdleSessionWarningModal
        isOpen={isIdleWarningOpen}
        secondsRemaining={idleSecondsRemaining}
        timeoutMinutes={idleTimeoutMinutes}
        onStayLoggedIn={resetIdleTimer}
        onLogoutNow={handleLogout}
      />
    </div>
  );
}
