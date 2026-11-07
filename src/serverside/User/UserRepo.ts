import { TableCacheDbSyncService } from "../../server/db/TableCacheDbSyncService.ts";
import { UserModel, IUserRecord } from "./UserModel.ts";

export class UserRepo {
  private tableName = UserModel.tableName;

  private sanitizeRecord(item: IUserRecord): IUserRecord {
    if (!item) return item;
    const derivedUsername =
      item.username ||
      (item.email ? item.email.split("@")[0] : "") ||
      item.user_id ||
      `user_${item.id}`;
    const derivedFullname = item.fullname || item.full_name || derivedUsername;
    const derivedUserId = item.user_id || `USR_${item.id}`;
    const derivedRole = item.role || "OPERATOR";
    return {
      ...item,
      username: derivedUsername,
      fullname: derivedFullname,
      full_name: derivedFullname,
      user_id: derivedUserId,
      role: derivedRole
    };
  }

  async GetSearchTemplate(queryStr?: string): Promise<IUserRecord[]> {
    const rawList = await TableCacheDbSyncService.getTableData<IUserRecord>(this.tableName as any, true);
    const list = rawList.map((item) => this.sanitizeRecord(item));
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
    const rawList = await TableCacheDbSyncService.getTableData<IUserRecord>(this.tableName as any, true);
    const targetStr = String(id);
    const targetNum = Number(id);
    const found = rawList.find(
      (item) => Number(item.id) === targetNum || String(item.id) === targetStr || item.user_id === targetStr
    );
    return found ? this.sanitizeRecord(found) : null;
  }

  async GetComboTemplate(): Promise<Array<{ id: number; name: string; code?: string }>> {
    const list = await this.GetSearchTemplate();
    return list.map((item) => ({
      id: Number(item.id),
      name: item.fullname || item.username || `User #${item.id}`,
      code: item.username || item.user_id || item.employee_id || String(item.id)
    }));
  }

  async insert(record: Partial<IUserRecord>, userId: string = "1"): Promise<IUserRecord> {
    const payload = {
      ...record,
      username: record.username || (record.email ? record.email.split("@")[0] : `user_${Date.now()}`),
      fullname: record.fullname || record.full_name || record.username || "New User"
    };
    const created = await TableCacheDbSyncService.insertRecord(this.tableName as any, payload, userId);
    return this.sanitizeRecord(created);
  }

  async update(id: number | string, record: Partial<IUserRecord>, userId: string = "1"): Promise<IUserRecord | null> {
    const updated = await TableCacheDbSyncService.updateRecord(this.tableName as any, Number(id), record, userId);
    return updated ? this.sanitizeRecord(updated) : null;
  }

  async delete(id: number | string, userId: string = "1"): Promise<boolean> {
    return await TableCacheDbSyncService.deleteRecord(this.tableName as any, Number(id), userId);
  }
}
