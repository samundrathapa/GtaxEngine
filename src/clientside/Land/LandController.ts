import { landStoreInstance } from "./LandStore.ts";
import { ILandRecord } from "../../serverside/Land/LandModel.ts";

export class LandController {
  static async GetSearchTemplate(query: string = ""): Promise<ILandRecord[]> {
    landStoreInstance.setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/Land/GetSearchTemplate?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const items = json.data.items || json.data;
        landStoreInstance.setState({ lands: items, loading: false });
        return items;
      }
    } catch (err: any) {
      landStoreInstance.setState({ error: err.message, loading: false });
    }
    return [];
  }

  static async GetItemTemplate(id: number | string): Promise<ILandRecord | null> {
    try {
      const res = await fetch(`/api/Land/${id}/GetItemTemplate`);
      const json = await res.json();
      if (json.success && json.data) {
        landStoreInstance.setState({ selectedLand: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[LandController] GetItemTemplate error:", err);
    }
    return null;
  }

  static async GetCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    try {
      const res = await fetch(`/api/Land/GetCombo`);
      const json = await res.json();
      if (json.success && json.data) {
        landStoreInstance.setState({ comboOptions: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[LandController] GetCombo error:", err);
    }
    return [];
  }

  static async createLand(formData: Partial<ILandRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch("/api/Land", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Land registered successfully" };
      }
      return { success: false, message: json.message || "Failed to register land" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async updateLand(id: string | number, formData: Partial<ILandRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/Land/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Land updated successfully" };
      }
      return { success: false, message: json.message || "Failed to update land" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async deleteLand(id: string | number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/Land/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Land deleted successfully" };
      }
      return { success: false, message: json.message || "Failed to delete land" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }
}
