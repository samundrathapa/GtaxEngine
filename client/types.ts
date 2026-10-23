/**
 * gtax Enterprise - Next.js Client Tier Type Definitions
 * 100% Next.js 15+ / React 19 Client Specifications
 */

export interface TierStatus {
  tier: "client" | "server" | "ai" | "mobileapp";
  name: string;
  status: "online" | "degraded" | "offline";
  entryPoint: string;
  technologies: string[];
  features: string[];
}

export interface ClientAppConfig {
  appName: string;
  version: string;
  apiBaseUrl: string;
  singleCommonEntry: string;
  flutterDeploymentReady: boolean;
  framework: "Next.js 15 App Router / React 19";
}

export interface NextLayoutProps {
  children: React.ReactNode;
}

export interface ClientApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  data: T;
  message?: string;
  validation_errors?: Record<string, string[]>;
  timestamp?: string;
}

export interface TaxpayerRecord {
  taxpayer_id: string;
  taxpayer_code: string;
  full_name: string;
  pan_number?: string;
  citizenship_number?: string;
  phone_number: string;
  email_address?: string;
  ward_no: number;
  tole_village?: string;
  registered_date?: string;
  is_active: boolean;
  insert_by?: string;
  insert_on?: string;
  update_by?: string;
  update_on?: string;
}

export interface PropertyRecord {
  property_id: string;
  taxpayer_id: string;
  property_code: string;
  property_type: string;
  ward_no: number;
  kitta_no: string;
  total_area_sqft: number;
  estimated_market_value: number;
  assessed_taxable_value: number;
  is_active: boolean;
}

export interface CalculationResult {
  calc_id: string;
  taxpayer_id: string;
  property_id?: string;
  fiscal_year: string;
  land_valuation: number;
  building_valuation: number;
  total_valuation: number;
  base_tax_rate: number;
  gross_tax: number;
  rebate_amount: number;
  penalty_amount: number;
  cess_levy: number;
  net_payable_tax: number;
  status: "DRAFT" | "FINALIZED" | "PAID";
}

export interface VoiceCommandAction {
  command: string;
  intent: "NAVIGATE_TAXPAYER" | "CLOSE_CHAT" | "LIST_TODAY_TAXPAYERS" | "INSERT_LAND_RATE" | "CALCULATE_TAX" | "UNKNOWN";
  parameters?: Record<string, unknown>;
  autoExecuted: boolean;
  speechResponse: string;
}
