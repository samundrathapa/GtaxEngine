import { TableCacheDbSyncService } from "../../server/db/TableCacheDbSyncService.ts";
import { LandNatureModel, ILandNatureRecord } from "./LandNatureModel.ts";

export class LandNatureRepo {
  private tableName = LandNatureModel.tableName;

  async GetSearchTemplate(queryStr?: string): Promise<ILandNatureRecord[]> {
    const list = await TableCacheDbSyncService.getTableData<ILandNatureRecord>(this.tableName as any, true);
    if (!queryStr) return list;
    const q = queryStr.toLowerCase();
    return list.filter((item) =>
      (item.code || "").toLowerCase().includes(q) ||
      (item.name || "").toLowerCase().includes(q)
    );
  }

  async GetItemTemplate(id: string | number): Promise<ILandNatureRecord | null> {
    const list = await TableCacheDbSyncService.getTableData<ILandNatureRecord>(this.tableName as any, true);
    const targetNum = Number(id);
    return list.find((item) => Number(item.id) === targetNum || String(item.id) === String(id) || item.code === String(id)) || null;
  }

  async GetComboTemplate(): Promise<Array<{ id: number; name: string; code?: string }>> {
    const list = await TableCacheDbSyncService.getTableData<ILandNatureRecord>(this.tableName as any, true);
    return list.map((item) => ({
      id: Number(item.id),
      name: item.name || `Land Nature #${item.id}`,
      code: item.code || String(item.id)
    }));
  }

  async insert(record: Partial<ILandNatureRecord>, userId: string = "1"): Promise<ILandNatureRecord> {
    return await TableCacheDbSyncService.insertRecord(this.tableName as any, record, userId);
  }

  async update(id: number | string, record: Partial<ILandNatureRecord>, userId: string = "1"): Promise<ILandNatureRecord | null> {
    return await TableCacheDbSyncService.updateRecord(this.tableName as any, Number(id), record, userId);
  }

  async delete(id: number | string, userId: string = "1"): Promise<boolean> {
    return await TableCacheDbSyncService.deleteRecord(this.tableName as any, Number(id), userId);
  }
}
