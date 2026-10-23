import { JurisdictionRecord } from "../../server/ApiServiceStruct/JurisdictionApiService.ts";

export type JurisdictionLevel = "federal" | "state" | "county" | "city" | "vat_zone";

export interface JurisdictionFormData {
  jurisdiction_code: string;
  jurisdiction_name: string;
  country_iso: string;
  jurisdiction_level: JurisdictionLevel;
  default_rate_pct: number;
  nexus_sales_threshold: number;
  nexus_tx_threshold: number;
  is_destination_based: boolean;
}

export const initialJurisdictionForm: JurisdictionFormData = {
  jurisdiction_code: "",
  jurisdiction_name: "",
  country_iso: "USA",
  jurisdiction_level: "state",
  default_rate_pct: 6.0,
  nexus_sales_threshold: 100000,
  nexus_tx_threshold: 200,
  is_destination_based: true
};
