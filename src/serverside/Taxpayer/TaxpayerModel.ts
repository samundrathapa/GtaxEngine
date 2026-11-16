import { IEntityModel } from "../DynamicEntityFactory.ts";

export interface ITaxpayerRecord {
  id: number;
  taxpayer_id?: string;
  taxpayer_code?: string;
  code?: string;
  fullname?: string;
  full_name?: string;
  name?: string;
  pan_number?: string;
  pan_vat_no?: string;
  ward_no?: number;
  phone?: string;
  phone_number?: string;
  mobile?: string;
  mobile_no?: string;
  citizenship_no?: string;
  citizenship_number?: string;
  email?: string;
  gender?: string;
  tole_village?: string;
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
    taxpayer_code: "VARCHAR(50)",
    code: "VARCHAR(50)",
    fullname: "VARCHAR(255)",
    full_name: "VARCHAR(255)",
    name: "VARCHAR(255)",
    pan_number: "VARCHAR(50)",
    pan_vat_no: "VARCHAR(50)",
    ward_no: "INTEGER",
    phone: "VARCHAR(32)",
    phone_number: "VARCHAR(32)",
    mobile: "VARCHAR(32)",
    mobile_no: "VARCHAR(32)",
    citizenship_no: "VARCHAR(50)",
    citizenship_number: "VARCHAR(50)",
    email: "VARCHAR(255)",
    is_active: "BOOLEAN",
    insert_by: "VARCHAR(50)",
    insert_on: "TIMESTAMP",
    update_by: "VARCHAR(50)",
    update_on: "TIMESTAMP"
  }
};
