import { landNatureStoreInstance } from "./LandNatureStore.ts";
import { ILandNatureRecord } from "../../serverside/LandNature/LandNatureModel.ts";

export class LandNatureController {
  static async GetSearchTemplate(query: string = ""): Promise<ILandNatureRecord[]> {
    landNatureStoreInstance.setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/LandNature/GetSearchTemplate?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const items = json.data.items || json.data;
        landNatureStoreInstance.setState({ landNatures: items, loading: false });
        return items;
      }
    } catch (err: any) {
      landNatureStoreInstance.setState({ error: err.message, loading: false });
    }
    return [];
  }

  static async GetItemTemplate(id: number | string): Promise<ILandNatureRecord | null> {
    try {
      const res = await fetch(`/api/LandNature/${id}/GetItemTemplate`);
      const json = await res.json();
      if (json.success && json.data) {
        landNatureStoreInstance.setState({ selectedNature: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[LandNatureController] GetItemTemplate error:", err);
    }
    return null;
  }

  static async GetCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    try {
      const res = await fetch(`/api/LandNature/GetCombo`);
      const json = await res.json();
      if (json.success && json.data) {
        landNatureStoreInstance.setState({ comboOptions: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[LandNatureController] GetCombo error:", err);
    }
    return [];
  }

  static async createNature(formData: Partial<ILandNatureRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch("/api/LandNature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Land nature created successfully" };
      }
      return { success: false, message: json.message || "Failed to create land nature" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async updateNature(id: string | number, formData: Partial<ILandNatureRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/LandNature/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Land nature updated successfully" };
      }
      return { success: false, message: json.message || "Failed to update land nature" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async deleteNature(id: string | number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/LandNature/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Land nature deleted successfully" };
      }
      return { success: false, message: json.message || "Failed to delete land nature" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }
}
