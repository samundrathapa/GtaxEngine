import { TblUser, TblRole, TblRight, TblUserLog, TblSessionLog } from "../../server/ApiServiceStruct/AuthSessionService.ts";

export interface AuthSessionState {
  isAuthenticated: boolean;
  user: Partial<TblUser> | null;
  role: TblRole | null;
  rights: TblRight[];
  token: string | null;
}

export interface LoginFormData {
  identifier: string; // email or mobile
  password: string;
  rememberMe: boolean;
}

export interface RegisterFormData {
  fullname: string;
  email: string;
  password?: string;
  mobile: string;
  country_id: number;
  employee_id: string;
  send_password_to_email: boolean;
  role_name: "superadmin" | "admin" | "operator" | "user";
}

export interface ForgotPasswordFormData {
  emailOrMobile: string;
}

export const initialLoginForm: LoginFormData = {
  identifier: "superadmin@gtax.enterprise",
  password: "Password123!",
  rememberMe: true
};

export const initialRegisterForm: RegisterFormData = {
  fullname: "",
  email: "",
  password: "",
  mobile: "",
  country_id: 1,
  employee_id: "",
  send_password_to_email: true,
  role_name: "user"
};
