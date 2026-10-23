import React, { useState, useEffect } from "react";
import { ApiController } from "../../api/controller.ts";
import { SupportedLang, translations } from "../../utils/i18n.ts";
import {
  Calendar,
  Layers,
  Percent,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck2,
  Sliders,
  DollarSign,
  Building,
  TrendingDown,
  Gift,
  Trees,
  Building2,
  Settings,
  Landmark
} from "lucide-react";

export type RateTab =
  | "land_rate"
  | "malpot_rate"
  | "construction_rate"
  | "depreciation"
  | "fine_rebate"
  | "property_range"
  | "fiscal_year"
  | "construction_type"
  | "unit"
  | "land_nature"
  | "company"
  | "application_setting";

interface RatesMasterPanelProps {
  currentLang: SupportedLang;
  initialTab?: RateTab;
  filterGroup?: "rate" | "masters" | "rbac" | "all";
}

export const RatesMasterPanel: React.FC<RatesMasterPanelProps> = ({
  currentLang,
  initialTab = "land_rate",
  filterGroup = "all"
}) => {
  const t = translations[currentLang];
  const [activeTab, setActiveTab] = useState<RateTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [masters, setMasters] = useState<{
    fiscalYears: any[];
    units: any[];
    landNatures: any[];
    constructionTypes: any[];
    landRates: any[];
    malpotRates: any[];
    constructionRates: any[];
    depreciations: any[];
    fineRebates: any[];
    propertyRanges: any[];
    companies: any[];
    applicationSettings: any[];
  }>({
    fiscalYears: [],
    units: [],
    landNatures: [],
    constructionTypes: [],
    landRates: [],
    malpotRates: [],
    constructionRates: [],
    depreciations: [],
    fineRebates: [],
    propertyRanges: [],
    companies: [],
    applicationSettings: []
  });

  // Modal State for Add & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await ApiController.getPropertyMasters();
      if (res.success && res.data) {
        setMasters((prev) => ({
          ...prev,
          ...res.data,
          propertyRanges: (res.data as any).propertyRanges || prev.propertyRanges || []
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleRatesUpdated = () => {
      loadData();
    };

    window.addEventListener("gtax:rates_updated", handleRatesUpdated);
    return () => {
      window.removeEventListener("gtax:rates_updated", handleRatesUpdated);
    };
  }, []);

  const allTabConfigs: { id: RateTab; label: string; sub: string; icon: any; count: number; group: "rate" | "masters" | "rbac" }[] = [
    // Rates Group
    { id: "land_rate", label: "Land Rate", sub: "Land rate matrix", icon: DollarSign, count: masters.landRates.length, group: "rate" },
    { id: "malpot_rate", label: "Malpot Rate", sub: "Statutory government valuation", icon: Layers, count: masters.malpotRates.length, group: "rate" },
    { id: "construction_rate", label: "Construction Rate", sub: "Structure rate per sqft", icon: Building, count: masters.constructionRates.length, group: "rate" },
    { id: "depreciation", label: "Depreciation Rate", sub: "Age-based reduction schedule", icon: TrendingDown, count: masters.depreciations.length, group: "rate" },
    { id: "fine_rebate", label: "Fine and Rebate", sub: "Discount & late fine tiers", icon: Gift, count: masters.fineRebates.length, group: "rate" },
    { id: "property_range", label: "Property Range", sub: "tbl_property_range tax slabs", icon: Sliders, count: masters.propertyRanges.length, group: "rate" },

    // Masters Group
    { id: "fiscal_year", label: "Fiscal Year", sub: "Municipal accounting calendar", icon: Calendar, count: masters.fiscalYears.length, group: "masters" },
    { id: "construction_type", label: "Construction Types", sub: "Building structure classifications", icon: Building, count: masters.constructionTypes.length, group: "masters" },
    { id: "unit", label: "Measurement Unit", sub: "Ropani, Bigha, Sq.Ft, Sq.Metre", icon: Sliders, count: masters.units.length, group: "masters" },
    { id: "land_nature", label: "Land Nature", sub: "Zoning & residential classifications", icon: Trees, count: masters.landNatures.length, group: "masters" },

    // RBAC Group
    { id: "company", label: "Company", sub: "Municipal organization entity", icon: Landmark, count: masters.companies.length, group: "rbac" },
    { id: "application_setting", label: "Application Settings", sub: "Global system configuration", icon: Settings, count: masters.applicationSettings.length, group: "rbac" }
  ];

  const tabConfigs = allTabConfigs.filter((t) => {
    if (filterGroup === "all") return true;
    return t.group === filterGroup;
  });

  const getCurrentList = () => {
    switch (activeTab) {
      case "fiscal_year": return masters.fiscalYears;
      case "unit": return masters.units;
      case "land_rate": return masters.landRates;
      case "malpot_rate": return masters.malpotRates;
      case "construction_type": return masters.constructionTypes;
      case "construction_rate": return masters.constructionRates;
      case "depreciation": return masters.depreciations;
      case "fine_rebate": return masters.fineRebates;
      case "property_range": return masters.propertyRanges;
      case "land_nature": return masters.landNatures;
      case "company": return masters.companies;
      case "application_setting": return masters.applicationSettings;
      default: return [];
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    // Setup sensible defaults per activeTab
    switch (activeTab) {
      case "property_range":
        setFormData({ FiscalYearId: masters.fiscalYears[0]?.id || 2, Sn: 1, value_from: 0, value_to: 1000000, is_percent: true, tax_percent: 0.10, amount_from: 0, amount_to: 1000, above_then: 0, min_tax_amount: 300, per_unit_amount: 0, per_unit_rate: 0, is_cumuliatative: false });
        break;
      case "fiscal_year":
        setFormData({ code: "2082/83", fullname: "Fiscal Year 2082/2083 BS", date_from_bs: "2082-04-01", date_to_bs: "2083-03-31", is_active: true });
        break;
      case "unit":
        setFormData({ code: "NEW_UNIT", fullanme: "New Unit", unit_value: 100, is_active: true });
        break;
      case "land_rate":
        setFormData({ code: "LR-NEW", fullanme: "New Land Rate", fiscal_year_id: masters.fiscalYears[0]?.id || 1, unit_id: 3, rate_per_unit: 1000000, parent_id: null, area_per_unit: 1, area_upto: 10000, ward_no_ids: "1,2,3" });
        break;
      case "malpot_rate":
        setFormData({ code: "MR-NEW", fullanme: "New Malpot Rate", fiscal_year_id: masters.fiscalYears[0]?.id || 1, unit_id: 3, rate_per_unit: 500000, parent_id: null, area_per_unit: 1, area_upto: 10000, ward_no_ids: "1,2,3" });
        break;
      case "construction_type":
        setFormData({ code: "NEW_CONST", fullanme: "Timber & Brick Composite" });
        break;
      case "construction_rate":
        setFormData({ code: "CR-NEW", fullanme: "Standard Construction Rate", fiscal_year_id: masters.fiscalYears[0]?.id || 1, const_type_id: 1, unit_id: 1, rate_per_unit: 2800, parent_id: null, area_per_unit: 1, area_upto: 5000, ward_no_ids: "1,2,3" });
        break;
      case "depreciation":
        setFormData({ code: "DEP-NEW", fullanme: "Depreciation Slab 5-10 Yrs", fiscal_year_id: masters.fiscalYears[0]?.id || 1, const_type_id: 1, construction_type_id: 1, sn: 2, year_from: 6, year_to: 10, percent: 10 });
        break;
      case "fine_rebate":
        setFormData({ fiscal_year_id: masters.fiscalYears[0]?.id || 1, tax_type_id: 1, ratesn: 1, years: 0, month: 3, calcpercent: 10, ratepercent: 10, flatrate: 0, isfine: false, days: 90 });
        break;
      case "land_nature":
        setFormData({ code: "INDUSTRIAL", fullanme: "Industrial Zone (औद्योगिक क्षेत्र)" });
        break;
      case "company":
        setFormData({ code: "NEW-MUN", fullname: "New Municipality Corporation", address: "Ward 1", phone: "+977-01-0000000", email: "info@municipality.gov.np", pan_vat_no: "300000000", registration_no: "REG-2081-01", is_active: true });
        break;
      case "application_setting":
        setFormData({ company_id: 1, fiscal_year_id: 2, unit_type_id: 3, bhumikar_start_fy: 1, prop_bhumikar_start_fy: 2, ipt_start_fy: 2, municipality_name: "Kathmandu Metropolitan City", ward_count: 32, theme_preference: "slate", default_language: "eng" });
        break;
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record? (Audit trails will mark is_deleted = true)")) return;
    const res = await ApiController.deleteRateItem(activeTab, id);
    if (res.success) {
      setStatusMsg("Record deleted successfully (audit preserved)");
      loadData();
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let res: any;
    if (activeTab === "company") {
      res = await ApiController.saveCompany(formData, editingItem?.id);
    } else if (activeTab === "application_setting") {
      res = await ApiController.updateApplicationSettings(formData);
    } else {
      res = await ApiController.saveRateItem(activeTab, formData, editingItem?.id);
    }

    if (res.success) {
      setStatusMsg(editingItem ? "Record updated successfully!" : "New record created successfully!");
      setIsModalOpen(false);
      loadData();
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const currentList = getCurrentList().filter((item: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.code && item.code.toLowerCase().includes(term)) ||
      (item.fullanme && item.fullanme.toLowerCase().includes(term)) ||
      (item.fullname && item.fullname.toLowerCase().includes(term)) ||
      (item.ward_no_ids && item.ward_no_ids.includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>gtax Enterprise Rate Architecture</span>
            <span aria-hidden="true">·</span>
            <span>Master Matrices (tbl_rate)</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-indigo-600 font-semibold uppercase">{activeTab}</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            <span>Rate & Master Matrix Configuration (दररेट व्यवस्थापन)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure multi-jurisdiction land valuation, malpot rates, building construction rates, depreciation slabs, and early-payment rebate policies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Reload Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rate Record</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </span>
          <button onClick={() => setStatusMsg(null)} className="font-semibold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs navigation for all 9 rate tables */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar border-b border-slate-200 dark:border-slate-800">
        {tabConfigs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm("");
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar & Table Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={`Search ${activeTab.replace("_", " ")}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 self-start sm:self-center">
          <FileCheck2 className="w-4 h-4 text-emerald-500" />
          <span>Mandatory BaseFrame Audit Columns: insert_by, insert_on, update_by, update_on</span>
        </div>
      </div>

      {/* Dynamic Data Table for Active Rate Tab */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-3.5">ID / Code</th>
                <th className="p-3.5">Name / Description</th>
                {activeTab === "fiscal_year" && (
                  <>
                    <th className="p-3.5">Dates BS</th>
                    <th className="p-3.5">Dates AD</th>
                  </>
                )}
                {activeTab === "unit" && <th className="p-3.5">Unit Value (Sq.Ft Ratio)</th>}
                {(activeTab === "land_rate" || activeTab === "malpot_rate") && (
                  <>
                    <th className="p-3.5">Fiscal Year</th>
                    <th className="p-3.5">Rate / Unit</th>
                    <th className="p-3.5">Area Per Unit</th>
                    <th className="p-3.5">Area Upto</th>
                    <th className="p-3.5">Parent ID</th>
                    <th className="p-3.5">Applicable Wards</th>
                  </>
                )}
                {activeTab === "construction_rate" && (
                  <>
                    <th className="p-3.5">Fiscal Year</th>
                    <th className="p-3.5">Unit</th>
                    <th className="p-3.5">Rate / Sq.Ft</th>
                    <th className="p-3.5">Area Per Unit</th>
                    <th className="p-3.5">Area Upto</th>
                    <th className="p-3.5">Structure Type</th>
                    <th className="p-3.5">Parent ID</th>
                    <th className="p-3.5">Wards</th>
                  </>
                )}
                {activeTab === "depreciation" && (
                  <>
                    <th className="p-3.5">Fiscal Year</th>
                    <th className="p-3.5">Structure Type</th>
                    <th className="p-3.5">Age Range (Yrs)</th>
                    <th className="p-3.5">Depreciation %</th>
                  </>
                )}
                {activeTab === "fine_rebate" && (
                  <>
                    <th className="p-3.5">Fiscal Year</th>
                    <th className="p-3.5">Tax Type</th>
                    <th className="p-3.5">Policy</th>
                    <th className="p-3.5">Year / Month</th>
                    <th className="p-3.5">Rebate / Fine %</th>
                    <th className="p-3.5">Eligibility Days</th>
                  </>
                )}
                {activeTab === "property_range" && (
                  <>
                    <th className="p-3.5">Fiscal Year (FY)</th>
                    <th className="p-3.5">Valuation Range (From - To)</th>
                    <th className="p-3.5">Tax % / Flat Amount</th>
                    <th className="p-3.5">Min Tax Amount</th>
                    <th className="p-3.5">Above Then / Per Unit</th>
                  </>
                )}
                {activeTab === "company" && (
                  <>
                    <th className="p-3.5">Entity Address</th>
                    <th className="p-3.5">Contact (Phone / Email)</th>
                    <th className="p-3.5">PAN / Registration #</th>
                  </>
                )}
                {activeTab === "application_setting" && (
                  <>
                    <th className="p-3.5">Linked Company Ref</th>
                    <th className="p-3.5">Active Fiscal Year</th>
                    <th className="p-3.5">Default Unit / Wards</th>
                  </>
                )}
                <th className="p-3.5">Audit Stamp</th>
                <th className="p-3.5 text-right">Actions (Edit / Delete)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No rate records found for this category or filter.
                  </td>
                </tr>
              ) : (
                currentList.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {item.code || `ID-${item.id}`}
                    </td>
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">
                      {item.fullanme || item.fullname || (item.isfine ? "Fine Rule" : "Rebate Policy")}
                    </td>

                    {/* Fiscal Year Columns */}
                    {activeTab === "fiscal_year" && (
                      <>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                          {item.date_from_bs} to {item.date_to_bs}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">
                          {item.date_from_ad} to {item.date_to_ad}
                        </td>
                      </>
                    )}

                    {/* Unit Columns */}
                    {activeTab === "unit" && (
                      <td className="p-3.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.unit_value} sq.ft
                      </td>
                    )}

                    {/* Land / Malpot Rate Columns */}
                    {(activeTab === "land_rate" || activeTab === "malpot_rate") && (
                      <>
                        <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {masters.fiscalYears.find((f: any) => f.id === item.fiscal_year_id)?.code || `FY #${item.fiscal_year_id || 1}`}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {Number(item.rate_per_unit).toLocaleString()}
                        </td>
                        <td className="p-3.5 font-mono">
                          {item.area_per_unit ?? 1}
                        </td>
                        <td className="p-3.5 font-mono">
                          {item.area_upto ?? 0}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">
                          {item.parent_id ? `#${item.parent_id}` : "-"}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono">
                            Ward: {item.ward_no_ids || "All"}
                          </span>
                        </td>
                      </>
                    )}

                    {/* Construction Rate Columns */}
                    {activeTab === "construction_rate" && (
                      <>
                        <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {masters.fiscalYears.find((f: any) => f.id === item.fiscal_year_id)?.code || `FY #${item.fiscal_year_id || 1}`}
                        </td>
                        <td className="p-3.5 font-mono">
                          {masters.units.find((u: any) => u.id === item.unit_id)?.fullanme || `Unit #${item.unit_id || 1}`}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                          Rs. {Number(item.rate_per_unit).toLocaleString()}
                        </td>
                        <td className="p-3.5 font-mono">
                          {item.area_per_unit ?? 1}
                        </td>
                        <td className="p-3.5 font-mono">
                          {item.area_upto ?? 0}
                        </td>
                        <td className="p-3.5">
                          {masters.constructionTypes.find((c) => c.id === item.const_type_id)?.fullanme || `Type #${item.const_type_id}`}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">
                          {item.parent_id ? `#${item.parent_id}` : "-"}
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">{item.ward_no_ids || "All"}</td>
                      </>
                    )}

                    {/* Depreciation Columns */}
                    {activeTab === "depreciation" && (
                      <>
                        <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {masters.fiscalYears.find((f: any) => f.id === item.fiscal_year_id)?.code || `FY #${item.fiscal_year_id || 1}`}
                        </td>
                        <td className="p-3.5">
                          {masters.constructionTypes.find((c) => c.id === (item.construction_type_id || item.const_type_id))?.fullanme || item.construction_type || `Type #${item.construction_type_id || item.const_type_id || 1}`}
                        </td>
                        <td className="p-3.5 font-mono">
                          {item.year_from} - {item.year_to} Years
                        </td>
                        <td className="p-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                          {item.percent}%
                        </td>
                      </>
                    )}

                    {/* Fine / Rebate Columns */}
                    {activeTab === "fine_rebate" && (
                      <>
                        <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {masters.fiscalYears.find((f: any) => f.id === item.fiscal_year_id)?.code || `FY #${item.fiscal_year_id || 1}`}
                        </td>
                        <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                          {item.tax_type_id === 1 ? "Sampati Kar (सम्पत्ति कर)" : item.tax_type_id === 2 ? "Malpot Kar (मालपोत)" : item.tax_type_id === 3 ? "Bhumikar (भूमिकर)" : `Tax Type #${item.tax_type_id}`}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              item.isfine
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                            }`}
                          >
                            {item.isfine ? "Penalty / Fine" : "Early Rebate"}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                          Y: {item.years || 0} / M: {item.month || item.months || 0}
                        </td>
                        <td className="p-3.5 font-mono font-bold">
                          {item.calcpercent || item.ratepercent}%
                        </td>
                        <td className="p-3.5 font-mono text-slate-500">{item.days} days</td>
                      </>
                    )}

                    {/* Property Range Columns (tbl_property_range) */}
                    {activeTab === "property_range" && (
                      <>
                        <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {masters.fiscalYears.find((f: any) => f.id === (item.FiscalYearId || item.fiscal_year_id))?.code || `FY #${item.FiscalYearId || item.fiscal_year_id}`}
                        </td>
                        <td className="p-3.5 font-mono text-slate-800 dark:text-slate-200">
                          Rs. {Number(item.value_from ?? item.ValueFrom ?? 0).toLocaleString()} – {Number(item.value_to ?? item.ValueTo ?? 0) > 0 ? `Rs. ${Number(item.value_to ?? item.ValueTo).toLocaleString()}` : "Above (No Ceiling)"}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                          {(item.is_percent ?? item.IsPercent) ? `${item.tax_percent ?? item.TaxPercent}%` : `Flat Rs. ${Number(item.amount_from ?? item.AmountFrom ?? 0).toLocaleString()} - ${Number(item.amount_to ?? item.AmountTo ?? 0).toLocaleString()}`}
                        </td>
                        <td className="p-3.5 font-mono text-emerald-600 dark:text-emerald-400">
                          Rs. {Number(item.min_tax_amount ?? item.MinimumTaxAmount ?? 0).toLocaleString()}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-500">
                          <div>Above: Rs. {Number(item.above_then ?? item.AboveThen ?? 0).toLocaleString()}</div>
                          <div>Per Unit: Rs. {item.per_unit_amount ?? item.PerUnitAmount ?? 0} @ {item.per_unit_rate ?? item.PerUnitRate ?? 0}</div>
                        </td>
                      </>
                    )}

                    {/* Company Columns (tbl_company) */}
                    {activeTab === "company" && (
                      <>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300">
                          {item.address || "Main Headquarters"}
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                          <div>{item.phone || "-"}</div>
                          <div className="text-slate-400">{item.email || "-"}</div>
                        </td>
                        <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400">
                          <div>PAN: {item.pan_vat_no || "N/A"}</div>
                          <div className="text-[10px] text-slate-400">Reg: {item.registration_no || "-"}</div>
                        </td>
                      </>
                    )}

                    {/* Application Setting Columns (tbl_appication_setting) */}
                    {activeTab === "application_setting" && (
                      <>
                        <td className="p-3.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {masters.companies.find((c) => c.id === item.company_id)?.fullname || `Company #${item.company_id}`}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {masters.fiscalYears.find((f) => f.id === item.fiscal_year_id)?.code || `FY #${item.fiscal_year_id}`}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">
                          <div>Unit: {masters.units.find((u) => u.id === item.unit_type_id)?.fullanme || `Unit #${item.unit_type_id}`}</div>
                          <div className="text-[10px] text-slate-400">Total Wards: {item.ward_count || 32}</div>
                        </td>
                      </>
                    )}

                    {/* Audit Stamp */}
                    <td className="p-3.5 text-[10px] font-mono text-slate-400">
                      <div>Upd: {item.update_by || "SYSTEM"}</div>
                      <div>{item.update_on ? new Date(item.update_on).toLocaleDateString() : "Active"}</div>
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors"
                          title="Edit this rate record"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
                          title="Delete rate"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit Rate Record */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl xl:max-w-6xl w-full shadow-2xl animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingItem ? `Edit Rate: ${editingItem.code || editingItem.id}` : `Add New ${activeTab.replace("_", " ")}`}
                </h3>
                <div className="text-[11px] text-slate-500 font-mono">
                  Target Table: tbl_{activeTab}
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
              {/* Common Code & Name */}
              {activeTab !== "fine_rebate" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Rate Code / Symbol
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code || ""}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Full Description / Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullanme || formData.fullname || ""}
                      onChange={(e) => setFormData({ ...formData, fullanme: e.target.value, fullname: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Fiscal Year Fields */}
              {activeTab === "fiscal_year" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Date From (BS)
                    </label>
                    <input
                      type="text"
                      value={formData.date_from_bs || ""}
                      onChange={(e) => setFormData({ ...formData, date_from_bs: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Date To (BS)
                    </label>
                    <input
                      type="text"
                      value={formData.date_to_bs || ""}
                      onChange={(e) => setFormData({ ...formData, date_to_bs: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Unit Field */}
              {activeTab === "unit" && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Conversion Value (Square Feet per Unit)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.unit_value || 1}
                    onChange={(e) => setFormData({ ...formData, unit_value: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              )}

              {/* Land / Malpot Rate Fields */}
              {(activeTab === "land_rate" || activeTab === "malpot_rate") && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Fiscal Year (fiscal_year)
                      </label>
                      <select
                        value={formData.fiscal_year_id || masters.fiscalYears[0]?.id || 1}
                        onChange={(e) => setFormData({ ...formData, fiscal_year_id: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {masters.fiscalYears.map((fy) => (
                          <option key={fy.id} value={fy.id}>
                            {fy.code} - {fy.fullname}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Parent ID (parent_id)
                      </label>
                      <input
                        type="number"
                        value={formData.parent_id ?? ""}
                        onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? Number(e.target.value) : null })}
                        placeholder="Optional parent rate ID"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Rate Per Unit (NPR)
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.rate_per_unit || 0}
                        onChange={(e) => setFormData({ ...formData, rate_per_unit: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Area Per Unit (area_per_unit)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.area_per_unit ?? 1}
                        onChange={(e) => setFormData({ ...formData, area_per_unit: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Area Upto (area_upto)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.area_upto ?? 0}
                        onChange={(e) => setFormData({ ...formData, area_upto: Number(e.target.value) })}
                        placeholder="0 for unlimited"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Measuring Unit
                      </label>
                      <select
                        value={formData.unit_id || 3}
                        onChange={(e) => setFormData({ ...formData, unit_id: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {masters.units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullanme} ({u.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Applicable Wards (e.g. 1, 2, 3)
                      </label>
                      <input
                        type="text"
                        value={formData.ward_no_ids || ""}
                        onChange={(e) => setFormData({ ...formData, ward_no_ids: e.target.value })}
                        placeholder="e.g. 1, 2, 3 or ALL"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Construction Rate Fields */}
              {activeTab === "construction_rate" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Fiscal Year (fiscal_year)
                      </label>
                      <select
                        value={formData.fiscal_year_id || masters.fiscalYears[0]?.id || 1}
                        onChange={(e) => setFormData({ ...formData, fiscal_year_id: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {masters.fiscalYears.map((fy) => (
                          <option key={fy.id} value={fy.id}>
                            {fy.code} - {fy.fullname}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Unit (unit_id)
                      </label>
                      <select
                        value={formData.unit_id || 1}
                        onChange={(e) => setFormData({ ...formData, unit_id: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {masters.units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullanme} ({u.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Construction Type
                      </label>
                      <select
                        value={formData.const_type_id || 1}
                        onChange={(e) => setFormData({ ...formData, const_type_id: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {masters.constructionTypes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullanme}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Rate Per Sq.Ft
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.rate_per_unit || 0}
                        onChange={(e) => setFormData({ ...formData, rate_per_unit: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Area Per Unit (area_per_unit)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.area_per_unit ?? 1}
                        onChange={(e) => setFormData({ ...formData, area_per_unit: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Area Upto (area_upto)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.area_upto ?? 0}
                        onChange={(e) => setFormData({ ...formData, area_upto: Number(e.target.value) })}
                        placeholder="0 for unlimited"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Parent ID (parent_id)
                      </label>
                      <input
                        type="number"
                        value={formData.parent_id ?? ""}
                        onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? Number(e.target.value) : null })}
                        placeholder="Optional parent ID"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Ward Numbers
                    </label>
                    <input
                      type="text"
                      value={formData.ward_no_ids || "1,2,3"}
                      onChange={(e) => setFormData({ ...formData, ward_no_ids: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Depreciation Fields */}
              {activeTab === "depreciation" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Fiscal Year (fiscal_year)
                      </label>
                      <select
                        value={formData.fiscal_year_id || masters.fiscalYears[0]?.id || 1}
                        onChange={(e) => setFormData({ ...formData, fiscal_year_id: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {masters.fiscalYears.map((fy) => (
                          <option key={fy.id} value={fy.id}>
                            {fy.code} - {fy.fullname}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Construction Type (construction_type)
                      </label>
                      <select
                        value={formData.construction_type_id || formData.const_type_id || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData({ ...formData, construction_type_id: val, const_type_id: val });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {masters.constructionTypes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.fullanme}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Year From
                      </label>
                      <input
                        type="number"
                        value={formData.year_from || 0}
                        onChange={(e) => setFormData({ ...formData, year_from: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Year To
                      </label>
                      <input
                        type="number"
                        value={formData.year_to || 5}
                        onChange={(e) => setFormData({ ...formData, year_to: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Depreciation %
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.percent || 5}
                        onChange={(e) => setFormData({ ...formData, percent: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Fine / Rebate Fields */}
              {activeTab === "fine_rebate" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Fiscal Year (fiscal_year)
                      </label>
                      <select
                        value={formData.fiscal_year_id || masters.fiscalYears[0]?.id || 1}
                        onChange={(e) => setFormData({ ...formData, fiscal_year_id: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {masters.fiscalYears.map((fy) => (
                          <option key={fy.id} value={fy.id}>
                            {fy.code} - {fy.fullname}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Tax Type Selection (tax_type)
                      </label>
                      <select
                        value={formData.tax_type_id || 1}
                        onChange={(e) => setFormData({ ...formData, tax_type_id: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                      >
                        <option value={1}>Sampati Kar (सम्पत्ति कर / Property Tax)</option>
                        <option value={2}>Malpot Kar (मालपोत कर / Land Revenue)</option>
                        <option value={3}>Bhumikar (भूमिकर / Integrated Land Tax)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Policy Type
                      </label>
                      <select
                        value={formData.isfine ? "fine" : "rebate"}
                        onChange={(e) => setFormData({ ...formData, isfine: e.target.value === "fine" })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value="rebate">Early Payment Rebate (छुट)</option>
                        <option value="fine">Delayed Penalty / Fine (जरिवाना)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Year (years)
                      </label>
                      <input
                        type="number"
                        value={formData.years ?? 0}
                        onChange={(e) => setFormData({ ...formData, years: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Month (month)
                      </label>
                      <input
                        type="number"
                        value={formData.month ?? formData.months ?? 0}
                        onChange={(e) => setFormData({ ...formData, month: Number(e.target.value), months: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Percentage (%)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.calcpercent || 10}
                        onChange={(e) => setFormData({ ...formData, calcpercent: Number(e.target.value), ratepercent: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Applicable Days Window (days)
                    </label>
                    <input
                      type="number"
                      value={formData.days || 90}
                      onChange={(e) => setFormData({ ...formData, days: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Property Range Fields (tbl_property_range) */}
              {activeTab === "property_range" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Fiscal Year (FiscalYearId)
                      </label>
                      <select
                        value={formData.FiscalYearId || formData.fiscal_year_id || 2}
                        onChange={(e) => setFormData({ ...formData, FiscalYearId: Number(e.target.value), fiscal_year_id: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {masters.fiscalYears.map((f: any) => (
                          <option key={f.id} value={f.id}>
                            {f.code} - {f.fullname}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Serial Number (Sn)
                      </label>
                      <input
                        type="number"
                        value={formData.Sn ?? formData.sn ?? 1}
                        onChange={(e) => setFormData({ ...formData, Sn: Number(e.target.value), sn: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Value From (Rs.)
                      </label>
                      <input
                        type="number"
                        value={formData.value_from ?? formData.ValueFrom ?? 0}
                        onChange={(e) => setFormData({ ...formData, value_from: Number(e.target.value), ValueFrom: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Value To (Rs. 0 = Ceiling Bracket)
                      </label>
                      <input
                        type="number"
                        value={formData.value_to ?? formData.ValueTo ?? 0}
                        onChange={(e) => setFormData({ ...formData, value_to: Number(e.target.value), ValueTo: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 items-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.is_percent ?? formData.IsPercent)}
                          onChange={(e) => setFormData({ ...formData, is_percent: e.target.checked, IsPercent: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Is Percentage (is_percent)</span>
                      </label>
                      <span className="text-[10px] text-slate-400">If true, uses tax_percent. If false, calculates between amount_from & amount_to.</span>
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Tax Percent (%)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.tax_percent ?? formData.TaxPercent ?? 0}
                        onChange={(e) => setFormData({ ...formData, tax_percent: Number(e.target.value), TaxPercent: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Amount From (amount_from)
                      </label>
                      <input
                        type="number"
                        value={formData.amount_from ?? formData.AmountFrom ?? 0}
                        onChange={(e) => setFormData({ ...formData, amount_from: Number(e.target.value), AmountFrom: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Amount To (amount_to)
                      </label>
                      <input
                        type="number"
                        value={formData.amount_to ?? formData.AmountTo ?? 0}
                        onChange={(e) => setFormData({ ...formData, amount_to: Number(e.target.value), AmountTo: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Above Then (Threshold)
                      </label>
                      <input
                        type="number"
                        value={formData.above_then ?? formData.AboveThen ?? 0}
                        onChange={(e) => setFormData({ ...formData, above_then: Number(e.target.value), AboveThen: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Minimum Tax Amount (min_tax_amount)
                      </label>
                      <input
                        type="number"
                        value={formData.min_tax_amount ?? formData.MinimumTaxAmount ?? 0}
                        onChange={(e) => setFormData({ ...formData, min_tax_amount: Number(e.target.value), MinimumTaxAmount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-emerald-600 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Per Unit Amount
                      </label>
                      <input
                        type="number"
                        value={formData.per_unit_amount ?? formData.PerUnitAmount ?? 0}
                        onChange={(e) => setFormData({ ...formData, per_unit_amount: Number(e.target.value), PerUnitAmount: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Per Unit Rate
                      </label>
                      <input
                        type="number"
                        value={formData.per_unit_rate ?? formData.PerUnitRate ?? 0}
                        onChange={(e) => setFormData({ ...formData, per_unit_rate: Number(e.target.value), PerUnitRate: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.is_cumuliatative ?? formData.IsCumulative)}
                          onChange={(e) => setFormData({ ...formData, is_cumuliatative: e.target.checked, IsCumulative: e.target.checked })}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-xs">Is Cumulative</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Fields (tbl_company) */}
              {activeTab === "company" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Entity Address
                    </label>
                    <input
                      type="text"
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. Bagmati Province, Kathmandu Ward No. 3"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Official Email
                      </label>
                      <input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        PAN / VAT Number
                      </label>
                      <input
                        type="text"
                        value={formData.pan_vat_no || ""}
                        onChange={(e) => setFormData({ ...formData, pan_vat_no: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Registration Number
                      </label>
                      <input
                        type="text"
                        value={formData.registration_no || ""}
                        onChange={(e) => setFormData({ ...formData, registration_no: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Application Setting Fields (tbl_appication_setting) */}
              {activeTab === "application_setting" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Associated Company Entity (tbl_company reference)
                    </label>
                    <select
                      value={formData.company_id || 1}
                      onChange={(e) => setFormData({ ...formData, company_id: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      {masters.companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullname} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Default Fiscal Year (tbl_fiscal_year)
                      </label>
                      <select
                        value={formData.fiscal_year_id || 2}
                        onChange={(e) => setFormData({ ...formData, fiscal_year_id: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {masters.fiscalYears.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.code} - {f.fullname}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Default Measuring Unit (tbl_unit)
                      </label>
                      <select
                        value={formData.unit_type_id || 3}
                        onChange={(e) => setFormData({ ...formData, unit_type_id: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {masters.units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullanme} ({u.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                        Bhumikar Start FY (bhumikar_start_fy)
                      </label>
                      <select
                        value={formData.bhumikar_start_fy || 1}
                        onChange={(e) => setFormData({ ...formData, bhumikar_start_fy: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {masters.fiscalYears.map((f: any) => (
                          <option key={f.id} value={f.id}>
                            {f.code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                        Property Bhumikar Start FY (prop_bhumikar_start_fy)
                      </label>
                      <select
                        value={formData.prop_bhumikar_start_fy || 2}
                        onChange={(e) => setFormData({ ...formData, prop_bhumikar_start_fy: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {masters.fiscalYears.map((f: any) => (
                          <option key={f.id} value={f.id}>
                            {f.code}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                        IPT Start FY (ipt_start_fy)
                      </label>
                      <select
                        value={formData.ipt_start_fy || 2}
                        onChange={(e) => setFormData({ ...formData, ipt_start_fy: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        {masters.fiscalYears.map((f: any) => (
                          <option key={f.id} value={f.id}>
                            {f.code}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Municipality Name
                      </label>
                      <input
                        type="text"
                        value={formData.municipality_name || ""}
                        onChange={(e) => setFormData({ ...formData, municipality_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Total Ward Count
                      </label>
                      <input
                        type="number"
                        value={formData.ward_count || 32}
                        onChange={(e) => setFormData({ ...formData, ward_count: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              </div>

              {/* Permanently Visible Docked Modal Footer with Save Button */}
              <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/95 shrink-0 z-10">
                <div className="text-[11px] text-slate-500 font-mono">
                  {editingItem ? `Updating record #${editingItem.id}` : `New record for tbl_${activeTab}`}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editingItem ? "Save Changes" : "Save Record"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
