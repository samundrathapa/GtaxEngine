import { TableCacheDbSyncService } from "../../server/db/TableCacheDbSyncService.ts";
import { CompanyModel, ICompanyRecord } from "./CompanyModel.ts";

export class CompanyRepo {
  private tableName = CompanyModel.tableName;

  async GetSearchTemplate(queryStr?: string): Promise<ICompanyRecord[]> {
    const list = await TableCacheDbSyncService.getTableData<ICompanyRecord>(this.tableName as any, true);
    if (!queryStr) return list;
    const q = queryStr.toLowerCase();
    return list.filter((item) =>
      (item.name || "").toLowerCase().includes(q) ||
      (item.code || "").toLowerCase().includes(q) ||
      (item.email || "").toLowerCase().includes(q)
    );
  }

  async GetItemTemplate(id: string | number): Promise<ICompanyRecord | null> {
    const list = await TableCacheDbSyncService.getTableData<ICompanyRecord>(this.tableName as any, true);
    const targetNum = Number(id);
    return list.find((item) => Number(item.id) === targetNum || String(item.id) === String(id) || item.code === String(id)) || null;
  }

  async GetComboTemplate(): Promise<Array<{ id: number; name: string; code?: string }>> {
    const list = await TableCacheDbSyncService.getTableData<ICompanyRecord>(this.tableName as any, true);
    return list.map((item) => ({
      id: Number(item.id),
      name: item.name || `Company #${item.id}`,
      code: item.code || String(item.id)
    }));
  }

  async insert(record: Partial<ICompanyRecord>, userId: string = "1"): Promise<ICompanyRecord> {
    return await TableCacheDbSyncService.insertRecord(this.tableName as any, record, userId);
  }

  async update(id: number | string, record: Partial<ICompanyRecord>, userId: string = "1"): Promise<ICompanyRecord | null> {
    return await TableCacheDbSyncService.updateRecord(this.tableName as any, Number(id), record, userId);
  }

  async delete(id: number | string, userId: string = "1"): Promise<boolean> {
    return await TableCacheDbSyncService.deleteRecord(this.tableName as any, Number(id), userId);
  }
}
