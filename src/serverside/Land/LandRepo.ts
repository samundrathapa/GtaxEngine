import { TableCacheDbSyncService } from "../../server/db/TableCacheDbSyncService.ts";
import { LandModel, ILandRecord } from "./LandModel.ts";

export class LandRepo {
  private tableName = LandModel.tableName;

  async GetSearchTemplate(queryStr?: string): Promise<ILandRecord[]> {
    const list = await TableCacheDbSyncService.getTableData<ILandRecord>(this.tableName as any, true);
    if (!queryStr) return list;
    const q = queryStr.toLowerCase();
    return list.filter((item) =>
      (item.kitta_no || "").toLowerCase().includes(q) ||
      String(item.ward_no || "").includes(q) ||
      String(item.taxpayer_id || "").includes(q)
    );
  }

  async GetItemTemplate(id: string | number): Promise<ILandRecord | null> {
    const list = await TableCacheDbSyncService.getTableData<ILandRecord>(this.tableName as any, true);
    const targetNum = Number(id);
    return list.find((item) => Number(item.id) === targetNum || String(item.id) === String(id)) || null;
  }

  async GetComboTemplate(): Promise<Array<{ id: number; name: string; code?: string }>> {
    const list = await TableCacheDbSyncService.getTableData<ILandRecord>(this.tableName as any, true);
    return list.map((item) => ({
      id: Number(item.id),
      name: `Land Kitta #${item.kitta_no || item.id} (Ward ${item.ward_no || 1})`,
      code: String(item.kitta_no || item.id)
    }));
  }

  async insert(record: Partial<ILandRecord>, userId: string = "1"): Promise<ILandRecord> {
    return await TableCacheDbSyncService.insertRecord(this.tableName as any, record, userId);
  }

  async update(id: number | string, record: Partial<ILandRecord>, userId: string = "1"): Promise<ILandRecord | null> {
    return await TableCacheDbSyncService.updateRecord(this.tableName as any, Number(id), record, userId);
  }

  async delete(id: number | string, userId: string = "1"): Promise<boolean> {
    return await TableCacheDbSyncService.deleteRecord(this.tableName as any, Number(id), userId);
  }
}
