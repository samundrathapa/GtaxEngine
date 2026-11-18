export type MatrixActionType = "menu" | "new" | "edit" | "delete" | "calculation";
export type RightActionType = MatrixActionType | "print";

export type MenuKey =
  | "dashboard"
  | "taxpayer"
  | "calculation"
  | "master"
  | "role"
  | "user"
  | "company"
  | "audit_logs";

export interface MenuDefinition {
  key: MenuKey;
  label: string;
  description: string;
  supportedActions: MatrixActionType[];
}

export const ACTION_TYPES: MatrixActionType[] = ["menu", "new", "edit", "delete", "calculation"];

export const MENU_DEFINITIONS: MenuDefinition[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Municipal executive overview, KPI metrics, and fiscal summary",
    supportedActions: ["menu", "calculation"]
  },
  {
    key: "taxpayer",
    label: "Taxpayer",
    description: "Taxpayer master registry, land parcels (kitta), houses, and floors",
    supportedActions: ["menu", "new", "edit", "delete", "calculation"]
  },
  {
    key: "master",
    label: "Master & Rate Masters",
    description: "Land rates, malpot rates, construction rates, depreciation, fiscal years, units",
    supportedActions: ["menu", "new", "edit", "delete"]
  },
  {
    key: "calculation",
    label: "Calculation",
    description: "Property tax calculation studio, multi-year engine, and saved bills",
    supportedActions: ["menu", "new", "edit", "delete", "calculation"]
  },
  {
    key: "role",
    label: "Roles & Permissions",
    description: "Create custom roles and assign menu, new, edit, delete, and calculation rights",
    supportedActions: ["menu", "new", "edit", "delete"]
  },
  {
    key: "user",
    label: "Users Management",
    description: "Manage system operators, assign roles, reset passwords, and user-wise overrides",
    supportedActions: ["menu", "new", "edit", "delete"]
  },
  {
    key: "company",
    label: "Company Profile & Settings",
    description: "Municipality profile, active fiscal year, and application settings",
    supportedActions: ["menu", "new", "edit", "delete"]
  },
  {
    key: "audit_logs",
    label: "Audit & Session Logs",
    description: "Active sessions ledger and security audit trail",
    supportedActions: ["menu"]
  }
];

export interface CanonicalRightSeed {
  id: number;
  right_code: string;
  right_name: string;
  module_name: string;
  menu_key: MenuKey;
  action_type: RightActionType;
}

export function buildCanonicalRights(): CanonicalRightSeed[] {
  const list: CanonicalRightSeed[] = [];
  let idCounter = 1;
  for (const menu of MENU_DEFINITIONS) {
    for (const act of ACTION_TYPES) {
      if (!menu.supportedActions.includes(act)) continue;
      list.push({
        id: idCounter++,
        right_code: `${menu.key}_${act}`,
        right_name: `${menu.label} - ${act.toUpperCase()}`,
        module_name: menu.key,
        menu_key: menu.key,
        action_type: act
      });
    }
  }
  return list;
}

export const CANONICAL_RIGHTS: CanonicalRightSeed[] = buildCanonicalRights();

export const OPERATOR_ALLOWED_MENUS: MenuKey[] = ["dashboard", "taxpayer", "master", "calculation"];

export function getDefaultRightsForRoleName(roleName: string): string[] {
  const normalized = (roleName || "").trim().toLowerCase();
  if (normalized === "superadmin") {
    return CANONICAL_RIGHTS.map((r) => r.right_code);
  }
  if (normalized === "admin") {
    return CANONICAL_RIGHTS
      .filter((r) => r.right_code !== "user_delete" && r.right_code !== "role_delete")
      .map((r) => r.right_code);
  }
  if (normalized === "operator") {
    // Operator: ONLY dashboard, taxpayer, master, and calculation menus
    // with menu, new, edit, calculation rights (no user, no role, no company, no audit_logs)
    return CANONICAL_RIGHTS
      .filter(
        (r) =>
          OPERATOR_ALLOWED_MENUS.includes(r.menu_key) &&
          r.action_type !== "delete"
      )
      .map((r) => r.right_code);
  }
  // Standard 'user' role
  return ["dashboard_menu", "taxpayer_menu", "calculation_menu", "calculation_calculation"];
}

export type RoleMatrixMap = Record<string, {
  menu: boolean;
  new: boolean;
  edit: boolean;
  delete: boolean;
  calculation: boolean;
}>;

export function rightsToMatrix(rightCodes: string[]): RoleMatrixMap {
  const codeSet = new Set(rightCodes.map((c) => c.toLowerCase()));
  const matrix: RoleMatrixMap = {};
  for (const m of MENU_DEFINITIONS) {
    matrix[m.key] = {
      menu: codeSet.has(`${m.key}_menu`),
      new: codeSet.has(`${m.key}_new`),
      edit: codeSet.has(`${m.key}_edit`),
      delete: codeSet.has(`${m.key}_delete`),
      calculation: codeSet.has(`${m.key}_calculation`)
    };
  }
  return matrix;
}

export function matrixToRightCodes(matrix: RoleMatrixMap): string[] {
  const codes: string[] = [];
  for (const m of MENU_DEFINITIONS) {
    const row = matrix[m.key];
    if (!row) continue;
    for (const act of ACTION_TYPES) {
      if (!m.supportedActions.includes(act)) continue;
      if (row[act]) {
        codes.push(`${m.key}_${act}`);
      }
    }
  }
  return codes;
}
