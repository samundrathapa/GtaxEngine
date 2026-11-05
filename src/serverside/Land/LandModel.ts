import { IEntityModel } from "../DynamicEntityFactory.ts";

export interface ILandRecord {
  id: number;
  taxpayer_id?: number;
  kitta_no?: string;
  area_sqft?: number;
  ward_no?: number;
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
    area_sqft: "NUMERIC",
    ward_no: "INTEGER",
    insert_by: "VARCHAR(50)",
    insert_on: "TIMESTAMP",
    update_by: "VARCHAR(50)",
    update_on: "TIMESTAMP"
  }
};
