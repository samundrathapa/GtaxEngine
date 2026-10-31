import { AuditFields } from "../BaseFrame/repo/BaseRepo.ts";
import { ApiResponse, IApiResponse } from "../BaseFrame/response/ApiResponse.ts";
import { generateFiscalYears2021To2086 } from "../db/fiscalYearSeeds.ts";

export interface TblFiscalYear extends AuditFields {
  id: number;
  code: string;
  fullname: string;
  date_from_bs: string;
  date_from_ad: string;
  date_to_ad: string;
  date_to_bs: string;
  is_deleted: boolean;
}

export interface TblUnit extends AuditFields {
  id: number;
  code: string;
  fullanme: string;
  unit_value: number; // Conversion ratio to sq.ft
  is_deleted: boolean;
}

export interface TblLandNature extends AuditFields {
  id: number;
  code: string;
  fullanme: string;
  is_deleted: boolean;
}

export interface TblConstructionType extends AuditFields {
  id: number;
  code: string;
  fullanme: string;
  is_deleted: boolean;
}

export interface TblLandRate extends AuditFields {
  id: number;
  code: string;
  fullanme: string;
  rate_name?: string;
  fiscal_year_id: number;
  is_parent: boolean;
  parent_id: number | null;
  unit_id: number;
  rate_per_unit: number;
  area_upto: number;
  area_per_unit: number;
  ward_no_ids: string;
  is_deleted: boolean;
}

export interface TblMalpotRate extends AuditFields {
  id: number;
  code: string;
  fullanme: string;
  rate_name?: string;
  fiscal_year_id: number;
  is_parent: boolean;
  parent_id: number | null;
  unit_id: number;
  rate_per_unit: number;
  area_upto: number;
  area_per_unit: number;
  ward_no_ids: string;
  is_deleted: boolean;
}

export interface TblConstructionRate extends AuditFields {
  id: number;
  code: string;
  fullanme: string;
  rate_name?: string;
  fiscal_year_id: number;
  is_parent: boolean;
  parent_id: number | null;
  const_type_id: number;
  unit_id: number;
  rate_per_unit: number;
  area_upto: number;
  area_per_unit: number;
  ward_no_ids: string;
  is_deleted: boolean;
}

export interface TblDepreciation extends AuditFields {
  id: number;
  code: string;
  fullanme: string;
  fiscal_year_id: number;
  construction_type_id?: number;
  construction_type?: string;
  is_parent: boolean;
  parent_id: number | null;
  sn: number;
  year_from: number;
  year_to: number;
  percent: number;
  is_deleted: boolean;
}

export interface TblFineRebate extends AuditFields {
  id: number;
  fiscal_year_id: number;
  tax_type_id: number;
  ratesn: number;
  years: number;
  month: number;
  months?: number;
  calcpercent: number;
  ratepercent: number;
  rate_percent?: number;
  flatrate: number;
  flat_rate?: number;
  isfine: boolean;
  is_fine?: boolean;
  days: number;
  is_deleted: boolean;
}

export interface TblPropertyRange extends AuditFields {
  id: number;
  FiscalYearId: number;
  fiscal_year_id?: number;
  Sn: number;
  sn?: number;
  value_from: number;
  ValueFrom?: number;
  value_to: number;
  ValueTo?: number;
  is_percent: boolean;
  IsPercent?: boolean;
  tax_percent: number;
  TaxPercent?: number;
  amount_from: number;
  AmountFrom?: number;
  amount_to: number;
  AmountTo?: number;
  above_then: number;
  AboveThen?: number;
  min_tax_amount: number;
  MinimumTaxAmount?: number;
  per_unit_amount: number;
  PerUnitAmount?: number;
  per_unit_rate: number;
  PerUnitRate?: number;
  is_cumuliatative: boolean;
  IsCumulative?: boolean;
  is_deleted: boolean;
}

export interface TblTaxpayerMaster extends AuditFields {
  id: number;
  code: string;
  fullanme: string;
  mobile_no: string;
  tax_type_id: number;
  email: string;
  ward_no: number;
  pan_vat_no?: string;
  citizenship_no?: string;
  is_deleted: boolean;
}

export interface TblLand extends AuditFields {
  id: number;
  taxpayer_id: number;
  kitta_number: string;
  moth_number: string;
  ward_no: number;
  area_sqfeet: number;
  unit_id?: number;
  land_measuring_unit_id: number;
  nature_id: number;
  land_rate_id: number;
  malpot_rate_id: number;
  acquisition_fy_id?: number;
  include_in_evaluation: boolean;
  assessed_valuation: number;
  is_deleted: boolean;
}

export interface TblHouse extends AuditFields {
  id: number;
  taxpayer_id: number;
  land_id: number | null;
  secondary_land_id?: number | null;
  kitta_numbers?: string;
  land_ids?: number[];
  house_no: string;
  area_sqfeet: number;
  acquisition_date_bs: string;
  acquisition_date_ad: string;
  plinth_area: number;
  floor_no: number;
  include_in_evaluation: boolean;
  measuring_unit_id: number;
  unit_id?: number;
  construction_type_id: number;
  assessed_valuation: number;
  is_deleted: boolean;
}

export interface TblFloor extends AuditFields {
  id: number;
  house_id: number;
  floor_no: number;
  construction_date_ad: string;
  construction_date_bs: string;
  construction_type_id: number;
  area_sqfeet: number;
  include_in_evaluation: boolean;
  rate_id: number;
  remarks: string;
  measuring_unit_id: number;
  unit_id?: number;
  depreciation_percent: number;
  floor_assessed_valuation: number;
  is_deleted: boolean;
}

// Calculation Database Tables
export interface CalcMaster {
  id: number;
  taxpayer_id: number;
  fiscal_year_id: number;
  total_tax: number;
  calculate_date_bs: string;
  insert_by: number | string;
  insert_on: string;
  update_by?: number | string | null;
  update_on?: string | null;
  is_deleted?: boolean;
}

export interface CalcLand {
  id: number;
  calc_master_id: number;
  taxpayer_id: number;
  fiscal_year_id: number;
  land_id: number;
  unit_id: number;
  area_sqft: number;
  calculated_amount: number;
  calculated_add_amount: number;
  calculated_subtract_amount: number;
  calculated_total_amount: number;
  self_declared_amount: number;
  total_amount: number;
  is_deleted?: boolean;
}

export interface CalcHouse {
  id: number;
  calc_master_id: number;
  taxpayer_id: number;
  fiscal_year_id: number;
  house_id: number;
  area_sqft: number;
  unit_id: number;
  depreciation_rate: number;
  calculated_amount: number;
  depreciation_amount: number;
  calculated_add_amount: number;
  calculated_subtract_amount: number;
  calculated_total_amount: number;
  self_declared_amount: number;
  total_amount: number;
  is_deleted?: boolean;
}

export interface CalcFloor {
  id: number;
  calc_master_id: number;
  taxpayer_id: number;
  fiscal_year_id: number;
  floor_id: number;
  area_in_sqft: number;
  depreciation_rate: number;
  calculated_amount: number;
  depreciation_amount: number;
  calculated_add_amount: number;
  calculated_subtract_amount: number;
  calculated_total_amount: number;
  self_declared_amount: number;
  total_amount: number;
  is_deleted?: boolean;
}

export interface CalcAdditional {
  id: number;
  calc_master_id: number;
  taxpayer_id: number;
  fiscal_year_id: number;
  collection_rate_id: number;
  amount: number;
  flatamount: number;
  percent: number;
  is_deleted?: boolean;
}

export interface MultiYearCalculationItem {
  fiscalYearId: number;
  fiscalYearCode: string;
  fiscalYearName: string;
  bsYear: number;
  status: "arrears" | "current" | "advance";
  landValuation: number;
  houseValuation: number;
  totalValuation: number;
  taxSlabPercent: number;
  baseTaxLiability: number;
  finePercent: number;
  fineAmount: number;
  rebatePercent: number;
  rebateAmount: number;
  netPayableYearTax: number;
  cumulativeRunningTotal: number;
  evaluatedLands: {
    id: number;
    kitta_number: string;
    area_sqfeet: number;
    unit_name: string;
    rate_per_unit: number;
    assessed_valuation: number;
  }[];
  evaluatedFloors: {
    id: number;
    house_id: number;
    house_no: string;
    floor_no: number;
    area_sqfeet: number;
    rate_per_unit: number;
    age_in_years: number;
    depreciation_percent: number;
    assessed_valuation: number;
  }[];
}

export interface MultiYearCalculationResult {
  taxpayer: TblTaxpayerMaster;
  fromFiscalYear: TblFiscalYear;
  toFiscalYear: TblFiscalYear;
  scope: "all" | "land" | "house";
  targetPropertyDescription: string;
  totalBaseTaxSum: number;
  totalFinesAccrued: number;
  totalRebatesDeducted: number;
  netGrandTotalPayable: number;
  yearsCount: number;
  yearlyBreakdowns: MultiYearCalculationItem[];
  generatedAt: string;
  generatedBy: string;
}

export interface TblCompany extends AuditFields {
  id: number;
  code: string;
  fullname: string;
  address: string;
  phone: string;
  email: string;
  pan_vat_no: string;
  registration_no: string;
  is_active: boolean;
  is_deleted: boolean;
}

export interface TblApplicationSetting extends AuditFields {
  id: number;
  company_id: number;
  fiscal_year_id: number;
  unit_type_id: number;
  bhumikar_start_fy?: number;
  prop_bhumikar_start_fy?: number;
  ipt_start_fy?: number;
  municipality_name?: string;
  ward_count?: number;
  theme_preference?: string;
  default_language?: string;
  is_deleted: boolean;
}

class TaxpayerPropertyDatabase {
  public fiscalYears: Map<number, TblFiscalYear> = new Map();
  public units: Map<number, TblUnit> = new Map();
  public landNatures: Map<number, TblLandNature> = new Map();
  public constructionTypes: Map<number, TblConstructionType> = new Map();
  public landRates: Map<number, TblLandRate> = new Map();
  public malpotRates: Map<number, TblMalpotRate> = new Map();
  public constructionRates: Map<number, TblConstructionRate> = new Map();
  public depreciations: Map<number, TblDepreciation> = new Map();
  public fineRebates: Map<number, TblFineRebate> = new Map();
  public propertyRanges: Map<number, TblPropertyRange> = new Map();
  public taxpayers: Map<number, TblTaxpayerMaster> = new Map();
  public lands: Map<number, TblLand> = new Map();
  public houses: Map<number, TblHouse> = new Map();
  public floors: Map<number, TblFloor> = new Map();
  public companies: Map<number, TblCompany> = new Map();
  public applicationSettings: Map<number, TblApplicationSetting> = new Map();
  public calcMasters: Map<number, CalcMaster> = new Map();
  public calcLands: Map<number, CalcLand> = new Map();
  public calcHouses: Map<number, CalcHouse> = new Map();
  public calcFloors: Map<number, CalcFloor> = new Map();
  public calcAdditionals: Map<number, CalcAdditional> = new Map();

  private nextId = 100;

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const now = new Date().toISOString();
    const sys = "SYSTEM_SEED";

    // 1. Fiscal Years (Complete official master from year 2021 to 2086 BS)
    const seedFys = generateFiscalYears2021To2086();
    for (const fy of seedFys) {
      this.fiscalYears.set(fy.id, {
        id: fy.id,
        code: fy.code,
        fullname: fy.fullname,
        date_from_bs: fy.date_from_bs,
        date_from_ad: fy.date_from_ad,
        date_to_ad: fy.date_to_ad,
        date_to_bs: fy.date_to_bs,
        is_deleted: false,
        insert_by: sys,
        insert_on: now,
        update_by: sys,
        update_on: now,
        delete_by: null,
        deleted_on: null,
        is_active: true
      });
    }

    // 2. Measuring Units
    const defaultUnits: { id: number; code: string; name: string; val: number }[] = [
      { id: 1, code: "SQFT", name: "Square Feet (वर्गफुट)", val: 1.0 },
      { id: 2, code: "ROPANI", name: "Ropani (रोपनी)", val: 5476.0 },
      { id: 3, code: "AANA", name: "Aana (आना)", val: 342.25 },
      { id: 4, code: "KATTHA", name: "Kattha (कठ्ठा)", val: 3645.0 },
      { id: 5, code: "BIGHA", name: "Bigha (बीघा)", val: 72900.0 }
    ];

    defaultUnits.forEach((u) => {
      this.units.set(u.id, {
        id: u.id,
        code: u.code,
        fullanme: u.name,
        unit_value: u.val,
        is_deleted: false,
        insert_by: sys,
        insert_on: now,
        update_by: sys,
        update_on: now,
        delete_by: null,
        deleted_on: null,
        is_active: true
      });
    });

    // 3. Construction Types
    const defaultConst: { id: number; code: string; name: string }[] = [
      { id: 1, code: "RCC", name: "R.C.C. Frame Structure (पक्की ढलान)" },
      { id: 2, code: "BRICK_CEMENT", name: "Brick Masonry with Cement (इँटा-सिमेन्ट गारो)" },
      { id: 3, code: "MUD_BRICK", name: "Mud Mortar & Traditional (माटो-इँटा कच्ची)" },
      { id: 4, code: "STEEL_TRUSS", name: "Prefab / Steel Structure (ट्रस / प्रिफ्याब)" }
    ];

    defaultConst.forEach((c) => {
      this.constructionTypes.set(c.id, {
        id: c.id,
        code: c.code,
        fullanme: c.name,
        is_deleted: false,
        insert_by: sys,
        insert_on: now,
        update_by: sys,
        update_on: now,
        delete_by: null,
        deleted_on: null,
        is_active: true
      });
    });

    // 4. Land Natures
    const defaultNatures: { id: number; code: string; name: string }[] = [
      { id: 1, code: "RESIDENTIAL", name: "Residential (आवासीय क्षेत्र)" },
      { id: 2, code: "COMMERCIAL", name: "Commercial High-Street (व्यापारिक क्षेत्र)" },
      { id: 3, code: "AGRICULTURAL", name: "Agricultural (कृषि प्रयोजन)" },
      { id: 4, code: "HIGHWAY", name: "Highway Facing (राजमार्गसँग जोडिएको)" }
    ];

    defaultNatures.forEach((n) => {
      this.landNatures.set(n.id, {
        id: n.id,
        code: n.code,
        fullanme: n.name,
        is_deleted: false,
        insert_by: sys,
        insert_on: now,
        update_by: sys,
        update_on: now,
        delete_by: null,
        deleted_on: null,
        is_active: true
      });
    });

    // 5. Land Rates
    this.landRates.set(1, {
      id: 1,
      code: "LR-WARD-1-COMM",
      fullanme: "Ward 1 Main Commercial Avenue Rate",
      fiscal_year_id: 2,
      is_parent: true,
      parent_id: null,
      unit_id: 3, // Aana
      rate_per_unit: 1500000.0,
      area_upto: 10.0,
      area_per_unit: 1.0,
      ward_no_ids: "1,2",
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    });

    this.landRates.set(2, {
      id: 2,
      code: "LR-WARD-3-RES",
      fullanme: "Ward 3 Residential Colony Rate",
      fiscal_year_id: 2,
      is_parent: true,
      parent_id: null,
      unit_id: 3, // Aana
      rate_per_unit: 800000.0,
      area_upto: 20.0,
      area_per_unit: 1.0,
      ward_no_ids: "3,4,5",
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    });

    // 6. Malpot Rates
    this.malpotRates.set(1, {
      id: 1,
      code: "MP-GOV-WARD-1",
      fullanme: "Malpot Statutory Valuation Rate Ward 1",
      fiscal_year_id: 2,
      is_parent: true,
      parent_id: null,
      unit_id: 3, // Aana
      rate_per_unit: 1200000.0,
      area_upto: 10.0,
      area_per_unit: 1.0,
      ward_no_ids: "1,2",
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    });

    // 7. Construction Rates
    this.constructionRates.set(1, {
      id: 1,
      code: "CR-RCC-STD",
      fullanme: "RCC Building Standard Rate per Sq.Ft",
      fiscal_year_id: 2,
      is_parent: true,
      parent_id: null,
      const_type_id: 1,
      unit_id: 1, // Sq.Ft
      rate_per_unit: 2800.0,
      area_upto: 5000.0,
      area_per_unit: 1.0,
      ward_no_ids: "1,2,3,4,5",
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    });

    // 8. Depreciation
    this.depreciations.set(1, {
      id: 1,
      code: "DEP-0-5",
      fullanme: "Structure 0 to 5 Years Old",
      fiscal_year_id: 2,
      is_parent: false,
      parent_id: null,
      sn: 1,
      year_from: 0,
      year_to: 5,
      percent: 5.0,
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    });

    this.depreciations.set(2, {
      id: 2,
      code: "DEP-6-15",
      fullanme: "Structure 6 to 15 Years Old",
      fiscal_year_id: 2,
      is_parent: false,
      parent_id: null,
      sn: 2,
      year_from: 6,
      year_to: 15,
      percent: 15.0,
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    });

    // 9. Fine & Rebate
    this.fineRebates.set(1, {
      id: 1,
      fiscal_year_id: 2,
      tax_type_id: 1,
      ratesn: 1,
      years: 0,
      month: 3,
      calcpercent: 10.0,
      ratepercent: 10.0,
      flatrate: 0.0,
      isfine: false, // Rebate for early payment within 3 months
      days: 90,
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    });

    // 9.1 Seed Property Range (tbl_property_range)
    const propertyRangesSeed = [
      { id: 1, FiscalYearId: 2, Sn: 1, value_from: 0, value_to: 1000000, is_percent: true, tax_percent: 0.05, amount_from: 0, amount_to: 500, above_then: 0, min_tax_amount: 300, per_unit_amount: 0, per_unit_rate: 0, is_cumuliatative: false },
      { id: 2, FiscalYearId: 2, Sn: 2, value_from: 1000001, value_to: 5000000, is_percent: true, tax_percent: 0.10, amount_from: 500, amount_to: 5000, above_then: 1000000, min_tax_amount: 500, per_unit_amount: 0, per_unit_rate: 0, is_cumuliatative: false },
      { id: 3, FiscalYearId: 2, Sn: 3, value_from: 5000001, value_to: 10000000, is_percent: true, tax_percent: 0.15, amount_from: 5000, amount_to: 15000, above_then: 5000000, min_tax_amount: 5000, per_unit_amount: 0, per_unit_rate: 0, is_cumuliatative: false },
      { id: 4, FiscalYearId: 2, Sn: 4, value_from: 10000001, value_to: 0, is_percent: true, tax_percent: 0.20, amount_from: 15000, amount_to: 0, above_then: 10000000, min_tax_amount: 15000, per_unit_amount: 0, per_unit_rate: 0, is_cumuliatative: false },
      { id: 5, FiscalYearId: 1, Sn: 1, value_from: 0, value_to: 2000000, is_percent: true, tax_percent: 0.05, amount_from: 0, amount_to: 1000, above_then: 0, min_tax_amount: 300, per_unit_amount: 0, per_unit_rate: 0, is_cumuliatative: false },
      { id: 6, FiscalYearId: 1, Sn: 2, value_from: 2000001, value_to: 0, is_percent: true, tax_percent: 0.15, amount_from: 1000, amount_to: 0, above_then: 2000000, min_tax_amount: 1000, per_unit_amount: 0, per_unit_rate: 0, is_cumuliatative: false }
    ];

    propertyRangesSeed.forEach((pr) => {
      this.propertyRanges.set(pr.id, {
        ...pr,
        fiscal_year_id: pr.FiscalYearId,
        sn: pr.Sn,
        ValueFrom: pr.value_from,
        ValueTo: pr.value_to,
        IsPercent: pr.is_percent,
        TaxPercent: pr.tax_percent,
        AmountFrom: pr.amount_from,
        AmountTo: pr.amount_to,
        AboveThen: pr.above_then,
        MinimumTaxAmount: pr.min_tax_amount,
        PerUnitAmount: pr.per_unit_amount,
        PerUnitRate: pr.per_unit_rate,
        IsCumulative: pr.is_cumuliatative,
        is_deleted: false,
        insert_by: sys,
        insert_on: now,
        update_by: sys,
        update_on: now,
        delete_by: null,
        deleted_on: null,
        is_active: true
      });
    });

    // 10. Sample Taxpayer
    const tp1: TblTaxpayerMaster = {
      id: 1,
      code: "TP-2081-0001",
      fullanme: "Ram Bahadur Thapa (राम बहादुर थापा)",
      mobile_no: "9841234567",
      tax_type_id: 1,
      email: "ram.thapa@gmail.com",
      ward_no: 3,
      pan_vat_no: "600123456",
      citizenship_no: "27-01-70-12345",
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.taxpayers.set(1, tp1);

    // 11. Sample Land Parcel
    const land1: TblLand = {
      id: 1,
      taxpayer_id: 1,
      kitta_number: "२४९ (249)",
      moth_number: "८१ (81)",
      ward_no: 1,
      area_sqfeet: 1369.0, // approx 4 aana
      include_in_evaluation: true,
      land_measuring_unit_id: 3, // Aana
      nature_id: 1, // Residential
      land_rate_id: 2, // 800,000 per aana -> valuation = 3,200,000
      malpot_rate_id: 1,
      assessed_valuation: 3200000.0,
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.lands.set(1, land1);

    // 12. Sample House
    const house1: TblHouse = {
      id: 1,
      taxpayer_id: 1,
      land_id: 1,
      house_no: "घर नं. १२-क (H-12A)",
      area_sqfeet: 2200.0,
      acquisition_date_bs: "2076-02-15",
      acquisition_date_ad: "2019-05-29",
      plinth_area: 1100.0,
      floor_no: 2,
      include_in_evaluation: true,
      measuring_unit_id: 1, // Sq.Ft
      construction_type_id: 1, // RCC Frame
      assessed_valuation: 5852000.0,
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.houses.set(1, house1);

    // 13. Sample Floors
    this.floors.set(1, {
      id: 1,
      house_id: 1,
      floor_no: 0, // Ground Floor
      construction_date_ad: "2019-05-29",
      construction_date_bs: "2076-02-15",
      construction_type_id: 1,
      area_sqfeet: 1100.0,
      include_in_evaluation: true,
      rate_id: 1,
      remarks: "Ground Floor Residential & Parking",
      measuring_unit_id: 1,
      depreciation_percent: 5.0,
      floor_assessed_valuation: 2926000.0,
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    });

    this.floors.set(2, {
      id: 2,
      house_id: 1,
      floor_no: 1, // First Floor
      construction_date_ad: "2019-05-29",
      construction_date_bs: "2076-02-15",
      construction_type_id: 1,
      area_sqfeet: 1100.0,
      include_in_evaluation: true,
      rate_id: 1,
      remarks: "First Floor Living Unit",
      measuring_unit_id: 1,
      depreciation_percent: 5.0,
      floor_assessed_valuation: 2926000.0,
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    });

    // 14. Additional Seed Taxpayers for Global Search & Multi-Year Evaluation
    const tp2: TblTaxpayerMaster = {
      id: 2,
      code: "TP-2081-0002",
      fullanme: "Sita Maya Shrestha (सीता माया श्रेष्ठ)",
      mobile_no: "9851098765",
      tax_type_id: 1,
      email: "sita.shrestha@gmail.com",
      ward_no: 4,
      pan_vat_no: "600987654",
      citizenship_no: "27-01-72-98765",
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.taxpayers.set(2, tp2);

    const land2: TblLand = {
      id: 2,
      taxpayer_id: 2,
      kitta_number: "३५० (350)",
      moth_number: "१४ (14)",
      ward_no: 3,
      area_sqfeet: 2738.0, // approx 8 aana
      include_in_evaluation: true,
      land_measuring_unit_id: 3,
      nature_id: 1,
      land_rate_id: 2, // 800,000 per aana -> valuation = 6,400,000
      malpot_rate_id: 1,
      assessed_valuation: 6400000.0,
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.lands.set(2, land2);

    const house2: TblHouse = {
      id: 2,
      taxpayer_id: 2,
      land_id: 2,
      house_no: "घर नं. ४५-ख (H-45B)",
      area_sqfeet: 1800.0,
      acquisition_date_bs: "2074-08-10",
      acquisition_date_ad: "2017-11-26",
      plinth_area: 900.0,
      floor_no: 2,
      include_in_evaluation: true,
      measuring_unit_id: 1,
      construction_type_id: 1,
      assessed_valuation: 4536000.0,
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.houses.set(2, house2);

    this.floors.set(3, {
      id: 3,
      house_id: 2,
      floor_no: 0,
      construction_date_ad: "2017-11-26",
      construction_date_bs: "2074-08-10",
      construction_type_id: 1,
      area_sqfeet: 900.0,
      include_in_evaluation: true,
      rate_id: 1,
      remarks: "Ground Floor Residence",
      measuring_unit_id: 1,
      depreciation_percent: 10.0,
      floor_assessed_valuation: 2268000.0,
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    });

    const tp3: TblTaxpayerMaster = {
      id: 3,
      code: "TP-2081-0003",
      fullanme: "Himalayan Trading Syndicate Ltd",
      mobile_no: "9801122334",
      tax_type_id: 2,
      email: "accounts@himalayantrading.com.np",
      ward_no: 1,
      pan_vat_no: "300554433",
      citizenship_no: "CO-REG-9871",
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.taxpayers.set(3, tp3);

    const land3: TblLand = {
      id: 3,
      taxpayer_id: 3,
      kitta_number: "५१२ (512)",
      moth_number: "९९ (99)",
      ward_no: 1,
      area_sqfeet: 1711.25, // 5 aana
      include_in_evaluation: true,
      land_measuring_unit_id: 3,
      nature_id: 2, // Commercial
      land_rate_id: 1, // 1,500,000 per aana -> valuation = 7,500,000
      malpot_rate_id: 1,
      assessed_valuation: 7500000.0,
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.lands.set(3, land3);

    const tp4: TblTaxpayerMaster = {
      id: 4,
      code: "TP-2081-0004",
      fullanme: "Bishnu Maya Shrestha (विष्णु माया श्रेष्ठ)",
      mobile_no: "+977-9803456789",
      tax_type_id: 1,
      email: "bishnu.shrestha@gmail.com",
      ward_no: 2,
      pan_vat_no: "601928475",
      citizenship_no: "22-04-75-00432",
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.taxpayers.set(4, tp4);

    const land4: TblLand = {
      id: 4,
      taxpayer_id: 4,
      kitta_number: "१०८ (108)",
      moth_number: "०५ (05)",
      ward_no: 2,
      area_sqfeet: 1026.75, // 3 aana
      include_in_evaluation: true,
      land_measuring_unit_id: 3,
      nature_id: 1,
      land_rate_id: 2,
      malpot_rate_id: 1,
      assessed_valuation: 2400000.0,
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.lands.set(4, land4);

    // 15. Companies (tbl_company - all users reference company_id)
    this.companies.set(1, {
      id: 1,
      code: "KMC-01",
      fullname: "Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)",
      address: "Bagmati Province, Kathmandu Ward No. 3",
      phone: "+977-01-4231481",
      email: "info@kathmandu.gov.np",
      pan_vat_no: "300019284",
      registration_no: "NAGAR-2032-001",
      is_active: true,
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null
    });

    this.companies.set(2, {
      id: 2,
      code: "LMC-02",
      fullname: "Lalitpur Metropolitan City (ललितपुर महानगरपालिका)",
      address: "Pulchowk, Lalitpur Ward No. 3",
      phone: "+977-01-5521260",
      email: "info@lalitpur.gov.np",
      pan_vat_no: "300054321",
      registration_no: "NAGAR-2035-002",
      is_active: true,
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null
    });

    // 16. Application Settings (tbl_appication_setting)
    this.applicationSettings.set(1, {
      id: 1,
      company_id: 1,
      fiscal_year_id: 2,
      unit_type_id: 3,
      municipality_name: "Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)",
      ward_count: 32,
      theme_preference: "slate",
      default_language: "eng",
      is_deleted: false,
      insert_by: sys,
      insert_on: now,
      update_by: sys,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    });

    // 17. Seed Initial Calculation Master & Breakdown Tables
    this.calcMasters.set(1, {
      id: 1,
      taxpayer_id: 1,
      fiscal_year_id: 2,
      total_tax: 16420,
      calculate_date_bs: "2081-05-15",
      insert_by: 1,
      insert_on: now,
      update_by: null,
      update_on: null,
      is_deleted: false
    });

    this.calcLands.set(1, {
      id: 1,
      calc_master_id: 1,
      taxpayer_id: 1,
      fiscal_year_id: 2,
      land_id: 1,
      unit_id: 3, // Aana
      area_sqft: 1369.0,
      calculated_amount: 3200000.0,
      calculated_add_amount: 0,
      calculated_subtract_amount: 0,
      calculated_total_amount: 3200000.0,
      self_declared_amount: 3200000.0,
      total_amount: 3200000.0,
      is_deleted: false
    });

    this.calcHouses.set(1, {
      id: 1,
      calc_master_id: 1,
      taxpayer_id: 1,
      fiscal_year_id: 2,
      house_id: 1,
      area_sqft: 2200.0,
      unit_id: 1,
      depreciation_rate: 5.0,
      calculated_amount: 6160000.0,
      depreciation_amount: 308000.0,
      calculated_add_amount: 0,
      calculated_subtract_amount: 0,
      calculated_total_amount: 5852000.0,
      self_declared_amount: 5852000.0,
      total_amount: 5852000.0,
      is_deleted: false
    });

    this.calcFloors.set(1, {
      id: 1,
      calc_master_id: 1,
      taxpayer_id: 1,
      fiscal_year_id: 2,
      floor_id: 1,
      area_in_sqft: 1100.0,
      depreciation_rate: 5.0,
      calculated_amount: 3080000.0,
      depreciation_amount: 154000.0,
      calculated_add_amount: 0,
      calculated_subtract_amount: 0,
      calculated_total_amount: 2926000.0,
      self_declared_amount: 2926000.0,
      total_amount: 2926000.0,
      is_deleted: false
    });

    this.calcFloors.set(2, {
      id: 2,
      calc_master_id: 1,
      taxpayer_id: 1,
      fiscal_year_id: 2,
      floor_id: 2,
      area_in_sqft: 1100.0,
      depreciation_rate: 5.0,
      calculated_amount: 3080000.0,
      depreciation_amount: 154000.0,
      calculated_add_amount: 0,
      calculated_subtract_amount: 0,
      calculated_total_amount: 2926000.0,
      self_declared_amount: 2926000.0,
      total_amount: 2926000.0,
      is_deleted: false
    });

    this.calcAdditionals.set(1, {
      id: 1,
      calc_master_id: 1,
      taxpayer_id: 1,
      fiscal_year_id: 2,
      collection_rate_id: 1,
      amount: 500,
      flatamount: 500,
      percent: 0,
      is_deleted: false
    });
  }

  public getCompanies() {
    return Array.from(this.companies.values()).filter((c) => !c.is_deleted && c.is_active);
  }

  public getApplicationSettings() {
    return Array.from(this.applicationSettings.values()).filter((s) => !s.is_deleted);
  }

  public saveCompany(data: Partial<TblCompany>, id?: number, user: string = "OPERATOR"): TblCompany {
    const now = new Date().toISOString();
    if (id && this.companies.has(id)) {
      const existing = this.companies.get(id)!;
      const updated: TblCompany = {
        ...existing,
        ...data,
        id,
        update_by: user,
        update_on: now
      };
      this.companies.set(id, updated);
      return updated;
    }
    const newId = id || this.nextId++;
    const newItem: TblCompany = {
      id: newId,
      code: data.code || `COMP-${newId}`,
      fullname: data.fullname || "New Municipality Entity",
      address: data.address || "",
      phone: data.phone || "",
      email: data.email || "",
      pan_vat_no: data.pan_vat_no || "",
      registration_no: data.registration_no || "",
      is_active: true,
      is_deleted: false,
      insert_by: user,
      insert_on: now,
      update_by: user,
      update_on: now,
      delete_by: null,
      deleted_on: null
    };
    this.companies.set(newId, newItem);
    return newItem;
  }

  public updateApplicationSetting(data: Partial<TblApplicationSetting>, user: string = "OPERATOR"): TblApplicationSetting {
    const now = new Date().toISOString();
    const existing = this.applicationSettings.get(1) || {
      id: 1,
      company_id: 1,
      fiscal_year_id: 2,
      unit_type_id: 3,
      is_deleted: false,
      insert_by: user,
      insert_on: now,
      update_by: user,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    const updated: TblApplicationSetting = {
      ...existing,
      ...data,
      id: 1,
      update_by: user,
      update_on: now
    };
    this.applicationSettings.set(1, updated);
    return updated;
  }

  public getCalculationHistory(taxpayerId?: number, fiscalYearId?: number) {
    let list = Array.from(this.calcMasters.values()).filter((c) => !c.is_deleted);
    if (taxpayerId) {
      list = list.filter((c) => c.taxpayer_id === Number(taxpayerId));
    }
    if (fiscalYearId) {
      list = list.filter((c) => c.fiscal_year_id === Number(fiscalYearId));
    }
    return list.map((m) => {
      const tp = this.taxpayers.get(m.taxpayer_id);
      const fy = this.fiscalYears.get(m.fiscal_year_id);
      const lands = Array.from(this.calcLands.values()).filter((l) => l.calc_master_id === m.id && !l.is_deleted);
      const houses = Array.from(this.calcHouses.values()).filter((h) => h.calc_master_id === m.id && !h.is_deleted);
      const floors = Array.from(this.calcFloors.values()).filter((fl) => fl.calc_master_id === m.id && !fl.is_deleted);
      const additionals = Array.from(this.calcAdditionals.values()).filter((a) => a.calc_master_id === m.id && !a.is_deleted);
      return {
        ...m,
        taxpayer_name: tp?.fullanme || `Taxpayer #${m.taxpayer_id}`,
        taxpayer_code: tp?.code || "",
        fiscal_year_name: fy?.fullname || fy?.code || `FY ${m.fiscal_year_id}`,
        lands_count: lands.length,
        houses_count: houses.length,
        floors_count: floors.length,
        lands,
        houses,
        floors,
        additionals
      };
    }).sort((a, b) => b.id - a.id);
  }

  public getCalculationById(id: number) {
    const m = this.calcMasters.get(id);
    if (!m || m.is_deleted) return null;
    const tp = this.taxpayers.get(m.taxpayer_id);
    const fy = this.fiscalYears.get(m.fiscal_year_id);
    const lands = Array.from(this.calcLands.values()).filter((l) => l.calc_master_id === m.id && !l.is_deleted);
    const houses = Array.from(this.calcHouses.values()).filter((h) => h.calc_master_id === m.id && !h.is_deleted);
    const floors = Array.from(this.calcFloors.values()).filter((fl) => fl.calc_master_id === m.id && !fl.is_deleted);
    const additionals = Array.from(this.calcAdditionals.values()).filter((a) => a.calc_master_id === m.id && !a.is_deleted);
    return {
      master: m,
      taxpayer: tp,
      fiscal_year: fy,
      lands,
      houses,
      floors,
      additionals
    };
  }

  public saveCalculationMaster(data: {
    taxpayer_id: number;
    fiscal_year_id: number;
    total_tax: number;
    calculate_date_bs?: string;
    insert_by?: number | string;
    lands?: Partial<CalcLand>[];
    houses?: Partial<CalcHouse>[];
    floors?: Partial<CalcFloor>[];
    additionals?: Partial<CalcAdditional>[];
  }) {
    const now = new Date().toISOString();
    const masterId = this.nextId++;
    const masterRecord: CalcMaster = {
      id: masterId,
      taxpayer_id: Number(data.taxpayer_id),
      fiscal_year_id: Number(data.fiscal_year_id),
      total_tax: Number(data.total_tax) || 0,
      calculate_date_bs: data.calculate_date_bs || "2081-05-15",
      insert_by: data.insert_by || 1,
      insert_on: now,
      update_by: null,
      update_on: null,
      is_deleted: false
    };
    this.calcMasters.set(masterId, masterRecord);

    const savedLands: CalcLand[] = [];
    if (Array.isArray(data.lands)) {
      for (const l of data.lands) {
        const lid = this.nextId++;
        const item: CalcLand = {
          id: lid,
          calc_master_id: masterId,
          taxpayer_id: masterRecord.taxpayer_id,
          fiscal_year_id: masterRecord.fiscal_year_id,
          land_id: Number(l.land_id) || 0,
          unit_id: Number(l.unit_id) || 1,
          area_sqft: Number(l.area_sqft) || 0,
          calculated_amount: Number(l.calculated_amount) || 0,
          calculated_add_amount: Number(l.calculated_add_amount) || 0,
          calculated_subtract_amount: Number(l.calculated_subtract_amount) || 0,
          calculated_total_amount: Number(l.calculated_total_amount) || 0,
          self_declared_amount: Number(l.self_declared_amount) || Number(l.calculated_total_amount) || 0,
          total_amount: Number(l.total_amount) || 0,
          is_deleted: false
        };
        this.calcLands.set(lid, item);
        savedLands.push(item);
      }
    }

    const savedHouses: CalcHouse[] = [];
    if (Array.isArray(data.houses)) {
      for (const h of data.houses) {
        const hid = this.nextId++;
        const item: CalcHouse = {
          id: hid,
          calc_master_id: masterId,
          taxpayer_id: masterRecord.taxpayer_id,
          fiscal_year_id: masterRecord.fiscal_year_id,
          house_id: Number(h.house_id) || 0,
          area_sqft: Number(h.area_sqft) || 0,
          unit_id: Number(h.unit_id) || 1,
          depreciation_rate: Number(h.depreciation_rate) || 0,
          calculated_amount: Number(h.calculated_amount) || 0,
          depreciation_amount: Number(h.depreciation_amount) || 0,
          calculated_add_amount: Number(h.calculated_add_amount) || 0,
          calculated_subtract_amount: Number(h.calculated_subtract_amount) || 0,
          calculated_total_amount: Number(h.calculated_total_amount) || 0,
          self_declared_amount: Number(h.self_declared_amount) || Number(h.calculated_total_amount) || 0,
          total_amount: Number(h.total_amount) || 0,
          is_deleted: false
        };
        this.calcHouses.set(hid, item);
        savedHouses.push(item);
      }
    }

    const savedFloors: CalcFloor[] = [];
    if (Array.isArray(data.floors)) {
      for (const fl of data.floors) {
        const fid = this.nextId++;
        const item: CalcFloor = {
          id: fid,
          calc_master_id: masterId,
          taxpayer_id: masterRecord.taxpayer_id,
          fiscal_year_id: masterRecord.fiscal_year_id,
          floor_id: Number(fl.floor_id) || 0,
          area_in_sqft: Number(fl.area_in_sqft) || 0,
          depreciation_rate: Number(fl.depreciation_rate) || 0,
          calculated_amount: Number(fl.calculated_amount) || 0,
          depreciation_amount: Number(fl.depreciation_amount) || 0,
          calculated_add_amount: Number(fl.calculated_add_amount) || 0,
          calculated_subtract_amount: Number(fl.calculated_subtract_amount) || 0,
          calculated_total_amount: Number(fl.calculated_total_amount) || 0,
          self_declared_amount: Number(fl.self_declared_amount) || Number(fl.calculated_total_amount) || 0,
          total_amount: Number(fl.total_amount) || 0,
          is_deleted: false
        };
        this.calcFloors.set(fid, item);
        savedFloors.push(item);
      }
    }

    const savedAdditionals: CalcAdditional[] = [];
    if (Array.isArray(data.additionals)) {
      for (const a of data.additionals) {
        const aid = this.nextId++;
        const item: CalcAdditional = {
          id: aid,
          calc_master_id: masterId,
          taxpayer_id: masterRecord.taxpayer_id,
          fiscal_year_id: masterRecord.fiscal_year_id,
          collection_rate_id: Number(a.collection_rate_id) || 1,
          amount: Number(a.amount) || 0,
          flatamount: Number(a.flatamount) || 0,
          percent: Number(a.percent) || 0,
          is_deleted: false
        };
        this.calcAdditionals.set(aid, item);
        savedAdditionals.push(item);
      }
    }

    return {
      master: masterRecord,
      lands: savedLands,
      houses: savedHouses,
      floors: savedFloors,
      additionals: savedAdditionals
    };
  }

  public deleteCalculation(id: number) {
    const m = this.calcMasters.get(id);
    if (!m) return false;
    m.is_deleted = true;
    for (const l of this.calcLands.values()) {
      if (l.calc_master_id === id) l.is_deleted = true;
    }
    for (const h of this.calcHouses.values()) {
      if (h.calc_master_id === id) h.is_deleted = true;
    }
    for (const fl of this.calcFloors.values()) {
      if (fl.calc_master_id === id) fl.is_deleted = true;
    }
    for (const a of this.calcAdditionals.values()) {
      if (a.calc_master_id === id) a.is_deleted = true;
    }
    return true;
  }

  public getFiscalYears() {
    return Array.from(this.fiscalYears.values()).filter((f) => !f.is_deleted && f.is_active);
  }

  public getUnits() {
    return Array.from(this.units.values()).filter((u) => !u.is_deleted && u.is_active);
  }

  public getLandNatures() {
    return Array.from(this.landNatures.values()).filter((n) => !n.is_deleted && n.is_active);
  }

  public getConstructionTypes() {
    return Array.from(this.constructionTypes.values()).filter((c) => !c.is_deleted && c.is_active);
  }

  public getLandRates() {
    return Array.from(this.landRates.values()).filter((r) => !r.is_deleted && r.is_active);
  }

  public getMalpotRates() {
    return Array.from(this.malpotRates.values()).filter((r) => !r.is_deleted && r.is_active);
  }

  public getConstructionRates() {
    return Array.from(this.constructionRates.values()).filter((r) => !r.is_deleted && r.is_active);
  }

  public getDepreciations() {
    return Array.from(this.depreciations.values()).filter((d) => !d.is_deleted && d.is_active);
  }

  public getFineRebates() {
    return Array.from(this.fineRebates.values()).filter((f) => !f.is_deleted && f.is_active);
  }

  public getTaxpayers() {
    return Array.from(this.taxpayers.values()).filter((t) => !t.is_deleted && t.is_active);
  }

  public getTaxpayerCompleteRecord(taxpayerId: number) {
    const tp = this.taxpayers.get(taxpayerId);
    if (!tp || tp.is_deleted) return null;

    const taxpayerLands = Array.from(this.lands.values()).filter(
      (l) => l.taxpayer_id === taxpayerId && !l.is_deleted && l.is_active
    );

    const taxpayerHouses = Array.from(this.houses.values()).filter(
      (h) => h.taxpayer_id === taxpayerId && !h.is_deleted && h.is_active
    );

    const houseIds = new Set(taxpayerHouses.map((h) => h.id));
    const allFloors = Array.from(this.floors.values()).filter(
      (f) => houseIds.has(f.house_id) && !f.is_deleted && f.is_active
    );

    // Calculate aggregated property tax
    let totalLandValuation = 0;
    taxpayerLands.forEach((l) => {
      if (l.include_in_evaluation) {
        totalLandValuation += Number(l.assessed_valuation || 0);
      }
    });

    let totalHouseValuation = 0;
    allFloors.forEach((fl) => {
      if (fl.include_in_evaluation) {
        totalHouseValuation += Number(fl.floor_assessed_valuation || 0);
      }
    });

    const combinedTotalValuation = totalLandValuation + totalHouseValuation;
    
    // Municipal tax slab assessment:
    // e.g. Up to 10 Lakh = 0.01%, 10-50 Lakh = 0.05%, 50 Lakh-1 Crore = 0.1%, above 1 Crore = 0.2%
    let calculatedTaxLiability = 0;
    if (combinedTotalValuation > 10000000) {
      calculatedTaxLiability = combinedTotalValuation * 0.002;
    } else if (combinedTotalValuation > 5000000) {
      calculatedTaxLiability = combinedTotalValuation * 0.001;
    } else {
      calculatedTaxLiability = combinedTotalValuation * 0.0005;
    }

    // Apply 10% early rebate policy if eligible
    const earlyRebateAmount = calculatedTaxLiability * 0.1;
    const netPayableTax = Math.max(0, calculatedTaxLiability - earlyRebateAmount);

    return {
      taxpayer: tp,
      lands: taxpayerLands,
      houses: taxpayerHouses,
      floors: allFloors,
      valuationSummary: {
        totalLandValuation,
        totalHouseValuation,
        combinedTotalValuation,
        calculatedTaxLiability: Math.round(calculatedTaxLiability),
        rebateApplied: Math.round(earlyRebateAmount),
        netPayableTax: Math.round(netPayableTax),
        currency: "NPR / INR"
      }
    };
  }

  public createTaxpayer(data: any, userId = "SYSTEM"): TblTaxpayerMaster {
    const id = this.nextId++;
    const now = new Date().toISOString();
    const tp: TblTaxpayerMaster = {
      id,
      code: data.code || `TP-2081-${String(id).padStart(4, "0")}`,
      fullanme: data.fullanme,
      mobile_no: data.mobile_no,
      tax_type_id: data.tax_type_id || 1,
      email: data.email || "",
      ward_no: Number(data.ward_no || 1),
      pan_vat_no: data.pan_vat_no || "",
      citizenship_no: data.citizenship_no || "",
      is_deleted: false,
      insert_by: userId,
      insert_on: now,
      update_by: userId,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.taxpayers.set(id, tp);
    return tp;
  }

  public createLand(data: any, userId = "SYSTEM"): TblLand {
    const id = this.nextId++;
    const now = new Date().toISOString();
    
    // Auto calculate valuation based on selected rate
    const rate = this.landRates.get(Number(data.land_rate_id)) || Array.from(this.landRates.values())[0];
    const unit = this.units.get(Number(data.land_measuring_unit_id)) || Array.from(this.units.values())[0];
    
    const areaSqFt = Number(data.area_sqfeet || 1000);
    const rateVal = rate ? rate.rate_per_unit : 100000;
    const valuation = Math.round((areaSqFt / (unit?.unit_value || 1)) * rateVal);

    const land: TblLand = {
      id,
      taxpayer_id: Number(data.taxpayer_id),
      kitta_number: data.kitta_number,
      moth_number: data.moth_number,
      ward_no: Number(data.ward_no || 1),
      area_sqfeet: areaSqFt,
      include_in_evaluation: data.include_in_evaluation !== false,
      land_measuring_unit_id: Number(data.land_measuring_unit_id || 1),
      nature_id: Number(data.nature_id || 1),
      land_rate_id: Number(data.land_rate_id || 1),
      malpot_rate_id: Number(data.malpot_rate_id || 1),
      assessed_valuation: valuation,
      is_deleted: false,
      insert_by: userId,
      insert_on: now,
      update_by: userId,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.lands.set(id, land);
    return land;
  }

  public createHouse(data: any, userId = "SYSTEM"): TblHouse {
    const id = this.nextId++;
    const now = new Date().toISOString();
    
    // Resolve primary and secondary land if spanning two lands
    const landId = data.land_id ? Number(data.land_id) : (Array.isArray(data.land_ids) && data.land_ids.length > 0 ? Number(data.land_ids[0]) : null);
    const secondaryLandId = data.secondary_land_id ? Number(data.secondary_land_id) : (Array.isArray(data.land_ids) && data.land_ids.length > 1 ? Number(data.land_ids[1]) : null);
    
    // Auto-resolve kitta_numbers from selected land(s)
    let kittaNumbers = data.kitta_numbers || "";
    const resolvedIds = Array.isArray(data.land_ids) && data.land_ids.length > 0
      ? data.land_ids.map(Number)
      : [landId, secondaryLandId].filter(Boolean).map(Number);
    
    if (resolvedIds.length > 0) {
      const kList = resolvedIds
        .map((lid: number) => {
          const l = this.lands.get(lid);
          return l ? l.kitta_number : "";
        })
        .filter(Boolean);
      if (kList.length > 0) {
        kittaNumbers = kList.join(", ");
      }
    }

    const house: TblHouse = {
      id,
      taxpayer_id: Number(data.taxpayer_id),
      land_id: landId,
      secondary_land_id: secondaryLandId,
      kitta_numbers: kittaNumbers,
      land_ids: resolvedIds,
      house_no: data.house_no,
      area_sqfeet: Number(data.area_sqfeet || 1000),
      acquisition_date_bs: data.acquisition_date_bs || "2078-01-01",
      acquisition_date_ad: data.acquisition_date_ad || "2021-04-14",
      plinth_area: Number(data.plinth_area || 800),
      floor_no: Number(data.floor_no || 1),
      include_in_evaluation: data.include_in_evaluation !== false,
      measuring_unit_id: Number(data.measuring_unit_id || 1),
      construction_type_id: Number(data.construction_type_id || 1),
      assessed_valuation: Number(data.area_sqfeet || 1000) * 2500,
      is_deleted: false,
      insert_by: userId,
      insert_on: now,
      update_by: userId,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.houses.set(id, house);
    return house;
  }

  public createFloor(data: any, userId = "SYSTEM"): TblFloor {
    const id = this.nextId++;
    const now = new Date().toISOString();
    const area = Number(data.area_sqfeet || 800);
    const cr = this.constructionRates.get(Number(data.rate_id)) || Array.from(this.constructionRates.values())[0];
    const ratePerSq = cr ? cr.rate_per_unit : 2800;
    const depPercent = Number(data.depreciation_percent || 5);
    const rawVal = area * ratePerSq;
    const val = Math.round(rawVal * (1 - depPercent / 100));

    const fl: TblFloor = {
      id,
      house_id: Number(data.house_id),
      floor_no: Number(data.floor_no || 0),
      construction_date_ad: data.construction_date_ad || "2020-01-01",
      construction_date_bs: data.construction_date_bs || "2076-09-15",
      construction_type_id: Number(data.construction_type_id || 1),
      area_sqfeet: area,
      include_in_evaluation: data.include_in_evaluation !== false,
      rate_id: Number(data.rate_id || 1),
      remarks: data.remarks || "",
      measuring_unit_id: Number(data.measuring_unit_id || 1),
      depreciation_percent: depPercent,
      floor_assessed_valuation: val,
      is_deleted: false,
      insert_by: userId,
      insert_on: now,
      update_by: userId,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.floors.set(id, fl);
    return fl;
  }

  public createFiscalYear(data: any, userId = "SYSTEM"): TblFiscalYear {
    const id = this.nextId++;
    const now = new Date().toISOString();
    const fy: TblFiscalYear = {
      id,
      code: data.code,
      fullname: data.fullname,
      date_from_bs: data.date_from_bs,
      date_from_ad: data.date_from_ad || "2025-07-16",
      date_to_ad: data.date_to_ad || "2026-07-15",
      date_to_bs: data.date_to_bs,
      is_deleted: false,
      insert_by: userId,
      insert_on: now,
      update_by: userId,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.fiscalYears.set(id, fy);
    return fy;
  }

  // --- Update & Delete for Taxpayers ---
  public updateTaxpayer(id: number, data: any, userId = "SYSTEM"): TblTaxpayerMaster | null {
    const existing = this.taxpayers.get(id);
    if (!existing || existing.is_deleted) return null;
    const updated: TblTaxpayerMaster = {
      ...existing,
      code: data.code ?? existing.code,
      fullanme: data.fullanme ?? existing.fullanme,
      mobile_no: data.mobile_no ?? existing.mobile_no,
      email: data.email ?? existing.email,
      ward_no: data.ward_no !== undefined ? Number(data.ward_no) : existing.ward_no,
      pan_vat_no: data.pan_vat_no ?? existing.pan_vat_no,
      citizenship_no: data.citizenship_no ?? existing.citizenship_no,
      tax_type_id: data.tax_type_id ?? existing.tax_type_id,
      update_by: userId,
      update_on: new Date().toISOString()
    };
    this.taxpayers.set(id, updated);
    return updated;
  }

  public deleteTaxpayer(id: number, userId = "SYSTEM"): boolean {
    const existing = this.taxpayers.get(id);
    if (!existing) return false;
    existing.is_deleted = true;
    existing.delete_by = userId;
    existing.deleted_on = new Date().toISOString();
    this.taxpayers.set(id, existing);
    return true;
  }

  // --- Update & Delete for Land ---
  public updateLand(id: number, data: any, userId = "SYSTEM"): TblLand | null {
    const existing = this.lands.get(id);
    if (!existing || existing.is_deleted) return null;

    const rateId = data.land_rate_id !== undefined ? Number(data.land_rate_id) : existing.land_rate_id;
    const unitId = data.land_measuring_unit_id !== undefined ? Number(data.land_measuring_unit_id) : existing.land_measuring_unit_id;
    const areaSqFt = data.area_sqfeet !== undefined ? Number(data.area_sqfeet) : existing.area_sqfeet;

    const rate = this.landRates.get(rateId) || Array.from(this.landRates.values())[0];
    const unit = this.units.get(unitId) || Array.from(this.units.values())[0];
    const rateVal = rate ? rate.rate_per_unit : 100000;
    const valuation = Math.round((areaSqFt / (unit?.unit_value || 1)) * rateVal);

    const updated: TblLand = {
      ...existing,
      kitta_number: data.kitta_number ?? existing.kitta_number,
      moth_number: data.moth_number ?? existing.moth_number,
      ward_no: data.ward_no !== undefined ? Number(data.ward_no) : existing.ward_no,
      area_sqfeet: areaSqFt,
      include_in_evaluation: data.include_in_evaluation !== undefined ? Boolean(data.include_in_evaluation) : existing.include_in_evaluation,
      land_measuring_unit_id: unitId,
      nature_id: data.nature_id !== undefined ? Number(data.nature_id) : existing.nature_id,
      land_rate_id: rateId,
      malpot_rate_id: data.malpot_rate_id !== undefined ? Number(data.malpot_rate_id) : existing.malpot_rate_id,
      assessed_valuation: valuation,
      update_by: userId,
      update_on: new Date().toISOString()
    };
    this.lands.set(id, updated);
    return updated;
  }

  public deleteLand(id: number, userId = "SYSTEM"): boolean {
    const existing = this.lands.get(id);
    if (!existing) return false;
    existing.is_deleted = true;
    existing.delete_by = userId;
    existing.deleted_on = new Date().toISOString();
    this.lands.set(id, existing);
    return true;
  }

  // --- Update & Delete for House ---
  public updateHouse(id: number, data: any, userId = "SYSTEM"): TblHouse | null {
    const existing = this.houses.get(id);
    if (!existing || existing.is_deleted) return null;

    const area = data.area_sqfeet !== undefined ? Number(data.area_sqfeet) : existing.area_sqfeet;
    const landId = data.land_id !== undefined ? (data.land_id ? Number(data.land_id) : null) : existing.land_id;
    const secondaryLandId = data.secondary_land_id !== undefined ? (data.secondary_land_id ? Number(data.secondary_land_id) : null) : existing.secondary_land_id;

    let kittaNumbers = data.kitta_numbers ?? existing.kitta_numbers;
    const resolvedIds = Array.isArray(data.land_ids) && data.land_ids.length > 0
      ? data.land_ids.map(Number)
      : [landId, secondaryLandId].filter(Boolean).map(Number);

    if (data.kitta_numbers === undefined && resolvedIds.length > 0) {
      const kList = resolvedIds
        .map((lid: number) => {
          const l = this.lands.get(lid);
          return l ? l.kitta_number : "";
        })
        .filter(Boolean);
      if (kList.length > 0) {
        kittaNumbers = kList.join(", ");
      }
    }

    const updated: TblHouse = {
      ...existing,
      land_id: landId,
      secondary_land_id: secondaryLandId,
      kitta_numbers: kittaNumbers,
      land_ids: resolvedIds,
      house_no: data.house_no ?? existing.house_no,
      area_sqfeet: area,
      acquisition_date_bs: data.acquisition_date_bs ?? existing.acquisition_date_bs,
      acquisition_date_ad: data.acquisition_date_ad ?? existing.acquisition_date_ad,
      plinth_area: data.plinth_area !== undefined ? Number(data.plinth_area) : existing.plinth_area,
      floor_no: data.floor_no !== undefined ? Number(data.floor_no) : existing.floor_no,
      include_in_evaluation: data.include_in_evaluation !== undefined ? Boolean(data.include_in_evaluation) : existing.include_in_evaluation,
      measuring_unit_id: data.measuring_unit_id !== undefined ? Number(data.measuring_unit_id) : existing.measuring_unit_id,
      construction_type_id: data.construction_type_id !== undefined ? Number(data.construction_type_id) : existing.construction_type_id,
      assessed_valuation: area * 2500,
      update_by: userId,
      update_on: new Date().toISOString()
    };
    this.houses.set(id, updated);
    return updated;
  }

  public deleteHouse(id: number, userId = "SYSTEM"): boolean {
    const existing = this.houses.get(id);
    if (!existing) return false;
    existing.is_deleted = true;
    existing.delete_by = userId;
    existing.deleted_on = new Date().toISOString();
    this.houses.set(id, existing);
    return true;
  }

  // --- Update & Delete for Floor ---
  public updateFloor(id: number, data: any, userId = "SYSTEM"): TblFloor | null {
    const existing = this.floors.get(id);
    if (!existing || existing.is_deleted) return null;

    const area = data.area_sqfeet !== undefined ? Number(data.area_sqfeet) : existing.area_sqfeet;
    const rateId = data.rate_id !== undefined ? Number(data.rate_id) : existing.rate_id;
    const cr = this.constructionRates.get(rateId) || Array.from(this.constructionRates.values())[0];
    const ratePerSq = cr ? cr.rate_per_unit : 2800;
    const depPercent = data.depreciation_percent !== undefined ? Number(data.depreciation_percent) : existing.depreciation_percent;
    const rawVal = area * ratePerSq;
    const val = Math.round(rawVal * (1 - depPercent / 100));

    const updated: TblFloor = {
      ...existing,
      floor_no: data.floor_no !== undefined ? Number(data.floor_no) : existing.floor_no,
      construction_date_ad: data.construction_date_ad ?? existing.construction_date_ad,
      construction_date_bs: data.construction_date_bs ?? existing.construction_date_bs,
      construction_type_id: data.construction_type_id !== undefined ? Number(data.construction_type_id) : existing.construction_type_id,
      area_sqfeet: area,
      include_in_evaluation: data.include_in_evaluation !== undefined ? Boolean(data.include_in_evaluation) : existing.include_in_evaluation,
      rate_id: rateId,
      remarks: data.remarks ?? existing.remarks,
      measuring_unit_id: data.measuring_unit_id !== undefined ? Number(data.measuring_unit_id) : existing.measuring_unit_id,
      depreciation_percent: depPercent,
      floor_assessed_valuation: val,
      update_by: userId,
      update_on: new Date().toISOString()
    };
    this.floors.set(id, updated);
    return updated;
  }

  public deleteFloor(id: number, userId = "SYSTEM"): boolean {
    const existing = this.floors.get(id);
    if (!existing) return false;
    existing.is_deleted = true;
    existing.delete_by = userId;
    existing.deleted_on = new Date().toISOString();
    this.floors.set(id, existing);
    return true;
  }

  // --- Generic Rate Tables CRUD ---
  public saveRateItem(category: string, data: any, id?: number, userId = "SYSTEM"): any {
    const now = new Date().toISOString();
    const itemId = id || this.nextId++;

    switch (category) {
      case "fiscal_year": {
        const item: TblFiscalYear = {
          id: itemId,
          code: data.code || "",
          fullname: data.fullname || "",
          date_from_bs: data.date_from_bs || "",
          date_from_ad: data.date_from_ad || "",
          date_to_ad: data.date_to_ad || "",
          date_to_bs: data.date_to_bs || "",
          is_deleted: false,
          insert_by: id ? (this.fiscalYears.get(id)?.insert_by || userId) : userId,
          insert_on: id ? (this.fiscalYears.get(id)?.insert_on || now) : now,
          update_by: userId,
          update_on: now,
          delete_by: null,
          deleted_on: null,
          is_active: data.is_active !== undefined ? Boolean(data.is_active) : true
        };
        this.fiscalYears.set(itemId, item);
        return item;
      }
      case "unit": {
        const item: TblUnit = {
          id: itemId,
          code: data.code || "",
          fullanme: data.fullanme || "",
          unit_value: Number(data.unit_value || 1),
          is_deleted: false,
          insert_by: id ? (this.units.get(id)?.insert_by || userId) : userId,
          insert_on: id ? (this.units.get(id)?.insert_on || now) : now,
          update_by: userId,
          update_on: now,
          delete_by: null,
          deleted_on: null,
          is_active: data.is_active !== undefined ? Boolean(data.is_active) : true
        };
        this.units.set(itemId, item);
        return item;
      }
      case "land_rate": {
        const item: TblLandRate = {
          id: itemId,
          code: data.code || "",
          fullanme: data.fullanme || "",
          fiscal_year_id: Number(data.fiscal_year_id || 1),
          is_parent: Boolean(data.is_parent),
          parent_id: data.parent_id ? Number(data.parent_id) : null,
          unit_id: Number(data.unit_id || 1),
          rate_per_unit: Number(data.rate_per_unit || 0),
          area_upto: Number(data.area_upto || 0),
          area_per_unit: Number(data.area_per_unit || 0),
          ward_no_ids: String(data.ward_no_ids || "1,2,3"),
          is_deleted: false,
          insert_by: id ? (this.landRates.get(id)?.insert_by || userId) : userId,
          insert_on: id ? (this.landRates.get(id)?.insert_on || now) : now,
          update_by: userId,
          update_on: now,
          delete_by: null,
          deleted_on: null,
          is_active: true
        };
        this.landRates.set(itemId, item);
        return item;
      }
      case "malpot_rate": {
        const item: TblMalpotRate = {
          id: itemId,
          code: data.code || "",
          fullanme: data.fullanme || "",
          fiscal_year_id: Number(data.fiscal_year_id || 1),
          is_parent: Boolean(data.is_parent),
          parent_id: data.parent_id ? Number(data.parent_id) : null,
          unit_id: Number(data.unit_id || 1),
          rate_per_unit: Number(data.rate_per_unit || 0),
          area_upto: Number(data.area_upto || 0),
          area_per_unit: Number(data.area_per_unit || 0),
          ward_no_ids: String(data.ward_no_ids || "1,2,3"),
          is_deleted: false,
          insert_by: id ? (this.malpotRates.get(id)?.insert_by || userId) : userId,
          insert_on: id ? (this.malpotRates.get(id)?.insert_on || now) : now,
          update_by: userId,
          update_on: now,
          delete_by: null,
          deleted_on: null,
          is_active: true
        };
        this.malpotRates.set(itemId, item);
        return item;
      }
      case "construction_type": {
        const item: TblConstructionType = {
          id: itemId,
          code: data.code || "",
          fullanme: data.fullanme || "",
          is_deleted: false,
          insert_by: id ? (this.constructionTypes.get(id)?.insert_by || userId) : userId,
          insert_on: id ? (this.constructionTypes.get(id)?.insert_on || now) : now,
          update_by: userId,
          update_on: now,
          delete_by: null,
          deleted_on: null,
          is_active: true
        };
        this.constructionTypes.set(itemId, item);
        return item;
      }
      case "construction_rate": {
        const item: TblConstructionRate = {
          id: itemId,
          code: data.code || "",
          fullanme: data.fullanme || "",
          fiscal_year_id: Number(data.fiscal_year_id || 1),
          is_parent: Boolean(data.is_parent),
          parent_id: data.parent_id ? Number(data.parent_id) : null,
          const_type_id: Number(data.const_type_id || 1),
          unit_id: Number(data.unit_id || 1),
          rate_per_unit: Number(data.rate_per_unit || 0),
          area_upto: Number(data.area_upto || 0),
          area_per_unit: Number(data.area_per_unit || 0),
          ward_no_ids: String(data.ward_no_ids || "1,2,3"),
          is_deleted: false,
          insert_by: id ? (this.constructionRates.get(id)?.insert_by || userId) : userId,
          insert_on: id ? (this.constructionRates.get(id)?.insert_on || now) : now,
          update_by: userId,
          update_on: now,
          delete_by: null,
          deleted_on: null,
          is_active: true
        };
        this.constructionRates.set(itemId, item);
        return item;
      }
      case "depreciation": {
        const item: TblDepreciation = {
          id: itemId,
          code: data.code || "",
          fullanme: data.fullanme || "",
          fiscal_year_id: Number(data.fiscal_year_id || 1),
          construction_type_id: Number(data.construction_type_id || data.const_type_id || 1),
          is_parent: Boolean(data.is_parent),
          parent_id: data.parent_id ? Number(data.parent_id) : null,
          sn: Number(data.sn || 1),
          year_from: Number(data.year_from || 0),
          year_to: Number(data.year_to || 5),
          percent: Number(data.percent || 5),
          is_deleted: false,
          insert_by: id ? (this.depreciations.get(id)?.insert_by || userId) : userId,
          insert_on: id ? (this.depreciations.get(id)?.insert_on || now) : now,
          update_by: userId,
          update_on: now,
          delete_by: null,
          deleted_on: null,
          is_active: true
        };
        this.depreciations.set(itemId, item);
        return item;
      }
      case "fine_rebate": {
        const item: TblFineRebate = {
          id: itemId,
          fiscal_year_id: Number(data.fiscal_year_id || 1),
          tax_type_id: Number(data.tax_type_id || 1),
          ratesn: Number(data.ratesn || 1),
          years: Number(data.years || 0),
          month: Number(data.month || 0),
          calcpercent: Number(data.calcpercent || 0),
          ratepercent: Number(data.ratepercent || 0),
          flatrate: Number(data.flatrate || 0),
          isfine: Boolean(data.isfine),
          days: Number(data.days || 30),
          is_deleted: false,
          insert_by: id ? (this.fineRebates.get(id)?.insert_by || userId) : userId,
          insert_on: id ? (this.fineRebates.get(id)?.insert_on || now) : now,
          update_by: userId,
          update_on: now,
          delete_by: null,
          deleted_on: null,
          is_active: true
        };
        this.fineRebates.set(itemId, item);
        return item;
      }
      case "land_nature": {
        const item: TblLandNature = {
          id: itemId,
          code: data.code || "",
          fullanme: data.fullanme || "",
          is_deleted: false,
          insert_by: id ? (this.landNatures.get(id)?.insert_by || userId) : userId,
          insert_on: id ? (this.landNatures.get(id)?.insert_on || now) : now,
          update_by: userId,
          update_on: now,
          delete_by: null,
          deleted_on: null,
          is_active: true
        };
        this.landNatures.set(itemId, item);
        return item;
      }
      case "property_range": {
        const fyId = Number(data.FiscalYearId || data.fiscal_year_id || 1);
        const item: TblPropertyRange = {
          id: itemId,
          FiscalYearId: fyId,
          fiscal_year_id: fyId,
          Sn: Number(data.Sn || data.sn || 1),
          sn: Number(data.Sn || data.sn || 1),
          value_from: Number(data.value_from || data.ValueFrom || 0),
          ValueFrom: Number(data.value_from || data.ValueFrom || 0),
          value_to: Number(data.value_to || data.ValueTo || 0),
          ValueTo: Number(data.value_to || data.ValueTo || 0),
          is_percent: Boolean(data.is_percent !== undefined ? data.is_percent : data.IsPercent),
          IsPercent: Boolean(data.is_percent !== undefined ? data.is_percent : data.IsPercent),
          tax_percent: Number(data.tax_percent !== undefined ? data.tax_percent : data.TaxPercent || 0),
          TaxPercent: Number(data.tax_percent !== undefined ? data.tax_percent : data.TaxPercent || 0),
          amount_from: Number(data.amount_from !== undefined ? data.amount_from : data.AmountFrom || 0),
          AmountFrom: Number(data.amount_from !== undefined ? data.amount_from : data.AmountFrom || 0),
          amount_to: Number(data.amount_to !== undefined ? data.amount_to : data.AmountTo || 0),
          AmountTo: Number(data.amount_to !== undefined ? data.amount_to : data.AmountTo || 0),
          above_then: Number(data.above_then !== undefined ? data.above_then : data.AboveThen || 0),
          AboveThen: Number(data.above_then !== undefined ? data.above_then : data.AboveThen || 0),
          min_tax_amount: Number(data.min_tax_amount !== undefined ? data.min_tax_amount : data.MinimumTaxAmount || 0),
          MinimumTaxAmount: Number(data.min_tax_amount !== undefined ? data.min_tax_amount : data.MinimumTaxAmount || 0),
          per_unit_amount: Number(data.per_unit_amount !== undefined ? data.per_unit_amount : data.PerUnitAmount || 0),
          PerUnitAmount: Number(data.per_unit_amount !== undefined ? data.per_unit_amount : data.PerUnitAmount || 0),
          per_unit_rate: Number(data.per_unit_rate !== undefined ? data.per_unit_rate : data.PerUnitRate || 0),
          PerUnitRate: Number(data.per_unit_rate !== undefined ? data.per_unit_rate : data.PerUnitRate || 0),
          is_cumuliatative: Boolean(data.is_cumuliatative !== undefined ? data.is_cumuliatative : data.IsCumulative),
          IsCumulative: Boolean(data.is_cumuliatative !== undefined ? data.is_cumuliatative : data.IsCumulative),
          is_deleted: false,
          insert_by: id ? (this.propertyRanges.get(id)?.insert_by || userId) : userId,
          insert_on: id ? (this.propertyRanges.get(id)?.insert_on || now) : now,
          update_by: userId,
          update_on: now,
          delete_by: null,
          deleted_on: null,
          is_active: true
        };
        this.propertyRanges.set(itemId, item);
        return item;
      }
      default:
        return null;
    }
  }

  public deleteRateItem(category: string, id: number, userId = "SYSTEM"): boolean {
    const map = this.getMapForCategory(category);
    if (!map) return false;
    const existing = map.get(id);
    if (!existing) return false;
    existing.is_deleted = true;
    existing.delete_by = userId;
    existing.deleted_on = new Date().toISOString();
    map.set(id, existing);
    return true;
  }

  public calculateMultiYearTaxAssessment(params: {
    taxpayerId: number;
    fromFiscalYearId: number;
    toFiscalYearId: number;
    scope?: "all" | "land" | "house";
    propertyId?: number;
    userId?: string;
  }): MultiYearCalculationResult | null {
    const tp = this.taxpayers.get(Number(params.taxpayerId));
    if (!tp || tp.is_deleted) return null;

    const fromFy = this.fiscalYears.get(Number(params.fromFiscalYearId));
    const toFy = this.fiscalYears.get(Number(params.toFiscalYearId));
    if (!fromFy || !toFy) return null;

    const scope = params.scope || "all";
    const propertyId = params.propertyId ? Number(params.propertyId) : undefined;

    // Get active fiscal years and sort chronologically
    const allActiveFys = Array.from(this.fiscalYears.values())
      .filter((f) => !f.is_deleted && f.is_active)
      .sort((a, b) => a.date_from_bs.localeCompare(b.date_from_bs));

    const fromIdx = allActiveFys.findIndex((f) => f.id === fromFy.id);
    const toIdx = allActiveFys.findIndex((f) => f.id === toFy.id);
    if (fromIdx === -1 || toIdx === -1) return null;

    const startIdx = Math.min(fromIdx, toIdx);
    const endIdx = Math.max(fromIdx, toIdx);
    const targetFys = allActiveFys.slice(startIdx, endIdx + 1);

    // Retrieve taxpayer assets
    let taxpayerLands = Array.from(this.lands.values()).filter(
      (l) => l.taxpayer_id === tp.id && !l.is_deleted && l.is_active
    );
    let taxpayerHouses = Array.from(this.houses.values()).filter(
      (h) => h.taxpayer_id === tp.id && !h.is_deleted && h.is_active
    );

    let targetPropertyDesc = "All Registered Land Parcels & Structures (Consolidated Assessment)";

    if (scope === "land" && propertyId) {
      taxpayerLands = taxpayerLands.filter((l) => l.id === propertyId);
      taxpayerHouses = [];
      const targetLand = taxpayerLands[0];
      targetPropertyDesc = targetLand ? `Individual Land: Kitta No. ${targetLand.kitta_number} (Ward ${targetLand.ward_no})` : "Individual Land Parcel";
    } else if (scope === "house" && propertyId) {
      taxpayerHouses = taxpayerHouses.filter((h) => h.id === propertyId);
      taxpayerLands = [];
      const targetHouse = taxpayerHouses[0];
      targetPropertyDesc = targetHouse ? `Individual House: ${targetHouse.house_no} (Floor Units: ${targetHouse.floor_no})` : "Individual House Structure";
    }

    const houseIds = new Set(taxpayerHouses.map((h) => h.id));
    const taxpayerFloors = Array.from(this.floors.values()).filter(
      (f) => houseIds.has(f.house_id) && !f.is_deleted && f.is_active
    );

    let runningArrears = 0;
    let totalBaseTaxSum = 0;
    let totalFinesAccrued = 0;
    let totalRebatesDeducted = 0;

    const yearlyBreakdowns: MultiYearCalculationItem[] = [];

    targetFys.forEach((fy) => {
      const bsYear = parseInt(fy.code.split("/")[0]) || 2081;
      const isPastOverdue = bsYear < 2081;
      const isCurrent = bsYear === 2081;
      const isFuture = bsYear > 2081;

      // 1. Evaluate Lands
      let yearLandValuation = 0;
      const evaluatedLands: MultiYearCalculationItem["evaluatedLands"] = [];

      taxpayerLands.forEach((land) => {
        if (!land.include_in_evaluation) return;
        const unit = this.units.get(land.land_measuring_unit_id);
        const rate = this.landRates.get(land.land_rate_id);
        const ratePerUnit = rate ? rate.rate_per_unit : 800000;
        const unitVal = unit ? unit.unit_value : 342.25;
        const valuation = Math.round((land.area_sqfeet / unitVal) * ratePerUnit);
        
        yearLandValuation += valuation;
        evaluatedLands.push({
          id: land.id,
          kitta_number: land.kitta_number,
          area_sqfeet: land.area_sqfeet,
          unit_name: unit?.fullanme || "Sq.Ft",
          rate_per_unit: ratePerUnit,
          assessed_valuation: valuation
        });
      });

      // 2. Evaluate Houses & Floors with progressive depreciation per fiscal year
      let yearHouseValuation = 0;
      const evaluatedFloors: MultiYearCalculationItem["evaluatedFloors"] = [];

      taxpayerFloors.forEach((fl) => {
        if (!fl.include_in_evaluation) return;
        const parentHouse = this.houses.get(fl.house_id);
        const constRate = this.constructionRates.get(fl.rate_id);
        const rateVal = constRate ? constRate.rate_per_unit : 2800;

        // Compute structure age in this fiscal year
        const constYearBs = parseInt(fl.construction_date_bs?.split("-")[0]) || 2076;
        const ageInYears = Math.max(1, bsYear - constYearBs);

        // Find applicable depreciation bracket
        let depPercent = 5.0;
        if (ageInYears <= 5) depPercent = 5.0;
        else if (ageInYears <= 15) depPercent = 15.0;
        else if (ageInYears <= 25) depPercent = 25.0;
        else if (ageInYears <= 40) depPercent = 35.0;
        else depPercent = 50.0;

        const baseStructureVal = fl.area_sqfeet * rateVal;
        const floorValuation = Math.round(baseStructureVal * (1 - depPercent / 100));

        yearHouseValuation += floorValuation;
        evaluatedFloors.push({
          id: fl.id,
          house_id: fl.house_id,
          house_no: parentHouse?.house_no || "House",
          floor_no: fl.floor_no,
          area_sqfeet: fl.area_sqfeet,
          rate_per_unit: rateVal,
          age_in_years: ageInYears,
          depreciation_percent: depPercent,
          assessed_valuation: floorValuation
        });
      });

      const totalValuation = yearLandValuation + yearHouseValuation;

      // 3. Municipal Property Tax Slab
      let taxSlabPercent = 0.05;
      if (totalValuation > 10000000) {
        taxSlabPercent = 0.20; // 0.20% for > 1 Crore
      } else if (totalValuation > 5000000) {
        taxSlabPercent = 0.15; // 0.15% for 50 Lakh to 1 Crore
      } else if (totalValuation > 1000000) {
        taxSlabPercent = 0.10; // 0.10% for 10 Lakh to 50 Lakh
      } else {
        taxSlabPercent = 0.05; // 0.05% for up to 10 Lakh
      }

      const baseTaxLiability = Math.round((totalValuation * taxSlabPercent) / 100);

      // 4. Fine & Rebate computation based on statutory rules
      let finePercent = 0;
      let fineAmount = 0;
      let rebatePercent = 0;
      let rebateAmount = 0;

      if (isPastOverdue) {
        // Late fine: 10% for 1 year overdue, 15% for 2 yrs, 20% for 3+ yrs
        const yearsOverdue = Math.max(1, 2081 - bsYear);
        finePercent = Math.min(25, 10 + (yearsOverdue - 1) * 5);
        fineAmount = Math.round((baseTaxLiability * finePercent) / 100);
      } else if (isCurrent) {
        // Prompt rebate: 10% discount for timely payment within Kartik/Poush
        rebatePercent = 10;
        rebateAmount = Math.round((baseTaxLiability * rebatePercent) / 100);
      } else if (isFuture) {
        // Advance payment discount
        rebatePercent = 15;
        rebateAmount = Math.round((baseTaxLiability * rebatePercent) / 100);
      }

      const netPayableYearTax = Math.max(0, baseTaxLiability + fineAmount - rebateAmount);
      runningArrears += netPayableYearTax;

      totalBaseTaxSum += baseTaxLiability;
      totalFinesAccrued += fineAmount;
      totalRebatesDeducted += rebateAmount;

      yearlyBreakdowns.push({
        fiscalYearId: fy.id,
        fiscalYearCode: fy.code,
        fiscalYearName: fy.fullname,
        bsYear,
        status: isPastOverdue ? "arrears" : isCurrent ? "current" : "advance",
        landValuation: yearLandValuation,
        houseValuation: yearHouseValuation,
        totalValuation,
        taxSlabPercent,
        baseTaxLiability,
        finePercent,
        fineAmount,
        rebatePercent,
        rebateAmount,
        netPayableYearTax,
        cumulativeRunningTotal: runningArrears,
        evaluatedLands,
        evaluatedFloors
      });
    });

    const netGrandTotalPayable = Math.max(0, totalBaseTaxSum + totalFinesAccrued - totalRebatesDeducted);

    return {
      taxpayer: tp,
      fromFiscalYear: allActiveFys[startIdx],
      toFiscalYear: allActiveFys[endIdx],
      scope,
      targetPropertyDescription: targetPropertyDesc,
      totalBaseTaxSum,
      totalFinesAccrued,
      totalRebatesDeducted,
      netGrandTotalPayable,
      yearsCount: yearlyBreakdowns.length,
      yearlyBreakdowns,
      generatedAt: new Date().toISOString(),
      generatedBy: params.userId || "SYSTEM"
    };
  }

  public getAllTaxpayers() {
    return this.getTaxpayers();
  }

  public getTaxpayerDossier(taxpayerId: number) {
    return this.getTaxpayerCompleteRecord(taxpayerId);
  }

  public getMasterTables() {
    return {
      fiscalYears: Array.from(this.fiscalYears.values()),
      units: Array.from(this.units.values()),
      landRates: Array.from(this.landRates.values()),
      malpotRates: Array.from(this.malpotRates.values()),
      constructionTypes: Array.from(this.constructionTypes.values()),
      constructionRates: Array.from(this.constructionRates.values()),
      depreciations: Array.from(this.depreciations.values()),
      fineRebates: Array.from(this.fineRebates.values()),
      propertyRanges: Array.from(this.propertyRanges.values()),
      landNatures: Array.from(this.landNatures.values())
    };
  }

  public getPropertyRanges() {
    return Array.from(this.propertyRanges.values()).filter((p) => !p.is_deleted && p.is_active);
  }

  private getMapForCategory(cat: string): Map<number, any> | null {
    switch (cat) {
      case "fiscal_year": return this.fiscalYears;
      case "unit": return this.units;
      case "land_rate": return this.landRates;
      case "malpot_rate": return this.malpotRates;
      case "construction_type": return this.constructionTypes;
      case "construction_rate": return this.constructionRates;
      case "depreciation": return this.depreciations;
      case "fine_rebate": return this.fineRebates;
      case "property_range": return this.propertyRanges;
      case "land_nature": return this.landNatures;
      default: return null;
    }
  }
}

export const propertyDb = new TaxpayerPropertyDatabase();
