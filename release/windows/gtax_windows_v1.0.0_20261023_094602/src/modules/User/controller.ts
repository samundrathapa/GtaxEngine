import { ApiController } from "../../api/controller.ts";
import { UserModel, UserFormData } from "./model.ts";

export class UserController {
  static async fetchUsers(): Promise<UserModel[]> {
    const res = await ApiController.getUsers();
    if (res.success && res.data?.items) {
      return res.data.items as UserModel[];
    }
    return [];
  }

  static async createUser(formData: UserFormData): Promise<{ success: boolean; message: string }> {
    const res = await ApiController.createUser(formData);
    return {
      success: res.success,
      message: res.message || (res.success ? "User created successfully" : "Failed to create user")
    };
  }

  static async updateUser(userId: string, formData: Partial<UserFormData>): Promise<{ success: boolean; message: string }> {
    const res = await ApiController.updateUser(userId, formData);
    return {
      success: res.success,
      message: res.message || (res.success ? "User updated successfully" : "Failed to update user")
    };
  }

  static async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const res = await ApiController.deleteUser(userId);
    return {
      success: res.success,
      message: res.message || (res.success ? "User deleted successfully" : "Failed to delete user")
    };
  }
}
