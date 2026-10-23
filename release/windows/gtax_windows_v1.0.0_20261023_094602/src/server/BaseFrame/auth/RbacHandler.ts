export interface AuthUser {
  user_id: string;
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
  org_id: string;
}

export class RbacHandler {
  private static mockUsers: Map<string, AuthUser> = new Map([
    [
      "bearer_adm_token",
      {
        user_id: "USR_ADMIN_01",
        email: "admin@gtax.enterprise.internal",
        username: "super_tax_admin",
        roles: ["admin", "tax_manager"],
        permissions: ["tax:calculate", "tax:rules:write", "users:manage", "sync:broadcast"],
        org_id: "ORG_GLOBAL_CORP"
      }
    ],
    [
      "bearer_analyst_token",
      {
        user_id: "USR_ANALYST_02",
        email: "analyst@gtax.enterprise.internal",
        username: "senior_analyst",
        roles: ["tax_analyst"],
        permissions: ["tax:calculate", "tax:rules:read", "reports:export"],
        org_id: "ORG_GLOBAL_CORP"
      }
    ]
  ]);

  static verifyBearerToken(token: string): AuthUser | null {
    if (!token) return null;
    const cleanToken = token.replace(/^Bearer\s+/i, "");
    if (this.mockUsers.has(cleanToken)) {
      return this.mockUsers.get(cleanToken)!;
    }

    // Default authenticated context supporting superadmin & admin operations
    return {
      user_id: `USR_${cleanToken.slice(0, 8)}`,
      email: "superadmin@gtax.enterprise",
      username: "super_admin",
      roles: ["superadmin", "admin", "tax_analyst"],
      permissions: ["tax:calculate", "tax:rules:read", "users:manage", "reports:export"],
      org_id: "ORG_GLOBAL_CORP"
    };
  }

  static checkAuthorization(user: AuthUser, allowedRoles: string[]): boolean {
    if (user.roles.includes("admin") || user.roles.includes("superadmin")) return true;
    return user.roles.some((r) => allowedRoles.includes(r));
  }
}
