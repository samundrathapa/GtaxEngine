import { userStoreInstance } from "./UserStore.ts";
import { IUserRecord } from "../../serverside/User/UserModel.ts";

export class UserController {
  static async GetSearchTemplate(query: string = ""): Promise<IUserRecord[]> {
    userStoreInstance.setState({ loading: true, error: null });
    try {
      const res = await fetch(`/api/User/GetSearchTemplate?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const items = json.data.items || json.data;
        userStoreInstance.setState({ users: items, loading: false });
        return items;
      }
    } catch (err: any) {
      userStoreInstance.setState({ error: err.message, loading: false });
    }
    return [];
  }

  static async GetItemTemplate(id: number | string): Promise<IUserRecord | null> {
    try {
      const res = await fetch(`/api/User/${id}/GetItemTemplate`);
      const json = await res.json();
      if (json.success && json.data) {
        userStoreInstance.setState({ selectedUser: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[UserController] GetItemTemplate error:", err);
    }
    return null;
  }

  static async GetCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    try {
      const res = await fetch(`/api/User/GetCombo`);
      const json = await res.json();
      if (json.success && json.data) {
        userStoreInstance.setState({ comboOptions: json.data });
        return json.data;
      }
    } catch (err: any) {
      console.error("[UserController] GetCombo error:", err);
    }
    return [];
  }

  static async createUser(formData: Partial<IUserRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch("/api/User", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "User created successfully" };
      }
      return { success: false, message: json.message || "Failed to create user" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async updateUser(userId: string | number, formData: Partial<IUserRecord>): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/User/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "User updated successfully" };
      }
      return { success: false, message: json.message || "Failed to update user" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }

  static async deleteUser(userId: string | number): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/User/${userId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await this.GetSearchTemplate();
        return { success: true, message: json.message || "User deleted successfully" };
      }
      return { success: false, message: json.message || "Failed to delete user" };
    } catch (err: any) {
      return { success: false, message: err.message || "Network error" };
    }
  }
}
