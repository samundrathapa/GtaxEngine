export interface TaxRuleDefinition {
  rule_id: string;
  jurisdiction_code: string;
  jurisdiction_name: string;
  jurisdiction_type: "federal" | "state" | "county" | "city" | "vat_zone" | "municipal";
  rate_percentage: number;
  apportionment_ratio?: number;
  is_cumulative_compounded?: boolean;
}

export interface TaxCalculationResult {
  base_taxable_amount: number;
  total_tax_liability: number;
  net_effective_tax_rate: number;
  jurisdiction_breakdown: {
    rule_id: string;
    jurisdiction_code: string;
    jurisdiction_name: string;
    jurisdiction_type: string;
    rate_percentage: number;
    taxable_base: number;
    apportionment_ratio: number;
    tax_liability: number;
  }[];
}

export class TaxHelpers {
  static roundCurrency(amount: number): number {
    return Math.round((amount + Number.EPSILON) * 100) / 100;
  }

  static calculateCompoundLiability(
    baseTaxableAmount: number,
    rules: TaxRuleDefinition[]
  ): TaxCalculationResult {
    let cumulativeTax = 0;
    const breakdown = rules.map((rule) => {
      const rate = rule.rate_percentage / 100;
      const ratio = rule.apportionment_ratio ?? 1.0;
      const taxableBase = rule.is_cumulative_compounded
        ? baseTaxableAmount + cumulativeTax
        : baseTaxableAmount;

      const liability = TaxHelpers.roundCurrency(taxableBase * rate * ratio);
      cumulativeTax += liability;

      return {
        rule_id: rule.rule_id,
        jurisdiction_code: rule.jurisdiction_code,
        jurisdiction_name: rule.jurisdiction_name,
        jurisdiction_type: rule.jurisdiction_type,
        rate_percentage: rule.rate_percentage,
        taxable_base: taxableBase,
        apportionment_ratio: ratio,
        tax_liability: liability
      };
    });

    const totalLiability = TaxHelpers.roundCurrency(cumulativeTax);
    const effectiveRate = baseTaxableAmount > 0
      ? Math.round((totalLiability / baseTaxableAmount) * 10000) / 100
      : 0;

    return {
      base_taxable_amount: baseTaxableAmount,
      total_tax_liability: totalLiability,
      net_effective_tax_rate: effectiveRate,
      jurisdiction_breakdown: breakdown
    };
  }

  static evaluateEconomicNexus(
    salesVolume: number,
    transactionCount: number,
    thresholdSales = 100000,
    thresholdTx = 200
  ) {
    const hasNexus = salesVolume >= thresholdSales || transactionCount >= thresholdTx;
    return {
      has_nexus: hasNexus,
      sales_volume: salesVolume,
      threshold_sales: thresholdSales,
      sales_threshold_met: salesVolume >= thresholdSales,
      transaction_count: transactionCount,
      threshold_transactions: thresholdTx,
      transaction_count_met: transactionCount >= thresholdTx,
      sales_progress_pct: Math.min(100, Math.round((salesVolume / thresholdSales) * 1000) / 10),
      transaction_progress_pct: Math.min(100, Math.round((transactionCount / thresholdTx) * 1000) / 10)
    };
  }
}
