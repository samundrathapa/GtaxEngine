import { IEntityModel } from "../DynamicEntityFactory.ts";

export interface ICompanyRecord {
  id: number;
  code?: string;
  name?: string;
  company_name?: string;
  fullname?: string;
  address?: string;
  phone?: string;
  phone_number?: string;
  mobile?: string;
  email?: string;
  pan_no?: string;
  pan_number?: string;
  is_active?: boolean;
  insert_by?: string;
  insert_on?: string;
  update_by?: string;
  update_on?: string;
  [key: string]: any;
}

export const CompanyModel: IEntityModel = {
  entityName: "Company",
  tableName: "tbl_company",
  primaryKey: "id",
  columnMappings: {
    id: "INTEGER PRIMARY KEY",
    code: "VARCHAR(50)",
    name: "VARCHAR(255)",
    company_name: "VARCHAR(255)",
    fullname: "VARCHAR(255)",
    address: "VARCHAR(255)",
    phone: "VARCHAR(50)",
    phone_number: "VARCHAR(50)",
    mobile: "VARCHAR(50)",
    email: "VARCHAR(150)",
    pan_no: "VARCHAR(50)",
    pan_number: "VARCHAR(50)",
    is_active: "BOOLEAN",
    insert_by: "VARCHAR(50)",
    insert_on: "TIMESTAMP",
    update_by: "VARCHAR(50)",
    update_on: "TIMESTAMP"
  }
};
