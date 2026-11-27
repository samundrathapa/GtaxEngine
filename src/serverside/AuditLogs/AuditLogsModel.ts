import { IEntityModel } from "../DynamicEntityFactory.ts";

export interface IAuditLogRecord {
  id: number;
  user_id?: string;
  username_attempt?: string;
  action_type?: string;
  action_name?: string;
  module_name?: string;
  table_name?: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  client_ip?: string;
  ip_address?: string;
  details?: string;
  created_at?: string;
  insert_on?: string;
  [key: string]: any;
}

export const AuditLogsModel: IEntityModel = {
  entityName: "AuditLogs",
  tableName: "tbl_user_log",
  primaryKey: "id",
  columnMappings: {
    id: "INTEGER PRIMARY KEY",
    user_id: "VARCHAR(50)",
    username_attempt: "VARCHAR(200)",
    action_type: "VARCHAR(100)",
    action_name: "VARCHAR(100)",
    module_name: "VARCHAR(100)",
    table_name: "VARCHAR(128)",
    field_name: "VARCHAR(128)",
    old_value: "TEXT",
    new_value: "TEXT",
    client_ip: "VARCHAR(50)",
    ip_address: "VARCHAR(50)",
    details: "TEXT",
    created_at: "TIMESTAMP",
    insert_on: "TIMESTAMP"
  }
};
