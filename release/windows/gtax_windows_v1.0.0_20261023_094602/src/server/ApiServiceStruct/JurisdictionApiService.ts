import { BaseRepo, AuditFields } from "../BaseFrame/repo/BaseRepo.ts";
import { BaseService } from "../BaseFrame/services/BaseService.ts";
import { BaseCrudController } from "../BaseFrame/controller/BaseCrudController.ts";

export interface JurisdictionRecord extends Partial<AuditFields> {
  id?: string;
  jurisdiction_id: string;
  jurisdiction_code: string;
  jurisdiction_name: string;
  country_iso: string;
  jurisdiction_level: "federal" | "state" | "county" | "city" | "vat_zone";
  default_rate_pct: number;
  nexus_sales_threshold: number;
  nexus_tx_threshold: number;
  is_destination_based: boolean;
}

export class JurisdictionRepo extends BaseRepo<JurisdictionRecord> {
  constructor() {
    super("tax_jurisdictions", "jurisdiction_id");
    // Seed initial jurisdictions
    this.insert(
      {
        jurisdiction_id: "JUR-US-FED",
        jurisdiction_code: "US-FED",
        jurisdiction_name: "United States Federal Government",
        country_iso: "USA",
        jurisdiction_level: "federal",
        default_rate_pct: 0.0,
        nexus_sales_threshold: 0,
        nexus_tx_threshold: 0,
        is_destination_based: true
      },
      "SYSTEM_BOOT"
    );
    this.insert(
      {
        jurisdiction_id: "JUR-US-CA",
        jurisdiction_code: "US-CA",
        jurisdiction_name: "California Department of Tax and Fee Administration (CDTFA)",
        country_iso: "USA",
        jurisdiction_level: "state",
        default_rate_pct: 7.25,
        nexus_sales_threshold: 500000.0,
        nexus_tx_threshold: 200,
        is_destination_based: true
      },
      "SYSTEM_BOOT"
    );
    this.insert(
      {
        jurisdiction_id: "JUR-US-NY",
        jurisdiction_code: "US-NY",
        jurisdiction_name: "New York State Department of Taxation and Finance",
        country_iso: "USA",
        jurisdiction_level: "state",
        default_rate_pct: 4.0,
        nexus_sales_threshold: 500000.0,
        nexus_tx_threshold: 100,
        is_destination_based: true
      },
      "SYSTEM_BOOT"
    );
    this.insert(
      {
        jurisdiction_id: "JUR-GB-HMRC",
        jurisdiction_code: "GB-HMRC",
        jurisdiction_name: "United Kingdom HM Revenue & Customs (HMRC)",
        country_iso: "GBR",
        jurisdiction_level: "vat_zone",
        default_rate_pct: 20.0,
        nexus_sales_threshold: 85000.0,
        nexus_tx_threshold: 1,
        is_destination_based: true
      },
      "SYSTEM_BOOT"
    );
    this.insert(
      {
        jurisdiction_id: "JUR-DE-BZST",
        jurisdiction_code: "DE-BZST",
        jurisdiction_name: "Germany Bundeszentralamt für Steuern (BZSt)",
        country_iso: "DEU",
        jurisdiction_level: "vat_zone",
        default_rate_pct: 19.0,
        nexus_sales_threshold: 10000.0,
        nexus_tx_threshold: 1,
        is_destination_based: true
      },
      "SYSTEM_BOOT"
    );
  }
}

export class JurisdictionService extends BaseService<JurisdictionRecord> {
  constructor() {
    super(new JurisdictionRepo(), "gtax:jurisdictions");
  }
}

export class JurisdictionApiService extends BaseCrudController<JurisdictionRecord> {
  constructor() {
    super("/api/v1/jurisdictions", new JurisdictionService(), ["admin", "tax_manager"]);
  }
}

export const jurisdictionApiServiceInstance = new JurisdictionApiService();
