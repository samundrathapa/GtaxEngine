import { auditLogsStoreInstance } from "./AuditLogsStore.ts";
import { IAuditLogRecord } from "../../serverside/AuditLogs/AuditLogsModel.ts";

export class AuditLogsController {
  static async GetSearchTemplate(query: string = ""): Promise<IAuditLogRecord[]> {
    auditLogsStoreInstance.setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/AuditLogs/GetSearchTemplate?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const items = json.data.items || json.data;
        auditLogsStoreInstance.setState({ logs: items, loading: false });
        return items;
      }
    } catch (err: any) {
      auditLogsStoreInstance.setState({ error: err.message, loading: false });
    }
    return [];
  }

  static async GetItemTemplate(id: number | string): Promise<IAuditLogRecord | null> {
    try {
      const res = await fetch(`/api/AuditLogs/${id}/GetItemTemplate`);
      const json = await res.json();
      if (json.success && json.data) {
        auditLogsStoreInstance.setState({ selectedLog: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[AuditLogsController] GetItemTemplate error:", err);
    }
    return null;
  }

  static async GetCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    try {
      const res = await fetch(`/api/AuditLogs/GetCombo`);
      const json = await res.json();
      if (json.success && json.data) {
        auditLogsStoreInstance.setState({ comboOptions: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[AuditLogsController] GetCombo error:", err);
    }
    return [];
  }
}
