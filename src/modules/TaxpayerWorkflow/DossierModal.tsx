import React, { useState, useEffect } from "react";
import { ApiController } from "../../api/controller.ts";
import {
  X,
  User,
  MapPin,
  Home,
  Calculator,
  Save,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Layers,
  Percent,
  CheckSquare,
  Square,
  Calendar,
  DollarSign
} from "lucide-react";
import {
  calculateLandEvaluation,
  getFloorEvaluationAmount,
  getDepreciationAmount,
  getIPTAmount
} from "../../utils/calculationEngine.ts";
import { tCol, SupportedLang } from "../../utils/i18n.ts";

interface TaxpayerDossierModalProps {
  taxpayerId: number;
  initialTab?: "taxpayer" | "land" | "house" | "calculate";
  onClose: () => void;
  onRefresh: () => void;
  masters: any;
  currentLang?: SupportedLang;
}

export const TaxpayerDossierModal: React.FC<TaxpayerDossierModalProps> = ({
  taxpayerId,
  initialTab = "taxpayer",
  onClose,
  onRefresh,
  masters,
  currentLang = "eng"
}) => {
  const [activeTab, setActiveTab] = useState<"taxpayer" | "land" | "house" | "calculate">(initialTab);
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Edit Taxpayer state
  const [tpForm, setTpForm] = useState<any>({});

  // Calculation Tab States (Multi-Fiscal-Year Engine Range)
  const [calcFiscalYearId, setCalcFiscalYearId] = useState<number>(2);
  const [calcFromFiscalYearId, setCalcFromFiscalYearId] = useState<number>(1);
  const [calcToFiscalYearId, setCalcToFiscalYearId] = useState<number>(2);
  const [calcUseMalpot, setCalcUseMalpot] = useState<boolean>(false);
  const [calcSelectedLandIds, setCalcSelectedLandIds] = useState<number[]>([]);
  const [isSavingCalc, setIsSavingCalc] = useState<boolean>(false);

  // Manual Land Override state
  const [manualLandRates, setManualLandRates] = useState<Record<number, { rate_per_unit?: number; area_per_unit?: number; unit_id?: number }>>({});

  // Land measurement tool state
  const [landMeasureUnit, setLandMeasureUnit] = useState<"ropani" | "bigha" | "sqft" | "sqmtre">("ropani");
  const [ropaniParts, setRopaniParts] = useState({ ropani: 0, aana: 4, paisa: 0, dam: 0 });
  const [bighaParts, setBighaParts] = useState({ bigha: 0, kattha: 0, dhur: 7.5 });
  const [sqftInput, setSqftInput] = useState<number>(1369);
  const [sqmtreInput, setSqmtreInput] = useState<number>(127.18);

  // Step 3 House & Floor Editable Formula / Calculation Overrides
  const [editableHouseFormulas, setEditableHouseFormulas] = useState<Record<number, {
    baseRate?: number;
    depreciationRate?: number;
    plinthMultiplier?: number;
    customAdjustment?: number;
    showFormula?: boolean;
  }>>({});

  const [editableFloorCalcs, setEditableFloorCalcs] = useState<Record<number, {
    area_in_sqft?: number;
    construction_rate?: number;
    depreciation_rate?: number;
    floor_modifier_percent?: number;
  }>>({});

  // Land Conversion Helpers
  const convertRopaniToSqft = (r: number, a: number, p: number, d: number) => {
    return Number(((Number(r) * 5476) + (Number(a) * 342.25) + (Number(p) * 85.5625) + (Number(d) * 21.390625)).toFixed(2));
  };

  const convertBighaToSqft = (b: number, k: number, dh: number) => {
    return Number(((Number(b) * 72900) + (Number(k) * 3645) + (Number(dh) * 182.25)).toFixed(2));
  };

  const convertSqmtreToSqft = (m: number) => {
    return Number((Number(m) * 10.7639).toFixed(2));
  };

  const convertSqftToRopani = (sqft: number) => {
    let rem = Number(sqft) || 0;
    const ropani = Math.floor(rem / 5476);
    rem %= 5476;
    const aana = Math.floor(rem / 342.25);
    rem %= 342.25;
    const paisa = Math.floor(rem / 85.5625);
    rem %= 85.5625;
    const dam = Number((rem / 21.390625).toFixed(2));
    return { ropani, aana, paisa, dam };
  };

  const convertSqftToBigha = (sqft: number) => {
    let rem = Number(sqft) || 0;
    const bigha = Math.floor(rem / 72900);
    rem %= 72900;
    const kattha = Math.floor(rem / 3645);
    rem %= 3645;
    const dhur = Number((rem / 182.25).toFixed(2));
    return { bigha, kattha, dhur };
  };

  // House / Land Add/Edit local modal
  const [landModalOpen, setLandModalOpen] = useState(false);
  const [landForm, setLandForm] = useState<any>({});
  const [houseModalOpen, setHouseModalOpen] = useState(false);
  const [houseForm, setHouseForm] = useState<any>({});
  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [floorForm, setFloorForm] = useState<any>({});

  // House Land Link State (house is linked with land - single or two lands)
  const [houseLandMode, setHouseLandMode] = useState<"single" | "two_lands">("single");
  const [housePrimaryLandId, setHousePrimaryLandId] = useState<number | null>(null);
  const [houseSecondaryLandId, setHouseSecondaryLandId] = useState<number | null>(null);
  const [houseKittaNumber, setHouseKittaNumber] = useState<string>("");

  const syncHouseKittaAndLand = (
    mode: "single" | "two_lands",
    primaryId: number | null,
    secondaryId: number | null,
    currentLands: any[] = dossier?.lands || []
  ) => {
    const pLand = currentLands.find((l: any) => l.id === primaryId) || currentLands[0];
    const sLand = currentLands.find((l: any) => l.id === secondaryId);
    
    let kittaStr = "";
    let landIds: number[] = [];
    if (pLand) {
      landIds.push(pLand.id);
      if (mode === "two_lands" && sLand && sLand.id !== pLand.id) {
        landIds.push(sLand.id);
        kittaStr = `${pLand.kitta_number}, ${sLand.kitta_number}`;
      } else {
        kittaStr = pLand.kitta_number;
      }
    }
    
    setHousePrimaryLandId(pLand ? pLand.id : null);
    if (mode === "two_lands" && sLand) {
      setHouseSecondaryLandId(sLand.id);
    }
    setHouseKittaNumber(kittaStr);
    
    setHouseForm((prev: any) => {
      const cleanKitta = kittaStr ? kittaStr.replace(/[^a-zA-Z0-9-]/g, "") : "";
      const suggestedHouseNo = cleanKitta ? `H-${cleanKitta}` : prev.house_no;
      return {
        ...prev,
        land_id: pLand ? pLand.id : null,
        secondary_land_id: mode === "two_lands" && sLand ? sLand.id : null,
        land_ids: landIds,
        kitta_numbers: kittaStr,
        house_no: prev.house_no && !prev.house_no.startsWith("H-") && !prev.house_no.startsWith("HN-") ? prev.house_no : suggestedHouseNo
      };
    });
  };

  const loadDossier = async () => {
    setLoading(true);
    try {
      const res = await ApiController.getTaxpayerDossier(taxpayerId);
      if (res.success && res.data) {
        setDossier(res.data);
        setTpForm({ ...res.data.taxpayer });
        if (res.data.lands) {
          setCalcSelectedLandIds(res.data.lands.map((l: any) => l.id));
        }
      }
    } catch (e) {
      console.error("Failed to load dossier", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDossier();
  }, [taxpayerId]);

  // Taxpayer update
  const handleSaveTaxpayer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await ApiController.updateTaxpayer(taxpayerId, tpForm);
    if (res.success) {
      setStatusMsg("Taxpayer details updated successfully!");
      loadDossier();
      onRefresh();
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // Land actions
  const handleOpenAddLand = () => {
    const ward = dossier?.taxpayer?.ward_no || 1;
    const wLandRates = masters.landRates.filter((r: any) => !r.ward_no_ids || r.ward_no_ids.split(',').map((w: string) => w.trim()).includes(String(ward)));
    const wMalpotRates = masters.malpotRates.filter((r: any) => !r.ward_no_ids || r.ward_no_ids.split(',').map((w: string) => w.trim()).includes(String(ward)));

    setLandForm({
      taxpayer_id: taxpayerId,
      kitta_number: `KT-${Math.floor(Math.random() * 800 + 100)}`,
      moth_number: `MT-${Math.floor(Math.random() * 90 + 10)}`,
      area_sqfeet: 1369,
      unit_id: 1,
      land_measuring_unit_id: 1,
      ward_no: ward,
      nature_id: 1,
      land_rate_id: wLandRates[0]?.id || masters.landRates[0]?.id || 1,
      malpot_rate_id: wMalpotRates[0]?.id || masters.malpotRates[0]?.id || 1,
      acquisition_fy_id: masters.fiscalYears[0]?.id || 2
    });
    setLandMeasureUnit("ropani");
    setRopaniParts({ ropani: 0, aana: 4, paisa: 0, dam: 0 });
    setBighaParts({ bigha: 0, kattha: 0, dhur: 7.5 });
    setSqftInput(1369);
    setSqmtreInput(127.18);
    setLandModalOpen(true);
  };

  const handleOpenEditLand = (l: any) => {
    const sqft = Number(l.area_sqfeet || 0);
    setLandForm({
      ...l,
      unit_id: l.unit_id || l.land_measuring_unit_id || 1,
      acquisition_fy_id: l.acquisition_fy_id || 2,
      ward_no: l.ward_no || dossier?.taxpayer?.ward_no || 1,
      land_rate_id: l.land_rate_id || masters.landRates[0]?.id || 1,
      malpot_rate_id: l.malpot_rate_id || masters.malpotRates[0]?.id || 1
    });
    setLandMeasureUnit("ropani");
    setRopaniParts(convertSqftToRopani(sqft));
    setBighaParts(convertSqftToBigha(sqft));
    setSqftInput(sqft);
    setSqmtreInput(Number((sqft / 10.7639).toFixed(2)));
    setLandModalOpen(true);
  };

  const handleSaveLand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (landForm.id) {
      await ApiController.updateLand(landForm.id, landForm);
      setStatusMsg("Land parcel updated!");
    } else {
      await ApiController.createLand(landForm);
      setStatusMsg("Land parcel registered!");
    }
    setLandModalOpen(false);
    loadDossier();
    onRefresh();
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleDeleteLand = async (id: number) => {
    if (!confirm("Delete this land parcel?")) return;
    await ApiController.deleteLand(id);
    setStatusMsg("Land parcel deleted.");
    loadDossier();
    onRefresh();
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // House actions
  const handleOpenAddHouse = () => {
    const firstLand = dossier?.lands?.[0];
    const secondLand = dossier?.lands?.[1];
    const kittaStr = firstLand?.kitta_number || "";
    setHouseLandMode("single");
    setHousePrimaryLandId(firstLand ? firstLand.id : null);
    setHouseSecondaryLandId(null);
    setHouseKittaNumber(kittaStr);
    setHouseForm({
      taxpayer_id: taxpayerId,
      land_id: firstLand ? firstLand.id : null,
      secondary_land_id: null,
      land_ids: firstLand ? [firstLand.id] : [],
      kitta_numbers: kittaStr,
      house_no: kittaStr ? `H-${kittaStr.replace(/[^a-zA-Z0-9-]/g, "")}` : `HN-${Math.floor(Math.random() * 900 + 100)}`,
      area_sqfeet: 2400,
      plinth_area: 1200,
      floor_no: 2,
      construction_type_id: 1,
      acquisition_date_bs: "2076-02-15",
      acquisition_date_ad: "2019-05-29"
    });
    setHouseModalOpen(true);
  };

  const handleOpenEditHouse = (h: any) => {
    const isTwo = Boolean(h.secondary_land_id || (h.land_ids && h.land_ids.length > 1) || (h.kitta_numbers && h.kitta_numbers.includes(",")));
    setHouseLandMode(isTwo ? "two_lands" : "single");
    setHousePrimaryLandId(h.land_id || (dossier?.lands?.[0]?.id ?? null));
    setHouseSecondaryLandId(h.secondary_land_id || (dossier?.lands?.[1]?.id ?? null));
    setHouseKittaNumber(h.kitta_numbers || "");
    setHouseForm({ ...h });
    setHouseModalOpen(true);
  };

  const handleSaveHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    const pLandId = housePrimaryLandId || houseForm.land_id || dossier?.lands?.[0]?.id || null;
    const sLandId = houseLandMode === "two_lands" ? (houseSecondaryLandId || houseForm.secondary_land_id || null) : null;
    const resolvedLandIds = [pLandId, sLandId].filter(Boolean).map(Number);
    const pLand = dossier?.lands?.find((l: any) => l.id === pLandId);
    const sLand = dossier?.lands?.find((l: any) => l.id === sLandId);
    let kittaStr = houseKittaNumber || houseForm.kitta_numbers || "";
    if (!kittaStr && pLand) {
      kittaStr = (houseLandMode === "two_lands" && sLand && sLand.id !== pLand.id)
        ? `${pLand.kitta_number}, ${sLand.kitta_number}`
        : pLand.kitta_number;
    }

    const payload = {
      ...houseForm,
      taxpayer_id: taxpayerId,
      land_id: pLandId,
      secondary_land_id: sLandId,
      land_ids: resolvedLandIds,
      kitta_numbers: kittaStr
    };

    if (houseForm.id) {
      await ApiController.updateHouse(houseForm.id, payload);
      setStatusMsg(`House structure updated (Linked to Kitta #${kittaStr})!`);
    } else {
      await ApiController.createHouse(payload);
      setStatusMsg(`House structure registered (Linked to Kitta #${kittaStr})!`);
    }
    setHouseModalOpen(false);
    loadDossier();
    onRefresh();
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleDeleteHouse = async (id: number) => {
    if (!confirm("Delete this house structure and its floors?")) return;
    await ApiController.deleteHouse(id);
    setStatusMsg("House structure deleted.");
    loadDossier();
    onRefresh();
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // Floor actions
  const handleOpenAddFloor = (houseId?: number) => {
    const targetHouseId = houseId || dossier?.houses[0]?.id || 1;
    setFloorForm({
      house_id: targetHouseId,
      floor_no: (dossier?.floors?.filter((f: any) => f.house_id === targetHouseId).length || 0) + 1,
      area_sqfeet: 1100,
      construction_type_id: 1,
      rate_id: 1,
      measuring_unit_id: 1,
      construction_date_bs: "2080-02-01",
      construction_date_ad: "2023-05-15",
      depreciation_percent: 5,
      remarks: "Upper Floor"
    });
    setFloorModalOpen(true);
  };

  const handleOpenEditFloor = (fl: any) => {
    setFloorForm({ ...fl });
    setFloorModalOpen(true);
  };

  const handleSaveFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (floorForm.id) {
      await ApiController.updateFloor(floorForm.id, floorForm);
      setStatusMsg("Floor updated!");
    } else {
      await ApiController.createFloor(floorForm);
      setStatusMsg("Floor added!");
    }
    setFloorModalOpen(false);
    loadDossier();
    onRefresh();
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleDeleteFloor = async (id: number) => {
    if (!confirm("Delete this floor?")) return;
    await ApiController.deleteFloor(id);
    setStatusMsg("Floor deleted.");
    loadDossier();
    onRefresh();
    setTimeout(() => setStatusMsg(null), 3000);
  };

  // =========================================================================
  // CALCULATION LOGIC PREPARATION (Matches exact C# Specification)
  // =========================================================================
  const currentFiscalYear = masters.fiscalYears.find((f: any) => f.id === calcFiscalYearId) || masters.fiscalYears[0];
  const fyCode = currentFiscalYear?.code || "2081/82";

  // Step 2: Load Lands & Calculate Land Evaluation Amount
  const dossierLands = dossier?.lands || [];
  const computedLands = dossierLands.map((l: any) => {
    const isSelected = calcSelectedLandIds.includes(l.id);
    const applicableRate = calcUseMalpot
      ? masters.malpotRates.find((r: any) => r.id === l.malpot_rate_id)
      : masters.landRates.find((r: any) => r.id === l.land_rate_id);

    const manual = manualLandRates[l.id] || {};
    const rateVal = manual.rate_per_unit !== undefined ? Number(manual.rate_per_unit) : applicableRate ? Number(applicableRate.rate_per_unit) : 800000;
    const areaPerUnitVal = manual.area_per_unit !== undefined ? Number(manual.area_per_unit) : applicableRate ? Number(applicableRate.area_per_unit || 1) : 1;
    const unitId = manual.unit_id !== undefined ? Number(manual.unit_id) : Number(l.unit_id || l.land_measuring_unit_id || 1);

    const evaluatedAmount = calculateLandEvaluation(
      Number(l.area_sqfeet || 0),
      unitId,
      { RatePerUnit: rateVal, AreaPerUnit: areaPerUnitVal }
    );

    return {
      land_id: l.id,
      kitta_number: l.kitta_number,
      moth_number: l.moth_number,
      ward_no: l.ward_no,
      unit_id: unitId,
      area_sqft: Number(l.area_sqfeet || 0),
      rate_id: applicableRate?.id,
      rate_name: applicableRate?.rate_name || applicableRate?.code || `Rate #${l.land_rate_id}`,
      rate_per_unit: rateVal,
      area_per_unit: areaPerUnitVal,
      rate_source: calcUseMalpot ? "Malpot Rate" : "Land Rate",
      calculated_amount: evaluatedAmount,
      total_amount: isSelected ? evaluatedAmount : 0,
      isSelected
    };
  });

  // Step 3: Calculate Floors (every floor has area, rate, depreciation, and editable overrides)
  const dossierFloors = dossier?.floors || [];
  const computedFloors = dossierFloors.map((fl: any) => {
    const editOverride = editableFloorCalcs[fl.id] || {};
    const cr = masters.constructionRates.find((r: any) => r.id === fl.rate_id) || masters.constructionRates[0];
    const defaultRate = cr ? Number(cr.rate_per_unit) : 2800;

    const area = editOverride.area_in_sqft !== undefined ? Number(editOverride.area_in_sqft) : Number(fl.area_sqfeet || 0);
    const ratePerSqft = editOverride.construction_rate !== undefined ? Number(editOverride.construction_rate) : defaultRate;

    const rawAmount = area * ratePerSqft;

    const { depreciationRate: autoDepRate } = getDepreciationAmount(
      masters.depreciations || [],
      fyCode,
      rawAmount,
      Number(fl.construction_type_id || 1),
      fl.construction_date_bs || "2075-01-01"
    );

    const depRate = editOverride.depreciation_rate !== undefined
      ? Number(editOverride.depreciation_rate)
      : (fl.depreciation_percent !== undefined ? Number(fl.depreciation_percent) : autoDepRate);
    const floorModifier = editOverride.floor_modifier_percent !== undefined ? Number(editOverride.floor_modifier_percent) : 0;

    const depreciationAmount = Math.round((rawAmount * depRate) / 100);
    const afterDep = Math.max(0, rawAmount - depreciationAmount);
    const netAmount = Math.round(afterDep * (1 + floorModifier / 100));

    return {
      floor_id: fl.id,
      house_id: fl.house_id,
      floor_no: fl.floor_no,
      area_in_sqft: area,
      construction_rate: ratePerSqft,
      depreciation_rate: depRate,
      floor_modifier_percent: floorModifier,
      calculated_amount: rawAmount,
      depreciation_amount: depreciationAmount,
      total_amount: netAmount
    };
  });

  // Step 3: Calculate Houses (Aggregate or House-Wise with editable formula parameters)
  const dossierHouses = dossier?.houses || [];
  const computedHouses = dossierHouses.map((h: any) => {
    const houseFloors = computedFloors.filter((fl: any) => fl.house_id === h.id);
    const floorTotal = houseFloors.reduce((acc: number, f: any) => acc + f.total_amount, 0);
    const houseCalc = houseFloors.reduce((acc: number, f: any) => acc + f.calculated_amount, 0);
    const houseDep = houseFloors.reduce((acc: number, f: any) => acc + f.depreciation_amount, 0);

    const formulaOverride = editableHouseFormulas[h.id] || {};
    const plinthMult = formulaOverride.plinthMultiplier !== undefined ? Number(formulaOverride.plinthMultiplier) : 1;
    const extraAdjustment = formulaOverride.customAdjustment !== undefined ? Number(formulaOverride.customAdjustment) : 0;

    const adjustedHouseTotal = Math.round((floorTotal * plinthMult) + extraAdjustment);

    return {
      house_id: h.id,
      house_no: h.house_no,
      area_sqft: Number(h.area_sqfeet || 0),
      plinth_area: Number(h.plinth_area || 0),
      unit_id: Number(h.measuring_unit_id || 1),
      depreciation_rate: houseFloors[0]?.depreciation_rate || 5,
      calculated_amount: houseCalc,
      depreciation_amount: houseDep,
      plinth_multiplier: plinthMult,
      custom_adjustment: extraAdjustment,
      floor_subtotal: floorTotal,
      total_amount: adjustedHouseTotal
    };
  });

  // Aggregation of total amounts
  const land_amount = computedLands.filter((l: any) => l.isSelected).reduce((acc: number, l: any) => acc + l.total_amount, 0);
  const house_amount = computedHouses.reduce((acc: number, h: any) => acc + h.total_amount, 0);
  const floor_amount = computedFloors.reduce((acc: number, f: any) => acc + f.total_amount, 0);
  const Evaluated_Amount = Math.round(land_amount + house_amount);

  // Multi-Fiscal-Year Range Setup
  const sortedFiscalYears = [...(masters.fiscalYears || [])].sort((a: any, b: any) => a.id - b.id);
  const minFyId = Math.min(calcFromFiscalYearId, calcToFiscalYearId);
  const maxFyId = Math.max(calcFromFiscalYearId, calcToFiscalYearId);

  const rangeFiscalYears = sortedFiscalYears.filter((fy: any) => fy.id >= minFyId && fy.id <= maxFyId);
  if (rangeFiscalYears.length === 0 && sortedFiscalYears.length > 0) {
    rangeFiscalYears.push(sortedFiscalYears[0]);
  }

  // Every Fiscal Year Breakdown in Selected Range
  const multiYearBreakdown = rangeFiscalYears.map((fy: any) => {
    const fyEvaluated = Math.round(land_amount + house_amount);
    const fyIptTax = getIPTAmount(masters.propertyRanges || [], fyEvaluated, fy.id);
    const fee = 200;
    const total = fyIptTax + fee;
    return {
      fiscal_year_id: fy.id,
      fiscal_year_code: fy.code || `FY ${fy.id}`,
      fiscal_year_name: fy.fullname || fy.code,
      land_valuation: land_amount,
      house_valuation: house_amount,
      evaluated_amount: fyEvaluated,
      ipt_tax: fyIptTax,
      sanitation_fee: fee,
      grand_total: total
    };
  });

  const cumulativeGrandTotal = multiYearBreakdown.reduce((acc: number, item: any) => acc + item.grand_total, 0);

  // Step 4: IPT Tax Calculation for Selected Active Fiscal Year
  const calculatedIptTax = getIPTAmount(masters.propertyRanges || [], Evaluated_Amount, calcFiscalYearId);
  const sanitationFee = 200;
  const grandTotalTaxPayable = calculatedIptTax + sanitationFee;

  const handleSaveCalculation = async () => {
    if (!dossier?.taxpayer) return;
    setIsSavingCalc(true);
    try {
      const res = await ApiController.saveCalculationMaster({
        taxpayer_id: dossier.taxpayer.id,
        fiscal_year_id: calcFiscalYearId,
        total_tax: grandTotalTaxPayable,
        calculate_date_bs: "2081-05-15",
        insert_by: "OPERATOR",
        lands: computedLands.filter((l: any) => l.isSelected).map((l: any) => ({
          land_id: l.land_id,
          unit_id: l.unit_id,
          area_sqft: l.area_sqft,
          calculated_amount: l.calculated_amount,
          calculated_add_amount: 0,
          calculated_subtract_amount: 0,
          calculated_total_amount: l.total_amount,
          self_declared_amount: l.total_amount,
          total_amount: l.total_amount
        })),
        houses: computedHouses.map((h: any) => ({
          house_id: h.house_id,
          area_sqft: h.area_sqft,
          unit_id: h.unit_id,
          depreciation_rate: h.depreciation_rate,
          calculated_amount: h.calculated_amount,
          depreciation_amount: h.depreciation_amount,
          calculated_add_amount: 0,
          calculated_subtract_amount: 0,
          calculated_total_amount: h.total_amount,
          self_declared_amount: h.total_amount,
          total_amount: h.total_amount
        })),
        floors: computedFloors.map((fl: any) => ({
          floor_id: fl.floor_id,
          area_in_sqft: fl.area_in_sqft,
          depreciation_rate: fl.depreciation_rate,
          calculated_amount: fl.calculated_amount,
          depreciation_amount: fl.depreciation_amount,
          calculated_add_amount: 0,
          calculated_subtract_amount: 0,
          calculated_total_amount: fl.total_amount,
          self_declared_amount: fl.total_amount,
          total_amount: fl.total_amount
        })),
        additionals: [
          {
            collection_rate_id: 1,
            flatamount: sanitationFee,
            percent: 0,
            amount: sanitationFee
          }
        ]
      });
      if (res.success) {
        setStatusMsg("Calculation saved successfully to database (calc_master, calc_land, calc_house, calc_floor)!");
        setTimeout(() => setStatusMsg(null), 3500);
      }
    } catch (e) {
      console.error(e);
      setStatusMsg("Failed to save calculation.");
    } finally {
      setIsSavingCalc(false);
    }
  };

  const toggleSelectAllLands = () => {
    if (calcSelectedLandIds.length === dossierLands.length) {
      setCalcSelectedLandIds([]);
    } else {
      setCalcSelectedLandIds(dossierLands.map((l: any) => l.id));
    }
  };

  const toggleSelectLand = (id: number) => {
    if (calcSelectedLandIds.includes(id)) {
      setCalcSelectedLandIds(calcSelectedLandIds.filter((lid) => lid !== id));
    } else {
      setCalcSelectedLandIds([...calcSelectedLandIds, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-indigo-600/20">
              {dossier?.taxpayer?.fullanme ? dossier.taxpayer.fullanme.charAt(0) : "T"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {dossier?.taxpayer?.fullanme || "Taxpayer Dossier"}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                  {dossier?.taxpayer?.code}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Ward No: {dossier?.taxpayer?.ward_no} · Mobile: {dossier?.taxpayer?.mobile_no} · PAN: {dossier?.taxpayer?.pan_vat_no || "N/A"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Strip: taxpayer, land, house, calculate */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900 overflow-x-auto no-scrollbar">
          {[
            { id: "taxpayer", label: "Taxpayer Detail", icon: User, count: null },
            { id: "land", label: "Land Info (जग्गा)", icon: MapPin, count: dossier?.lands?.length || 0 },
            { id: "house", label: "House Info (घर तथा तला)", icon: Home, count: dossier?.houses?.length || 0 },
            { id: "calculate", label: "Calculate (कर गणना)", icon: Calculator, count: null }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isActive ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Status Msg Toast */}
        {statusMsg && (
          <div className="m-4 mb-0 p-3 text-xs bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMsg}</span>
            </span>
            <button onClick={() => setStatusMsg(null)} className="font-semibold underline ml-2">
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Main Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-xs">
              Loading dossier records...
            </div>
          ) : (
            <>
              {/* ========================================================= */}
              {/* TAB 1: TAXPAYER DETAIL                                   */}
              {/* ========================================================= */}
              {activeTab === "taxpayer" && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Taxpayer Master Information (करदाता मुख्य विवरण)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Edit contact details, registration ward, and fiscal identity numbers.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveTaxpayer} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Full Name (पूरा नाम) *
                        </label>
                        <input
                          type="text"
                          required
                          value={tpForm.fullanme || ""}
                          onChange={(e) => setTpForm({ ...tpForm, fullanme: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Taxpayer Code (करदाता कोड)
                        </label>
                        <input
                          type="text"
                          disabled
                          value={tpForm.code || ""}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 font-mono text-slate-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Mobile Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={tpForm.mobile_no || ""}
                          onChange={(e) => setTpForm({ ...tpForm, mobile_no: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Ward Number *
                        </label>
                        <input
                          type="number"
                          required
                          value={tpForm.ward_no || 1}
                          onChange={(e) => setTpForm({ ...tpForm, ward_no: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={tpForm.email || ""}
                          onChange={(e) => setTpForm({ ...tpForm, email: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          PAN / VAT Number
                        </label>
                        <input
                          type="text"
                          value={tpForm.pan_vat_no || ""}
                          onChange={(e) => setTpForm({ ...tpForm, pan_vat_no: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                          Citizenship Certificate No
                        </label>
                        <input
                          type="text"
                          value={tpForm.citizenship_no || ""}
                          onChange={(e) => setTpForm({ ...tpForm, citizenship_no: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Taxpayer Details</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: LAND INFO                                         */}
              {/* ========================================================= */}
              {activeTab === "land" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>Registered Land Parcels (जग्गा कित्ता विवरण)</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        View land parcels, area, measuring units, and valuation rates.
                      </p>
                    </div>

                    <button
                      onClick={handleOpenAddLand}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Land Parcel</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px]">
                          <tr>
                            <th className="p-3">{tCol("kitta_number", currentLang)}</th>
                            <th className="p-3">{tCol("ward_no", currentLang)}</th>
                            <th className="p-3">{tCol("acquisition_fy_id", currentLang)}</th>
                            <th className="p-3">{tCol("area_sqfeet", currentLang)}</th>
                            <th className="p-3">{tCol("unit_id", currentLang)}</th>
                            <th className="p-3">{tCol("land_rate_id", currentLang)}</th>
                            <th className="p-3">{tCol("malpot_rate_id", currentLang)}</th>
                            <th className="p-3">{tCol("land_amount", currentLang)}</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                          {dossier?.lands?.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="p-8 text-center text-slate-400 font-sans">
                                No land parcels registered yet.
                              </td>
                            </tr>
                          ) : (
                            dossier?.lands?.map((l: any) => {
                              const lr = masters.landRates.find((r: any) => r.id === l.land_rate_id);
                              const mr = masters.malpotRates.find((r: any) => r.id === l.malpot_rate_id);
                              const acqFy = masters.fiscalYears.find((fy: any) => fy.id === (l.acquisition_fy_id || l.fiscal_year_id));
                              return (
                                <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                                    <div>{l.kitta_number}</div>
                                    <div className="text-[10px] text-slate-400 font-normal">Moth: {l.moth_number || "-"}</div>
                                  </td>
                                  <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                                    Ward #{l.ward_no}
                                  </td>
                                  <td className="p-3 text-slate-700 dark:text-slate-300">
                                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold">
                                      {acqFy?.code || "2081/82"}
                                    </span>
                                  </td>
                                  <td className="p-3 font-bold">
                                    {l.area_sqfeet} sq.ft
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                                      {l.unit_id === 1 ? "Ropani" : l.unit_id === 2 ? "Bigha" : l.unit_id === 4 ? "Sq.Metre" : "Sq.Ft"}
                                    </span>
                                  </td>
                                  <td className="p-3 text-slate-700 dark:text-slate-300 text-[11px]">
                                    <div className="font-semibold">{lr?.rate_name || lr?.code || `Rate #${l.land_rate_id}`}</div>
                                    <div className="text-[10px] text-slate-400">Rs. {Number(lr?.rate_per_unit || 800000).toLocaleString()}</div>
                                  </td>
                                  <td className="p-3 text-slate-700 dark:text-slate-300 text-[11px]">
                                    <div className="font-semibold">{mr?.rate_name || mr?.code || `Rate #${l.malpot_rate_id}`}</div>
                                    <div className="text-[10px] text-slate-400">Rs. {Number(mr?.rate_per_unit || 600000).toLocaleString()}</div>
                                  </td>
                                  <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                                    Rs. {Number(l.assessed_valuation || 0).toLocaleString()}
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5 font-sans">
                                      <button
                                        onClick={() => handleOpenEditLand(l)}
                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg"
                                        title="Edit Land"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteLand(l.id)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
                                        title="Delete Land"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 3: HOUSE & FLOOR INFO                                */}
              {/* ========================================================= */}
              {activeTab === "house" && (
                <div className="space-y-6">
                  {/* Houses Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Home className="w-4 h-4 text-purple-600" />
                          <span>Building & House Structures (घर विवरण)</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Structures registered with plinth areas, floors, and construction types.
                        </p>
                      </div>

                      <button
                        onClick={handleOpenAddHouse}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add House Structure</span>
                      </button>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px]">
                          <tr>
                            <th className="p-3">{tCol("house_no", currentLang)}</th>
                            <th className="p-3">{tCol("kitta_numbers", currentLang)}</th>
                            <th className="p-3">{tCol("plinth_area", currentLang)}</th>
                            <th className="p-3">{tCol("floor_no", currentLang)}</th>
                            <th className="p-3">{tCol("construction_type_id", currentLang)}</th>
                            <th className="p-3">{tCol("construction_date_bs", currentLang)}</th>
                            <th className="p-3">{tCol("house_amount", currentLang)}</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                          {dossier?.houses?.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-6 text-center text-slate-400 font-sans">
                                No house structures registered.
                              </td>
                            </tr>
                          ) : (
                            dossier?.houses?.map((h: any) => {
                              const cType = masters.constructionTypes.find((c: any) => c.id === h.construction_type_id);
                              const linkedLand = dossier?.lands?.find((l: any) => l.id === h.land_id);
                              const secLand = dossier?.lands?.find((l: any) => l.id === h.secondary_land_id);
                              const isSpanning = Boolean(h.secondary_land_id || (h.kitta_numbers && h.kitta_numbers.includes(",")));
                              return (
                                <tr key={h.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                  <td className="p-3 font-bold text-slate-900 dark:text-white">{h.house_no}</td>
                                  <td className="p-3 font-sans">
                                    {isSpanning ? (
                                      <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-mono text-[11px] font-bold border border-purple-200 dark:border-purple-800 inline-flex items-center gap-1">
                                        <span>Spans 2 Lands: Kitta #{h.kitta_numbers || `${linkedLand?.kitta_number}, ${secLand?.kitta_number}`}</span>
                                      </span>
                                    ) : linkedLand ? (
                                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                                        <span>Kitta #{h.kitta_numbers || linkedLand.kitta_number} (Ward {linkedLand.ward_no})</span>
                                      </span>
                                    ) : (
                                      <span className="text-slate-400">Independent</span>
                                    )}
                                  </td>
                                  <td className="p-3 font-bold">
                                    {h.plinth_area} sq.ft <span className="font-normal text-slate-400">(Total: {h.area_sqfeet})</span>
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px]">
                                      {h.floor_no} Floors
                                    </span>
                                  </td>
                                  <td className="p-3 font-sans text-slate-700 dark:text-slate-300">{cType?.fullanme || "RCC Frame"}</td>
                                  <td className="p-3 text-slate-600 dark:text-slate-400">{h.acquisition_date_bs || "2076-02-15"}</td>
                                  <td className="p-3 font-bold text-purple-600 dark:text-purple-400">
                                    Rs. {Number(h.assessed_valuation || 0).toLocaleString()}
                                  </td>
                                  <td className="p-3 text-right font-sans">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => handleOpenAddFloor(h.id)}
                                        className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg text-[11px] font-semibold"
                                        title="Add Floor to this House"
                                      >
                                        + Floor
                                      </button>
                                      <button
                                        onClick={() => handleOpenEditHouse(h)}
                                        className="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteHouse(h.id)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Floor Slabs Section */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-600" />
                          <span>Floor Slabs (तला इकाइहरू)</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          Individual floor units evaluated by construction rate and annual depreciation.
                        </p>
                      </div>

                      <button
                        onClick={() => handleOpenAddFloor()}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Floor Unit</span>
                      </button>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px]">
                          <tr>
                            <th className="p-3">{tCol("floor_no", currentLang)}</th>
                            <th className="p-3">{tCol("area_sqfeet", currentLang)}</th>
                            <th className="p-3">{tCol("construction_date_bs", currentLang)}</th>
                            <th className="p-3">{tCol("rate_id", currentLang)}</th>
                            <th className="p-3">{tCol("depreciation_percent", currentLang)}</th>
                            <th className="p-3">{tCol("floor_amount", currentLang)}</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                          {dossier?.floors?.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-slate-400 font-sans">
                                No floor units registered.
                              </td>
                            </tr>
                          ) : (
                            dossier?.floors?.map((fl: any) => {
                              const cr = masters.constructionRates.find((r: any) => r.id === fl.rate_id);
                              return (
                                <tr key={fl.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                                  <td className="p-3">
                                    <div className="font-bold text-slate-900 dark:text-white">Floor #{fl.floor_no}</div>
                                    {(() => {
                                      const lkH = dossier?.houses?.find((h: any) => h.id === fl.house_id);
                                      const lkLand = dossier?.lands?.find((l: any) => l.id === lkH?.land_id);
                                      return lkH ? (
                                        <div className="text-[10px] text-purple-700 dark:text-purple-300 font-mono mt-0.5 inline-flex items-center gap-1">
                                          <span>House #{lkH.house_no}</span>
                                          <span className="text-slate-400">·</span>
                                          <span>Kitta #{lkH.kitta_numbers || lkLand?.kitta_number || "N/A"}</span>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-slate-400 font-mono">House #{fl.house_id}</div>
                                      );
                                    })()}
                                  </td>
                                  <td className="p-3 font-bold">{fl.area_sqfeet} sq.ft</td>
                                  <td className="p-3 text-slate-600 dark:text-slate-400">{fl.construction_date_bs || "2080-02-01"}</td>
                                  <td className="p-3 text-slate-700 dark:text-slate-300">Rs. {cr?.rate_per_unit || 2800} / sq.ft</td>
                                  <td className="p-3 text-amber-600 dark:text-amber-400 font-bold">-{fl.depreciation_percent}%</td>
                                  <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                                    Rs. {Number(fl.floor_assessed_valuation || 0).toLocaleString()}
                                  </td>
                                  <td className="p-3 text-right font-sans">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => handleOpenEditFloor(fl)}
                                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteFloor(fl.id)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 4: CALCULATE (Preparation For Calculation)           */}
              {/* ========================================================= */}
              {activeTab === "calculate" && (
                <div className="space-y-6">
                  {/* Step 1: Select Fiscal Year Range (from_fiscal_year to to_fiscal_year) & Rate Matrix Mode */}
                  <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          Tax Calculation Engine · Step 1
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Multi-Fiscal-Year Range Assessment & Valuation Source
                        </h3>
                        <p className="text-xs text-slate-500">
                          Select a multi-year range from starting fiscal year to ending fiscal year to evaluate cumulative municipal property tax.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {/* From Fiscal Year */}
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">From FY:</span>
                          <select
                            value={calcFromFiscalYearId}
                            onChange={(e) => {
                              const fromId = Number(e.target.value);
                              setCalcFromFiscalYearId(fromId);
                              if (fromId > calcToFiscalYearId) {
                                setCalcToFiscalYearId(fromId);
                              }
                            }}
                            className="text-xs font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                          >
                            {masters.fiscalYears.map((fy: any) => (
                              <option key={fy.id} value={fy.id}>
                                {fy.code}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* To Fiscal Year */}
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">To FY:</span>
                          <select
                            value={calcToFiscalYearId}
                            onChange={(e) => {
                              const toId = Number(e.target.value);
                              setCalcToFiscalYearId(toId);
                              if (toId < calcFromFiscalYearId) {
                                setCalcFromFiscalYearId(toId);
                              }
                            }}
                            className="text-xs font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                          >
                            {masters.fiscalYears.map((fy: any) => (
                              <option key={fy.id} value={fy.id}>
                                {fy.code}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Rate Mode: Land Rate vs Malpot */}
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                          <span className="text-slate-600 dark:text-slate-400 font-semibold">Rate Source:</span>
                          <button
                            type="button"
                            onClick={() => setCalcUseMalpot(!calcUseMalpot)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                              calcUseMalpot
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}
                          >
                            {calcUseMalpot ? "Malpot Rate (सरकारी दर)" : "Land Rate (नगरपालिका दर)"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Every Fiscal Year Breakdown Table */}
                    <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-900/60 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-indigo-600" />
                          <span>Every Fiscal Year Assessment Breakdown ({rangeFiscalYears.length} Years in Range)</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          Cumulative Multi-Year Total: Rs. {cumulativeGrandTotal.toLocaleString()}
                        </span>
                      </div>

                      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px] uppercase">
                            <tr>
                              <th className="p-2.5">Fiscal Year</th>
                              <th className="p-2.5">Land Valuation</th>
                              <th className="p-2.5">House & Floor Valuation</th>
                              <th className="p-2.5">Evaluated Property Total</th>
                              <th className="p-2.5">IPT Slab Tax</th>
                              <th className="p-2.5">Sanitation Fee</th>
                              <th className="p-2.5 font-bold">Grand Tax Payable</th>
                              <th className="p-2.5 text-center">Active Target</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                            {multiYearBreakdown.map((row: any) => {
                              const isInspected = row.fiscal_year_id === calcFiscalYearId;
                              return (
                                <tr
                                  key={row.fiscal_year_id}
                                  className={`transition-colors ${isInspected ? "bg-indigo-50/40 dark:bg-indigo-950/30 font-bold" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/40"}`}
                                >
                                  <td className="p-2.5 text-indigo-600 dark:text-indigo-400">
                                    {row.fiscal_year_code} ({row.fiscal_year_name})
                                  </td>
                                  <td className="p-2.5">Rs. {row.land_valuation.toLocaleString()}</td>
                                  <td className="p-2.5">Rs. {row.house_valuation.toLocaleString()}</td>
                                  <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                                    Rs. {row.evaluated_amount.toLocaleString()}
                                  </td>
                                  <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-bold">
                                    Rs. {row.ipt_tax.toLocaleString()}
                                  </td>
                                  <td className="p-2.5 text-slate-500">Rs. {row.sanitation_fee}</td>
                                  <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-black">
                                    Rs. {row.grand_total.toLocaleString()}
                                  </td>
                                  <td className="p-2.5 text-center font-sans">
                                    <button
                                      type="button"
                                      onClick={() => setCalcFiscalYearId(row.fiscal_year_id)}
                                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                                        isInspected
                                          ? "bg-indigo-600 text-white shadow-xs"
                                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                                      }`}
                                    >
                                      {isInspected ? "Current (Active)" : "Inspect"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Load Lands of Taxpayer - Selectable for Calculation */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Step 2: land_amount Clear Calc Formula (Editable)
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Land Parcels & Bracket Measurement Logic
                        </h4>
                        <p className="text-xs text-slate-500">
                          Displays rate_per_unit, area_per_unit, unit_id. Multiplications can be verified or updated manually.
                        </p>
                      </div>

                      <button
                        onClick={toggleSelectAllLands}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200"
                      >
                        {calcSelectedLandIds.length === dossierLands.length ? (
                          <>
                            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Deselect All</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-3.5 h-3.5" />
                            <span>Select All ({dossierLands.length})</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* How land_amount is Calculated Explanation */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs space-y-1.5">
                      <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>How land_amount is Calculated (जग्गा मूल्याङ्कन सूत्र):</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                        Normalized parcel area is divided by area_per_unit and multiplied by rate_per_unit based on unit brackets.
                      </p>
                      <div className="font-mono text-[11px] p-2 bg-white/70 dark:bg-slate-900/60 rounded-lg border border-emerald-200 text-emerald-800 dark:text-emerald-300 font-semibold">
                        Formula: land_amount = ∑ [ (Normalized Land Area ÷ area_per_unit) × rate_per_unit ]
                      </div>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px]">
                            <tr>
                              <th className="p-3 w-10 text-center">Select</th>
                              <th className="p-3">Kitta / Moth</th>
                              <th className="p-3">Area (Sq.Ft)</th>
                              <th className="p-3">unit_id</th>
                              <th className="p-3">rate_per_unit</th>
                              <th className="p-3">area_per_unit</th>
                              <th className="p-3">Calculation Formula</th>
                              <th className="p-3">Rate Source</th>
                              <th className="p-3 text-right">Evaluated Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                            {computedLands.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="p-6 text-center text-slate-400 font-sans">
                                  No lands available for calculation.
                                </td>
                              </tr>
                            ) : (
                              computedLands.map((cl: any) => (
                                <tr
                                  key={cl.land_id}
                                  className={`transition-colors ${cl.isSelected ? "bg-indigo-50/20 dark:bg-indigo-950/10" : "opacity-60"}`}
                                >
                                  <td className="p-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={cl.isSelected}
                                      onChange={() => toggleSelectLand(cl.land_id)}
                                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                  </td>
                                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                                    Kitta #{cl.kitta_number} <span className="font-normal text-slate-400">({cl.moth_number})</span>
                                  </td>
                                  <td className="p-3 font-bold">{cl.area_sqft}</td>
                                  <td className="p-3">
                                    <select
                                      value={cl.unit_id}
                                      onChange={(e) => {
                                        const uid = Number(e.target.value);
                                        setManualLandRates({
                                          ...manualLandRates,
                                          [cl.land_id]: { ...(manualLandRates[cl.land_id] || {}), unit_id: uid }
                                        });
                                      }}
                                      className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                                    >
                                      <option value={1}>1 (Ropani)</option>
                                      <option value={2}>2 (Bigha)</option>
                                      <option value={3}>3 (Sq.Ft)</option>
                                      <option value={4}>4 (Sq.Metre)</option>
                                    </select>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center gap-1">
                                      <span>Rs.</span>
                                      <input
                                        type="number"
                                        value={cl.rate_per_unit}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setManualLandRates({
                                            ...manualLandRates,
                                            [cl.land_id]: { ...(manualLandRates[cl.land_id] || {}), rate_per_unit: val }
                                          });
                                        }}
                                        className="w-24 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="number"
                                      value={cl.area_per_unit}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setManualLandRates({
                                          ...manualLandRates,
                                          [cl.land_id]: { ...(manualLandRates[cl.land_id] || {}), area_per_unit: val }
                                        });
                                      }}
                                      className="w-16 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                                    />
                                  </td>
                                  <td className="p-3 text-[11px] text-slate-500 font-mono">
                                    ({cl.area_sqft} ÷ {cl.area_per_unit}) × Rs. {cl.rate_per_unit.toLocaleString()}
                                  </td>
                                  <td className="p-3 font-sans text-slate-600 dark:text-slate-400 text-[11px]">{cl.rate_source}</td>
                                  <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                    Rs. {cl.calculated_amount.toLocaleString()}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-500 font-sans">
                          Selected Lands Total ({computedLands.filter((l: any) => l.isSelected).length} parcels):
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          Rs. {land_amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: House Evaluation Details & Editable Formula */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                          Step 3: House Evaluation Details & Editable Formula (calc_house)
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Structural Engineering Evaluation & Formula Mechanics
                        </h4>
                      </div>
                      <span className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400">
                        Total House Valuation: Rs. {house_amount.toLocaleString()}
                      </span>
                    </div>

                    {/* How House Evaluation is Done Explanation */}
                    <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 text-xs space-y-2">
                      <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                        <Home className="w-4 h-4 text-purple-600" />
                        <span>How House Evaluation is Done (घर मूल्याङ्कन विधि)</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                        House evaluation aggregates all registered floor slabs belonging to the structure. For each floor, the built-up area is multiplied by the construction rate based on building category (e.g. RCC framed, brick masonry). Then, an age-based depreciation percentage is subtracted based on the acquisition year. The house valuation can also be adjusted using an editable formula multiplier or custom municipal factors below.
                      </p>
                      <div className="font-mono text-[11px] p-2 bg-white/70 dark:bg-slate-900/60 rounded-lg border border-purple-200/50 dark:border-purple-800 text-purple-800 dark:text-purple-300 font-semibold">
                        Formula: House Valuation = [ ∑ Floor Net Amounts ] × Plinth Multiplier + Custom Municipal Adjustment
                      </div>
                    </div>

                    {/* House Structure List with Editable Formulas */}
                    <div className="space-y-3">
                      {computedHouses.length === 0 ? (
                        <div className="text-slate-400 text-center py-6 text-xs">No houses registered for evaluation.</div>
                      ) : (
                        computedHouses.map((h: any) => {
                          const fOverride = editableHouseFormulas[h.house_id] || {};
                          return (
                            <div
                              key={h.house_id}
                              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                                    <span>House #{h.house_no}</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono">
                                      Plinth: {h.plinth_area} sqft · Built Area: {h.area_sqft} sqft
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-mono">
                                    Raw Floor Slabs Subtotal: Rs. {h.floor_subtotal.toLocaleString()} · Total Floors Dep: -Rs. {h.depreciation_amount.toLocaleString()}
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400">
                                    Rs. {h.total_amount.toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              {/* Editable Formula Controls for House */}
                              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div>
                                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1 text-[11px]">
                                    Plinth / Area Multiplier Factor (Formula Parameter)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.05"
                                    value={h.plinth_multiplier}
                                    onChange={(e) => {
                                      const mult = Number(e.target.value);
                                      setEditableHouseFormulas({
                                        ...editableHouseFormulas,
                                        [h.house_id]: { ...(editableHouseFormulas[h.house_id] || {}), plinthMultiplier: mult }
                                      });
                                    }}
                                    className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                                  />
                                </div>

                                <div>
                                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1 text-[11px]">
                                    Custom Municipal Adjustment (+ / - Rs.)
                                  </label>
                                  <input
                                    type="number"
                                    value={h.custom_adjustment}
                                    onChange={(e) => {
                                      const adj = Number(e.target.value);
                                      setEditableHouseFormulas({
                                        ...editableHouseFormulas,
                                        [h.house_id]: { ...(editableHouseFormulas[h.house_id] || {}), customAdjustment: adj }
                                      });
                                    }}
                                    className="w-full px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                                  />
                                </div>

                                <div className="flex flex-col justify-end">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold mb-1">Live Evaluated Formula</span>
                                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono text-[11px] text-purple-700 dark:text-purple-300 font-bold border border-slate-200 dark:border-slate-700">
                                    ({h.floor_subtotal.toLocaleString()} × {h.plinth_multiplier}) {h.custom_adjustment >= 0 ? `+ ${h.custom_adjustment}` : `- ${Math.abs(h.custom_adjustment)}`} = Rs. {h.total_amount.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Step 3: Floor Evaluation Details & Editable Calculation */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                          Step 3: Floors Detail Editable Calculation (calc_floor)
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          Per-Floor Slab Engineering Calculation & Formula Parameters
                        </h4>
                        <p className="text-xs text-slate-500">
                          Edit built area, construction rate, depreciation %, or level modifier. Values recalculate instantly.
                        </p>
                      </div>

                      <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        Total Floors Valuation: Rs. {floor_amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px]">
                            <tr>
                              <th className="p-3">Floor # & Ref</th>
                              <th className="p-3">Area (Sq.Ft)</th>
                              <th className="p-3">Rate (Rs./Sq.Ft)</th>
                              <th className="p-3">Depreciation %</th>
                              <th className="p-3">Floor Modifier %</th>
                              <th className="p-3">Calculation Formula</th>
                              <th className="p-3 text-right">Net Assessed Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                            {computedFloors.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-6 text-center text-slate-400 font-sans">
                                  No floor slabs registered.
                                </td>
                              </tr>
                            ) : (
                              computedFloors.map((fl: any) => (
                                <tr key={fl.floor_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                                    Floor #{fl.floor_no} <span className="text-[11px] font-normal text-slate-400">(House #{fl.house_id})</span>
                                  </td>

                                  {/* Editable Area Sqft */}
                                  <td className="p-3">
                                    <input
                                      type="number"
                                      step="any"
                                      value={fl.area_in_sqft}
                                      onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setEditableFloorCalcs({
                                          ...editableFloorCalcs,
                                          [fl.floor_id]: { ...(editableFloorCalcs[fl.floor_id] || {}), area_in_sqft: val }
                                        });
                                      }}
                                      className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                                    />
                                  </td>

                                  {/* Editable Construction Rate */}
                                  <td className="p-3">
                                    <div className="flex items-center gap-1">
                                      <span>Rs.</span>
                                      <input
                                        type="number"
                                        value={fl.construction_rate}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setEditableFloorCalcs({
                                            ...editableFloorCalcs,
                                            [fl.floor_id]: { ...(editableFloorCalcs[fl.floor_id] || {}), construction_rate: val }
                                          });
                                        }}
                                        className="w-20 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                                      />
                                    </div>
                                  </td>

                                  {/* Editable Depreciation % */}
                                  <td className="p-3">
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        step="any"
                                        value={fl.depreciation_rate}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setEditableFloorCalcs({
                                            ...editableFloorCalcs,
                                            [fl.floor_id]: { ...(editableFloorCalcs[fl.floor_id] || {}), depreciation_rate: val }
                                          });
                                        }}
                                        className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-amber-600 font-bold"
                                      />
                                      <span>%</span>
                                    </div>
                                  </td>

                                  {/* Editable Floor Level Modifier % */}
                                  <td className="p-3">
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        step="any"
                                        value={fl.floor_modifier_percent}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setEditableFloorCalcs({
                                            ...editableFloorCalcs,
                                            [fl.floor_id]: { ...(editableFloorCalcs[fl.floor_id] || {}), floor_modifier_percent: val }
                                          });
                                        }}
                                        placeholder="0"
                                        className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                                      />
                                      <span>%</span>
                                    </div>
                                  </td>

                                  {/* Calculation Formula Live Breakdown */}
                                  <td className="p-3 text-[11px] text-slate-500 font-mono">
                                    [({fl.area_in_sqft} × {fl.construction_rate}) - {fl.depreciation_rate}%] × (100+{fl.floor_modifier_percent})%
                                  </td>

                                  {/* Total Floor Amount */}
                                  <td className="p-3 text-right font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                                    Rs. {fl.total_amount.toLocaleString()}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Integrated Property Tax Calculation */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white space-y-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-800/60">
                      <div>
                        <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                          Final Assessment · Integrated Property Tax · Active FY: {currentFiscalYear?.code}
                        </div>
                        <h4 className="text-lg font-bold text-white">
                          Total Evaluated Amount & IPT Liability
                        </h4>
                      </div>

                      <button
                        onClick={handleSaveCalculation}
                        disabled={isSavingCalc}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black rounded-xl shadow-lg transition-colors text-xs"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSavingCalc ? "Saving Calculation..." : "Save Calculation to DB"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] text-indigo-200 uppercase font-sans">Land Evaluation (land_amount)</div>
                        <div className="text-base font-bold text-white">Rs. {land_amount.toLocaleString()}</div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] text-indigo-200 uppercase font-sans">House / Floor (house_amount)</div>
                        <div className="text-base font-bold text-white">Rs. {house_amount.toLocaleString()}</div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] text-indigo-200 uppercase font-sans">Evaluated_Amount (Total)</div>
                        <div className="text-lg font-black text-amber-400">Rs. {Evaluated_Amount.toLocaleString()}</div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30">
                        <div className="text-[10px] text-emerald-300 uppercase font-sans">Grand IPT Tax (tax_amount)</div>
                        <div className="text-xl font-black text-emerald-400">Rs. {grandTotalTaxPayable.toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-200 font-sans">Includes Sanitation Rs. {sanitationFee}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50 dark:bg-slate-800/40">
          <span>Municipal Tax Dossier System · Integrated Property Tax (IPT) Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl font-semibold"
          >
            Close Dossier
          </button>
        </div>
      </div>

      {/* Local Land Modal with Full Measurement Tool */}
      {landModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4 shrink-0">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>{landForm.id ? "Edit Land Parcel" : "Add Land Parcel"}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Land measurement tool with auto-conversion to square feet and municipal rate linking.
                </p>
              </div>
              <button
                onClick={() => setLandModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLand} className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs">
              {/* Row 1: Kitta, Moth, Ward No */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Kitta Number (कित्ता नं.) *
                  </label>
                  <input
                    type="text"
                    required
                    value={landForm.kitta_number || ""}
                    onChange={(e) => setLandForm({ ...landForm, kitta_number: e.target.value })}
                    placeholder="e.g. KT-501"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Ward No (वडा नं.) *
                  </label>
                  <input
                    type="number"
                    required
                    value={landForm.ward_no ?? 1}
                    onChange={(e) => setLandForm({ ...landForm, ward_no: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Moth / Shresta No (मोठ नं.)
                  </label>
                  <input
                    type="text"
                    value={landForm.moth_number || ""}
                    onChange={(e) => setLandForm({ ...landForm, moth_number: e.target.value })}
                    placeholder="e.g. MT-45"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Row 2: Acquisition Fiscal Year, Land Rate, Malpot Rate */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Acquisition Fiscal Year (प्राप्ति आ.व.)
                  </label>
                  <select
                    value={landForm.acquisition_fy_id || masters.fiscalYears[0]?.id || 2}
                    onChange={(e) => setLandForm({ ...landForm, acquisition_fy_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  >
                    {masters.fiscalYears.map((fy: any) => (
                      <option key={fy.id} value={fy.id}>
                        {fy.code} - {fy.fullname}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Land Rate (नगरपालिका दर)
                  </label>
                  <select
                    value={landForm.land_rate_id || masters.landRates[0]?.id || 1}
                    onChange={(e) => setLandForm({ ...landForm, land_rate_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  >
                    {masters.landRates.map((lr: any) => (
                      <option key={lr.id} value={lr.id}>
                        {lr.rate_name || lr.code} (Rs. {Number(lr.rate_per_unit).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Malpot Rate (मालपोत दर)
                  </label>
                  <select
                    value={landForm.malpot_rate_id || masters.malpotRates[0]?.id || 1}
                    onChange={(e) => setLandForm({ ...landForm, malpot_rate_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  >
                    {masters.malpotRates.map((mr: any) => (
                      <option key={mr.id} value={mr.id}>
                        {mr.rate_name || mr.code} (Rs. {Number(mr.rate_per_unit).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dedicated Land Measurement Tool Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Measurement Tool & Converter
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      Land Area Measurement & Auto-Conversion
                    </h4>
                  </div>

                  {/* Unit Selection Pills */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setLandMeasureUnit("ropani");
                        setLandForm((prev: any) => ({ ...prev, unit_id: 1, land_measuring_unit_id: 1 }));
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        landMeasureUnit === "ropani" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Ropani System
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLandMeasureUnit("bigha");
                        setLandForm((prev: any) => ({ ...prev, unit_id: 2, land_measuring_unit_id: 2 }));
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        landMeasureUnit === "bigha" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Bigha System
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLandMeasureUnit("sqft");
                        setLandForm((prev: any) => ({ ...prev, unit_id: 3, land_measuring_unit_id: 3 }));
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        landMeasureUnit === "sqft" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Sq. Feet
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLandMeasureUnit("sqmtre");
                        setLandForm((prev: any) => ({ ...prev, unit_id: 4, land_measuring_unit_id: 4 }));
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        landMeasureUnit === "sqmtre" ? "bg-emerald-600 text-white font-bold shadow-xs" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Sq. Metre
                    </button>
                  </div>
                </div>

                {/* 1. Ropani Input Fields (ropani, aana, paisa, dam) */}
                {landMeasureUnit === "ropani" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Ropani (रोपनी)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={ropaniParts.ropani}
                        onChange={(e) => {
                          const r = Number(e.target.value);
                          const next = { ...ropaniParts, ropani: r };
                          setRopaniParts(next);
                          const sqft = convertRopaniToSqft(next.ropani, next.aana, next.paisa, next.dam);
                          setLandForm((prev: any) => ({ ...prev, area_sqfeet: sqft }));
                          setSqftInput(sqft);
                          setSqmtreInput(Number((sqft / 10.7639).toFixed(2)));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Aana (आना)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="15.99"
                        step="any"
                        value={ropaniParts.aana}
                        onChange={(e) => {
                          const a = Number(e.target.value);
                          const next = { ...ropaniParts, aana: a };
                          setRopaniParts(next);
                          const sqft = convertRopaniToSqft(next.ropani, next.aana, next.paisa, next.dam);
                          setLandForm((prev: any) => ({ ...prev, area_sqfeet: sqft }));
                          setSqftInput(sqft);
                          setSqmtreInput(Number((sqft / 10.7639).toFixed(2)));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Paisa (पैसा)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="3.99"
                        step="any"
                        value={ropaniParts.paisa}
                        onChange={(e) => {
                          const p = Number(e.target.value);
                          const next = { ...ropaniParts, paisa: p };
                          setRopaniParts(next);
                          const sqft = convertRopaniToSqft(next.ropani, next.aana, next.paisa, next.dam);
                          setLandForm((prev: any) => ({ ...prev, area_sqfeet: sqft }));
                          setSqftInput(sqft);
                          setSqmtreInput(Number((sqft / 10.7639).toFixed(2)));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Daam (दाम)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="3.99"
                        step="any"
                        value={ropaniParts.dam}
                        onChange={(e) => {
                          const d = Number(e.target.value);
                          const next = { ...ropaniParts, dam: d };
                          setRopaniParts(next);
                          const sqft = convertRopaniToSqft(next.ropani, next.aana, next.paisa, next.dam);
                          setLandForm((prev: any) => ({ ...prev, area_sqfeet: sqft }));
                          setSqftInput(sqft);
                          setSqmtreInput(Number((sqft / 10.7639).toFixed(2)));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>
                  </div>
                )}

                {/* 2. Bigha Input Fields (bigha, kattha, dhur) */}
                {landMeasureUnit === "bigha" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Bigha (बिघा)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={bighaParts.bigha}
                        onChange={(e) => {
                          const b = Number(e.target.value);
                          const next = { ...bighaParts, bigha: b };
                          setBighaParts(next);
                          const sqft = convertBighaToSqft(next.bigha, next.kattha, next.dhur);
                          setLandForm((prev: any) => ({ ...prev, area_sqfeet: sqft }));
                          setSqftInput(sqft);
                          setSqmtreInput(Number((sqft / 10.7639).toFixed(2)));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Kattha (कठ्ठा)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="19.99"
                        step="any"
                        value={bighaParts.kattha}
                        onChange={(e) => {
                          const k = Number(e.target.value);
                          const next = { ...bighaParts, kattha: k };
                          setBighaParts(next);
                          const sqft = convertBighaToSqft(next.bigha, next.kattha, next.dhur);
                          setLandForm((prev: any) => ({ ...prev, area_sqfeet: sqft }));
                          setSqftInput(sqft);
                          setSqmtreInput(Number((sqft / 10.7639).toFixed(2)));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        Dhur (धुर)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="19.99"
                        step="any"
                        value={bighaParts.dhur}
                        onChange={(e) => {
                          const dh = Number(e.target.value);
                          const next = { ...bighaParts, dhur: dh };
                          setBighaParts(next);
                          const sqft = convertBighaToSqft(next.bigha, next.kattha, next.dhur);
                          setLandForm((prev: any) => ({ ...prev, area_sqfeet: sqft }));
                          setSqftInput(sqft);
                          setSqmtreInput(Number((sqft / 10.7639).toFixed(2)));
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>
                  </div>
                )}

                {/* 3. Sq. Feet Input */}
                {landMeasureUnit === "sqft" && (
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Square Feet (वर्ग फिट)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={sqftInput}
                      onChange={(e) => {
                        const sqft = Number(e.target.value);
                        setSqftInput(sqft);
                        setLandForm((prev: any) => ({ ...prev, area_sqfeet: sqft }));
                        setSqmtreInput(Number((sqft / 10.7639).toFixed(2)));
                        setRopaniParts(convertSqftToRopani(sqft));
                        setBighaParts(convertSqftToBigha(sqft));
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm"
                    />
                  </div>
                )}

                {/* 4. Sq. Metre Input */}
                {landMeasureUnit === "sqmtre" && (
                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Square Metre (वर्ग मिटर) (1 sqm = 10.7639 sq.ft)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={sqmtreInput}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        setSqmtreInput(m);
                        const sqft = convertSqmtreToSqft(m);
                        setSqftInput(sqft);
                        setLandForm((prev: any) => ({ ...prev, area_sqfeet: sqft }));
                        setRopaniParts(convertSqftToRopani(sqft));
                        setBighaParts(convertSqftToBigha(sqft));
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm"
                    />
                  </div>
                )}

                {/* Live Auto-Conversion Result Banner */}
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                        Auto Conversion Target (area_sqfeet)
                      </div>
                      <div className="text-sm font-black font-mono text-emerald-700 dark:text-emerald-200">
                        {Number(landForm.area_sqfeet || 0).toLocaleString()} Sq. Feet
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-[11px] font-mono text-slate-500">
                    <div>≈ {((Number(landForm.area_sqfeet || 0)) / 10.7639).toFixed(2)} Sq. Metre</div>
                    <div>≈ {((Number(landForm.area_sqfeet || 0)) / 342.25).toFixed(2)} Aana</div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-slate-900 pb-1 z-10 shrink-0">
                <button
                  type="button"
                  onClick={() => setLandModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {landForm.id ? "Update Land Parcel" : "Save Land Parcel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Local House Modal - Linked to Land (Single or Spanning Two Lands) */}
      {houseModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Home className="w-4 h-4 text-purple-600" />
                <span>{houseForm.id ? "Edit House Structure" : "Register House Structure (Linked to Land)"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setHouseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHouse} className="space-y-4 text-xs">
              {/* Land Parcel Association Controls (Single Land or Spanning Two Lands) */}
              <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-purple-600" />
                      <span>Land Parcel Association (घर बनेको जग्गा छनोट) *</span>
                    </label>
                    <p className="text-[11px] text-slate-500">
                      House is linked with land. A house may be made in single land or spanning two lands.
                    </p>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-purple-200 dark:border-purple-800 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setHouseLandMode("single");
                        syncHouseKittaAndLand("single", housePrimaryLandId || dossier?.lands?.[0]?.id || null, null);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                        houseLandMode === "single"
                          ? "bg-purple-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      Single Land (एकल कित्ता)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHouseLandMode("two_lands");
                        const sId = houseSecondaryLandId || (dossier?.lands?.length > 1 ? dossier?.lands[1].id : null);
                        syncHouseKittaAndLand("two_lands", housePrimaryLandId || dossier?.lands?.[0]?.id || null, sId);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                        houseLandMode === "two_lands"
                          ? "bg-purple-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      Spanning Two Lands (दुई कित्तामा बनेको)
                    </button>
                  </div>
                </div>

                {/* Dropdowns for Primary and Secondary Land Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                      {houseLandMode === "two_lands" ? "Primary Land Parcel (पहिलो जग्गा कित्ता) *" : "Taxpayer Land Parcel (करदाताको जग्गा कित्ता) *"}
                    </label>
                    <select
                      value={housePrimaryLandId || (dossier?.lands?.[0]?.id ?? "")}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setHousePrimaryLandId(val);
                        syncHouseKittaAndLand(houseLandMode, val, houseSecondaryLandId);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-indigo-600 dark:text-indigo-400"
                    >
                      {(!dossier?.lands || dossier.lands.length === 0) ? (
                        <option value="">No lands registered for this taxpayer</option>
                      ) : (
                        dossier.lands.map((l: any) => (
                          <option key={l.id} value={l.id}>
                            Kitta #{l.kitta_number} (Ward {l.ward_no}, Moth {l.moth_number || "-"}, {l.area_sqfeet} sqft)
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {houseLandMode === "two_lands" ? (
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-[11px]">
                        Secondary Land Parcel (दोस्रो जग्गा कित्ता - Spanning Land) *
                      </label>
                      <select
                        value={houseSecondaryLandId || (dossier?.lands?.[1]?.id ?? dossier?.lands?.[0]?.id ?? "")}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setHouseSecondaryLandId(val);
                          syncHouseKittaAndLand(houseLandMode, housePrimaryLandId, val);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-purple-600 dark:text-purple-400"
                      >
                        {(!dossier?.lands || dossier.lands.length < 2) ? (
                          <option value="">Only 1 land parcel available (Cannot span two lands)</option>
                        ) : (
                          dossier.lands.map((l: any) => (
                            <option key={l.id} value={l.id} disabled={l.id === housePrimaryLandId}>
                              Kitta #{l.kitta_number} (Ward {l.ward_no}, Moth {l.moth_number || "-"}, {l.area_sqfeet} sqft){l.id === housePrimaryLandId ? " (Primary)" : ""}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center text-xs text-slate-500 italic p-3 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <span>Single Parcel Mode: House is situated entirely on Kitta #{houseKittaNumber || "..."}. Switch to "Spanning Two Lands" if house crosses two plots.</span>
                    </div>
                  )}
                </div>

                {/* Auto-Set Land Kitta Number in House Visual Banner */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">
                      Auto-Set Land Kitta in House:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-200 font-mono font-black text-xs">
                      Kitta #{houseKittaNumber || "N/A"}
                    </span>
                    {houseLandMode === "two_lands" && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-[10px] font-bold">
                        Spans 2 Lands
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-slate-500">
                    Combined Land Area: {(() => {
                      const p = dossier?.lands?.find((l: any) => l.id === housePrimaryLandId);
                      const s = houseLandMode === "two_lands" ? dossier?.lands?.find((l: any) => l.id === houseSecondaryLandId) : null;
                      const tot = (Number(p?.area_sqfeet || 0)) + (Number(s?.area_sqfeet || 0));
                      return `${tot.toLocaleString()} Sq.Ft`;
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">House Number (घर नं.) *</label>
                  <input
                    type="text"
                    required
                    value={houseForm.house_no || ""}
                    onChange={(e) => setHouseForm({ ...houseForm, house_no: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Construction Structure Type *</label>
                  <select
                    value={houseForm.construction_type_id || 1}
                    onChange={(e) => setHouseForm({ ...houseForm, construction_type_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  >
                    {masters.constructionTypes.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.fullanme}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Plinth Area (Sq.Ft) *</label>
                  <input
                    type="number"
                    required
                    value={houseForm.plinth_area || 0}
                    onChange={(e) => setHouseForm({ ...houseForm, plinth_area: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Total Built Area (Sq.Ft)</label>
                  <input
                    type="number"
                    required
                    value={houseForm.area_sqfeet || 0}
                    onChange={(e) => setHouseForm({ ...houseForm, area_sqfeet: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Floor Count</label>
                  <input
                    type="number"
                    value={houseForm.floor_no || 1}
                    onChange={(e) => setHouseForm({ ...houseForm, floor_no: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Acquisition Year (BS)</label>
                  <input
                    type="text"
                    value={houseForm.acquisition_date_bs || "2076-02-15"}
                    onChange={(e) => setHouseForm({ ...houseForm, acquisition_date_bs: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setHouseModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {houseForm.id ? "Update House Structure" : "Save House Structure (Linked to Land)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Local Floor Modal - Linked to House */}
      {floorModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>{floorForm.id ? "Edit Floor Unit" : "Add Floor Unit (Linked to House)"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setFloorModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFloor} className="space-y-3.5 text-xs">
              {/* House Structure Association */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Belongs to House Structure (कुन घरको तला हो - Linked to House) *
                </label>
                <select
                  value={floorForm.house_id || (dossier?.houses?.[0]?.id ?? "")}
                  onChange={(e) => {
                    const targetHId = Number(e.target.value);
                    const hObj = dossier?.houses?.find((h: any) => h.id === targetHId);
                    const nextFlNo = (dossier?.floors?.filter((f: any) => f.house_id === targetHId).length || 0) + 1;
                    setFloorForm({
                      ...floorForm,
                      house_id: targetHId,
                      area_sqfeet: hObj?.plinth_area || floorForm.area_sqfeet,
                      floor_no: nextFlNo,
                      remarks: `Floor Level ${nextFlNo}`
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-purple-600 dark:text-purple-400"
                >
                  {(!dossier?.houses || dossier.houses.length === 0) ? (
                    <option value="">No houses registered (Please register a house first)</option>
                  ) : (
                    dossier.houses.map((h: any) => {
                      const hLand = dossier?.lands?.find((l: any) => l.id === h.land_id);
                      const kittaLabel = h.kitta_numbers || hLand?.kitta_number || "Independent";
                      return (
                        <option key={h.id} value={h.id}>
                          House #{h.house_no} (Built on Kitta #{kittaLabel} · Plinth: {h.plinth_area} sqft)
                        </option>
                      );
                    })
                  )}
                </select>

                {/* Target house badge info */}
                {(() => {
                  const selH = dossier?.houses?.find((h: any) => h.id === (floorForm.house_id || dossier?.houses?.[0]?.id));
                  const selHLand = dossier?.lands?.find((l: any) => l.id === selH?.land_id);
                  const fCount = dossier?.floors?.filter((f: any) => f.house_id === selH?.id).length || 0;
                  if (!selH) return null;
                  return (
                    <div className="mt-2 p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-purple-600" />
                        <span className="font-bold text-purple-950 dark:text-purple-200">
                          Target: House #{selH.house_no}
                        </span>
                        <span className="font-mono text-[11px] text-purple-700 dark:text-purple-300">
                          · Kitta #{selH.kitta_numbers || selHLand?.kitta_number || "N/A"}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        Plinth: {selH.plinth_area} sqft · Existing Floors: {fCount} Slabs
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Floor Level (तला क्रम नं. - 0 = Ground Floor) *
                  </label>
                  <input
                    type="number"
                    required
                    value={floorForm.floor_no ?? 1}
                    onChange={(e) => setFloorForm({ ...floorForm, floor_no: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Floor Slab Area (Sq.Ft) *</label>
                  <input
                    type="number"
                    required
                    value={floorForm.area_sqfeet || 0}
                    onChange={(e) => setFloorForm({ ...floorForm, area_sqfeet: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Construction Rate (दर)</label>
                  <select
                    value={floorForm.rate_id || 1}
                    onChange={(e) => setFloorForm({ ...floorForm, rate_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {masters.constructionRates.map((cr: any) => (
                      <option key={cr.id} value={cr.id}>{cr.rate_name || cr.code} (Rs. {Number(cr.rate_per_unit).toLocaleString()})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Built Date (BS)</label>
                  <input
                    type="text"
                    value={floorForm.construction_date_bs || "2080-02-01"}
                    onChange={(e) => setFloorForm({ ...floorForm, construction_date_bs: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Depreciation % (ह्रास कट्टी)</label>
                  <input
                    type="number"
                    step="any"
                    value={floorForm.depreciation_percent ?? 5}
                    onChange={(e) => setFloorForm({ ...floorForm, depreciation_percent: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Remarks</label>
                  <input
                    type="text"
                    value={floorForm.remarks || ""}
                    onChange={(e) => setFloorForm({ ...floorForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFloorModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs"
                >
                  {floorForm.id ? "Update Floor Unit" : "Save Floor Unit (Linked to House)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
