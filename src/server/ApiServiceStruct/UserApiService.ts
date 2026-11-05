import { BaseRepo } from "../BaseFrame/repo/BaseRepo.ts";
import { BaseService } from "../BaseFrame/services/BaseService.ts";
import { BaseCrudController } from "../BaseFrame/controller/BaseCrudController.ts";
import { PostgresPoolManager } from "../db/postgresPool.ts";
import { RedisCacheManager } from "../BaseFrame/cache/RedisCacheManager.ts";
import { authDb, TblUser } from "./AuthSessionService.ts";

export interface UserRecord {
  id?: string | number;
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  password?: string;
  mobile?: string;
  role: string;
  org_id: string;
  company_id: number;
  employee_id?: string;
  is_locked?: boolean;
}

export class UserRepo extends BaseRepo<UserRecord> {
  private static schemaBootstrapped = false;

  constructor() {
    super("tbl_user", "id");

    // Seed default in-memory users matching authDb
    this.seedMemoryFallbacks();
  }

  private seedMemoryFallbacks() {
    const defaultUsers = [
      {
        id: 1,
        user_id: "USR_1",
        username: "superadmin",
        email: "superadmin@gtax.enterprise",
        full_name: "Eleanor Vance (Chief Tax Officer)",
        role: "superadmin",
        org_id: "ORG_GLOBAL_CORP",
        company_id: 1,
        employee_id: "EMP-SA-001",
        mobile: "+1 (555) 019-2831",
        is_locked: false
      },
      {
        id: 2,
        user_id: "USR_2",
        username: "admin",
        email: "admin@gtax.enterprise",
        full_name: "Marcus Thorne (Senior Tax Strategist)",
        role: "admin",
        org_id: "ORG_GLOBAL_CORP",
        company_id: 1,
        employee_id: "EMP-ADM-002",
        mobile: "+1 (555) 024-8192",
        is_locked: false
      },
      {
        id: 3,
        user_id: "USR_3",
        username: "operator",
        email: "operator@gtax.enterprise",
        full_name: "Sarah Chen (Global Compliance Director)",
        role: "operator",
        org_id: "ORG_GLOBAL_CORP",
        company_id: 1,
        employee_id: "EMP-OP-003",
        mobile: "+1 (555) 038-7241",
        is_locked: false
      },
      {
        id: 4,
        user_id: "USR_4",
        username: "user",
        email: "user@gtax.enterprise",
        full_name: "Julian Keller (Tax Analyst)",
        role: "user",
        org_id: "ORG_GLOBAL_CORP",
        company_id: 1,
        employee_id: "EMP-USR-004",
        mobile: "+1 (555) 042-9918",
        is_locked: false
      }
    ];

    defaultUsers.forEach((u) => {
      const rec = {
        ...u,
        insert_by: "SYSTEM_BOOT",
        insert_on: new Date().toISOString(),
        update_by: "SYSTEM_BOOT",
        update_on: new Date().toISOString(),
        delete_by: null,
        deleted_on: null,
        is_active: true
      };
      this.localStore.set(String(u.id), rec);
      this.localStore.set(u.user_id, rec);
    });
  }

  /**
   * Ensures tbl_user, tbl_role, and tbl_user_role exist in PostgreSQL and seeds initial superadmin
   */
  public static async ensureSchema(): Promise<void> {
    if (this.schemaBootstrapped) return;
    if (!PostgresPoolManager.getStatus().connected) return;

    try {
      // 1. tbl_role
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_role (
            id SERIAL PRIMARY KEY,
            role_name VARCHAR(64) UNIQUE NOT NULL,
            description VARCHAR(255),
            insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 2. tbl_user
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_user (
            id SERIAL PRIMARY KEY,
            fullname VARCHAR(200) NOT NULL,
            photo_path VARCHAR(500) DEFAULT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            mobile VARCHAR(32) DEFAULT NULL,
            country_id INT DEFAULT 1,
            effective_from DATE DEFAULT CURRENT_DATE NOT NULL,
            effective_to DATE DEFAULT NULL,
            employee_id VARCHAR(64) DEFAULT NULL,
            is_locked BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 3. tbl_user_role
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_user_role (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES tbl_user(id) ON DELETE CASCADE NOT NULL,
            role_id INT REFERENCES tbl_role(id) ON DELETE CASCADE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // Seed roles if not present
      await PostgresPoolManager.query(`
        INSERT INTO tbl_role (id, role_name, description, insert_by, update_by) VALUES
        (1, 'superadmin', 'Unrestricted Master Control & System Oversight', 'SYSTEM_SEED', 'SYSTEM_SEED'),
        (2, 'admin', 'Corporate Tax Manager & Department Security Admin', 'SYSTEM_SEED', 'SYSTEM_SEED'),
        (3, 'operator', 'Tax Operations Specialist & Real-Time Sync Operator', 'SYSTEM_SEED', 'SYSTEM_SEED'),
        (4, 'user', 'Standard Tax Analyst & Invoicing Reviewer', 'SYSTEM_SEED', 'SYSTEM_SEED')
        ON CONFLICT (id) DO NOTHING;
      `);

      // Seed initial users into tbl_user if empty
      const existing = await PostgresPoolManager.query<any>("SELECT COUNT(*) as count FROM tbl_user WHERE is_active = true;");
      const userCount = parseInt(existing[0]?.count || "0", 10);
      if (userCount === 0) {
        await PostgresPoolManager.query(`
          INSERT INTO tbl_user (id, fullname, email, password, mobile, employee_id, insert_by, insert_on, update_by, update_on, is_active) VALUES
          (1, 'Eleanor Vance (Chief Tax Officer)', 'superadmin@gtax.enterprise', 'Password123!', '+1 (555) 019-2831', 'EMP-SA-001', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true),
          (2, 'Marcus Thorne (Senior Tax Strategist)', 'admin@gtax.enterprise', 'Password123!', '+1 (555) 024-8192', 'EMP-ADM-002', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true),
          (3, 'Sarah Chen (Global Compliance Director)', 'operator@gtax.enterprise', 'Password123!', '+1 (555) 038-7241', 'EMP-OP-003', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true),
          (4, 'Julian Keller (Tax Analyst)', 'user@gtax.enterprise', 'Password123!', '+1 (555) 042-9918', 'EMP-USR-004', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true)
          ON CONFLICT (email) DO NOTHING;

          INSERT INTO tbl_user_role (user_id, role_id, insert_by, update_by) VALUES
          (1, 1, 'SYSTEM_SEED', 'SYSTEM_SEED'),
          (2, 2, 'SYSTEM_SEED', 'SYSTEM_SEED'),
          (3, 3, 'SYSTEM_SEED', 'SYSTEM_SEED'),
          (4, 4, 'SYSTEM_SEED', 'SYSTEM_SEED')
          ON CONFLICT DO NOTHING;
        `);
      }

      // Sync serial sequences so future inserts never hit primary key collisions
      await PostgresPoolManager.query(`
        SELECT setval(pg_get_serial_sequence('tbl_user', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user), 0), 1));
        SELECT setval(pg_get_serial_sequence('tbl_role', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_role), 0), 1));
        SELECT setval(pg_get_serial_sequence('tbl_user_role', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user_role), 0), 1));
      `);

      this.schemaBootstrapped = true;
    } catch (e) {
      console.warn("[UserRepo] Schema bootstrap warning:", e);
    }
  }

  override async listAll(limit = 100, offset = 0): Promise<any[]> {
    await UserRepo.ensureSchema();

    if (PostgresPoolManager.getStatus().connected) {
      try {
        const rows = await PostgresPoolManager.query<any>(`
          SELECT DISTINCT ON (u.id)
            u.id,
            u.fullname,
            u.photo_path,
            u.email,
            u.mobile,
            u.country_id,
            u.effective_from,
            u.effective_to,
            u.employee_id,
            u.is_locked,
            u.insert_by,
            u.insert_on,
            u.update_by,
            u.update_on,
            u.delete_by,
            u.deleted_on,
            u.is_active,
            COALESCE(r.role_name, 'user') AS role,
            COALESCE(r.id, 4) AS role_id
          FROM tbl_user u
          LEFT JOIN tbl_user_role ur ON u.id = ur.user_id AND ur.is_active = true AND ur.is_deleted IS NOT TRUE
          LEFT JOIN tbl_role r ON ur.role_id = r.id AND r.is_active = true
          WHERE u.is_active = true AND u.is_deleted IS NOT TRUE
          ORDER BY u.id ASC
          LIMIT $1 OFFSET $2;
        `, [limit, offset]);

        if (rows) {
          const mapped = rows.map((r) => ({
            id: r.id,
            user_id: `USR_${r.id}`,
            username: (r.email || "").split("@")[0],
            email: r.email,
            full_name: r.fullname,
            fullname: r.fullname,
            mobile: r.mobile || "",
            role: r.role || "user",
            org_id: "ORG_GLOBAL_CORP",
            company_id: 1,
            employee_id: r.employee_id || `EMP-${r.id}`,
            is_locked: Boolean(r.is_locked),
            insert_by: r.insert_by || "1",
            insert_on: r.insert_on,
            update_by: r.update_by || "1",
            update_on: r.update_on,
            delete_by: r.delete_by,
            deleted_on: r.deleted_on,
            is_active: r.is_active
          }));

          // Invalidate stale cache and write fresh mapped list to Redis
          await RedisCacheManager.set("gtax:cache:table:tbl_user", mapped, 3600);
          return mapped;
        }
      } catch (err) {
        console.warn("[UserRepo] Live query fallback to memory:", err);
      }
    }

    // In-memory fallback
    const memList = await super.listAll(limit, offset);
    // De-duplicate in memory by id / user_id
    const seen = new Set<string>();
    const deduplicated = memList.filter((m) => {
      const key = String(m.id || m.user_id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduplicated;
  }

  override async getById(recordId: string): Promise<any | null> {
    await UserRepo.ensureSchema();
    const idNum = parseInt(String(recordId).replace(/\D/g, ""), 10);

    if (PostgresPoolManager.getStatus().connected && !isNaN(idNum)) {
      try {
        const rows = await PostgresPoolManager.query<any>(`
          SELECT DISTINCT ON (u.id)
            u.id, u.fullname, u.photo_path, u.email, u.mobile, u.country_id,
            u.effective_from, u.effective_to, u.employee_id, u.is_locked,
            u.insert_by, u.insert_on, u.update_by, u.update_on, u.delete_by, u.deleted_on, u.is_active,
            COALESCE(r.role_name, 'user') AS role
          FROM tbl_user u
          LEFT JOIN tbl_user_role ur ON u.id = ur.user_id AND ur.is_active = true AND ur.is_deleted IS NOT TRUE
          LEFT JOIN tbl_role r ON ur.role_id = r.id AND r.is_active = true
          WHERE u.id = $1 AND u.is_active = true AND u.is_deleted IS NOT TRUE;
        `, [idNum]);

        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            id: r.id,
            user_id: `USR_${r.id}`,
            username: (r.email || "").split("@")[0],
            email: r.email,
            full_name: r.fullname,
            fullname: r.fullname,
            mobile: r.mobile || "",
            role: r.role || "user",
            org_id: "ORG_GLOBAL_CORP",
            company_id: 1,
            employee_id: r.employee_id || `EMP-${r.id}`,
            is_locked: Boolean(r.is_locked),
            insert_by: r.insert_by,
            insert_on: r.insert_on,
            update_by: r.update_by,
            update_on: r.update_on,
            is_active: r.is_active
          };
        }
      } catch (e) {
        // Fallback
      }
    }

    const item = this.localStore.get(String(recordId)) || this.localStore.get(`USR_${recordId}`) || this.localStore.get(recordId.replace("USR_", ""));
    return item || null;
  }

  override async insert(data: any, userId: string): Promise<any> {
    await UserRepo.ensureSchema();

    const fullName = data.full_name || data.fullname || data.username || "Staff User";
    const email = (data.email || "").trim().toLowerCase();
    const password = data.password || "Password123!";
    const mobile = data.mobile || "+1 (555) 000-0000";
    const employeeId = data.employee_id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const roleName = (data.role || "user").toLowerCase();
    const actor = userId || "SUPERADMIN";

    let roleId = 4;
    if (roleName.includes("superadmin")) roleId = 1;
    else if (roleName.includes("admin")) roleId = 2;
    else if (roleName.includes("operator")) roleId = 3;

    let createdId: number = Date.now() % 100000;

    if (PostgresPoolManager.getStatus().connected) {
      try {
        await PostgresPoolManager.query(`
          SELECT setval(pg_get_serial_sequence('tbl_user', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user), 0), 1));
        `);

        const rows = await PostgresPoolManager.query<any>(`
          INSERT INTO tbl_user (
            fullname, email, password, mobile, employee_id, is_locked,
            insert_by, insert_on, update_by, update_on, is_active
          ) VALUES (
            $1, $2, $3, $4, $5, false,
            $6, NOW(), $6, NOW(), true
          )
          RETURNING id, fullname, email, mobile, employee_id, insert_by, insert_on, update_by, update_on, is_active;
        `, [fullName, email, password, mobile, employeeId, actor]);

        if (rows && rows.length > 0) {
          createdId = rows[0].id;

          await PostgresPoolManager.query(`
            SELECT setval(pg_get_serial_sequence('tbl_user_role', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user_role), 0), 1));
            INSERT INTO tbl_user_role (user_id, role_id, insert_by, insert_on, update_by, update_on, is_active)
            VALUES ($1, $2, $3, NOW(), $3, NOW(), true)
            ON CONFLICT DO NOTHING;
          `, [createdId, roleId, actor]);
        }
      } catch (err) {
        console.warn("[UserRepo] Failed to insert into live tbl_user, persisting to memory:", err);
      }
    }

    const record: any = {
      id: createdId,
      user_id: `USR_${createdId}`,
      username: email.split("@")[0] || data.username,
      email,
      full_name: fullName,
      fullname: fullName,
      mobile,
      role: roleName,
      org_id: data.org_id || "ORG_GLOBAL_CORP",
      company_id: data.company_id || 1,
      employee_id: employeeId,
      is_locked: false,
      insert_by: actor,
      insert_on: new Date().toISOString(),
      update_by: actor,
      update_on: new Date().toISOString(),
      delete_by: null,
      deleted_on: null,
      is_active: true
    };

    // Save under both id string and user_id to prevent duplicates
    this.localStore.set(String(createdId), record);
    this.localStore.set(record.user_id, record);

    await RedisCacheManager.delete("gtax:cache:table:tbl_user");
    return record;
  }

  override async update(recordId: string, data: any, userId: string): Promise<any | null> {
    await UserRepo.ensureSchema();
    const idNum = parseInt(String(recordId).replace(/\D/g, ""), 10);
    const actor = userId || "SUPERADMIN";

    if (PostgresPoolManager.getStatus().connected && !isNaN(idNum)) {
      try {
        const fullName = data.full_name || data.fullname;
        const email = data.email ? data.email.trim().toLowerCase() : undefined;
        const mobile = data.mobile;
        const employeeId = data.employee_id;

        await PostgresPoolManager.query(`
          UPDATE tbl_user SET
            fullname = COALESCE($1, fullname),
            email = COALESCE($2, email),
            mobile = COALESCE($3, mobile),
            employee_id = COALESCE($4, employee_id),
            update_by = $5,
            update_on = NOW()
          WHERE id = $6 AND is_active = true;
        `, [fullName, email, mobile, employeeId, actor, idNum]);

        if (data.role) {
          let roleId = 4;
          const r = String(data.role).toLowerCase();
          if (r.includes("superadmin")) roleId = 1;
          else if (r.includes("admin")) roleId = 2;
          else if (r.includes("operator")) roleId = 3;

          await PostgresPoolManager.query(`
            UPDATE tbl_user_role SET role_id = $1, update_by = $2, update_on = NOW()
            WHERE user_id = $3 AND is_active = true;
          `, [roleId, actor, idNum]);
        }
      } catch (err) {
        console.warn("[UserRepo] Failed to update live tbl_user:", err);
      }
    }

    const existing = await this.getById(recordId);
    if (existing) {
      const updated = { ...existing, ...data, update_by: actor, update_on: new Date().toISOString() };
      this.localStore.set(String(existing.id), updated);
      this.localStore.set(String(existing.user_id), updated);
    }

    await RedisCacheManager.delete("gtax:cache:table:tbl_user");
    return existing;
  }

  override async softDelete(recordId: string, userId: string): Promise<boolean> {
    await UserRepo.ensureSchema();
    const idNum = parseInt(String(recordId).replace(/\D/g, ""), 10);
    const actor = userId || "1";

    if (PostgresPoolManager.getStatus().connected && !isNaN(idNum)) {
      try {
        await PostgresPoolManager.query(`
          UPDATE tbl_user SET is_active = false, is_deleted = true, delete_by = $1, deleted_on = NOW()
          WHERE id = $2;
          UPDATE tbl_user_role SET is_active = false, is_deleted = true, delete_by = $1, deleted_on = NOW()
          WHERE user_id = $2;
        `, [actor, idNum]);
      } catch (err) {
        console.warn("[UserRepo] Failed to soft-delete from live tbl_user:", err);
      }
    }

    this.localStore.delete(String(recordId));
    this.localStore.delete(`USR_${recordId}`);
    this.localStore.delete(recordId.replace("USR_", ""));

    await RedisCacheManager.delete("gtax:cache:table:tbl_user");
    return true;
  }
}

export class UserService extends BaseService<UserRecord> {
  constructor() {
    super(new UserRepo(), "gtax:users");
  }

  override validateData(data: any, isCreate: boolean): Record<string, string[]> {
    const errs: Record<string, string[]> = {};
    if (isCreate) {
      if (!data.email || !String(data.email).includes("@")) {
        errs.email = ["A valid corporate email address is required"];
      }
      if (!data.full_name && !data.fullname && !data.username) {
        errs.full_name = ["Full name cannot be blank"];
      }
    }
    return errs;
  }
}

export class UserApiService extends BaseCrudController<UserRecord> {
  constructor() {
    super("/api/v1/users", new UserService(), ["superadmin", "admin", "tax_manager"]);
  }
}

export const userApiServiceInstance = new UserApiService();
