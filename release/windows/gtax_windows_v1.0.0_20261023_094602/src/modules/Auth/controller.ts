import { ApiController } from "../../api/controller.ts";
import { LoginFormData, RegisterFormData, AuthSessionState } from "./model.ts";

export class AuthController {
  static async login(form: LoginFormData): Promise<{ success: boolean; data?: any; message: string }> {
    const res = await ApiController.login(form.identifier, form.password);
    return {
      success: res.success,
      data: res.data,
      message: res.message
    };
  }

  static async logout(userId?: number): Promise<{ success: boolean; message: string }> {
    const res = await ApiController.logout(userId);
    return {
      success: res.success,
      message: res.message
    };
  }

  static async register(form: RegisterFormData): Promise<{ success: boolean; data?: any; message: string }> {
    const res = await ApiController.registerUser(form);
    return {
      success: res.success,
      data: res.data,
      message: res.message
    };
  }

  static async forgotPassword(emailOrMobile: string): Promise<{ success: boolean; data?: any; message: string }> {
    const res = await ApiController.forgotPassword(emailOrMobile);
    return {
      success: res.success,
      data: res.data,
      message: res.message
    };
  }

  static async checkActiveSession(): Promise<AuthSessionState | null> {
    const savedToken = typeof window !== "undefined" ? localStorage.getItem("gtax_auth_token") : null;
    if (!savedToken) return null;

    ApiController.setAuthToken(savedToken);
    const res = await ApiController.checkSession();
    if (res.success && res.data) {
      return {
        isAuthenticated: true,
        user: res.data.user,
        role: res.data.role,
        rights: res.data.rights || [],
        token: savedToken
      };
    }
    return null;
  }

  static async fetchSecurityLogs() {
    return ApiController.getSecurityLogs();
  }
}
