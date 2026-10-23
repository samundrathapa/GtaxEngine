/**
 * gtax Enterprise - Next.js useTaxCalculation Hook
 * Manages 5-Step Property Valuation, progressive slab tax computation, and DB persistence
 */

import { useState, useCallback } from "react";
import { apiClient } from "../services/apiClient.ts";
import { CalculationResult } from "../types.ts";

export interface ValuationParams {
  taxpayerId: string;
  landAreaSqft: number;
  landRatePerSqft: number;
  landAdjustmentPct: number;
  buildingAreaSqft: number;
  buildingBaseRate: number;
  buildingDepreciationPct: number;
  taxSlabPct: number;
  earlyRebatePct: number;
  penaltyLatePct: number;
  sanitationCess: number;
  fiscalYear: string;
}

export function useTaxCalculation() {
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Compute 5-Step valuation synchronously or via API
  const computeLocalValuation = useCallback((params: ValuationParams): CalculationResult => {
    // Step 1: Land Valuation
    const baseLand = params.landAreaSqft * params.landRatePerSqft;
    const adjustedLand = baseLand * (1 + params.landAdjustmentPct / 100);

    // Step 2: Building Valuation
    const baseBuilding = params.buildingAreaSqft * params.buildingBaseRate;
    const depreciatedBuilding = baseBuilding * (1 - params.buildingDepreciationPct / 100);

    // Step 3: Progressive Tax
    const totalValuation = adjustedLand + depreciatedBuilding;
    const grossTax = totalValuation * (params.taxSlabPct / 100);

    // Step 4: Early Rebates and Late Penalties
    const rebateAmount = grossTax * (params.earlyRebatePct / 100);
    const penaltyAmount = grossTax * (params.penaltyLatePct / 100);

    // Step 5: Levies and Net Total
    const netPayable = Math.max(0, grossTax - rebateAmount + penaltyAmount + params.sanitationCess);

    const result: CalculationResult = {
      calc_id: `CALC-${Date.now()}`,
      taxpayer_id: params.taxpayerId,
      fiscal_year: params.fiscalYear,
      land_valuation: Math.round(adjustedLand),
      building_valuation: Math.round(depreciatedBuilding),
      total_valuation: Math.round(totalValuation),
      base_tax_rate: params.taxSlabPct,
      gross_tax: Math.round(grossTax),
      rebate_amount: Math.round(rebateAmount),
      penalty_amount: Math.round(penaltyAmount),
      cess_levy: params.sanitationCess,
      net_payable_tax: Math.round(netPayable),
      status: "DRAFT",
    };

    setCalculation(result);
    return result;
  }, []);

  const saveCalculationToDb = useCallback(async (record: Partial<CalculationResult>) => {
    setIsSaving(true);
    try {
      const res = await apiClient.saveCalculation(record);
      if (res.success && res.data) {
        setCalculation(res.data);
        return res.data;
      }
      throw new Error(res.message || "Failed to persist calculation");
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    calculation,
    isCalculating,
    isSaving,
    setIsCalculating,
    computeLocalValuation,
    saveCalculationToDb,
  };
}
