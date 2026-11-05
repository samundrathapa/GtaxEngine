import { TableCacheDbSyncService } from "../../server/db/TableCacheDbSyncService.ts";
import { AuditLogsModel, IAuditLogRecord } from "./AuditLogsModel.ts";

export class AuditLogsRepo {
  private tableName = AuditLogsModel.tableName;

  async GetSearchTemplate(queryStr?: string): Promise<IAuditLogRecord[]> {
    const list = await TableCacheDbSyncService.getTableData<IAuditLogRecord>(this.tableName as any, true);
    if (!queryStr) return list;
    const q = queryStr.toLowerCase();
    return list.filter((item) =>
      (item.action_type || "").toLowerCase().includes(q) ||
      (item.module_name || "").toLowerCase().includes(q) ||
      (item.client_ip || "").toLowerCase().includes(q) ||
      String(item.user_id || "").toLowerCase().includes(q)
    );
  }

  async GetItemTemplate(id: string | number): Promise<IAuditLogRecord | null> {
    const list = await TableCacheDbSyncService.getTableData<IAuditLogRecord>(this.tableName as any, true);
    const targetNum = Number(id);
    return list.find((item) => Number(item.id) === targetNum || String(item.id) === String(id)) || null;
  }

  async GetComboTemplate(): Promise<Array<{ id: number; name: string; code?: string }>> {
    const list = await TableCacheDbSyncService.getTableData<IAuditLogRecord>(this.tableName as any, true);
    return list.map((item) => ({
      id: Number(item.id),
      name: `${item.action_type || "LOG"} by User #${item.user_id || "SYSTEM"}`,
      code: item.client_ip || String(item.id)
    }));
  }

  async insert(record: Partial<IAuditLogRecord>, userId: string = "1"): Promise<IAuditLogRecord> {
    return await TableCacheDbSyncService.insertRecord(this.tableName as any, record, userId);
  }

  async update(id: number | string, record: Partial<IAuditLogRecord>, userId: string = "1"): Promise<IAuditLogRecord | null> {
    return await TableCacheDbSyncService.updateRecord(this.tableName as any, Number(id), record, userId);
  }

  async delete(id: number | string, userId: string = "1"): Promise<boolean> {
    return await TableCacheDbSyncService.deleteRecord(this.tableName as any, Number(id), userId);
  }
}
