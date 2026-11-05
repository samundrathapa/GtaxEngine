import { calculationStoreInstance } from "./CalculationStore.ts";
import { ICalculationRecord } from "../../serverside/Calculation/CalculationModel.ts";

export class CalculationController {
  static async GetSearchTemplate(query: string = ""): Promise<ICalculationRecord[]> {
    calculationStoreInstance.setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/Calculation/GetSearchTemplate?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const items = json.data.items || json.data;
        calculationStoreInstance.setState({ calculations: items, loading: false });
        return items;
      }
    } catch (err: any) {
      calculationStoreInstance.setState({ error: err.message, loading: false });
    }
    return [];
  }

  static async GetItemTemplate(id: number | string): Promise<ICalculationRecord | null> {
    try {
      const res = await fetch(`/api/Calculation/${id}/GetItemTemplate`);
      const json = await res.json();
      if (json.success && json.data) {
        calculationStoreInstance.setState({ selectedCalculation: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[CalculationController] GetItemTemplate error:", err);
    }
    return null;
  }

  static async GetCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    try {
      const res = await fetch(`/api/Calculation/GetCombo`);
      const json = await res.json();
      if (json.success && json.data) {
        calculationStoreInstance.setState({ comboOptions: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[CalculationController] GetCombo error:", err);
    }
    return [];
  }

  static async createCalculation(formData: Partial<ICalculationRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch("/api/Calculation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Tax calculation recorded successfully" };
      }
      return { success: false, message: json.message || "Failed to record tax calculation" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async updateCalculation(id: string | number, formData: Partial<ICalculationRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/Calculation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Tax calculation updated successfully" };
      }
      return { success: false, message: json.message || "Failed to update tax calculation" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async deleteCalculation(id: string | number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/Calculation/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Tax calculation deleted successfully" };
      }
      return { success: false, message: json.message || "Failed to delete tax calculation" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }
}
