import { TableCacheDbSyncService } from "../../server/db/TableCacheDbSyncService.ts";
import { UserModel, IUserRecord } from "./UserModel.ts";

export class UserRepo {
  private tableName = UserModel.tableName;

  async GetSearchTemplate(queryStr?: string): Promise<IUserRecord[]> {
    const list = await TableCacheDbSyncService.getTableData<IUserRecord>(this.tableName as any, true);
    if (!queryStr) return list;
    const q = queryStr.toLowerCase();
    return list.filter((item) =>
      (item.fullname || item.full_name || "").toLowerCase().includes(q) ||
      (item.email || "").toLowerCase().includes(q) ||
      (item.username || "").toLowerCase().includes(q) ||
      (item.role || "").toLowerCase().includes(q) ||
      (item.user_id || "").toLowerCase().includes(q)
    );
  }

  async GetItemTemplate(id: string | number): Promise<IUserRecord | null> {
    const list = await TableCacheDbSyncService.getTableData<IUserRecord>(this.tableName as any, true);
    const targetStr = String(id);
    const targetNum = Number(id);
    return list.find((item) => Number(item.id) === targetNum || String(item.id) === targetStr || item.user_id === targetStr) || null;
  }

  async GetComboTemplate(): Promise<Array<{ id: number; name: string; code?: string }>> {
    const list = await TableCacheDbSyncService.getTableData<IUserRecord>(this.tableName as any, true);
    return list.map((item) => ({
      id: Number(item.id),
      name: item.fullname || item.full_name || item.username || `User #${item.id}`,
      code: item.user_id || item.employee_id || String(item.id)
    }));
  }

  async insert(record: Partial<IUserRecord>, userId: string = "1"): Promise<IUserRecord> {
    return await TableCacheDbSyncService.insertRecord(this.tableName as any, record, userId);
  }

  async update(id: number | string, record: Partial<IUserRecord>, userId: string = "1"): Promise<IUserRecord | null> {
    return await TableCacheDbSyncService.updateRecord(this.tableName as any, Number(id), record, userId);
  }

  async delete(id: number | string, userId: string = "1"): Promise<boolean> {
    return await TableCacheDbSyncService.deleteRecord(this.tableName as any, Number(id), userId);
  }
}
