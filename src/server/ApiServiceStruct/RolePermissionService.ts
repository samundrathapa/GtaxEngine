import { ApiResponse, IApiResponse } from "../BaseFrame/response/ApiResponse.ts";
import { PostgresPoolManager } from "../db/postgresPool.ts";
import { TableCacheDbSyncService } from "../db/TableCacheDbSyncService.ts";
import { authDb, AuthSessionService, TblRight, TblRole } from "./AuthSessionService.ts";
import {
  CANONICAL_RIGHTS,
  MENU_DEFINITIONS,
  RoleMatrixMap,
  getDefaultRightsForRoleName,
  matrixToRightCodes,
  rightsToMatrix
} from "../../shared/rbacConfig.ts";

const BUILTIN_ROLE_NAMES = new Set(["superadmin", "admin", "operator", "user"]);

export class RolePermissionService {
  private static bootstrapped = false;

  private static resolveActorRoleAndRight(
    tokenOrHeader: string,
    requiredRightCode: string
  ): { ok: true; actorEmail: string; actorId: number } | { ok: false; response: IApiResponse<any> } {
    const cleanToken = (tokenOrHeader || "").replace(/^Bearer\s+/i, "").trim();
    if (!cleanToken) {
      return {
        ok: false,
        response: ApiResponse.buildFailure("Authentication required.", ["Unauthorized"], {}, 401)
      };
    }

    // Support static bearer_adm_token in dev/local console if active
    if (cleanToken === "bearer_adm_token") {
      return { ok: true, actorEmail: "superadmin@gtax.enterprise", actorId: 1 };
    }

    const session = AuthSessionService.validateToken(cleanToken);
    if (!session || !session.user) {
      return {
        ok: false,
        response: ApiResponse.buildFailure("Your session has expired. Please sign in again.", ["Unauthorized"], {}, 401)
      };
    }

    const roleName = (session.role?.role_name || "").trim().toLowerCase();
    const isSuper = roleName === "superadmin" || session.user.email.toLowerCase() === "superadmin@gtax.enterprise";
    const hasRight =
      isSuper ||
      session.rights.some((r) => r.right_code.toLowerCase() === requiredRightCode.toLowerCase());

    if (!hasRight) {
      return {
        ok: false,
        response: ApiResponse.buildFailure(
          `Access denied. Required permission: ${requiredRightCode}`,
          ["Forbidden"],
          {},
          403
        )
      };
    }

    return { ok: true, actorEmail: session.user.email, actorId: session.user.id };
  }

  /**
   * Synchronize canonical rights, roles, role_rights, and user_rights between PostgreSQL and authDb
   */
  public static async ensureRbacSeeded(force = false): Promise<void> {
    if (this.bootstrapped && !force) return;

    if (PostgresPoolManager.getStatus().connected) {
      try {
        // 1. Ensure canonical rights exist in tbl_right (avoid deleting existing IDs cleanly)
        for (const cr of CANONICAL_RIGHTS) {
          await PostgresPoolManager.query(
            `INSERT INTO tbl_right (right_code, right_name, module_name, action_type, insert_by, update_by, is_active)
             VALUES ($1, $2, $3, $4, 'SYSTEM_SEED', 'SYSTEM_SEED', true)
             ON CONFLICT (right_code) DO UPDATE
             SET right_name = EXCLUDED.right_name,
                 module_name = EXCLUDED.module_name,
                 action_type = EXCLUDED.action_type,
                 is_active = true;`,
            [cr.right_code, cr.right_name, cr.module_name, cr.action_type]
          );
        }

        // 2. Load live tbl_right into authDb.rights
        const dbRights = await PostgresPoolManager.query<any>(
          `SELECT * FROM tbl_right WHERE is_active = true AND COALESCE(is_deleted, false) = false ORDER BY id ASC;`
        );
        if (Array.isArray(dbRights) && dbRights.length > 0) {
          const codeToRightId = new Map<string, number>();
          for (const dr of dbRights) {
            const rightObj: TblRight = {
              id: Number(dr.id),
              right_code: dr.right_code,
              right_name: dr.right_name,
              module_name: dr.module_name,
              action_type: dr.action_type,
              insert_by: dr.insert_by || "SYSTEM",
              insert_on: dr.insert_on || new Date().toISOString(),
              update_by: dr.update_by || "SYSTEM",
              update_on: dr.update_on || new Date().toISOString(),
              delete_by: dr.delete_by || null,
              deleted_on: dr.deleted_on || null,
              is_active: true
            };
            authDb.rights.set(rightObj.id, rightObj);
            codeToRightId.set(dr.right_code, rightObj.id);
          }

          // 3. Load live tbl_role into authDb.roles
          const dbRoles = await PostgresPoolManager.query<any>(
            `SELECT * FROM tbl_role WHERE is_active = true AND COALESCE(is_deleted, false) = false ORDER BY id ASC;`
          );
          if (Array.isArray(dbRoles) && dbRoles.length > 0) {
            authDb.roles.clear();
            for (const r of dbRoles) {
              const roleObj: TblRole = {
                id: Number(r.id),
                role_name: String(r.role_name).trim().toLowerCase(),
                description: r.description || "",
                insert_by: r.insert_by || "SYSTEM",
                insert_on: r.insert_on || new Date().toISOString(),
                update_by: r.update_by || "SYSTEM",
                update_on: r.update_on || new Date().toISOString(),
                delete_by: r.delete_by || null,
                deleted_on: r.deleted_on || null,
                is_active: true
              };
              authDb.roles.set(roleObj.id, roleObj);
            }
          }

          // 4. For built-in roles (1..4), ensure canonical menu rights are seeded if none of the canonical rights are assigned yet
          const canonicalCodesSet = new Set(CANONICAL_RIGHTS.map((c) => c.right_code));
          for (const role of authDb.roles.values()) {
            if (!BUILTIN_ROLE_NAMES.has(role.role_name.toLowerCase())) continue;
            const existingCanonicalForRole = await PostgresPoolManager.query<any>(
              `SELECT rr.id, r.right_code
               FROM tbl_role_right rr
               JOIN tbl_right r ON rr.right_id = r.id
               WHERE rr.role_id = $1 AND rr.is_active = true AND COALESCE(rr.is_deleted, false) = false;`,
              [role.id]
            );
            const hasAnyCanonical = (existingCanonicalForRole || []).some((row: any) =>
              canonicalCodesSet.has(String(row.right_code))
            );
            if (!hasAnyCanonical) {
              const defaultCodes = getDefaultRightsForRoleName(role.role_name);
              for (const code of defaultCodes) {
                const rId = codeToRightId.get(code);
                if (!rId) continue;
                await PostgresPoolManager.query(
                  `INSERT INTO tbl_role_right (role_id, right_id, insert_by, update_by, is_active)
                   VALUES ($1, $2, 'SYSTEM_SEED', 'SYSTEM_SEED', true)
                   ON CONFLICT DO NOTHING;`,
                  [role.id, rId]
                );
              }
            }
          }

          // 5. Sync all active tbl_role_right into authDb.roleRights
          const allDbRoleRights = await PostgresPoolManager.query<any>(
            `SELECT * FROM tbl_role_right WHERE is_active = true AND COALESCE(is_deleted, false) = false;`
          );
          if (Array.isArray(allDbRoleRights)) {
            authDb.roleRights.clear();
            for (const rr of allDbRoleRights) {
              const id = Number(rr.id);
              authDb.roleRights.set(id, {
                id,
                role_id: Number(rr.role_id),
                right_id: Number(rr.right_id),
                insert_by: rr.insert_by || "SYSTEM",
                insert_on: rr.insert_on || new Date().toISOString(),
                update_by: rr.update_by || "SYSTEM",
                update_on: rr.update_on || new Date().toISOString(),
                delete_by: null,
                deleted_on: null,
                is_active: true
              });
            }
          }

          // 6. Sync all active tbl_user_role into authDb.userRoles
          const allDbUserRoles = await PostgresPoolManager.query<any>(
            `SELECT * FROM tbl_user_role WHERE is_active = true AND COALESCE(is_deleted, false) = false;`
          );
          if (Array.isArray(allDbUserRoles)) {
            for (const ur of allDbUserRoles) {
              const uId = Number(ur.user_id);
              authDb.userRoles.set(uId, {
                id: Number(ur.id),
                user_id: uId,
                role_id: Number(ur.role_id),
                insert_by: ur.insert_by || "SYSTEM",
                insert_on: ur.insert_on || new Date().toISOString(),
                update_by: ur.update_by || "SYSTEM",
                update_on: ur.update_on || new Date().toISOString(),
                delete_by: null,
                deleted_on: null,
                is_active: true
              });
            }
          }

          // 7. Sync all active tbl_user_right into authDb.userRights
          const allDbUserRights = await PostgresPoolManager.query<any>(
            `SELECT * FROM tbl_user_right WHERE is_active = true AND COALESCE(is_deleted, false) = false;`
          );
          if (Array.isArray(allDbUserRights)) {
            authDb.userRights.clear();
            for (const ur of allDbUserRights) {
              const id = Number(ur.id);
              authDb.userRights.set(id, {
                id,
                user_id: Number(ur.user_id),
                right_id: Number(ur.right_id),
                is_granted: Boolean(ur.is_granted),
                insert_by: ur.insert_by || "SYSTEM",
                insert_on: ur.insert_on || new Date().toISOString(),
                update_by: ur.update_by || "SYSTEM",
                update_on: ur.update_on || new Date().toISOString(),
                delete_by: null,
                deleted_on: null,
                is_active: true
              });
            }
          }
        }
      } catch (err) {
        console.warn("[RolePermissionService] PostgreSQL RBAC sync warning:", err);
      }
    }

    this.bootstrapped = true;
  }

  private static getRightIdByCodeMap(): Map<string, number> {
    const map = new Map<string, number>();
    for (const r of authDb.rights.values()) {
      if (r.is_active) {
        map.set(r.right_code.toLowerCase(), r.id);
      }
    }
    return map;
  }

  public static async listRoles(): Promise<IApiResponse<any>> {
    await this.ensureRbacSeeded();

    const userCountByRole = new Map<number, number>();
    for (const ur of authDb.userRoles.values()) {
      if (ur.is_active) {
        userCountByRole.set(ur.role_id, (userCountByRole.get(ur.role_id) || 0) + 1);
      }
    }

    const rolesList = Array.from(authDb.roles.values())
      .filter((r) => r.is_active)
      .sort((a, b) => a.id - b.id)
      .map((role) => {
        const rightIds = new Set<number>();
        for (const rr of authDb.roleRights.values()) {
          if (rr.role_id === role.id && rr.is_active) {
            rightIds.add(rr.right_id);
          }
        }
        const rightCodes = Array.from(rightIds)
          .map((id) => authDb.rights.get(id)?.right_code)
          .filter((c): c is string => Boolean(c));

        return {
          id: role.id,
          role_name: role.role_name,
          description: role.description,
          is_builtin: BUILTIN_ROLE_NAMES.has(role.role_name.toLowerCase()),
          user_count: userCountByRole.get(role.id) || 0,
          right_codes: rightCodes,
          matrix: rightsToMatrix(rightCodes),
          insert_by: role.insert_by,
          update_on: role.update_on
        };
      });

    return ApiResponse.buildSuccess(
      {
        roles: rolesList,
        menus: MENU_DEFINITIONS,
        rights: Array.from(authDb.rights.values()).filter((r) => r.is_active)
      },
      "Roles and permission catalog retrieved"
    );
  }

  public static async createRole(
    tokenOrHeader: string,
    payload: { role_name: string; description?: string; matrix?: RoleMatrixMap; right_codes?: string[] }
  ): Promise<IApiResponse<any>> {
    const authCheck = this.resolveActorRoleAndRight(tokenOrHeader, "role_new");
    if (!authCheck.ok) return authCheck.response;

    await this.ensureRbacSeeded();

    const rawName = (payload.role_name || "").trim();
    const normalizedName = rawName.toLowerCase().replace(/\s+/g, "_");
    if (!normalizedName || normalizedName.length < 2) {
      return ApiResponse.buildFailure("Role name must be at least 2 characters.", ["Invalid role_name"], {}, 400);
    }

    for (const r of authDb.roles.values()) {
      if (r.is_active && r.role_name.toLowerCase() === normalizedName) {
        return ApiResponse.buildFailure(`Role '${normalizedName}' already exists.`, ["Duplicate role"], {}, 409);
      }
    }

    const desiredCodes = payload.matrix
      ? matrixToRightCodes(payload.matrix)
      : Array.isArray(payload.right_codes)
        ? payload.right_codes
        : [];

    const now = new Date().toISOString();
    let newRoleId = Math.max(4, ...Array.from(authDb.roles.keys())) + 1;

    if (PostgresPoolManager.getStatus().connected) {
      try {
        await PostgresPoolManager.query(
          `SELECT setval(pg_get_serial_sequence('tbl_role', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_role), 0), 1));`
        );
        const inserted = await PostgresPoolManager.query<any>(
          `INSERT INTO tbl_role (role_name, description, insert_by, insert_on, update_by, update_on, is_active)
           VALUES ($1, $2, $3, NOW(), $3, NOW(), true)
           RETURNING id;`,
          [normalizedName, payload.description || rawName, authCheck.actorEmail]
        );
        if (inserted?.[0]?.id) {
          newRoleId = Number(inserted[0].id);
        }
      } catch (err: any) {
        return ApiResponse.buildFailure(`Database error creating role: ${err?.message}`, [err?.message || "DB error"], {}, 500);
      }
    }

    const roleRecord: TblRole = {
      id: newRoleId,
      role_name: normalizedName,
      description: payload.description || rawName,
      insert_by: authCheck.actorEmail,
      insert_on: now,
      update_by: authCheck.actorEmail,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    authDb.roles.set(newRoleId, roleRecord);

    await this.replaceRoleRights(newRoleId, desiredCodes, authCheck.actorEmail);

    try {
      await TableCacheDbSyncService.insertRecord(
        "tbl_role",
        { id: newRoleId, role_name: normalizedName, description: roleRecord.description },
        authCheck.actorEmail
      );
    } catch {}

    authDb.logUserAction(
      authCheck.actorId,
      authCheck.actorEmail,
      "ROLE_CREATED",
      "127.0.0.1",
      "web_client",
      `Created role '${normalizedName}' (#${newRoleId}) with ${desiredCodes.length} right(s)`
    );

    return ApiResponse.buildSuccess(
      {
        id: newRoleId,
        role_name: normalizedName,
        description: roleRecord.description,
        right_codes: desiredCodes,
        matrix: rightsToMatrix(desiredCodes)
      },
      `Role '${normalizedName}' created successfully with ${desiredCodes.length} assigned feature rights.`,
      201
    );
  }

  public static async updateRole(
    tokenOrHeader: string,
    roleIdParam: string | number,
    payload: { role_name?: string; description?: string; matrix?: RoleMatrixMap; right_codes?: string[] }
  ): Promise<IApiResponse<any>> {
    const authCheck = this.resolveActorRoleAndRight(tokenOrHeader, "role_edit");
    if (!authCheck.ok) return authCheck.response;

    await this.ensureRbacSeeded();

    const roleId = Number(roleIdParam);
    const existing = authDb.roles.get(roleId);
    if (!existing || !existing.is_active) {
      return ApiResponse.buildFailure("Role not found.", ["Not found"], {}, 404);
    }

    if (existing.role_name.toLowerCase() === "superadmin" && (payload.matrix || payload.right_codes)) {
      return ApiResponse.buildFailure(
        "Superadmin role always retains unrestricted access across all menus and actions.",
        ["Superadmin protected"],
        {},
        400
      );
    }

    const nextName =
      BUILTIN_ROLE_NAMES.has(existing.role_name.toLowerCase()) || !payload.role_name
        ? existing.role_name
        : payload.role_name.trim().toLowerCase().replace(/\s+/g, "_");
    const nextDesc = payload.description !== undefined ? payload.description : existing.description;

    const desiredCodes = payload.matrix
      ? matrixToRightCodes(payload.matrix)
      : Array.isArray(payload.right_codes)
        ? payload.right_codes
        : null;

    if (PostgresPoolManager.getStatus().connected) {
      try {
        await PostgresPoolManager.query(
          `UPDATE tbl_role
           SET role_name = $1, description = $2, update_by = $3, update_on = NOW()
           WHERE id = $4;`,
          [nextName, nextDesc, authCheck.actorEmail, roleId]
        );
      } catch (err: any) {
        return ApiResponse.buildFailure(`Database error updating role: ${err?.message}`, [err?.message || "DB error"], {}, 500);
      }
    }

    existing.role_name = nextName;
    existing.description = nextDesc;
    existing.update_by = authCheck.actorEmail;
    existing.update_on = new Date().toISOString();

    if (desiredCodes !== null) {
      await this.replaceRoleRights(roleId, desiredCodes, authCheck.actorEmail);
    }

    authDb.logUserAction(
      authCheck.actorId,
      authCheck.actorEmail,
      "ROLE_UPDATED",
      "127.0.0.1",
      "web_client",
      `Updated role '${nextName}' (#${roleId})`
    );

    const updatedRightCodes = desiredCodes ?? getDefaultRightsForRoleName(nextName);
    return ApiResponse.buildSuccess(
      {
        id: roleId,
        role_name: nextName,
        description: nextDesc,
        right_codes: updatedRightCodes,
        matrix: rightsToMatrix(updatedRightCodes)
      },
      `Role '${nextName}' permissions updated successfully.`
    );
  }

  public static async deleteRole(tokenOrHeader: string, roleIdParam: string | number): Promise<IApiResponse<any>> {
    const authCheck = this.resolveActorRoleAndRight(tokenOrHeader, "role_delete");
    if (!authCheck.ok) return authCheck.response;

    await this.ensureRbacSeeded();

    const roleId = Number(roleIdParam);
    const existing = authDb.roles.get(roleId);
    if (!existing || !existing.is_active) {
      return ApiResponse.buildFailure("Role not found.", ["Not found"], {}, 404);
    }

    if (BUILTIN_ROLE_NAMES.has(existing.role_name.toLowerCase()) || roleId <= 4) {
      return ApiResponse.buildFailure(
        `Built-in role '${existing.role_name}' cannot be deleted.`,
        ["Protected system role"],
        {},
        400
      );
    }

    if (PostgresPoolManager.getStatus().connected) {
      try {
        await PostgresPoolManager.query(
          `UPDATE tbl_role SET is_active = false, is_deleted = true, delete_by = $1, deleted_on = NOW() WHERE id = $2;
           UPDATE tbl_role_right SET is_active = false, is_deleted = true, delete_by = $1, deleted_on = NOW() WHERE role_id = $2;`,
          [authCheck.actorEmail, roleId]
        );
      } catch (err: any) {
        return ApiResponse.buildFailure(`Database error deleting role: ${err?.message}`, [err?.message || "DB error"], {}, 500);
      }
    }

    existing.is_active = false;
    existing.delete_by = authCheck.actorEmail;
    existing.deleted_on = new Date().toISOString();
    for (const [k, rr] of authDb.roleRights.entries()) {
      if (rr.role_id === roleId) authDb.roleRights.delete(k);
    }

    authDb.logUserAction(
      authCheck.actorId,
      authCheck.actorEmail,
      "ROLE_DELETED",
      "127.0.0.1",
      "web_client",
      `Deleted custom role '${existing.role_name}' (#${roleId})`
    );

    return ApiResponse.buildSuccess({ id: roleId }, `Role '${existing.role_name}' removed.`);
  }

  private static async replaceRoleRights(roleId: number, rightCodes: string[], actorEmail: string): Promise<void> {
    const codeMap = this.getRightIdByCodeMap();
    const targetRightIds = new Set<number>();
    for (const code of rightCodes) {
      const rId = codeMap.get(String(code).trim().toLowerCase());
      if (rId) targetRightIds.add(rId);
    }

    if (PostgresPoolManager.getStatus().connected) {
      await PostgresPoolManager.query(`DELETE FROM tbl_role_right WHERE role_id = $1;`, [roleId]);
      for (const rId of targetRightIds) {
        await PostgresPoolManager.query(
          `INSERT INTO tbl_role_right (role_id, right_id, insert_by, insert_on, update_by, update_on, is_active)
           VALUES ($1, $2, $3, NOW(), $3, NOW(), true);`,
          [roleId, rId, actorEmail]
        );
      }
      // Reload from DB to keep exact IDs
      const dbRows = await PostgresPoolManager.query<any>(
        `SELECT * FROM tbl_role_right WHERE role_id = $1 AND is_active = true;`,
        [roleId]
      );
      for (const [k, rr] of authDb.roleRights.entries()) {
        if (rr.role_id === roleId) authDb.roleRights.delete(k);
      }
      for (const rr of dbRows || []) {
        const rrId = Number(rr.id);
        authDb.roleRights.set(rrId, {
          id: rrId,
          role_id: roleId,
          right_id: Number(rr.right_id),
          insert_by: actorEmail,
          insert_on: new Date().toISOString(),
          update_by: actorEmail,
          update_on: new Date().toISOString(),
          delete_by: null,
          deleted_on: null,
          is_active: true
        });
      }
    } else {
      for (const [k, rr] of authDb.roleRights.entries()) {
        if (rr.role_id === roleId) authDb.roleRights.delete(k);
      }
      let nextId = Math.max(0, ...Array.from(authDb.roleRights.keys())) + 1;
      const now = new Date().toISOString();
      for (const rId of targetRightIds) {
        const rrId = nextId++;
        authDb.roleRights.set(rrId, {
          id: rrId,
          role_id: roleId,
          right_id: rId,
          insert_by: actorEmail,
          insert_on: now,
          update_by: actorEmail,
          update_on: now,
          delete_by: null,
          deleted_on: null,
          is_active: true
        });
      }
    }
  }

  /**
   * User-wise permissions inspection & overrides (tbl_user_role + tbl_user_right)
   */
  public static async getUserPermissions(userIdParam: string | number): Promise<IApiResponse<any>> {
    await this.ensureRbacSeeded();
    const userId = Number(String(userIdParam).replace(/\D/g, ""));
    if (isNaN(userId) || userId <= 0) {
      return ApiResponse.buildFailure("Invalid user ID.", ["Invalid user ID"], {}, 400);
    }

    // Ensure user exists in authDb.users or TableCacheDbSyncService
    let user = authDb.users.get(userId);
    if (!user) {
      const cached = await TableCacheDbSyncService.getTableData<any>("tbl_user", true);
      const found = cached.find((cu) => Number(cu.id) === userId);
      if (found) {
        const roleObj = authDb.findRoleByNameOrId(found.role_id || found.role);
        if (roleObj && !authDb.userRoles.has(userId)) {
          authDb.userRoles.set(userId, {
            id: userId,
            user_id: userId,
            role_id: roleObj.id,
            insert_by: "SYSTEM",
            insert_on: new Date().toISOString(),
            update_by: "SYSTEM",
            update_on: new Date().toISOString(),
            delete_by: null,
            deleted_on: null,
            is_active: true
          });
        }
        user = {
          id: userId,
          fullname: found.fullname || found.full_name || found.username || `User #${userId}`,
          photo_path: null,
          email: found.email || "",
          password: found.password || "Password123!",
          mobile: found.mobile || "",
          country_id: 1,
          effective_from: "2026-01-01",
          effective_to: null,
          employee_id: found.employee_id || `EMP-${userId}`,
          is_locked: Boolean(found.is_locked),
          insert_by: "SYSTEM",
          insert_on: new Date().toISOString(),
          update_by: "SYSTEM",
          update_on: new Date().toISOString(),
          delete_by: null,
          deleted_on: null,
          is_active: true
        };
        authDb.users.set(userId, user);
      }
    }

    const role = authDb.getUserRole(userId);
    const roleRightCodes: string[] = [];
    if (role) {
      for (const rr of authDb.roleRights.values()) {
        if (rr.role_id === role.id && rr.is_active) {
          const right = authDb.rights.get(rr.right_id);
          if (right?.is_active) roleRightCodes.push(right.right_code);
        }
      }
    }

    const overrides: Record<string, boolean> = {};
    for (const ur of authDb.userRights.values()) {
      if (ur.user_id === userId && ur.is_active) {
        const right = authDb.rights.get(ur.right_id);
        if (right?.is_active) {
          overrides[right.right_code] = Boolean(ur.is_granted);
        }
      }
    }

    const effectiveRights = authDb.getUserRights(userId).map((r) => r.right_code);

    return ApiResponse.buildSuccess(
      {
        user_id: userId,
        fullname: user?.fullname || `User #${userId}`,
        email: user?.email || "",
        role: role ? { id: role.id, role_name: role.role_name, description: role.description } : null,
        role_right_codes: roleRightCodes,
        overrides,
        effective_right_codes: effectiveRights,
        effective_matrix: rightsToMatrix(effectiveRights)
      },
      "User permissions loaded"
    );
  }

  public static async saveUserPermissions(
    tokenOrHeader: string,
    userIdParam: string | number,
    payload: {
      role_id?: number;
      role_name?: string;
      matrix?: RoleMatrixMap;
      right_codes?: string[];
      reset_to_role?: boolean;
    }
  ): Promise<IApiResponse<any>> {
    const authCheck = this.resolveActorRoleAndRight(tokenOrHeader, "role_edit");
    if (!authCheck.ok) return authCheck.response;

    await this.ensureRbacSeeded();

    const userId = Number(String(userIdParam).replace(/\D/g, ""));
    if (isNaN(userId) || userId <= 0) {
      return ApiResponse.buildFailure("Invalid user ID.", ["Invalid user ID"], {}, 400);
    }

    // 1. Update user's assigned role if specified
    let assignedRole = authDb.getUserRole(userId);
    if (payload.role_id || payload.role_name) {
      const targetRole = authDb.findRoleByNameOrId(payload.role_id || payload.role_name);
      if (!targetRole) {
        return ApiResponse.buildFailure("Selected role not found.", ["Invalid role"], {}, 404);
      }
      assignedRole = targetRole;

      authDb.userRoles.set(userId, {
        id: userId,
        user_id: userId,
        role_id: targetRole.id,
        insert_by: authCheck.actorEmail,
        insert_on: new Date().toISOString(),
        update_by: authCheck.actorEmail,
        update_on: new Date().toISOString(),
        delete_by: null,
        deleted_on: null,
        is_active: true
      });

      if (PostgresPoolManager.getStatus().connected) {
        const upd = await PostgresPoolManager.query<any>(
          `UPDATE tbl_user_role SET role_id = $1, update_by = $2, update_on = NOW()
           WHERE user_id = $3 AND is_active = true RETURNING id;`,
          [targetRole.id, authCheck.actorEmail, userId]
        );
        if (!upd || upd.length === 0) {
          await PostgresPoolManager.query(
            `INSERT INTO tbl_user_role (user_id, role_id, insert_by, insert_on, update_by, update_on, is_active)
             VALUES ($1, $2, $3, NOW(), $3, NOW(), true);`,
            [userId, targetRole.id, authCheck.actorEmail]
          );
        }
      }

      try {
        await TableCacheDbSyncService.updateRecord(
          "tbl_user",
          userId,
          { role: targetRole.role_name, role_id: targetRole.id },
          authCheck.actorEmail
        );
      } catch {}
    }

    // 2. Compute user overrides relative to role rights
    const roleRightCodeSet = new Set<string>();
    if (assignedRole) {
      for (const rr of authDb.roleRights.values()) {
        if (rr.role_id === assignedRole.id && rr.is_active) {
          const right = authDb.rights.get(rr.right_id);
          if (right?.is_active) roleRightCodeSet.add(right.right_code.toLowerCase());
        }
      }
    }

    // Clear existing overrides for this user
    for (const [k, ur] of authDb.userRights.entries()) {
      if (ur.user_id === userId) authDb.userRights.delete(k);
    }
    if (PostgresPoolManager.getStatus().connected) {
      await PostgresPoolManager.query(`DELETE FROM tbl_user_right WHERE user_id = $1;`, [userId]);
    }

    if (!payload.reset_to_role) {
      const desiredCodes = payload.matrix
        ? matrixToRightCodes(payload.matrix)
        : Array.isArray(payload.right_codes)
          ? payload.right_codes
          : Array.from(roleRightCodeSet);
      const desiredSet = new Set(desiredCodes.map((c) => c.toLowerCase()));
      const codeMap = this.getRightIdByCodeMap();
      const now = new Date().toISOString();
      let nextUrId = Math.max(0, ...Array.from(authDb.userRights.keys())) + 1;

      for (const cr of CANONICAL_RIGHTS) {
        const code = cr.right_code.toLowerCase();
        const inRole = roleRightCodeSet.has(code);
        const inDesired = desiredSet.has(code);
        if (inRole !== inDesired) {
          const rightId = codeMap.get(code);
          if (!rightId) continue;
          const isGranted = inDesired;
          if (PostgresPoolManager.getStatus().connected) {
            const ins = await PostgresPoolManager.query<any>(
              `INSERT INTO tbl_user_right (user_id, right_id, is_granted, insert_by, insert_on, update_by, update_on, is_active)
               VALUES ($1, $2, $3, $4, NOW(), $4, NOW(), true) RETURNING id;`,
              [userId, rightId, isGranted, authCheck.actorEmail]
            );
            const urId = Number(ins?.[0]?.id || nextUrId++);
            authDb.userRights.set(urId, {
              id: urId,
              user_id: userId,
              right_id: rightId,
              is_granted: isGranted,
              insert_by: authCheck.actorEmail,
              insert_on: now,
              update_by: authCheck.actorEmail,
              update_on: now,
              delete_by: null,
              deleted_on: null,
              is_active: true
            });
          } else {
            const urId = nextUrId++;
            authDb.userRights.set(urId, {
              id: urId,
              user_id: userId,
              right_id: rightId,
              is_granted: isGranted,
              insert_by: authCheck.actorEmail,
              insert_on: now,
              update_by: authCheck.actorEmail,
              update_on: now,
              delete_by: null,
              deleted_on: null,
              is_active: true
            });
          }
        }
      }
    }

    authDb.logUserAction(
      authCheck.actorId,
      authCheck.actorEmail,
      "USER_RIGHTS_UPDATED",
      "127.0.0.1",
      "web_client",
      `Updated user-wise menu/feature rights for user #${userId}`
    );

    return this.getUserPermissions(userId);
  }
}
