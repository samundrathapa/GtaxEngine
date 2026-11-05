import { companyStoreInstance } from "./CompanyStore.ts";
import { ICompanyRecord } from "../../serverside/Company/CompanyModel.ts";

export class CompanyController {
  static async GetSearchTemplate(query: string = ""): Promise<ICompanyRecord[]> {
    companyStoreInstance.setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/Company/GetSearchTemplate?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const items = json.data.items || json.data;
        companyStoreInstance.setState({ companies: items, loading: false });
        return items;
      }
    } catch (err: any) {
      companyStoreInstance.setState({ error: err.message, loading: false });
    }
    return [];
  }

  static async GetItemTemplate(id: number | string): Promise<ICompanyRecord | null> {
    try {
      const res = await fetch(`/api/Company/${id}/GetItemTemplate`);
      const json = await res.json();
      if (json.success && json.data) {
        companyStoreInstance.setState({ selectedCompany: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[CompanyController] GetItemTemplate error:", err);
    }
    return null;
  }

  static async GetCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    try {
      const res = await fetch(`/api/Company/GetCombo`);
      const json = await res.json();
      if (json.success && json.data) {
        companyStoreInstance.setState({ comboOptions: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[CompanyController] GetCombo error:", err);
    }
    return [];
  }

  static async createCompany(formData: Partial<ICompanyRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch("/api/Company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Company created successfully" };
      }
      return { success: false, message: json.message || "Failed to create company" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async updateCompany(id: string | number, formData: Partial<ICompanyRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/Company/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Company updated successfully" };
      }
      return { success: false, message: json.message || "Failed to update company" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async deleteCompany(id: string | number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/Company/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "Company deleted successfully" };
      }
      return { success: false, message: json.message || "Failed to delete company" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }
}
