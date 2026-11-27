import { AuthSessionState } from "../modules/Auth/model.ts";
import { MenuKey, OPERATOR_ALLOWED_MENUS, RightActionType } from "../shared/rbacConfig.ts";

export function getSessionRoleName(session?: AuthSessionState | null): string {
  return String(
    session?.role?.role_name || (session?.user as any)?.role || ""
  )
    .trim()
    .toLowerCase();
}

export function isSuperAdminSession(session?: AuthSessionState | null): boolean {
  if (!session || !session.isAuthenticated) return false;
  const roleName = getSessionRoleName(session);
  const email = String(session.user?.email || "").trim().toLowerCase();
  return roleName === "superadmin" || email === "superadmin@gtax.enterprise";
}

export function hasMenuRight(session: AuthSessionState | null | undefined, menuKey: MenuKey): boolean {
  if (!session || !session.isAuthenticated) return false;
  if (isSuperAdminSession(session)) return true;

  const rights = Array.isArray(session.rights) ? session.rights : [];
  const targetCode = `${menuKey}_menu`;

  if (rights.some((r) => String(r.right_code || "").toLowerCase() === targetCode)) {
    return true;
  }

  // Only fall back to role defaults if session has legacy rights (no canonical *_menu codes at all)
  const hasCanonical = rights.some((r) => String(r.right_code || "").endsWith("_menu"));
  if (!hasCanonical) {
    const roleName = getSessionRoleName(session);
    if (roleName === "operator") {
      return OPERATOR_ALLOWED_MENUS.includes(menuKey);
    }
    if (roleName === "admin") {
      return true;
    }
    if (roleName === "user") {
      return menuKey === "dashboard" || menuKey === "taxpayer" || menuKey === "calculation";
    }
  }

  return false;
}

export function hasActionRight(
  session: AuthSessionState | null | undefined,
  menuKey: MenuKey,
  action: RightActionType
): boolean {
  if (!session || !session.isAuthenticated) return false;
  if (isSuperAdminSession(session)) return true;
  if (!hasMenuRight(session, menuKey)) return false;
  if (action === "menu") return true;

  const rights = Array.isArray(session.rights) ? session.rights : [];
  const targetCode = `${menuKey}_${action}`;

  if (rights.some((r) => String(r.right_code || "").toLowerCase() === targetCode)) {
    return true;
  }

  const hasCanonical = rights.some((r) => String(r.right_code || "").endsWith("_menu"));
  if (!hasCanonical) {
    const roleName = getSessionRoleName(session);
    if (roleName === "operator") {
      return OPERATOR_ALLOWED_MENUS.includes(menuKey) && action !== "delete";
    }
    if (roleName === "admin") {
      return targetCode !== "user_delete" && targetCode !== "role_delete";
    }
    if (roleName === "user") {
      return (menuKey === "calculation" && action === "calculation");
    }
  }

  return false;
}

export function isNavTabAllowed(session: AuthSessionState | null | undefined, tab: string): boolean {
  if (tab === "privacy") return true;
  if (!session || !session.isAuthenticated) return false;
  if (isSuperAdminSession(session)) return true;

  switch (tab) {
    case "dashboard":
      return hasMenuRight(session, "dashboard");
    case "new_taxpayer":
      return hasMenuRight(session, "taxpayer") && hasActionRight(session, "taxpayer", "new");
    case "taxpayer":
      return hasMenuRight(session, "taxpayer");
    case "calculation":
    case "tax_calc":
      return hasMenuRight(session, "calculation");
    case "masters":
    case "rate":
      return hasMenuRight(session, "master");
    case "settings":
      return hasMenuRight(session, "master") || hasMenuRight(session, "company");
    case "roles":
      return hasMenuRight(session, "role");
    case "users":
      return hasMenuRight(session, "user");
    case "rbac":
      return hasMenuRight(session, "user") || hasMenuRight(session, "role");
    case "security_logs":
      return hasMenuRight(session, "audit_logs");
    case "reports":
      return hasMenuRight(session, "calculation") || hasMenuRight(session, "dashboard");
    default:
      return false;
  }
}

export function getFirstAllowedNavTab(
  session: AuthSessionState | null | undefined
): "dashboard" | "new_taxpayer" | "taxpayer" | "calculation" | "rate" | "settings" | "rbac" | "security_logs" {
  const order: Array<"dashboard" | "new_taxpayer" | "taxpayer" | "calculation" | "rate" | "settings" | "rbac" | "security_logs"> = [
    "dashboard",
    "new_taxpayer",
    "taxpayer",
    "calculation",
    "rate",
    "settings",
    "rbac",
    "security_logs"
  ];
  for (const tab of order) {
    if (isNavTabAllowed(session, tab)) return tab;
  }
  return "dashboard";
}
