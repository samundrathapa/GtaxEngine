import { IEntityModel } from "../DynamicEntityFactory.ts";

export interface IConstructionTypeRecord {
  id: number;
  code?: string;
  name?: string;
  depreciation_rate?: number;
  is_active?: boolean;
  insert_by?: string;
  insert_on?: string;
  update_by?: string;
  update_on?: string;
  [key: string]: any;
}

export const ConstructionTypesModel: IEntityModel = {
  entityName: "ConstructionTypes",
  tableName: "tbl_construction_type",
  primaryKey: "id",
  columnMappings: {
    id: "INTEGER PRIMARY KEY",
    code: "VARCHAR(50)",
    name: "VARCHAR(100)",
    depreciation_rate: "NUMERIC",
    is_active: "BOOLEAN",
    insert_by: "VARCHAR(50)",
    insert_on: "TIMESTAMP",
    update_by: "VARCHAR(50)",
    update_on: "TIMESTAMP"
  }
};
