import React, { useState, useEffect, useRef, useCallback } from "react";
import { AuthPanel } from "./modules/Auth/panel.tsx";
import { AuthSessionState } from "./modules/Auth/model.ts";
import { AuthController } from "./modules/Auth/controller.ts";
import { SessionLogsPanel } from "./modules/Auth/sessionLogsPanel.tsx";
import { AuditLogsPanel } from "./clientside/AuditLogs/AuditLogsPanel.tsx";
import { TaxpayerWorkflowPanel, TaxpayerSubView } from "./modules/TaxpayerWorkflow/panel.tsx";
import { NewTaxpayerPanel } from "./modules/TaxpayerWorkflow/NewTaxpayerPanel.tsx";
import { RatesMasterPanel, RateTab } from "./modules/RatesMaster/panel.tsx";
import { ArchitectureExplorerPanel } from "./modules/ArchitectureExplorer/panel.tsx";
import { TaxCalculationPanel } from "./modules/TaxCalculation/panel.tsx";
import { OverallCalculationPanel } from "./modules/TaxCalculation/OverallCalculationPanel.tsx";
import { AiAgentPanel } from "./modules/AiAgent/panel.tsx";
import { RealtimeSyncPanel } from "./modules/RealtimeSync/panel.tsx";
import { JurisdictionPanel } from "./modules/Jurisdiction/panel.tsx";
import { UserPanel } from "./modules/User/panel.tsx";
import { RolePanel } from "./modules/Role/panel.tsx";
import { RbacPanel, RbacTab } from "./modules/Rbac/panel.tsx";
import { ReportsPanel } from "./modules/Reports/panel.tsx";
import {
  hasMenuRight,
  hasActionRight,
  isNavTabAllowed,
  getFirstAllowedNavTab
} from "./utils/permissions.ts";
import {
  translations,
  SupportedLang,
  SupportedTheme,
  subscribeToTranslations,
  getSavedLanguage,
  persistLanguageLocally
} from "./utils/i18n.ts";
import { useAutoDomTranslation } from "./utils/domTranslator.ts";
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
import { useMessageBox } from "./components/MessageBox.tsx";
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
  TrendingUp,
  KeyRound,
  RefreshCw,
  UserPlus
} from "lucide-react";

type NavigationTab =
  | "dashboard"
  | "new_taxpayer"
  | "taxpayer"
  | "rate"
  | "settings"
  | "masters"
  | "calculation"
  | "roles"
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
  settingsTab?: RateTab;
  mastersTab?: RateTab;
  rbacTab?: RbacTab;
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
        "new_taxpayer",
        "taxpayer",
        "calculation",
        "rate",
        "settings",
        "masters",
        "roles",
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
        if (mainSegment === "settings" && parts[1]) {
          result.settingsTab = parts[1] as RateTab;
        }
        if (mainSegment === "masters" && parts[1]) {
          result.mastersTab = parts[1] as RateTab;
        }
        if (mainSegment === "rate" && parts[1]) {
          result.rateTab = parts[1] as RateTab;
        }
        if (mainSegment === "rbac" && parts[1] && ["user", "role", "right"].includes(parts[1])) {
          result.rbacTab = parts[1] as RbacTab;
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
  const { showError, MessageBoxModal } = useMessageBox();
  const initialRoute = parseRouteFromLocation();
  const [session, setSession] = useState<AuthSessionState | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [activeTab, setActiveTab] = useState<NavigationTab>(initialRoute.tab);
  const [taxpayerSubView, setTaxpayerSubView] = useState<TaxpayerSubView>(initialRoute.subView || "overview");
  const [calculationTab, setCalculationTab] = useState<"calculator" | "multi_year" | "history" | "comparison">(initialRoute.calculationTab || "calculator");

  // Rate, Settings & RBAC Tab State
  const [rateSubTab, setRateSubTab] = useState<RateTab>(initialRoute.rateTab || "land_rate");
  const [settingsSubTab, setSettingsSubTab] = useState<RateTab>(initialRoute.settingsTab || "fiscal_year");
  const [mastersSubTab, setMastersSubTab] = useState<RateTab>(initialRoute.mastersTab || "fiscal_year");
  const [rbacSubTab, setRbacSubTab] = useState<RbacTab>(initialRoute.rbacTab || "user");
  const [roleSubTab, setRoleSubTab] = useState<"roles" | "user_rights">("roles");
  const [roleTargetUserId, setRoleTargetUserId] = useState<number | null>(null);

  const [loggingOut, setLoggingOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [menuLoading, setMenuLoading] = useState<boolean>(false);
  const isFirstRenderRef = useRef<boolean>(true);

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    setMenuLoading(true);
    const timer = setTimeout(() => setMenuLoading(false), 240);
    return () => clearTimeout(timer);
  }, [activeTab, taxpayerSubView, calculationTab, rateSubTab, settingsSubTab, mastersSubTab, rbacSubTab, roleSubTab]);

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
      } else if (activeTab === "settings" && settingsSubTab) {
        hashString = `#/${activeTab}/${settingsSubTab}`;
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
  }, [activeTab, taxpayerSubView, settingsSubTab, mastersSubTab, rateSubTab, rbacSubTab, calculationTab]);

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
      if (route.settingsTab && route.settingsTab !== settingsSubTab) {
        setSettingsSubTab(route.settingsTab);
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
  }, [activeTab, taxpayerSubView, settingsSubTab, mastersSubTab, rateSubTab, rbacSubTab]);

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
  }, []);

  useEffect(() => {
    if (isDbStatusModalOpen) {
      fetchDbStatus();
    }
  }, [isDbStatusModalOpen]);

  // Theme & Language (Controlled via User Menu and persisted to user account + localStorage)
  const [currentLang, setCurrentLang] = useState<SupportedLang>(() => {
    return getSavedLanguage();
  });
  const [currentTheme, setCurrentTheme] = useState<SupportedTheme>(() => {
    return (localStorage.getItem("gtax_active_theme") as SupportedTheme) || "slate";
  });
  const [, setTranslationTick] = useState(0);

  useEffect(() => {
    return subscribeToTranslations(() => setTranslationTick((v) => v + 1));
  }, []);

  // Universal JSON-first + Google Translate DOM localizer covering every menu, panel, window, and modal
  useAutoDomTranslation(currentLang, [
    activeTab,
    taxpayerSubView,
    calculationTab,
    rateSubTab,
    settingsSubTab,
    mastersSubTab,
    rbacSubTab,
    isAiChatbotOpen,
    isDbColMapOpen,
    isDbStatusModalOpen,
    isFlutterMobileOpen,
    Boolean(session?.isAuthenticated)
  ]);

  useEffect(() => {
    persistLanguageLocally(currentLang, session?.user?.id);
  }, [currentLang, session?.user?.id]);

  useEffect(() => {
    try {
      localStorage.setItem("gtax_active_theme", currentTheme);
    } catch (_) {}
  }, [currentTheme]);

  const handleLanguageChange = useCallback(
    async (lang: SupportedLang) => {
      setCurrentLang(lang);
      persistLanguageLocally(lang, session?.user?.id);
      if (session?.isAuthenticated && session?.token) {
        setSession((prev) =>
          prev && prev.user
            ? { ...prev, user: { ...prev.user, preferred_lang: lang } }
            : prev
        );
        try {
          await ApiController.updateUserPreferences({ preferred_lang: lang }, session.token);
        } catch (err) {
          console.warn("Failed to persist user language preference:", err);
        }
      }
    },
    [session?.isAuthenticated, session?.token, session?.user?.id]
  );

  const handleThemeChange = useCallback(
    async (theme: SupportedTheme) => {
      setCurrentTheme(theme);
      if (session?.isAuthenticated && session?.token) {
        setSession((prev) =>
          prev && prev.user
            ? { ...prev, user: { ...prev.user, preferred_theme: theme } }
            : prev
        );
        try {
          await ApiController.updateUserPreferences({ preferred_theme: theme }, session.token);
        } catch (err) {
          console.warn("Failed to persist user theme preference:", err);
        }
      }
    },
    [session?.isAuthenticated, session?.token]
  );

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
      setActiveTab("new_taxpayer");
      setIsAiChatbotOpen(false);
      speakAudio("Opening taxpayer registration form.");
      setHeaderVoiceNotice("Opened New TaxPayer Registration");
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
      showError("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
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

  // Check saved session on mount and restore user's saved language/theme preference
  useEffect(() => {
    const initSession = async () => {
      const active = await AuthController.checkActiveSession();
      if (active) {
        setSession(active);
        const userId = active.user?.id;
        const serverLang = active.user?.preferred_lang as SupportedLang | undefined;
        const localUserLang = userId ? localStorage.getItem(`gtax_user_lang_${userId}`) : null;
        if (serverLang && ["eng", "nep", "ind"].includes(serverLang)) {
          // If server has an explicit non-default preference OR no local override, restore server preference
          if (serverLang !== "eng" || !localUserLang) {
            setCurrentLang(serverLang);
            persistLanguageLocally(serverLang, userId);
          } else if (localUserLang && ["eng", "nep", "ind"].includes(localUserLang)) {
            setCurrentLang(localUserLang as SupportedLang);
            if (active.token) {
              ApiController.updateUserPreferences({ preferred_lang: localUserLang }, active.token).catch(() => {});
            }
          }
        }
        const serverTheme = active.user?.preferred_theme as SupportedTheme | undefined;
        if (serverTheme && ["dark", "slate", "emerald", "light"].includes(serverTheme)) {
          setCurrentTheme(serverTheme);
        }
      }
      setCheckingSession(false);
    };
    initSession();

    const handleRbacUpdated = async () => {
      const refreshed = await AuthController.checkActiveSession();
      if (refreshed) {
        setSession(refreshed);
      }
    };
    window.addEventListener("gtax:rbac_updated", handleRbacUpdated);
    return () => {
      window.removeEventListener("gtax:rbac_updated", handleRbacUpdated);
    };
  }, []);

  // Enforce menu/route authorization whenever session or activeTab updates
  useEffect(() => {
    if (session?.isAuthenticated && activeTab !== "privacy") {
      if (!isNavTabAllowed(session, activeTab)) {
        const fallbackTab = getFirstAllowedNavTab(session);
        if (fallbackTab !== activeTab) {
          setActiveTab(fallbackTab);
        }
      }
    }
  }, [session, activeTab]);

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
      sidebarBg: "bg-white border-slate-200 text-slate-800",
      text: "text-slate-100",
      cardBg: "bg-slate-900 border-slate-800",
      headerBg: "bg-slate-900/90 border-slate-800"
    },
    slate: {
      bg: "bg-slate-50 text-slate-900",
      sidebarBg: "bg-white border-slate-200 text-slate-800",
      text: "text-slate-900",
      cardBg: "bg-white border-slate-200",
      headerBg: "bg-white/90 border-slate-200"
    },
    emerald: {
      bg: "bg-emerald-950/20 text-slate-900",
      sidebarBg: "bg-white border-slate-200 text-slate-800",
      text: "text-slate-900",
      cardBg: "bg-white border-emerald-100",
      headerBg: "bg-white/90 border-emerald-200"
    },
    light: {
      bg: "bg-zinc-50 text-zinc-900",
      sidebarBg: "bg-white border-slate-200 text-slate-800",
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
        onLoginSuccess={(newSession) => {
          setSession(newSession);
          const uid = newSession.user?.id;
          const userLang = newSession.user?.preferred_lang as SupportedLang | undefined;
          const localUserLang = uid ? localStorage.getItem(`gtax_user_lang_${uid}`) : null;
          if (userLang && ["eng", "nep", "ind"].includes(userLang) && (userLang !== "eng" || !localUserLang)) {
            setCurrentLang(userLang);
            persistLanguageLocally(userLang, uid);
          } else if (localUserLang && ["eng", "nep", "ind"].includes(localUserLang)) {
            setCurrentLang(localUserLang as SupportedLang);
            if (newSession.token) {
              ApiController.updateUserPreferences({ preferred_lang: localUserLang }, newSession.token).catch(() => {});
            }
          }
          const userTheme = newSession.user?.preferred_theme as SupportedTheme | undefined;
          if (userTheme && ["dark", "slate", "emerald", "light"].includes(userTheme)) {
            setCurrentTheme(userTheme);
          }
        }}
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
            ? "translate-x-0 w-fit shrink-0 p-2.5 shadow-2xl"
            : isSidebarCollapsed
            ? "-translate-x-full lg:-translate-x-full w-0 p-0 overflow-hidden border-none pointer-events-none"
            : "-translate-x-full lg:translate-x-0 w-fit shrink-0 p-2.5"
        }`}
      >
        <div className="space-y-3 overflow-y-auto no-scrollbar">
          {/* Brand Header */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-emerald-700 font-bold text-base shrink-0">
                G
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight leading-none text-slate-900 whitespace-nowrap">
                  Gtax Enterprise
                </h1>
                <p className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
                  Municipal Tax Hub
                </p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 shrink-0"
              title="Close navigation menu"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items - Clean Light Background, Bold Active Highlight & Colored Icons */}
          <nav className="space-y-1 text-xs">
            {/* 1. Dashboard */}
            {hasMenuRight(session, "dashboard") && (
              <button
                onClick={() => {
                  setActiveTab("dashboard");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "dashboard"
                    ? "bg-slate-200/75 text-slate-950 font-bold border border-slate-300/60"
                    : "bg-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-100/60 font-normal border border-transparent"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-sm">{t.dashboard}</span>
              </button>
            )}

            {/* 2. New TaxPayer (Direct Inline Panel Registration) */}
            {hasMenuRight(session, "taxpayer") && hasActionRight(session, "taxpayer", "new") && (
              <button
                onClick={() => {
                  setActiveTab("new_taxpayer");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "new_taxpayer"
                    ? "bg-slate-200/75 text-slate-950 font-bold border border-slate-300/60"
                    : "bg-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-100/60 font-normal border border-transparent"
                }`}
              >
                <UserPlus className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm">New TaxPayer</span>
              </button>
            )}

            {/* 3. TaxPayers */}
            {hasMenuRight(session, "taxpayer") && (
              <button
                onClick={() => {
                  setActiveTab("taxpayer");
                  setTaxpayerSubView("overview");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "taxpayer"
                    ? "bg-slate-200/75 text-slate-950 font-bold border border-slate-300/60"
                    : "bg-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-100/60 font-normal border border-transparent"
                }`}
              >
                <Users className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-sm">TaxPayers</span>
              </button>
            )}

            {/* 4. Calculation (No submenu - opens Calculation Workspace with tabs) */}
            {hasMenuRight(session, "calculation") && (
              <button
                onClick={() => {
                  setActiveTab("calculation");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "calculation"
                    ? "bg-slate-200/75 text-slate-950 font-bold border border-slate-300/60"
                    : "bg-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-100/60 font-normal border border-transparent"
                }`}
              >
                <Calculator className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-sm">{t.calculation}</span>
              </button>
            )}

            {/* 5. Rates */}
            {hasMenuRight(session, "master") && (
              <button
                onClick={() => {
                  setActiveTab("rate");
                  setRateSubTab("land_rate");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "rate"
                    ? "bg-slate-200/75 text-slate-950 font-bold border border-slate-300/60"
                    : "bg-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-100/60 font-normal border border-transparent"
                }`}
              >
                <DollarSign className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="text-sm">Rates</span>
              </button>
            )}

            {/* 6. Settings (Tab Menu: Fiscal Year, Measurement Unit, Company Profiles, Construction Types) */}
            {(hasMenuRight(session, "master") || hasMenuRight(session, "company")) && (
              <button
                onClick={() => {
                  setActiveTab("settings");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "settings" || activeTab === "masters"
                    ? "bg-slate-200/75 text-slate-950 font-bold border border-slate-300/60"
                    : "bg-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-100/60 font-normal border border-transparent"
                }`}
              >
                <Settings className="w-4 h-4 text-cyan-600 shrink-0" />
                <span className="text-sm">Settings</span>
              </button>
            )}

            {/* 7. RBAC (Tab Menu: User, Role, Right) */}
            {(hasMenuRight(session, "user") || hasMenuRight(session, "role")) && (
              <button
                onClick={() => {
                  setActiveTab("rbac");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "rbac" || activeTab === "users" || activeTab === "roles"
                    ? "bg-slate-200/75 text-slate-950 font-bold border border-slate-300/60"
                    : "bg-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-100/60 font-normal border border-transparent"
                }`}
              >
                <Shield className="w-4 h-4 text-violet-600 shrink-0" />
                <span className="text-sm">RBAC</span>
              </button>
            )}

            {/* 8. Logs */}
            {hasMenuRight(session, "audit_logs") && (
              <button
                onClick={() => {
                  setActiveTab("security_logs");
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "security_logs"
                    ? "bg-slate-200/75 text-slate-950 font-bold border border-slate-300/60"
                    : "bg-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-100/60 font-normal border border-transparent"
                }`}
              >
                <Activity className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-sm">Logs</span>
              </button>
            )}
          </nav>
        </div>

        {/* Clean Sidebar Footer with Idle Session Timeout info */}
        <div className="pt-2 border-t border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between gap-2 px-1 text-[10px] text-slate-500 whitespace-nowrap">
            <span>Timeout: {idleTimeoutMinutes}m</span>
            <button
              onClick={() => {
                setActiveTab("privacy");
                setSidebarOpen(false);
              }}
              className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
            >
              {t.privacyPolicy}
            </button>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-2.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>{loggingOut ? "Logging out..." : t.signOut}</span>
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
                if (hasMenuRight(session, "master") || hasMenuRight(session, "company")) {
                  setActiveTab("settings");
                  setSettingsSubTab("fiscal_year");
                }
              }}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 font-semibold text-xs shadow-2xs transition-all group shrink-0 cursor-pointer"
              title={`Active Fiscal Year: FY ${activeFiscalYearCode} BS (Click to modify in Settings)`}
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
            {hasMenuRight(session, "taxpayer") && (
              <GlobalTaxpayerSearch
                currentLang={currentLang}
                onSelectTaxpayer={(id) => {
                  setActiveTab("taxpayer");
                  setTaxpayerSubView("overview");
                  setSelectedTaxpayerId(id);
                }}
                onOpenNewTaxpayerModal={() => {
                  if (!hasActionRight(session, "taxpayer", "new")) return;
                  setActiveTab("new_taxpayer");
                }}
              />
            )}
          </div>

          {/* Right Header Actions: Live DB Status Chip + Voice + AI Assistant + Mobile App + User Menu */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Mobile Compact Active Fiscal Year Badge */}
            <button
              onClick={() => {
                if (hasMenuRight(session, "master") || hasMenuRight(session, "company")) {
                  setActiveTab("settings");
                  setSettingsSubTab("fiscal_year");
                }
              }}
              className="md:hidden flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono font-bold shadow-2xs"
              title={`Active Fiscal Year: FY ${activeFiscalYearCode} BS`}
            >
              <Calendar className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>FY {activeFiscalYearCode}</span>
            </button>
            {/* Live DB Connection Badge / Inspector Button */}
            {<button
              onClick={() => setIsDbStatusModalOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs group"
              title={`PostgreSQL Database: ${dbStatus?.user || "gtax_user"}@${dbStatus?.host || "127.0.0.1"}:${dbStatus?.port || 5432}/${dbStatus?.database || "gtax_db"} (${dbStatus?.connected ? "Live Connected" : "Disconnected"}). Click to inspect exact parameters & test connection.`}
              aria-label="Database Status Inspector"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${dbStatus?.connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              <Database className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0" />
              <span data-no-translate="true" className="hidden xl:inline font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {dbStatus ? `${dbStatus.user}@${dbStatus.host}:${dbStatus.port}/${dbStatus.database}` : "DB Connecting..."}
              </span>
              <span data-no-translate="true" className="xl:hidden font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                {dbStatus?.database || "DB"}
              </span>
            </button> }

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
              onLanguageChange={handleLanguageChange}
              onThemeChange={handleThemeChange}
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

        {/* Main Panel Content Render Area - Protected by Route Authorization Guard */}
        <main className="flex-1 m-[3px] min-w-0 relative">
          {menuLoading && (
            <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center bg-slate-900/10 backdrop-blur-[1px]">
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-xs font-bold text-slate-700 dark:text-slate-200">
                <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>Loading module...</span>
              </div>
            </div>
          )}
          {!isNavTabAllowed(session, activeTab) ? (
            <div className="p-8 max-w-lg mx-auto mt-10 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-2xl text-center space-y-3 shadow-sm">
              <Shield className="w-10 h-10 text-rose-500 mx-auto" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Menu Access Disabled</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your user account or assigned role does not have permission to access this menu section.
              </p>
              <button
                onClick={() => setActiveTab(getFirstAllowedNavTab(session))}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              >
                Return to Permitted Workspace
              </button>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <MunicipalDashboardPanel
                  onNavigate={(tab) => {
                    if (isNavTabAllowed(session, tab)) {
                      setActiveTab(tab as any);
                    }
                  }}
                  onOpenNewTaxpayer={() => {
                    if (!hasMenuRight(session, "taxpayer") || !hasActionRight(session, "taxpayer", "new")) return;
                    setActiveTab("new_taxpayer");
                  }}
                  currentLang={currentLang}
                  activeFiscalYearCode={activeFiscalYearCode}
                  activeFiscalYearId={activeFiscalYearId}
                />
              )}

              {activeTab === "new_taxpayer" && (
                <NewTaxpayerPanel
                  currentLang={currentLang}
                  onComplete={(newTpId) => {
                    setSelectedTaxpayerId(newTpId);
                    setTaxpayerSubView("overview");
                    setActiveTab("taxpayer");
                  }}
                  onViewTaxpayers={() => {
                    setTaxpayerSubView("overview");
                    setActiveTab("taxpayer");
                  }}
                />
              )}

              {activeTab === "taxpayer" && (
                <TaxpayerWorkflowPanel
                  initialSubView={taxpayerSubView}
                  selectedTaxpayerIdProp={selectedTaxpayerId}
                  openNewTaxpayerTrigger={openNewTaxpayerTrigger}
                  currentLang={currentLang}
                  currentSession={session}
                />
              )}

              {activeTab === "rate" && (
                <RatesMasterPanel
                  key="rate-panel"
                  currentLang={currentLang}
                  initialTab={rateSubTab}
                  filterGroup="rate"
                  currentSession={session}
                  onTabChange={(tab) => setRateSubTab(tab)}
                />
              )}

              {activeTab === "settings" && (
                <RatesMasterPanel
                  key="settings-panel"
                  currentLang={currentLang}
                  initialTab={settingsSubTab}
                  filterGroup="settings"
                  currentSession={session}
                  onTabChange={(tab) => setSettingsSubTab(tab)}
                />
              )}

              {activeTab === "masters" && (
                <RatesMasterPanel
                  key="masters-panel"
                  currentLang={currentLang}
                  initialTab={mastersSubTab}
                  filterGroup="masters"
                  currentSession={session}
                  onTabChange={(tab) => setMastersSubTab(tab)}
                />
              )}

              {/* CALCULATION WINDOW WITH FULL FRONTEND AND MANUAL CALCULATION DETAILS */}
              {activeTab === "calculation" && (
                <OverallCalculationPanel
                  initialTab={calculationTab}
                  onTabChange={(tab) => setCalculationTab(tab)}
                  selectedTaxpayerIdProp={selectedTaxpayerId}
                  currentSession={session}
                />
              )}

              {activeTab === "roles" && (
                <RolePanel
                  currentSession={session}
                  currentLang={currentLang}
                  initialSubTab={roleSubTab}
                  initialTargetUserId={roleTargetUserId}
                />
              )}

              {activeTab === "tax_calc" && <TaxCalculationPanel currentSession={session} />}
              {activeTab === "reports" && <ReportsPanel />}
              {activeTab === "architecture" && <ArchitectureExplorerPanel />}
              {activeTab === "ai_agent" && <AiAgentPanel />}
              {activeTab === "realtime_sync" && <RealtimeSyncPanel />}
              {activeTab === "jurisdictions" && <JurisdictionPanel />}
              {activeTab === "users" && (
                <UserPanel
                  currentSession={session}
                  currentLang={currentLang}
                  onManageUserRights={(uid) => {
                    if (!hasMenuRight(session, "role")) return;
                    setRoleSubTab("user_rights");
                    setRoleTargetUserId(uid);
                    setRbacSubTab("right");
                    setActiveTab("rbac");
                  }}
                />
              )}
              {activeTab === "security_logs" && <AuditLogsPanel />}
              {activeTab === "rbac" && (
                <RbacPanel
                  currentSession={session}
                  currentLang={currentLang}
                  initialTab={rbacSubTab}
                  onTabChange={(tab) => setRbacSubTab(tab)}
                />
              )}
            </>
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
          if (!hasMenuRight(session, "taxpayer") || !hasActionRight(session, "taxpayer", "new")) return;
          setActiveTab("new_taxpayer");
        }}
        onSelectTaxpayer={(id) => {
          if (!hasMenuRight(session, "taxpayer")) return;
          setActiveTab("taxpayer");
          setTaxpayerSubView("overview");
          setSelectedTaxpayerId(id);
        }}
        onOpenMultiYearTaxCalc={() => {
          if (!hasMenuRight(session, "calculation")) return;
          setActiveTab("calculation");
          setCalculationTab("multi_year");
        }}
        onOpenRatesMaster={(subTab) => {
          if (!hasMenuRight(session, "master")) return;
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
        onLanguageChange={handleLanguageChange}
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
      <MessageBoxModal />
    </div>
  );
}
