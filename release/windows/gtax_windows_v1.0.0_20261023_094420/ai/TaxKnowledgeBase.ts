export interface MunicipalTaxBracket {
  rangeFrom: number;
  rangeTo: number;
  ratePercent: number;
  baseTax: number;
  description: string;
}

export const NEPAL_PROPERTY_TAX_BRACKETS: MunicipalTaxBracket[] = [
  { rangeFrom: 0, rangeTo: 1000000, ratePercent: 0.0, baseTax: 0, description: "Up to 10 Lakhs (Exempt / Minimum)" },
  { rangeFrom: 1000000, rangeTo: 3000000, ratePercent: 0.05, baseTax: 300, description: "10 to 30 Lakhs (0.05%)" },
  { rangeFrom: 3000000, rangeTo: 5000000, ratePercent: 0.10, baseTax: 1300, description: "30 to 50 Lakhs (0.10%)" },
  { rangeFrom: 5000000, rangeTo: 10000000, ratePercent: 0.15, baseTax: 3300, description: "50 Lakhs to 1 Crore (0.15%)" },
  { rangeFrom: 10000000, rangeTo: 999999999, ratePercent: 0.20, baseTax: 10800, description: "Above 1 Crore (0.20%)" },
];

export const MUNICIPAL_FORMULAS = {
  landAmount: "land_amount = ∑ [ (Normalized Land Area ÷ area_per_unit) × rate_per_unit ]",
  floorAmount: "floor_amount = ∑ [ ((Area × Construction Rate) - Depreciation %) × (100 + Floor Modifier %) ]",
  houseAmount: "house_amount = ∑ [ (∑ Linked Floors Net Amounts) × Plinth Multiplier + Custom Municipal Adjustment ]",
  evaluatedAmount: "Evaluated_Amount = land_amount + house_amount",
  totalTax: "Total_Tax = IPT_Bracket_Tax + Sanitation_Fee (Rs. 200)",
};
