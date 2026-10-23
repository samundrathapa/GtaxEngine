/**
 * Municipal Tax Calculation Engine
 * Matches exact municipal specifications for Nepal Local Government Tax Assessment
 */

export interface LandRateInfo {
  RatePerUnit: number;
  AreaPerUnit: number;
  rate_per_unit?: number;
  area_per_unit?: number;
}

export interface PropertyTaxRangeRow {
  id?: number;
  FiscalYearId?: number;
  fiscal_year_id?: number;
  Sn?: number;
  sn?: number;
  value_from?: number;
  ValueFrom?: number;
  value_to?: number;
  ValueTo?: number;
  is_percent?: boolean;
  IsPercent?: boolean;
  tax_percent?: number;
  TaxPercent?: number;
  amount_from?: number;
  AmountFrom?: number;
  amount_to?: number;
  AmountTo?: number;
  above_then?: number;
  AboveThen?: number;
  min_tax_amount?: number;
  MinimumTaxAmount?: number;
  per_unit_amount?: number;
  PerUnitAmount?: number;
  per_unit_rate?: number;
  PerUnitRate?: number;
  is_cumuliatative?: boolean;
  IsCumulative?: boolean;
}

/**
 * Unit Conversion for Land Measurement
 * unit_ID:
 * 1: Ropani system (where 1 Aana = 342.25 sqft, 1 Ropani = 16 Aana = 5476 sqft)
 * 2: Bigha system (where 1 Bigha = 72900 sqft, 1 Katha = 3645 sqft, 1 Dhur = 182.25 sqft)
 * 3: SqFeet (1:1)
 * 4: SqMetre (1 sqm = 10.7639 sqft)
 */
export class Measurement {
  static getLandMeasurement(areaInSqFt: number, unitId: number): number {
    switch (Number(unitId)) {
      case 1:
        // In Ropani system, rate is per Aana (342.25 sqft)
        return areaInSqFt / 342.25;
      case 2:
        // In Bigha system, rate is per Katha (3645 sqft)
        return areaInSqFt / 3645;
      case 3:
        // SqFeet
        return areaInSqFt;
      case 4:
        // SqMetre
        return areaInSqFt / 10.7639;
      default:
        return areaInSqFt;
    }
  }
}

/**
 * Land Evaluation Amount
 * Matches exact logic specified by user:
 * double Land_Area = (double)Measurement.GetLandMeasurement((decimal)areaInSqFt, unit_ID );
 * double areaPerUnit = Measurement.GetLandMeasurement(rate.AreaPerUnit, unit_ID );
 * double areaFromOne = 0; 
 * double areaFromTwo = 0; 
 * double __DifferentAmount = 0;
 * double ratePerUnit = rate.RatePerUnit; 
 * double ratePerUnitOne = rate.RatePerUnit;
 * double ratePerUnitTwo = rate.RatePerUnit;
 * if (areaPerUnit <= 0) areaPerUnit = 1;
 * double __Amount__ = 0, CalculationArea = Land_Area;
 * ...
 */
export function calculateLandEvaluation(
  areaInSqFt: number,
  unitId: number,
  rate: { RatePerUnit: number; AreaPerUnit: number },
  areaFromOne: number = 0,
  areaFromTwo: number = 0,
  ratePerUnitOne?: number,
  ratePerUnitTwo?: number
): number {
  const Land_Area = Measurement.getLandMeasurement(areaInSqFt, unitId);
  let areaPerUnit = rate.AreaPerUnit > 0 ? Measurement.getLandMeasurement(rate.AreaPerUnit, unitId) : 1;
  if (areaPerUnit <= 0) areaPerUnit = 1;

  const ratePerUnit = rate.RatePerUnit;
  const rOne = (ratePerUnitOne !== undefined && ratePerUnitOne > 0) ? ratePerUnitOne : ratePerUnit;
  const rTwo = (ratePerUnitTwo !== undefined && ratePerUnitTwo > 0) ? ratePerUnitTwo : ratePerUnit;

  let __Amount__ = 0;
  let CalculationArea = Land_Area;
  let __DifferentAmount = 0;

  if (areaFromOne > 0) {
    if (CalculationArea <= areaFromOne) {
      return Math.round(CalculationArea * (ratePerUnit / areaPerUnit));
    }
    __Amount__ = Math.round(areaFromOne * (ratePerUnit / areaPerUnit));
    CalculationArea -= areaFromOne;

    if (areaFromTwo === 0) {
      __Amount__ += Math.round(CalculationArea * (rOne / areaPerUnit));
    } else {
      __DifferentAmount = areaFromTwo - areaFromOne;
      if (CalculationArea > __DifferentAmount) {
        __Amount__ += Math.round(__DifferentAmount * (rOne / areaPerUnit));
        CalculationArea -= __DifferentAmount;
      } else {
        __Amount__ += Math.round(CalculationArea * (rOne / areaPerUnit));
        CalculationArea = 0;
      }

      if (CalculationArea > 0) {
        __Amount__ += Math.round(CalculationArea * (rTwo / areaPerUnit));
      }
    }
  } else if (areaFromTwo > 0) {
    __Amount__ = Math.round(CalculationArea * (rTwo / areaPerUnit));
  } else {
    __Amount__ = Math.round(Land_Area * (ratePerUnit / areaPerUnit));
  }

  return __Amount__;
}

/**
 * Floor / House Evaluation Amount
 */
export function getFloorEvaluationAmount(
  areaSqft: number,
  rate: { RatePerUnit?: number; rate_per_unit?: number } | null
): number {
  const rateVal = rate ? Number(rate.RatePerUnit ?? rate.rate_per_unit ?? 2800) : 2800;
  return Math.round(areaSqft * rateVal);
}

/**
 * Structure Depreciation Calculation
 */
export function getDepreciationAmount(
  depreciations: any[],
  fiscalYearCode: string = "2081/82",
  calculatedAmount: number,
  constructionTypeId: number = 1,
  constructionDateBs: string = "2075-01-01"
): { depreciationRate: number; depreciationAmount: number } {
  // Extract construction year (BS)
  const currentYearBs = parseInt(fiscalYearCode?.slice(0, 4) || "2081", 10);
  const constYearBs = parseInt(constructionDateBs?.slice(0, 4) || "2075", 10);
  const age = Math.max(0, currentYearBs - constYearBs);

  // Find depreciation slab
  const slab = depreciations.find((d) => d.year_from <= age && d.year_to >= age);
  const depRate = slab ? Number(slab.percent) : (age > 20 ? 25 : age > 10 ? 15 : 5);
  const depAmt = Math.round(calculatedAmount * (depRate / 100));

  return {
    depreciationRate: depRate,
    depreciationAmount: depAmt
  };
}

/**
 * IPT Calculation from tbl_property_range
 * Exact logic specified by user:
 * double tax_amount = GetIPT_Amount(propertyTax, Evaluated_Amount, fiscalYearId);
 * if (Evaluated_Amount <= 0 || propertyTax == null) return 0;
 * Evaluated_Amount = Math.Truncate(Evaluated_Amount);
 * var taxRange = propertyTax.Where(f => f.FiscalYearId == fiscalYearId);
 * if (!taxRange.Any()) return 0;
 * ...
 */
export function getIPTAmount(
  propertyTax: PropertyTaxRangeRow[],
  Evaluated_Amount: number,
  fiscalYearId: number
): number {
  if (Evaluated_Amount <= 0 || !propertyTax || propertyTax.length === 0) return 0;

  Evaluated_Amount = Math.trunc(Evaluated_Amount);

  const taxRange = propertyTax.filter((f) => Number(f.FiscalYearId || f.fiscal_year_id) === Number(fiscalYearId));
  if (taxRange.length === 0) return 0;

  let tax = 0;

  for (const row of taxRange) {
    const from = Number(row.ValueFrom ?? row.value_from ?? 0);
    const to = Number(row.ValueTo ?? row.value_to ?? 0);
    const percent = Number(row.TaxPercent ?? row.tax_percent ?? 0);
    const amountFrom = Number(row.AmountFrom ?? row.amount_from ?? 0);
    const amountTo = Number(row.AmountTo ?? row.amount_to ?? 0);
    const minTax = Number(row.MinimumTaxAmount ?? row.min_tax_amount ?? 0);

    // Case: ceiling bracket (no upper limit)
    if (to === 0 && Evaluated_Amount > from) {
      tax = percent > 0 ? (Evaluated_Amount / 100) * percent : amountFrom;

      if (minTax > 0 && tax < minTax) {
        tax = minTax;
      }
      break;
    }

    // Case: within bracket range
    if (Evaluated_Amount >= from && Evaluated_Amount <= to) {
      if (percent > 0) {
        tax = (Evaluated_Amount / 100) * percent;
      } else {
        const diffPercent = (to - from) > 0 ? (Evaluated_Amount - from) / (to - from) : 0;
        tax = (amountTo - amountFrom) * diffPercent + amountFrom;
      }

      if (minTax > 0 && tax < minTax) {
        tax = minTax;
      }
      break;
    }
  }

  return Math.round(tax);
}
