import { IEntityModel } from "../DynamicEntityFactory.ts";

export interface IUserRecord {
  id: number;
  user_id?: string;
  username?: string;
  fullname?: string;
  full_name?: string;
  email?: string;
  role?: string;
  mobile?: string;
  employee_id?: string;
  is_active?: boolean;
  insert_by?: string;
  insert_on?: string;
  update_by?: string;
  update_on?: string;
  [key: string]: any;
}

export const UserModel: IEntityModel = {
  entityName: "User",
  tableName: "tbl_user",
  primaryKey: "id",
  columnMappings: {
    id: "INTEGER PRIMARY KEY",
    user_id: "VARCHAR(50)",
    username: "VARCHAR(100)",
    fullname: "VARCHAR(255)",
    email: "VARCHAR(150)",
    password_hash: "VARCHAR(255)",
    role: "VARCHAR(50)",
    mobile: "VARCHAR(20)",
    employee_id: "VARCHAR(50)",
    is_active: "BOOLEAN",
    insert_by: "VARCHAR(50)",
    insert_on: "TIMESTAMP",
    update_by: "VARCHAR(50)",
    update_on: "TIMESTAMP"
  }
};
