import { TaxCalculationResult } from "../../server/BaseFrame/helpers/TaxHelpers.ts";
import { TaxTransactionRecord } from "../../server/ApiServiceStruct/TaxCalcApiService.ts";

export interface TaxCalculationParams {
  invoiceNumber: string;
  grossAmount: number;
  originCountry: string;
  originRegion: string;
  destinationCountry: string;
  destinationRegion: string;
  productTaxCode: string;
  customerId: string;
}

export interface TaxCalculationResponseData {
  transaction: TaxTransactionRecord;
  calculation: TaxCalculationResult;
  economicNexus: {
    has_nexus: boolean;
    sales_volume: number;
    threshold_sales: number;
    sales_threshold_met: boolean;
    transaction_count: number;
    threshold_transactions: number;
    transaction_count_met: boolean;
    sales_progress_pct: number;
    transaction_progress_pct: number;
  };
  syncEventId: string;
}

export const defaultTaxCalcParams: TaxCalculationParams = {
  invoiceNumber: "INV-2026-904",
  grossAmount: 75000,
  originCountry: "US",
  originRegion: "WA",
  destinationCountry: "US",
  destinationRegion: "CA",
  productTaxCode: "DIGITAL_SAAS",
  customerId: "CUST-ENTERPRISE-TECH"
};
