import { IEntityModel } from "../DynamicEntityFactory.ts";

export interface ICalculationRecord {
  id: number;
  taxpayer_id?: number;
  fiscal_year_id?: number;
  total_land_valuation?: number;
  total_house_valuation?: number;
  net_payable_tax?: number;
  created_at?: string;
  [key: string]: any;
}

export const CalculationModel: IEntityModel = {
  entityName: "Calculation",
  tableName: "tax_transactions",
  primaryKey: "id",
  columnMappings: {
    id: "INTEGER PRIMARY KEY",
    taxpayer_id: "INTEGER",
    fiscal_year_id: "INTEGER",
    total_land_valuation: "NUMERIC",
    total_house_valuation: "NUMERIC",
    net_payable_tax: "NUMERIC",
    created_at: "TIMESTAMP"
  }
};
