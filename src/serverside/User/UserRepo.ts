import { TableCacheDbSyncService } from "../../server/db/TableCacheDbSyncService.ts";
import { UserModel, IUserRecord } from "./UserModel.ts";
import { authDb } from "../../server/ApiServiceStruct/AuthSessionService.ts";
import { PostgresPoolManager } from "../../server/db/postgresPool.ts";

export class UserRepo {
  private tableName = UserModel.tableName;

  private sanitizeRecord(item: IUserRecord): IUserRecord {
    if (!item) return item;
    const derivedUsername =
      item.username ||
      (item.email ? item.email.split("@")[0] : "") ||
      item.user_id ||
      `user_${item.id}`;
    const derivedFullname = item.fullname || item.full_name || derivedUsername;
    const derivedUserId = item.user_id || `USR_${item.id}`;
    const derivedRole = String(item.role || "user").trim().toLowerCase();
    return {
      ...item,
      username: derivedUsername,
      fullname: derivedFullname,
      full_name: derivedFullname,
      user_id: derivedUserId,
      role: derivedRole
    };
  }

  private async resolveTargetNumericId(id: string | number, fallbackId?: number | string): Promise<number | null> {
    const rawStr = String(id ?? "").trim();
    const asNum = Number(rawStr);
    if (!isNaN(asNum) && asNum > 0 && Number.isInteger(asNum)) {
      return asNum;
    }

    const usrMatch = /^USR_(\d+)$/i.exec(rawStr);
    if (usrMatch) {
      return Number(usrMatch[1]);
    }

    if (fallbackId !== undefined && fallbackId !== null) {
      const fbNum = Number(fallbackId);
      if (!isNaN(fbNum) && fbNum > 0 && Number.isInteger(fbNum)) {
        return fbNum;
      }
    }

    const list = await TableCacheDbSyncService.getTableData<IUserRecord>(this.tableName as any, true);
    const found = list.find(
      (item) =>
        String(item.id) === rawStr ||
        String(item.user_id) === rawStr ||
        (rawStr.includes("@") && String(item.email || "").toLowerCase() === rawStr.toLowerCase())
    );
    return found && !isNaN(Number(found.id)) ? Number(found.id) : null;
  }

  async GetSearchTemplate(queryStr?: string): Promise<IUserRecord[]> {
    const rawList = await TableCacheDbSyncService.getTableData<IUserRecord>(this.tableName as any, true);
    const list = rawList.map((item) => this.sanitizeRecord(item));
    if (!queryStr) return list;
    const q = queryStr.toLowerCase();
    return list.filter((item) =>
      (item.fullname || item.full_name || "").toLowerCase().includes(q) ||
      (item.email || "").toLowerCase().includes(q) ||
      (item.username || "").toLowerCase().includes(q) ||
      (item.role || "").toLowerCase().includes(q) ||
      (item.user_id || "").toLowerCase().includes(q)
    );
  }

  async GetItemTemplate(id: string | number): Promise<IUserRecord | null> {
    const rawList = await TableCacheDbSyncService.getTableData<IUserRecord>(this.tableName as any, true);
    const targetNum = await this.resolveTargetNumericId(id);
    const targetStr = String(id);
    const found =
      (targetNum !== null ? rawList.find((item) => Number(item.id) === targetNum) : null) ||
      rawList.find((item) => String(item.id) === targetStr || item.user_id === targetStr);
    return found ? this.sanitizeRecord(found) : null;
  }

  async GetComboTemplate(): Promise<Array<{ id: number; name: string; code?: string }>> {
    const list = await this.GetSearchTemplate();
    return list.map((item) => ({
      id: Number(item.id),
      name: item.fullname || item.username || `User #${item.id}`,
      code: item.username || item.user_id || item.employee_id || String(item.id)
    }));
  }

  async insert(record: Partial<IUserRecord>, userId: string = "1"): Promise<IUserRecord> {
    const resolvedPassword = record.password || record.password_hash || "Password123!";
    const normalizedRole = String(record.role || "operator").trim().toLowerCase();
    const payload = {
      ...record,
      role: normalizedRole,
      password: resolvedPassword,
      password_hash: resolvedPassword,
      username: record.username || (record.email ? record.email.split("@")[0] : `user_${Date.now()}`),
      fullname: record.fullname || record.full_name || record.username || "New User"
    };
    const created = await TableCacheDbSyncService.insertRecord(this.tableName as any, payload, userId);
    const sanitized = this.sanitizeRecord(created);
    const createdId = Number(sanitized.id);
    if (!isNaN(createdId)) {
      const roleStr = String(sanitized.role || normalizedRole).trim().toLowerCase();
      const matchedRole = authDb.findRoleByNameOrId((record as any).role_id || roleStr);
      const mappedRoleId = matchedRole
        ? matchedRole.id
        : roleStr === "superadmin"
          ? 1
          : roleStr === "admin"
            ? 2
            : roleStr === "operator"
              ? 3
              : 4;
      authDb.users.set(createdId, {
        id: createdId,
        fullname: sanitized.fullname || "New User",
        photo_path: null,
        email: sanitized.email || `${sanitized.username}@gtax.enterprise`,
        password: resolvedPassword,
        mobile: sanitized.mobile || "",
        country_id: 1,
        effective_from: new Date().toISOString().split("T")[0],
        effective_to: null,
        employee_id: sanitized.employee_id || `EMP-${createdId}`,
        is_locked: false,
        insert_by: userId,
        insert_on: new Date().toISOString(),
        update_by: userId,
        update_on: new Date().toISOString(),
        delete_by: null,
        deleted_on: null,
        is_active: true
      });
      authDb.userRoles.set(createdId, {
        id: createdId,
        user_id: createdId,
        role_id: mappedRoleId,
        insert_by: userId,
        insert_on: new Date().toISOString(),
        update_by: userId,
        update_on: new Date().toISOString(),
        delete_by: null,
        deleted_on: null,
        is_active: true
      });
      if (PostgresPoolManager.getStatus().connected) {
        try {
          await PostgresPoolManager.query(`DELETE FROM tbl_user_role WHERE user_id = $1;`, [createdId]);
          await PostgresPoolManager.query(
            `INSERT INTO tbl_user_role (user_id, role_id, insert_by, insert_on, update_by, update_on, is_active, is_deleted)
             VALUES ($1, $2, $3, NOW(), $3, NOW(), true, false)
             ON CONFLICT (user_id, role_id) DO UPDATE SET is_active = true, is_deleted = false, update_by = EXCLUDED.update_by, update_on = NOW();`,
            [createdId, mappedRoleId, userId]
          );
          await TableCacheDbSyncService.refreshTableCacheFromDb(this.tableName);
        } catch {}
      }
    }
    return sanitized;
  }

  async update(id: number | string, record: Partial<IUserRecord>, userId: string = "1"): Promise<IUserRecord | null> {
    const targetNum = await this.resolveTargetNumericId(id, record.id);
    if (targetNum === null || isNaN(targetNum) || targetNum <= 0) {
      return null;
    }

    const payload: Record<string, any> = { ...record };
    // Never overwrite existing user_id or primary id with stale values
    delete payload.id;
    payload.user_id = `USR_${targetNum}`;

    // Only include password if explicitly non-empty
    const rawPass = record.password || record.password_hash;
    if (rawPass !== undefined && rawPass !== null && String(rawPass).trim() !== "") {
      payload.password = String(rawPass);
      payload.password_hash = String(rawPass);
    } else {
      delete payload.password;
      delete payload.password_hash;
    }

    if (payload.role !== undefined && payload.role !== null && String(payload.role).trim() !== "") {
      payload.role = String(payload.role).trim().toLowerCase();
    }

    // Update single user row in tbl_user (WHERE id = targetNum)
    let updated = await TableCacheDbSyncService.updateRecord(this.tableName as any, targetNum, payload, userId);

    if (updated) {
      const memUser = authDb.users.get(targetNum);
      if (memUser) {
        if (updated.fullname || updated.full_name) memUser.fullname = updated.fullname || updated.full_name;
        if (updated.email) memUser.email = updated.email;
        if (updated.mobile !== undefined) memUser.mobile = updated.mobile || "";
        if (updated.employee_id !== undefined) memUser.employee_id = updated.employee_id || memUser.employee_id;
        if (payload.password) memUser.password = payload.password;
      }

      if (payload.role || (record as any).role_id) {
        const roleStr = String(payload.role || updated.role || record.role || "").trim().toLowerCase();
        const matchedRole = authDb.findRoleByNameOrId((record as any).role_id || roleStr);
        const mappedRoleId = matchedRole
          ? matchedRole.id
          : roleStr === "superadmin"
            ? 1
            : roleStr === "admin"
              ? 2
              : roleStr === "operator"
                ? 3
                : 4;

        authDb.userRoles.set(targetNum, {
          id: targetNum,
          user_id: targetNum,
          role_id: mappedRoleId,
          insert_by: userId,
          insert_on: new Date().toISOString(),
          update_by: userId,
          update_on: new Date().toISOString(),
          delete_by: null,
          deleted_on: null,
          is_active: true
        });

        if (PostgresPoolManager.getStatus().connected) {
          try {
            // Atomically replace ONLY this user's role mapping in tbl_user_role to prevent UNIQUE(user_id, role_id) collisions
            await PostgresPoolManager.query(`DELETE FROM tbl_user_role WHERE user_id = $1;`, [targetNum]);
            await PostgresPoolManager.query(
              `INSERT INTO tbl_user_role (user_id, role_id, insert_by, insert_on, update_by, update_on, is_active, is_deleted)
               VALUES ($1, $2, $3, NOW(), $3, NOW(), true, false)
               ON CONFLICT (user_id, role_id) DO UPDATE SET is_active = true, is_deleted = false, update_by = EXCLUDED.update_by, update_on = NOW();`,
              [targetNum, mappedRoleId, userId]
            );
            // Re-refresh tbl_user cache after tbl_user_role commit so joined role is synced
            const freshRows = await TableCacheDbSyncService.refreshTableCacheFromDb<IUserRecord>(this.tableName);
            const refreshedMatch = freshRows.find((r) => Number(r.id) === targetNum);
            if (refreshedMatch) {
              updated = refreshedMatch;
            }
          } catch (err) {
            console.warn(`[UserRepo] Failed to sync tbl_user_role for user #${targetNum}:`, err);
          }
        }
      }
    }
    return updated ? this.sanitizeRecord(updated) : null;
  }

  async delete(id: number | string, userId: string = "1"): Promise<boolean> {
    const targetNum = await this.resolveTargetNumericId(id);
    if (targetNum === null || isNaN(targetNum) || targetNum <= 0) {
      return false;
    }
    return await TableCacheDbSyncService.deleteRecord(this.tableName as any, targetNum, userId);
  }
}
