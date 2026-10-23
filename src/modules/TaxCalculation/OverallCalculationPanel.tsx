import React, { useState, useEffect } from "react";
import { ApiController } from "../../api/controller.ts";
import { TaxLiabilityComparisonChart } from "../../components/TaxLiabilityComparisonChart.tsx";
import {
  Calculator,
  Search,
  Filter,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
  TrendingUp,
  Layers,
  MapPin,
  Home,
  DollarSign,
  Plus,
  Trash2,
  Printer,
  Sparkles,
  RefreshCw,
  BarChart3,
  Calendar,
  Eye,
  Sliders,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

export const OverallCalculationPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"calculator" | "history" | "comparison">("calculator");
  const [loading, setLoading] = useState(false);
  const [taxpayers, setTaxpayers] = useState<any[]>([]);
  const [filteredTaxpayers, setFilteredTaxpayers] = useState<any[]>([]);
  const [selectedTaxpayerId, setSelectedTaxpayerId] = useState<number>(1);
  const [dossier, setDossier] = useState<any>(null);
  const [masters, setMasters] = useState<any>({
    fiscalYears: [],
    units: [],
    constructionTypes: [],
    landRates: [],
    malpotRates: [],
    constructionRates: [],
    depreciations: [],
    fineRebates: []
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<number>(2);

  // Formula Parameters & Adjustments (Configurable on Frontend)
  const [useMalpotRate, setUseMalpotRate] = useState<boolean>(false);
  const [customTaxRatePercent, setCustomTaxRatePercent] = useState<number>(0.10);
  const [overrideAutoTaxRate, setOverrideAutoTaxRate] = useState<boolean>(false);
  const [landAdjustPercent, setLandAdjustPercent] = useState<number>(0);
  const [structureAdjustPercent, setStructureAdjustPercent] = useState<number>(0);
  const [monthsElapsed, setMonthsElapsed] = useState<number>(2);
  const [fineRebateFactor, setFineRebateFactor] = useState<"rebate_10" | "none" | "fine_10" | "fine_20">("rebate_10");
  const [additionalSanitationFee, setAdditionalSanitationFee] = useState<number>(500);
  const [additionalServiceChargePercent, setAdditionalServiceChargePercent] = useState<number>(1.0);

  // Calculation Breakdown State (Structured for calc_master, calc_land, calc_house, calc_floor, calc_additional)
  const [calcLands, setCalcLands] = useState<any[]>([]);
  const [calcHouses, setCalcHouses] = useState<any[]>([]);
  const [calcFloors, setCalcFloors] = useState<any[]>([]);
  const [calcAdditionals, setCalcAdditionals] = useState<any[]>([]);
  const [calcMasterData, setCalcMasterData] = useState<any>({
    totalLandAmount: 0,
    totalStructureAmount: 0,
    totalPropertyValuation: 0,
    baseTaxLiability: 0,
    fineAmount: 0,
    rebateAmount: 0,
    additionalAmount: 0,
    totalTax: 0
  });

  // Save & History State
  const [savingCalc, setSavingCalc] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);

  // Load masters & taxpayers
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [mastersRes, tpRes] = await Promise.all([
        ApiController.getPropertyMasters(),
        ApiController.getTaxpayers()
      ]);

      if (mastersRes.success && mastersRes.data) {
        setMasters(mastersRes.data);
      }
      if (tpRes.success && tpRes.data) {
        setTaxpayers(tpRes.data);
        setFilteredTaxpayers(tpRes.data);
        if (tpRes.data.length > 0 && !selectedTaxpayerId) {
          setSelectedTaxpayerId(tpRes.data[0].id);
        }
      }
    } catch (e) {
      console.warn("Failed to load initial calculation data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter taxpayers by search & ward
  useEffect(() => {
    let list = taxpayers;
    if (selectedWard !== "all") {
      list = list.filter((tp) => tp.ward_no === Number(selectedWard));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (tp) =>
          tp.fullanme?.toLowerCase().includes(q) ||
          tp.code?.toLowerCase().includes(q) ||
          tp.pan_vat_no?.toLowerCase().includes(q) ||
          tp.citizenship_no?.toLowerCase().includes(q) ||
          tp.mobile_no?.toLowerCase().includes(q)
      );
    }
    setFilteredTaxpayers(list);
  }, [searchQuery, selectedWard, taxpayers]);

  // Load Dossier when selected taxpayer changes
  const loadDossier = async (tpId: number) => {
    try {
      const res = await ApiController.getTaxpayerDossier(tpId);
      if (res.success && res.data) {
        setDossier(res.data);
      }
    } catch (e) {
      console.warn("Failed to load dossier", e);
    }
  };

  useEffect(() => {
    if (selectedTaxpayerId) {
      loadDossier(selectedTaxpayerId);
    }
  }, [selectedTaxpayerId]);

  // Load calculation history
  const loadHistory = async () => {
    try {
      const res = await ApiController.getCalculationHistory();
      if (res.success && res.data) {
        setHistoryList(res.data);
      }
    } catch (e) {
      console.warn("Failed to load calculation history", e);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      loadHistory();
    }
  }, [activeTab]);

  // AUTO-CALCULATION ENGINE (Executes dynamically whenever inputs/taxpayer/formula changes)
  useEffect(() => {
    if (!dossier) return;

    // 1. Calculate Lands (calc_land)
    const lands = dossier.lands || [];
    let sumLandValuation = 0;

    const computedLands = lands.map((l: any) => {
      // Choose rate based on switch
      const applicableRateItem = useMalpotRate
        ? masters.malpotRates.find((r: any) => r.id === l.malpot_rate_id)
        : masters.landRates.find((r: any) => r.id === l.land_rate_id);

      const ratePerAana = applicableRateItem ? Number(applicableRateItem.rate_per_unit) : 800000;
      // Convert area_sqfeet to aana for valuation (342.25 sqft = 1 aana)
      const aanaCount = l.area_sqfeet / 342.25;
      const baseCalcAmount = Math.round(aanaCount * ratePerAana);

      // Adjustment
      const addAmount = landAdjustPercent > 0 ? Math.round(baseCalcAmount * (landAdjustPercent / 100)) : 0;
      const subAmount = landAdjustPercent < 0 ? Math.round(baseCalcAmount * (Math.abs(landAdjustPercent) / 100)) : 0;
      const totalAmount = Math.max(0, baseCalcAmount + addAmount - subAmount);

      sumLandValuation += totalAmount;

      return {
        land_id: l.id,
        kitta_number: l.kitta_number,
        ward_no: l.ward_no,
        unit_id: l.unit_id || l.land_measuring_unit_id || 1,
        area_sqft: l.area_sqfeet,
        rate_applied: ratePerAana,
        rate_source: useMalpotRate ? "Malpot Statutory" : "Municipal Land Rate",
        calculated_amount: baseCalcAmount,
        calculated_add_amount: addAmount,
        calculated_subtract_amount: subAmount,
        calculated_total_amount: totalAmount,
        self_declared_amount: totalAmount,
        total_amount: totalAmount
      };
    });
    setCalcLands(computedLands);

    // 2. Calculate Houses & Floors (calc_house, calc_floor)
    const houses = dossier.houses || [];
    const floors = dossier.floors || [];
    let sumStructureValuation = 0;

    const computedFloors = floors.map((fl: any) => {
      const cr = masters.constructionRates.find((r: any) => r.id === fl.rate_id) || masters.constructionRates[0];
      const ratePerSqft = cr ? Number(cr.rate_per_unit) : 2800;
      const depRate = fl.depreciation_percent !== undefined ? Number(fl.depreciation_percent) : 5.0;

      const rawAmount = Math.round(fl.area_sqfeet * ratePerSqft);
      const depAmount = Math.round(rawAmount * (depRate / 100));
      const netFloorAmount = Math.max(0, rawAmount - depAmount);

      const addAmount = structureAdjustPercent > 0 ? Math.round(netFloorAmount * (structureAdjustPercent / 100)) : 0;
      const subAmount = structureAdjustPercent < 0 ? Math.round(netFloorAmount * (Math.abs(structureAdjustPercent) / 100)) : 0;
      const totalFloorAmount = Math.max(0, netFloorAmount + addAmount - subAmount);

      sumStructureValuation += totalFloorAmount;

      return {
        floor_id: fl.id,
        house_id: fl.house_id,
        floor_no: fl.floor_no,
        area_in_sqft: fl.area_sqfeet,
        construction_rate: ratePerSqft,
        depreciation_rate: depRate,
        calculated_amount: rawAmount,
        depreciation_amount: depAmount,
        calculated_add_amount: addAmount,
        calculated_subtract_amount: subAmount,
        calculated_total_amount: totalFloorAmount,
        self_declared_amount: totalFloorAmount,
        total_amount: totalFloorAmount
      };
    });
    setCalcFloors(computedFloors);

    const computedHouses = houses.map((h: any) => {
      const houseFloors = computedFloors.filter((fl: any) => fl.house_id === h.id);
      const houseTotal = houseFloors.reduce((acc: number, f: any) => acc + f.total_amount, 0);
      const houseCalcAmount = houseFloors.reduce((acc: number, f: any) => acc + f.calculated_amount, 0);
      const houseDepAmount = houseFloors.reduce((acc: number, f: any) => acc + f.depreciation_amount, 0);

      return {
        house_id: h.id,
        house_no: h.house_no,
        area_sqft: h.area_sqfeet,
        unit_id: h.measuring_unit_id || 1,
        depreciation_rate: 5.0,
        calculated_amount: houseCalcAmount,
        depreciation_amount: houseDepAmount,
        calculated_add_amount: 0,
        calculated_subtract_amount: 0,
        calculated_total_amount: houseTotal,
        self_declared_amount: houseTotal,
        total_amount: houseTotal
      };
    });
    setCalcHouses(computedHouses);

    // 3. Total Valuation & Slab Tax Computation
    const totalPropertyValuation = sumLandValuation + sumStructureValuation;

    let appliedTaxRate = customTaxRatePercent;
    if (!overrideAutoTaxRate) {
      if (totalPropertyValuation > 10000000) appliedTaxRate = 0.20;
      else if (totalPropertyValuation > 5000000) appliedTaxRate = 0.15;
      else if (totalPropertyValuation > 1000000) appliedTaxRate = 0.10;
      else appliedTaxRate = 0.05;
    }

    const baseTax = Math.round((totalPropertyValuation * appliedTaxRate) / 100);

    // 4. Fine & Rebate Calculation
    let fineAmt = 0;
    let rebateAmt = 0;
    if (fineRebateFactor === "rebate_10") {
      rebateAmt = Math.round(baseTax * 0.10);
    } else if (fineRebateFactor === "fine_10") {
      fineAmt = Math.round(baseTax * 0.10);
    } else if (fineRebateFactor === "fine_20") {
      fineAmt = Math.round(baseTax * 0.20);
    }

    // 5. Additional Fees (calc_additional)
    const svcCharge = Math.round(baseTax * (additionalServiceChargePercent / 100));
    const additionals = [
      {
        collection_rate_id: 1,
        name: "Municipal Sanitation & Waste Levy",
        flatamount: additionalSanitationFee,
        percent: 0,
        amount: additionalSanitationFee
      },
      {
        collection_rate_id: 2,
        name: "Municipal Infrastructure Service Cess",
        flatamount: 0,
        percent: additionalServiceChargePercent,
        amount: svcCharge
      }
    ];
    setCalcAdditionals(additionals);

    const totalAdditionals = additionals.reduce((acc, a) => acc + a.amount, 0);
    const finalTotalTax = Math.max(0, baseTax + fineAmt - rebateAmt + totalAdditionals);

    setCalcMasterData({
      totalLandAmount: sumLandValuation,
      totalStructureAmount: sumStructureValuation,
      totalPropertyValuation,
      appliedTaxRate,
      baseTaxLiability: baseTax,
      fineAmount: fineAmt,
      rebateAmount: rebateAmt,
      additionalAmount: totalAdditionals,
      totalTax: finalTotalTax
    });
  }, [
    dossier,
    masters,
    useMalpotRate,
    overrideAutoTaxRate,
    customTaxRatePercent,
    landAdjustPercent,
    structureAdjustPercent,
    fineRebateFactor,
    additionalSanitationFee,
    additionalServiceChargePercent
  ]);

  // Handle Save Calculation to Database (calc_master, calc_land, calc_house, calc_floor, calc_additional)
  const handleSaveCalculation = async () => {
    if (!selectedTaxpayerId) return;
    setSavingCalc(true);
    setSaveSuccessMsg(null);

    const payload = {
      taxpayer_id: selectedTaxpayerId,
      fiscal_year_id: selectedFiscalYearId,
      total_tax: calcMasterData.totalTax,
      calculate_date_bs: "2081-05-15",
      insert_by: 1,
      lands: calcLands.map((l) => ({
        land_id: l.land_id,
        unit_id: l.unit_id,
        area_sqft: l.area_sqft,
        calculated_amount: l.calculated_amount,
        calculated_add_amount: l.calculated_add_amount,
        calculated_subtract_amount: l.calculated_subtract_amount,
        calculated_total_amount: l.calculated_total_amount,
        self_declared_amount: l.self_declared_amount,
        total_amount: l.total_amount
      })),
      houses: calcHouses.map((h) => ({
        house_id: h.house_id,
        area_sqft: h.area_sqft,
        unit_id: h.unit_id,
        depreciation_rate: h.depreciation_rate,
        calculated_amount: h.calculated_amount,
        depreciation_amount: h.depreciation_amount,
        calculated_add_amount: h.calculated_add_amount,
        calculated_subtract_amount: h.calculated_subtract_amount,
        calculated_total_amount: h.calculated_total_amount,
        self_declared_amount: h.self_declared_amount,
        total_amount: h.total_amount
      })),
      floors: calcFloors.map((fl) => ({
        floor_id: fl.floor_id,
        area_in_sqft: fl.area_in_sqft,
        depreciation_rate: fl.depreciation_rate,
        calculated_amount: fl.calculated_amount,
        depreciation_amount: fl.depreciation_amount,
        calculated_add_amount: fl.calculated_add_amount,
        calculated_subtract_amount: fl.calculated_subtract_amount,
        calculated_total_amount: fl.calculated_total_amount,
        self_declared_amount: fl.self_declared_amount,
        total_amount: fl.total_amount
      })),
      additionals: calcAdditionals.map((a) => ({
        collection_rate_id: a.collection_rate_id,
        amount: a.amount,
        flatamount: a.flatamount,
        percent: a.percent
      }))
    };

    try {
      const res = await ApiController.saveTaxCalculation(payload);
      if (res.success) {
        setSaveSuccessMsg(`Tax Calculation #${res.data?.master?.id || "Saved"} registered successfully in municipal calc_master database!`);
        setTimeout(() => setSaveSuccessMsg(null), 5000);
      }
    } catch (e) {
      console.error("Failed to save calculation", e);
    } finally {
      setSavingCalc(false);
    }
  };

  const currentTaxpayer = taxpayers.find((tp) => tp.id === selectedTaxpayerId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>gtax Municipal Platform</span>
            <span>·</span>
            <span className="font-semibold text-indigo-600">Tax Calculation Master Engine</span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Municipal Property Tax Calculation & Assessment Panel
          </h2>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("calculator")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "calculator"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculation Studio</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "history"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Saved Records (calc_master)</span>
          </button>
          <button
            onClick={() => setActiveTab("comparison")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "comparison"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Cross-Year Visualization</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
            calc_master · calc_land · calc_house · calc_floor · calc_additional
          </span>
        </div>
      )}

      {/* VIEW 1: CALCULATOR STUDIO */}
      {activeTab === "calculator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Taxpayer Selector & Filter Panel (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" />
                  Taxpayer Filter & Selection
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  {filteredTaxpayers.length} Taxpayers
                </span>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter name, citizen ID, mobile, PAN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Ward Filter & Fiscal Year Selectors */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Ward Filter</label>
                  <select
                    value={selectedWard}
                    onChange={(e) => setSelectedWard(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="all">All Municipal Wards</option>
                    <option value="1">Ward No. 1</option>
                    <option value="2">Ward No. 2</option>
                    <option value="3">Ward No. 3</option>
                    <option value="4">Ward No. 4</option>
                    <option value="5">Ward No. 5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Fiscal Year</label>
                  <select
                    value={selectedFiscalYearId}
                    onChange={(e) => setSelectedFiscalYearId(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    {masters.fiscalYears.map((fy: any) => (
                      <option key={fy.id} value={fy.id}>
                        {fy.code} ({fy.fullname ? fy.fullname.split("(")[0] : "BS"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Taxpayers Scrollable List */}
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 no-scrollbar pt-1">
                {filteredTaxpayers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No taxpayers matching your criteria.
                  </div>
                ) : (
                  filteredTaxpayers.map((tp) => {
                    const isSelected = tp.id === selectedTaxpayerId;
                    return (
                      <div
                        key={tp.id}
                        onClick={() => setSelectedTaxpayerId(tp.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-300 shadow-xs ring-1 ring-indigo-400/30"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {tp.fullanme}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            Ward #{tp.ward_no}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-0.5">
                          <span>{tp.code}</span>
                          <span>PAN: {tp.pan_vat_no || "N/A"}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Formula Controls Panel (Frontend Calculation Customization) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  Calculation Formula Parameters
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                  Auto Engine
                </span>
              </div>

              {/* Rate Matrix Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Valuation Rate Basis
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setUseMalpotRate(false)}
                    className={`px-2.5 py-1.5 rounded-xl font-bold border text-left transition-all ${
                      !useMalpotRate
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Municipal Land Rate
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseMalpotRate(true)}
                    className={`px-2.5 py-1.5 rounded-xl font-bold border text-left transition-all ${
                      useMalpotRate
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Malpot Statutory Rate
                  </button>
                </div>
              </div>

              {/* Tax Slab Overrides */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700">Property Tax Slab Rate</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      id="overrideSlab"
                      checked={overrideAutoTaxRate}
                      onChange={(e) => setOverrideAutoTaxRate(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <label htmlFor="overrideSlab" className="text-[10px] text-slate-500 cursor-pointer">
                      Manual Override
                    </label>
                  </div>
                </div>
                {overrideAutoTaxRate ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={customTaxRatePercent}
                      onChange={(e) => setCustomTaxRatePercent(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-200 bg-white"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                ) : (
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] font-mono text-slate-600 flex justify-between">
                    <span>Statutory Tier:</span>
                    <span className="font-bold text-indigo-600">
                      {calcMasterData.appliedTaxRate}%
                    </span>
                  </div>
                )}
              </div>

              {/* Fine & Rebate Factor */}
              <div className="text-xs">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Fine & Rebate Policy (tbl_fine_rebate)
                </label>
                <select
                  value={fineRebateFactor}
                  onChange={(e) => setFineRebateFactor(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="rebate_10">Early Payment Discount (-10% Rebate)</option>
                  <option value="none">Standard Timely Payment (0%)</option>
                  <option value="fine_10">Late Payment Arrears (+10% Fine)</option>
                  <option value="fine_20">Prolonged Default Overdue (+20% Fine)</option>
                </select>
              </div>

              {/* Adjustments */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Land Adj % (+/-)
                  </label>
                  <input
                    type="number"
                    value={landAdjustPercent}
                    onChange={(e) => setLandAdjustPercent(Number(e.target.value))}
                    className="w-full px-2.5 py-1 text-xs font-mono rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Structure Adj % (+/-)
                  </label>
                  <input
                    type="number"
                    value={structureAdjustPercent}
                    onChange={(e) => setStructureAdjustPercent(Number(e.target.value))}
                    className="w-full px-2.5 py-1 text-xs font-mono rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Property Breakdown & Calculation Engine (8 Cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Taxpayer Card Header */}
            {currentTaxpayer && (
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-lg">
                    {currentTaxpayer.fullanme.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>{currentTaxpayer.fullanme}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
                        {currentTaxpayer.code}
                      </span>
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                      <span>Ward: {currentTaxpayer.ward_no}</span>
                      <span>PAN: {currentTaxpayer.pan_vat_no || "N/A"}</span>
                      <span>Mobile: {currentTaxpayer.mobile_no}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveCalculation}
                  disabled={savingCalc}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingCalc ? "Saving Calculation..." : "Save Calculation to Database"}</span>
                </button>
              </div>
            )}

            {/* 1. calc_land Breakdown Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Land Parcels Valuation Breakdown (calc_land)
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Total Land: Rs. {calcMasterData.totalLandAmount.toLocaleString()}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <tr>
                      <th className="p-3">Kitta No</th>
                      <th className="p-3">Ward</th>
                      <th className="p-3">Area (Sq.Ft)</th>
                      <th className="p-3">Rate / Basis</th>
                      <th className="p-3">Calc Amount</th>
                      <th className="p-3">Adj (+/-)</th>
                      <th className="p-3 text-right">Total Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calcLands.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          No land parcels found for this taxpayer.
                        </td>
                      </tr>
                    ) : (
                      calcLands.map((l: any) => (
                        <tr key={l.land_id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-mono font-bold text-slate-900">
                            {l.kitta_number}
                          </td>
                          <td className="p-3 font-mono">Ward #{l.ward_no}</td>
                          <td className="p-3 font-mono">{l.area_sqft} sqft</td>
                          <td className="p-3 font-mono text-[11px]">
                            Rs. {l.rate_applied.toLocaleString()} / aana
                          </td>
                          <td className="p-3 font-mono text-slate-600">
                            Rs. {l.calculated_amount.toLocaleString()}
                          </td>
                          <td className="p-3 font-mono text-[11px]">
                            {l.calculated_add_amount > 0 && (
                              <span className="text-emerald-600">+{l.calculated_add_amount}</span>
                            )}
                            {l.calculated_subtract_amount > 0 && (
                              <span className="text-rose-600">-{l.calculated_subtract_amount}</span>
                            )}
                            {l.calculated_add_amount === 0 && l.calculated_subtract_amount === 0 && (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-600 text-right">
                            Rs. {l.total_amount.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. calc_house & calc_floor Breakdown Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Structure & Floor Breakdown (calc_house & calc_floor)
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  Total Structure: Rs. {calcMasterData.totalStructureAmount.toLocaleString()}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                    <tr>
                      <th className="p-3">Floor Unit</th>
                      <th className="p-3">Area (Sq.Ft)</th>
                      <th className="p-3">Const. Rate</th>
                      <th className="p-3">Gross Valuation</th>
                      <th className="p-3">Deprec. %</th>
                      <th className="p-3">Deprec. Amount</th>
                      <th className="p-3 text-right">Net Value (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calcFloors.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          No building structures or floor units found.
                        </td>
                      </tr>
                    ) : (
                      calcFloors.map((fl: any) => (
                        <tr key={fl.floor_id} className="hover:bg-slate-50/60">
                          <td className="p-3 font-bold text-slate-900">
                            Floor Slab #{fl.floor_no}
                          </td>
                          <td className="p-3 font-mono">{fl.area_in_sqft} sqft</td>
                          <td className="p-3 font-mono text-[11px]">
                            Rs. {fl.construction_rate}/sqft
                          </td>
                          <td className="p-3 font-mono text-slate-600">
                            Rs. {fl.calculated_amount.toLocaleString()}
                          </td>
                          <td className="p-3 font-mono text-amber-600 font-bold">
                            {fl.depreciation_rate}%
                          </td>
                          <td className="p-3 font-mono text-rose-600">
                            -Rs. {fl.depreciation_amount.toLocaleString()}
                          </td>
                          <td className="p-3 font-mono font-bold text-purple-600 text-right">
                            Rs. {fl.total_amount.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. calc_additional Fees Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Additional Levies & Collection Items (calc_additional)
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Total Levies: Rs. {calcMasterData.additionalAmount.toLocaleString()}
                </span>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {calcAdditionals.map((a: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{a.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {a.flatamount > 0 ? `Flat Rs. ${a.flatamount}` : `${a.percent}% Base Liability`}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      Rs. {a.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grand Summary Card (calc_master) */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-950 text-white shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span className="font-bold text-sm tracking-wide">
                    Consolidated Tax Assessment Summary (calc_master)
                  </span>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  FY 2081/82 BS
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-slate-400">Total Assessed Property</div>
                  <div className="font-mono font-bold text-sm mt-0.5">
                    Rs. {calcMasterData.totalPropertyValuation.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-slate-400">Base Tax ({calcMasterData.appliedTaxRate}%)</div>
                  <div className="font-mono font-bold text-sm mt-0.5 text-indigo-300">
                    Rs. {calcMasterData.baseTaxLiability.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-slate-400">Fine (+) / Rebate (-)</div>
                  <div className="font-mono font-bold text-sm mt-0.5">
                    {calcMasterData.rebateAmount > 0 && (
                      <span className="text-emerald-400">-Rs. {calcMasterData.rebateAmount.toLocaleString()}</span>
                    )}
                    {calcMasterData.fineAmount > 0 && (
                      <span className="text-rose-400">+Rs. {calcMasterData.fineAmount.toLocaleString()}</span>
                    )}
                    {calcMasterData.rebateAmount === 0 && calcMasterData.fineAmount === 0 && (
                      <span className="text-slate-400">Rs. 0</span>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[11px] text-slate-400">Additional Charges</div>
                  <div className="font-mono font-bold text-sm mt-0.5 text-teal-300">
                    +Rs. {calcMasterData.additionalAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-300">Net Payable Total Municipal Tax:</span>
                  <div className="text-2xl font-black font-mono text-emerald-400">
                    Rs. {calcMasterData.totalTax.toLocaleString()}
                  </div>
                </div>

                <button
                  onClick={handleSaveCalculation}
                  disabled={savingCalc}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{savingCalc ? "Recording to DB..." : "Commit & Save Calculation to calc_master"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SAVED CALCULATION RECORDS (calc_master History) */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Municipal Tax Calculation Master Registry (tbl_calc_master)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Official persistent records of all property tax calculations performed and certified in the system.
              </p>
            </div>
            <button
              onClick={loadHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh History</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase">
                <tr>
                  <th className="p-3">Record ID</th>
                  <th className="p-3">Taxpayer Name</th>
                  <th className="p-3">Fiscal Year</th>
                  <th className="p-3">Date (BS)</th>
                  <th className="p-3">Land Parcels</th>
                  <th className="p-3">Floors Evaluated</th>
                  <th className="p-3 font-bold text-right">Total Tax (Rs.)</th>
                  <th className="p-3 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No saved calculations found in registry. Perform a calculation and click "Save Calculation".
                    </td>
                  </tr>
                ) : (
                  historyList.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-mono font-bold text-indigo-600">
                        CALC-{rec.id.toString().padStart(4, "0")}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {rec.taxpayer_name}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {rec.fiscal_year_name}
                      </td>
                      <td className="p-3 font-mono text-slate-500">
                        {rec.calculate_date_bs}
                      </td>
                      <td className="p-3 font-mono">
                        {rec.lands_count} parcels
                      </td>
                      <td className="p-3 font-mono">
                        {rec.floors_count} floor slabs
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-600 text-right">
                        Rs. {Number(rec.total_tax).toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedHistoryItem(rec)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors"
                        >
                          View Breakdown
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: CROSS-YEAR VISUALIZATION (Recharts) */}
      {activeTab === "comparison" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <TaxLiabilityComparisonChart initialTaxpayerId={selectedTaxpayerId} />
        </div>
      )}

      {/* History Inspection Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Certified Tax Assessment Breakdown (CALC-{selectedHistoryItem.id})
                </h3>
                <div className="text-xs text-slate-500">
                  Taxpayer: {selectedHistoryItem.taxpayer_name} · FY: {selectedHistoryItem.fiscal_year_name}
                </div>
              </div>
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Official Municipal Tax Assessed:</span>
              <span className="font-black font-mono text-base text-emerald-600">
                Rs. {Number(selectedHistoryItem.total_tax).toLocaleString()}
              </span>
            </div>

            {/* Land items in this calculation */}
            {selectedHistoryItem.lands && selectedHistoryItem.lands.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Evaluated Lands (calc_land)
                </h4>
                <div className="space-y-1.5 text-xs">
                  {selectedHistoryItem.lands.map((l: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-white flex justify-between">
                      <span className="font-mono">Land #{l.land_id} · {l.area_sqft} sq.ft</span>
                      <span className="font-mono font-bold text-slate-900">
                        Rs. {Number(l.total_amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Floor items in this calculation */}
            {selectedHistoryItem.floors && selectedHistoryItem.floors.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Evaluated Floors (calc_floor)
                </h4>
                <div className="space-y-1.5 text-xs">
                  {selectedHistoryItem.floors.map((fl: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg border border-slate-200 bg-white flex justify-between">
                      <span className="font-mono">Floor Slab #{fl.floor_id} · {fl.area_in_sqft} sq.ft (Deprec: {fl.depreciation_rate}%)</span>
                      <span className="font-mono font-bold text-slate-900">
                        Rs. {Number(fl.total_amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
