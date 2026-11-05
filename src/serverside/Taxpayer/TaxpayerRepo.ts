import { TableCacheDbSyncService } from "../../server/db/TableCacheDbSyncService.ts";
import { TaxpayerModel, ITaxpayerRecord } from "./TaxpayerModel.ts";

export class TaxpayerRepo {
  private tableName = TaxpayerModel.tableName;

  async GetSearchTemplate(queryStr?: string): Promise<ITaxpayerRecord[]> {
    const list = await TableCacheDbSyncService.getTableData<ITaxpayerRecord>(this.tableName as any, true);
    if (!queryStr) return list;
    const q = queryStr.toLowerCase();
    return list.filter((item) =>
      (item.fullname || item.full_name || "").toLowerCase().includes(q) ||
      (item.pan_number || "").toLowerCase().includes(q) ||
      (item.taxpayer_id || "").toLowerCase().includes(q) ||
      String(item.ward_no || "").includes(q)
    );
  }

  async GetItemTemplate(id: string | number): Promise<ITaxpayerRecord | null> {
    const list = await TableCacheDbSyncService.getTableData<ITaxpayerRecord>(this.tableName as any, true);
    const targetStr = String(id);
    const targetNum = Number(id);
    return list.find((item) => Number(item.id) === targetNum || String(item.id) === targetStr || item.taxpayer_id === targetStr) || null;
  }

  async GetComboTemplate(): Promise<Array<{ id: number; name: string; code?: string }>> {
    const list = await TableCacheDbSyncService.getTableData<ITaxpayerRecord>(this.tableName as any, true);
    return list.map((item) => ({
      id: Number(item.id),
      name: item.fullname || item.full_name || `Taxpayer #${item.id}`,
      code: item.taxpayer_id || item.pan_number || String(item.id)
    }));
  }

  async insert(record: Partial<ITaxpayerRecord>, userId: string = "1"): Promise<ITaxpayerRecord> {
    return await TableCacheDbSyncService.insertRecord(this.tableName as any, record, userId);
  }

  async update(id: number | string, record: Partial<ITaxpayerRecord>, userId: string = "1"): Promise<ITaxpayerRecord | null> {
    return await TableCacheDbSyncService.updateRecord(this.tableName as any, Number(id), record, userId);
  }

  async delete(id: number | string, userId: string = "1"): Promise<boolean> {
    return await TableCacheDbSyncService.deleteRecord(this.tableName as any, Number(id), userId);
  }
}
