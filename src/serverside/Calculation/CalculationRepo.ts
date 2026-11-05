import { TableCacheDbSyncService } from "../../server/db/TableCacheDbSyncService.ts";
import { CalculationModel, ICalculationRecord } from "./CalculationModel.ts";

export class CalculationRepo {
  private tableName = CalculationModel.tableName;

  async GetSearchTemplate(queryStr?: string): Promise<ICalculationRecord[]> {
    const list = await TableCacheDbSyncService.getTableData<ICalculationRecord>(this.tableName as any, true);
    if (!queryStr) return list;
    const q = queryStr.toLowerCase();
    return list.filter((item) =>
      String(item.taxpayer_id || "").includes(q) ||
      String(item.fiscal_year_id || "").includes(q) ||
      String(item.net_payable_tax || "").includes(q)
    );
  }

  async GetItemTemplate(id: string | number): Promise<ICalculationRecord | null> {
    const list = await TableCacheDbSyncService.getTableData<ICalculationRecord>(this.tableName as any, true);
    const targetNum = Number(id);
    return list.find((item) => Number(item.id) === targetNum || String(item.id) === String(id)) || null;
  }

  async GetComboTemplate(): Promise<Array<{ id: number; name: string; code?: string }>> {
    const list = await TableCacheDbSyncService.getTableData<ICalculationRecord>(this.tableName as any, true);
    return list.map((item) => ({
      id: Number(item.id),
      name: `Tax Calc #${item.id} (Taxpayer #${item.taxpayer_id || "N/A"})`,
      code: String(item.net_payable_tax || 0)
    }));
  }

  async insert(record: Partial<ICalculationRecord>, userId: string = "1"): Promise<ICalculationRecord> {
    return await TableCacheDbSyncService.insertRecord(this.tableName as any, record, userId);
  }

  async update(id: number | string, record: Partial<ICalculationRecord>, userId: string = "1"): Promise<ICalculationRecord | null> {
    return await TableCacheDbSyncService.updateRecord(this.tableName as any, Number(id), record, userId);
  }

  async delete(id: number | string, userId: string = "1"): Promise<boolean> {
    return await TableCacheDbSyncService.deleteRecord(this.tableName as any, Number(id), userId);
  }
}
