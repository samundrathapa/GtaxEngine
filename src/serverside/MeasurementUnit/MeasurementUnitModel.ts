import { IEntityModel } from "../DynamicEntityFactory.ts";

export interface IMeasurementUnitRecord {
  id: number;
  code?: string;
  name?: string;
  symbol?: string;
  is_active?: boolean;
  insert_by?: string;
  insert_on?: string;
  update_by?: string;
  update_on?: string;
  [key: string]: any;
}

export const MeasurementUnitModel: IEntityModel = {
  entityName: "MeasurementUnit",
  tableName: "tbl_unit",
  primaryKey: "id",
  columnMappings: {
    id: "INTEGER PRIMARY KEY",
    code: "VARCHAR(50)",
    name: "VARCHAR(100)",
    symbol: "VARCHAR(50)",
    is_active: "BOOLEAN",
    insert_by: "VARCHAR(50)",
    insert_on: "TIMESTAMP",
    update_by: "VARCHAR(50)",
    update_on: "TIMESTAMP"
  }
};
