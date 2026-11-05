import { taxpayerStoreInstance } from "./TaxpayerStore.ts";
import { ITaxpayerRecord } from "../../serverside/Taxpayer/TaxpayerModel.ts";

export class TaxpayerController {
  static async GetSearchTemplate(query: string = ""): Promise<ITaxpayerRecord[]> {
    taxpayerStoreInstance.setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/Taxpayer/GetSearchTemplate?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const items = json.data.items || json.data;
        taxpayerStoreInstance.setState({ taxpayers: items, loading: false });
        return items;
      }
    } catch (err: any) {
      taxpayerStoreInstance.setState({ error: err.message, loading: false });
    }
    return [];
  }

  static async GetItemTemplate(id: number | string): Promise<ITaxpayerRecord | null> {
    try {
      const res = await fetch(`/api/Taxpayer/${id}/GetItemTemplate`);
      const json = await res.json();
      if (json.success && json.data) {
        taxpayerStoreInstance.setState({ selectedTaxpayer: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[TaxpayerController] GetItemTemplate error:", err);
    }
    return null;
  }

  static async GetCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    try {
      const res = await fetch(`/api/Taxpayer/GetCombo`);
      const json = await res.json();
      if (json.success && json.data) {
        taxpayerStoreInstance.setState({ comboOptions: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[TaxpayerController] GetCombo error:", err);
    }
    return [];
  }

  static async createTaxpayer(formData: Partial<ITaxpayerRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch("/api/Taxpayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Taxpayer created successfully" };
      }
      return { success: false, message: json.message || "Failed to create taxpayer" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async updateTaxpayer(id: string | number, formData: Partial<ITaxpayerRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/Taxpayer/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Taxpayer updated successfully" };
      }
      return { success: false, message: json.message || "Failed to update taxpayer" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async deleteTaxpayer(id: string | number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/Taxpayer/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Taxpayer deleted successfully" };
      }
      return { success: false, message: json.message || "Failed to delete taxpayer" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }
}
