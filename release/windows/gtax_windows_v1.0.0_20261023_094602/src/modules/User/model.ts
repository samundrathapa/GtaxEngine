import { AuditFields } from "../../server/BaseFrame/repo/BaseRepo.ts";

export type UserRole =
  | "superadmin"
  | "admin"
  | "operator"
  | "user"
  | "tax_analyst"
  | "tax_manager"
  | "auditor";

export interface UserModel extends AuditFields {
  id?: number | string;
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  mobile?: string;
  employee_id?: string;
  is_locked?: boolean;
  org_id: string;
  company_id: number;
}

export interface UserFormData {
  username?: string;
  email: string;
  full_name: string;
  password?: string;
  mobile?: string;
  employee_id?: string;
  role: string;
  org_id?: string;
  company_id?: number;
}

export const initialUserForm: UserFormData = {
  username: "",
  email: "",
  full_name: "",
  password: "",
  mobile: "",
  employee_id: "",
  role: "operator",
  org_id: "ORG_GLOBAL_CORP",
  company_id: 1
};
