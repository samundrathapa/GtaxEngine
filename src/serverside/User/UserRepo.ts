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
    const derivedRole = item.role || "OPERATOR";
    return {
      ...item,
      username: derivedUsername,
      fullname: derivedFullname,
      full_name: derivedFullname,
      user_id: derivedUserId,
      role: derivedRole
    };
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
    const targetStr = String(id);
    const targetNum = Number(id);
    const found = rawList.find(
      (item) => Number(item.id) === targetNum || String(item.id) === targetStr || item.user_id === targetStr
    );
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
    const payload = {
      ...record,
      password: resolvedPassword,
      password_hash: resolvedPassword,
      username: record.username || (record.email ? record.email.split("@")[0] : `user_${Date.now()}`),
      fullname: record.fullname || record.full_name || record.username || "New User"
    };
    const created = await TableCacheDbSyncService.insertRecord(this.tableName as any, payload, userId);
    const sanitized = this.sanitizeRecord(created);
    const createdId = Number(sanitized.id);
    if (!isNaN(createdId)) {
      const roleStr = String(sanitized.role || "operator").trim().toLowerCase();
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
          await PostgresPoolManager.query(
            `INSERT INTO tbl_user_role (user_id, role_id, insert_by, insert_on, update_by, update_on, is_active)
             VALUES ($1, $2, $3, NOW(), $3, NOW(), true) ON CONFLICT DO NOTHING;`,
            [createdId, mappedRoleId, userId]
          );
        } catch {}
      }
    }
    return sanitized;
  }

  async update(id: number | string, record: Partial<IUserRecord>, userId: string = "1"): Promise<IUserRecord | null> {
    let targetNum = Number(id);
    if (isNaN(targetNum)) {
      const list = await TableCacheDbSyncService.getTableData<IUserRecord>(this.tableName as any, true);
      const found = list.find(
        (item) => String(item.user_id) === String(id) || String(item.id) === String(id) || String(item.username) === String(id)
      );
      if (found) {
        targetNum = Number(found.id);
      }
    }
    if (isNaN(targetNum)) {
      return null;
    }
    const payload = { ...record };
    if (record.password || record.password_hash) {
      const resolvedPass = record.password || record.password_hash;
      payload.password = resolvedPass;
      payload.password_hash = resolvedPass;
    }
    const updated = await TableCacheDbSyncService.updateRecord(this.tableName as any, targetNum, payload, userId);
    if (updated) {
      const memUser = authDb.users.get(targetNum);
      if (memUser) {
        if (updated.fullname || updated.full_name) memUser.fullname = updated.fullname || updated.full_name;
        if (updated.email) memUser.email = updated.email;
        if (updated.mobile !== undefined) memUser.mobile = updated.mobile || "";
        if (updated.employee_id !== undefined) memUser.employee_id = updated.employee_id || memUser.employee_id;
        if (payload.password) memUser.password = payload.password;
      }
      if (updated.role || (record as any).role_id) {
        const roleStr = String(updated.role || record.role || "").trim().toLowerCase();
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
            const updRows = await PostgresPoolManager.query<any>(
              `UPDATE tbl_user_role SET role_id = $1, update_by = $2, update_on = NOW()
               WHERE user_id = $3 AND is_active = true RETURNING id;`,
              [mappedRoleId, userId, targetNum]
            );
            if (!updRows || updRows.length === 0) {
              await PostgresPoolManager.query(
                `INSERT INTO tbl_user_role (user_id, role_id, insert_by, insert_on, update_by, update_on, is_active)
                 VALUES ($1, $2, $3, NOW(), $3, NOW(), true);`,
                [targetNum, mappedRoleId, userId]
              );
            }
          } catch {}
        }
      }
    }
    return updated ? this.sanitizeRecord(updated) : null;
  }

  async delete(id: number | string, userId: string = "1"): Promise<boolean> {
    let targetNum = Number(id);
    if (isNaN(targetNum)) {
      const list = await TableCacheDbSyncService.getTableData<IUserRecord>(this.tableName as any, true);
      const found = list.find(
        (item) => String(item.user_id) === String(id) || String(item.id) === String(id)
      );
      if (found) {
        targetNum = Number(found.id);
      }
    }
    if (isNaN(targetNum)) {
      return false;
    }
    return await TableCacheDbSyncService.deleteRecord(this.tableName as any, targetNum, userId);
  }
}
