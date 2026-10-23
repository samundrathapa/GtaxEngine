import React, { useState, useEffect } from "react";
import { ApiController } from "../../api/controller.ts";
import {
  calculateLandEvaluation,
  getDepreciationAmount,
  getIPTAmount
} from "../../utils/calculationEngine.ts";
import { tCol, SupportedLang } from "../../utils/i18n.ts";
import {
  User,
  MapPin,
  Home,
  Layers,
  Calculator,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Save,
  ArrowRight,
  Building,
  RefreshCw,
  Edit2
} from "lucide-react";

interface OneDoorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  masters: {
    fiscalYears: any[];
    landRates: any[];
    malpotRates: any[];
    constructionRates: any[];
    constructionTypes: any[];
    units: any[];
    depreciations: any[];
    propertyRanges?: any[];
  };
  onComplete: (taxpayerId: number) => void;
  currentLang?: SupportedLang;
}

export const OneDoorRegistrationModal: React.FC<OneDoorRegistrationModalProps> = ({
  isOpen,
  onClose,
  masters,
  onComplete,
  currentLang = "eng"
}) => {
  if (!isOpen) return null;

  // Active Wizard Step: 1 = Taxpayer, 2 = Land, 3 = House, 4 = Floor, 5 = Calculate
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Taxpayer State
  const [taxpayerId, setTaxpayerId] = useState<number | null>(null);
  const [createdTaxpayer, setCreatedTaxpayer] = useState<any | null>(null);
  const [tpForm, setTpForm] = useState({
    fullanme: "",
    mobile_no: "+977-98",
    email: "",
    ward_no: 1,
    pan_vat_no: "",
    citizenship_no: ""
  });

  // 2. Lands State (one taxpayer has multiple lands)
  const [lands, setLands] = useState<any[]>([]);
  const [landForm, setLandForm] = useState<any>({
    kitta_number: `KT-${Math.floor(Math.random() * 800 + 100)}`,
    moth_number: `MT-${Math.floor(Math.random() * 90 + 10)}`,
    ward_no: 1,
    acquisition_fy_id: masters.fiscalYears[0]?.id || 2,
    land_rate_id: masters.landRates[0]?.id || 1,
    malpot_rate_id: masters.malpotRates[0]?.id || 1,
    unit_id: 1,
    area_sqfeet: 1369
  });

  // Land measurement tool state
  const [landMeasureUnit, setLandMeasureUnit] = useState<"ropani" | "bigha" | "sqft" | "sqmtre">("ropani");
  const [ropaniParts, setRopaniParts] = useState({ ropani: 0, aana: 4, paisa: 0, dam: 0 });
  const [bighaParts, setBighaParts] = useState({ bigha: 0, kattha: 0, dhur: 7.5 });
  const [sqftInput, setSqftInput] = useState<number>(1369);
  const [sqmtreInput, setSqmtreInput] = useState<number>(127.18);

  // 3. Houses State (one each land has each multiple house; house is linked with land - single or two lands)
  const [houses, setHouses] = useState<any[]>([]);
  const [houseLandMode, setHouseLandMode] = useState<"single" | "two_lands">("single");
  const [housePrimaryLandId, setHousePrimaryLandId] = useState<number | null>(null);
  const [houseSecondaryLandId, setHouseSecondaryLandId] = useState<number | null>(null);
  const [houseKittaNumber, setHouseKittaNumber] = useState<string>("");
  const [houseForm, setHouseForm] = useState<any>({
    land_id: null,
    secondary_land_id: null,
    kitta_numbers: "",
    land_ids: [],
    house_no: `H-${Math.floor(Math.random() * 600 + 100)}`,
    plinth_area: 1200,
    area_sqfeet: 2400,
    floor_no: 2,
    construction_type_id: masters.constructionTypes[0]?.id || 1,
    acquisition_date_bs: "2076-02-15",
    acquisition_date_ad: "2019-05-29"
  });

  // 4. Floors State (each house has multiple floors)
  const [floors, setFloors] = useState<any[]>([]);
  const [floorForm, setFloorForm] = useState<any>({
    house_id: null,
    floor_no: 0,
    area_sqfeet: 1200,
    construction_type_id: masters.constructionTypes[0]?.id || 1,
    rate_id: masters.constructionRates[0]?.id || 1,
    unit_id: 1,
    construction_date_bs: "2076-02-15",
    construction_date_ad: "2019-05-29",
    depreciation_percent: 5,
    remarks: "Ground Floor Residential"
  });

  // 5. Calculation State & Overrides
  const [calcFromFiscalYearId, setCalcFromFiscalYearId] = useState<number>(masters.fiscalYears[0]?.id || 1);
  const [calcToFiscalYearId, setCalcToFiscalYearId] = useState<number>(masters.fiscalYears[1]?.id || masters.fiscalYears[0]?.id || 2);
  const [calcFiscalYearId, setCalcFiscalYearId] = useState<number>(masters.fiscalYears[1]?.id || masters.fiscalYears[0]?.id || 2);
  const [calcUseMalpot, setCalcUseMalpot] = useState<boolean>(false);
  const [calcSelectedLandIds, setCalcSelectedLandIds] = useState<number[]>([]);

  // Manual Overrides for Clear Editable Formulas
  const [manualLandRates, setManualLandRates] = useState<Record<number, { rate_per_unit?: number; area_per_unit?: number; unit_id?: number }>>({});
  const [editableFloorCalcs, setEditableFloorCalcs] = useState<Record<number, { area_in_sqft?: number; construction_rate?: number; depreciation_rate?: number; floor_modifier_percent?: number }>>({});
  const [editableHouseFormulas, setEditableHouseFormulas] = useState<Record<number, { plinthMultiplier?: number; customAdjustment?: number }>>({});
  const [isSavingFinal, setIsSavingFinal] = useState<boolean>(false);

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

  // Auto-sync and auto-set land kitta_number in house
  const syncHouseKittaAndLand = (
    mode: "single" | "two_lands",
    primaryId: number | null,
    secondaryId: number | null,
    currentLands: any[] = lands
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
        house_no: prev.house_no && !prev.house_no.startsWith("H-") ? prev.house_no : suggestedHouseNo
      };
    });
  };

  // Sync ward & rates default when taxpayer ward changes
  useEffect(() => {
    if (tpForm.ward_no) {
      const ward = tpForm.ward_no;
      const wLandRates = masters.landRates.filter((r: any) => !r.ward_no_ids || r.ward_no_ids.split(',').map((w: string) => w.trim()).includes(String(ward)));
      const wMalpotRates = masters.malpotRates.filter((r: any) => !r.ward_no_ids || r.ward_no_ids.split(',').map((w: string) => w.trim()).includes(String(ward)));
      setLandForm((prev: any) => ({
        ...prev,
        ward_no: ward,
        land_rate_id: wLandRates[0]?.id || masters.landRates[0]?.id || 1,
        malpot_rate_id: wMalpotRates[0]?.id || masters.malpotRates[0]?.id || 1
      }));
    }
  }, [tpForm.ward_no]);

  // Refresh dossier assets when taxpayerId exists
  const refreshTaxpayerAssets = async (tpId: number) => {
    try {
      const res = await ApiController.getTaxpayerDossier(tpId);
      if (res.success && res.data) {
        const loadedLands = res.data.lands || [];
        const loadedHouses = res.data.houses || [];
        const loadedFloors = res.data.floors || [];
        setLands(loadedLands);
        setHouses(loadedHouses);
        setFloors(loadedFloors);
        if (loadedLands.length > 0) {
          setCalcSelectedLandIds(loadedLands.map((l: any) => l.id));
          const firstLand = loadedLands[0];
          const secondLand = loadedLands.length > 1 ? loadedLands[1] : null;
          if (!housePrimaryLandId) {
            setHousePrimaryLandId(firstLand.id);
            syncHouseKittaAndLand(houseLandMode, firstLand.id, secondLand ? secondLand.id : null, loadedLands);
          }
        }
        if (loadedHouses.length > 0) {
          if (!floorForm.house_id) {
            setFloorForm((prev: any) => ({
              ...prev,
              house_id: loadedHouses[0].id,
              area_sqfeet: loadedHouses[0].plinth_area || 1200
            }));
          }
        }
      }
    } catch (e) {
      console.error("Failed to load taxpayer assets", e);
    }
  };

  // =========================================================================
  // STEP 1: SAVE TAXPAYER & CONTINUE TO LANDS
  // =========================================================================
  const handleSaveTaxpayerAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tpForm.fullanme || !tpForm.mobile_no) {
      setStatusMsg({ type: "error", text: "Please enter Full Name and Mobile Number." });
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      if (taxpayerId) {
        // Update existing in-session taxpayer
        const res = await ApiController.updateTaxpayer(taxpayerId, tpForm);
        if (res.success) {
          setStatusMsg({ type: "success", text: `Taxpayer ${tpForm.fullanme} updated successfully!` });
          await refreshTaxpayerAssets(taxpayerId);
          setCurrentStep(2);
        }
      } else {
        // Create new taxpayer
        const res = await ApiController.createTaxpayer(tpForm);
        if (res.success && res.data) {
          setTaxpayerId(res.data.id);
          setCreatedTaxpayer(res.data);
          setStatusMsg({
            type: "success",
            text: `Taxpayer ${res.data.fullanme} registered (Code: ${res.data.code})! Continuing to Land Entry...`
          });
          // Preset land form taxpayer id
          setLandForm((prev: any) => ({
            ...prev,
            taxpayer_id: res.data.id,
            ward_no: res.data.ward_no || 1
          }));
          await refreshTaxpayerAssets(res.data.id);
          setCurrentStep(2);
        } else {
          setStatusMsg({ type: "error", text: "Failed to register taxpayer. Please check details." });
        }
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.message || "An error occurred while saving taxpayer." });
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // STEP 2: ADD LAND (CAN BE MULTIPLE)
  // =========================================================================
  const handleAddLandParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxpayerId) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await ApiController.createLand({
        ...landForm,
        taxpayer_id: taxpayerId
      });
      if (res.success && res.data) {
        setStatusMsg({
          type: "success",
          text: `Land Parcel Kitta #${landForm.kitta_number} added successfully! Add another or continue.`
        });
        await refreshTaxpayerAssets(taxpayerId);
        // Reset land form for adding next parcel
        setLandForm({
          kitta_number: `KT-${Math.floor(Math.random() * 800 + 100)}`,
          moth_number: `MT-${Math.floor(Math.random() * 90 + 10)}`,
          ward_no: tpForm.ward_no || 1,
          acquisition_fy_id: masters.fiscalYears[0]?.id || 2,
          land_rate_id: masters.landRates[0]?.id || 1,
          malpot_rate_id: masters.malpotRates[0]?.id || 1,
          unit_id: 1,
          area_sqfeet: 1369
        });
        setLandMeasureUnit("ropani");
        setRopaniParts({ ropani: 0, aana: 4, paisa: 0, dam: 0 });
        setBighaParts({ bigha: 0, kattha: 0, dhur: 7.5 });
        setSqftInput(1369);
        setSqmtreInput(127.18);
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.message || "Failed to add land parcel." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLand = async (id: number) => {
    if (!confirm("Remove this land parcel?")) return;
    await ApiController.deleteLand(id);
    if (taxpayerId) await refreshTaxpayerAssets(taxpayerId);
  };

  // =========================================================================
  // STEP 3: ADD HOUSE (CAN BE MULTIPLE, LINKED TO LAND)
  // =========================================================================
  const handleAddHouseStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxpayerId) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const pLandId = housePrimaryLandId || houseForm.land_id || lands[0]?.id || null;
      const sLandId = houseLandMode === "two_lands" ? (houseSecondaryLandId || houseForm.secondary_land_id || null) : null;
      const resolvedLandIds = [pLandId, sLandId].filter(Boolean).map(Number);
      
      const pLand = lands.find((l: any) => l.id === pLandId);
      const sLand = lands.find((l: any) => l.id === sLandId);
      
      let kittaStr = houseKittaNumber || houseForm.kitta_numbers || "";
      if (!kittaStr && pLand) {
        kittaStr = (houseLandMode === "two_lands" && sLand && sLand.id !== pLand.id)
          ? `${pLand.kitta_number}, ${sLand.kitta_number}`
          : pLand.kitta_number;
      }

      const res = await ApiController.createHouse({
        ...houseForm,
        taxpayer_id: taxpayerId,
        land_id: pLandId,
        secondary_land_id: sLandId,
        land_ids: resolvedLandIds,
        kitta_numbers: kittaStr
      });
      if (res.success && res.data) {
        // Automatically provision ground floor for the house
        await ApiController.createFloor({
          house_id: res.data.id,
          floor_no: 0,
          area_sqfeet: houseForm.plinth_area || 1200,
          construction_type_id: houseForm.construction_type_id || 1,
          rate_id: masters.constructionRates[0]?.id || 1,
          unit_id: 1,
          construction_date_bs: houseForm.acquisition_date_bs || "2076-02-15",
          construction_date_ad: houseForm.acquisition_date_ad || "2019-05-29",
          remarks: `Ground Floor (Linked to House #${houseForm.house_no} on Kitta #${kittaStr})`,
          depreciation_percent: 5
        });

        setStatusMsg({
          type: "success",
          text: `House #${houseForm.house_no} (Linked to Kitta #${kittaStr}${sLandId ? " - Spans 2 Lands" : ""}) & ground floor added! Add another house or continue.`
        });
        await refreshTaxpayerAssets(taxpayerId);
        // Reset house form for next house
        setHouseForm({
          land_id: pLandId,
          secondary_land_id: null,
          kitta_numbers: kittaStr,
          land_ids: [pLandId].filter(Boolean),
          house_no: `H-${Math.floor(Math.random() * 600 + 100)}`,
          plinth_area: 1100,
          area_sqfeet: 2200,
          floor_no: 2,
          construction_type_id: masters.constructionTypes[0]?.id || 1,
          acquisition_date_bs: "2076-02-15",
          acquisition_date_ad: "2019-05-29"
        });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.message || "Failed to add house structure." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHouse = async (id: number) => {
    if (!confirm("Delete this house structure and its associated floors?")) return;
    await ApiController.deleteHouse(id);
    if (taxpayerId) await refreshTaxpayerAssets(taxpayerId);
  };

  // =========================================================================
  // STEP 4: ADD FLOOR (CAN BE MULTIPLE, LINKED TO HOUSE)
  // =========================================================================
  const handleAddFloorSlab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxpayerId) return;
    const targetHouseId = floorForm.house_id || houses[0]?.id;
    if (!targetHouseId) {
      setStatusMsg({ type: "error", text: "Please select a house for this floor." });
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await ApiController.createFloor({
        ...floorForm,
        house_id: targetHouseId
      });
      if (res.success && res.data) {
        setStatusMsg({
          type: "success",
          text: `Floor #${floorForm.floor_no} added successfully! Add another floor or continue.`
        });
        await refreshTaxpayerAssets(taxpayerId);
        // Increment floor number for convenience
        const nextFloorNo = (floors.filter((f: any) => f.house_id === targetHouseId).length || 0) + 1;
        setFloorForm((prev: any) => ({
          ...prev,
          floor_no: nextFloorNo,
          remarks: `Floor Level ${nextFloorNo}`
        }));
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err?.message || "Failed to add floor unit." });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFloor = async (id: number) => {
    if (!confirm("Delete this floor?")) return;
    await ApiController.deleteFloor(id);
    if (taxpayerId) await refreshTaxpayerAssets(taxpayerId);
  };

  // =========================================================================
  // STEP 5: CALCULATION DERIVATIONS WITH CLEAR EDITABLE FORMULAS
  // =========================================================================
  const currentFiscalYear = masters.fiscalYears.find((f: any) => f.id === calcFiscalYearId) || masters.fiscalYears[0];
  const fyCode = currentFiscalYear?.code || "2081/82";

  // Computed Lands with Clear Editable Formula Parameters
  const computedLands = lands.map((l: any) => {
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

  // Computed Floors with Clear Editable Formula Parameters
  const computedFloors = floors.map((fl: any) => {
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
    const parentHouse = houses.find((h: any) => h.id === fl.house_id);

    return {
      floor_id: fl.id,
      house_id: fl.house_id,
      house_no: parentHouse?.house_no || `H-${fl.house_id}`,
      house_kitta_numbers: parentHouse?.kitta_numbers || "",
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

  // Computed Houses with Clear Editable Formula Parameters
  const computedHouses = houses.map((h: any) => {
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
      land_id: h.land_id,
      secondary_land_id: h.secondary_land_id,
      kitta_numbers: h.kitta_numbers,
      land_ids: h.land_ids,
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

  // Aggregated Valuation Totals
  const land_amount = computedLands.filter((l: any) => l.isSelected).reduce((acc: number, l: any) => acc + l.total_amount, 0);
  const house_amount = computedHouses.reduce((acc: number, h: any) => acc + h.total_amount, 0);
  const floor_amount = computedFloors.reduce((acc: number, f: any) => acc + f.total_amount, 0);
  const Evaluated_Amount = Math.round(land_amount + house_amount);

  // Multi-Fiscal-Year Setup
  const sortedFiscalYears = [...(masters.fiscalYears || [])].sort((a: any, b: any) => a.id - b.id);
  const minFyId = Math.min(calcFromFiscalYearId, calcToFiscalYearId);
  const maxFyId = Math.max(calcFromFiscalYearId, calcToFiscalYearId);
  const rangeFiscalYears = sortedFiscalYears.filter((fy: any) => fy.id >= minFyId && fy.id <= maxFyId);
  if (rangeFiscalYears.length === 0 && sortedFiscalYears.length > 0) rangeFiscalYears.push(sortedFiscalYears[0]);

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

  const calculatedIptTax = getIPTAmount(masters.propertyRanges || [], Evaluated_Amount, calcFiscalYearId);
  const sanitationFee = 200;
  const grandTotalTaxPayable = calculatedIptTax + sanitationFee;

  const handleSaveFinalCalculation = async () => {
    if (!taxpayerId) return;
    setIsSavingFinal(true);
    setStatusMsg(null);
    try {
      await ApiController.saveCalculationMaster({
        taxpayer_id: taxpayerId,
        fiscal_year_id: calcFiscalYearId,
        total_tax: grandTotalTaxPayable,
        calculate_date_bs: "2081-05-15",
        insert_by: "ONE_DOOR_SYSTEM",
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
          total_amount: fl.total_amount
        }))
      });
      setStatusMsg({
        type: "success",
        text: "One-Door Assessment Completed & Saved Successfully!"
      });
      setTimeout(() => {
        onComplete(taxpayerId);
        onClose();
      }, 1500);
    } catch (e: any) {
      setStatusMsg({ type: "error", text: e?.message || "Failed to save final calculation." });
    } finally {
      setIsSavingFinal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl xl:max-w-6xl w-full shadow-2xl animate-in fade-in zoom-in-95 max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Top Header & Continuous Stepper Widget */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center justify-between pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                  One-Door Process · एकीकृत प्रणाली
                </span>
                {createdTaxpayer && (
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Taxpayer: {createdTaxpayer.fullanme} ({createdTaxpayer.code})
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                Continuous Taxpayer & Asset Registration Widget
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Wizard Bar */}
          <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {[
              { num: 1, label: "Taxpayer Master", icon: User, desc: "Step 1" },
              { num: 2, label: `Land (${lands.length})`, icon: MapPin, desc: "Multiple Lands" },
              { num: 3, label: `House (${houses.length})`, icon: Home, desc: "Linked to Land" },
              { num: 4, label: `Floor (${floors.length})`, icon: Layers, desc: "Linked to House" },
              { num: 5, label: "Valuation & Calc", icon: Calculator, desc: "Clear Formulas" }
            ].map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num || (step.num === 1 && Boolean(taxpayerId));
              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => {
                    if (step.num === 1 || taxpayerId) {
                      setCurrentStep(step.num as any);
                    }
                  }}
                  disabled={step.num > 1 && !taxpayerId}
                  className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30 font-bold"
                      : isPast
                      ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                      : "bg-slate-50 dark:bg-slate-800/40 text-slate-400 opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
                      isActive
                        ? "bg-white text-indigo-600"
                        : isPast
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    {isPast && !isActive ? "✓" : step.num}
                  </div>
                  <div className="hidden sm:block min-w-0 truncate">
                    <div className="text-[11px] font-bold truncate leading-tight">{step.label}</div>
                    <div className={`text-[10px] truncate ${isActive ? "text-indigo-100" : "text-slate-400"}`}>
                      {step.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Feedback Toast */}
        {statusMsg && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center justify-between shadow-xs ${
              statusMsg.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg.text}</span>
            </div>
            <button onClick={() => setStatusMsg(null)} className="font-semibold underline ml-2">
              Dismiss
            </button>
          </div>
        )}

        {/* Scrollable Wizard Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          
          {/* ========================================================= */}
          {/* STEP 1: TAXPAYER MASTER FORM                              */}
          {/* ========================================================= */}
          {currentStep === 1 && (
            <div className="space-y-5 max-w-3xl mx-auto">
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Step 1: Taxpayer Identification (करदाता परिचय)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Save taxpayer details first. The window will remain open and seamlessly proceed to adding multiple land parcels.
                </p>
              </div>

              <form onSubmit={handleSaveTaxpayerAndContinue} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Full Name (करदाताको पूरा नाम) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar Adhikari (रमेश कुमार अधिकारी)"
                      value={tpForm.fullanme}
                      onChange={(e) => setTpForm({ ...tpForm, fullanme: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Mobile Number (मोबाइल नं.) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+977-98XXXXXXXX"
                      value={tpForm.mobile_no}
                      onChange={(e) => setTpForm({ ...tpForm, mobile_no: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Ward Number (वडा नं.) *
                    </label>
                    <select
                      value={tpForm.ward_no}
                      onChange={(e) => setTpForm({ ...tpForm, ward_no: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    >
                      {Array.from({ length: 32 }, (_, i) => i + 1).map((w) => (
                        <option key={w} value={w}>
                          Ward {w} (वडा नं. {w})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      PAN / VAT Number (स्थायी लेखा नं.)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 601234567"
                      value={tpForm.pan_vat_no}
                      onChange={(e) => setTpForm({ ...tpForm, pan_vat_no: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Citizenship No (नागरिकता नं.)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 27-01-72-12345"
                      value={tpForm.citizenship_no}
                      onChange={(e) => setTpForm({ ...tpForm, citizenship_no: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Email Address (इमेल)
                    </label>
                    <input
                      type="email"
                      placeholder="taxpayer@example.com"
                      value={tpForm.email}
                      onChange={(e) => setTpForm({ ...tpForm, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/30 transition-all text-xs"
                  >
                    <span>{taxpayerId ? "Update Taxpayer & Continue" : "Save Taxpayer & Continue to Lands"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 2: ADD LAND (CAN BE MULTIPLE)                        */}
          {/* ========================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>Step 2: Land Parcels (जग्गा कित्ताहरू - Multiple)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    A taxpayer can own multiple land parcels. Add parcels using the measurement tool below.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl font-bold font-mono text-emerald-700 dark:text-emerald-300 text-xs">
                    Registered: {lands.length} Parcels
                  </span>
                </div>
              </div>

              {/* Form to add a land parcel */}
              <form onSubmit={handleAddLandParcel} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Register Land Parcel (नयाँ जग्गा कित्ता फाराम)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Kitta Number (कित्ता नं.) *</label>
                    <input
                      type="text"
                      required
                      value={landForm.kitta_number}
                      onChange={(e) => setLandForm({ ...landForm, kitta_number: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Moth / Shresta No (मोठ नं.)</label>
                    <input
                      type="text"
                      value={landForm.moth_number}
                      onChange={(e) => setLandForm({ ...landForm, moth_number: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Ward Number (वडा नं.) *</label>
                    <input
                      type="number"
                      required
                      value={landForm.ward_no}
                      onChange={(e) => setLandForm({ ...landForm, ward_no: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Acquisition Fiscal Year (प्राप्ति आ.व.)</label>
                    <select
                      value={landForm.acquisition_fy_id}
                      onChange={(e) => setLandForm({ ...landForm, acquisition_fy_id: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    >
                      {masters.fiscalYears.map((fy) => (
                        <option key={fy.id} value={fy.id}>{fy.code} - {fy.fullname}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Land Rate (नगरपालिका दर)</label>
                    <select
                      value={landForm.land_rate_id}
                      onChange={(e) => setLandForm({ ...landForm, land_rate_id: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    >
                      {masters.landRates.map((lr) => (
                        <option key={lr.id} value={lr.id}>{lr.rate_name || lr.code} (Rs. {Number(lr.rate_per_unit).toLocaleString()})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Malpot Rate (मालपोत दर)</label>
                    <select
                      value={landForm.malpot_rate_id}
                      onChange={(e) => setLandForm({ ...landForm, malpot_rate_id: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    >
                      {masters.malpotRates.map((mr) => (
                        <option key={mr.id} value={mr.id}>{mr.rate_name || mr.code} (Rs. {Number(mr.rate_per_unit).toLocaleString()})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Land Measurement Tool */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Land Area Measurement & Auto-Conversion (क्षेत्रफल नाप)
                    </span>
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => {
                          setLandMeasureUnit("ropani");
                          setLandForm((p: any) => ({ ...p, unit_id: 1 }));
                        }}
                        className={`px-2.5 py-1 rounded-lg ${landMeasureUnit === "ropani" ? "bg-emerald-600 text-white font-bold" : "text-slate-600 dark:text-slate-300"}`}
                      >
                        Ropani System
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLandMeasureUnit("bigha");
                          setLandForm((p: any) => ({ ...p, unit_id: 2 }));
                        }}
                        className={`px-2.5 py-1 rounded-lg ${landMeasureUnit === "bigha" ? "bg-emerald-600 text-white font-bold" : "text-slate-600 dark:text-slate-300"}`}
                      >
                        Bigha System
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLandMeasureUnit("sqft");
                          setLandForm((p: any) => ({ ...p, unit_id: 3 }));
                        }}
                        className={`px-2.5 py-1 rounded-lg ${landMeasureUnit === "sqft" ? "bg-emerald-600 text-white font-bold" : "text-slate-600 dark:text-slate-300"}`}
                      >
                        Sq. Feet
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLandMeasureUnit("sqmtre");
                          setLandForm((p: any) => ({ ...p, unit_id: 4 }));
                        }}
                        className={`px-2.5 py-1 rounded-lg ${landMeasureUnit === "sqmtre" ? "bg-emerald-600 text-white font-bold" : "text-slate-600 dark:text-slate-300"}`}
                      >
                        Sq. Metre
                      </button>
                    </div>
                  </div>

                  {landMeasureUnit === "ropani" && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block font-semibold mb-1">Ropani (रोपनी)</label>
                        <input
                          type="number"
                          min="0"
                          value={ropaniParts.ropani}
                          onChange={(e) => {
                            const next = { ...ropaniParts, ropani: Number(e.target.value) };
                            setRopaniParts(next);
                            const sqft = convertRopaniToSqft(next.ropani, next.aana, next.paisa, next.dam);
                            setLandForm((p: any) => ({ ...p, area_sqfeet: sqft }));
                            setSqftInput(sqft);
                            setSqmtreInput(Number((sqft / 10.7639).toFixed(2)));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Aana (आना)</label>
                        <input
                          type="number"
                          min="0"
                          max="15.99"
                          step="any"
                          value={ropaniParts.aana}
                          onChange={(e) => {
                            const next = { ...ropaniParts, aana: Number(e.target.value) };
                            setRopaniParts(next);
                            const sqft = convertRopaniToSqft(next.ropani, next.aana, next.paisa, next.dam);
                            setLandForm((p: any) => ({ ...p, area_sqfeet: sqft }));
                            setSqftInput(sqft);
                            setSqmtreInput(Number((sqft / 10.7639).toFixed(2)));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Paisa (पैसा)</label>
                        <input
                          type="number"
                          min="0"
                          max="3.99"
                          step="any"
                          value={ropaniParts.paisa}
                          onChange={(e) => {
                            const next = { ...ropaniParts, paisa: Number(e.target.value) };
                            setRopaniParts(next);
                            const sqft = convertRopaniToSqft(next.ropani, next.aana, next.paisa, next.dam);
                            setLandForm((p: any) => ({ ...p, area_sqfeet: sqft }));
                            setSqftInput(sqft);
                            setSqmtreInput(Number((sqft / 10.7639).toFixed(2)));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Daam (दाम)</label>
                        <input
                          type="number"
                          min="0"
                          max="3.99"
                          step="any"
                          value={ropaniParts.dam}
                          onChange={(e) => {
                            const next = { ...ropaniParts, dam: Number(e.target.value) };
                            setRopaniParts(next);
                            const sqft = convertRopaniToSqft(next.ropani, next.aana, next.paisa, next.dam);
                            setLandForm((p: any) => ({ ...p, area_sqfeet: sqft }));
                            setSqftInput(sqft);
                            setSqmtreInput(Number((sqft / 10.7639).toFixed(2)));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {landMeasureUnit === "bigha" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block font-semibold mb-1">Bigha (बिघा)</label>
                        <input
                          type="number"
                          min="0"
                          value={bighaParts.bigha}
                          onChange={(e) => {
                            const next = { ...bighaParts, bigha: Number(e.target.value) };
                            setBighaParts(next);
                            const sqft = convertBighaToSqft(next.bigha, next.kattha, next.dhur);
                            setLandForm((p: any) => ({ ...p, area_sqfeet: sqft }));
                            setSqftInput(sqft);
                            setSqmtreInput(Number((sqft / 10.7639).toFixed(2)));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Kattha (कठ्ठा)</label>
                        <input
                          type="number"
                          min="0"
                          max="19.99"
                          step="any"
                          value={bighaParts.kattha}
                          onChange={(e) => {
                            const next = { ...bighaParts, kattha: Number(e.target.value) };
                            setBighaParts(next);
                            const sqft = convertBighaToSqft(next.bigha, next.kattha, next.dhur);
                            setLandForm((p: any) => ({ ...p, area_sqfeet: sqft }));
                            setSqftInput(sqft);
                            setSqmtreInput(Number((sqft / 10.7639).toFixed(2)));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Dhur (धुर)</label>
                        <input
                          type="number"
                          min="0"
                          max="19.99"
                          step="any"
                          value={bighaParts.dhur}
                          onChange={(e) => {
                            const next = { ...bighaParts, dhur: Number(e.target.value) };
                            setBighaParts(next);
                            const sqft = convertBighaToSqft(next.bigha, next.kattha, next.dhur);
                            setLandForm((p: any) => ({ ...p, area_sqfeet: sqft }));
                            setSqftInput(sqft);
                            setSqmtreInput(Number((sqft / 10.7639).toFixed(2)));
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}

                  {landMeasureUnit === "sqft" && (
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="block font-semibold mb-1">Square Feet (वर्ग फिट)</label>
                      <input
                        type="number"
                        step="any"
                        value={sqftInput}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSqftInput(val);
                          setLandForm((p: any) => ({ ...p, area_sqfeet: val }));
                          setSqmtreInput(Number((val / 10.7639).toFixed(2)));
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>
                  )}

                  {landMeasureUnit === "sqmtre" && (
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="block font-semibold mb-1">Square Metre (वर्ग मिटर) (1 sqm = 10.7639 sq.ft)</label>
                      <input
                        type="number"
                        step="any"
                        value={sqmtreInput}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSqmtreInput(val);
                          const sqft = convertSqmtreToSqft(val);
                          setSqftInput(sqft);
                          setLandForm((p: any) => ({ ...p, area_sqfeet: sqft }));
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                      />
                    </div>
                  )}

                  {/* Auto-Conversion Result Banner */}
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                      Auto Conversion Target: <span className="font-mono font-black">{Number(landForm.area_sqfeet || 0).toLocaleString()} Sq. Feet</span>
                    </span>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Save This Land Parcel</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Registered Lands for this Taxpayer Table */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Registered Lands ({lands.length} Parcels)</span>
                  {lands.length === 0 && <span className="text-amber-600 text-xs">At least 1 land parcel is recommended</span>}
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px]">
                      <tr>
                        <th className="p-3">Kitta Number</th>
                        <th className="p-3">Ward No</th>
                        <th className="p-3">Area (Sq.Ft)</th>
                        <th className="p-3">Measuring Unit</th>
                        <th className="p-3">Land Rate</th>
                        <th className="p-3">Malpot Rate</th>
                        <th className="p-3">Assessed Valuation</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {lands.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400 font-sans">
                            No land parcels registered yet. Use the form above to add multiple lands.
                          </td>
                        </tr>
                      ) : (
                        lands.map((l: any) => {
                          const lr = masters.landRates.find((r: any) => r.id === l.land_rate_id);
                          const mr = masters.malpotRates.find((r: any) => r.id === l.malpot_rate_id);
                          return (
                            <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-bold text-slate-900 dark:text-white">
                                {l.kitta_number} <span className="font-normal text-slate-400">({l.moth_number})</span>
                              </td>
                              <td className="p-3 text-indigo-600 dark:text-indigo-400 font-bold">Ward #{l.ward_no}</td>
                              <td className="p-3 font-bold">{Number(l.area_sqfeet || 0).toLocaleString()}</td>
                              <td className="p-3 font-sans">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px]">
                                  {l.unit_id === 1 ? "Ropani" : l.unit_id === 2 ? "Bigha" : l.unit_id === 4 ? "Sq.Metre" : "Sq.Ft"}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600 dark:text-slate-400">Rs. {Number(lr?.rate_per_unit || 800000).toLocaleString()}</td>
                              <td className="p-3 text-slate-600 dark:text-slate-400">Rs. {Number(mr?.rate_per_unit || 600000).toLocaleString()}</td>
                              <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">Rs. {Number(l.assessed_valuation || 0).toLocaleString()}</td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLand(l.id)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 2 Footer Navigation */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  ← Back to Taxpayer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Sync house form land id
                    if (lands.length > 0 && !houseForm.land_id) {
                      setHouseForm((prev: any) => ({ ...prev, land_id: lands[0].id }));
                    }
                    setCurrentStep(3);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all text-xs"
                >
                  <span>Continue to Houses (घर संरचनाहरू) →</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 3: ADD HOUSE (CAN BE MULTIPLE, LINKED TO LAND)       */}
          {/* ========================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Home className="w-4 h-4 text-purple-600" />
                    <span>Step 3: House Structures (घर संरचनाहरू - Linked to Land)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Each land parcel can host multiple house structures. Select the land parcel this house belongs to.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-xl font-bold font-mono text-purple-700 dark:text-purple-300 text-xs">
                    Registered: {houses.length} Houses
                  </span>
                </div>
              </div>

              {/* Form to add a house structure */}
              <form onSubmit={handleAddHouseStructure} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-600" />
                  <span>Register House Structure (घर संरचना फाराम)</span>
                </div>

                {/* House Land Association Controls (Single Land or Spanning Two Lands) */}
                <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/50 space-y-3">
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

                    {/* Mode Selector: Single Land vs Spanning Two Lands */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-purple-200 dark:border-purple-800 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setHouseLandMode("single");
                          syncHouseKittaAndLand("single", housePrimaryLandId || lands[0]?.id || null, null);
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
                          const sId = houseSecondaryLandId || (lands.length > 1 ? lands[1].id : null);
                          syncHouseKittaAndLand("two_lands", housePrimaryLandId || lands[0]?.id || null, sId);
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
                        value={housePrimaryLandId || (lands[0]?.id ?? "")}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setHousePrimaryLandId(val);
                          syncHouseKittaAndLand(houseLandMode, val, houseSecondaryLandId);
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-indigo-600 dark:text-indigo-400"
                      >
                        {lands.length === 0 ? (
                          <option value="">No lands registered (Please add land in Step 2)</option>
                        ) : (
                          lands.map((l: any) => (
                            <option key={l.id} value={l.id}>
                              Kitta #{l.kitta_number} (Ward {l.ward_no}, Moth {l.moth_number}, {l.area_sqfeet} sqft)
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
                          value={houseSecondaryLandId || (lands[1]?.id ?? lands[0]?.id ?? "")}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setHouseSecondaryLandId(val);
                            syncHouseKittaAndLand(houseLandMode, housePrimaryLandId, val);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-purple-600 dark:text-purple-400"
                        >
                          {lands.length < 2 ? (
                            <option value="">Only 1 land registered (Add 2nd land in Step 2 to span)</option>
                          ) : (
                            lands.map((l: any) => (
                              <option key={l.id} value={l.id} disabled={l.id === housePrimaryLandId}>
                                Kitta #{l.kitta_number} (Ward {l.ward_no}, Moth {l.moth_number}, {l.area_sqfeet} sqft){l.id === housePrimaryLandId ? " (Primary)" : ""}
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
                        const p = lands.find((l: any) => l.id === housePrimaryLandId);
                        const s = houseLandMode === "two_lands" ? lands.find((l: any) => l.id === houseSecondaryLandId) : null;
                        const tot = (Number(p?.area_sqfeet || 0)) + (Number(s?.area_sqfeet || 0));
                        return `${tot.toLocaleString()} Sq.Ft`;
                      })()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      House Number (घर नं.) *
                    </label>
                    <input
                      type="text"
                      required
                      value={houseForm.house_no}
                      onChange={(e) => setHouseForm({ ...houseForm, house_no: e.target.value })}
                      placeholder="e.g. H-102"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Construction Structure Type *
                    </label>
                    <select
                      value={houseForm.construction_type_id}
                      onChange={(e) => setHouseForm({ ...houseForm, construction_type_id: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    >
                      {masters.constructionTypes.map((c) => (
                        <option key={c.id} value={c.id}>{c.fullanme}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Plinth Area (Sq.Ft) *</label>
                    <input
                      type="number"
                      required
                      value={houseForm.plinth_area}
                      onChange={(e) => setHouseForm({ ...houseForm, plinth_area: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Total Built Area (Sq.Ft)</label>
                    <input
                      type="number"
                      value={houseForm.area_sqfeet}
                      onChange={(e) => setHouseForm({ ...houseForm, area_sqfeet: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Floor Count (कुल तला)</label>
                    <input
                      type="number"
                      value={houseForm.floor_no}
                      onChange={(e) => setHouseForm({ ...houseForm, floor_no: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Acquisition Year (BS)</label>
                    <input
                      type="text"
                      value={houseForm.acquisition_date_bs}
                      onChange={(e) => setHouseForm({ ...houseForm, acquisition_date_bs: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Save House Structure (Linked to Land)</span>
                  </button>
                </div>
              </form>

              {/* Registered Houses Table */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">
                  Registered Houses ({houses.length} Structures)
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px]">
                      <tr>
                        <th className="p-3">House No</th>
                        <th className="p-3">Located on Land(s) & Auto Kitta #</th>
                        <th className="p-3">Plinth Area</th>
                        <th className="p-3">Total Area</th>
                        <th className="p-3">Structure Type</th>
                        <th className="p-3">Built Year BS</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {houses.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400 font-sans">
                            No houses registered yet. Register above if this taxpayer owns house structures.
                          </td>
                        </tr>
                      ) : (
                        houses.map((h: any) => {
                          const linkedLand = lands.find((l: any) => l.id === h.land_id);
                          const secLand = lands.find((l: any) => l.id === h.secondary_land_id);
                          const cType = masters.constructionTypes.find((c: any) => c.id === h.construction_type_id);
                          const isSpanning = Boolean(h.secondary_land_id || (h.kitta_numbers && h.kitta_numbers.includes(",")));
                          return (
                            <tr key={h.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-bold text-slate-900 dark:text-white">{h.house_no}</td>
                              <td className="p-3 font-sans">
                                {isSpanning ? (
                                  <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-mono text-[11px] font-bold inline-flex items-center gap-1 border border-purple-200 dark:border-purple-800">
                                    <span>Spans 2 Lands: Kitta #{h.kitta_numbers || `${linkedLand?.kitta_number}, ${secLand?.kitta_number}`}</span>
                                  </span>
                                ) : linkedLand ? (
                                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-bold inline-flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                                    <span>Kitta #{h.kitta_numbers || linkedLand.kitta_number} (Ward {linkedLand.ward_no})</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Independent</span>
                                )}
                              </td>
                              <td className="p-3 font-bold">{h.plinth_area} sqft</td>
                              <td className="p-3">{h.area_sqfeet} sqft</td>
                              <td className="p-3 font-sans">{cType?.fullanme || "RCC Frame"}</td>
                              <td className="p-3">{h.acquisition_date_bs || "2076-02-15"}</td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteHouse(h.id)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 3 Footer Navigation */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  ← Back to Lands
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (houses.length > 0 && !floorForm.house_id) {
                      setFloorForm((prev: any) => ({ ...prev, house_id: houses[0].id }));
                    }
                    setCurrentStep(4);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all text-xs"
                >
                  <span>Continue to Floor Slabs (तला इकाइहरू) →</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 4: ADD FLOOR (CAN BE MULTIPLE, LINKED TO HOUSE)       */}
          {/* ========================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Step 4: Floor Slabs (तला इकाइहरू - Linked to House)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Each house has multiple floor slabs. Select the house and add ground, first, or upper floor units.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl font-bold font-mono text-indigo-700 dark:text-indigo-300 text-xs">
                    Registered: {floors.length} Floors
                  </span>
                </div>
              </div>

              {/* Form to add a floor slab */}
              <form onSubmit={handleAddFloorSlab} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>Register Floor Unit (तला फाराम)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Belongs to House Structure (कुन घरको तला हो - Linked to House) *
                    </label>
                    <select
                      value={floorForm.house_id || (houses[0]?.id ?? "")}
                      onChange={(e) => {
                        const targetHId = Number(e.target.value);
                        const hObj = houses.find((h: any) => h.id === targetHId);
                        const nextFlNo = (floors.filter((f: any) => f.house_id === targetHId).length);
                        setFloorForm({
                          ...floorForm,
                          house_id: targetHId,
                          area_sqfeet: hObj?.plinth_area || floorForm.area_sqfeet,
                          floor_no: nextFlNo,
                          remarks: nextFlNo === 0 ? "Ground Floor Residential" : `Floor Level ${nextFlNo}`
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-purple-600 dark:text-purple-400"
                    >
                      {houses.length === 0 ? (
                        <option value="">No houses registered (Add house in Step 3)</option>
                      ) : (
                        houses.map((h: any) => {
                          const hLand = lands.find((l: any) => l.id === h.land_id);
                          const kittaLabel = h.kitta_numbers || hLand?.kitta_number || "Independent";
                          return (
                            <option key={h.id} value={h.id}>
                              House #{h.house_no} (Built on Kitta #{kittaLabel} · Plinth: {h.plinth_area} sqft)
                            </option>
                          );
                        })
                      )}
                    </select>

                    {/* Active Selected House Information Card */}
                    {(() => {
                      const selH = houses.find((h: any) => h.id === (floorForm.house_id || houses[0]?.id));
                      const selHLand = lands.find((l: any) => l.id === selH?.land_id);
                      const fCount = floors.filter((f: any) => f.house_id === selH?.id).length;
                      if (!selH) return null;
                      return (
                        <div className="mt-2.5 p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-purple-600 shrink-0" />
                            <div>
                              <span className="font-bold text-purple-950 dark:text-purple-200">
                                Target: House #{selH.house_no}
                              </span>
                              <span className="ml-2 font-mono text-[11px] text-purple-700 dark:text-purple-300">
                                Built on Kitta #{selH.kitta_numbers || selHLand?.kitta_number || "N/A"}
                                {selH.secondary_land_id ? " (Spanning 2 Lands)" : ""}
                              </span>
                            </div>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            Plinth: {selH.plinth_area} sqft · Existing Floors: {fCount} Slabs (Suggested: Floor #{fCount})
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Floor Level (तला क्रम नं. - 0 = Ground Floor) *
                    </label>
                    <input
                      type="number"
                      required
                      value={floorForm.floor_no}
                      onChange={(e) => setFloorForm({ ...floorForm, floor_no: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Floor Slab Area (Sq.Ft) *</label>
                    <input
                      type="number"
                      required
                      value={floorForm.area_sqfeet}
                      onChange={(e) => setFloorForm({ ...floorForm, area_sqfeet: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Construction Rate (दर)</label>
                    <select
                      value={floorForm.rate_id}
                      onChange={(e) => setFloorForm({ ...floorForm, rate_id: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                    >
                      {masters.constructionRates.map((cr) => (
                        <option key={cr.id} value={cr.id}>
                          {cr.code || `Rate #${cr.id}`} (Rs. {Number(cr.rate_per_unit).toLocaleString()}/sqft)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Construction Year (BS)</label>
                    <input
                      type="text"
                      value={floorForm.construction_date_bs}
                      onChange={(e) => setFloorForm({ ...floorForm, construction_date_bs: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Depreciation % (ह्रास कट्टी)</label>
                    <input
                      type="number"
                      step="any"
                      value={floorForm.depreciation_percent}
                      onChange={(e) => setFloorForm({ ...floorForm, depreciation_percent: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Remarks / Note</label>
                    <input
                      type="text"
                      value={floorForm.remarks}
                      onChange={(e) => setFloorForm({ ...floorForm, remarks: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={loading || houses.length === 0}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Save Floor Unit (Linked to House)</span>
                  </button>
                </div>
              </form>

              {/* Registered Floors Table */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">
                  Registered Floors ({floors.length} Slabs)
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px]">
                      <tr>
                        <th className="p-3">Floor #</th>
                        <th className="p-3">Linked House & Land Kitta</th>
                        <th className="p-3">Area (Sq.Ft)</th>
                        <th className="p-3">Rate (Rs./Sq.Ft)</th>
                        <th className="p-3">Depreciation %</th>
                        <th className="p-3">Remarks</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {floors.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400 font-sans">
                            No floors registered yet. Register floor units above.
                          </td>
                        </tr>
                      ) : (
                        floors.map((fl: any) => {
                          const linkedHouse = houses.find((h: any) => h.id === fl.house_id);
                          const cr = masters.constructionRates.find((r: any) => r.id === fl.rate_id);
                          return (
                            <tr key={fl.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                              <td className="p-3 font-bold text-slate-900 dark:text-white">Floor #{fl.floor_no}</td>
                              <td className="p-3 font-sans">
                                {linkedHouse ? (
                                  <span className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-mono text-[11px] font-bold border border-purple-200 dark:border-purple-800 inline-flex items-center gap-1">
                                    <span>House #{linkedHouse.house_no} (Kitta #{linkedHouse.kitta_numbers || "N/A"})</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400">House #{fl.house_id}</span>
                                )}
                              </td>
                              <td className="p-3 font-bold">{fl.area_sqfeet} sqft</td>
                              <td className="p-3 text-slate-700 dark:text-slate-300">Rs. {cr?.rate_per_unit || 2800}</td>
                              <td className="p-3 text-amber-600 font-bold">-{fl.depreciation_percent}%</td>
                              <td className="p-3 font-sans text-slate-500">{fl.remarks || "-"}</td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFloor(fl.id)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step 4 Footer Navigation */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  ← Back to Houses
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(5)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all text-xs"
                >
                  <span>Continue to Valuation & Calculation (कर गणना) →</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 5: VALUATION & CALCULATION ENGINE WITH CLEAR FORMULAS*/}
          {/* ========================================================= */}
          {currentStep === 5 && (
            <div className="space-y-6">
              
              {/* Range & Multi-Fiscal Year Breakdown Banner */}
              <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      One-Door Assessment Engine · Step 5
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Tax Calculation Engine & Multi-Year Range Valuation
                    </h3>
                    <p className="text-xs text-slate-500">
                      Clear editable formulas for land_amount, floor_amount, and house_amount with live municipal assessment.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* From Fiscal Year */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">From FY:</span>
                      <select
                        value={calcFromFiscalYearId}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCalcFromFiscalYearId(val);
                          if (val > calcToFiscalYearId) setCalcToFiscalYearId(val);
                        }}
                        className="text-xs font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                      >
                        {masters.fiscalYears.map((fy) => (
                          <option key={fy.id} value={fy.id}>{fy.code}</option>
                        ))}
                      </select>
                    </div>

                    {/* To Fiscal Year */}
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">To FY:</span>
                      <select
                        value={calcToFiscalYearId}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCalcToFiscalYearId(val);
                          if (val < calcFromFiscalYearId) setCalcFromFiscalYearId(val);
                        }}
                        className="text-xs font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
                      >
                        {masters.fiscalYears.map((fy) => (
                          <option key={fy.id} value={fy.id}>{fy.code}</option>
                        ))}
                      </select>
                    </div>

                    {/* Rate Mode Toggle */}
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

                {/* Multi-Year Breakdown Table */}
                <div className="pt-3 border-t border-indigo-100 dark:border-indigo-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Every Fiscal Year Assessment Breakdown ({rangeFiscalYears.length} Years in Range)
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Cumulative Total: Rs. {cumulativeGrandTotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px] uppercase">
                        <tr>
                          <th className="p-2.5">Fiscal Year</th>
                          <th className="p-2.5">land_amount</th>
                          <th className="p-2.5">house_amount</th>
                          <th className="p-2.5">Evaluated Property</th>
                          <th className="p-2.5">IPT Slab Tax</th>
                          <th className="p-2.5 font-bold">Total Payable</th>
                          <th className="p-2.5 text-center">Active Target</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                        {multiYearBreakdown.map((row: any) => {
                          const isTarget = row.fiscal_year_id === calcFiscalYearId;
                          return (
                            <tr key={row.fiscal_year_id} className={isTarget ? "bg-indigo-50/50 dark:bg-indigo-950/30 font-bold" : ""}>
                              <td className="p-2.5 text-indigo-600 dark:text-indigo-400">{row.fiscal_year_code}</td>
                              <td className="p-2.5">Rs. {row.land_valuation.toLocaleString()}</td>
                              <td className="p-2.5">Rs. {row.house_valuation.toLocaleString()}</td>
                              <td className="p-2.5 font-bold text-slate-900 dark:text-white">Rs. {row.evaluated_amount.toLocaleString()}</td>
                              <td className="p-2.5 text-emerald-600 font-bold">Rs. {row.ipt_tax.toLocaleString()}</td>
                              <td className="p-2.5 text-emerald-600 font-black">Rs. {row.grand_total.toLocaleString()}</td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => setCalcFiscalYearId(row.fiscal_year_id)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isTarget ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                                  }`}
                                >
                                  {isTarget ? "Active" : "Inspect"}
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

              {/* 1. LAND AMOUNT CLEAR CALC FORMULA WITH EDITABLE PARAMETERS */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                      Formula 1: land_amount Clear Calc Formula (Editable)
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Land Parcels Evaluation & Unit Bracket Mechanics
                    </h4>
                  </div>
                  <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    land_amount: Rs. {land_amount.toLocaleString()}
                  </span>
                </div>

                {/* Clear Formula Explanation Card */}
                <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>How land_amount is Calculated (जग्गा मूल्याङ्कन सूत्र):</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                    Each parcel's area in square feet is normalized by the unit conversion factor (Ropani = 342.25 sqft/aana, Bigha = 3645 sqft/katha, Sqft = 1:1), then divided by area_per_unit and multiplied by rate_per_unit.
                  </p>
                  <div className="font-mono text-[11px] p-2 bg-white/70 dark:bg-slate-900/60 rounded-lg border border-emerald-200 text-emerald-800 dark:text-emerald-300 font-semibold">
                    Formula: land_amount = ∑ [ (Normalized Land Area ÷ area_per_unit) × rate_per_unit ]
                  </div>
                </div>

                {/* Editable Land Calculation Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px] uppercase">
                      <tr>
                        <th className="p-3 w-10 text-center">Inc</th>
                        <th className="p-3">Kitta Number</th>
                        <th className="p-3">Area (Sq.Ft)</th>
                        <th className="p-3">Unit (unit_id)</th>
                        <th className="p-3">Rate Per Unit (Editable)</th>
                        <th className="p-3">Area Per Unit (Editable)</th>
                        <th className="p-3">Calculation Formula</th>
                        <th className="p-3 text-right">Evaluated Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {computedLands.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-400 font-sans">
                            No lands available for calculation.
                          </td>
                        </tr>
                      ) : (
                        computedLands.map((cl: any) => (
                          <tr key={cl.land_id} className={cl.isSelected ? "bg-emerald-50/20" : "opacity-50"}>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={cl.isSelected}
                                onChange={() => {
                                  if (cl.isSelected) {
                                    setCalcSelectedLandIds(calcSelectedLandIds.filter((id) => id !== cl.land_id));
                                  } else {
                                    setCalcSelectedLandIds([...calcSelectedLandIds, cl.land_id]);
                                  }
                                }}
                                className="rounded text-indigo-600"
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
                                className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
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
                            <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              Rs. {cl.total_amount.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. FLOOR AMOUNT CLEAR CALC FORMULA WITH EDITABLE PARAMETERS */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                      Formula 2: floor_amount Clear Calc Formula (Editable)
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Per-Floor Slab Engineering Valuation & Age Depreciation
                    </h4>
                  </div>
                  <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    floor_amount: Rs. {floor_amount.toLocaleString()}
                  </span>
                </div>

                {/* Clear Formula Explanation Card */}
                <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 text-xs space-y-1.5">
                  <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>How floor_amount is Calculated (तला मूल्याङ्कन सूत्र):</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                    Every floor slab calculates raw construction amount (Area × Rate), subtracts structural age-based depreciation percentage, and applies the floor modifier percent.
                  </p>
                  <div className="font-mono text-[11px] p-2 bg-white/70 dark:bg-slate-900/60 rounded-lg border border-indigo-200 text-indigo-800 dark:text-indigo-300 font-semibold">
                    Formula: floor_amount = ∑ [ ((Area × Construction Rate) - Depreciation %) × (100 + Floor Modifier %) ]
                  </div>
                </div>

                {/* Editable Floor Calculation Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px] uppercase">
                      <tr>
                        <th className="p-3">Floor # & Ref</th>
                        <th className="p-3">Area (Editable)</th>
                        <th className="p-3">Const. Rate (Editable)</th>
                        <th className="p-3">Depreciation % (Editable)</th>
                        <th className="p-3">Level Modifier %</th>
                        <th className="p-3">Calculation Formula</th>
                        <th className="p-3 text-right">Net Assessed Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {computedFloors.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400 font-sans">
                            No floor units registered.
                          </td>
                        </tr>
                      ) : (
                        computedFloors.map((fl: any) => (
                          <tr key={fl.floor_id} className="hover:bg-slate-50/50">
                            <td className="p-3">
                              <div className="font-bold text-slate-900 dark:text-white">Floor #{fl.floor_no}</div>
                              <div className="text-[10px] text-purple-700 dark:text-purple-300 font-mono">
                                House #{fl.house_no} {fl.house_kitta_numbers ? `· Kitta #${fl.house_kitta_numbers}` : ""}
                              </div>
                            </td>
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
                                  className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                                />
                                <span>%</span>
                              </div>
                            </td>
                            <td className="p-3 text-[11px] text-slate-500 font-mono">
                              [({fl.area_in_sqft} × {fl.construction_rate}) - {fl.depreciation_rate}%] × (100+{fl.floor_modifier_percent})%
                            </td>
                            <td className="p-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                              Rs. {fl.total_amount.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. HOUSE AMOUNT CLEAR CALC FORMULA WITH EDITABLE PARAMETERS */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                      Formula 3: house_amount Clear Calc Formula (Editable)
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      House Structure Aggregation & Plinth Multiplier Controls
                    </h4>
                  </div>
                  <span className="text-sm font-mono font-bold text-purple-600 dark:text-purple-400">
                    house_amount: Rs. {house_amount.toLocaleString()}
                  </span>
                </div>

                {/* Clear Formula Explanation Card */}
                <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 text-xs space-y-1.5">
                  <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-purple-600" />
                    <span>How house_amount is Calculated (घर मूल्याङ्कन सूत्र):</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                    House valuation aggregates the net evaluated amounts of all linked floor slabs, multiplied by an editable plinth multiplier factor and plus/minus any custom municipal adjustment.
                  </p>
                  <div className="font-mono text-[11px] p-2 bg-white/70 dark:bg-slate-900/60 rounded-lg border border-purple-200 text-purple-800 dark:text-purple-300 font-semibold">
                    Formula: house_amount = ∑ [ (∑ Linked Floors Net Amounts) × Plinth Multiplier + Custom Municipal Adjustment ]
                  </div>
                </div>

                {/* Editable House Cards */}
                <div className="space-y-3">
                  {computedHouses.length === 0 ? (
                    <div className="text-center py-6 text-slate-400">No houses registered.</div>
                  ) : (
                    computedHouses.map((h: any) => {
                      const linkedLand = lands.find((l: any) => l.id === h.land_id);
                      return (
                        <div
                          key={h.house_id}
                          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>House #{h.house_no}</span>
                                {h.secondary_land_id || (h.kitta_numbers && h.kitta_numbers.includes(",")) ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800">
                                    Spans 2 Lands: Kitta #{h.kitta_numbers}
                                  </span>
                                ) : (linkedLand || h.kitta_numbers) ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                                    On Kitta #{h.kitta_numbers || linkedLand?.kitta_number}
                                  </span>
                                ) : null}
                                <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  Plinth: {h.plinth_area} sqft
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                Floors Subtotal: Rs. {h.floor_subtotal.toLocaleString()} · Depreciation: -Rs. {h.depreciation_amount.toLocaleString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold font-mono text-purple-600 dark:text-purple-400">
                                Rs. {h.total_amount.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          {/* Editable Formula Controls */}
                          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1 text-[11px]">
                                Plinth Multiplier Factor (Formula Parameter)
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
                              <span className="text-[10px] text-slate-400 uppercase font-bold mb-1">Live Formula</span>
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

              {/* Combined Grand Assessment Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-800/60">
                  <div>
                    <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                      One-Door Grand Assessment · Active FY: {currentFiscalYear?.code}
                    </div>
                    <h4 className="text-lg font-bold text-white">
                      Evaluated Property Total & IPT Tax Liability
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveFinalCalculation}
                    disabled={isSavingFinal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black rounded-xl shadow-lg transition-colors text-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingFinal ? "Saving Assessment..." : "Save Calculation & Complete Registration"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-indigo-200 uppercase font-sans">land_amount</div>
                    <div className="text-base font-bold text-white">Rs. {land_amount.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-indigo-200 uppercase font-sans">floor_amount (Subtotal)</div>
                    <div className="text-base font-bold text-white">Rs. {floor_amount.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-indigo-200 uppercase font-sans">house_amount (Evaluated)</div>
                    <div className="text-base font-bold text-white">Rs. {house_amount.toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30">
                    <div className="text-[10px] text-emerald-300 uppercase font-sans">Grand Total Tax Payable</div>
                    <div className="text-xl font-black text-emerald-400">Rs. {grandTotalTaxPayable.toLocaleString()}</div>
                    <div className="text-[10px] text-emerald-200 font-sans">Includes Sanitation Rs. {sanitationFee}</div>
                  </div>
                </div>
              </div>

              {/* Step 5 Footer Navigation */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  ← Back to Floor Slabs
                </button>
                <button
                  type="button"
                  onClick={handleSaveFinalCalculation}
                  disabled={isSavingFinal}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finalize & Complete One-Door Registration</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
