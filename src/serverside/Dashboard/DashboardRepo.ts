import { TableCacheDbSyncService } from "../../server/db/TableCacheDbSyncService.ts";
import { DashboardModel, IDashboardRecord } from "./DashboardModel.ts";

export class DashboardRepo {
  private tableName = DashboardModel.tableName;

  async GetSearchTemplate(queryStr?: string): Promise<IDashboardRecord[]> {
    const tp = await TableCacheDbSyncService.getTableData("tbl_taxpayer", true);
    const lands = await TableCacheDbSyncService.getTableData("tbl_land", true);
    const houses = await TableCacheDbSyncService.getTableData("tbl_house", true);
    const calcs = await TableCacheDbSyncService.getTableData("tax_transactions", true);
    const settings = await TableCacheDbSyncService.getTableData("tbl_application_setting", true);

    const rev = calcs.reduce((acc: number, item: any) => acc + (Number(item.net_payable_tax) || 0), 0);

    const record: IDashboardRecord = {
      id: 1,
      total_taxpayers: tp.length,
      total_properties: lands.length + houses.length,
      total_revenue_collected: rev,
      active_fiscal_year: settings[0]?.fiscal_year_id ? `FY-${settings[0].fiscal_year_id}` : "2081/82",
      system_status: "HEALTHY_LIVE_DB"
    };

    return [record];
  }

  async GetItemTemplate(id: string | number): Promise<IDashboardRecord | null> {
    const records = await this.GetSearchTemplate();
    return records[0] || null;
  }

  async GetComboTemplate(): Promise<Array<{ id: number; name: string; code?: string }>> {
    return [{ id: 1, name: "Municipal Executive Dashboard Metrics", code: "DASH-01" }];
  }

  async insert(record: Partial<IDashboardRecord>, userId: string = "1"): Promise<IDashboardRecord> {
    return { id: 1, ...record };
  }

  async update(id: number | string, record: Partial<IDashboardRecord>, userId: string = "1"): Promise<IDashboardRecord | null> {
    return { id: 1, ...record };
  }

  async delete(id: number | string, userId: string = "1"): Promise<boolean> {
    return true;
  }
}
