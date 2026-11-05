import { IEntityModel } from "../DynamicEntityFactory.ts";

export interface ITaxpayerRecord {
  id: number;
  taxpayer_id?: string;
  fullname?: string;
  full_name?: string;
  pan_number?: string;
  ward_no?: number;
  phone?: string;
  citizenship_no?: string;
  is_active?: boolean;
  insert_by?: string;
  insert_on?: string;
  update_by?: string;
  update_on?: string;
  [key: string]: any;
}

export const TaxpayerModel: IEntityModel = {
  entityName: "Taxpayer",
  tableName: "tbl_taxpayer",
  primaryKey: "id",
  columnMappings: {
    id: "INTEGER PRIMARY KEY",
    taxpayer_id: "VARCHAR(50)",
    fullname: "VARCHAR(255)",
    pan_number: "VARCHAR(50)",
    ward_no: "INTEGER",
    phone: "VARCHAR(20)",
    citizenship_no: "VARCHAR(50)",
    is_active: "BOOLEAN",
    insert_by: "VARCHAR(50)",
    insert_on: "TIMESTAMP",
    update_by: "VARCHAR(50)",
    update_on: "TIMESTAMP"
  }
};
