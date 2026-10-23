import { BaseRepo, AuditFields } from "../BaseFrame/repo/BaseRepo.ts";
import { BaseService } from "../BaseFrame/services/BaseService.ts";
import { BaseCrudController } from "../BaseFrame/controller/BaseCrudController.ts";
import { TaxHelpers, TaxRuleDefinition, TaxCalculationResult } from "../BaseFrame/helpers/TaxHelpers.ts";
import { ApiResponse, IApiResponse } from "../BaseFrame/response/ApiResponse.ts";
import { syncEventApiServiceInstance } from "./SyncEventApiService.ts";

export interface TaxTransactionRecord extends Partial<AuditFields> {
  id?: string;
  transaction_id: string;
  invoice_number: string;
  customer_id: string;
  origin_country: string;
  origin_region: string;
  destination_country: string;
  destination_region: string;
  gross_amount: number;
  taxable_amount: number;
  total_tax_amount: number;
  effective_rate_pct: number;
  sync_status: "PENDING" | "SYNCED" | "CONFLICT" | "RECONCILED";
  line_breakdowns: any[];
}

export class TaxTransactionRepo extends BaseRepo<TaxTransactionRecord> {
  constructor() {
    super("tax_transactions", "transaction_id");
    // Seed initial calculation transactions
    this.insert(
      {
        transaction_id: "TX-2026-8801",
        invoice_number: "INV-US-CA-9921",
        customer_id: "CUST-ACME-CORP",
        origin_country: "US",
        origin_region: "WA",
        destination_country: "US",
        destination_region: "CA",
        gross_amount: 150000.0,
        taxable_amount: 150000.0,
        total_tax_amount: 13875.0,
        effective_rate_pct: 9.25,
        sync_status: "SYNCED",
        line_breakdowns: [
          { jurisdiction: "US-FED", rate: 0.0, tax: 0.0 },
          { jurisdiction: "CA-STATE", rate: 7.25, tax: 10875.0 },
          { jurisdiction: "SF-COUNTY-DIST", rate: 2.0, tax: 3000.0 }
        ]
      },
      "SYSTEM_BOOT"
    );
    this.insert(
      {
        transaction_id: "TX-2026-8802",
        invoice_number: "INV-EU-GER-4109",
        customer_id: "CUST-SIEMENS-AG",
        origin_country: "US",
        origin_region: "NY",
        destination_country: "DE",
        destination_region: "BER",
        gross_amount: 84000.0,
        taxable_amount: 84000.0,
        total_tax_amount: 15960.0,
        effective_rate_pct: 19.0,
        sync_status: "SYNCED",
        line_breakdowns: [
          { jurisdiction: "DE-STANDARD-VAT", rate: 19.0, tax: 15960.0 }
        ]
      },
      "SYSTEM_BOOT"
    );
  }
}

export class TaxCalcService extends BaseService<TaxTransactionRecord> {
  constructor() {
    super(new TaxTransactionRepo(), "gtax:tax_transactions");
  }

  async calculateAndPersistLiability(
    params: {
      invoiceNumber: string;
      grossAmount: number;
      originCountry: string;
      originRegion: string;
      destinationCountry: string;
      destinationRegion: string;
      productTaxCode: string;
      customerId?: string;
    },
    userId: string
  ): Promise<IApiResponse<{
    transaction: TaxTransactionRecord;
    calculation: TaxCalculationResult;
    economicNexus: any;
    syncEventId: string;
  }>> {
    // Determine active jurisdictional rules dynamically
    const rules: TaxRuleDefinition[] = [];

    if (params.destinationCountry === "US") {
      // Federal tax is typically 0 for sales tax, but excise/DST may apply
      if (params.productTaxCode === "TELECOM_EXCISE") {
        rules.push({
          rule_id: "RULE_US_FED_EXCISE",
          jurisdiction_code: "US-FED",
          jurisdiction_name: "United States Federal Communications Excise",
          jurisdiction_type: "federal",
          rate_percentage: 3.0
        });
      }

      // State Level
      const stateRates: Record<string, number> = {
        CA: 7.25,
        NY: 4.0,
        TX: 6.25,
        WA: 6.5,
        IL: 6.25,
        FL: 6.0
      };
      const stateRate = stateRates[params.destinationRegion] || 5.0;
      rules.push({
        rule_id: `RULE_US_STATE_${params.destinationRegion}`,
        jurisdiction_code: `US-${params.destinationRegion}`,
        jurisdiction_name: `${params.destinationRegion} State Sales & Use Tax`,
        jurisdiction_type: "state",
        rate_percentage: stateRate
      });

      // Municipal / County District Level
      const localRates: Record<string, number> = {
        CA: 2.25, // Los Angeles / SF Bay Transit
        NY: 4.875, // NYC Municipal + Metropolitan Commuter Transportation District
        TX: 2.0, // Austin / Dallas Transit District
        WA: 3.6, // Seattle Regional Transit
        IL: 4.0, // Chicago Home Rule Sales Tax
        FL: 1.5 // Miami-Dade Surtax
      };
      const localRate = localRates[params.destinationRegion] || 1.5;
      rules.push({
        rule_id: `RULE_US_LOCAL_${params.destinationRegion}`,
        jurisdiction_code: `US-${params.destinationRegion}-LOCAL`,
        jurisdiction_name: `${params.destinationRegion} County Transit & Municipal District Surcharge`,
        jurisdiction_type: "municipal",
        rate_percentage: localRate
      });
    } else if (params.destinationCountry === "GB") {
      rules.push({
        rule_id: "RULE_UK_STANDARD_VAT",
        jurisdiction_code: "GB-HMRC-VAT",
        jurisdiction_name: "United Kingdom HM Revenue & Customs Standard VAT",
        jurisdiction_type: "vat_zone",
        rate_percentage: 20.0
      });
    } else if (params.destinationCountry === "DE") {
      rules.push({
        rule_id: "RULE_DE_UST_VAT",
        jurisdiction_code: "DE-BZST-VAT",
        jurisdiction_name: "Germany Umsatzsteuer (USt) Standard VAT",
        jurisdiction_type: "vat_zone",
        rate_percentage: 19.0
      });
    } else if (params.destinationCountry === "JP") {
      rules.push({
        rule_id: "RULE_JP_CONSUMPTION_TAX",
        jurisdiction_code: "JP-NTA-JCT",
        jurisdiction_name: "Japan National Tax Agency Japanese Consumption Tax (JCT)",
        jurisdiction_type: "vat_zone",
        rate_percentage: 10.0
      });
    } else {
      // General cross-border digital goods threshold
      rules.push({
        rule_id: "RULE_INTL_CROSSBORDER_VAT",
        jurisdiction_code: `${params.destinationCountry}-GEN-VAT`,
        jurisdiction_name: `${params.destinationCountry} Cross-Border Destination Digital Goods Tax`,
        jurisdiction_type: "vat_zone",
        rate_percentage: 12.0
      });
    }

    const calculation = TaxHelpers.calculateCompoundLiability(params.grossAmount, rules);
    const nexus = TaxHelpers.evaluateEconomicNexus(params.grossAmount * 8, 38);

    const txId = `TX-${Date.now().toString(36).toUpperCase()}`;
    const txRecord: TaxTransactionRecord = {
      transaction_id: txId,
      invoice_number: params.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      customer_id: params.customerId || "CUST-GLOBAL-CORP",
      origin_country: params.originCountry,
      origin_region: params.originRegion,
      destination_country: params.destinationCountry,
      destination_region: params.destinationRegion,
      gross_amount: params.grossAmount,
      taxable_amount: params.grossAmount,
      total_tax_amount: calculation.total_tax_liability,
      effective_rate_pct: calculation.net_effective_tax_rate,
      sync_status: "SYNCED",
      line_breakdowns: calculation.jurisdiction_breakdown
    };

    // Store in BaseRepo with mandatory audit columns
    await this.repo.insert(txRecord, userId);

    // Trigger real-time sync event into CDC bus
    const syncEvent = await syncEventApiServiceInstance.getService().create(
      {
        event_id: `EVT_SYNC_${txId}`,
        aggregate_type: "tax_liability",
        aggregate_id: txId,
        event_version: 1,
        event_type: "LIABILITY_CALCULATED_AND_COMMITTED",
        source_service: "gtax-tax-calc-engine",
        target_jurisdictions: rules.map((r) => r.jurisdiction_code),
        payload: {
          invoice: txRecord.invoice_number,
          gross: txRecord.gross_amount,
          tax: txRecord.total_tax_amount,
          effectiveRate: txRecord.effective_rate_pct
        },
        checksum_hash: `sha256_${Date.now()}`,
        status: "DELIVERED"
      },
      userId
    );

    return ApiResponse.buildSuccess(
      {
        transaction: txRecord,
        calculation,
        economicNexus: nexus,
        syncEventId: syncEvent.data?.event_id || "EVT_EMITTED"
      },
      `Successfully calculated complex tax liability: $${calculation.total_tax_liability.toLocaleString()} (${calculation.net_effective_tax_rate}% effective rate)`
    );
  }
}

export class TaxCalcApiService extends BaseCrudController<TaxTransactionRecord> {
  constructor() {
    super("/api/v1/tax-calc", new TaxCalcService(), ["admin", "tax_manager", "tax_analyst"]);
  }

  async calculateTax(params: any, authHeader?: string) {
    const user = this.authenticate(authHeader);
    if (!user) return ApiResponse.buildFailure("Unauthorized: Bearer token required", [], {}, 401);
    const service = this.service as TaxCalcService;
    return service.calculateAndPersistLiability(params, user.user_id);
  }
}

export const taxCalcApiServiceInstance = new TaxCalcApiService();
