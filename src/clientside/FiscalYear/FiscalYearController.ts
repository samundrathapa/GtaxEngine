import { fiscalYearStoreInstance } from "./FiscalYearStore.ts";
import { IFiscalYearRecord } from "../../serverside/FiscalYear/FiscalYearModel.ts";

export class FiscalYearController {
  static async GetSearchTemplate(query: string = ""): Promise<IFiscalYearRecord[]> {
    fiscalYearStoreInstance.setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/FiscalYear/GetSearchTemplate?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const items = json.data.items || json.data;
        fiscalYearStoreInstance.setState({ fiscalYears: items, loading: false });
        return items;
      }
    } catch (err: any) {
      fiscalYearStoreInstance.setState({ error: err.message, loading: false });
    }
    return [];
  }

  static async GetItemTemplate(id: number | string): Promise<IFiscalYearRecord | null> {
    try {
      const res = await fetch(`/api/FiscalYear/${id}/GetItemTemplate`);
      const json = await res.json();
      if (json.success && json.data) {
        fiscalYearStoreInstance.setState({ selectedFiscalYear: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[FiscalYearController] GetItemTemplate error:", err);
    }
    return null;
  }

  static async GetCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    try {
      const res = await fetch(`/api/FiscalYear/GetCombo`);
      const json = await res.json();
      if (json.success && json.data) {
        fiscalYearStoreInstance.setState({ comboOptions: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[FiscalYearController] GetCombo error:", err);
    }
    return [];
  }

  static async createFiscalYear(formData: Partial<IFiscalYearRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch("/api/FiscalYear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Fiscal year created successfully" };
      }
      return { success: false, message: json.message || "Failed to create fiscal year" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async updateFiscalYear(id: string | number, formData: Partial<IFiscalYearRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/FiscalYear/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Fiscal year updated successfully" };
      }
      return { success: false, message: json.message || "Failed to update fiscal year" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async deleteFiscalYear(id: string | number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/FiscalYear/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Fiscal year deleted successfully" };
      }
      return { success: false, message: json.message || "Failed to delete fiscal year" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }
}
