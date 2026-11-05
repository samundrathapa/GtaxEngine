import { TableCacheDbSyncService } from "../../server/db/TableCacheDbSyncService.ts";
import { ConstructionTypesModel, IConstructionTypeRecord } from "./ConstructionTypesModel.ts";

export class ConstructionTypesRepo {
  private tableName = ConstructionTypesModel.tableName;

  async GetSearchTemplate(queryStr?: string): Promise<IConstructionTypeRecord[]> {
    const list = await TableCacheDbSyncService.getTableData<IConstructionTypeRecord>(this.tableName as any, true);
    if (!queryStr) return list;
    const q = queryStr.toLowerCase();
    return list.filter((item) =>
      (item.code || "").toLowerCase().includes(q) ||
      (item.name || "").toLowerCase().includes(q)
    );
  }

  async GetItemTemplate(id: string | number): Promise<IConstructionTypeRecord | null> {
    const list = await TableCacheDbSyncService.getTableData<IConstructionTypeRecord>(this.tableName as any, true);
    const targetNum = Number(id);
    return list.find((item) => Number(item.id) === targetNum || String(item.id) === String(id) || item.code === String(id)) || null;
  }

  async GetComboTemplate(): Promise<Array<{ id: number; name: string; code?: string }>> {
    const list = await TableCacheDbSyncService.getTableData<IConstructionTypeRecord>(this.tableName as any, true);
    return list.map((item) => ({
      id: Number(item.id),
      name: item.name || `Construction Type #${item.id}`,
      code: item.code || String(item.id)
    }));
  }

  async insert(record: Partial<IConstructionTypeRecord>, userId: string = "1"): Promise<IConstructionTypeRecord> {
    return await TableCacheDbSyncService.insertRecord(this.tableName as any, record, userId);
  }

  async update(id: number | string, record: Partial<IConstructionTypeRecord>, userId: string = "1"): Promise<IConstructionTypeRecord | null> {
    return await TableCacheDbSyncService.updateRecord(this.tableName as any, Number(id), record, userId);
  }

  async delete(id: number | string, userId: string = "1"): Promise<boolean> {
    return await TableCacheDbSyncService.deleteRecord(this.tableName as any, Number(id), userId);
  }
}
