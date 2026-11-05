import { IEntityModel } from "../DynamicEntityFactory.ts";

export interface IDashboardRecord {
  id: number;
  total_taxpayers?: number;
  total_properties?: number;
  total_revenue_collected?: number;
  active_fiscal_year?: string;
  system_status?: string;
  [key: string]: any;
}

export const DashboardModel: IEntityModel = {
  entityName: "Dashboard",
  tableName: "tbl_application_setting",
  primaryKey: "id",
  columnMappings: {
    id: "INTEGER PRIMARY KEY",
    total_taxpayers: "INTEGER",
    total_properties: "INTEGER",
    total_revenue_collected: "NUMERIC",
    active_fiscal_year: "VARCHAR(50)",
    system_status: "VARCHAR(50)"
  }
};
