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
  Landmark,
  Copy,
  ArrowRight
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
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchTerm) {
      setIsSearching(true);
      const timer = setTimeout(() => setIsSearching(false), 200);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchTerm, filterFiscalYear]);

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

  // Copy Rate Modal State
  const [isCopyRateModalOpen, setIsCopyRateModalOpen] = useState(false);
  const [copySourceFy, setCopySourceFy] = useState<string>("null");
  const [copyTargetFy, setCopyTargetFy] = useState<number>(2);
  const [copyCategory, setCopyCategory] = useState<string>("all");
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [filterFiscalYear, setFilterFiscalYear] = useState<string>("all");

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
        const defFy = res.data.applicationSettings?.[0]?.fiscal_year_id;
        if (defFy) {
          setCopyTargetFy(defFy);
        }
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
    { id: "property_range", label: "Property Range", sub: "Property valuation tax slabs", icon: Sliders, count: masters.propertyRanges.length, group: "rate" },

    // Masters Group
    { id: "fiscal_year", label: "Fiscal Year", sub: "Municipal accounting calendar", icon: Calendar, count: masters.fiscalYears.length, group: "masters" },
    { id: "construction_type", label: "Construction Types", sub: "Building structure classifications", icon: Building, count: masters.constructionTypes.length, group: "masters" },
    { id: "unit", label: "Measurement Unit", sub: "Ropani, Bigha, Sq.Ft, Sq.Metre", icon: Sliders, count: masters.units.length, group: "masters" },
    { id: "land_nature", label: "Land Nature", sub: "Zoning & residential classifications", icon: Trees, count: masters.landNatures.length, group: "masters" },

    // RBAC Group
    { id: "company", label: "Company Profile", sub: "Municipal organization entity", icon: Landmark, count: masters.companies.length, group: "rbac" },
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
    // Setup sensible defaults per activeTab - rate tables default to null fiscal_year_id (Universal Default)
    switch (activeTab) {
      case "property_range":
        setFormData({ FiscalYearId: null, fiscal_year_id: null, Sn: 1, value_from: 0, value_to: 1000000, is_percent: true, tax_percent: 0.10, amount_from: 0, amount_to: 1000, above_then: 0, min_tax_amount: 300, per_unit_amount: 0, per_unit_rate: 0, is_cumuliatative: false });
        break;
      case "fiscal_year":
        setFormData({ code: "2082/83", fullname: "Fiscal Year 2082/2083 BS", date_from_bs: "2082-04-01", date_to_bs: "2083-03-31", is_active: true });
        break;
      case "unit":
        setFormData({ code: "NEW_UNIT", fullanme: "New Unit", unit_value: 100, is_active: true });
        break;
      case "land_rate":
        setFormData({ code: "LR-NEW", fullanme: "New Land Rate", fiscal_year_id: null, unit_id: 3, rate_per_unit: 1000000, parent_id: null, area_per_unit: 1, area_upto: 10000, ward_no_ids: "1,2,3" });
        break;
      case "malpot_rate":
        setFormData({ code: "MR-NEW", fullanme: "New Malpot Rate", fiscal_year_id: null, unit_id: 3, rate_per_unit: 500000, parent_id: null, area_per_unit: 1, area_upto: 10000, ward_no_ids: "1,2,3" });
        break;
      case "construction_type":
        setFormData({ code: "NEW_CONST", fullanme: "Timber & Brick Composite" });
        break;
      case "construction_rate":
        setFormData({ code: "CR-NEW", fullanme: "Standard Construction Rate", fiscal_year_id: null, const_type_id: 1, unit_id: 1, rate_per_unit: 2800, parent_id: null, area_per_unit: 1, area_upto: 5000, ward_no_ids: "1,2,3" });
        break;
      case "depreciation":
        setFormData({ code: "DEP-NEW", fullanme: "Depreciation Slab 5-10 Yrs", fiscal_year_id: null, const_type_id: 1, construction_type_id: 1, sn: 2, year_from: 6, year_to: 10, percent: 10 });
        break;
      case "fine_rebate":
        setFormData({ fiscal_year_id: null, tax_type_id: 1, ratesn: 1, years: 0, month: 3, calcpercent: 10, ratepercent: 10, flatrate: 0, isfine: false, days: 90 });
        break;
      case "land_nature":
        setFormData({ code: "INDUSTRIAL", fullanme: "Industrial Zone (औद्योगिक क्षेत्र)" });
        break;
      case "company":
        setFormData({ code: "NEW-MUN", fullname: "New Municipality Corporation", address: "Ward 1", phone: "+977-01-0000000", email: "info@municipality.gov.np", pan_vat_no: "300000000", registration_no: "REG-2081-01", is_active: true });
        break;
      case "application_setting":
        setFormData({
          code: "APP-CONF-01",
          fullname: "Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)",
          fullanme: "Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)",
          municipality_name: "Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)",
          company_id: 1,
          fiscal_year_id: 2,
          unit_type_id: 3,
          bhumikar_start_fy: 1,
          prop_bhumikar_start_fy: 2,
          ipt_start_fy: 2,
          ward_count: 32,
          theme_preference: "slate",
          default_language: "eng"
        });
        break;
    }
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    const resolvedCode = item.code || (activeTab === "application_setting" ? "APP-CONF-01" : "");
    const resolvedName = item.fullname || item.fullanme || item.municipality_name || (activeTab === "application_setting" ? "Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)" : "");
    setFormData({
      ...item,
      code: resolvedCode,
      fullname: resolvedName,
      fullanme: resolvedName,
      municipality_name: item.municipality_name || resolvedName
    });
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
      res = await ApiController.updateApplicationSettings({
        ...formData,
        code: formData.code || "APP-CONF-01",
        fullname: formData.fullname || formData.fullanme || formData.municipality_name || "Kathmandu Metropolitan City",
        fullanme: formData.fullanme || formData.fullname || formData.municipality_name || "Kathmandu Metropolitan City",
        municipality_name: formData.municipality_name || formData.fullname || formData.fullanme || "Kathmandu Metropolitan City"
      });
    } else {
      res = await ApiController.saveRateItem(activeTab, formData, editingItem?.id);
    }

    if (res.success) {
      setStatusMsg(editingItem ? "Record updated successfully!" : "New record created successfully!");
      setIsModalOpen(false);
      await loadData();

      const changedFyId = formData.fiscal_year_id ? Number(formData.fiscal_year_id) : undefined;
      const matchedFy = changedFyId ? masters.fiscalYears.find((f: any) => f.id === changedFyId) : undefined;
      const fyCode = matchedFy?.code;

      if (changedFyId) {
        localStorage.setItem("gtax_active_fy_id", String(changedFyId));
      }
      if (fyCode) {
        localStorage.setItem("gtax_active_fy_code", fyCode);
      }

      window.dispatchEvent(
        new CustomEvent("gtax:rates_updated", {
          detail: {
            tab: activeTab,
            fiscal_year_id: changedFyId,
            fiscalYearCode: fyCode
          }
        })
      );

      if (activeTab === "application_setting" || activeTab === "fiscal_year") {
        window.dispatchEvent(
          new CustomEvent("gtax:active_fy_changed", {
            detail: {
              fiscal_year_id: changedFyId,
              fiscalYearCode: fyCode
            }
          })
        );
      }

      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleExecuteCopyRate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCopying(true);
    try {
      const res = await ApiController.copyRates({
        source_fiscal_year_id: copySourceFy === "null" ? null : Number(copySourceFy),
        target_fiscal_year_id: Number(copyTargetFy),
        category: copyCategory
      });
      if (res.success) {
        setStatusMsg(res.data?.message || "Rates copied successfully!");
        setIsCopyRateModalOpen(false);
        await loadData();
        setTimeout(() => setStatusMsg(null), 4000);
      } else {
        setStatusMsg(`Failed to copy rates: ${(res as any).error || res.message || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Error copying rates: ${err.message || "Failed"}`);
    } finally {
      setIsCopying(false);
    }
  };

  const isRateCategory = ["land_rate", "malpot_rate", "construction_rate", "depreciation", "fine_rebate", "property_range"].includes(activeTab);

  const currentList = getCurrentList().filter((item: any) => {
    if (isRateCategory && filterFiscalYear !== "all") {
      const itemFy = item.fiscal_year_id ?? item.FiscalYearId;
      if (filterFiscalYear === "null") {
        if (itemFy !== null && itemFy !== undefined && itemFy !== "") return false;
      } else {
        if (String(itemFy) !== String(filterFiscalYear)) return false;
      }
    }
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.code && item.code.toLowerCase().includes(term)) ||
      (item.fullanme && item.fullanme.toLowerCase().includes(term)) ||
      (item.fullname && item.fullname.toLowerCase().includes(term)) ||
      (item.ward_no_ids && item.ward_no_ids.includes(term))
    );
  });

  const getHeaderInfo = () => {
    switch (activeTab) {
      case "company":
        return {
          title: "Company Profile (संस्था / पालिका विवरण)",
          subtitle: "",
          icon: Landmark,
          iconColor: "text-amber-500",
          addLabel: "Add Company / Ward Profile"
        };
      case "application_setting":
        return {
          title: "Application Settings (प्रणाली सेटिङ)",
          subtitle: "Global municipal configuration, active fiscal year & default taxation parameters",
          icon: Settings,
          iconColor: "text-indigo-600",
          addLabel: "Add Setting Record"
        };
      case "fiscal_year":
        return {
          title: "Fiscal Year Master (आर्थिक वर्ष व्यवस्थापन)",
          subtitle: "Municipal accounting calendar, active fiscal years, and BS / AD date spans",
          icon: Calendar,
          iconColor: "text-blue-500",
          addLabel: "Add Fiscal Year"
        };
      case "construction_type":
        return {
          title: "Construction Types Master (संरचना प्रकार)",
          subtitle: "Building structure classifications (RCC, Timber, Adobe, Steel) for municipal valuation",
          icon: Building,
          iconColor: "text-purple-500",
          addLabel: "Add Construction Type"
        };
      case "unit":
        return {
          title: "Measurement Unit Master (इकाई नाप व्यवस्थापन)",
          subtitle: "Standard land and area measurement units (Ropani, Bigha, Sq.Ft, Square Metre)",
          icon: Sliders,
          iconColor: "text-cyan-500",
          addLabel: "Add Measurement Unit"
        };
      case "land_nature":
        return {
          title: "Land Nature Master (जग्गाको प्रकृति व्यवस्थापन)",
          subtitle: "Zoning, agricultural, commercial, industrial and residential classifications",
          icon: Trees,
          iconColor: "text-emerald-500",
          addLabel: "Add Land Nature"
        };
      case "malpot_rate":
        return {
          title: "Malpot Valuation Rates (मालपोत दररेट)",
          subtitle: "Government statutory valuation rates per unit across municipal wards",
          icon: Layers,
          iconColor: "text-indigo-600",
          addLabel: "Add Malpot Rate"
        };
      case "construction_rate":
        return {
          title: "Construction Valuation Rates (संरचना दररेट)",
          subtitle: "Building structure rate matrix per square foot based on construction type",
          icon: Building,
          iconColor: "text-indigo-600",
          addLabel: "Add Construction Rate"
        };
      case "depreciation":
        return {
          title: "Depreciation Rate Schedule (ह्रासकट्टी दररेट)",
          subtitle: "Annual building depreciation percentage matrix based on structure age",
          icon: TrendingDown,
          iconColor: "text-indigo-600",
          addLabel: "Add Depreciation Tier"
        };
      case "fine_rebate":
        return {
          title: "Fine & Rebate Policy (जरिवाना र छुट व्यवस्थापन)",
          subtitle: "Early payment tax rebate incentives and delayed payment late fine tiers",
          icon: Gift,
          iconColor: "text-indigo-600",
          addLabel: "Add Fine / Rebate Rule"
        };
      case "property_range":
        return {
          title: "Property Tax Slabs & Ranges (सम्पत्ति कर स्ल्याब)",
          subtitle: "Valuation ranges, progressive tax percentages, flat tiers, and minimum tax rules",
          icon: Sliders,
          iconColor: "text-indigo-600",
          addLabel: "Add Tax Slab"
        };
      case "land_rate":
      default:
        return {
          title: "Rate & Master Matrix Configuration (दररेट व्यवस्थापन)",
          subtitle: "Municipal property and land valuation rates across wards and units",
          icon: DollarSign,
          iconColor: "text-indigo-600",
          addLabel: "Add Rate Record"
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const HeaderIcon = headerInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <HeaderIcon className={`w-5 h-5 ${headerInfo.iconColor}`} />
            <span>{headerInfo.title}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {headerInfo.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {["land_rate", "malpot_rate", "construction_rate", "depreciation", "fine_rebate", "property_range"].includes(activeTab) && (
            <button
              onClick={() => {
                const defFy = masters.applicationSettings[0]?.fiscal_year_id || 2;
                setCopyTargetFy(defFy);
                setCopySourceFy("null");
                setCopyCategory(activeTab);
                setIsCopyRateModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors shadow-2xs"
              title="Copy rates from Universal Default (Null) or another Fiscal Year"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Rate (दररेट प्रतिलिपि)</span>
            </button>
          )}
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
            <span>{headerInfo.addLabel}</span>
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

      {/* Search Bar, FY Filter & Table Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={`Search ${activeTab.replace("_", " ")}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {isSearching && (
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin absolute right-2.5 top-2.5" />
            )}
          </div>

          {isRateCategory && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Fiscal Year:</span>
              <select
                value={filterFiscalYear}
                onChange={(e) => setFilterFiscalYear(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
              >
                <option value="all">All Fiscal Years</option>
                <option value="null">Universal Default (Null FY)</option>
                {masters.fiscalYears.map((fy: any) => (
                  <option key={fy.id} value={String(fy.id)}>
                    {fy.code} - {fy.fullname} {fy.id === (masters.applicationSettings[0]?.fiscal_year_id || 2) ? "(App Default)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 self-start sm:self-center">
          <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            Showing {currentList.length} records
          </span>
        </div>
      </div>

      {/* Dynamic Data Table for Active Rate Tab */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
        {isSearching && (
          <div className="px-4 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b border-indigo-100 dark:border-indigo-900 animate-in fade-in">
            <RefreshCw className="w-3 h-3 animate-spin shrink-0" />
            <span>Searching database records...</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="p-3.5 w-14 text-center">R.Num</th>
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
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    {activeTab === "company"
                      ? "No company or municipal profile records found."
                      : activeTab === "application_setting"
                      ? "No application settings found."
                      : "No rate records found for this category or filter."}
                  </td>
                </tr>
              ) : (
                currentList.map((item: any, idx: number) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-center font-mono font-bold text-slate-500 dark:text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">
                      <div>{item.fullanme || item.fullname || (item.isfine ? "Fine Rule" : "Rebate Policy")}</div>
                      {item.code && <div className="text-[10px] font-mono text-slate-400">{item.code}</div>}
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
                        <td className="p-3.5 font-mono">
                          {item.fiscal_year_id ? (
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {masters.fiscalYears.find((f: any) => f.id === item.fiscal_year_id)?.code || `FY #${item.fiscal_year_id}`}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              Universal Default (Null)
                            </span>
                          )}
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
                        <td className="p-3.5 font-mono">
                          {item.fiscal_year_id ? (
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {masters.fiscalYears.find((f: any) => f.id === item.fiscal_year_id)?.code || `FY #${item.fiscal_year_id}`}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              Universal Default (Null)
                            </span>
                          )}
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
                        <td className="p-3.5 font-mono">
                          {item.fiscal_year_id ? (
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {masters.fiscalYears.find((f: any) => f.id === item.fiscal_year_id)?.code || `FY #${item.fiscal_year_id}`}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              Universal Default (Null)
                            </span>
                          )}
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
                        <td className="p-3.5 font-mono">
                          {item.fiscal_year_id ? (
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {masters.fiscalYears.find((f: any) => f.id === item.fiscal_year_id)?.code || `FY #${item.fiscal_year_id}`}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              Universal Default (Null)
                            </span>
                          )}
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

                    {/* Property Range Columns */}
                    {activeTab === "property_range" && (
                      <>
                        <td className="p-3.5 font-mono">
                          {(item.FiscalYearId || item.fiscal_year_id) ? (
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {masters.fiscalYears.find((f: any) => f.id === (item.FiscalYearId || item.fiscal_year_id))?.code || `FY #${item.FiscalYearId || item.fiscal_year_id}`}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              Universal Default (Null)
                            </span>
                          )}
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

                    {/* Company Columns */}
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

                    {/* Application Setting Columns */}
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
                  {editingItem
                    ? `Edit ${activeTab === "company" ? "Company Profile" : activeTab === "application_setting" ? "Settings" : "Record"}: ${editingItem.fullname || editingItem.fullanme || editingItem.code || editingItem.id}`
                    : `Add New ${activeTab === "company" ? "Company / Ward Profile" : activeTab.replace("_", " ")}`}
                </h3>
                <div className="text-[11px] text-slate-500 font-mono capitalize">
                  {activeTab === "company" ? "Municipal Profile & Organization Settings" : `Configuration: ${activeTab.replace(/_/g, " ")}`}
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
                        value={formData.fiscal_year_id ?? ""}
                        onChange={(e) => setFormData({ ...formData, fiscal_year_id: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value="">Universal Default (fiscal_year_id: null)</option>
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
                        value={formData.fiscal_year_id ?? ""}
                        onChange={(e) => setFormData({ ...formData, fiscal_year_id: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value="">Universal Default (fiscal_year_id: null)</option>
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
                        value={formData.fiscal_year_id ?? ""}
                        onChange={(e) => setFormData({ ...formData, fiscal_year_id: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value="">Universal Default (fiscal_year_id: null)</option>
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
                        value={formData.fiscal_year_id ?? ""}
                        onChange={(e) => setFormData({ ...formData, fiscal_year_id: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value="">Universal Default (fiscal_year_id: null)</option>
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

              {/* Property Range Fields */}
              {activeTab === "property_range" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Fiscal Year (FiscalYearId)
                      </label>
                      <select
                        value={formData.FiscalYearId ?? formData.fiscal_year_id ?? ""}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : null;
                          setFormData({ ...formData, FiscalYearId: val, fiscal_year_id: val });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <option value="">Universal Default (FiscalYearId: null)</option>
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

              {/* Company Fields */}
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

              {/* Application Setting Fields */}
              {activeTab === "application_setting" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Associated Company Entity
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
                        Default Fiscal Year
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
                        Default Measuring Unit
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
                <div className="text-[11px] text-slate-500 font-mono capitalize">
                  {editingItem ? `Updating record #${editingItem.id}` : `New record for ${activeTab.replace(/_/g, " ")}`}
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

      {/* Copy Rate (दररेट प्रतिलिपि) Modal */}
      {isCopyRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Copy Rate Matrix (दररेट प्रतिलिपि)
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Clone universal default (Null) or specific FY rates into a target FY
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsCopyRateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteCopyRate} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                <span className="font-bold">Rate Cloning Policy:</span> Universal rates where <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">fiscal_year_id</code> is null represent the base standard. This action will clone and upsert them into the selected target fiscal year.
              </div>

              {/* Source Fiscal Year */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Source Rate Source (स्रोत आर्थिक वर्ष / बेस दर)
                </label>
                <select
                  value={copySourceFy}
                  onChange={(e) => setCopySourceFy(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                >
                  <option value="null">Universal Default (fiscal_year_id IS NULL)</option>
                  {masters.fiscalYears.map((fy: any) => (
                    <option key={fy.id} value={String(fy.id)}>
                      {fy.code} - {fy.fullname} {fy.id === (masters.applicationSettings[0]?.fiscal_year_id || 2) ? "(Active Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Direction Indicator */}
              <div className="flex items-center justify-center text-slate-400">
                <div className="flex items-center gap-2 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  <span>Copy From</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Apply To</span>
                </div>
              </div>

              {/* Target Fiscal Year */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Fiscal Year (प्रतिलिपि गरिने आर्थिक वर्ष)
                </label>
                <select
                  value={copyTargetFy}
                  onChange={(e) => setCopyTargetFy(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/30 font-bold text-indigo-900 dark:text-indigo-200"
                >
                  {masters.fiscalYears.map((fy: any) => (
                    <option key={fy.id} value={fy.id}>
                      {fy.code} - {fy.fullname} {fy.id === (masters.applicationSettings[0]?.fiscal_year_id || 2) ? "★ (Active App Default)" : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Default selected from Application Settings active fiscal year.
                </p>
              </div>

              {/* Rate Table Scope */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rate Matrix Scope (दररेट विधा)
                </label>
                <select
                  value={copyCategory}
                  onChange={(e) => setCopyCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                >
                  <option value="all">All Rate Categories (सबै दररेट सूचीहरू - All 6 Matrices)</option>
                  <option value="land_rate">Land Rate (जग्गाको दररेट - tbl_land_rate)</option>
                  <option value="malpot_rate">Malpot Rate (सरकारी मूल्यांकन - tbl_malpot_rates)</option>
                  <option value="construction_rate">Construction Rate (संरचना दररेट - tbl_construction_rates)</option>
                  <option value="depreciation">Depreciation Schedule (ह्रासकट्टी - tbl_depreciation)</option>
                  <option value="fine_rebate">Fine & Rebate Policy (जरिवाना तथा छुट - tbl_fine_rebate)</option>
                  <option value="property_range">Property Range Slabs (कर स्ल्याब - tbl_property_range)</option>
                </select>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCopyRateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCopying}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
                >
                  {isCopying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Copying Rates...</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy & Apply Rates</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
