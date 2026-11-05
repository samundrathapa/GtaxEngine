import { dashboardStoreInstance } from "./DashboardStore.ts";
import { IDashboardRecord } from "../../serverside/Dashboard/DashboardModel.ts";

export class DashboardController {
  static async GetSearchTemplate(query: string = ""): Promise<IDashboardRecord | null> {
    dashboardStoreInstance.setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/Dashboard/GetSearchTemplate?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const item = Array.isArray(json.data.items) ? json.data.items[0] : json.data;
        dashboardStoreInstance.setState({ metrics: item, loading: false });
        return item;
      }
    } catch (err: any) {
      dashboardStoreInstance.setState({ error: err.message, loading: false });
    }
    return null;
  }

  static async GetItemTemplate(id: number | string = 1): Promise<IDashboardRecord | null> {
    try {
      const res = await fetch(`/api/Dashboard/${id}/GetItemTemplate`);
      const json = await res.json();
      if (json.success && json.data) {
        dashboardStoreInstance.setState({ metrics: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[DashboardController] GetItemTemplate error:", err);
    }
    return null;
  }

  static async GetCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    try {
      const res = await fetch(`/api/Dashboard/GetCombo`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (err: any) {
      console.error("[DashboardController] GetCombo error:", err);
    }
    return [];
  }
}
