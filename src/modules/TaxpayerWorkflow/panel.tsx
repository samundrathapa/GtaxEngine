import React, { useEffect, useState } from "react";
import { ApiController } from "../../api/controller.ts";
import { translations, SupportedLang, tCol } from "../../utils/i18n.ts";
import { MultiYearTaxEngine } from "../TaxCalculation/MultiYearTaxEngine.tsx";
import {
  Calendar,
  Layers,
  Percent,
  UserCheck,
  MapPin,
  Home,
  Receipt,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Printer,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Calculator,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
  Save,
  FileText,
  Search,
  X,
  FileCheck2,
  User,
  Sliders,
  Sparkles
} from "lucide-react";
import {
  calculateLandEvaluation,
  getFloorEvaluationAmount,
  getDepreciationAmount,
  getIPTAmount,
  Measurement
} from "../../utils/calculationEngine.ts";
import { TaxpayerDossierModal } from "./DossierModal.tsx";
import { OneDoorRegistrationModal } from "./OneDoorRegistrationModal.tsx";

export type TaxpayerSubView = "overview" | "lands" | "houses" | "floors" | "assessment" | "multi_year_calc";

interface TaxpayerWorkflowPanelProps {
  currentLang: SupportedLang;
  initialSubView?: TaxpayerSubView;
  onSubViewChange?: (view: TaxpayerSubView) => void;
  selectedTaxpayerIdProp?: number;
  openNewTaxpayerTrigger?: number;
}

export const TaxpayerWorkflowPanel: React.FC<TaxpayerWorkflowPanelProps> = ({
  currentLang,
  initialSubView = "overview",
  onSubViewChange,
  selectedTaxpayerIdProp,
  openNewTaxpayerTrigger
}) => {
  const t = translations[currentLang];
  const [subView, setSubView] = useState<TaxpayerSubView>(initialSubView);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    if (initialSubView) {
      setSubView(initialSubView);
    }
  }, [initialSubView]);

  const handleSubViewSwitch = (view: TaxpayerSubView) => {
    setSubView(view);
    if (onSubViewChange) {
      onSubViewChange(view);
    }
  };

  // Masters
  const [masters, setMasters] = useState<any>({
    fiscalYears: [],
    units: [],
    landNatures: [],
    constructionTypes: [],
    landRates: [],
    malpotRates: [],
    constructionRates: [],
    depreciations: [],
    fineRebates: []
  });

  const [taxpayers, setTaxpayers] = useState<any[]>([]);
  const [selectedTaxpayerId, setSelectedTaxpayerId] = useState<number>(selectedTaxpayerIdProp || 1);
  const [taxpayerDossier, setTaxpayerDossier] = useState<any>(null);

  // Dossier View & Tab States (taxpayer, land, house, calculate)
  const [dossierOpen, setDossierOpen] = useState<boolean>(false);
  const [dossierTab, setDossierTab] = useState<"taxpayer" | "land" | "house" | "calculate">("taxpayer");
  const [commonDetailTab, setCommonDetailTab] = useState<"assessment" | "lands" | "houses">("assessment");
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>("all");

  // Calculate Section States
  const [calcFiscalYearId, setCalcFiscalYearId] = useState<number>(2);
  const [calcUseMalpot, setCalcUseMalpot] = useState<boolean>(false);
  const [calcSelectedLandIds, setCalcSelectedLandIds] = useState<number[]>([]);
  const [isSavingCalc, setIsSavingCalc] = useState<boolean>(false);

  useEffect(() => {
    if (taxpayerDossier?.lands) {
      setCalcSelectedLandIds(taxpayerDossier.lands.map((l: any) => l.id));
    }
  }, [taxpayerDossier]);

  useEffect(() => {
    if (selectedTaxpayerIdProp && selectedTaxpayerIdProp !== selectedTaxpayerId) {
      setSelectedTaxpayerId(selectedTaxpayerIdProp);
    }
  }, [selectedTaxpayerIdProp]);

  useEffect(() => {
    if (openNewTaxpayerTrigger && openNewTaxpayerTrigger > 0) {
      handleOpenAddTaxpayer();
    }
  }, [openNewTaxpayerTrigger]);

  // Modals state
  const [editLandModalOpen, setEditLandModalOpen] = useState(false);
  const [editingLand, setEditingLand] = useState<any | null>(null);

  const [editHouseModalOpen, setEditHouseModalOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<any | null>(null);

  const [editFloorModalOpen, setEditFloorModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<any | null>(null);

  const [editTaxpayerModalOpen, setEditTaxpayerModalOpen] = useState(false);
  const [editingTaxpayer, setEditingTaxpayer] = useState<any | null>(null);

  // Add Land Form & Unit Conversion States
  const [newLandModalOpen, setNewLandModalOpen] = useState(false);
  const [newLandKitta, setNewLandKitta] = useState("");
  const [newLandMoth, setNewLandMoth] = useState("");
  const [newLandArea, setNewLandArea] = useState(1369); // in sqfeet
  const [newLandUnitId, setNewLandUnitId] = useState(1); // 1=ropani, 2=bigha, 3=sqfeet, 4=sqmetre
  const [newLandNatureId, setNewLandNatureId] = useState(1);
  const [newLandRateId, setNewLandRateId] = useState(1);
  const [newLandMalpotRateId, setNewLandMalpotRateId] = useState(1);
  const [newLandWard, setNewLandWard] = useState(1);
  const [newLandAcquisitionFyId, setNewLandAcquisitionFyId] = useState(2);

  // Unit breakdown inputs for conversion
  const [ropaniInput, setRopaniInput] = useState<number>(0);
  const [aanaInput, setAanaInput] = useState<number>(4);
  const [paisaInput, setPaisaInput] = useState<number>(0);
  const [dhanInput, setDhanInput] = useState<number>(0);

  const [bighaInput, setBighaInput] = useState<number>(0);
  const [kathaInput, setKathaInput] = useState<number>(0);
  const [dhurInput, setDhurInput] = useState<number>(0);

  const [sqmetreInput, setSqmetreInput] = useState<number>(0);
  const [sqfeetDirectInput, setSqfeetDirectInput] = useState<number>(1369);

  // Add House Form
  const [newHouseModalOpen, setNewHouseModalOpen] = useState(false);
  const [newHouseNo, setNewHouseNo] = useState("");
  const [newHouseArea, setNewHouseArea] = useState(2400);
  const [newHousePlinth, setNewHousePlinth] = useState(1200);
  const [newHouseFloors, setNewHouseFloors] = useState(2);
  const [newHouseConstType, setNewHouseConstType] = useState(1);
  const [newHouseLandId, setNewHouseLandId] = useState<number | null>(null);

  // Add Floor Form
  const [newFloorModalOpen, setNewFloorModalOpen] = useState(false);
  const [newFloorHouseId, setNewFloorHouseId] = useState<number>(1);
  const [newFloorNo, setNewFloorNo] = useState(1);
  const [newFloorArea, setNewFloorArea] = useState(1100);
  const [newFloorConstType, setNewFloorConstType] = useState(1);
  const [newFloorRateId, setNewFloorRateId] = useState(1);
  const [newFloorUnitId, setNewFloorUnitId] = useState(1);
  const [newFloorConstDateAd, setNewFloorConstDateAd] = useState("2023-05-15");
  const [newFloorConstDateBs, setNewFloorConstDateBs] = useState("2080-02-01");
  const [newFloorRemarks, setNewFloorRemarks] = useState("Upper Floor");
  const [newFloorDepreciation, setNewFloorDepreciation] = useState(5);

  // New Taxpayer Form
  const [newTpModalOpen, setNewTpModalOpen] = useState(false);
  const [newTpName, setNewTpName] = useState("");
  const [newTpMobile, setNewTpMobile] = useState("");
  const [newTpEmail, setNewTpEmail] = useState("");
  const [newTpWard, setNewTpWard] = useState(1);
  const [newTpPan, setNewTpPan] = useState("");
  const [newTpCitizenship, setNewTpCitizenship] = useState("");
  const [oneDoorModalOpen, setOneDoorModalOpen] = useState(false);

  useEffect(() => {
    if (openNewTaxpayerTrigger) {
      setOneDoorModalOpen(true);
    }
  }, [openNewTaxpayerTrigger]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const mastersRes = await ApiController.getPropertyMasters();
      if (mastersRes.success && mastersRes.data) {
        setMasters(mastersRes.data);
      }

      const tpRes = await ApiController.getTaxpayers();
      if (tpRes.success && tpRes.data) {
        setTaxpayers(tpRes.data);
        if (tpRes.data.length > 0 && !selectedTaxpayerId) {
          setSelectedTaxpayerId(tpRes.data[0].id);
        }
      }

      const targetId = selectedTaxpayerId || (tpRes.data && tpRes.data.length > 0 ? tpRes.data[0].id : null);
      if (targetId) {
        await loadTaxpayerDossier(Number(targetId), tpRes.data || undefined);
      }
    } catch (e) {
      console.warn("Failed to load property data", e);
    } finally {
      setLoading(false);
    }
  };

  const loadTaxpayerDossier = async (tpId: number | string, currentList?: any[]) => {
    try {
      const dosRes = await ApiController.getTaxpayerDossier(Number(tpId));
      if (dosRes.success && dosRes.data) {
        const listToUse = currentList || taxpayers;
        const matchingTp = listToUse.find(t => Number(t.id) === Number(tpId));
        if (matchingTp && dosRes.data.taxpayer) {
          dosRes.data.taxpayer = {
            ...dosRes.data.taxpayer,
            fullanme: matchingTp.fullanme,
            code: matchingTp.code,
            mobile_no: matchingTp.mobile_no,
            ward_no: matchingTp.ward_no,
            citizenship_no: matchingTp.citizenship_no || dosRes.data.taxpayer.citizenship_no,
            pan_vat_no: matchingTp.pan_vat_no || dosRes.data.taxpayer.pan_vat_no,
            email: matchingTp.email || dosRes.data.taxpayer.email
          };
        }
        setTaxpayerDossier(dosRes.data);
      }
    } catch (e) {
      console.warn("Failed to load property dossier", e);
    }
  };

  useEffect(() => {
    if (selectedTaxpayerId) {
      loadTaxpayerDossier(selectedTaxpayerId);
    } else {
      loadAllData();
    }
  }, [selectedTaxpayerId]);

  // Land Handlers
  const handleOpenAddLand = () => {
    setNewLandKitta(`KT-${Math.floor(Math.random() * 800 + 100)}`);
    setNewLandMoth(`MT-${Math.floor(Math.random() * 90 + 10)}`);
    setNewLandUnitId(1); // 1 = Ropani system
    setRopaniInput(0);
    setAanaInput(4);
    setPaisaInput(0);
    setDhanInput(0);
    setBighaInput(0);
    setKathaInput(0);
    setDhurInput(0);
    setSqmetreInput(127);
    setSqfeetDirectInput(1369);
    setNewLandArea(1369);
    setNewLandNatureId(1);
    const ward = taxpayerDossier?.taxpayer?.ward_no || 1;
    setNewLandWard(ward);
    const wLandRates = masters.landRates.filter((r: any) => !r.ward_no_ids || r.ward_no_ids.split(',').map((w: string) => w.trim()).includes(String(ward)));
    setNewLandRateId(wLandRates[0]?.id || masters.landRates[0]?.id || 1);
    const wMalpotRates = masters.malpotRates.filter((r: any) => !r.ward_no_ids || r.ward_no_ids.split(',').map((w: string) => w.trim()).includes(String(ward)));
    setNewLandMalpotRateId(wMalpotRates[0]?.id || masters.malpotRates[0]?.id || 1);
    setNewLandAcquisitionFyId(2);
    setNewLandModalOpen(true);
  };

  const handleCreateLand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLandKitta || !newLandMoth) return;
    const res = await ApiController.createLand({
      taxpayer_id: selectedTaxpayerId,
      kitta_number: newLandKitta,
      moth_number: newLandMoth,
      ward_no: newLandWard,
      area_sqfeet: newLandArea,
      unit_id: newLandUnitId,
      land_measuring_unit_id: newLandUnitId,
      nature_id: newLandNatureId,
      land_rate_id: newLandRateId,
      malpot_rate_id: newLandMalpotRateId,
      acquisition_fy_id: newLandAcquisitionFyId
    });
    if (res.success) {
      setStatusMsg(`Land Parcel Kitta ${newLandKitta} registered successfully!`);
      setNewLandModalOpen(false);
      loadAllData();
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleOpenEditLand = (land: any) => {
    setEditingLand({ ...land });
    setEditLandModalOpen(true);
  };

  const handleSaveEditLand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLand) return;
    const res = await ApiController.updateLand(editingLand.id, editingLand);
    if (res.success) {
      setStatusMsg(`Land Parcel Kitta ${editingLand.kitta_number} updated with recalculated valuation!`);
      setEditLandModalOpen(false);
      loadAllData();
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleDeleteLand = async (id: number) => {
    if (!confirm("Are you sure you want to delete this land record? ")) return;
    const res = await ApiController.deleteLand(id);
    if (res.success) {
      setStatusMsg("Land parcel deleted successfully.");
      loadAllData();
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // House Handlers
  const handleOpenAddHouse = () => {
    setNewHouseNo(`H-${Math.floor(Math.random() * 500 + 100)}`);
    setNewHouseArea(2200);
    setNewHousePlinth(1100);
    setNewHouseFloors(2);
    setNewHouseConstType(1);
    setNewHouseLandId(taxpayerDossier?.lands[0]?.id || null);
    setNewHouseModalOpen(true);
  };

  const handleCreateHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouseNo) return;
    const res = await ApiController.createHouse({
      taxpayer_id: selectedTaxpayerId,
      land_id: newHouseLandId,
      house_no: newHouseNo,
      area_sqfeet: newHouseArea,
      plinth_area: newHousePlinth,
      floor_no: newHouseFloors,
      construction_type_id: newHouseConstType
    });
    if (res.success && res.data) {
      // Auto register ground floor
      await ApiController.createFloor({
        house_id: res.data.id,
        floor_no: 0,
        area_sqfeet: newHousePlinth,
        construction_type_id: newHouseConstType,
        rate_id: 1,
        remarks: "Ground Floor Residential",
        depreciation_percent: 5
      });
      setStatusMsg(`House ${newHouseNo} and ground floor registered!`);
      setNewHouseModalOpen(false);
      loadAllData();
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleOpenEditHouse = (house: any) => {
    setEditingHouse({ ...house });
    setEditHouseModalOpen(true);
  };

  const handleSaveEditHouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHouse) return;
    const res = await ApiController.updateHouse(editingHouse.id, editingHouse);
    if (res.success) {
      setStatusMsg(`House ${editingHouse.house_no} updated successfully!`);
      setEditHouseModalOpen(false);
      loadAllData();
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleDeleteHouse = async (id: number) => {
    if (!confirm("Are you sure you want to delete this house structure and its associated floors?")) return;
    const res = await ApiController.deleteHouse(id);
    if (res.success) {
      setStatusMsg("House record deleted successfully.");
      loadAllData();
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // Floor Handlers
  const handleOpenAddFloor = (houseId?: number) => {
    const targetHouseId = houseId || taxpayerDossier?.houses[0]?.id || 1;
    const existingFloorsCount = taxpayerDossier?.floors?.filter((f: any) => f.house_id === targetHouseId).length || 0;
    setNewFloorHouseId(targetHouseId);
    setNewFloorNo(existingFloorsCount);
    setNewFloorArea(1000);
    setNewFloorConstType(1);
    setNewFloorRateId(masters.constructionRates[0]?.id || 1);
    setNewFloorUnitId(1);
    setNewFloorConstDateAd("2023-05-15");
    setNewFloorConstDateBs("2080-02-01");
    setNewFloorRemarks(`Floor Level ${existingFloorsCount}`);
    setNewFloorDepreciation(5);
    setNewFloorModalOpen(true);
  };

  const handleCreateFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await ApiController.createFloor({
      house_id: newFloorHouseId,
      floor_no: newFloorNo,
      area_sqfeet: newFloorArea,
      construction_type_id: newFloorConstType,
      construction_date_ad: newFloorConstDateAd,
      construction_date_bs: newFloorConstDateBs,
      rate_id: newFloorRateId,
      unit_id: newFloorUnitId,
      measuring_unit_id: newFloorUnitId,
      remarks: newFloorRemarks,
      depreciation_percent: newFloorDepreciation
    });
    if (res.success) {
      setStatusMsg(`Floor #${newFloorNo} added successfully!`);
      setNewFloorModalOpen(false);
      loadAllData();
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleOpenEditFloor = (floor: any) => {
    setEditingFloor({ ...floor });
    setEditFloorModalOpen(true);
  };

  const handleSaveEditFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFloor) return;
    const res = await ApiController.updateFloor(editingFloor.id, editingFloor);
    if (res.success) {
      setStatusMsg(`Floor #${editingFloor.floor_no} updated with recalculated valuation!`);
      setEditFloorModalOpen(false);
      loadAllData();
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleDeleteFloor = async (id: number) => {
    if (!confirm("Are you sure you want to delete this floor?")) return;
    const res = await ApiController.deleteFloor(id);
    if (res.success) {
      setStatusMsg("Floor deleted successfully.");
      loadAllData();
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // Taxpayer Handlers (Launches continuous One-Door Process)
  const handleOpenAddTaxpayer = () => {
    setOneDoorModalOpen(true);
  };

  const handleCreateTaxpayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTpName || !newTpMobile) return;
    const res = await ApiController.createTaxpayer({
      fullanme: newTpName,
      mobile_no: newTpMobile,
      email: newTpEmail,
      ward_no: newTpWard,
      pan_vat_no: newTpPan,
      citizenship_no: newTpCitizenship
    });
    if (res.success && res.data) {
      setStatusMsg(`Taxpayer ${res.data.fullanme} registered successfully!`);
      setSelectedTaxpayerId(res.data.id);
      setNewTpModalOpen(false);
      loadAllData();
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleOpenEditTaxpayer = (tp: any) => {
    setEditingTaxpayer({ ...tp });
    setEditTaxpayerModalOpen(true);
  };

  const handleSaveEditTaxpayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTaxpayer) return;
    const res = await ApiController.updateTaxpayer(editingTaxpayer.id, editingTaxpayer);
    if (res.success) {
      setStatusMsg(`Taxpayer ${editingTaxpayer.fullanme} updated successfully!`);
      setEditTaxpayerModalOpen(false);
      loadAllData();
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleDeleteTaxpayer = async (id: number) => {
    if (!confirm("Are you sure you want to delete this taxpayer? All registered assets will be archived.")) return;
    const res = await ApiController.deleteTaxpayer(id);
    if (res.success) {
      setStatusMsg("Taxpayer deleted successfully.");
      if (selectedTaxpayerId === id) {
        setDossierOpen(false);
      }
      loadAllData();
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // Filter taxpayers
  const filteredTaxpayers = taxpayers.filter((tp) => {
    if (selectedWardFilter !== "all" && String(tp.ward_no) !== String(selectedWardFilter)) {
      return false;
    }
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (tp.fullanme && tp.fullanme.toLowerCase().includes(term)) ||
      (tp.code && tp.code.toLowerCase().includes(term)) ||
      (tp.mobile_no && tp.mobile_no.includes(term)) ||
      (tp.pan_vat_no && tp.pan_vat_no.toLowerCase().includes(term)) ||
      (tp.citizenship_no && tp.citizenship_no.toLowerCase().includes(term))
    );
  });

  // Active selected taxpayer derivation - always syncs with clicked row in list
  const currentTaxpayer = taxpayers.find((tp) => Number(tp.id) === Number(selectedTaxpayerId)) || taxpayerDossier?.taxpayer;

  // Calculation preparation derivations for Calculate tab
  const currentFiscalYear = masters.fiscalYears.find((f: any) => f.id === calcFiscalYearId) || masters.fiscalYears[0];
  const fyCode = currentFiscalYear?.code || "2081/82";

  const dossierLands = taxpayerDossier?.lands || [];
  const computedLandsForCalc = dossierLands.map((l: any) => {
    const isSelected = calcSelectedLandIds.includes(l.id);
    const applicableRate = calcUseMalpot
      ? masters.malpotRates.find((r: any) => r.id === l.malpot_rate_id)
      : masters.landRates.find((r: any) => r.id === l.land_rate_id);
    const rateVal = applicableRate ? Number(applicableRate.rate_per_unit) : 800000;
    const areaPerUnitVal = applicableRate ? Number(applicableRate.area_per_unit || 1) : 1;
    const unitId = Number(l.unit_id || l.land_measuring_unit_id || 1);

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
      rate_name: applicableRate?.rate_name || applicableRate?.code,
      rate_per_unit: rateVal,
      area_per_unit: areaPerUnitVal,
      rate_source: calcUseMalpot ? "Malpot Rate" : "Land Rate",
      calculated_amount: evaluatedAmount,
      calculated_add_amount: 0,
      calculated_subtract_amount: 0,
      calculated_total_amount: evaluatedAmount,
      self_declared_amount: evaluatedAmount,
      total_amount: isSelected ? evaluatedAmount : 0,
      isSelected
    };
  });

  const dossierHouses = taxpayerDossier?.houses || [];
  const dossierFloors = taxpayerDossier?.floors || [];

  const computedFloorsForCalc = dossierFloors.map((fl: any) => {
    const cr = masters.constructionRates.find((r: any) => r.id === fl.rate_id) || masters.constructionRates[0];
    const ratePerSqft = cr ? Number(cr.rate_per_unit) : 2800;
    const rawAmount = getFloorEvaluationAmount(Number(fl.area_sqfeet || 0), cr);
    const { depreciationRate, depreciationAmount } = getDepreciationAmount(
      masters.depreciations || [],
      fyCode,
      rawAmount,
      Number(fl.construction_type_id || 1),
      fl.construction_date_bs || "2075-01-01"
    );
    const netAmount = Math.max(0, rawAmount - depreciationAmount);

    return {
      floor_id: fl.id,
      house_id: fl.house_id,
      floor_no: fl.floor_no,
      area_in_sqft: Number(fl.area_sqfeet || 0),
      construction_rate: ratePerSqft,
      depreciation_rate: depreciationRate,
      calculated_amount: rawAmount,
      depreciation_amount: depreciationAmount,
      calculated_add_amount: 0,
      calculated_subtract_amount: 0,
      calculated_total_amount: netAmount,
      self_declared_amount: netAmount,
      total_amount: netAmount
    };
  });

  const computedHousesForCalc = dossierHouses.map((h: any) => {
    const houseFloors = computedFloorsForCalc.filter((fl: any) => fl.house_id === h.id);
    const houseTotal = houseFloors.reduce((acc: number, f: any) => acc + f.total_amount, 0);
    const houseCalc = houseFloors.reduce((acc: number, f: any) => acc + f.calculated_amount, 0);
    const houseDep = houseFloors.reduce((acc: number, f: any) => acc + f.depreciation_amount, 0);

    return {
      house_id: h.id,
      house_no: h.house_no,
      area_sqft: Number(h.area_sqfeet || 0),
      unit_id: Number(h.measuring_unit_id || 1),
      depreciation_rate: houseFloors[0]?.depreciation_rate || 5,
      calculated_amount: houseCalc,
      depreciation_amount: houseDep,
      calculated_add_amount: 0,
      calculated_subtract_amount: 0,
      calculated_total_amount: houseTotal,
      self_declared_amount: houseTotal,
      total_amount: houseTotal
    };
  });

  const totalLandEvalAmount = computedLandsForCalc.filter((l: any) => l.isSelected).reduce((acc: number, l: any) => acc + l.total_amount, 0);
  const totalHouseEvalAmount = computedHousesForCalc.reduce((acc: number, h: any) => acc + h.total_amount, 0);
  const Evaluated_Amount = Math.round(totalLandEvalAmount + totalHouseEvalAmount);

  const calculatedIptTax = getIPTAmount(masters.propertyRanges || [], Evaluated_Amount, calcFiscalYearId);
  const sanitationFee = 200;
  const grandTotalTaxPayable = calculatedIptTax + sanitationFee;

  const handleSaveCalculation = async () => {
    if (!taxpayerDossier?.taxpayer) return;
    setIsSavingCalc(true);
    try {
      const res = await ApiController.saveCalculationMaster({
        taxpayer_id: taxpayerDossier.taxpayer.id,
        fiscal_year_id: calcFiscalYearId,
        total_tax: grandTotalTaxPayable,
        calculate_date_bs: "2081-05-15",
        insert_by: "OPERATOR",
        lands: computedLandsForCalc.filter((l: any) => l.isSelected).map((l: any) => ({
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
        houses: computedHousesForCalc.map((h: any) => ({
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
        floors: computedFloorsForCalc.map((fl: any) => ({
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
        setStatusMsg("Calculation saved to database (calc_master, calc_land, calc_house, calc_floor)!");
        setTimeout(() => setStatusMsg(null), 3500);
      }
    } catch (e) {
      console.error(e);
      setStatusMsg("Failed to save calculation.");
    } finally {
      setIsSavingCalc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Only Taxpayer Detail */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <span>Taxpayer Detail (करदाता विवरण)</span>
          </h2>
        
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            title="Reload Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenAddTaxpayer}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all"
            title="Continuous Save and Continue Process (Taxpayer -> Lands -> Houses -> Floors -> Valuation)"
          >
            <Plus className="w-4 h-4" />
            <span>New Taxpayer (One-Door Process)</span>
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

      {/* Main Taxpayer Master Grid with Search & Ward Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search taxpayer name, code, mobile, PAN, citizenship..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Ward:</span>
            <select
              value={selectedWardFilter}
              onChange={(e) => setSelectedWardFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
            >
              <option value="all">All Wards</option>
              {Array.from({ length: 32 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={String(w)}>Ward {w}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Master Taxpayer Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="p-3.5">{tCol("fullname", currentLang)}</th>
                  <th className="p-3.5">{tCol("taxpayer_code", currentLang)}</th>
                  <th className="p-3.5">{tCol("ward_no", currentLang)}</th>
                  <th className="p-3.5">{tCol("mobile_no", currentLang)}</th>
                  <th className="p-3.5">{tCol("pan_number", currentLang)}</th>
                  <th className="p-3.5">{tCol("citizenship_number", currentLang)}</th>
                  <th className="p-3.5 text-right">{t.actions || "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTaxpayers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No taxpayers found matching criteria. Click "New Taxpayer" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredTaxpayers.map((tp) => (
                    <tr
                      key={tp.id}
                      onClick={() => {
                        setSelectedTaxpayerId(tp.id);
                        loadTaxpayerDossier(tp.id);
                      }}
                      className={`transition-all cursor-pointer ${
                        selectedTaxpayerId === tp.id
                          ? "bg-indigo-50/90 dark:bg-indigo-950/70 border-l-4 border-indigo-600 shadow-2xs font-semibold"
                          : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <td className="p-3.5 text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                            selectedTaxpayerId === tp.id
                              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                              : "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                          }`}>
                            {tp.fullanme ? tp.fullanme.charAt(0) : "T"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{tp.fullanme}</span>
                              {selectedTaxpayerId === tp.id && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-normal">{tp.email || "No email"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                        {tp.code}
                      </td>
                      <td className="p-3.5 font-mono">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                          Ward #{tp.ward_no}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                        {tp.mobile_no}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                        {tp.pan_vat_no || "N/A"}
                      </td>
                      <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                        {tp.citizenship_no || "N/A"}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* 1. Calculate Action Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTaxpayerId(tp.id);
                              setDossierTab("calculate");
                              setDossierOpen(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl border border-amber-200 dark:border-amber-800 transition-colors shadow-2xs"
                            title="Calculate Property Tax for this Taxpayer"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Calculate</span>
                          </button>

                          {/* 2. Edit Action Button (Opens dossier with tabs: taxpayer, land, house, calculate) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTaxpayerId(tp.id);
                              setDossierTab("taxpayer");
                              setDossierOpen(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors shadow-2xs"
                            title="Open Dossier (Taxpayer, Land, House, Calculate)"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* 3. Delete Action Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTaxpayer(tp.id);
                            }}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors"
                            title="Delete Taxpayer Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* Taxpayer Dossier Modal with Tabs: Taxpayer, Land, House, Calculate */}
      {dossierOpen && selectedTaxpayerId && (
        <TaxpayerDossierModal
          taxpayerId={selectedTaxpayerId}
          initialTab={dossierTab}
          masters={masters}
          currentLang={currentLang}
          onClose={() => setDossierOpen(false)}
          onRefresh={() => loadAllData()}
        />
      )}

      {/* Continuous One-Door Taxpayer & Asset Registration Wizard */}
      {oneDoorModalOpen && (
        <OneDoorRegistrationModal
          isOpen={oneDoorModalOpen}
          onClose={() => setOneDoorModalOpen(false)}
          masters={masters}
          currentLang={currentLang}
          onComplete={(newTpId) => {
            setSelectedTaxpayerId(newTpId);
            loadAllData();
          }}
        />
      )}

      {/* ========================================================= */}
      {/* 1. OVERVIEW: UNIFIED COMMON TAXPAYER DOSSIER & ASSESSMENT */}
      {/* ========================================================= */}
      {subView === "overview" && taxpayerDossier && (() => {
        const activeTaxpayer = taxpayers.find(tp => Number(tp.id) === Number(selectedTaxpayerId)) || taxpayerDossier.taxpayer;
        const tpDisplay = { ...taxpayerDossier.taxpayer, ...(activeTaxpayer || {}) };
        return (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Active Taxpayer Header & Quick Actions */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-indigo-600/20">
                  {(tpDisplay.fullanme || "T").charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {tpDisplay.fullanme}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Active Taxpayer Record
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Code: <span className="font-bold text-indigo-600 dark:text-indigo-400">{tpDisplay.code}</span> · Ward: #{tpDisplay.ward_no} · Mobile: {tpDisplay.mobile_no}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setDossierTab("calculate");
                    setDossierOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-xl border border-amber-200 dark:border-amber-800 transition-colors shadow-2xs"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Interactive Calc</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t.printBill || "Print Bill"}</span>
                </button>
                <button
                  onClick={() => handleOpenEditTaxpayer(tpDisplay)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* Taxpayer Meta Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Citizenship No</div>
                <div className="font-bold text-slate-800 dark:text-slate-200">{tpDisplay.citizenship_no || "N/A"}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans">PAN / VAT</div>
                <div className="font-bold text-slate-800 dark:text-slate-200">{tpDisplay.pan_vat_no || "N/A"}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Email Address</div>
                <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{tpDisplay.email || "N/A"}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-sans">Municipal Zone</div>
                <div className="font-bold text-indigo-600 dark:text-indigo-400">Ward #{tpDisplay.ward_no} · Commercial/Res</div>
              </div>
            </div>
          </div>

          {/* Grand Valuation Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Land Value (जग्गा)</span>
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                Rs. {taxpayerDossier.valuationSummary.totalLandValuation?.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{taxpayerDossier.lands.length} Parcels Registered</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Building Value (घर)</span>
                <Home className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                Rs. {taxpayerDossier.valuationSummary.totalHouseValuation?.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{taxpayerDossier.houses.length} Houses · {taxpayerDossier.floors.length} Floors</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Early Rebate (छुट)</span>
                <Percent className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                - Rs. {taxpayerDossier.valuationSummary.rebateApplied?.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-600/80 mt-0.5 font-mono">10% Early Filing Discount</div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-200 flex items-center justify-between">
                <span>Net Payable Tax (कर)</span>
                <Receipt className="w-3.5 h-3.5 text-indigo-200" />
              </div>
              <div className="text-2xl font-black font-mono mt-1">
                Rs. {taxpayerDossier.valuationSummary.netPayableTax?.toLocaleString()}
              </div>
              <div className="text-[11px] text-indigo-200 mt-0.5 font-mono">FY 2081/82 Municipal Bill</div>
            </div>
          </div>

          {/* Master-Detail Tab Navigator */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-1.5 gap-1.5">
              <button
                onClick={() => setCommonDetailTab("assessment")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  commonDetailTab === "assessment"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Live Tax Assessment & Bill</span>
              </button>

              <button
                onClick={() => setCommonDetailTab("lands")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  commonDetailTab === "lands"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>Land Dossier ({taxpayerDossier.lands.length})</span>
              </button>

              <button
                onClick={() => setCommonDetailTab("houses")}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  commonDetailTab === "houses"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Home className="w-4 h-4 text-purple-500" />
                <span>Buildings & Floors ({taxpayerDossier.houses.length})</span>
              </button>
            </div>

            {/* TAB CONTENT: 1. Assessment & Bill */}
            {commonDetailTab === "assessment" && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Itemized Tax Assessment for {taxpayerDossier.taxpayer.fullanme}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Calculated under Nepal Local Governance Tax Act with progressive evaluation slabs.
                    </p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Assessment Bill</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3.5">Asset Type</th>
                        <th className="py-2.5 px-3.5">Identifier / Moth / Ward</th>
                        <th className="py-2.5 px-3.5">Area (Sq.Ft)</th>
                        <th className="py-2.5 px-3.5 text-right">Assessed Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {taxpayerDossier.lands.map((l: any) => (
                        <tr key={`l_${l.id}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Land Parcel (जग्गा)</span>
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-slate-700 dark:text-slate-300">
                            Kitta #{l.kitta_number} (Moth #{l.moth_number}) · Ward {l.ward_no}
                          </td>
                          <td className="py-2.5 px-3.5 font-mono">{Number(l.area_sqfeet).toLocaleString()}</td>
                          <td className="py-2.5 px-3.5 text-right font-bold font-mono text-slate-900 dark:text-white">
                            Rs. {Number(l.assessed_valuation || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {taxpayerDossier.houses.map((h: any) => (
                        <tr key={`h_${h.id}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Home className="w-3.5 h-3.5 text-purple-500" />
                            <span>Building Structure (भवन)</span>
                          </td>
                          <td className="py-2.5 px-3.5 font-mono text-slate-700 dark:text-slate-300">
                            House #{h.house_no} ({h.floor_no} Floors)
                          </td>
                          <td className="py-2.5 px-3.5 font-mono">{Number(h.area_sqfeet).toLocaleString()}</td>
                          <td className="py-2.5 px-3.5 text-right font-bold font-mono text-slate-900 dark:text-white">
                            Rs. {Number(h.assessed_valuation || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {taxpayerDossier.lands.length === 0 && taxpayerDossier.houses.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-400">
                            No land or building records registered for this taxpayer yet. Click below to add assets.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-800 font-bold border-t border-slate-200 dark:border-slate-800">
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3.5 text-right uppercase text-[11px] text-slate-500">
                          Total Combined Valuation:
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono text-slate-900 dark:text-white">
                          Rs. {(Number(taxpayerDossier.valuationSummary.totalLandValuation || 0) + Number(taxpayerDossier.valuationSummary.totalHouseValuation || 0)).toLocaleString()}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={3} className="py-2.5 px-3.5 text-right uppercase text-[11px] text-emerald-600">
                          Early Payment Rebate (10%):
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono text-emerald-600">
                          - Rs. {Number(taxpayerDossier.valuationSummary.rebateApplied || 0).toLocaleString()}
                        </td>
                      </tr>
                      <tr className="text-sm bg-indigo-50/70 dark:bg-indigo-950/40">
                        <td colSpan={3} className="py-3 px-3.5 text-right uppercase text-xs font-black text-indigo-700 dark:text-indigo-300">
                          Net Municipal Tax Due:
                        </td>
                        <td className="py-3 px-3.5 text-right font-mono font-black text-indigo-700 dark:text-indigo-300">
                          Rs. {Number(taxpayerDossier.valuationSummary.netPayableTax || 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. Land Dossier */}
            {commonDetailTab === "lands" && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      <span>Registered Land Parcels ({taxpayerDossier.lands.length})</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      Parcels owned by {taxpayerDossier.taxpayer.fullanme} with assessed municipal valuations.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenAddLand}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Land Parcel</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3.5">Kitta / Moth</th>
                        <th className="py-2.5 px-3.5">Area (Sq.Ft)</th>
                        <th className="py-2.5 px-3.5">Ward</th>
                        <th className="py-2.5 px-3.5">Acquisition FY</th>
                        <th className="py-2.5 px-3.5">Assessed Valuation</th>
                        <th className="py-2.5 px-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {taxpayerDossier.lands.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">
                            No land parcels registered. Click "Add Land Parcel" above to register one.
                          </td>
                        </tr>
                      ) : (
                        taxpayerDossier.lands.map((land: any) => (
                          <tr key={land.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white font-mono">
                              Kitta #{land.kitta_number} (Moth #{land.moth_number})
                            </td>
                            <td className="py-2.5 px-3.5 font-mono">{Number(land.area_sqfeet).toLocaleString()}</td>
                            <td className="py-2.5 px-3.5 font-mono">Ward #{land.ward_no}</td>
                            <td className="py-2.5 px-3.5 font-mono text-slate-500">FY 2080/81</td>
                            <td className="py-2.5 px-3.5 font-bold font-mono text-emerald-600">
                              Rs. {Number(land.assessed_valuation || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditLand(land)}
                                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg"
                                  title="Edit Land"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLand(land.id)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg"
                                  title="Delete Land"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            )}

            {/* TAB CONTENT: 3. Building & Floor Dossier */}
            {commonDetailTab === "houses" && (
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Home className="w-4 h-4 text-purple-500" />
                      <span>Building Structures & Floor Units ({taxpayerDossier.houses.length})</span>
                    </h4>
                    <p className="text-xs text-slate-500">
                      RCC and masonry houses evaluated with floor plinth areas and depreciation rates.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenAddHouse}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add House Structure</span>
                    </button>
                    {taxpayerDossier.houses.length > 0 && (
                      <button
                        onClick={() => handleOpenAddFloor()}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Floor Unit</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {taxpayerDossier.houses.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl">
                      No building structures registered for this taxpayer. Click "Add House Structure" above to add one.
                    </div>
                  ) : (
                    taxpayerDossier.houses.map((house: any) => {
                      const houseFloors = taxpayerDossier.floors.filter((f: any) => f.house_id === house.id);
                      return (
                        <div key={house.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                                <Home className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white text-xs">
                                  House #{house.house_no}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  Plinth: {house.plinth_area} sq.ft · Total: {house.area_sqfeet} sq.ft · Floors: {house.floor_no}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono text-purple-600 dark:text-purple-400 text-xs">
                                Rs. {Number(house.assessed_valuation || 0).toLocaleString()}
                              </span>
                              <button
                                onClick={() => handleOpenAddFloor(house.id)}
                                className="px-2 py-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-lg border border-indigo-200"
                              >
                                + Floor
                              </button>
                              <button
                                onClick={() => handleOpenEditHouse(house)}
                                className="p-1 text-slate-500 hover:text-indigo-600"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteHouse(house.id)}
                                className="p-1 text-slate-500 hover:text-rose-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Floor Units Table */}
                          {houseFloors.length > 0 && (
                            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                              <table className="w-full text-left text-[11px]">
                                <thead className="bg-slate-100/60 dark:bg-slate-800 text-slate-600 font-semibold uppercase">
                                  <tr>
                                    <th className="py-1.5 px-3">Floor Level</th>
                                    <th className="py-1.5 px-3">Area (Sq.Ft)</th>
                                    <th className="py-1.5 px-3">Depreciation</th>
                                    <th className="py-1.5 px-3">Description</th>
                                    <th className="py-1.5 px-3 text-right">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {houseFloors.map((floor: any) => (
                                    <tr key={floor.id}>
                                      <td className="py-1.5 px-3 font-bold">Floor #{floor.floor_no}</td>
                                      <td className="py-1.5 px-3 font-mono">{floor.area_sqfeet}</td>
                                      <td className="py-1.5 px-3 font-mono text-amber-600">{floor.depreciation_percent}%</td>
                                      <td className="py-1.5 px-3 text-slate-500">{floor.remarks || "Residential Unit"}</td>
                                      <td className="py-1.5 px-3 text-right">
                                        <button
                                          onClick={() => handleDeleteFloor(floor.id)}
                                          className="text-rose-500 hover:text-rose-700 p-0.5"
                                        >
                                          <Trash2 className="w-3 h-3 inline" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {/* ========================================================= */}
      {/* 2. LAND MANAGEMENT: List, Add, and EDIT EACH LAND         */}
      {/* ========================================================= */}
      {subView === "lands" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Land Parcels for {taxpayerDossier?.taxpayer?.fullanme}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Each parcel can be edited with real-time recalculation based on area, measuring unit, zoning nature, and rate matrices.
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
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Kitta / Moth</th>
                    <th className="p-3.5">Area (Sq.Ft)</th>
                    <th className="p-3.5">Unit (unit_id)</th>
                    <th className="p-3.5">Land Rate (land_rate_id)</th>
                    <th className="p-3.5">Malpot Rate (malpot_rate_id)</th>
                    <th className="p-3.5">Acquisition FY</th>
                    <th className="p-3.5">Ward</th>
                    <th className="p-3.5">Assessed Valuation</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(!taxpayerDossier?.lands || taxpayerDossier.lands.length === 0) ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No land parcels registered for this taxpayer. Click "Add Land Parcel" above.
                      </td>
                    </tr>
                  ) : (
                    taxpayerDossier.lands.map((l: any) => {
                      const landRate = masters.landRates.find((r: any) => r.id === l.land_rate_id);
                      const malpotRate = masters.malpotRates.find((r: any) => r.id === l.malpot_rate_id);
                      const acqFy = masters.fiscalYears.find((fy: any) => fy.id === (l.acquisition_fy_id || 2));
                      
                      const getUnitName = (uid: number) => {
                        switch (Number(uid)) {
                          case 1: return "Ropani";
                          case 2: return "Bigha";
                          case 3: return "Sq. Feet";
                          case 4: return "Sq. Metre";
                          default: return "Sq. Feet";
                        }
                      };

                      return (
                        <tr key={l.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                            <div>Kitta #{l.kitta_number}</div>
                            <div className="text-[11px] text-slate-400 font-normal">Moth #{l.moth_number}</div>
                          </td>
                          <td className="p-3.5 font-mono">
                            <span className="font-bold text-slate-900 dark:text-white">{l.area_sqfeet}</span> sq.ft
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-[11px]">
                              {getUnitName(l.unit_id || l.land_measuring_unit_id || 1)}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            {landRate?.rate_name || landRate?.code || `Rate #${l.land_rate_id}`}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            {malpotRate?.rate_name || malpotRate?.code || `Rate #${l.malpot_rate_id}`}
                          </td>
                          <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                            {acqFy?.code || "2081/82"}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                              Ward #{l.ward_no}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            Rs. {Number(l.assessed_valuation).toLocaleString()}
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditLand(l)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
                                title="Edit this land parcel"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit Land</span>
                              </button>
                              <button
                                onClick={() => handleDeleteLand(l.id)}
                                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
                                title="Delete land"
                              >
                                <Trash2 className="w-3 h-3" />
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
      {/* 3. HOUSE MANAGEMENT: List, Add, and EDIT EACH HOUSE       */}
      {/* ========================================================= */}
      {subView === "houses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Home className="w-4 h-4 text-purple-600" />
                <span>Building & House Structures for {taxpayerDossier?.taxpayer?.fullanme}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Manage building numbers, plinth areas, floor counts, construction dates, and types.
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="p-3.5">House Number (घर नं.)</th>
                    <th className="p-3.5">Plinth Area & Total</th>
                    <th className="p-3.5">Floors Count</th>
                    <th className="p-3.5">Construction Type</th>
                    <th className="p-3.5">Built Date (BS / AD)</th>
                    <th className="p-3.5">Assessed Valuation</th>
                    <th className="p-3.5 text-right">Actions (Edit / Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(!taxpayerDossier?.houses || taxpayerDossier.houses.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        No houses registered for this taxpayer. Click "Add House Structure" above.
                      </td>
                    </tr>
                  ) : (
                    taxpayerDossier.houses.map((h: any) => {
                      const constType = masters.constructionTypes.find((c: any) => c.id === h.construction_type_id);
                      return (
                        <tr key={h.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                            {h.house_no}
                          </td>
                          <td className="p-3.5 font-mono">
                            <span className="font-bold text-slate-900 dark:text-white">{h.plinth_area}</span> sq.ft (Plinth)
                            <div className="text-[11px] text-slate-400">{h.area_sqfeet} sq.ft total</div>
                          </td>
                          <td className="p-3.5 font-mono font-semibold">
                            <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300">
                              {h.floor_no} Floors
                            </span>
                          </td>
                          <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">
                            {constType?.fullanme || "RCC Frame Structure"}
                          </td>
                          <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                            {h.acquisition_date_bs || "2076-02-15"}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-purple-700 dark:text-purple-400">
                            Rs. {Number(h.assessed_valuation).toLocaleString()}
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenAddFloor(h.id)}
                                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                                title="Add floor to this house"
                              >
                                <Plus className="w-3 h-3 text-indigo-500" />
                                <span>+Floor</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditHouse(h)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors"
                                title="Edit this house structure"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit House</span>
                              </button>
                              <button
                                onClick={() => handleDeleteHouse(h.id)}
                                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
                                title="Delete house"
                              >
                                <Trash2 className="w-3 h-3" />
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
      {/* 4. FLOOR MANAGEMENT: List, Add, and EDIT EACH FLOOR       */}
      {/* ========================================================= */}
      {subView === "floors" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Floor Units for {taxpayerDossier?.taxpayer?.fullanme}</span>
              </h3>
              <p className="text-xs text-slate-500">
                Floor breakdown with individual construction rates, depreciation percentages, and net assessed values.
              </p>
            </div>
            <button
              onClick={() => handleOpenAddFloor()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Floor Slab</span>
            </button>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Floor Level</th>
                    <th className="p-3.5">House (house_id)</th>
                    <th className="p-3.5">Area (area_sqfeet)</th>
                    <th className="p-3.5">Construction Date (BS / AD)</th>
                    <th className="p-3.5">Const Type</th>
                    <th className="p-3.5">Rate (rate_id)</th>
                    <th className="p-3.5">Depreciation</th>
                    <th className="p-3.5">Floor Valuation</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(!taxpayerDossier?.floors || taxpayerDossier.floors.length === 0) ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        No floors registered. Add a house and floor slabs.
                      </td>
                    </tr>
                  ) : (
                    taxpayerDossier.floors.map((fl: any) => {
                      const house = taxpayerDossier.houses.find((h: any) => h.id === fl.house_id);
                      const cr = masters.constructionRates.find((c: any) => c.id === fl.rate_id);
                      const cType = masters.constructionTypes.find((ct: any) => ct.id === fl.construction_type_id);
                      return (
                        <tr key={fl.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            Floor #{fl.floor_no} {fl.floor_no === 0 ? "(Ground)" : fl.floor_no === 1 ? "(1st)" : ""}
                            <div className="text-[11px] text-slate-400 font-normal font-sans">{fl.remarks}</div>
                          </td>
                          <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                            {house?.house_no || `House #${fl.house_id}`}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                            {fl.area_sqfeet} sq.ft
                          </td>
                          <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                            <div>{fl.construction_date_bs || "2080-02-01"} BS</div>
                            <div className="text-[10px] text-slate-400">{fl.construction_date_ad || "2023-05-15"} AD</div>
                          </td>
                          <td className="p-3.5 text-slate-700 dark:text-slate-300 text-[11px]">
                            {cType?.fullanme?.split("(")[0] || "RCC Frame"}
                          </td>
                          <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                            Rs. {cr?.rate_per_unit || 2800} / sq.ft
                          </td>
                          <td className="p-3.5 font-mono">
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                              -{fl.depreciation_percent}%
                            </span>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-white">
                            Rs. {Number(fl.floor_assessed_valuation).toLocaleString()}
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditFloor(fl)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors"
                                title="Edit this floor slab"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Edit Floor</span>
                              </button>
                              <button
                                onClick={() => handleDeleteFloor(fl.id)}
                                className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg border border-transparent hover:border-rose-200 transition-colors"
                                title="Delete floor"
                              >
                                <Trash2 className="w-3 h-3" />
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
      {/* 5. TAX ASSESSMENT & OFFICIAL BILL                         */}
      {/* ========================================================= */}
      {subView === "assessment" && taxpayerDossier && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                <span>Official Municipal Property Tax Receipt</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-emerald-600 font-bold">Fiscal Year: 2081/82</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {taxpayerDossier.taxpayer.fullanme}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Taxpayer Code: {taxpayerDossier.taxpayer.code} · Ward: {taxpayerDossier.taxpayer.ward_no} · Mobile: {taxpayerDossier.taxpayer.mobile_no}
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>{t.printBill}</span>
            </button>
          </div>

          {/* Grand Valuation Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Total Land Value</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                Rs. {taxpayerDossier.valuationSummary.totalLandValuation?.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Total House Value</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                Rs. {taxpayerDossier.valuationSummary.totalHouseValuation?.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Early Rebate (10%)</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                - Rs. {taxpayerDossier.valuationSummary.rebateApplied?.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Net Payable Tax</div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                Rs. {taxpayerDossier.valuationSummary.netPayableTax?.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Itemized Breakdown Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="py-2.5 px-3">Asset Description</th>
                  <th className="py-2.5 px-3">Identifier / Kitta / House</th>
                  <th className="py-2.5 px-3">Area (Sq.Ft)</th>
                  <th className="py-2.5 px-3 text-right">Assessed Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {taxpayerDossier.lands.map((l: any) => (
                  <tr key={`l_${l.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 font-sans">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Land Parcel (जग्गा)</td>
                    <td className="py-2.5 px-3 font-mono">Kitta {l.kitta_number} (Moth {l.moth_number})</td>
                    <td className="py-2.5 px-3 font-mono">{l.area_sqfeet}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                      Rs. {Number(l.assessed_valuation).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {taxpayerDossier.houses.map((h: any) => (
                  <tr key={`h_${h.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 font-sans">
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">Building Structure (भवन)</td>
                    <td className="py-2.5 px-3 font-mono">{h.house_no}</td>
                    <td className="py-2.5 px-3 font-mono">{h.area_sqfeet}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                      Rs. {Number(h.assessed_valuation).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. MULTI-YEAR TAX ENGINE SUBVIEW                          */}
      {/* ========================================================= */}
      {subView === "multi_year_calc" && (
        <MultiYearTaxEngine
          currentLang={currentLang}
          initialTaxpayerId={selectedTaxpayerId}
        />
      )}

      {/* ========================================================= */}
      {/* MODALS SECTION                                            */}
      {/* ========================================================= */}

      {/* 1. EDIT LAND MODAL */}
      {editLandModalOpen && editingLand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit Land Parcel (Kitta {editingLand.kitta_number})
                </h3>
                <div className="text-[11px] text-slate-500 font-mono">Land Parcel · ID: {editingLand.id}</div>
              </div>
              <button onClick={() => setEditLandModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLand} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Kitta Number (कित्ता नं.)</label>
                  <input
                    type="text"
                    required
                    value={editingLand.kitta_number || ""}
                    onChange={(e) => setEditingLand({ ...editingLand, kitta_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Moth Number (मोठ नं.)</label>
                  <input
                    type="text"
                    required
                    value={editingLand.moth_number || ""}
                    onChange={(e) => setEditingLand({ ...editingLand, moth_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Area (Sq. Feet)</label>
                  <input
                    type="number"
                    required
                    value={editingLand.area_sqfeet || 0}
                    onChange={(e) => setEditingLand({ ...editingLand, area_sqfeet: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Ward Number</label>
                  <input
                    type="number"
                    value={editingLand.ward_no || 1}
                    onChange={(e) => setEditingLand({ ...editingLand, ward_no: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Measuring Unit</label>
                  <select
                    value={editingLand.land_measuring_unit_id || 3}
                    onChange={(e) => setEditingLand({ ...editingLand, land_measuring_unit_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {masters.units.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.fullanme} ({u.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Land Nature / Zoning</label>
                  <select
                    value={editingLand.nature_id || 1}
                    onChange={(e) => setEditingLand({ ...editingLand, nature_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {masters.landNatures.map((n: any) => (
                      <option key={n.id} value={n.id}>{n.fullanme}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Land Rate Matrix</label>
                  <select
                    value={editingLand.land_rate_id || 1}
                    onChange={(e) => setEditingLand({ ...editingLand, land_rate_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {masters.landRates.map((lr: any) => (
                      <option key={lr.id} value={lr.id}>{lr.fullanme} (Rs. {lr.rate_per_unit})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Malpot Rate Matrix</label>
                  <select
                    value={editingLand.malpot_rate_id || 1}
                    onChange={(e) => setEditingLand({ ...editingLand, malpot_rate_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {masters.malpotRates.map((mr: any) => (
                      <option key={mr.id} value={mr.id}>{mr.fullanme} (Rs. {mr.rate_per_unit})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="include_eval_land"
                  checked={editingLand.include_in_evaluation !== false}
                  onChange={(e) => setEditingLand({ ...editingLand, include_in_evaluation: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="include_eval_land" className="text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                  Include in Municipal Tax Assessment
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditLandModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors"
                >
                  Save Land Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ADD LAND MODAL */}
      {newLandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add Land Parcel for {taxpayerDossier?.taxpayer?.fullanme}
                </h3>
                <div className="text-[11px] text-slate-500 font-mono">New Land Parcel</div>
              </div>
              <button onClick={() => setNewLandModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLand} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Kitta Number</label>
                  <input
                    type="text"
                    required
                    value={newLandKitta}
                    onChange={(e) => setNewLandKitta(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Moth Number</label>
                  <input
                    type="text"
                    required
                    value={newLandMoth}
                    onChange={(e) => setNewLandMoth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Ward Number</label>
                  <input
                    type="number"
                    value={newLandWard}
                    onChange={(e) => {
                      const w = Number(e.target.value);
                      setNewLandWard(w);
                      const wLandRates = masters.landRates.filter((r: any) => !r.ward_no_ids || r.ward_no_ids.split(',').map((wn: string) => wn.trim()).includes(String(w)));
                      if (wLandRates.length > 0) setNewLandRateId(wLandRates[0].id);
                      const wMalpotRates = masters.malpotRates.filter((r: any) => !r.ward_no_ids || r.ward_no_ids.split(',').map((wn: string) => wn.trim()).includes(String(w)));
                      if (wMalpotRates.length > 0) setNewLandMalpotRateId(wMalpotRates[0].id);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Acquisition Fiscal Year</label>
                  <select
                    value={newLandAcquisitionFyId}
                    onChange={(e) => setNewLandAcquisitionFyId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {masters.fiscalYears.map((fy: any) => (
                      <option key={fy.id} value={fy.id}>{fy.code} ({fy.fullname.split("(")[0]})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Measurement Unit Format Selector */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Measurement Unit Format
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewLandUnitId(1);
                      const sqft = Math.round((ropaniInput * 5476) + (aanaInput * 342.25) + (paisaInput * 85.5625) + (dhanInput * 21.390625));
                      setNewLandArea(sqft);
                    }}
                    className={`py-1.5 px-2 rounded-xl border text-center font-bold text-xs transition-all ${
                      newLandUnitId === 1
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    Ropani (Unit 1)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewLandUnitId(2);
                      const sqft = Math.round((bighaInput * 72900) + (kathaInput * 3645) + (dhurInput * 182.25));
                      setNewLandArea(sqft || 1369);
                    }}
                    className={`py-1.5 px-2 rounded-xl border text-center font-bold text-xs transition-all ${
                      newLandUnitId === 2
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    Bigha (Unit 2)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewLandUnitId(3);
                      setNewLandArea(sqfeetDirectInput || 1369);
                    }}
                    className={`py-1.5 px-2 rounded-xl border text-center font-bold text-xs transition-all ${
                      newLandUnitId === 3
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    Sq. Feet (Unit 3)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewLandUnitId(4);
                      const sqft = Math.round(sqmetreInput * 10.76391);
                      setNewLandArea(sqft || 1369);
                    }}
                    className={`py-1.5 px-2 rounded-xl border text-center font-bold text-xs transition-all ${
                      newLandUnitId === 4
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    Sq. Metre (Unit 4)
                  </button>
                </div>
              </div>

              {/* Dynamic Unit Conversion Inputs */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Unit Input & Conversion (Final Save Value: Sq. Feet)
                </div>

                {newLandUnitId === 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Ropani</label>
                      <input
                        type="number"
                        min="0"
                        value={ropaniInput}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setRopaniInput(val);
                          const total = Math.round((val * 5476) + (aanaInput * 342.25) + (paisaInput * 85.5625) + (dhanInput * 21.390625));
                          setNewLandArea(total);
                        }}
                        className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Aana</label>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        value={aanaInput}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setAanaInput(val);
                          const total = Math.round((ropaniInput * 5476) + (val * 342.25) + (paisaInput * 85.5625) + (dhanInput * 21.390625));
                          setNewLandArea(total);
                        }}
                        className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Paisa</label>
                      <input
                        type="number"
                        min="0"
                        max="3"
                        value={paisaInput}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPaisaInput(val);
                          const total = Math.round((ropaniInput * 5476) + (aanaInput * 342.25) + (val * 85.5625) + (dhanInput * 21.390625));
                          setNewLandArea(total);
                        }}
                        className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Dhan</label>
                      <input
                        type="number"
                        min="0"
                        max="3"
                        value={dhanInput}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setDhanInput(val);
                          const total = Math.round((ropaniInput * 5476) + (aanaInput * 342.25) + (paisaInput * 85.5625) + (val * 21.390625));
                          setNewLandArea(total);
                        }}
                        className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                )}

                {newLandUnitId === 2 && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Bigha</label>
                      <input
                        type="number"
                        min="0"
                        value={bighaInput}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setBighaInput(val);
                          const total = Math.round((val * 72900) + (kathaInput * 3645) + (dhurInput * 182.25));
                          setNewLandArea(total);
                        }}
                        className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Katha</label>
                      <input
                        type="number"
                        min="0"
                        max="19"
                        value={kathaInput}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setKathaInput(val);
                          const total = Math.round((bighaInput * 72900) + (val * 3645) + (dhurInput * 182.25));
                          setNewLandArea(total);
                        }}
                        className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Dhur</label>
                      <input
                        type="number"
                        min="0"
                        max="19"
                        value={dhurInput}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setDhurInput(val);
                          const total = Math.round((bighaInput * 72900) + (kathaInput * 3645) + (val * 182.25));
                          setNewLandArea(total);
                        }}
                        className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                )}

                {newLandUnitId === 3 && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Area in Square Feet</label>
                    <input
                      type="number"
                      min="1"
                      value={sqfeetDirectInput}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSqfeetDirectInput(val);
                        setNewLandArea(val);
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                )}

                {newLandUnitId === 4 && (
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Area in Square Metre</label>
                    <input
                      type="number"
                      min="1"
                      value={sqmetreInput}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setSqmetreInput(val);
                        setNewLandArea(Math.round(val * 10.76391));
                      }}
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                )}

                {/* Final Converted Sq. Feet Indicator */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                    Final Save Value (Area Sq. Feet):
                  </span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                    {newLandArea.toLocaleString()} sq.ft
                  </span>
                </div>
              </div>

              {/* Land Rate & Malpot Rate Dropdowns (Filtered with Ward Number) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Land Rate (Filtered by Ward #{newLandWard})
                  </label>
                  <select
                    value={newLandRateId}
                    onChange={(e) => setNewLandRateId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
                  >
                    {masters.landRates
                      .filter((r: any) => !r.ward_no_ids || r.ward_no_ids.split(',').map((w: string) => w.trim()).includes(String(newLandWard)))
                      .map((lr: any) => (
                        <option key={lr.id} value={lr.id}>
                          {lr.rate_name || lr.code} (Rs. {Number(lr.rate_per_unit).toLocaleString()})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Malpot Rate (Filtered by Ward #{newLandWard})
                  </label>
                  <select
                    value={newLandMalpotRateId}
                    onChange={(e) => setNewLandMalpotRateId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[11px]"
                  >
                    {masters.malpotRates
                      .filter((r: any) => !r.ward_no_ids || r.ward_no_ids.split(',').map((w: string) => w.trim()).includes(String(newLandWard)))
                      .map((mr: any) => (
                        <option key={mr.id} value={mr.id}>
                          {mr.rate_name || mr.code} (Rs. {Number(mr.rate_per_unit).toLocaleString()})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Land Nature / Zoning</label>
                <select
                  value={newLandNatureId}
                  onChange={(e) => setNewLandNatureId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  {masters.landNatures.map((n: any) => (
                    <option key={n.id} value={n.id}>{n.fullanme}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewLandModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-colors"
                >
                  Save Land Parcel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. EDIT HOUSE MODAL */}
      {editHouseModalOpen && editingHouse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit House Structure ({editingHouse.house_no})
                </h3>
                <div className="text-[11px] text-slate-500 font-mono">House Structure · ID: {editingHouse.id}</div>
              </div>
              <button onClick={() => setEditHouseModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditHouse} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">House Number (घर नं.)</label>
                <input
                  type="text"
                  required
                  value={editingHouse.house_no || ""}
                  onChange={(e) => setEditingHouse({ ...editingHouse, house_no: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Plinth Area (Sq.Ft)</label>
                  <input
                    type="number"
                    required
                    value={editingHouse.plinth_area || 0}
                    onChange={(e) => setEditingHouse({ ...editingHouse, plinth_area: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Total Built Area (Sq.Ft)</label>
                  <input
                    type="number"
                    required
                    value={editingHouse.area_sqfeet || 0}
                    onChange={(e) => setEditingHouse({ ...editingHouse, area_sqfeet: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Floor Count</label>
                  <input
                    type="number"
                    value={editingHouse.floor_no || 1}
                    onChange={(e) => setEditingHouse({ ...editingHouse, floor_no: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Construction Type</label>
                  <select
                    value={editingHouse.construction_type_id || 1}
                    onChange={(e) => setEditingHouse({ ...editingHouse, construction_type_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {masters.constructionTypes.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.fullanme}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Built Date (BS)</label>
                  <input
                    type="text"
                    value={editingHouse.acquisition_date_bs || ""}
                    onChange={(e) => setEditingHouse({ ...editingHouse, acquisition_date_bs: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Built Date (AD)</label>
                  <input
                    type="text"
                    value={editingHouse.acquisition_date_ad || ""}
                    onChange={(e) => setEditingHouse({ ...editingHouse, acquisition_date_ad: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditHouseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs transition-colors"
                >
                  Save House Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. ADD HOUSE MODAL */}
      {newHouseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add House Structure for {taxpayerDossier?.taxpayer?.fullanme}
                </h3>
                <div className="text-[11px] text-slate-500 font-mono">New House Structure</div>
              </div>
              <button onClick={() => setNewHouseModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHouse} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">House Number (घर नं.)</label>
                <input
                  type="text"
                  required
                  value={newHouseNo}
                  onChange={(e) => setNewHouseNo(e.target.value)}
                  placeholder="e.g. H-301A"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Plinth Area (Sq.Ft)</label>
                  <input
                    type="number"
                    required
                    value={newHousePlinth}
                    onChange={(e) => setNewHousePlinth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Total Built Area (Sq.Ft)</label>
                  <input
                    type="number"
                    required
                    value={newHouseArea}
                    onChange={(e) => setNewHouseArea(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Floor Count</label>
                  <input
                    type="number"
                    value={newHouseFloors}
                    onChange={(e) => setNewHouseFloors(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Construction Type</label>
                  <select
                    value={newHouseConstType}
                    onChange={(e) => setNewHouseConstType(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {masters.constructionTypes.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.fullanme}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewHouseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs transition-colors"
                >
                  Save Building
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. EDIT FLOOR MODAL */}
      {editFloorModalOpen && editingFloor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit Floor Slab #{editingFloor.floor_no}
                </h3>
                <div className="text-[11px] text-slate-500 font-mono">Floor Slab · ID: {editingFloor.id}</div>
              </div>
              <button onClick={() => setEditFloorModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditFloor} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Floor Level (0=Ground)</label>
                  <input
                    type="number"
                    required
                    value={editingFloor.floor_no}
                    onChange={(e) => setEditingFloor({ ...editingFloor, floor_no: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Area (Sq. Feet)</label>
                  <input
                    type="number"
                    required
                    value={editingFloor.area_sqfeet || 0}
                    onChange={(e) => setEditingFloor({ ...editingFloor, area_sqfeet: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Construction Rate</label>
                  <select
                    value={editingFloor.rate_id || 1}
                    onChange={(e) => setEditingFloor({ ...editingFloor, rate_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {masters.constructionRates.map((cr: any) => (
                      <option key={cr.id} value={cr.id}>{cr.fullanme} (Rs. {cr.rate_per_unit}/sqft)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Depreciation %</label>
                  <input
                    type="number"
                    step="any"
                    value={editingFloor.depreciation_percent || 0}
                    onChange={(e) => setEditingFloor({ ...editingFloor, depreciation_percent: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Remarks / Usage</label>
                <input
                  type="text"
                  value={editingFloor.remarks || ""}
                  onChange={(e) => setEditingFloor({ ...editingFloor, remarks: e.target.value })}
                  placeholder="e.g. Ground Floor Commercial / Living Unit"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditFloorModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-colors"
                >
                  Save Floor Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ADD FLOOR MODAL */}
      {newFloorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Add Floor Unit to Building
                </h3>
                <div className="text-[11px] text-slate-500 font-mono">New Floor Slab</div>
              </div>
              <button onClick={() => setNewFloorModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFloor} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Select Building</label>
                  <select
                    value={newFloorHouseId}
                    onChange={(e) => setNewFloorHouseId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {taxpayerDossier?.houses?.map((h: any) => (
                      <option key={h.id} value={h.id}>{h.house_no}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Floor Number</label>
                  <input
                    type="number"
                    required
                    value={newFloorNo}
                    onChange={(e) => setNewFloorNo(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Area (Sq. Feet)</label>
                  <input
                    type="number"
                    required
                    value={newFloorArea}
                    onChange={(e) => setNewFloorArea(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Construction Type</label>
                  <select
                    value={newFloorConstType}
                    onChange={(e) => setNewFloorConstType(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {masters.constructionTypes.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.fullanme}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Construction Date (BS)</label>
                  <input
                    type="text"
                    value={newFloorConstDateBs}
                    onChange={(e) => setNewFloorConstDateBs(e.target.value)}
                    placeholder="e.g. 2080-02-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Construction Date (AD)</label>
                  <input
                    type="text"
                    value={newFloorConstDateAd}
                    onChange={(e) => setNewFloorConstDateAd(e.target.value)}
                    placeholder="e.g. 2023-05-15"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Construction Rate</label>
                  <select
                    value={newFloorRateId}
                    onChange={(e) => setNewFloorRateId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {masters.constructionRates.map((cr: any) => (
                      <option key={cr.id} value={cr.id}>{cr.fullanme} (Rs. {cr.rate_per_unit}/sqft)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Measuring Unit</label>
                  <select
                    value={newFloorUnitId}
                    onChange={(e) => setNewFloorUnitId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    {masters.units.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.fullanme}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Depreciation %</label>
                  <input
                    type="number"
                    step="any"
                    value={newFloorDepreciation}
                    onChange={(e) => setNewFloorDepreciation(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Remarks</label>
                  <input
                    type="text"
                    value={newFloorRemarks}
                    onChange={(e) => setNewFloorRemarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewFloorModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-colors"
                >
                  Save Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. EDIT TAXPAYER MODAL */}
      {editTaxpayerModalOpen && editingTaxpayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Edit Taxpayer Master ({editingTaxpayer.code})
                </h3>
                <div className="text-[11px] text-slate-500 font-mono">Taxpayer Master · ID: {editingTaxpayer.id}</div>
              </div>
              <button onClick={() => setEditTaxpayerModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTaxpayer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Full Name (पूरा नाम)</label>
                <input
                  type="text"
                  required
                  value={editingTaxpayer.fullanme || ""}
                  onChange={(e) => setEditingTaxpayer({ ...editingTaxpayer, fullanme: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={editingTaxpayer.mobile_no || ""}
                    onChange={(e) => setEditingTaxpayer({ ...editingTaxpayer, mobile_no: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Ward Number</label>
                  <input
                    type="number"
                    value={editingTaxpayer.ward_no || 1}
                    onChange={(e) => setEditingTaxpayer({ ...editingTaxpayer, ward_no: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">PAN / VAT</label>
                  <input
                    type="text"
                    value={editingTaxpayer.pan_vat_no || ""}
                    onChange={(e) => setEditingTaxpayer({ ...editingTaxpayer, pan_vat_no: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Citizenship No</label>
                  <input
                    type="text"
                    value={editingTaxpayer.citizenship_no || ""}
                    onChange={(e) => setEditingTaxpayer({ ...editingTaxpayer, citizenship_no: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={editingTaxpayer.email || ""}
                  onChange={(e) => setEditingTaxpayer({ ...editingTaxpayer, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditTaxpayerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-colors"
                >
                  Save Taxpayer Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. ADD TAXPAYER MODAL */}
      {newTpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Register New Taxpayer Master
                </h3>
                <div className="text-[11px] text-slate-500 font-mono">New Taxpayer Record</div>
              </div>
              <button onClick={() => setNewTpModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTaxpayer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Full Name (पूरा नाम)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar Adhikari (रमेश कुमार अधिकारी)"
                  value={newTpName}
                  onChange={(e) => setNewTpName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={newTpMobile}
                    onChange={(e) => setNewTpMobile(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Ward Number</label>
                  <input
                    type="number"
                    value={newTpWard}
                    onChange={(e) => setNewTpWard(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">PAN / VAT</label>
                  <input
                    type="text"
                    value={newTpPan}
                    onChange={(e) => setNewTpPan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Citizenship No</label>
                  <input
                    type="text"
                    value={newTpCitizenship}
                    onChange={(e) => setNewTpCitizenship(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={newTpEmail}
                  onChange={(e) => setNewTpEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewTpModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-colors"
                >
                  Register Taxpayer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
