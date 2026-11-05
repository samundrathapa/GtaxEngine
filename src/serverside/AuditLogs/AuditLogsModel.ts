import { IEntityModel } from "../DynamicEntityFactory.ts";

export interface IAuditLogRecord {
  id: number;
  user_id?: string;
  action_type?: string;
  module_name?: string;
  client_ip?: string;
  details?: string;
  created_at?: string;
  [key: string]: any;
}

export const AuditLogsModel: IEntityModel = {
  entityName: "AuditLogs",
  tableName: "tbl_user_log",
  primaryKey: "id",
  columnMappings: {
    id: "INTEGER PRIMARY KEY",
    user_id: "VARCHAR(50)",
    action_type: "VARCHAR(100)",
    module_name: "VARCHAR(100)",
    client_ip: "VARCHAR(50)",
    details: "TEXT",
    created_at: "TIMESTAMP"
  }
};
