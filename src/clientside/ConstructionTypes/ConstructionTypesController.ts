import { constructionTypesStoreInstance } from "./ConstructionTypesStore.ts";
import { IConstructionTypeRecord } from "../../serverside/ConstructionTypes/ConstructionTypesModel.ts";

export class ConstructionTypesController {
  static async GetSearchTemplate(query: string = ""): Promise<IConstructionTypeRecord[]> {
    constructionTypesStoreInstance.setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/ConstructionTypes/GetSearchTemplate?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const items = json.data.items || json.data;
        constructionTypesStoreInstance.setState({ constructionTypes: items, loading: false });
        return items;
      }
    } catch (err: any) {
      constructionTypesStoreInstance.setState({ error: err.message, loading: false });
    }
    return [];
  }

  static async GetItemTemplate(id: number | string): Promise<IConstructionTypeRecord | null> {
    try {
      const res = await fetch(`/api/ConstructionTypes/${id}/GetItemTemplate`);
      const json = await res.json();
      if (json.success && json.data) {
        constructionTypesStoreInstance.setState({ selectedType: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[ConstructionTypesController] GetItemTemplate error:", err);
    }
    return null;
  }

  static async GetCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    try {
      const res = await fetch(`/api/ConstructionTypes/GetCombo`);
      const json = await res.json();
      if (json.success && json.data) {
        constructionTypesStoreInstance.setState({ comboOptions: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[ConstructionTypesController] GetCombo error:", err);
    }
    return [];
  }

  static async createType(formData: Partial<IConstructionTypeRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch("/api/ConstructionTypes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Construction type created successfully" };
      }
      return { success: false, message: json.message || "Failed to create construction type" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async updateType(id: string | number, formData: Partial<IConstructionTypeRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/ConstructionTypes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Construction type updated successfully" };
      }
      return { success: false, message: json.message || "Failed to update construction type" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async deleteType(id: string | number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/ConstructionTypes/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Construction type deleted successfully" };
      }
      return { success: false, message: json.message || "Failed to delete construction type" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }
}
