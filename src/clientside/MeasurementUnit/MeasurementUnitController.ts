import { measurementUnitStoreInstance } from "./MeasurementUnitStore.ts";
import { IMeasurementUnitRecord } from "../../serverside/MeasurementUnit/MeasurementUnitModel.ts";

export class MeasurementUnitController {
  static async GetSearchTemplate(query: string = ""): Promise<IMeasurementUnitRecord[]> {
    measurementUnitStoreInstance.setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/MeasurementUnit/GetSearchTemplate?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const items = json.data.items || json.data;
        measurementUnitStoreInstance.setState({ units: items, loading: false });
        return items;
      }
    } catch (err: any) {
      measurementUnitStoreInstance.setState({ error: err.message, loading: false });
    }
    return [];
  }

  static async GetItemTemplate(id: number | string): Promise<IMeasurementUnitRecord | null> {
    try {
      const res = await fetch(`/api/MeasurementUnit/${id}/GetItemTemplate`);
      const json = await res.json();
      if (json.success && json.data) {
        measurementUnitStoreInstance.setState({ selectedUnit: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[MeasurementUnitController] GetItemTemplate error:", err);
    }
    return null;
  }

  static async GetCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    try {
      const res = await fetch(`/api/MeasurementUnit/GetCombo`);
      const json = await res.json();
      if (json.success && json.data) {
        measurementUnitStoreInstance.setState({ comboOptions: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[MeasurementUnitController] GetCombo error:", err);
    }
    return [];
  }

  static async createUnit(formData: Partial<IMeasurementUnitRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch("/api/MeasurementUnit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Unit created successfully" };
      }
      return { success: false, message: json.message || "Failed to create unit" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async updateUnit(id: string | number, formData: Partial<IMeasurementUnitRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/MeasurementUnit/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Unit updated successfully" };
      }
      return { success: false, message: json.message || "Failed to update unit" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async deleteUnit(id: string | number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/MeasurementUnit/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Unit deleted successfully" };
      }
      return { success: false, message: json.message || "Failed to delete unit" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }
}
