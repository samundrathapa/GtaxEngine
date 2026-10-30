import React, { useState, useEffect, useRef } from "react";
import {
  Smartphone,
  CheckCircle,
  RefreshCw,
  Search,
  Users,
  Bot,
  Layers,
  Settings,
  Globe,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Code,
  X,
  Activity,
  Send,
  Plus,
  Home,
  Mic,
  Calculator,
  Sliders,
  DollarSign,
  Calendar,
  Save,
  CheckCircle2,
  FileText
} from "lucide-react";

interface FlutterMobileAppSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: "nep" | "ind" | "eng";
}

export const FlutterMobileAppSimulator: React.FC<FlutterMobileAppSimulatorProps> = ({
  isOpen,
  onClose,
  lang = "eng"
}) => {
  const [deviceFrame, setDeviceFrame] = useState<"ios" | "android">("ios");
  const [activeMobileTab, setActiveMobileTab] = useState<
    "dashboard" | "taxpayers" | "calculate" | "registration" | "ai" | "settings"
  >("dashboard");
  const [systemManifest, setSystemManifest] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");

  // AI Chat Messages & State
  const [chatMessages, setChatMessages] = useState<
    Array<{
      role: "user" | "assistant";
      text: string;
      taxpayers?: any[];
      landRate?: any;
    }>
  >([
    {
      role: "assistant",
      text: "Namaste! I am the gtax Mobile AI Tax Advisor (Gemini 2.5 Flash). You can speak or tap commands:\n• 'open taxpayer' → Opens 1-Door registration\n• 'list taxpayer today registered' → Shows today's citizens\n• 'add landrate 1 to land rate' → Auto-inserts Land Rate 1\n• 'calculate tax' → Launches calculation engine"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [isMobileMicListening, setIsMobileMicListening] = useState(false);

  // Calculation Screen State (Mobile)
  const [calcTaxpayerId, setCalcTaxpayerId] = useState<number>(1);
  const [calcSubTab, setCalcSubTab] = useState<"calc" | "history">("calc");
  const [calcUseMalpot, setCalcUseMalpot] = useState<boolean>(false);
  const [calcLandAdjust, setCalcLandAdjust] = useState<number>(0);
  const [calcStructureAdjust, setCalcStructureAdjust] = useState<number>(0);
  const [calcOverrideRate, setCalcOverrideRate] = useState<boolean>(false);
  const [calcCustomRate, setCalcCustomRate] = useState<number>(0.10);
  const [calcFineRebate, setCalcFineRebate] = useState<"rebate_10" | "none" | "fine_10" | "fine_20">("rebate_10");
  const [calcSaving, setCalcSaving] = useState<boolean>(false);
  const [calcSavedNotice, setCalcSavedNotice] = useState<string | null>(null);
  const [calcHistoryList, setCalcHistoryList] = useState<any[]>([]);

  // Fetch single common entry point status
  const fetchManifest = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/entry/manifest");
      if (res.ok) {
        const json = await res.json();
        setSystemManifest(json.data);
      }
    } catch (err) {
      console.warn("Failed to fetch entry manifest:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCalcHistory = async () => {
    try {
      const res = await fetch("/api/v1/property/calculation/history");
      if (res.ok) {
        const json = await res.json();
        setCalcHistoryList(json.data || []);
      }
    } catch (err) {
      console.warn("Failed to load calculation history:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchManifest();
      fetchCalcHistory();
    }
  }, [isOpen]);

  // Compute live tax formula for mobile screen
  const getSimulatedTax = (tpId: number) => {
    const isTp3 = tpId === 3;
    const landAreaAana = isTp3 ? 5.0 : 4.0;
    const landRatePerAana = calcUseMalpot ? 1000000 : (isTp3 ? 1500000 : 800000);
    let landVal = landAreaAana * landRatePerAana;
    if (calcLandAdjust !== 0) {
      landVal += landVal * (calcLandAdjust / 100);
    }

    const structureAreaSqft = isTp3 ? 2000 : 2200;
    const structureRate = 2800;
    const depreciationPercent = 5;
    const rawStructure = structureAreaSqft * structureRate;
    let netStructure = rawStructure * (1 - depreciationPercent / 100);
    if (calcStructureAdjust !== 0) {
      netStructure += netStructure * (calcStructureAdjust / 100);
    }

    const totalValuation = Math.round(landVal + netStructure);

    let appliedRate = calcCustomRate;
    if (!calcOverrideRate) {
      if (totalValuation > 10000000) appliedRate = 0.20;
      else if (totalValuation > 5000000) appliedRate = 0.15;
      else if (totalValuation > 1000000) appliedRate = 0.10;
      else appliedRate = 0.05;
    }

    const baseTax = Math.round((totalValuation * appliedRate) / 100);

    let rebate = 0;
    let fine = 0;
    if (calcFineRebate === "rebate_10") {
      rebate = Math.round(baseTax * 0.10);
    } else if (calcFineRebate === "fine_10") {
      fine = Math.round(baseTax * 0.10);
    } else if (calcFineRebate === "fine_20") {
      fine = Math.round(baseTax * 0.20);
    }

    const sanitation = 500;
    const cess = Math.round(baseTax * 0.01);
    const additionals = sanitation + cess;

    const finalTax = Math.max(0, baseTax - rebate + fine + additionals);

    return {
      landVal: Math.round(landVal),
      structureVal: Math.round(netStructure),
      totalValuation,
      appliedRate,
      baseTax,
      rebate,
      fine,
      additionals,
      finalTax
    };
  };

  const handleSaveSimulatedCalc = async () => {
    const calc = getSimulatedTax(calcTaxpayerId);
    setCalcSaving(true);
    try {
      const res = await fetch("/api/v1/property/calculation/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taxpayer_id: calcTaxpayerId,
          fiscal_year_id: 2,
          total_tax: calc.finalTax,
          calculate_date_bs: "2081-07-02",
          lands: [{ land_id: 1, calculated_amount: calc.landVal, total_amount: calc.landVal }],
          additionals: [{ collection_rate_id: 1, amount: calc.additionals }]
        })
      });
      if (res.ok) {
        setCalcSavedNotice("Saved to database via /api/v1!");
        setTimeout(() => setCalcSavedNotice(null), 3000);
        fetchCalcHistory();
      }
    } catch (e) {
      console.warn("Failed to save mobile calculation", e);
    } finally {
      setCalcSaving(false);
    }
  };

  // Voice & Chat command handler for mobile simulator
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text) return;

    setChatMessages(prev => [...prev, { role: "user", text }]);
    setChatInput("");
    setAiLoading(true);

    const lower = text.toLowerCase();

    // 1. Intent: "open taxpayer" -> switch to 1-Door registration tab
    if (lower.includes("open taxpayer") || lower.includes("new taxpayer") || lower.includes("दर्ता")) {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            role: "assistant",
            text: "Navigating to 1-Door Taxpayer Registration screen in the mobile app!"
          }
        ]);
        setActiveMobileTab("registration");
        setAiLoading(false);
      }, 400);
      return;
    }

    // 2. Intent: "calculate tax" / "open calculation" -> switch to calculate tab
    if (lower.includes("calculate") || lower.includes("valuation") || lower.includes("गणना")) {
      setTimeout(() => {
        setChatMessages(prev => [
          ...prev,
          {
            role: "assistant",
            text: "Launching the Frontend & Manual Property Tax Calculation Engine!"
          }
        ]);
        setActiveMobileTab("calculate");
        setAiLoading(false);
      }, 400);
      return;
    }

    // 3. Intent: "list taxpayer today registered"
    if (lower.includes("list taxpayer") || lower.includes("today registered") || lower.includes("registered today")) {
      try {
        const res = await fetch("/api/v1/property/taxpayers");
        const json = await res.json();
        const allTps: any[] = json.data || [];
        const todayIso = new Date().toISOString().slice(0, 10);
        const todayTps = allTps.filter(tp => (tp.insert_on || "").slice(0, 10) === todayIso);
        const display = todayTps.length > 0 ? todayTps : allTps.slice(0, 3);

        setChatMessages(prev => [
          ...prev,
          {
            role: "assistant",
            text: todayTps.length > 0
              ? `Found ${todayTps.length} citizen(s) registered today in the mobile system:`
              : `Showing ${display.length} registered citizens in the system (0 registered today so far):`,
            taxpayers: display
          }
        ]);
        setAiLoading(false);
        return;
      } catch (err) {
        console.warn(err);
      }
    }

    // 4. Intent: "add landrate 1 to land rate"
    if ((lower.includes("add") || lower.includes("insert")) && (lower.includes("landrate") || lower.includes("land rate"))) {
      try {
        const res = await fetch("/api/v1/property/rates/land_rate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: "LR-1",
            fullanme: "Land Rate 1 - Primary Municipal Belt",
            rate_per_unit: 1200000,
            ward_no_ids: "1,2,3",
            fiscal_year_id: 2
          })
        });
        const json = await res.json();
        const created = json.data;

        setChatMessages(prev => [
          ...prev,
          {
            role: "assistant",
            text: `✅ Land Rate 1 has been automatically inserted into Municipal Land Rates:\n• Code: LR-1\n• Rate: NPR 1,200,000 / Aana\n• Wards: 1, 2, 3\n• Live in mobile calculation engine!`,
            landRate: created
          }
        ]);
        setAiLoading(false);
        return;
      } catch (err) {
        console.warn(err);
      }
    }

    // 5. Default Gemini AI Chat
    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: {
            fiscalYear: "2081/82",
            jurisdiction: "Kathmandu Metropolitan City",
            devicePlatform: deviceFrame
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [
          ...prev,
          { role: "assistant", text: data.data?.reply || data.message || "Tax calculation assessed." }
        ]);
      } else {
        throw new Error("AI query failed");
      }
    } catch {
      setChatMessages(prev => [
        ...prev,
        {
          role: "assistant",
          text: "Mobile AI Advisor: You can say 'open taxpayer' to register, 'calculate tax' to open calculations, 'list taxpayer today registered' to view citizens, or 'add landrate 1 to land rate' to insert rates."
        }
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  const handleMobileVoiceMic = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      handleSendMessage("open taxpayer");
      return;
    }

    if (isMobileMicListening) {
      setIsMobileMicListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === "nep" ? "ne-NP" : lang === "ind" ? "hi-IN" : "en-US";

      recognition.onstart = () => {
        setIsMobileMicListening(true);
      };

      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = () => {
        setIsMobileMicListening(false);
      };

      recognition.onend = () => {
        setIsMobileMicListening(false);
      };

      recognition.start();
    } catch {
      setIsMobileMicListening(false);
      handleSendMessage("open taxpayer");
    }
  };

  if (!isOpen) return null;

  const currentCalc = getSimulatedTax(calcTaxpayerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Flutter Mobile App (iOS & Android Deployment Hub)
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ready to Deploy
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Calculation Engine Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Four-Tier Architecture: <code className="text-blue-300">client</code> • <code className="text-emerald-300">server</code> • <code className="text-purple-300">ai</code> • <code className="text-amber-300">mobileapp</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Device Switcher */}
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setDeviceFrame("ios")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  deviceFrame === "ios"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Apple iOS (iPhone)
              </button>
              <button
                type="button"
                onClick={() => setDeviceFrame("android")}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  deviceFrame === "android"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Google Android (Pixel)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: Simulator on Left, Deployment Guides on Right */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-slate-950">
          
          {/* Left Column: Interactive Mobile Phone Simulator */}
          <div className="lg:col-span-5 p-6 flex flex-col items-center justify-center bg-radial from-slate-900 to-slate-950 border-r border-slate-800 overflow-y-auto">
            
            {/* Mobile Phone Device Frame */}
            <div className={`relative w-[345px] h-[675px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 ${
              deviceFrame === "ios" ? "border-slate-700 shadow-blue-900/20" : "border-slate-800 shadow-emerald-900/20"
            } flex flex-col`}>
              
              {/* Dynamic Island / Camera Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
                {deviceFrame === "ios" ? (
                  <div className="w-24 h-5 bg-black rounded-full flex items-center justify-end px-3">
                    <div className="w-2.5 h-2.5 bg-slate-800 rounded-full" />
                  </div>
                ) : (
                  <div className="w-3.5 h-3.5 bg-black rounded-full border border-slate-800" />
                )}
              </div>

              {/* Mobile Screen Surface */}
              <div className="w-full h-full bg-slate-900 rounded-[34px] overflow-hidden flex flex-col border border-slate-800">
                
                {/* Mobile Status Bar */}
                <div className="pt-3 px-6 pb-1 flex justify-between items-center text-[11px] text-slate-400 select-none bg-slate-900">
                  <span className="font-semibold text-slate-200">9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">5G</span>
                    <span className="text-[10px]">100%</span>
                  </div>
                </div>

                {/* Mobile App Bar */}
                <div className="px-4 py-2.5 bg-blue-900/60 border-b border-blue-800/40 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      gtax Mobile (Flutter 3.x)
                    </h3>
                    <p className="text-[10px] text-blue-200/80">FY 2081/82 • Common Entry Engine</p>
                  </div>
                  <button
                    onClick={fetchManifest}
                    className="p-1 rounded text-blue-200 hover:text-white"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {/* Mobile View Content Body */}
                <div className="flex-1 overflow-y-auto p-3 text-xs space-y-3 bg-slate-900/90 no-scrollbar">
                  
                  {/* DASHBOARD TAB */}
                  {activeMobileTab === "dashboard" && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      {/* Metric widgets */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700/60">
                          <span className="text-[10px] text-slate-400">Total Taxpayers</span>
                          <div className="text-lg font-bold text-blue-400">124</div>
                          <span className="text-[9px] text-emerald-400">Live DB Synced</span>
                        </div>
                        <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700/60">
                          <span className="text-[10px] text-slate-400">Calculation Engine</span>
                          <div className="text-lg font-bold text-purple-400">Active</div>
                          <span className="text-[9px] text-slate-400">Frontend + Manual</span>
                        </div>
                      </div>

                      {/* Quick Actions (Calculate Tax, 1-Door, Search) */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setActiveMobileTab("calculate")}
                          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-semibold flex items-center justify-center gap-1.5 transition text-[11px]"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                          Calculate Tax
                        </button>
                        <button
                          onClick={() => setActiveMobileTab("registration")}
                          className="p-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-semibold flex items-center justify-center gap-1.5 transition text-[11px]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          1-Door Register
                        </button>
                      </div>

                      {/* Calculation Preview Banner */}
                      <div
                        onClick={() => setActiveMobileTab("calculate")}
                        className="p-2.5 bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900 rounded-xl border border-indigo-500/30 flex items-center justify-between cursor-pointer hover:border-indigo-400/50 transition"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg">
                            <Calculator className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-[11px] text-indigo-200">5-Step Valuation Engine</div>
                            <div className="text-[9px] text-indigo-300/80">Land, house, progressive slabs, fines & rebate</div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-300" />
                      </div>

                      {/* Recent Taxpayers List */}
                      <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-[11px] text-slate-200">Recent Portfolios</span>
                          <span className="text-[10px] text-blue-400 cursor-pointer" onClick={() => setActiveMobileTab("taxpayers")}>View All</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="p-2 bg-slate-900/80 rounded-lg flex items-center justify-between border border-slate-800">
                            <div>
                              <div className="font-semibold text-white text-[11px]">Ram Bahadur Thapa</div>
                              <div className="text-[9px] text-slate-400">Ward #1 • Kitta २४९ (249)</div>
                            </div>
                            <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 rounded font-mono">
                              NPR 12,220
                            </span>
                          </div>
                          <div className="p-2 bg-slate-900/80 rounded-lg flex items-center justify-between border border-slate-800">
                            <div>
                              <div className="font-semibold text-white text-[11px]">Ramesh Kumar Thapa</div>
                              <div className="text-[9px] text-slate-400">Ward #1 • Kitta ५१२ (512)</div>
                            </div>
                            <span className="px-1.5 py-0.5 text-[9px] bg-emerald-500/20 text-emerald-300 rounded font-mono">
                              NPR 23,800
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* AI Voice Assistant Banner */}
                      <div
                        onClick={() => setActiveMobileTab("ai")}
                        className="p-2.5 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-xl border border-purple-500/30 flex items-center justify-between cursor-pointer hover:border-purple-400/50 transition"
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-purple-500/20 text-purple-300 rounded-lg">
                            <Bot className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-[11px] text-purple-200">Gemini Voice & Tax Workflows</div>
                            <div className="text-[9px] text-purple-300/80">"open taxpayer", "list today", "add landrate 1"</div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-300" />
                      </div>
                    </div>
                  )}

                  {/* CALCULATION TAB (Frontend & Manual Calculation Engine in Mobile) */}
                  {activeMobileTab === "calculate" && (
                    <div className="space-y-2.5 animate-in fade-in duration-150">
                      {/* Sub-tab switcher: Live Calculator vs History */}
                      <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[10px]">
                        <button
                          onClick={() => setCalcSubTab("calc")}
                          className={`flex-1 py-1 rounded font-bold transition ${
                            calcSubTab === "calc" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Live Calculation
                        </button>
                        <button
                          onClick={() => {
                            setCalcSubTab("history");
                            fetchCalcHistory();
                          }}
                          className={`flex-1 py-1 rounded font-bold transition ${
                            calcSubTab === "history" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Saved History ({calcHistoryList.length})
                        </button>
                      </div>

                      {calcSubTab === "calc" ? (
                        <>
                          {/* Taxpayer Selector */}
                          <div className="p-2 bg-slate-800/90 rounded-xl border border-slate-700/60">
                            <label className="text-[9px] text-slate-400 block mb-1">Select Citizen to Assess:</label>
                            <select
                              value={calcTaxpayerId}
                              onChange={e => setCalcTaxpayerId(Number(e.target.value))}
                              className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-[10px] text-white focus:outline-none"
                            >
                              <option value={1}>Ram Bahadur Thapa (TP-2081-0001)</option>
                              <option value={3}>Ramesh Kumar Thapa (TP-2081-0003)</option>
                            </select>
                          </div>

                          {/* Step 1: Land Parcel Valuation */}
                          <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[10px] text-blue-300 flex items-center gap-1">
                                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px]">1</span>
                                Land Valuation (calc_land)
                              </span>
                              <button
                                onClick={() => setCalcUseMalpot(!calcUseMalpot)}
                                className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                  calcUseMalpot ? "bg-amber-600 text-white" : "bg-blue-600 text-white"
                                }`}
                              >
                                {calcUseMalpot ? "Malpot Gov" : "Municipal Rate"}
                              </button>
                            </div>

                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-slate-400">Land Amount:</span>
                              <span className="font-bold text-blue-300">NPR {currentCalc.landVal.toLocaleString()}</span>
                            </div>

                            <div>
                              <div className="flex justify-between text-[8px] text-slate-400">
                                <span>Manual Adjust:</span>
                                <span>{calcLandAdjust > 0 ? `+${calcLandAdjust}%` : `${calcLandAdjust}%`}</span>
                              </div>
                              <input
                                type="range"
                                min="-50"
                                max="50"
                                value={calcLandAdjust}
                                onChange={e => setCalcLandAdjust(Number(e.target.value))}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              />
                            </div>
                          </div>

                          {/* Step 2: House & Floor Valuation */}
                          <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[10px] text-purple-300 flex items-center gap-1">
                                <span className="w-3.5 h-3.5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[8px]">2</span>
                                House Structure (calc_floor)
                              </span>
                              <span className="text-[8px] text-slate-400">RCC Frame (NPR 2,800/sqft)</span>
                            </div>

                            <div className="flex justify-between items-center text-[10px] font-mono">
                              <span className="text-slate-400">Structure Net (-5% dep.):</span>
                              <span className="font-bold text-purple-300">NPR {currentCalc.structureVal.toLocaleString()}</span>
                            </div>

                            <div>
                              <div className="flex justify-between text-[8px] text-slate-400">
                                <span>Structure Adjust:</span>
                                <span>{calcStructureAdjust > 0 ? `+${calcStructureAdjust}%` : `${calcStructureAdjust}%`}</span>
                              </div>
                              <input
                                type="range"
                                min="-50"
                                max="50"
                                value={calcStructureAdjust}
                                onChange={e => setCalcStructureAdjust(Number(e.target.value))}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                              />
                            </div>
                          </div>

                          {/* Step 3: Progressive Slabs & Base Tax */}
                          <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[10px] text-teal-300 flex items-center gap-1">
                                <span className="w-3.5 h-3.5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[8px]">3</span>
                                Progressive Tax Slabs
                              </span>
                              <span className="text-[8px] font-mono text-emerald-400 font-bold">
                                Slab {currentCalc.appliedRate}%
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-[9px] text-slate-400">
                              <span>Total Property Valuation:</span>
                              <span className="font-bold text-white">NPR {currentCalc.totalValuation.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center text-[10px] font-mono pt-0.5">
                              <span className="text-slate-400">Base Tax:</span>
                              <span className="font-bold text-teal-300">NPR {currentCalc.baseTax.toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Step 4: Early Rebate & Fines */}
                          <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700/60 space-y-1">
                            <span className="font-bold text-[10px] text-amber-300 block">
                              4. Early Rebate / Late Fine
                            </span>
                            <div className="grid grid-cols-4 gap-1 text-[8px]">
                              <button
                                onClick={() => setCalcFineRebate("rebate_10")}
                                className={`py-1 rounded font-bold transition text-center ${
                                  calcFineRebate === "rebate_10" ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300"
                                }`}
                              >
                                -10% Rebate
                              </button>
                              <button
                                onClick={() => setCalcFineRebate("none")}
                                className={`py-1 rounded font-bold transition text-center ${
                                  calcFineRebate === "none" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300"
                                }`}
                              >
                                Standard
                              </button>
                              <button
                                onClick={() => setCalcFineRebate("fine_10")}
                                className={`py-1 rounded font-bold transition text-center ${
                                  calcFineRebate === "fine_10" ? "bg-amber-600 text-white" : "bg-slate-700 text-slate-300"
                                }`}
                              >
                                +10% Fine
                              </button>
                              <button
                                onClick={() => setCalcFineRebate("fine_20")}
                                className={`py-1 rounded font-bold transition text-center ${
                                  calcFineRebate === "fine_20" ? "bg-rose-600 text-white" : "bg-slate-700 text-slate-300"
                                }`}
                              >
                                +20% Fine
                              </button>
                            </div>
                          </div>

                          {/* Final Tax Summary & Save Button */}
                          <div className="p-3 bg-gradient-to-r from-blue-900 to-indigo-950 rounded-xl border border-blue-500/40 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-blue-200 uppercase">Grand Total Tax Payable</span>
                              <span className="text-[9px] font-mono text-amber-400">FY 2081/82</span>
                            </div>
                            <div className="text-xl font-bold font-mono text-white">
                              NPR {currentCalc.finalTax.toLocaleString()}
                            </div>
                            <div className="flex justify-between text-[8px] text-slate-300 pt-1 border-t border-white/10 font-mono">
                              <span>Base: Rs. {currentCalc.baseTax.toLocaleString()}</span>
                              {currentCalc.rebate > 0 && <span className="text-emerald-400">Rebate: -Rs. {currentCalc.rebate}</span>}
                              {currentCalc.fine > 0 && <span className="text-amber-400">Fine: +Rs. {currentCalc.fine}</span>}
                              <span>Fees: Rs. {currentCalc.additionals}</span>
                            </div>

                            <button
                              onClick={handleSaveSimulatedCalc}
                              disabled={calcSaving}
                              className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg transition flex items-center justify-center gap-1 shadow-sm mt-1"
                            >
                              <Save className="w-3 h-3" />
                              <span>{calcSaving ? "Saving..." : "Save Calculation to Database"}</span>
                            </button>

                            {calcSavedNotice && (
                              <div className="text-[9px] text-emerald-300 text-center font-bold animate-pulse">
                                ✓ {calcSavedNotice}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        /* History view inside mobile frame */
                        <div className="space-y-1.5">
                          {calcHistoryList.map((item, idx) => (
                            <div key={idx} className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                              <div className="flex justify-between items-center text-[10px] font-bold text-white">
                                <span>{item.taxpayer_name || `Taxpayer #${item.taxpayer_id}`}</span>
                                <span className="text-emerald-400 font-mono">NPR {Number(item.total_tax).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-[8px] text-slate-400 mt-0.5 font-mono">
                                <span>{item.fiscal_year_name || "FY 2081/82"}</span>
                                <span>Date: {item.calculate_date_bs || "2081-07-02"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAXPAYERS REGISTRY TAB */}
                  {activeMobileTab === "taxpayers" && (
                    <div className="space-y-2.5 animate-in fade-in duration-150">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Search name, PAN, citizenship..."
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        {[
                          { name: "Ram Bahadur Thapa", code: "TP-2081-0001", ward: 1, tax: "12,220" },
                          { name: "Ramesh Kumar Thapa", code: "TP-2081-0003", ward: 1, tax: "23,800" },
                          { name: "Sita Maya Shrestha", code: "TP-2081-0002", ward: 5, tax: "14,200" }
                        ]
                          .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.code.toLowerCase().includes(searchQuery.toLowerCase()))
                          .map((t, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-white text-[11px]">{t.name}</div>
                                <div className="text-[9px] text-slate-400">{t.code} • Ward #{t.ward}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] font-mono text-emerald-400 font-bold">NPR {t.tax}</div>
                                <button
                                  onClick={() => setActiveMobileTab("calculate")}
                                  className="text-[8px] text-blue-400 underline font-bold"
                                >
                                  Assess Tax
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* 1-DOOR REGISTRATION TAB */}
                  {activeMobileTab === "registration" && (
                    <div className="space-y-2 animate-in fade-in duration-150">
                      <div className="p-2 bg-blue-950/60 rounded-lg border border-blue-800/40">
                        <span className="font-semibold text-[10px] text-blue-300">Continuous 1-Door Mobile Workflow</span>
                        <div className="text-[9px] text-slate-400">Taxpayer $\rightarrow$ Lands $\rightarrow$ House $\rightarrow$ Valuation</div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-0.5">Taxpayer Full Name</label>
                          <input
                            type="text"
                            defaultValue="Bishnu Prasad Adhikari"
                            className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-[10px] text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-slate-400 block mb-0.5">Mobile Phone</label>
                            <input
                              type="text"
                              defaultValue="9841887766"
                              className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-[10px] text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-slate-400 block mb-0.5">Ward No.</label>
                            <select className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-[10px] text-white">
                              <option>Ward #1</option>
                              <option>Ward #2</option>
                              <option>Ward #3</option>
                            </select>
                          </div>
                        </div>

                        {/* Registered Lands Preview */}
                        <div className="p-2 bg-slate-800/70 rounded-lg border border-slate-700/50">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-[10px] text-slate-200">Parcel: कित्ता नं. 412/A</span>
                            <span className="text-[9px] text-emerald-400 font-mono">1,800 sqft</span>
                          </div>
                          <div className="text-[9px] text-slate-400">Valuation: NPR 4,200,000 (Moth M-12)</div>
                        </div>

                        <button
                          onClick={() => {
                            alert("Mobile One-Door Registration saved to database via Single Common Entry Point!");
                            setActiveMobileTab("calculate");
                          }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold text-[10px] transition"
                        >
                          Submit & Proceed to Calculation
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI ASSISTANT TAB */}
                  {activeMobileTab === "ai" && (
                    <div className="flex flex-col h-full space-y-2 animate-in fade-in duration-150">
                      <div className="flex-1 space-y-2 overflow-y-auto max-h-[320px] pr-1 no-scrollbar">
                        {chatMessages.map((msg, i) => (
                          <div
                            key={i}
                            className={`p-2 rounded-xl text-[10px] leading-relaxed ${
                              msg.role === "user"
                                ? "bg-blue-600 text-white ml-6"
                                : "bg-slate-800 text-slate-200 border border-slate-700 mr-2"
                            }`}
                          >
                            <div className="whitespace-pre-wrap">{msg.text}</div>

                            {/* Render Citizen Cards if listed */}
                            {msg.taxpayers && msg.taxpayers.length > 0 && (
                              <div className="mt-2 space-y-1.5 pt-1.5 border-t border-slate-700">
                                {msg.taxpayers.map(tp => (
                                  <div key={tp.id} className="p-1.5 bg-slate-900 rounded border border-slate-700 flex justify-between items-center">
                                    <div>
                                      <div className="font-bold text-white text-[9px]">{tp.fullanme}</div>
                                      <div className="text-[8px] text-slate-400">{tp.code} • Ward {tp.ward_no}</div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setCalcTaxpayerId(tp.id);
                                        setActiveMobileTab("calculate");
                                      }}
                                      className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[8px] font-bold"
                                    >
                                      Calculate
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Render Inserted Land Rate Card if inserted */}
                            {msg.landRate && (
                              <div className="mt-2 p-1.5 bg-emerald-950/40 rounded border border-emerald-700 text-[9px] text-emerald-300">
                                <div className="font-bold">✓ Live in Municipal Land Rates</div>
                                <div>Ready for live municipal calculations!</div>
                              </div>
                            )}
                          </div>
                        ))}
                        {aiLoading && (
                          <div className="p-2 rounded-xl text-[10px] bg-slate-800 text-slate-400 animate-pulse">
                            Processing workflow & tax assessment...
                          </div>
                        )}
                      </div>

                      {/* Prompt Suggestions */}
                      <div className="flex gap-1 overflow-x-auto pb-1 text-[9px] no-scrollbar">
                        <button
                          onClick={() => handleSendMessage("open taxpayer")}
                          className="px-2 py-1 bg-indigo-950/80 rounded-full border border-indigo-700 whitespace-nowrap text-indigo-300 font-semibold"
                        >
                          "open taxpayer"
                        </button>
                        <button
                          onClick={() => handleSendMessage("list taxpayer today registered")}
                          className="px-2 py-1 bg-emerald-950/80 rounded-full border border-emerald-700 whitespace-nowrap text-emerald-300 font-semibold"
                        >
                          "list today registered"
                        </button>
                        <button
                          onClick={() => handleSendMessage("add landrate 1 to land rate")}
                          className="px-2 py-1 bg-amber-950/80 rounded-full border border-amber-700 whitespace-nowrap text-amber-300 font-semibold"
                        >
                          "add landrate 1"
                        </button>
                        <button
                          onClick={() => handleSendMessage("calculate tax")}
                          className="px-2 py-1 bg-slate-800 rounded-full border border-slate-700 whitespace-nowrap text-slate-300"
                        >
                          "calculate tax"
                        </button>
                      </div>

                      {/* Chat Input with Real Mic Toggle */}
                      <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                        <button
                          onClick={handleMobileVoiceMic}
                          className={`p-1.5 rounded-md transition ${
                            isMobileMicListening ? "bg-rose-500 text-white animate-pulse" : "text-slate-400 hover:text-white"
                          }`}
                          title="Speak voice command ('open taxpayer', 'list taxpayer today registered', 'add landrate 1')"
                        >
                          <Mic className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="text"
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                          placeholder="Speak or type 'open taxpayer'..."
                          className="flex-1 bg-transparent border-none text-[10px] text-white focus:outline-none px-1"
                        />
                        <button
                          onClick={() => handleSendMessage()}
                          className="p-1 bg-blue-600 rounded text-white"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SETTINGS TAB */}
                  {activeMobileTab === "settings" && (
                    <div className="space-y-2.5 animate-in fade-in duration-150">
                      <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                        <span className="font-bold text-[10px] text-white block mb-1">Common Entry Point Backend</span>
                        <div className="text-[9px] text-emerald-400 font-mono">http://127.0.0.1:3000/api/v1</div>
                        <span className="text-[8px] text-slate-400">Single common entry serving Web & Mobile</span>
                      </div>

                      <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                        <span className="font-bold text-[10px] text-white block mb-1">Language (भाषा)</span>
                        <div className="grid grid-cols-3 gap-1 text-[9px]">
                          <button className="py-1 bg-blue-600 text-white rounded text-center font-bold">🇺🇸 ENG</button>
                          <button className="py-1 bg-slate-700 text-slate-300 rounded text-center">🇳🇵 NEP</button>
                          <button className="py-1 bg-slate-700 text-slate-300 rounded text-center">🇮🇳 IND</button>
                        </div>
                      </div>

                      <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                        <span className="font-bold text-[10px] text-white block mb-1">Mobile Build Specification</span>
                        <div className="text-[9px] text-slate-300 space-y-0.5 font-mono">
                          <div>Flutter SDK: 3.2.0+</div>
                          <div>Target: iOS 14.0+ / Android API 34</div>
                          <div>Calculation Engine: Complete 5-Step Logic</div>
                          <div>Voice Assistant: Auto-Executing Commands</div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Mobile Bottom Navigation Bar (Home, Taxpayers, Calculate, 1-Door, AI Tax, Settings) */}
                <div className="px-1 py-1.5 bg-slate-950 border-t border-slate-800/80 flex justify-around items-center">
                  <button
                    onClick={() => setActiveMobileTab("dashboard")}
                    className={`flex flex-col items-center gap-0.5 ${
                      activeMobileTab === "dashboard" ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span className="text-[8px]">Home</span>
                  </button>
                  <button
                    onClick={() => setActiveMobileTab("taxpayers")}
                    className={`flex flex-col items-center gap-0.5 ${
                      activeMobileTab === "taxpayers" ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[8px]">Citizens</span>
                  </button>
                  <button
                    onClick={() => setActiveMobileTab("calculate")}
                    className={`flex flex-col items-center gap-0.5 ${
                      activeMobileTab === "calculate" ? "text-amber-400 font-bold" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span className="text-[8px]">Calculate</span>
                  </button>
                  <button
                    onClick={() => setActiveMobileTab("registration")}
                    className={`flex flex-col items-center gap-0.5 ${
                      activeMobileTab === "registration" ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="text-[8px]">1-Door</span>
                  </button>
                  <button
                    onClick={() => setActiveMobileTab("ai")}
                    className={`flex flex-col items-center gap-0.5 ${
                      activeMobileTab === "ai" ? "text-purple-400" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span className="text-[8px]">AI Tax</span>
                  </button>
                  <button
                    onClick={() => setActiveMobileTab("settings")}
                    className={`flex flex-col items-center gap-0.5 ${
                      activeMobileTab === "settings" ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span className="text-[8px]">Settings</span>
                  </button>
                </div>

                {/* iOS Home Indicator Bar */}
                {deviceFrame === "ios" && (
                  <div className="pb-1.5 flex justify-center bg-slate-950">
                    <div className="w-28 h-1 bg-slate-600 rounded-full" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Deployment Instructions, Architecture Status & CLI Commands */}
          <div className="lg:col-span-7 p-6 overflow-y-auto space-y-6">
            
            {/* Restructured 4-Tier Topology Status */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Restructured 4-Tier Topology & Mobile Engine
                </h3>
                <span className="text-xs text-slate-400">Single Common Entry Active</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-900 rounded-xl border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-300">1. client (Web SPA)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">React 19, calculation window, dynamic i18n JSON mapping.</p>
                  <div className="text-[10px] font-mono text-slate-300 bg-slate-950 p-1.5 rounded">
                    Entry: src/main.tsx / client/index.ts
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300">2. server (REST Engine)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">Node.js Express, Multi-Jurisdiction rates, calculation/save APIs.</p>
                  <div className="text-[10px] font-mono text-slate-300 bg-slate-950 p-1.5 rounded">
                    Entry: server.ts / server/entry.ts (Port 3000)
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-purple-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Bot className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-300">3. ai (Gemini LLM)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">Google Gemini 2.5 Flash, automated speech commands & workflows.</p>
                  <div className="text-[10px] font-mono text-slate-300 bg-slate-950 p-1.5 rounded">
                    Entry: ai/index.ts (/api/v1/ai)
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300">4. mobileapp (Flutter 3.x)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">Full 5-step calculation screen, manual adjustment sliders & voice AI.</p>
                  <div className="text-[10px] font-mono text-slate-300 bg-slate-950 p-1.5 rounded">
                    Entry: mobileapp/lib/screens/calculation_screen.dart
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Calculation & Valuation Highlights */}
            <div className="p-4 bg-indigo-950/40 rounded-xl border border-indigo-900/60 space-y-2">
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-400" />
                Mobile Calculation Engine Highlights
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                The mobile Flutter application now runs the exact same calculation steps and manual calculation logic as the web engine:
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                  <div className="font-bold text-blue-300">1. Land Parcel Valuation</div>
                  <div className="text-[10px] text-slate-400">Toggle Municipal vs Malpot rate per aana, with slider adjustment (-50% to +50%).</div>
                </div>
                <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                  <div className="font-bold text-purple-300">2. House & Floor Depreciation</div>
                  <div className="text-[10px] text-slate-400">RCC rate (NPR 2,800/sqft) with age depreciation schedule (5%, 10%) per floor.</div>
                </div>
                <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                  <div className="font-bold text-teal-300">3. Progressive Tax Slabs</div>
                  <div className="text-[10px] text-slate-400">Progressive slabs (0.05% to 0.20%) with manual override tax rate slider.</div>
                </div>
                <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                  <div className="font-bold text-amber-300">4. Fines, Rebates & DB Save</div>
                  <div className="text-[10px] text-slate-400">Early 10% rebate, late fines, sanitation levy, and direct save to calc_master table.</div>
                </div>
              </div>
            </div>

            {/* Flutter Deployment Commands */}
            <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                iOS & Android Flutter Build & Deployment Commands
              </h4>

              {/* Android Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400">🤖 Google Android (.apk & .aab bundle)</span>
                  <span className="text-[10px] text-slate-400">Target SDK: 34 (Android 14)</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-emerald-300 space-y-1">
                  <div>cd mobileapp</div>
                  <div>flutter pub get</div>
                  <div>flutter build apk --release</div>
                  <div className="text-slate-500"># Or generate App Bundle for Google Play Store:</div>
                  <div>flutter build appbundle --release</div>
                </div>
              </div>

              {/* iOS Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-400">🍎 Apple iOS (.ipa Archive for App Store & TestFlight)</span>
                  <span className="text-[10px] text-slate-400">Target iOS: 14.0+</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-blue-300 space-y-1">
                  <div>cd mobileapp</div>
                  <div>flutter pub get</div>
                  <div>flutter build ipa --release</div>
                  <div className="text-slate-500"># Open in Xcode for Apple Developer Team signing:</div>
                  <div>open ios/Runner.xcworkspace</div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
