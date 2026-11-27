/**
 * gtax Enterprise - Unified Table Cache & DB Synchronization Engine
 * Manages all 26 core municipal valuation and tax tables:
 *   - tbl_role, tbl_user, tbl_right, tbl_role_right, tbl_user_role, tbl_user_right,
 *     tbl_user_log, tbl_session_log, tbl_fiscal_year, tbl_unit, tbl_construction_type,
 *     tbl_land_nature, tbl_land_rate, tbl_malpot_rates, tbl_construction_rates,
 *     tbl_depreciation, tbl_fine_rebate, tbl_taxpayer_master, tbl_taxpayer,
 *     tbl_land, tbl_house, tbl_floor, tax_jurisdictions, tax_rules_matrix,
 *     tax_transactions, tax_liability_breakdown
 * 
 * Rules:
 *   1. All data is retrieved from Redis cache (Cache-First).
 *   2. On cache miss, data is read directly from PostgreSQL database and primed into Redis.
 *   3. When changes are made (INSERT, UPDATE, DELETE):
 *      - Direct write to PostgreSQL database table.
 *      - Enforces audit columns: insert_by, update_by, delete_by store user ID from tbl_user (e.g. '1').
 *      - Auto-interacts & synchronizes updated data from DB into Redis cache immediately.
 *      - Returns response from Redis cache.
 *   4. Supports "Clear Cache & Sync DB" triggered from client user menu bar.
 */

import fs from "fs";
import path from "path";
import { PostgresPoolManager } from "./postgresPool.ts";
import { RedisCacheManager } from "../BaseFrame/cache/RedisCacheManager.ts";
import { DatabaseSchemaBootstrap } from "./databaseSchemaBootstrap.ts";
import { generateFiscalYears2021To2086 } from "./fiscalYearSeeds.ts";

export const ALL_25_TABLES = [
  "tbl_role",
  "tbl_user",
  "tbl_right",
  "tbl_role_right",
  "tbl_user_role",
  "tbl_user_right",
  "tbl_user_log",
  "tbl_session_log",
  "tbl_fiscal_year",
  "tbl_unit",
  "tbl_construction_type",
  "tbl_land_nature",
  "tbl_land_rate",
  "tbl_malpot_rates",
  "tbl_construction_rates",
  "tbl_depreciation",
  "tbl_fine_rebate",
  "tbl_taxpayer",
  "tbl_land",
  "tbl_house",
  "tbl_floor",
  "tax_jurisdictions",
  "tax_rules_matrix",
  "tax_transactions",
  "tax_liability_breakdown",
  "tbl_appication_setting",
  "tbl_application_setting",
  "tbl_company"
] as const;

export type GtaxTableName = (typeof ALL_25_TABLES)[number];

const STORES_BACKUP_PATH = path.resolve(process.cwd(), "data", "table_stores.json");

export class TableCacheDbSyncService {
  private static inMemoryStores: Map<string, any[]> = new Map();
  private static initialized = false;

  private static saveStoresToDisk(): void {
    // Disk persistence disabled: all records are managed directly via PostgreSQL database & Redis cache.
  }

  private static loadStoresFromDisk(): void {
    // Disk persistence disabled: all records are loaded directly from PostgreSQL database & Redis cache.
  }

  public static async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    // Load persisted stores from disk if any
    this.loadStoresFromDisk();

    // 1. Initialize Redis Cache
    RedisCacheManager.initialize();

    // 2. Initialize Postgres Connection
    await PostgresPoolManager.initialize();

    // 3. Ensure database schema and seed data
    if (PostgresPoolManager.getStatus().connected) {
      await DatabaseSchemaBootstrap.bootstrapAllTables();
    }

    // 4. Warm up Redis cache for all 25 tables
    await this.warmUpCache();
  }

  /**
   * Warms up Redis cache from PostgreSQL (or memory fallback)
   */
  public static async warmUpCache(): Promise<void> {
    for (const table of ALL_25_TABLES) {
      await this.refreshTableCacheFromDb(table);
    }
  }

  /**
   * Retrieves table records.
   * If database is connected or forceFresh is requested, directly queries live PostgreSQL so external updates reflect instantly.
   * Otherwise returns from cache / persistent store.
   */
  public static async getTableData<T = any>(table: GtaxTableName | string, forceFresh = false): Promise<T[]> {
    const isDbConnected = PostgresPoolManager.getStatus().connected;

    // If connected to remote PostgreSQL or forced fresh, ALWAYS query database directly
    if (isDbConnected || forceFresh) {
      return await this.refreshTableCacheFromDb<T>(table);
    }

    const cacheKey = `gtax:cache:table:${table}`;

    // 1. Check Redis Cache
    const cached = await RedisCacheManager.get<T[]>(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    // 2. Fallback to memory / persistent disk store
    const memRows = (this.inMemoryStores.get(table) || []) as T[];
    if (memRows.length > 0) {
      await RedisCacheManager.set(cacheKey, memRows, 3600);
      return memRows;
    }

    // 3. Refresh from DB
    return await this.refreshTableCacheFromDb<T>(table);
  }

  public static isValidTableName(tableName: string): boolean {
    if (!tableName) return false;
    const lower = tableName.toLowerCase();
    return (ALL_25_TABLES as readonly string[]).includes(lower);
  }

  /**
   * Queries PostgreSQL directly for a table's records, writes to Redis Cache, and returns the records.
   */
  public static async refreshTableCacheFromDb<T = any>(table: GtaxTableName | string): Promise<T[]> {
    if (!this.isValidTableName(table)) {
      return [];
    }
    const cacheKey = `gtax:cache:table:${table}`;
    let rows: T[] = [];

    if (PostgresPoolManager.getStatus().connected) {
      try {
        if (table.toLowerCase() === "tbl_user") {
          const joinedSql = `
            SELECT DISTINCT ON (u.id)
              u.*,
              COALESCE(r.role_name, NULLIF(LOWER(TRIM(u.role)), ''), 'user') AS joined_role,
              r.id AS joined_role_id
            FROM tbl_user u
            LEFT JOIN tbl_user_role ur ON u.id = ur.user_id AND ur.is_active = true AND COALESCE(ur.is_deleted, false) = false
            LEFT JOIN tbl_role r ON ur.role_id = r.id AND r.is_active = true AND COALESCE(r.is_deleted, false) = false
            WHERE COALESCE(u.is_deleted, false) = false
            ORDER BY u.id ASC, ur.id DESC;
          `;
          rows = await PostgresPoolManager.query<T>(joinedSql);
        } else {
          // Query database table; filter out soft-deleted records if is_deleted column exists
          const queryWithFilter = `SELECT * FROM ${table} WHERE is_deleted IS NOT TRUE ORDER BY 1 ASC;`;
          rows = await PostgresPoolManager.query<T>(queryWithFilter);
          if (!rows || rows.length === 0) {
            // If no filter matched or is_deleted column not in table, fallback to standard select
            rows = await PostgresPoolManager.query<T>(`SELECT * FROM ${table} ORDER BY 1 ASC;`);
          }
        }
      } catch {
        try {
          rows = await PostgresPoolManager.query<T>(`SELECT * FROM ${table} ORDER BY 1 ASC;`);
        } catch (dbErr) {
          console.warn(`[gtax:CacheSync] Direct query on table ${table} failed, falling back:`, dbErr);
        }
      }
    }

    if (PostgresPoolManager.getStatus().connected) {
      // Direct PostgreSQL query: Return genuine server database rows
      this.inMemoryStores.set(table, rows || []);
      this.saveStoresToDisk();
    } else {
      // Database offline: Only fallback to in-memory store if DB is offline
      rows = (this.inMemoryStores.get(table) || []) as T[];
    }

    if (table === "tbl_taxpayer" || table === "tbl_taxpayer_master") {
      rows = rows.map((r: any) => {
        const name = r.full_name || r.fullname || r.fullanme || r.name || "";
        const code = r.taxpayer_code || r.taxpayer_id || r.code || "";
        const phone = r.phone_number || r.mobile || r.phone || r.mobile_no || "";
        const pan = r.pan_number || r.pan_vat_no || r.pan_no || "";
        const citizenship = r.citizenship_number || r.citizenship_no || "";
        return {
          ...r,
          id: Number(r.id),
          full_name: name,
          fullname: name,
          fullanme: name,
          name,
          taxpayer_code: code,
          taxpayer_id: code,
          code,
          phone_number: phone,
          mobile: phone,
          phone,
          mobile_no: phone,
          pan_number: pan,
          pan_vat_no: pan,
          pan_no: pan,
          citizenship_number: citizenship,
          citizenship_no: citizenship,
          ward_no: r.ward_no !== undefined ? Number(r.ward_no) : 1
        };
      }) as any;
    } else if (table === "tbl_appication_setting" || table === "tbl_application_setting") {
      rows = rows.map((r: any) => {
        const name = r.fullname || r.fullanme || r.municipality_name || "Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)";
        return {
          ...r,
          code: r.code || "APP-CONF-01",
          fullname: name,
          fullanme: name,
          municipality_name: r.municipality_name || name
        };
      }) as any;
    } else if (table === "tbl_user") {
      rows = rows.map((r: any) => {
        const name = r.fullname || r.full_name || r.name || "User";
        const uname = r.username || (r.email ? String(r.email).split("@")[0] : "") || `USR_${r.id}`;
        const uid = r.user_id ? String(r.user_id) : `USR_${r.id}`;
        const phone = r.mobile || r.phone || "";
        const role = String(r.joined_role || r.role || "user").trim().toLowerCase();
        const roleId = r.joined_role_id !== undefined && r.joined_role_id !== null ? Number(r.joined_role_id) : r.role_id;
        return {
          ...r,
          id: Number(r.id),
          fullname: name,
          full_name: name,
          name,
          username: uname,
          user_id: uid,
          mobile: phone,
          phone,
          role,
          ...(roleId !== undefined ? { role_id: roleId } : {}),
          password_hash: r.password_hash || r.password || ""
        };
      }) as any;
    } else if (table === "tbl_company") {
      rows = rows.map((r: any) => {
        const name = r.name || r.company_name || r.fullname || r.fullanme || "Company";
        const phone = r.phone || r.mobile || r.phone_number || "";
        const pan = r.pan_no || r.pan_number || "";
        return {
          ...r,
          id: Number(r.id),
          name,
          company_name: name,
          fullname: name,
          phone,
          mobile: phone,
          phone_number: phone,
          pan_no: pan,
          pan_number: pan
        };
      }) as any;
    } else if (table === "tbl_fiscal_year") {
      rows = rows.map((r: any) => {
        const name = r.fullname || r.name || r.code || "Fiscal Year";
        return {
          ...r,
          id: Number(r.id),
          fullname: name,
          name,
          bs_year: r.bs_year || (r.code ? String(r.code).split("/")[0] : ""),
          ad_year: r.ad_year || ""
        };
      }) as any;
    } else if (table === "tbl_unit") {
      rows = rows.map((r: any) => {
        const name = r.fullanme || r.fullname || r.name || r.code || "Unit";
        const symbol = r.symbol || r.code || "";
        const unitVal = r.unit_value !== undefined ? Number(r.unit_value) : 1.0;
        return {
          ...r,
          id: Number(r.id),
          name,
          fullanme: name,
          fullname: name,
          symbol,
          unit_value: unitVal
        };
      }) as any;
    } else if (table === "tbl_construction_type") {
      rows = rows.map((r: any) => {
        const name = r.fullanme || r.fullname || r.name || r.code || "Construction Type";
        return {
          ...r,
          id: Number(r.id),
          name,
          fullanme: name,
          fullname: name,
          depreciation_rate: r.depreciation_rate !== undefined ? Number(r.depreciation_rate) : 0
        };
      }) as any;
    } else if (table === "tbl_land_nature") {
      rows = rows.map((r: any) => {
        const name = r.fullanme || r.fullname || r.name || r.code || "Land Nature";
        return {
          ...r,
          id: Number(r.id),
          name,
          fullanme: name,
          fullname: name
        };
      }) as any;
    } else if (table === "tbl_land") {
      rows = rows.map((r: any) => {
        const kitta = r.kitta_number || r.kitta_no || r.kitta || "";
        const moth = r.moth_number || r.moth_no || r.moth || "";
        const area = r.area_sqfeet !== undefined ? Number(r.area_sqfeet) : (r.area_sqft !== undefined ? Number(r.area_sqft) : 0);
        const unitId = r.land_measuring_unit_id !== undefined ? Number(r.land_measuring_unit_id) : (r.unit_id !== undefined ? Number(r.unit_id) : 1);
        return {
          ...r,
          id: Number(r.id),
          taxpayer_id: r.taxpayer_id !== undefined && r.taxpayer_id !== null ? Number(r.taxpayer_id) : null,
          kitta_number: String(kitta),
          kitta_no: String(kitta),
          moth_number: String(moth),
          moth_no: String(moth),
          area_sqfeet: area,
          area_sqft: area,
          land_measuring_unit_id: unitId,
          unit_id: unitId
        };
      }) as any;
    } else if (table === "tbl_house") {
      rows = rows.map((r: any) => {
        const houseNo = r.house_no || r.house_number || "";
        const area = r.area_sqfeet !== undefined ? Number(r.area_sqfeet) : (r.area_sqft !== undefined ? Number(r.area_sqft) : 0);
        return {
          ...r,
          id: Number(r.id),
          house_no: String(houseNo),
          house_number: String(houseNo),
          area_sqfeet: area,
          area_sqft: area
        };
      }) as any;
    } else if (table === "tbl_floor") {
      rows = rows.map((r: any) => {
        const area = r.area_sqfeet !== undefined ? Number(r.area_sqfeet) : (r.area_sqft !== undefined ? Number(r.area_sqft) : 0);
        return {
          ...r,
          id: Number(r.id),
          area_sqfeet: area,
          area_sqft: area
        };
      }) as any;
    } else if (table === "tbl_user_log") {
      rows = rows.map((r: any) => {
        const action = r.action_name || r.action_type || "LOG_EVENT";
        const ip = r.ip_address || r.client_ip || "127.0.0.1";
        const created = r.insert_on || r.created_at || "";
        return {
          ...r,
          id: Number(r.id),
          action_name: action,
          action_type: action,
          ip_address: ip,
          client_ip: ip,
          created_at: created,
          insert_on: created
        };
      }) as any;
    } else if (table === "tbl_land_rate" || table === "tbl_malpot_rates" || table === "tbl_construction_rates" || table === "tbl_depreciation") {
      rows = rows.map((r: any) => {
        const name = r.fullanme || r.fullname || r.name || r.code || "";
        return {
          ...r,
          id: Number(r.id),
          fullanme: name,
          fullname: name,
          name
        };
      }) as any;
    }

    // Write to Redis cache with 1-hour TTL
    await RedisCacheManager.set(cacheKey, rows, 3600);
    RedisCacheManager.recordSyncEvent();

    return rows;
  }

  private static tableColumnsCache: Map<string, Set<string>> = new Map();

  /**
   * Dynamically inspects and caches columns that actually exist in the target PostgreSQL table.
   * Completely eliminates "column does not exist" SQL errors across legacy/existing databases.
   */
  public static async getTableColumns(table: string): Promise<Set<string>> {
    const tblLower = String(table || "").toLowerCase().trim();
    if (!tblLower) return new Set();

    if (this.tableColumnsCache.has(tblLower)) {
      return this.tableColumnsCache.get(tblLower)!;
    }

    if (!PostgresPoolManager.getStatus().connected) {
      return new Set();
    }

    try {
      const res = await PostgresPoolManager.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns WHERE LOWER(table_name) = $1;`,
        [tblLower]
      );
      const cols = new Set((res || []).map((r) => String(r.column_name).toLowerCase()));
      if (cols.size > 0) {
        this.tableColumnsCache.set(tblLower, cols);
      }
      return cols;
    } catch (err) {
      console.warn(`[gtax:CacheSync] Failed to query columns for table ${tblLower}:`, err);
      return new Set();
    }
  }

  public static clearTableColumnsCache(): void {
    this.tableColumnsCache.clear();
  }

  /**
   * Sanitizes payload strictly to columns existing in PostgreSQL table schema.
   * Dynamically checks existing table columns and filters out non-existent fields.
   */
  public static sanitizePayloadForDb(
    table: string,
    rawPayload: Record<string, any>,
    existingCols?: Set<string>,
    isUpdate: boolean = false
  ): Record<string, any> {
    const payload = { ...rawPayload };

    const safeInt = (val: any, defaultVal = 1): number => {
      if (val === undefined || val === null || val === "") return defaultVal;
      const num = Number(val);
      return isNaN(num) ? defaultVal : Math.round(num);
    };

    const safeNum = (val: any, defaultVal = 0): number => {
      if (val === undefined || val === null || val === "") return defaultVal;
      const num = Number(val);
      return isNaN(num) ? defaultVal : num;
    };

    const tblLower = String(table || "").toLowerCase();

    // Helper to assign column only if it exists in the target DB table (or if existingCols is unknown)
    const assignCol = (clean: Record<string, any>, col: string, val: any) => {
      if (!existingCols || existingCols.size === 0 || existingCols.has(col.toLowerCase())) {
        clean[col] = val;
      }
    };

    if (tblLower === "tbl_taxpayer" || tblLower === "tbl_taxpayer_master") {
      const name = payload.full_name || payload.fullname || payload.fullanme || payload.name || "New Taxpayer";
      const code = payload.taxpayer_code || payload.taxpayer_id || payload.code || `TP-${Date.now().toString().slice(-6)}`;
      const phone = payload.phone_number || payload.mobile || payload.phone || payload.mobile_no || "";
      const pan = payload.pan_number || payload.pan_vat_no || payload.pan_no || "";
      const citizenship = payload.citizenship_number || payload.citizenship_no || "";
      const ward = safeInt(payload.ward_no, 1);

      const clean: Record<string, any> = {};

      assignCol(clean, "full_name", name);
      assignCol(clean, "fullname", name);
      assignCol(clean, "taxpayer_code", code);
      assignCol(clean, "taxpayer_id", code);
      assignCol(clean, "phone_number", phone);
      assignCol(clean, "mobile", phone);
      assignCol(clean, "phone", phone);
      assignCol(clean, "mobile_no", phone);
      assignCol(clean, "pan_number", pan);
      assignCol(clean, "pan_vat_no", pan);
      assignCol(clean, "citizenship_number", citizenship);
      assignCol(clean, "citizenship_no", citizenship);
      assignCol(clean, "ward_no", ward);

      if (payload.email !== undefined) assignCol(clean, "email", payload.email);
      if (payload.tole_village !== undefined) assignCol(clean, "tole_village", payload.tole_village);
      if (payload.gender !== undefined) assignCol(clean, "gender", payload.gender);
      if (payload.tax_type_id !== undefined) assignCol(clean, "tax_type_id", safeInt(payload.tax_type_id, 1));
      if (payload.registration_date !== undefined) assignCol(clean, "registration_date", payload.registration_date);
      if (payload.is_active !== undefined) assignCol(clean, "is_active", Boolean(payload.is_active));
      if (payload.is_deleted !== undefined) assignCol(clean, "is_deleted", Boolean(payload.is_deleted));
      if (payload.insert_by !== undefined) assignCol(clean, "insert_by", String(payload.insert_by));
      if (payload.insert_on !== undefined) assignCol(clean, "insert_on", payload.insert_on);
      if (payload.update_by !== undefined) assignCol(clean, "update_by", String(payload.update_by));
      if (payload.update_on !== undefined) assignCol(clean, "update_on", payload.update_on);
      if (payload.delete_by !== undefined) assignCol(clean, "delete_by", payload.delete_by);
      if (payload.deleted_on !== undefined) assignCol(clean, "deleted_on", payload.deleted_on);

      // Final defensive sweep: ensure no non-existent column is ever returned
      if (existingCols && existingCols.size > 0) {
        for (const k of Object.keys(clean)) {
          if (!existingCols.has(k.toLowerCase())) {
            delete clean[k];
          }
        }
      }

      return clean;
    }

    if (tblLower === "tbl_user") {
      const clean: Record<string, any> = {};

      if (isUpdate) {
        // On UPDATE: only write fields actually provided in payload so partial updates never wipe existing values
        const hasName = payload.fullname !== undefined || payload.full_name !== undefined || payload.name !== undefined;
        if (hasName) {
          const name = payload.fullname ?? payload.full_name ?? payload.name;
          if (name !== undefined && name !== null && String(name).trim() !== "") {
            assignCol(clean, "fullname", String(name));
            assignCol(clean, "full_name", String(name));
          }
        }
        if (payload.username !== undefined && String(payload.username).trim() !== "") {
          assignCol(clean, "username", String(payload.username));
        }
        if (payload.user_id !== undefined && String(payload.user_id).trim() !== "") {
          assignCol(clean, "user_id", String(payload.user_id));
        }
        if (payload.email !== undefined) assignCol(clean, "email", payload.email);
        const rawPwd = payload.password ?? payload.password_hash;
        if (rawPwd !== undefined && rawPwd !== null && String(rawPwd).trim() !== "") {
          assignCol(clean, "password", String(rawPwd));
          assignCol(clean, "password_hash", String(rawPwd));
        }
        if (payload.role !== undefined && String(payload.role).trim() !== "") {
          assignCol(clean, "role", String(payload.role).trim().toLowerCase());
        }
        if (payload.mobile !== undefined || payload.phone !== undefined) {
          const phone = payload.mobile ?? payload.phone ?? "";
          assignCol(clean, "mobile", phone);
          assignCol(clean, "phone", phone);
        }
        if (payload.preferred_lang !== undefined) assignCol(clean, "preferred_lang", payload.preferred_lang);
        if (payload.preferred_theme !== undefined) assignCol(clean, "preferred_theme", payload.preferred_theme);
      } else {
        const name = payload.fullname || payload.full_name || payload.name || payload.username || "User";
        const username = payload.username || (payload.email ? String(payload.email).split("@")[0] : `user_${Date.now()}`);
        const pwd = payload.password || payload.password_hash || "Password123!";
        const phone = payload.mobile || payload.phone || "";
        const role = String(payload.role || "operator").trim().toLowerCase();

        assignCol(clean, "fullname", name);
        assignCol(clean, "full_name", name);
        assignCol(clean, "username", username);
        if (payload.user_id || payload.id) {
          assignCol(clean, "user_id", payload.user_id || `USR_${payload.id}`);
        }
        if (payload.email !== undefined) assignCol(clean, "email", payload.email);
        assignCol(clean, "password", pwd);
        assignCol(clean, "password_hash", pwd);
        assignCol(clean, "role", role);
        assignCol(clean, "mobile", phone);
        assignCol(clean, "phone", phone);
        if (payload.preferred_lang !== undefined) assignCol(clean, "preferred_lang", payload.preferred_lang);
        if (payload.preferred_theme !== undefined) assignCol(clean, "preferred_theme", payload.preferred_theme);
      }

      if (payload.employee_id !== undefined) assignCol(clean, "employee_id", payload.employee_id);
      if (payload.country_id !== undefined) assignCol(clean, "country_id", safeInt(payload.country_id, 1));
      if (payload.photo_path !== undefined) assignCol(clean, "photo_path", payload.photo_path);
      if (payload.effective_from !== undefined) assignCol(clean, "effective_from", payload.effective_from);
      if (payload.effective_to !== undefined) assignCol(clean, "effective_to", payload.effective_to);
      if (payload.is_locked !== undefined) assignCol(clean, "is_locked", Boolean(payload.is_locked));
      if (payload.is_active !== undefined) assignCol(clean, "is_active", Boolean(payload.is_active));
      if (payload.is_deleted !== undefined) assignCol(clean, "is_deleted", Boolean(payload.is_deleted));
      if (payload.insert_by !== undefined) assignCol(clean, "insert_by", String(payload.insert_by));
      if (payload.insert_on !== undefined) assignCol(clean, "insert_on", payload.insert_on);
      if (payload.update_by !== undefined) assignCol(clean, "update_by", String(payload.update_by));
      if (payload.update_on !== undefined) assignCol(clean, "update_on", payload.update_on);
      if (payload.delete_by !== undefined) assignCol(clean, "delete_by", payload.delete_by);
      if (payload.deleted_on !== undefined) assignCol(clean, "deleted_on", payload.deleted_on);

      if (existingCols && existingCols.size > 0) {
        for (const k of Object.keys(clean)) {
          if (!existingCols.has(k.toLowerCase())) {
            delete clean[k];
          }
        }
      }

      return clean;
    }

    if (tblLower === "tbl_company") {
      const compName = payload.name || payload.company_name || payload.fullname || payload.fullanme || "Company";
      const phone = payload.phone || payload.mobile || payload.phone_number || "";
      const pan = payload.pan_no || payload.pan_number || "";

      const clean: Record<string, any> = {};

      assignCol(clean, "name", compName);
      assignCol(clean, "company_name", compName);
      assignCol(clean, "fullname", compName);
      assignCol(clean, "phone", phone);
      assignCol(clean, "mobile", phone);
      assignCol(clean, "phone_number", phone);
      assignCol(clean, "pan_no", pan);
      assignCol(clean, "pan_number", pan);
      if (payload.code !== undefined) assignCol(clean, "code", payload.code);
      if (payload.address !== undefined) assignCol(clean, "address", payload.address);
      if (payload.email !== undefined) assignCol(clean, "email", payload.email);
      if (payload.is_active !== undefined) assignCol(clean, "is_active", Boolean(payload.is_active));
      if (payload.is_deleted !== undefined) assignCol(clean, "is_deleted", Boolean(payload.is_deleted));
      if (payload.insert_by !== undefined) assignCol(clean, "insert_by", String(payload.insert_by));
      if (payload.insert_on !== undefined) assignCol(clean, "insert_on", payload.insert_on);
      if (payload.update_by !== undefined) assignCol(clean, "update_by", String(payload.update_by));
      if (payload.update_on !== undefined) assignCol(clean, "update_on", payload.update_on);
      if (payload.delete_by !== undefined) assignCol(clean, "delete_by", payload.delete_by);
      if (payload.deleted_on !== undefined) assignCol(clean, "deleted_on", payload.deleted_on);

      if (existingCols && existingCols.size > 0) {
        for (const k of Object.keys(clean)) {
          if (!existingCols.has(k.toLowerCase())) {
            delete clean[k];
          }
        }
      }

      return clean;
    }

    if (tblLower === "tbl_fiscal_year") {
      const code = payload.code || "081/82";
      const name = payload.fullname || payload.name || `Fiscal Year ${code}`;
      const bsYear = payload.bs_year || (code.includes("/") ? code.split("/")[0] : code);
      const adYear = payload.ad_year || "2024/2025";
      const fromBs = payload.date_from_bs || `20${code.slice(0, 2)}-04-01`;
      const toBs = payload.date_to_bs || `20${code.slice(-2)}-03-31`;
      const fromAd = payload.date_from_ad || "2024-07-16";
      const toAd = payload.date_to_ad || "2025-07-15";

      const clean: Record<string, any> = {};

      assignCol(clean, "code", code);
      assignCol(clean, "fullname", name);
      assignCol(clean, "name", name);
      assignCol(clean, "bs_year", bsYear);
      assignCol(clean, "ad_year", adYear);
      assignCol(clean, "date_from_bs", fromBs);
      assignCol(clean, "date_to_bs", toBs);
      assignCol(clean, "date_from_ad", fromAd);
      assignCol(clean, "date_to_ad", toAd);
      if (payload.is_active !== undefined) assignCol(clean, "is_active", Boolean(payload.is_active));
      if (payload.is_deleted !== undefined) assignCol(clean, "is_deleted", Boolean(payload.is_deleted));
      if (payload.insert_by !== undefined) assignCol(clean, "insert_by", String(payload.insert_by));
      if (payload.insert_on !== undefined) assignCol(clean, "insert_on", payload.insert_on);
      if (payload.update_by !== undefined) assignCol(clean, "update_by", String(payload.update_by));
      if (payload.update_on !== undefined) assignCol(clean, "update_on", payload.update_on);
      if (payload.delete_by !== undefined) assignCol(clean, "delete_by", payload.delete_by);
      if (payload.deleted_on !== undefined) assignCol(clean, "deleted_on", payload.deleted_on);

      if (existingCols && existingCols.size > 0) {
        for (const k of Object.keys(clean)) {
          if (!existingCols.has(k.toLowerCase())) {
            delete clean[k];
          }
        }
      }

      return clean;
    }

    if (tblLower === "tbl_unit") {
      const code = payload.code || payload.symbol || "UNIT";
      const name = payload.name || payload.fullanme || payload.fullname || code;
      const symbol = payload.symbol || code;
      const unitVal = safeNum(payload.unit_value, 1.0);

      const clean: Record<string, any> = {};

      assignCol(clean, "code", code);
      assignCol(clean, "fullanme", name);
      assignCol(clean, "fullname", name);
      assignCol(clean, "name", name);
      assignCol(clean, "symbol", symbol);
      assignCol(clean, "unit_value", unitVal);
      if (payload.is_active !== undefined) assignCol(clean, "is_active", Boolean(payload.is_active));
      if (payload.is_deleted !== undefined) assignCol(clean, "is_deleted", Boolean(payload.is_deleted));
      if (payload.insert_by !== undefined) assignCol(clean, "insert_by", String(payload.insert_by));
      if (payload.insert_on !== undefined) assignCol(clean, "insert_on", payload.insert_on);
      if (payload.update_by !== undefined) assignCol(clean, "update_by", String(payload.update_by));
      if (payload.update_on !== undefined) assignCol(clean, "update_on", payload.update_on);
      if (payload.delete_by !== undefined) assignCol(clean, "delete_by", payload.delete_by);
      if (payload.deleted_on !== undefined) assignCol(clean, "deleted_on", payload.deleted_on);

      if (existingCols && existingCols.size > 0) {
        for (const k of Object.keys(clean)) {
          if (!existingCols.has(k.toLowerCase())) {
            delete clean[k];
          }
        }
      }

      return clean;
    }

    if (tblLower === "tbl_construction_type") {
      const code = payload.code || "CONST_TYPE";
      const name = payload.name || payload.fullanme || payload.fullname || code;
      const depRate = safeNum(payload.depreciation_rate, 0);

      const clean: Record<string, any> = {};

      assignCol(clean, "code", code);
      assignCol(clean, "fullanme", name);
      assignCol(clean, "fullname", name);
      assignCol(clean, "name", name);
      assignCol(clean, "depreciation_rate", depRate);
      if (payload.is_active !== undefined) assignCol(clean, "is_active", Boolean(payload.is_active));
      if (payload.is_deleted !== undefined) assignCol(clean, "is_deleted", Boolean(payload.is_deleted));
      if (payload.insert_by !== undefined) assignCol(clean, "insert_by", String(payload.insert_by));
      if (payload.insert_on !== undefined) assignCol(clean, "insert_on", payload.insert_on);
      if (payload.update_by !== undefined) assignCol(clean, "update_by", String(payload.update_by));
      if (payload.update_on !== undefined) assignCol(clean, "update_on", payload.update_on);
      if (payload.delete_by !== undefined) assignCol(clean, "delete_by", payload.delete_by);
      if (payload.deleted_on !== undefined) assignCol(clean, "deleted_on", payload.deleted_on);

      if (existingCols && existingCols.size > 0) {
        for (const k of Object.keys(clean)) {
          if (!existingCols.has(k.toLowerCase())) {
            delete clean[k];
          }
        }
      }

      return clean;
    }

    if (tblLower === "tbl_land_nature") {
      const code = payload.code || "LAND_NATURE";
      const name = payload.name || payload.fullanme || payload.fullname || code;

      const clean: Record<string, any> = {};

      assignCol(clean, "code", code);
      assignCol(clean, "fullanme", name);
      assignCol(clean, "fullname", name);
      assignCol(clean, "name", name);
      if (payload.is_active !== undefined) assignCol(clean, "is_active", Boolean(payload.is_active));
      if (payload.is_deleted !== undefined) assignCol(clean, "is_deleted", Boolean(payload.is_deleted));
      if (payload.insert_by !== undefined) assignCol(clean, "insert_by", String(payload.insert_by));
      if (payload.insert_on !== undefined) assignCol(clean, "insert_on", payload.insert_on);
      if (payload.update_by !== undefined) assignCol(clean, "update_by", String(payload.update_by));
      if (payload.update_on !== undefined) assignCol(clean, "update_on", payload.update_on);
      if (payload.delete_by !== undefined) assignCol(clean, "delete_by", payload.delete_by);
      if (payload.deleted_on !== undefined) assignCol(clean, "deleted_on", payload.deleted_on);

      if (existingCols && existingCols.size > 0) {
        for (const k of Object.keys(clean)) {
          if (!existingCols.has(k.toLowerCase())) {
            delete clean[k];
          }
        }
      }

      return clean;
    }

    if (tblLower === "tbl_land") {
      const kitta = payload.kitta_number || payload.kitta_no || payload.kitta || "101";
      const moth = payload.moth_number || payload.moth_no || payload.moth || "1";
      const unitId = safeInt(payload.land_measuring_unit_id || payload.unit_id, 1);
      const natureId = safeInt(payload.nature_id || payload.land_nature_id, 1);
      const landRateId = safeInt(payload.land_rate_id, 1);
      const malpotRateId = safeInt(payload.malpot_rate_id, 1);
      const ward = safeInt(payload.ward_no, 1);
      const area = safeNum(payload.area_sqfeet !== undefined ? payload.area_sqfeet : payload.area_sqft, 1000);
      const tpId = payload.taxpayer_id !== undefined && payload.taxpayer_id !== null ? safeInt(payload.taxpayer_id, 1) : null;

      const clean: Record<string, any> = {};

      if (tpId !== null) assignCol(clean, "taxpayer_id", tpId);
      assignCol(clean, "kitta_number", String(kitta));
      assignCol(clean, "kitta_no", String(kitta));
      assignCol(clean, "moth_number", String(moth));
      assignCol(clean, "moth_no", String(moth));
      assignCol(clean, "ward_no", ward);
      assignCol(clean, "area_sqfeet", area);
      assignCol(clean, "area_sqft", area);
      assignCol(clean, "land_measuring_unit_id", unitId);
      assignCol(clean, "unit_id", unitId);
      assignCol(clean, "nature_id", natureId);
      assignCol(clean, "land_rate_id", landRateId);
      assignCol(clean, "malpot_rate_id", malpotRateId);
      const baseSqFt = unitId === 1 ? 342.25 : unitId === 2 ? 3645 : unitId === 4 ? 10.7639 : 1;
      const cachedRates = this.inMemoryStores.get("tbl_land_rate") || [];
      const foundRate = cachedRates.find((r: any) => Number(r.id) === landRateId);
      const ratePerUnit = foundRate ? Number(foundRate.rate_per_unit || 800000) : 800000;
      let assessedVal = Math.round((area / baseSqFt) * ratePerUnit);
      if (payload.assessed_valuation !== undefined && Number(payload.assessed_valuation) > 0 && Math.abs(Number(payload.assessed_valuation) - assessedVal) > 5000000) {
        assessedVal = Number(payload.assessed_valuation);
      }
      assignCol(clean, "include_in_evaluation", payload.include_in_evaluation !== undefined ? Boolean(payload.include_in_evaluation) : true);
      assignCol(clean, "assessed_valuation", assessedVal);
      if (payload.is_active !== undefined) assignCol(clean, "is_active", Boolean(payload.is_active));
      if (payload.is_deleted !== undefined) assignCol(clean, "is_deleted", Boolean(payload.is_deleted));
      if (payload.insert_by !== undefined) assignCol(clean, "insert_by", String(payload.insert_by));
      if (payload.insert_on !== undefined) assignCol(clean, "insert_on", payload.insert_on);
      if (payload.update_by !== undefined) assignCol(clean, "update_by", String(payload.update_by));
      if (payload.update_on !== undefined) assignCol(clean, "update_on", payload.update_on);
      if (payload.delete_by !== undefined) assignCol(clean, "delete_by", payload.delete_by);
      if (payload.deleted_on !== undefined) assignCol(clean, "deleted_on", payload.deleted_on);

      if (existingCols && existingCols.size > 0) {
        for (const k of Object.keys(clean)) {
          if (!existingCols.has(k.toLowerCase())) {
            delete clean[k];
          }
        }
      }

      return clean;
    }

    if (tblLower === "tbl_house") {
      const houseNo = payload.house_no || payload.house_number || "H-1";
      const area = safeNum(payload.area_sqfeet !== undefined ? payload.area_sqfeet : payload.area_sqft, 500);
      const unitId = safeInt(payload.measuring_unit_id || payload.unit_id, 1);
      const constTypeId = safeInt(payload.construction_type_id, 1);
      const tpId = safeInt(payload.taxpayer_id, 1);
      const landId = payload.land_id !== undefined && payload.land_id !== null ? safeInt(payload.land_id, 1) : null;

      const clean: Record<string, any> = {};

      assignCol(clean, "taxpayer_id", tpId);
      if (landId !== null) assignCol(clean, "land_id", landId);
      if (payload.secondary_land_id) assignCol(clean, "secondary_land_id", safeInt(payload.secondary_land_id, 1));
      if (payload.kitta_numbers) assignCol(clean, "kitta_numbers", String(payload.kitta_numbers));
      if (payload.land_ids) assignCol(clean, "land_ids", String(payload.land_ids));
      assignCol(clean, "house_no", String(houseNo));
      assignCol(clean, "house_number", String(houseNo));
      assignCol(clean, "area_sqfeet", area);
      assignCol(clean, "area_sqft", area);
      const plinth = safeNum(payload.plinth_area, area);
      assignCol(clean, "plinth_area", plinth);
      assignCol(clean, "floor_no", safeInt(payload.floor_no, 1));
      assignCol(clean, "measuring_unit_id", unitId);
      assignCol(clean, "construction_type_id", constTypeId);
      assignCol(clean, "acquisition_date_bs", payload.acquisition_date_bs || "2078-01-01");
      assignCol(clean, "acquisition_date_ad", payload.acquisition_date_ad || "2021-04-14");
      assignCol(clean, "include_in_evaluation", payload.include_in_evaluation !== undefined ? Boolean(payload.include_in_evaluation) : true);

      let houseVal = safeNum(payload.assessed_valuation, 0);
      if (houseVal <= 0) {
        houseVal = Math.round(plinth * 2800);
      }
      assignCol(clean, "assessed_valuation", houseVal);
      if (payload.is_active !== undefined) assignCol(clean, "is_active", Boolean(payload.is_active));
      if (payload.is_deleted !== undefined) assignCol(clean, "is_deleted", Boolean(payload.is_deleted));
      if (payload.insert_by !== undefined) assignCol(clean, "insert_by", String(payload.insert_by));
      if (payload.insert_on !== undefined) assignCol(clean, "insert_on", payload.insert_on);
      if (payload.update_by !== undefined) assignCol(clean, "update_by", String(payload.update_by));
      if (payload.update_on !== undefined) assignCol(clean, "update_on", payload.update_on);
      if (payload.delete_by !== undefined) assignCol(clean, "delete_by", payload.delete_by);
      if (payload.deleted_on !== undefined) assignCol(clean, "deleted_on", payload.deleted_on);

      if (existingCols && existingCols.size > 0) {
        for (const k of Object.keys(clean)) {
          if (!existingCols.has(k.toLowerCase())) {
            delete clean[k];
          }
        }
      }

      return clean;
    }

    if (tblLower === "tbl_floor") {
      const houseId = safeInt(payload.house_id, 1);
      const floorNo = safeInt(payload.floor_no, 0);
      const constTypeId = safeInt(payload.construction_type_id, 1);
      const area = safeNum(payload.area_sqfeet !== undefined ? payload.area_sqfeet : payload.area_sqft, 500);
      const rateId = safeInt(payload.rate_id, 1);
      const unitId = safeInt(payload.measuring_unit_id || payload.unit_id, 1);

      const clean: Record<string, any> = {};

      assignCol(clean, "house_id", houseId);
      assignCol(clean, "floor_no", floorNo);
      assignCol(clean, "construction_type_id", constTypeId);
      assignCol(clean, "area_sqfeet", area);
      assignCol(clean, "area_sqft", area);
      assignCol(clean, "rate_id", rateId);
      assignCol(clean, "measuring_unit_id", unitId);
      assignCol(clean, "construction_date_ad", payload.construction_date_ad || "2021-04-14");
      assignCol(clean, "construction_date_bs", payload.construction_date_bs || "2078-01-01");
      assignCol(clean, "remarks", payload.remarks || "");
      const depPercent = safeNum(payload.depreciation_percent, 5);
      assignCol(clean, "depreciation_percent", depPercent);

      let floorVal = safeNum(payload.floor_assessed_valuation, 0);
      if (floorVal <= 0) {
        const cachedRates = this.inMemoryStores.get("tbl_construction_rates") || [];
        const foundRate = cachedRates.find((r: any) => Number(r.id) === rateId);
        const ratePerSq = foundRate ? Number(foundRate.rate_per_unit || 2800) : 2800;
        floorVal = Math.round(area * ratePerSq * (1 - depPercent / 100));
      }
      assignCol(clean, "floor_assessed_valuation", floorVal);
      assignCol(clean, "include_in_evaluation", payload.include_in_evaluation !== undefined ? Boolean(payload.include_in_evaluation) : true);
      if (payload.is_active !== undefined) assignCol(clean, "is_active", Boolean(payload.is_active));
      if (payload.is_deleted !== undefined) assignCol(clean, "is_deleted", Boolean(payload.is_deleted));
      if (payload.insert_by !== undefined) assignCol(clean, "insert_by", String(payload.insert_by));
      if (payload.insert_on !== undefined) assignCol(clean, "insert_on", payload.insert_on);
      if (payload.update_by !== undefined) assignCol(clean, "update_by", String(payload.update_by));
      if (payload.update_on !== undefined) assignCol(clean, "update_on", payload.update_on);
      if (payload.delete_by !== undefined) assignCol(clean, "delete_by", payload.delete_by);
      if (payload.deleted_on !== undefined) assignCol(clean, "deleted_on", payload.deleted_on);

      if (existingCols && existingCols.size > 0) {
        for (const k of Object.keys(clean)) {
          if (!existingCols.has(k.toLowerCase())) {
            delete clean[k];
          }
        }
      }

      return clean;
    }

    if (tblLower === "tbl_user_log") {
      const action = payload.action_type || payload.action_name || "AUDIT_EVENT";
      const ip = payload.client_ip || payload.ip_address || "127.0.0.1";
      const uname = payload.username_attempt || payload.user_id || "SYSTEM";
      const uid = payload.user_id !== undefined ? safeInt(payload.user_id, 1) : null;

      const clean: Record<string, any> = {};

      if (uid !== null) assignCol(clean, "user_id", uid);
      assignCol(clean, "action_name", action);
      assignCol(clean, "action_type", action);
      assignCol(clean, "ip_address", ip);
      assignCol(clean, "client_ip", ip);
      assignCol(clean, "username_attempt", String(uname));
      if (payload.module_name !== undefined) assignCol(clean, "module_name", payload.module_name);
      if (payload.user_agent !== undefined) assignCol(clean, "user_agent", payload.user_agent);
      if (payload.details !== undefined) assignCol(clean, "details", typeof payload.details === "string" ? payload.details : JSON.stringify(payload.details));
      if (payload.created_at !== undefined) assignCol(clean, "created_at", payload.created_at);
      if (payload.insert_on !== undefined) assignCol(clean, "insert_on", payload.insert_on);
      if (payload.insert_by !== undefined) assignCol(clean, "insert_by", String(payload.insert_by));
      if (payload.update_by !== undefined) assignCol(clean, "update_by", String(payload.update_by));
      if (payload.is_active !== undefined) assignCol(clean, "is_active", Boolean(payload.is_active));
      if (payload.is_deleted !== undefined) assignCol(clean, "is_deleted", Boolean(payload.is_deleted));

      if (existingCols && existingCols.size > 0) {
        for (const k of Object.keys(clean)) {
          if (!existingCols.has(k.toLowerCase())) {
            delete clean[k];
          }
        }
      }

      return clean;
    }

    if (tblLower === "tbl_malpot_rates" || tblLower === "tbl_land_rate" || tblLower === "tbl_construction_rates" || tblLower === "tbl_depreciation") {
      const clean: Record<string, any> = {};
      const name = payload.fullname || payload.fullanme || payload.name || payload.code || "Rate";

      assignCol(clean, "code", payload.code || "RATE");
      assignCol(clean, "fullanme", name);
      assignCol(clean, "fullname", name);
      assignCol(clean, "name", name);
      if (payload.fiscal_year_id !== undefined) assignCol(clean, "fiscal_year_id", payload.fiscal_year_id ? safeInt(payload.fiscal_year_id, 2) : null);
      if (payload.is_parent !== undefined) assignCol(clean, "is_parent", Boolean(payload.is_parent));
      if (payload.parent_id !== undefined) assignCol(clean, "parent_id", payload.parent_id ? safeInt(payload.parent_id, 1) : null);
      if (payload.unit_id !== undefined) assignCol(clean, "unit_id", safeInt(payload.unit_id, 1));
      if (payload.const_type_id !== undefined) assignCol(clean, "const_type_id", safeInt(payload.const_type_id, 1));
      if (payload.rate_per_unit !== undefined) assignCol(clean, "rate_per_unit", safeNum(payload.rate_per_unit, 0));
      if (payload.area_upto !== undefined) assignCol(clean, "area_upto", safeNum(payload.area_upto, 0));
      if (payload.area_per_unit !== undefined) assignCol(clean, "area_per_unit", safeNum(payload.area_per_unit, 1));
      if (payload.ward_no_ids !== undefined) assignCol(clean, "ward_no_ids", String(payload.ward_no_ids));
      if (payload.sn !== undefined) assignCol(clean, "sn", safeInt(payload.sn, 1));
      if (payload.year_from !== undefined) assignCol(clean, "year_from", safeInt(payload.year_from, 0));
      if (payload.year_to !== undefined) assignCol(clean, "year_to", safeInt(payload.year_to, 10));
      if (payload.percent !== undefined) assignCol(clean, "percent", safeNum(payload.percent, 0));
      if (payload.is_active !== undefined) assignCol(clean, "is_active", Boolean(payload.is_active));
      if (payload.is_deleted !== undefined) assignCol(clean, "is_deleted", Boolean(payload.is_deleted));
      if (payload.insert_by !== undefined) assignCol(clean, "insert_by", String(payload.insert_by));
      if (payload.insert_on !== undefined) assignCol(clean, "insert_on", payload.insert_on);
      if (payload.update_by !== undefined) assignCol(clean, "update_by", String(payload.update_by));
      if (payload.update_on !== undefined) assignCol(clean, "update_on", payload.update_on);

      if (existingCols && existingCols.size > 0) {
        for (const k of Object.keys(clean)) {
          if (!existingCols.has(k.toLowerCase())) {
            delete clean[k];
          }
        }
      }

      return clean;
    }

    if (tblLower === "tbl_appication_setting" || tblLower === "tbl_application_setting") {
      const clean: Record<string, any> = {};
      const name = payload.fullname || payload.fullanme || payload.municipality_name || "Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)";

      assignCol(clean, "code", payload.code || "APP-CONF-01");
      assignCol(clean, "fullname", name);
      assignCol(clean, "fullanme", name);
      assignCol(clean, "municipality_name", payload.municipality_name || name);
      if (payload.company_id !== undefined) assignCol(clean, "company_id", safeInt(payload.company_id, 1));
      if (payload.fiscal_year_id !== undefined) assignCol(clean, "fiscal_year_id", safeInt(payload.fiscal_year_id, 2));
      if (payload.unit_type_id !== undefined) assignCol(clean, "unit_type_id", safeInt(payload.unit_type_id, 3));
      if (payload.ward_count !== undefined) assignCol(clean, "ward_count", safeInt(payload.ward_count, 32));
      if (payload.theme_preference !== undefined) assignCol(clean, "theme_preference", payload.theme_preference);
      if (payload.default_language !== undefined) assignCol(clean, "default_language", payload.default_language);
      if (payload.is_active !== undefined) assignCol(clean, "is_active", Boolean(payload.is_active));
      if (payload.is_deleted !== undefined) assignCol(clean, "is_deleted", Boolean(payload.is_deleted));
      if (payload.insert_by !== undefined) assignCol(clean, "insert_by", String(payload.insert_by));
      if (payload.insert_on !== undefined) assignCol(clean, "insert_on", payload.insert_on);
      if (payload.update_by !== undefined) assignCol(clean, "update_by", String(payload.update_by));
      if (payload.update_on !== undefined) assignCol(clean, "update_on", payload.update_on);

      if (existingCols && existingCols.size > 0) {
        for (const k of Object.keys(clean)) {
          if (!existingCols.has(k.toLowerCase())) {
            delete clean[k];
          }
        }
      }

      return clean;
    }

    // Generic defensive fallback: only keep columns that actually exist in PostgreSQL
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (!existingCols || existingCols.size === 0 || existingCols.has(k.toLowerCase())) {
        clean[k] = v;
      }
    }
    return clean;
  }

  /**
   * Inserts a record directly into PostgreSQL table, ensures audit fields store userId from tbl_user,
   * auto-syncs with Redis, and returns the response from Redis cache.
   */
  public static async insertRecord<T = any>(
    table: GtaxTableName | string,
    recordData: Record<string, any>,
    userId: string = "1"
  ): Promise<T> {
    const now = new Date().toISOString();
    // Enforce requirement: insert_by, update_by store user ID from tbl_user (e.g. '1')
    const finalUserId = String(userId || "1").trim() || "1";

    const payload: Record<string, any> = {
      ...recordData,
      insert_by: recordData.insert_by || finalUserId,
      insert_on: recordData.insert_on || now,
      update_by: finalUserId,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: recordData.is_active !== undefined ? Boolean(recordData.is_active) : true,
      is_deleted: false,
    };

    let insertedRecord: T | null = null;

    if (PostgresPoolManager.getStatus().connected) {
      try {
        // Advance sequence first to prevent primary key collision
        try {
          await PostgresPoolManager.query(`
            SELECT setval(pg_get_serial_sequence('${table}', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM ${table}), 0), 1));
          `);
        } catch {
          // Table may use string ID (e.g. tax_jurisdictions)
        }

        const existingCols = await this.getTableColumns(table);
        const dbPayload = this.sanitizePayloadForDb(table, payload, existingCols);
        const keys = Object.keys(dbPayload);
        const columns = keys.map((k) => `"${k}"`).join(", ");
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
        const values = Object.values(dbPayload);

        const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *;`;
        const res = await PostgresPoolManager.query<T>(sql, values);
        if (res && res.length > 0) {
          insertedRecord = res[0];
        } else {
          const dbErr = PostgresPoolManager.getLastQueryError();
          if (dbErr) {
            throw new Error(`Database Insert Failed: ${dbErr}`);
          }
        }
      } catch (err: any) {
        console.error(`[gtax:CacheSync] Live insert to ${table} failed:`, err);
        throw err;
      }
    }

    if (!insertedRecord) {
      // In-memory fallback
      const store = this.inMemoryStores.get(table) || [];
      const newId = payload.id || (store.length > 0 ? Math.max(...store.map((s: any) => Number(s.id) || 0)) + 1 : 1);
      insertedRecord = { ...payload, id: newId } as T;
      store.push(insertedRecord);
      this.inMemoryStores.set(table, store);
      this.saveStoresToDisk();
    }

    // Auto-sync Redis Cache from Database
    const freshRows = await this.refreshTableCacheFromDb(table);
    const found = freshRows.find((r: any) => String(r.id) === String((insertedRecord as any)?.id));
    if (found) {
      insertedRecord = found as T;
    }

    return insertedRecord;
  }

  /**
   * Updates a record in PostgreSQL table, auto-syncs with Redis, and returns updated record from Redis cache.
   */
  public static async updateRecord<T = any>(
    table: GtaxTableName | string,
    id: number | string,
    patchData: Record<string, any>,
    userId: string = "1"
  ): Promise<T | null> {
    const now = new Date().toISOString();
    const finalUserId = String(userId || "1").trim() || "1";

    if (id === undefined || id === null || String(id).trim() === "" || String(id).toLowerCase() === "nan") {
      console.warn(`[gtax:CacheSync] updateRecord on ${table} rejected due to invalid ID: ${id}`);
      return null;
    }

    let targetId: string | number = id;
    let targetNum = Number(id);
    if (isNaN(targetNum) && (typeof id !== "string" || !id.startsWith("tax_"))) {
      const list = (this.inMemoryStores.get(table) || []) as any[];
      const found = list.find(
        (item: any) =>
          String(item.id) === String(id) ||
          String(item.user_id) === String(id) ||
          String(item.taxpayer_id) === String(id) ||
          String(item.taxpayer_code) === String(id) ||
          String(item.username) === String(id) ||
          String(item.code) === String(id)
      );
      if (found && !isNaN(Number(found.id)) && Number(found.id) > 0) {
        targetId = Number(found.id);
        targetNum = Number(found.id);
      } else {
        console.warn(`[gtax:CacheSync] updateRecord on ${table} rejected due to unresolvable ID: ${id}`);
        return null;
      }
    } else if (!isNaN(targetNum)) {
      targetId = targetNum;
    }

    const payload: Record<string, any> = {
      ...patchData,
      update_by: finalUserId,
      update_on: now,
    };

    let updatedRecord: T | null = null;

    if (PostgresPoolManager.getStatus().connected) {
      try {
        const existingCols = await this.getTableColumns(table);
        const dbPayload = this.sanitizePayloadForDb(table, payload, existingCols, true);
        const idCol = typeof targetId === "number" || (!isNaN(Number(targetId)) && !String(targetId).includes("_")) ? "id" : (table.startsWith("tax_") ? `${table.slice(0, -1)}_id` : "id");
        const keys = Object.keys(dbPayload).filter((k) => k !== "id" && k !== idCol);
        if (keys.length > 0) {
          const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
          const values = keys.map((k) => dbPayload[k]);
          values.push(targetId);

          const sql = `UPDATE ${table} SET ${setClauses} WHERE "${idCol}" = $${values.length} RETURNING *;`;
          const res = await PostgresPoolManager.query<T>(sql, values);
          if (res && res.length > 0) {
            updatedRecord = res[0];
          }
        }
      } catch (err) {
        console.error(`[gtax:CacheSync] Live update to ${table} failed:`, err);
      }
    }

    if (!updatedRecord) {
      const store = this.inMemoryStores.get(table) || [];
      const sanitizedMemoryPatch = table.toLowerCase() === "tbl_user"
        ? this.sanitizePayloadForDb(table, payload, undefined, true)
        : payload;
      const idx = store.findIndex(
        (item: any) => String(item.id) === String(targetId) || String(item.id) === String(id)
      );
      if (idx !== -1) {
        store[idx] = { ...store[idx], ...sanitizedMemoryPatch };
        updatedRecord = store[idx];
        this.inMemoryStores.set(table, store);
        this.saveStoresToDisk();
      }
    }

    // Auto-sync Redis Cache from Database
    const freshRows = await this.refreshTableCacheFromDb(table);
    const found = freshRows.find(
      (r: any) => String(r.id) === String(targetId) || String(r.id) === String(id)
    );
    if (found) {
      updatedRecord = found as T;
    }

    return updatedRecord;
  }

  /**
   * Soft-deletes a record in PostgreSQL table, auto-syncs with Redis cache.
   */
  public static async deleteRecord(
    table: GtaxTableName | string,
    id: number | string,
    userId: string = "1"
  ): Promise<boolean> {
    const now = new Date().toISOString();
    const finalUserId = String(userId || "1").trim() || "1";

    if (id === undefined || id === null || String(id).trim() === "" || String(id).toLowerCase() === "nan") {
      console.warn(`[gtax:CacheSync] deleteRecord on ${table} rejected due to invalid ID: ${id}`);
      return false;
    }

    let targetId: string | number = id;
    let targetNum = Number(id);
    if (isNaN(targetNum) && (typeof id !== "string" || !id.startsWith("tax_"))) {
      const list = (this.inMemoryStores.get(table) || []) as any[];
      const found = list.find(
        (item: any) =>
          String(item.id) === String(id) ||
          String(item.user_id) === String(id) ||
          String(item.taxpayer_id) === String(id) ||
          String(item.taxpayer_code) === String(id) ||
          String(item.username) === String(id) ||
          String(item.code) === String(id)
      );
      if (found && !isNaN(Number(found.id)) && Number(found.id) > 0) {
        targetId = Number(found.id);
        targetNum = Number(found.id);
      } else {
        console.warn(`[gtax:CacheSync] deleteRecord on ${table} rejected due to unresolvable ID: ${id}`);
        return false;
      }
    } else if (!isNaN(targetNum)) {
      targetId = targetNum;
    }

    if (PostgresPoolManager.getStatus().connected) {
      try {
        const idCol = typeof targetId === "number" || !isNaN(Number(targetId)) ? "id" : (table.startsWith("tax_") ? `${table.slice(0, -1)}_id` : "id");
        const sql = `
          UPDATE ${table}
          SET is_deleted = TRUE, is_active = FALSE, delete_by = $1, deleted_on = $2
          WHERE "${idCol}" = $3;
        `;
        await PostgresPoolManager.query(sql, [finalUserId, now, targetId]);
      } catch (err) {
        console.error(`[gtax:CacheSync] Live delete in ${table} failed:`, err);
      }
    }

    // Mirror in local store
    const store = this.inMemoryStores.get(table) || [];
    const idx = store.findIndex((item: any) => String(item.id) === String(id));
    if (idx !== -1) {
      store[idx].is_deleted = true;
      store[idx].is_active = false;
      store[idx].delete_by = finalUserId;
      store[idx].deleted_on = now;
      this.inMemoryStores.set(table, store);
      this.saveStoresToDisk();
    }

    // Auto-sync Redis Cache from Database
    await this.refreshTableCacheFromDb(table);

    return true;
  }

  /**
   * Action: Clear Cache and Re-sync directly from PostgreSQL Database.
   * Flushes Redis cache, re-queries all 25 tables directly from PostgreSQL, primes Redis,
   * and returns the fresh response snapshot directly from Redis.
   */
  public static async clearCacheAndSyncFromDb(): Promise<{
    status: string;
    message: string;
    database: string;
    clearedKeys: number;
    syncedTablesCount: number;
    totalRecordsLoaded: number;
    tables: Record<string, number>;
    latencyMs: number;
    timestamp: string;
    redis: any;
  }> {
    const startTime = Date.now();

    // 1. Flush Redis cache and clear column definitions cache
    this.clearTableColumnsCache();
    await RedisCacheManager.clearAll();

    const tableCounts: Record<string, number> = {};
    let totalRecords = 0;

    // 2. Query each of the 25 tables directly from PostgreSQL database & update Redis
    for (const table of ALL_25_TABLES) {
      const rows = await this.refreshTableCacheFromDb(table);
      tableCounts[table] = rows.length;
      totalRecords += rows.length;
    }

    const latencyMs = Date.now() - startTime;
    const dbConfig = PostgresPoolManager.getConfig();

    return {
      status: "SUCCESS",
      message: "Redis cache successfully cleared and re-synced directly from PostgreSQL database server.",
      database: dbConfig.database,
      clearedKeys: ALL_25_TABLES.length,
      syncedTablesCount: ALL_25_TABLES.length,
      totalRecordsLoaded: totalRecords,
      tables: tableCounts,
      latencyMs,
      timestamp: new Date().toISOString(),
      redis: RedisCacheManager.getStats(),
    };
  }

  /**
   * Seeds default memory stores if database is offline, mirroring DatabaseSchemaBootstrap
   */
  public static seedDefaultInMemoryStores(): void {
    if (this.inMemoryStores.size > 0) return;

    // Seed defaults for all 25 tables in memory
    this.inMemoryStores.set("tbl_role", [
      { id: 1, role_name: "superadmin", description: "Unrestricted Master Control", insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 2, role_name: "admin", description: "Corporate Tax Manager", insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 3, role_name: "operator", description: "Tax Operations Specialist", insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 4, role_name: "user", description: "Standard Tax Analyst", insert_by: "1", update_by: "1", is_active: true, is_deleted: false }
    ]);

    this.inMemoryStores.set("tbl_user", [
      { id: 1, fullname: "Eleanor Vance (Chief Tax Officer)", email: "superadmin@gtax.enterprise", mobile: "+1 (555) 019-2831", employee_id: "EMP-SA-001", role: "superadmin", insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 2, fullname: "Marcus Thorne (Senior Tax Strategist)", email: "admin@gtax.enterprise", mobile: "+1 (555) 024-8192", employee_id: "EMP-ADM-002", role: "admin", insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 3, fullname: "Sarah Chen (Global Compliance Director)", email: "operator@gtax.enterprise", mobile: "+1 (555) 038-7241", employee_id: "EMP-OP-003", role: "operator", insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 4, fullname: "Julian Keller (Tax Analyst)", email: "user@gtax.enterprise", mobile: "+1 (555) 042-9918", employee_id: "EMP-USR-004", role: "user", insert_by: "1", update_by: "1", is_active: true, is_deleted: false }
    ]);

    this.inMemoryStores.set("tbl_fiscal_year", generateFiscalYears2021To2086());

    this.inMemoryStores.set("tbl_unit", [
      { id: 1, code: "AANA", fullanme: "Aana (आना) - 342.25 Sq.Ft", unit_value: 342.25, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 2, code: "ROPANI", fullanme: "Ropani (रोपनी) - 5476 Sq.Ft / 16 Aana", unit_value: 5476.0, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 3, code: "PAISA", fullanme: "Paisa (पैसा) - 85.56 Sq.Ft / 4 Daam", unit_value: 85.5625, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 4, code: "DAAM", fullanme: "Daam (दाम) - 21.39 Sq.Ft", unit_value: 21.3906, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 5, code: "KATTHA", fullanme: "Kattha (कट्ठा) - 3645 Sq.Ft (Terai/Madhesh)", unit_value: 3645.0, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 6, code: "BIGHA", fullanme: "Bigha (बिघा) - 72900 Sq.Ft / 20 Kattha", unit_value: 72900.0, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 7, code: "SQFT", fullanme: "Square Feet (वर्ग फिट)", unit_value: 1.0, is_deleted: false, insert_by: "1", update_by: "1", is_active: true }
    ]);

    this.inMemoryStores.set("tbl_construction_type", [
      { id: 1, code: "RCC_PILLAR", fullanme: "R.C.C. Pillar & Slab Structure Grade A (पक्की पिलर भवन)", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 2, code: "LOAD_BEARING", fullanme: "Brick Masonry in Cement Mortar Load Bearing (इँटा-सिमेन्ट गाह्रो)", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 3, code: "BRICK_MUD", fullanme: "Traditional Brick with Mud Mortar Masonry (माटो-इँटा जोडाई)", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 4, code: "STEEL_TRUSS", fullanme: "Engineered Steel Truss & Industrial Prefab Panel (स्टिल ट्रस)", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 5, code: "WOOD_FRAME", fullanme: "Traditional Timber Frame & Stone Masonry (काठ-ढुङ्गा संरचना)", is_deleted: false, insert_by: "1", update_by: "1", is_active: true }
    ]);

    this.inMemoryStores.set("tbl_land_nature", [
      { id: 1, code: "COMMERCIAL", fullanme: "High Street Commercial & Business Corridor (व्यापारिक क्षेत्र)", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 2, code: "RESIDENTIAL", fullanme: "Municipal Urban Residential Zone (आवासीय क्षेत्र)", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 3, code: "AGRICULTURAL", fullanme: "Fertile Cultivation & Farmland Zone (कृषि क्षेत्र)", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 4, code: "INDUSTRIAL", fullanme: "Industrial & Manufacturing Zone (औद्योगिक क्षेत्र)", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 5, code: "HIGHWAY", fullanme: "National / Provincial Highway Facing (राजमार्गसँग जोडिएको)", is_deleted: false, insert_by: "1", update_by: "1", is_active: true }
    ]);

    this.inMemoryStores.set("tbl_land_rate", [
      { id: 1, code: "LR-001", fullanme: "Main Arterial Highway (Paved 40ft+ Corridor)", fiscal_year_id: 2, is_parent: false, parent_id: null, unit_id: 1, rate_per_unit: 1500000.0, area_upto: 0.0, area_per_unit: 1.0, ward_no_ids: "1,2,3,4", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 2, code: "LR-002", fullanme: "Secondary Branch Road (Paved 20ft Blacktopped)", fiscal_year_id: 2, is_parent: false, parent_id: null, unit_id: 1, rate_per_unit: 950000.0, area_upto: 0.0, area_per_unit: 1.0, ward_no_ids: "2,3,5", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 3, code: "LR-003", fullanme: "Urban Residential Link Road (Gravelled 14ft)", fiscal_year_id: 2, is_parent: false, parent_id: null, unit_id: 1, rate_per_unit: 650000.0, area_upto: 0.0, area_per_unit: 1.0, ward_no_ids: "3,4,6", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 4, code: "LR-004", fullanme: "Agricultural Zone Internal Trail (Earthen 10ft)", fiscal_year_id: 2, is_parent: false, parent_id: null, unit_id: 1, rate_per_unit: 280000.0, area_upto: 0.0, area_per_unit: 1.0, ward_no_ids: "7,8,9", is_deleted: false, insert_by: "1", update_by: "1", is_active: true }
    ]);

    this.inMemoryStores.set("tbl_malpot_rates", [
      { id: 1, code: "MR-001", fullanme: "Commercial Zone Government Valuation (मालपोत मूल्यांकन - व्यापारिक)", fiscal_year_id: 2, is_parent: false, parent_id: null, unit_id: 1, rate_per_unit: 1200000.0, area_upto: 0.0, area_per_unit: 1.0, ward_no_ids: "1,2,3", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 2, code: "MR-002", fullanme: "Residential Core Government Valuation (मालपोत मूल्यांकन - आवासीय)", fiscal_year_id: 2, is_parent: false, parent_id: null, unit_id: 1, rate_per_unit: 750000.0, area_upto: 0.0, area_per_unit: 1.0, ward_no_ids: "4,5,6", is_deleted: false, insert_by: "1", update_by: "1", is_active: true }
    ]);

    this.inMemoryStores.set("tbl_construction_rates", [
      { id: 1, code: "CR-001", fullanme: "RCC Frame Structure Grade A Assessment Rate", fiscal_year_id: 2, is_parent: false, parent_id: null, const_type_id: 1, unit_id: 7, rate_per_unit: 3200.0, area_upto: 0.0, area_per_unit: 1.0, ward_no_ids: "1,2,3,4,5,6,7,8,9", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 2, code: "CR-002", fullanme: "Cement Mortar Load Bearing Assessment Rate", fiscal_year_id: 2, is_parent: false, parent_id: null, const_type_id: 2, unit_id: 7, rate_per_unit: 2400.0, area_upto: 0.0, area_per_unit: 1.0, ward_no_ids: "1,2,3,4,5,6,7,8,9", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 3, code: "CR-003", fullanme: "Brick with Mud Mortar Traditional Masonry Rate", fiscal_year_id: 2, is_parent: false, parent_id: null, const_type_id: 3, unit_id: 7, rate_per_unit: 1400.0, area_upto: 0.0, area_per_unit: 1.0, ward_no_ids: "1,2,3,4,5,6,7,8,9", is_deleted: false, insert_by: "1", update_by: "1", is_active: true }
    ]);

    this.inMemoryStores.set("tbl_depreciation", [
      { id: 1, code: "DEP-01", fullanme: "Building Age 0 to 5 Years (0-5 वर्ष)", fiscal_year_id: 2, is_parent: false, parent_id: null, sn: 1, year_from: 0, year_to: 5, percent: 0.0, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 2, code: "DEP-02", fullanme: "Building Age 6 to 10 Years (६-१० वर्ष)", fiscal_year_id: 2, is_parent: false, parent_id: null, sn: 2, year_from: 6, year_to: 10, percent: 5.0, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 3, code: "DEP-03", fullanme: "Building Age 11 to 20 Years (११-२० वर्ष)", fiscal_year_id: 2, is_parent: false, parent_id: null, sn: 3, year_from: 11, year_to: 20, percent: 15.0, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 4, code: "DEP-04", fullanme: "Building Age 21 to 30 Years (२१-३० वर्ष)", fiscal_year_id: 2, is_parent: false, parent_id: null, sn: 4, year_from: 21, year_to: 30, percent: 25.0, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 5, code: "DEP-05", fullanme: "Building Age Over 30 Years (३० वर्ष माथि)", fiscal_year_id: 2, is_parent: false, parent_id: null, sn: 5, year_from: 31, year_to: 100, percent: 40.0, is_deleted: false, insert_by: "1", update_by: "1", is_active: true }
    ]);

    this.inMemoryStores.set("tbl_fine_rebate", [
      { id: 1, fiscal_year_id: 2, tax_type_id: 1, ratesn: 1, years: 0, month: 3, calcpercent: -10.0, ratepercent: -10.0, flatrate: 0.0, isfine: false, days: 90, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 2, fiscal_year_id: 2, tax_type_id: 1, ratesn: 2, years: 0, month: 9, calcpercent: 0.0, ratepercent: 0.0, flatrate: 0.0, isfine: false, days: 270, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 3, fiscal_year_id: 2, tax_type_id: 1, ratesn: 3, years: 1, month: 0, calcpercent: 10.0, ratepercent: 10.0, flatrate: 0.0, isfine: true, days: 365, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 4, fiscal_year_id: 2, tax_type_id: 1, ratesn: 4, years: 2, month: 0, calcpercent: 25.0, ratepercent: 25.0, flatrate: 0.0, isfine: true, days: 730, is_deleted: false, insert_by: "1", update_by: "1", is_active: true }
    ]);

    // Taxpayers, lands, houses, and floors start empty - strictly populated from database server
    this.inMemoryStores.set("tbl_taxpayer", []);
    this.inMemoryStores.set("tbl_land", []);
    this.inMemoryStores.set("tbl_house", []);
    this.inMemoryStores.set("tbl_floor", []);

    this.inMemoryStores.set("tax_jurisdictions", [
      { jurisdiction_id: "JUR_NP_MUNI", jurisdiction_code: "NP-KTM", jurisdiction_name: "Kathmandu Metropolitan Tax Authority", country_iso: "NPL", jurisdiction_level: "city", default_rate_pct: 10.0, insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { jurisdiction_id: "JUR_US_FED", jurisdiction_code: "US-FED", jurisdiction_name: "United States Internal Revenue Service", country_iso: "USA", jurisdiction_level: "federal", default_rate_pct: 0.0, insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { jurisdiction_id: "JUR_US_CA", jurisdiction_code: "US-CA", jurisdiction_name: "California Department of Tax & Fee Administration", country_iso: "USA", jurisdiction_level: "state", default_rate_pct: 7.25, insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { jurisdiction_id: "JUR_EU_VAT", jurisdiction_code: "EU-VAT", jurisdiction_name: "European Union Cross-Border VAT Regime", country_iso: "DEU", jurisdiction_level: "vat_zone", default_rate_pct: 19.0, insert_by: "1", update_by: "1", is_active: true, is_deleted: false }
    ]);

    this.inMemoryStores.set("tax_rules_matrix", [
      { rule_id: "RULE_MUNI_PROPERTY", jurisdiction_id: "JUR_NP_MUNI", tax_type: "property_tax", product_tax_code: "MUNICIPAL_PROPERTY", rate_percentage: 1.5, effective_from: "2024-07-16", is_cumulative_compounded: false, insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { rule_id: "RULE_MUNI_RENTAL", jurisdiction_id: "JUR_NP_MUNI", tax_type: "rental_tax", product_tax_code: "MUNICIPAL_RENTAL", rate_percentage: 10.0, effective_from: "2024-07-16", is_cumulative_compounded: false, insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { rule_id: "RULE_CA_SAAS", jurisdiction_id: "JUR_US_CA", tax_type: "sales_tax", product_tax_code: "DIGITAL_SAAS", rate_percentage: 7.25, effective_from: "2024-01-01", is_cumulative_compounded: false, insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { rule_id: "RULE_EU_DIGITAL", jurisdiction_id: "JUR_EU_VAT", tax_type: "vat", product_tax_code: "DIGITAL_SERVICES", rate_percentage: 19.0, effective_from: "2024-01-01", is_cumulative_compounded: false, insert_by: "1", update_by: "1", is_active: true, is_deleted: false }
    ]);

    this.inMemoryStores.set("tax_transactions", [
      { transaction_id: "TX-2081-0001", org_id: "ORG_GLOBAL_CORP", customer_id: "TP-2081-0001", invoice_number: "INV-2081-001", transaction_date: new Date().toISOString(), origin_country: "NPL", destination_country: "NPL", gross_amount: 150000.0, taxable_amount: 150000.0, total_tax_amount: 2250.0, sync_status: "SYNCED", insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { transaction_id: "TX-2081-0002", org_id: "ORG_GLOBAL_CORP", customer_id: "TP-2081-0002", invoice_number: "INV-2081-002", transaction_date: new Date().toISOString(), origin_country: "NPL", destination_country: "NPL", gross_amount: 85000.0, taxable_amount: 85000.0, total_tax_amount: 1275.0, sync_status: "SYNCED", insert_by: "1", update_by: "1", is_active: true, is_deleted: false }
    ]);

    this.inMemoryStores.set("tax_liability_breakdown", [
      { liability_id: "LIAB-001", transaction_id: "TX-2081-0001", jurisdiction_id: "JUR_NP_MUNI", jurisdiction_type: "local", applied_rate_pct: 1.5, taxable_base: 150000.0, tax_amount: 2250.0, is_compounded: false, insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { liability_id: "LIAB-002", transaction_id: "TX-2081-0002", jurisdiction_id: "JUR_NP_MUNI", jurisdiction_type: "local", applied_rate_pct: 1.5, taxable_base: 85000.0, tax_amount: 1275.0, is_compounded: false, insert_by: "1", update_by: "1", is_active: true, is_deleted: false }
    ]);

    this.inMemoryStores.set("tbl_right", [
      { id: 1, right_code: "tbl_user_menu", right_name: "View Users Menu", module_name: "Users", action_type: "menu", insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 2, right_code: "tbl_user_new", right_name: "Create New User", module_name: "Users", action_type: "new", insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 3, right_code: "tbl_user_edit", right_name: "Edit User", module_name: "Users", action_type: "edit", insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 4, right_code: "tbl_user_delete", right_name: "Delete User", module_name: "Users", action_type: "delete", insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 5, right_code: "tbl_land_rate_menu", right_name: "View Land Rates", module_name: "Rates", action_type: "menu", insert_by: "1", update_by: "1", is_active: true, is_deleted: false }
    ]);

    this.inMemoryStores.set("tbl_role_right", [
      { id: 1, role_id: 1, right_id: 1, insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 2, role_id: 1, right_id: 2, insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 3, role_id: 1, right_id: 3, insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 4, role_id: 1, right_id: 4, insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 5, role_id: 1, right_id: 5, insert_by: "1", update_by: "1", is_active: true, is_deleted: false }
    ]);

    this.inMemoryStores.set("tbl_user_role", [
      { id: 1, user_id: 1, role_id: 1, insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 2, user_id: 2, role_id: 2, insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 3, user_id: 3, role_id: 3, insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 4, user_id: 4, role_id: 4, insert_by: "1", update_by: "1", is_active: true, is_deleted: false }
    ]);

    this.inMemoryStores.set("tbl_user_right", [
      { id: 1, user_id: 1, right_id: 1, is_granted: true, insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 2, user_id: 1, right_id: 2, is_granted: true, insert_by: "1", update_by: "1", is_active: true, is_deleted: false }
    ]);

    this.inMemoryStores.set("tbl_user_log", [
      { id: 1, user_id: 1, username_attempt: "superadmin@gtax.enterprise", action_name: "SYSTEM_INITIALIZE", ip_address: "127.0.0.1", details: "Initial system bootstrap", insert_by: "1", update_by: "1", is_active: true, is_deleted: false }
    ]);

    this.inMemoryStores.set("tbl_session_log", []);
  }
}

// Auto-seed in-memory store so data is instantly available even on cold start
TableCacheDbSyncService.seedDefaultInMemoryStores();
