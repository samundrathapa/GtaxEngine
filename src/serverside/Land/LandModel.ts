import { IEntityModel } from "../DynamicEntityFactory.ts";

export interface ILandRecord {
  id: number;
  taxpayer_id?: number;
  kitta_no?: string;
  kitta_number?: string;
  moth_no?: string;
  moth_number?: string;
  area_sqft?: number;
  area_sqfeet?: number;
  ward_no?: number;
  unit_id?: number;
  land_measuring_unit_id?: number;
  nature_id?: number;
  land_rate_id?: number;
  malpot_rate_id?: number;
  include_in_evaluation?: boolean;
  assessed_valuation?: number;
  is_active?: boolean;
  insert_by?: string;
  insert_on?: string;
  update_by?: string;
  update_on?: string;
  [key: string]: any;
}

export const LandModel: IEntityModel = {
  entityName: "Land",
  tableName: "tbl_land",
  primaryKey: "id",
  columnMappings: {
    id: "INTEGER PRIMARY KEY",
    taxpayer_id: "INTEGER",
    kitta_no: "VARCHAR(50)",
    kitta_number: "VARCHAR(50)",
    moth_no: "VARCHAR(50)",
    moth_number: "VARCHAR(50)",
    area_sqft: "NUMERIC",
    area_sqfeet: "NUMERIC",
    ward_no: "INTEGER",
    unit_id: "INTEGER",
    land_measuring_unit_id: "INTEGER",
    nature_id: "INTEGER",
    land_rate_id: "INTEGER",
    malpot_rate_id: "INTEGER",
    include_in_evaluation: "BOOLEAN",
    assessed_valuation: "NUMERIC",
    is_active: "BOOLEAN",
    insert_by: "VARCHAR(50)",
    insert_on: "TIMESTAMP",
    update_by: "VARCHAR(50)",
    update_on: "TIMESTAMP"
  }
};
