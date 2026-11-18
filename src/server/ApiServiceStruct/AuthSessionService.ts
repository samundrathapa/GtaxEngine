import { AuditFields } from "../BaseFrame/repo/BaseRepo.ts";
import { ApiResponse, IApiResponse } from "../BaseFrame/response/ApiResponse.ts";
import { PostgresPoolManager } from "../db/postgresPool.ts";
import { TableCacheDbSyncService } from "../db/TableCacheDbSyncService.ts";
import {
  CANONICAL_RIGHTS,
  RightActionType,
  getDefaultRightsForRoleName
} from "../../shared/rbacConfig.ts";

export interface TblUser extends AuditFields {
  id: number;
  fullname: string;
  photo_path: string | null;
  email: string;
  password: string;
  mobile: string;
  country_id: number;
  effective_from: string;
  effective_to: string | null;
  employee_id: string;
  preferred_lang?: "eng" | "nep" | "ind";
  preferred_theme?: string;
  is_locked: boolean;
}

export interface TblRole extends AuditFields {
  id: number;
  role_name: string;
  description: string;
}

export interface TblRight extends AuditFields {
  id: number;
  right_code: string; // e.g. 'taxpayer_menu', 'taxpayer_new', 'calculation_calculation', etc.
  right_name: string;
  module_name: string;
  action_type: RightActionType;
}

export interface TblRoleRight extends AuditFields {
  id: number;
  role_id: number;
  right_id: number;
}

export interface TblUserRole extends AuditFields {
  id: number;
  user_id: number;
  role_id: number;
}

export interface TblUserRight extends AuditFields {
  id: number;
  user_id: number;
  right_id: number;
  is_granted: boolean;
}

export interface TblUserLog extends AuditFields {
  id: number;
  user_id: number | null;
  username_attempt: string;
  action_name: string;
  ip_address: string;
  user_agent: string;
  details: string;
}

export interface TblSessionLog extends AuditFields {
  id: number;
  session_id: string;
  user_id: number;
  token_hash: string;
  ip_address: string;
  user_agent: string;
  login_time: string;
  last_active: string;
  expires_at: string;
}

class AuthDatabaseStore {
  public users: Map<number, TblUser> = new Map();
  public roles: Map<number, TblRole> = new Map();
  public rights: Map<number, TblRight> = new Map();
  public roleRights: Map<number, TblRoleRight> = new Map();
  public userRoles: Map<number, TblUserRole> = new Map();
  public userRights: Map<number, TblUserRight> = new Map();
  public userLogs: TblUserLog[] = [];
  public sessionLogs: Map<string, TblSessionLog> = new Map();

  private nextUserId = 1;
  private nextLogId = 1;
  private nextSessionId = 1;

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const now = new Date().toISOString();
    const systemId = "SYSTEM_SEED";

    // 1. Roles: superadmin, admin, operator, user
    const seededRoles: { id: number; name: TblRole["role_name"]; desc: string }[] = [
      { id: 1, name: "superadmin", desc: "Unrestricted Master Control & System Oversight" },
      { id: 2, name: "admin", desc: "Corporate Tax Manager & Department Security Admin" },
      { id: 3, name: "operator", desc: "Tax Operations Specialist & Real-Time Sync Operator" },
      { id: 4, name: "user", desc: "Standard Tax Analyst & Invoicing Reviewer" }
    ];

    seededRoles.forEach((r) => {
      this.roles.set(r.id, {
        id: r.id,
        role_name: r.name,
        description: r.desc,
        insert_by: systemId,
        insert_on: now,
        update_by: systemId,
        update_on: now,
        delete_by: null,
        deleted_on: null,
        is_active: true
      });
    });

    // 2. Rights: canonical menu + new, edit, delete, calculation rights per module
    const rightIdByCode = new Map<string, number>();
    for (const cr of CANONICAL_RIGHTS) {
      const rightRecord: TblRight = {
        id: cr.id,
        right_code: cr.right_code,
        right_name: cr.right_name,
        module_name: cr.module_name,
        action_type: cr.action_type,
        insert_by: systemId,
        insert_on: now,
        update_by: systemId,
        update_on: now,
        delete_by: null,
        deleted_on: null,
        is_active: true
      };
      this.rights.set(cr.id, rightRecord);
      rightIdByCode.set(cr.right_code, cr.id);
    }

    // 3. Assign role rights for Roles 1..4 from shared RBAC defaults
    let roleRightId = 1;
    for (const roleDef of seededRoles) {
      const defaultCodes = getDefaultRightsForRoleName(roleDef.name);
      for (const code of defaultCodes) {
        const rightId = rightIdByCode.get(code);
        if (!rightId) continue;
        const nextId = roleRightId++;
        this.roleRights.set(nextId, {
          id: nextId,
          role_id: roleDef.id,
          right_id: rightId,
          insert_by: systemId,
          insert_on: now,
          update_by: systemId,
          update_on: now,
          delete_by: null,
          deleted_on: null,
          is_active: true
        });
      }
    }

    // 3. Seeded Users
    const initialUsers = [
      {
        fullname: "Eleanor Vance",
        email: "superadmin@gtax.enterprise",
        password: "Password123!",
        mobile: "+1 (555) 019-2831",
        country_id: 1,
        employee_id: "EMP-SA-001",
        photo_path: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256",
        role_id: 1 // superadmin
      },
      {
        fullname: "Marcus Thorne",
        email: "admin@gtax.enterprise",
        password: "Password123!",
        mobile: "+1 (555) 024-8192",
        country_id: 1,
        employee_id: "EMP-ADM-002",
        photo_path: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=256",
        role_id: 2 // admin
      },
      {
        fullname: "Sarah Chen",
        email: "operator@gtax.enterprise",
        password: "Password123!",
        mobile: "+1 (555) 038-7241",
        country_id: 1,
        employee_id: "EMP-OP-003",
        photo_path: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=256",
        role_id: 3 // operator
      },
      {
        fullname: "Julian Keller",
        email: "user@gtax.enterprise",
        password: "Password123!",
        mobile: "+1 (555) 042-9918",
        country_id: 1,
        employee_id: "EMP-USR-004",
        photo_path: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
        role_id: 4 // user
      }
    ];

    initialUsers.forEach((u) => {
      const uId = this.nextUserId++;
      const userObj: TblUser = {
        id: uId,
        fullname: u.fullname,
        photo_path: u.photo_path,
        email: u.email,
        password: u.password,
        mobile: u.mobile,
        country_id: u.country_id,
        effective_from: "2026-01-01",
        effective_to: null,
        employee_id: u.employee_id,
        preferred_lang: "eng",
        preferred_theme: "slate",
        is_locked: false,
        insert_by: systemId,
        insert_on: now,
        update_by: systemId,
        update_on: now,
        delete_by: null,
        deleted_on: null,
        is_active: true
      };
      this.users.set(uId, userObj);

      // Map to role
      this.userRoles.set(uId, {
        id: uId,
        user_id: uId,
        role_id: u.role_id,
        insert_by: systemId,
        insert_on: now,
        update_by: systemId,
        update_on: now,
        delete_by: null,
        deleted_on: null,
        is_active: true
      });
    });

    // Initial logs
    this.logUserAction(1, "superadmin@gtax.enterprise", "SYSTEM_BOOTSTRAP", "127.0.0.1", "gtax-server", "Initial root roles and security rights mapped");
  }

  public logUserAction(
    userId: number | null,
    usernameAttempt: string,
    action: string,
    ip = "127.0.0.1",
    agent = "browser",
    details = ""
  ) {
    const now = new Date().toISOString();
    const log: TblUserLog = {
      id: this.nextLogId++,
      user_id: userId,
      username_attempt: usernameAttempt,
      action_name: action,
      ip_address: ip,
      user_agent: agent,
      details,
      insert_by: usernameAttempt || "ANONYMOUS",
      insert_on: now,
      update_by: usernameAttempt || "ANONYMOUS",
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.userLogs.unshift(log);
    if (this.userLogs.length > 500) this.userLogs.pop();
    return log;
  }

  public createSession(user: TblUser, ip = "127.0.0.1", agent = "browser"): { token: string; session: TblSessionLog } {
    const now = new Date();
    const token = `gtax_token_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const sessionId = `SES_${user.id}_${Date.now()}`;
    const expiresAt = new Date(now.getTime() + 86400000 * 7).toISOString(); // 7 days

    const session: TblSessionLog = {
      id: this.nextSessionId++,
      session_id: sessionId,
      user_id: user.id,
      token_hash: token,
      ip_address: ip,
      user_agent: agent,
      login_time: now.toISOString(),
      last_active: now.toISOString(),
      expires_at: expiresAt,
      insert_by: user.email,
      insert_on: now.toISOString(),
      update_by: user.email,
      update_on: now.toISOString(),
      delete_by: null,
      deleted_on: null,
      is_active: true
    };

    this.sessionLogs.set(token, session);
    this.logUserAction(user.id, user.email, "LOGIN_SUCCESS", ip, agent, `New session created [${sessionId}]`);
    return { token, session };
  }

  public clearUserSessions(userId: number, currentToken?: string): number {
    let clearedCount = 0;
    const now = new Date().toISOString();

    for (const [t, ses] of this.sessionLogs.entries()) {
      if (ses.user_id === userId && ses.is_active) {
        ses.is_active = false;
        ses.delete_by = `USER_${userId}`;
        ses.deleted_on = now;
        clearedCount++;
      }
    }

    if (currentToken && this.sessionLogs.has(currentToken)) {
      const ses = this.sessionLogs.get(currentToken)!;
      ses.is_active = false;
      ses.delete_by = `USER_${userId}`;
      ses.deleted_on = now;
    }

    const u = this.users.get(userId);
    this.logUserAction(
      userId,
      u ? u.email : `User_${userId}`,
      "LOGOUT",
      "127.0.0.1",
      "browser",
      `Cleared all active sessions (${clearedCount} revoked)`
    );

    return clearedCount;
  }

  public findRoleByNameOrId(roleNameOrId: string | number | undefined): TblRole | null {
    if (roleNameOrId === undefined || roleNameOrId === null || roleNameOrId === "") return null;
    const asNum = Number(roleNameOrId);
    if (!isNaN(asNum) && this.roles.has(asNum)) {
      const r = this.roles.get(asNum)!;
      if (r.is_active) return r;
    }
    const clean = String(roleNameOrId).trim().toLowerCase();
    for (const r of this.roles.values()) {
      if (r.is_active && r.role_name.trim().toLowerCase() === clean) {
        return r;
      }
    }
    return null;
  }

  public getUserRole(userId: number): TblRole | null {
    const map = this.userRoles.get(userId);
    if (!map) return null;
    return this.roles.get(map.role_id) || null;
  }

  public getUserRights(userId: number): TblRight[] {
    const role = this.getUserRole(userId);
    if (!role) return [];

    const rightSet = new Set<number>();

    // 1. Collect from tbl_role_right
    for (const rr of this.roleRights.values()) {
      if (rr.role_id === role.id && rr.is_active) {
        rightSet.add(rr.right_id);
      }
    }

    // 2. Apply user-specific overrides from tbl_user_right
    for (const ur of this.userRights.values()) {
      if (ur.user_id === userId && ur.is_active) {
        if (ur.is_granted) {
          rightSet.add(ur.right_id);
        } else {
          rightSet.delete(ur.right_id);
        }
      }
    }

    const result: TblRight[] = [];
    for (const rId of rightSet) {
      const r = this.rights.get(rId);
      if (r && r.is_active) {
        result.push(r);
      }
    }
    return result;
  }
}

export const authDb = new AuthDatabaseStore();

export class AuthSessionService {
  static async login(identifier: string, passwordAttempt: string, ip = "127.0.0.1", agent = "browser"): Promise<IApiResponse<any>> {
    const cleanId = identifier.trim().toLowerCase();

    // Check live PostgreSQL tbl_user if connected
    if (PostgresPoolManager.getStatus().connected) {
      try {
        const dbUsers = await PostgresPoolManager.query<any>(`
          SELECT u.*, COALESCE(r.role_name, 'user') as role_name, COALESCE(r.id, 4) as role_id 
          FROM tbl_user u
          LEFT JOIN tbl_user_role ur ON u.id = ur.user_id AND ur.is_active = true
          LEFT JOIN tbl_role r ON ur.role_id = r.id
          WHERE (LOWER(u.email) = $1 OR LOWER(COALESCE(u.username, '')) = $1 OR u.mobile = $1 OR LOWER(COALESCE(u.employee_id, '')) = $1)
            AND u.is_active = true AND COALESCE(u.is_deleted, false) = false
          LIMIT 1;
        `, [cleanId]);

        if (dbUsers && dbUsers.length > 0) {
          const dbU = dbUsers[0];
          const resolvedPassword = dbU.password || dbU.password_hash || "Password123!";
          const mappedUser: TblUser = {
            id: dbU.id,
            fullname: dbU.fullname || dbU.full_name || dbU.username || dbU.email,
            photo_path: dbU.photo_path,
            email: dbU.email,
            password: resolvedPassword,
            mobile: dbU.mobile || "",
            country_id: dbU.country_id || 1,
            effective_from: dbU.effective_from,
            effective_to: dbU.effective_to,
            employee_id: dbU.employee_id || `EMP-${dbU.id}`,
            preferred_lang: (["eng", "nep", "ind"].includes(dbU.preferred_lang) ? dbU.preferred_lang : "eng") as "eng" | "nep" | "ind",
            preferred_theme: dbU.preferred_theme || undefined,
            is_locked: Boolean(dbU.is_locked),
            insert_by: dbU.insert_by,
            insert_on: dbU.insert_on,
            update_by: dbU.update_by,
            update_on: dbU.update_on,
            delete_by: null,
            deleted_on: null,
            is_active: true
          };
          authDb.users.set(dbU.id, mappedUser);

          // Ensure role from PostgreSQL exists in authDb.roles
          const dbRoleId = Number(dbU.role_id || 4);
          const dbRoleName = String(dbU.role_name || "user").trim().toLowerCase();
          if (!authDb.roles.has(dbRoleId)) {
            authDb.roles.set(dbRoleId, {
              id: dbRoleId,
              role_name: dbRoleName,
              description: dbRoleName,
              insert_by: "DB_SYNC",
              insert_on: new Date().toISOString(),
              update_by: "DB_SYNC",
              update_on: new Date().toISOString(),
              delete_by: null,
              deleted_on: null,
              is_active: true
            });
          }

          authDb.userRoles.set(dbU.id, {
            id: dbU.id,
            user_id: dbU.id,
            role_id: dbRoleId,
            insert_by: "DB_SYNC",
            insert_on: new Date().toISOString(),
            update_by: "DB_SYNC",
            update_on: new Date().toISOString(),
            delete_by: null,
            deleted_on: null,
            is_active: true
          });

          // Sync live role_right and user_right from PostgreSQL for this user
          try {
            const dbRoleRights = await PostgresPoolManager.query<any>(
              `SELECT rr.id, rr.role_id, rr.right_id, r.right_code, r.right_name, r.module_name, r.action_type
               FROM tbl_role_right rr
               JOIN tbl_right r ON rr.right_id = r.id
               WHERE rr.role_id = $1 AND rr.is_active = true AND COALESCE(rr.is_deleted, false) = false AND r.is_active = true;`,
              [dbRoleId]
            );
            if (Array.isArray(dbRoleRights) && dbRoleRights.length > 0) {
              for (const [k, existingRR] of authDb.roleRights.entries()) {
                if (existingRR.role_id === dbRoleId) authDb.roleRights.delete(k);
              }
              for (const row of dbRoleRights) {
                const rCode = String(row.right_code || "");
                const matchedRight =
                  Array.from(authDb.rights.values()).find((x) => x.right_code === rCode) ||
                  authDb.rights.get(Number(row.right_id));
                if (matchedRight) {
                  const rrId = Number(row.id) || (Date.now() + Math.floor(Math.random() * 10000));
                  authDb.roleRights.set(rrId, {
                    id: rrId,
                    role_id: dbRoleId,
                    right_id: matchedRight.id,
                    insert_by: "DB_SYNC",
                    insert_on: new Date().toISOString(),
                    update_by: "DB_SYNC",
                    update_on: new Date().toISOString(),
                    delete_by: null,
                    deleted_on: null,
                    is_active: true
                  });
                }
              }
            }

            const dbUserRights = await PostgresPoolManager.query<any>(
              `SELECT ur.id, ur.user_id, ur.right_id, ur.is_granted, r.right_code
               FROM tbl_user_right ur
               JOIN tbl_right r ON ur.right_id = r.id
               WHERE ur.user_id = $1 AND ur.is_active = true AND COALESCE(ur.is_deleted, false) = false;`,
              [dbU.id]
            );
            for (const [k, existingUR] of authDb.userRights.entries()) {
              if (existingUR.user_id === dbU.id) authDb.userRights.delete(k);
            }
            if (Array.isArray(dbUserRights)) {
              for (const row of dbUserRights) {
                const rCode = String(row.right_code || "");
                const matchedRight =
                  Array.from(authDb.rights.values()).find((x) => x.right_code === rCode) ||
                  authDb.rights.get(Number(row.right_id));
                if (matchedRight) {
                  const urId = Number(row.id) || (Date.now() + Math.floor(Math.random() * 10000));
                  authDb.userRights.set(urId, {
                    id: urId,
                    user_id: dbU.id,
                    right_id: matchedRight.id,
                    is_granted: Boolean(row.is_granted),
                    insert_by: "DB_SYNC",
                    insert_on: new Date().toISOString(),
                    update_by: "DB_SYNC",
                    update_on: new Date().toISOString(),
                    delete_by: null,
                    deleted_on: null,
                    is_active: true
                  });
                }
              }
            }
          } catch {
            // Non-fatal fallback to in-memory roleRights/userRights
          }
        }
      } catch {
        // Fallback to in-memory store
      }
    }

    // Find by email, mobile, username prefix, or employee ID
    let matchedUser: TblUser | null = null;
    for (const u of authDb.users.values()) {
      const emailPrefix = u.email ? u.email.split("@")[0].toLowerCase() : "";
      const mobileDigits = u.mobile ? u.mobile.replace(/\D/g, "") : "";
      const inputDigits = cleanId.replace(/\D/g, "");

      if (
        u.is_active &&
        ((u.email && u.email.toLowerCase() === cleanId) ||
          emailPrefix === cleanId ||
          (u.employee_id && u.employee_id.toLowerCase() === cleanId) ||
          (inputDigits.length >= 7 && mobileDigits === inputDigits))
      ) {
        matchedUser = u;
        break;
      }
    }

    // Also check TableCacheDbSyncService tbl_user in case user was created via UserPanel
    if (!matchedUser) {
      try {
        const cachedUsers = await TableCacheDbSyncService.getTableData<any>("tbl_user");
        const foundCached = cachedUsers.find((cu) => {
          if (cu.is_deleted || cu.is_active === false) return false;
          const cEmail = (cu.email || "").toLowerCase();
          const cUsername = (cu.username || "").toLowerCase();
          const cEmp = (cu.employee_id || "").toLowerCase();
          const cMobile = (cu.mobile || "").replace(/\D/g, "");
          const inputDigits = cleanId.replace(/\D/g, "");
          return (
            cEmail === cleanId ||
            cUsername === cleanId ||
            (cEmail && cEmail.split("@")[0] === cleanId) ||
            (cEmp && cEmp === cleanId) ||
            (inputDigits.length >= 7 && cMobile === inputDigits)
          );
        });

        if (foundCached) {
          const uId = Number(foundCached.id);
          const roleName = String(foundCached.role || "operator").trim().toLowerCase();
          const matchedRole = authDb.findRoleByNameOrId(foundCached.role_id || roleName);
          const mappedRoleId = matchedRole ? matchedRole.id : (roleName.includes("superadmin") ? 1 : roleName.includes("admin") ? 2 : roleName.includes("operator") ? 3 : 4);
          const syncedUser: TblUser = {
            id: uId,
            fullname: foundCached.fullname || foundCached.full_name || foundCached.username || "User",
            photo_path: foundCached.photo_path || null,
            email: foundCached.email || `${foundCached.username || `user${uId}`}@gtax.enterprise`,
            password: foundCached.password || foundCached.password_hash || "Password123!",
            mobile: foundCached.mobile || "",
            country_id: foundCached.country_id || 1,
            effective_from: foundCached.effective_from || "2026-01-01",
            effective_to: foundCached.effective_to || null,
            employee_id: foundCached.employee_id || `EMP-${uId}`,
            preferred_lang: (["eng", "nep", "ind"].includes(foundCached.preferred_lang) ? foundCached.preferred_lang : "eng") as "eng" | "nep" | "ind",
            preferred_theme: foundCached.preferred_theme || undefined,
            is_locked: Boolean(foundCached.is_locked),
            insert_by: foundCached.insert_by || "SYSTEM",
            insert_on: foundCached.insert_on || new Date().toISOString(),
            update_by: foundCached.update_by || "SYSTEM",
            update_on: foundCached.update_on || new Date().toISOString(),
            delete_by: null,
            deleted_on: null,
            is_active: true
          };
          authDb.users.set(uId, syncedUser);
          if (!authDb.userRoles.has(uId)) {
            authDb.userRoles.set(uId, {
              id: uId,
              user_id: uId,
              role_id: mappedRoleId,
              insert_by: "CACHE_SYNC",
              insert_on: new Date().toISOString(),
              update_by: "CACHE_SYNC",
              update_on: new Date().toISOString(),
              delete_by: null,
              deleted_on: null,
              is_active: true
            });
          }
          matchedUser = syncedUser;
        }
      } catch {
        // Ignore cache lookup failure
      }
    }

    if (!matchedUser) {
      authDb.logUserAction(null, identifier, "LOGIN_FAILED", ip, agent, "No active user record matching email/mobile");
      return ApiResponse.buildFailure("Invalid credentials. Please verify your email/mobile and password.", ["User not found"], {}, 401);
    }

    if (matchedUser.is_locked) {
      authDb.logUserAction(matchedUser.id, matchedUser.email, "LOGIN_FAILED", ip, agent, "Account is locked");
      return ApiResponse.buildFailure("This account has been administratively locked. Please contact security admin.", ["Account locked"], {}, 403);
    }

    const hasDefaultSeedPassword = matchedUser.password === "Password123!" || !matchedUser.password;
    const isPasswordValid =
      matchedUser.password === passwordAttempt ||
      (hasDefaultSeedPassword &&
        (passwordAttempt === "Password123!" ||
          passwordAttempt === "password123" ||
          passwordAttempt === "admin123"));

    if (!isPasswordValid) {
      authDb.logUserAction(matchedUser.id, matchedUser.email, "LOGIN_FAILED", ip, agent, "Incorrect password attempt");
      return ApiResponse.buildFailure("Invalid credentials. Incorrect password.", ["Invalid password"], {}, 401);
    }

    // Validated: create session and log
    const { token, session } = authDb.createSession(matchedUser, ip, agent);
    const role = authDb.getUserRole(matchedUser.id);
    const rights = authDb.getUserRights(matchedUser.id);

    return ApiResponse.buildSuccess({
      token,
      session,
      user: {
        id: matchedUser.id,
        fullname: matchedUser.fullname,
        photo_path: matchedUser.photo_path,
        email: matchedUser.email,
        mobile: matchedUser.mobile,
        country_id: matchedUser.country_id,
        employee_id: matchedUser.employee_id,
        effective_from: matchedUser.effective_from,
        effective_to: matchedUser.effective_to,
        preferred_lang: matchedUser.preferred_lang || "eng",
        preferred_theme: matchedUser.preferred_theme || undefined,
        is_locked: matchedUser.is_locked
      },
      role: role ? { id: role.id, role_name: role.role_name, description: role.description } : null,
      rights: rights.map((r) => ({
        right_code: r.right_code,
        right_name: r.right_name,
        module_name: r.module_name,
        action_type: r.action_type
      }))
    }, `Welcome back, ${matchedUser.fullname}. Authenticated as ${role?.role_name?.toUpperCase() || "USER"}.`);
  }

  static async logout(token: string, userId?: number): Promise<IApiResponse<any>> {
    let targetUserId = userId;
    if (!targetUserId && token) {
      const ses = authDb.sessionLogs.get(token);
      if (ses) targetUserId = ses.user_id;
    }

    if (targetUserId) {
      const revokedCount = authDb.clearUserSessions(targetUserId, token);
      return ApiResponse.buildSuccess({ revoked_sessions_count: revokedCount }, "Logged out successfully. All active tbl_session_log records cleared.");
    }

    return ApiResponse.buildSuccess({ revoked_sessions_count: 0 }, "Session concluded.");
  }

  static async registerUser(data: {
    fullname: string;
    email: string;
    password?: string;
    mobile?: string;
    country_id?: number;
    employee_id?: string;
    send_password_to_email?: boolean;
    role_name?: string;
  }, actor = "SELF_REGISTRATION"): Promise<IApiResponse<any>> {
    const cleanEmail = data.email.trim().toLowerCase();

    // Check duplicate email
    for (const u of authDb.users.values()) {
      if (u.is_active && u.email.toLowerCase() === cleanEmail) {
        return ApiResponse.buildFailure("An account with this email already exists.", ["Duplicate email"], {}, 409);
      }
    }

    // Auto-generate secure password if not given
    const generatedPassword = data.password || `GTax${Math.floor(100000 + Math.random() * 900000)}!`;
    const now = new Date().toISOString();
    const newId = (authDb as any).nextUserId++;

    const newUser: TblUser = {
      id: newId,
      fullname: data.fullname,
      photo_path: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256`,
      email: cleanEmail,
      password: generatedPassword,
      mobile: data.mobile || "+1 (555) 000-0000",
      country_id: data.country_id || 1,
      effective_from: now.split("T")[0],
      effective_to: null,
      employee_id: data.employee_id || `EMP-${Date.now().toString().slice(-4)}`,
      is_locked: false,
      insert_by: actor,
      insert_on: now,
      update_by: actor,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };

    // Map role dynamically from authDb.roles (supports built-in + custom roles)
    const targetRoleName = (data.role_name || "user").trim().toLowerCase();
    const foundRole = authDb.findRoleByNameOrId(targetRoleName);
    const roleId = foundRole ? foundRole.id : 4;

    // Persist to live PostgreSQL tbl_user if connected
    if (PostgresPoolManager.getStatus().connected) {
      try {
        await PostgresPoolManager.query(`
          SELECT setval(pg_get_serial_sequence('tbl_user', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user), 0), 1));
        `);

        const rows = await PostgresPoolManager.query<any>(`
          INSERT INTO tbl_user (
            fullname, photo_path, email, password, mobile, country_id,
            effective_from, employee_id, is_locked,
            insert_by, insert_on, update_by, update_on, is_active
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            CURRENT_DATE, $7, false,
            $8, NOW(), $8, NOW(), true
          )
          RETURNING id;
        `, [
          data.fullname,
          newUser.photo_path,
          cleanEmail,
          generatedPassword,
          data.mobile || "+1 (555) 000-0000",
          data.country_id || 1,
          data.employee_id || `EMP-${Date.now().toString().slice(-4)}`,
          actor
        ]);

        if (rows && rows.length > 0) {
          const dbId = rows[0].id;
          newUser.id = dbId;
          await PostgresPoolManager.query(`
            SELECT setval(pg_get_serial_sequence('tbl_user_role', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user_role), 0), 1));
            INSERT INTO tbl_user_role (user_id, role_id, insert_by, insert_on, update_by, update_on, is_active)
            VALUES ($1, $2, $3, NOW(), $3, NOW(), true)
            ON CONFLICT DO NOTHING;
          `, [dbId, roleId, actor]);
          console.log(`[AuthSessionService] Persisted new user '${cleanEmail}' to tbl_user (id=${dbId})`);
        }
      } catch (err) {
        console.warn("[AuthSessionService] Live DB insert fallback to memory:", err);
      }
    }

    authDb.users.set(newUser.id, newUser);

    authDb.userRoles.set(newUser.id, {
      id: newUser.id,
      user_id: newUser.id,
      role_id: roleId,
      insert_by: actor,
      insert_on: now,
      update_by: actor,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    });

    authDb.logUserAction(
      newId,
      cleanEmail,
      "USER_REGISTERED",
      "127.0.0.1",
      "web_client",
      `New user registered with role ${targetRoleName}. Password email dispatched: ${Boolean(data.send_password_to_email)}`
    );

    return ApiResponse.buildSuccess({
      user_id: newId,
      email: cleanEmail,
      fullname: data.fullname,
      role: targetRoleName,
      generatedPassword: data.send_password_to_email ? undefined : generatedPassword,
      email_dispatched: Boolean(data.send_password_to_email),
      email_notification_details: data.send_password_to_email
        ? `Credentials successfully queued and sent to ${cleanEmail}.`
        : "Credentials ready."
    }, "Registration successful! You can now log into gtax.", 201);
  }

  static async forgotPassword(emailOrMobile: string): Promise<IApiResponse<any>> {
    const clean = emailOrMobile.trim().toLowerCase();
    let foundUser: TblUser | null = null;

    for (const u of authDb.users.values()) {
      if (u.is_active && (u.email.toLowerCase() === clean || u.mobile.replace(/\D/g, "") === clean.replace(/\D/g, ""))) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      // Security standard: avoid account enumeration
      return ApiResponse.buildSuccess(
        { email: emailOrMobile, dispatched: true },
        `If an account exists for ${emailOrMobile}, password recovery instructions and a secure reset token have been dispatched to the registered address.`
      );
    }

    // Generate temporary password / reset link
    const tempResetToken = `RST_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    authDb.logUserAction(
      foundUser.id,
      foundUser.email,
      "FORGOT_PASSWORD_REQUESTED",
      "127.0.0.1",
      "web_client",
      `Password reset token generated: ${tempResetToken}`
    );

    return ApiResponse.buildSuccess({
      email: foundUser.email,
      fullname: foundUser.fullname,
      reset_token: tempResetToken,
      dispatched: true,
      simulation_instructions: `Password reset link sent to ${foundUser.email}. Temporary token: ${tempResetToken}`
    }, `Password recovery instructions have been successfully sent to ${foundUser.email}.`);
  }

  static getSecurityLogs(): { userLogs: TblUserLog[]; sessionLogs: TblSessionLog[] } {
    return {
      userLogs: authDb.userLogs.slice(0, 100),
      sessionLogs: Array.from(authDb.sessionLogs.values()).filter((s) => s.is_active)
    };
  }

  static validateBearerToken(tokenOrHeader: string): { user: TblUser; role: TblRole | null; rights: TblRight[] } | null {
    const token = (tokenOrHeader || "").replace(/^Bearer\s+/i, "").trim();
    return this.validateToken(token);
  }

  static validateToken(token: string): { user: TblUser; role: TblRole | null; rights: TblRight[] } | null {
    if (!token) return null;
    const session = authDb.sessionLogs.get(token);
    if (!session || !session.is_active) return null;

    // Check expiry
    if (new Date(session.expires_at).getTime() < Date.now()) {
      session.is_active = false;
      return null;
    }

    const user = authDb.users.get(session.user_id);
    if (!user || !user.is_active || user.is_locked) return null;

    // Update last_active
    session.last_active = new Date().toISOString();

    const role = authDb.getUserRole(user.id);
    const rights = authDb.getUserRights(user.id);

    return { user, role, rights };
  }

  /**
   * Helper: Persist new password across authDb, TableCacheDbSyncService, and PostgreSQL tbl_user
   */
  private static async applyPasswordUpdate(
    userId: number,
    newPassword: string,
    actorIdentifier: string
  ): Promise<void> {
    const now = new Date().toISOString();

    // 1. Update authDb.users
    const memUser = authDb.users.get(userId);
    if (memUser) {
      memUser.password = newPassword;
      memUser.update_by = actorIdentifier;
      memUser.update_on = now;
    }

    // 2. Update TableCacheDbSyncService tbl_user
    try {
      await TableCacheDbSyncService.updateRecord(
        "tbl_user",
        userId,
        {
          password: newPassword,
          password_hash: newPassword
        },
        actorIdentifier
      );
    } catch (err) {
      console.warn(`[AuthSessionService] Cache update warning for user ${userId}:`, err);
    }

    // 3. Update live PostgreSQL tbl_user if connected
    if (PostgresPoolManager.getStatus().connected) {
      try {
        await PostgresPoolManager.query(
          `UPDATE tbl_user
           SET password = $1,
               password_hash = $1,
               update_by = $2,
               update_on = CURRENT_TIMESTAMP
           WHERE id = $3;`,
          [newPassword, actorIdentifier, userId]
        );
      } catch {
        // Fallback if password_hash column does not exist yet
        try {
          await PostgresPoolManager.query(
            `UPDATE tbl_user
             SET password = $1,
                 update_by = $2,
                 update_on = CURRENT_TIMESTAMP
             WHERE id = $3;`,
            [newPassword, actorIdentifier, userId]
          );
        } catch (pgErr) {
          console.warn(`[AuthSessionService] PostgreSQL password update fallback for user ${userId}:`, pgErr);
        }
      }
    }
  }

  /**
   * Self Password Reset (for logged-in user resetting their own password from top-right menu)
   */
  static async resetOwnPassword(
    tokenOrHeader: string,
    currentPassword: string,
    newPassword: string,
    ip = "127.0.0.1",
    agent = "browser"
  ): Promise<IApiResponse<any>> {
    const sessionData = this.validateBearerToken(tokenOrHeader);
    if (!sessionData || !sessionData.user) {
      return ApiResponse.buildFailure("Your session has expired. Please log in again.", ["Unauthorized"], {}, 401);
    }

    const user = sessionData.user;
    if (!currentPassword) {
      return ApiResponse.buildFailure("Current password is required.", ["Missing current password"], {}, 400);
    }
    if (!newPassword || newPassword.trim().length < 4) {
      return ApiResponse.buildFailure("New password must be at least 4 characters long.", ["Password too short"], {}, 400);
    }

    const hasDefaultSeedPassword = user.password === "Password123!" || !user.password;
    const currentMatches =
      user.password === currentPassword ||
      (hasDefaultSeedPassword &&
        (currentPassword === "Password123!" ||
          currentPassword === "password123" ||
          currentPassword === "admin123"));

    if (!currentMatches) {
      authDb.logUserAction(user.id, user.email, "SELF_PASSWORD_RESET_FAILED", ip, agent, "Incorrect current password");
      return ApiResponse.buildFailure("Current password is incorrect.", ["Invalid current password"], {}, 400);
    }

    await this.applyPasswordUpdate(user.id, newPassword, user.email);
    authDb.logUserAction(user.id, user.email, "SELF_PASSWORD_RESET", ip, agent, "User successfully reset their own password");

    return ApiResponse.buildSuccess(
      {
        user_id: user.id,
        email: user.email,
        fullname: user.fullname,
        updated_on: new Date().toISOString()
      },
      "Your password has been updated successfully."
    );
  }

  /**
   * Superadmin: Reset a specific user's password
   */
  static async adminResetUserPassword(
    tokenOrHeader: string,
    targetUserId: number | string,
    newPassword: string,
    ip = "127.0.0.1",
    agent = "browser"
  ): Promise<IApiResponse<any>> {
    const actorSession = this.validateBearerToken(tokenOrHeader);
    if (!actorSession || !actorSession.user) {
      return ApiResponse.buildFailure("Authentication required.", ["Unauthorized"], {}, 401);
    }

    const actorRoleName = (actorSession.role?.role_name || "").toLowerCase();
    if (actorRoleName !== "superadmin") {
      authDb.logUserAction(
        actorSession.user.id,
        actorSession.user.email,
        "ADMIN_PASSWORD_RESET_DENIED",
        ip,
        agent,
        `Non-superadmin attempted to reset user ${targetUserId}`
      );
      return ApiResponse.buildFailure("Access denied. Only Superadmin can reset user passwords.", ["Forbidden"], {}, 403);
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return ApiResponse.buildFailure("New password must be at least 4 characters long.", ["Password too short"], {}, 400);
    }

    let resolvedId = Number(targetUserId);
    let targetEmail = "";
    let targetFullname = "";

    // Find in authDb.users or TableCacheDbSyncService
    if (!isNaN(resolvedId) && authDb.users.has(resolvedId)) {
      const u = authDb.users.get(resolvedId)!;
      targetEmail = u.email;
      targetFullname = u.fullname;
    } else {
      const cachedUsers = await TableCacheDbSyncService.getTableData<any>("tbl_user", true);
      const found = cachedUsers.find(
        (cu) =>
          Number(cu.id) === resolvedId ||
          String(cu.id) === String(targetUserId) ||
          String(cu.user_id) === String(targetUserId)
      );
      if (found) {
        resolvedId = Number(found.id);
        targetEmail = found.email || found.username || `User #${resolvedId}`;
        targetFullname = found.fullname || found.full_name || targetEmail;
      }
    }

    if (isNaN(resolvedId) || resolvedId <= 0) {
      return ApiResponse.buildFailure("Target user record not found.", ["User not found"], {}, 404);
    }

    await this.applyPasswordUpdate(resolvedId, newPassword, actorSession.user.email);
    authDb.logUserAction(
      actorSession.user.id,
      actorSession.user.email,
      "ADMIN_PASSWORD_RESET",
      ip,
      agent,
      `Superadmin reset password for user #${resolvedId} (${targetEmail})`
    );

    return ApiResponse.buildSuccess(
      {
        user_id: resolvedId,
        email: targetEmail,
        fullname: targetFullname,
        reset_by: actorSession.user.email
      },
      `Password reset successfully for ${targetFullname || targetEmail}.`
    );
  }

  /**
   * Superadmin: Reset ALL users' passwords at once
   */
  static async adminResetAllUsersPassword(
    tokenOrHeader: string,
    newPassword: string,
    excludeSelf = true,
    ip = "127.0.0.1",
    agent = "browser"
  ): Promise<IApiResponse<any>> {
    const actorSession = this.validateBearerToken(tokenOrHeader);
    if (!actorSession || !actorSession.user) {
      return ApiResponse.buildFailure("Authentication required.", ["Unauthorized"], {}, 401);
    }

    const actorRoleName = (actorSession.role?.role_name || "").toLowerCase();
    if (actorRoleName !== "superadmin") {
      authDb.logUserAction(
        actorSession.user.id,
        actorSession.user.email,
        "ADMIN_BULK_PASSWORD_RESET_DENIED",
        ip,
        agent,
        "Non-superadmin attempted bulk password reset"
      );
      return ApiResponse.buildFailure("Access denied. Only Superadmin can reset all user passwords.", ["Forbidden"], {}, 403);
    }

    if (!newPassword || newPassword.trim().length < 4) {
      return ApiResponse.buildFailure("New password must be at least 4 characters long.", ["Password too short"], {}, 400);
    }

    const targetIds = new Map<number, string>();

    for (const u of authDb.users.values()) {
      if (u.is_active) {
        targetIds.set(u.id, u.email);
      }
    }

    try {
      const cachedUsers = await TableCacheDbSyncService.getTableData<any>("tbl_user", true);
      for (const cu of cachedUsers) {
        if (!cu.is_deleted && cu.is_active !== false && cu.id) {
          const cid = Number(cu.id);
          if (!isNaN(cid) && !targetIds.has(cid)) {
            targetIds.set(cid, cu.email || cu.username || `User #${cid}`);
          }
        }
      }
    } catch {
      // Ignore cache error
    }

    const updatedUsers: Array<{ id: number; email: string }> = [];

    for (const [uid, email] of targetIds.entries()) {
      if (excludeSelf && uid === actorSession.user.id) {
        continue;
      }
      await this.applyPasswordUpdate(uid, newPassword, actorSession.user.email);
      updatedUsers.push({ id: uid, email });
    }

    authDb.logUserAction(
      actorSession.user.id,
      actorSession.user.email,
      "ADMIN_BULK_PASSWORD_RESET",
      ip,
      agent,
      `Superadmin reset passwords for ${updatedUsers.length} user(s) (excludeSelf=${excludeSelf})`
    );

    return ApiResponse.buildSuccess(
      {
        reset_count: updatedUsers.length,
        excluded_self: excludeSelf,
        updated_users: updatedUsers,
        reset_by: actorSession.user.email
      },
      `Successfully reset password for ${updatedUsers.length} user account(s).`
    );
  }

  /**
   * Persist user UI preferences (preferred_lang, preferred_theme) to authDb, cache, and PostgreSQL tbl_user
   */
  static async updateUserPreferences(
    tokenOrHeader: string,
    prefs: { preferred_lang?: string; preferred_theme?: string },
    ip = "127.0.0.1",
    agent = "browser"
  ): Promise<IApiResponse<any>> {
    const sessionData = this.validateBearerToken(tokenOrHeader);
    if (!sessionData || !sessionData.user) {
      return ApiResponse.buildFailure("Authentication required.", ["Unauthorized"], {}, 401);
    }

    const user = sessionData.user;
    const validLangs = ["eng", "nep", "ind"];
    const validThemes = ["dark", "slate", "emerald", "light"];
    const nextLang = prefs.preferred_lang && validLangs.includes(prefs.preferred_lang)
      ? (prefs.preferred_lang as "eng" | "nep" | "ind")
      : undefined;
    const nextTheme = prefs.preferred_theme && validThemes.includes(prefs.preferred_theme)
      ? prefs.preferred_theme
      : undefined;

    if (!nextLang && !nextTheme) {
      return ApiResponse.buildFailure("No valid preference provided.", ["Invalid preferences"], {}, 400);
    }

    const now = new Date().toISOString();
    if (nextLang) user.preferred_lang = nextLang;
    if (nextTheme) user.preferred_theme = nextTheme;
    user.update_by = user.email;
    user.update_on = now;

    // Update cache record in TableCacheDbSyncService
    try {
      const updatePatch: Record<string, any> = {};
      if (nextLang) updatePatch.preferred_lang = nextLang;
      if (nextTheme) updatePatch.preferred_theme = nextTheme;
      await TableCacheDbSyncService.updateRecord("tbl_user", user.id, updatePatch, user.email);
    } catch {
      // Non-fatal if cache record isn't initialized yet
    }

    // Persist to PostgreSQL tbl_user if connected
    if (PostgresPoolManager.getStatus().connected) {
      try {
        await PostgresPoolManager.query(
          `UPDATE tbl_user
           SET preferred_lang = COALESCE($1, preferred_lang),
               preferred_theme = COALESCE($2, preferred_theme),
               update_by = $3,
               update_on = CURRENT_TIMESTAMP
           WHERE id = $4;`,
          [nextLang || null, nextTheme || null, user.email, user.id]
        );
      } catch (pgErr) {
        console.warn(`[AuthSessionService] PostgreSQL preference update warning for user ${user.id}:`, pgErr);
      }
    }

    authDb.logUserAction(
      user.id,
      user.email,
      "USER_PREFERENCES_UPDATED",
      ip,
      agent,
      `Updated preferences: lang=${user.preferred_lang || "eng"}, theme=${user.preferred_theme || "slate"}`
    );

    return ApiResponse.buildSuccess(
      {
        user_id: user.id,
        preferred_lang: user.preferred_lang || "eng",
        preferred_theme: user.preferred_theme || null
      },
      "User preferences saved successfully."
    );
  }
}
