export type ReportFormat = "pdf" | "excel" | "html" | "csv";

export interface ReportConfig {
  title: string;
  format: ReportFormat;
  includeAuditColumns: boolean;
  jurisdictionFilter: string;
}

export const initialReportConfig: ReportConfig = {
  title: "Gtax Enterprise Multi-Jurisdictional Tax Liabilities Summary",
  format: "csv",
  includeAuditColumns: true,
  jurisdictionFilter: "ALL"
};
