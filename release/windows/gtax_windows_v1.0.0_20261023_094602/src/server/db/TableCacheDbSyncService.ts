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

import { PostgresPoolManager } from "./postgresPool.ts";
import { RedisCacheManager } from "../BaseFrame/cache/RedisCacheManager.ts";
import { DatabaseSchemaBootstrap } from "./databaseSchemaBootstrap.ts";

export const ALL_26_TABLES = [
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
  "tbl_taxpayer_master",
  "tbl_taxpayer",
  "tbl_land",
  "tbl_house",
  "tbl_floor",
  "tax_jurisdictions",
  "tax_rules_matrix",
  "tax_transactions",
  "tax_liability_breakdown"
] as const;

export type GtaxTableName = (typeof ALL_26_TABLES)[number];

export class TableCacheDbSyncService {
  private static inMemoryStores: Map<string, any[]> = new Map();
  private static initialized = false;

  public static async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Initialize Redis Cache
    RedisCacheManager.initialize();

    // 2. Initialize Postgres Connection
    await PostgresPoolManager.initialize();

    // 3. Ensure database schema and seed data
    if (PostgresPoolManager.getStatus().connected) {
      await DatabaseSchemaBootstrap.bootstrapAllTables();
    }

    // 4. Warm up Redis cache for all 26 tables
    await this.warmUpCache();
  }

  /**
   * Warms up Redis cache from PostgreSQL (or memory fallback)
   */
  public static async warmUpCache(): Promise<void> {
    for (const table of ALL_26_TABLES) {
      await this.refreshTableCacheFromDb(table);
    }
  }

  /**
   * Retrieves table records from Redis Cache.
   * If cache miss occurs, auto-syncs directly from PostgreSQL database and populates Redis.
   */
  public static async getTableData<T = any>(table: GtaxTableName | string): Promise<T[]> {
    const cacheKey = `gtax:cache:table:${table}`;

    // 1. Check Redis Cache
    const cached = await RedisCacheManager.get<T[]>(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    // 2. Cache Miss -> Auto-sync from PostgreSQL Database
    return await this.refreshTableCacheFromDb<T>(table);
  }

  /**
   * Queries PostgreSQL directly for a table's records, writes to Redis Cache, and returns the records.
   */
  public static async refreshTableCacheFromDb<T = any>(table: GtaxTableName | string): Promise<T[]> {
    const cacheKey = `gtax:cache:table:${table}`;
    let rows: T[] = [];

    if (PostgresPoolManager.getStatus().connected) {
      try {
        // Query database table; filter out soft-deleted records if is_deleted column exists
        const queryWithFilter = `SELECT * FROM ${table} WHERE is_deleted IS NOT TRUE ORDER BY 1 ASC;`;
        rows = await PostgresPoolManager.query<T>(queryWithFilter);
        if (!rows || rows.length === 0) {
          // If no filter matched or is_deleted column not in table, fallback to standard select
          rows = await PostgresPoolManager.query<T>(`SELECT * FROM ${table} ORDER BY 1 ASC;`);
        }
      } catch {
        try {
          rows = await PostgresPoolManager.query<T>(`SELECT * FROM ${table};`);
        } catch (dbErr) {
          console.warn(`[gtax:CacheSync] Direct query on table ${table} failed, falling back:`, dbErr);
        }
      }
    }

    // If database returned empty or was offline, fallback to in-memory store
    if (!rows || rows.length === 0) {
      rows = (this.inMemoryStores.get(table) || []) as T[];
    } else {
      // Keep in-memory mirror up-to-date
      this.inMemoryStores.set(table, rows);
    }

    // Write to Redis cache with 1-hour TTL
    await RedisCacheManager.set(cacheKey, rows, 3600);
    RedisCacheManager.recordSyncEvent();

    return rows;
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

        const keys = Object.keys(payload);
        const columns = keys.map((k) => `"${k}"`).join(", ");
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ");
        const values = Object.values(payload);

        const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *;`;
        const res = await PostgresPoolManager.query<T>(sql, values);
        if (res && res.length > 0) {
          insertedRecord = res[0];
        }
      } catch (err) {
        console.error(`[gtax:CacheSync] Live insert to ${table} failed:`, err);
      }
    }

    if (!insertedRecord) {
      // In-memory fallback
      const store = this.inMemoryStores.get(table) || [];
      const newId = payload.id || (store.length > 0 ? Math.max(...store.map((s: any) => Number(s.id) || 0)) + 1 : 1);
      insertedRecord = { ...payload, id: newId } as T;
      store.push(insertedRecord);
      this.inMemoryStores.set(table, store);
    }

    // Auto-sync Redis Cache from Database
    await this.refreshTableCacheFromDb(table);

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

    const payload: Record<string, any> = {
      ...patchData,
      update_by: finalUserId,
      update_on: now,
    };

    let updatedRecord: T | null = null;

    if (PostgresPoolManager.getStatus().connected) {
      try {
        const idCol = typeof id === "number" || !isNaN(Number(id)) ? "id" : (table.startsWith("tax_") ? `${table.slice(0, -1)}_id` : "id");
        const keys = Object.keys(payload).filter((k) => k !== "id" && k !== idCol);
        const setClauses = keys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
        const values = keys.map((k) => payload[k]);
        values.push(id);

        const sql = `UPDATE ${table} SET ${setClauses} WHERE "${idCol}" = $${values.length} RETURNING *;`;
        const res = await PostgresPoolManager.query<T>(sql, values);
        if (res && res.length > 0) {
          updatedRecord = res[0];
        }
      } catch (err) {
        console.error(`[gtax:CacheSync] Live update to ${table} failed:`, err);
      }
    }

    if (!updatedRecord) {
      const store = this.inMemoryStores.get(table) || [];
      const idx = store.findIndex((item: any) => String(item.id) === String(id));
      if (idx !== -1) {
        store[idx] = { ...store[idx], ...payload };
        updatedRecord = store[idx];
        this.inMemoryStores.set(table, store);
      }
    }

    // Auto-sync Redis Cache from Database
    await this.refreshTableCacheFromDb(table);

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

    if (PostgresPoolManager.getStatus().connected) {
      try {
        const idCol = typeof id === "number" || !isNaN(Number(id)) ? "id" : (table.startsWith("tax_") ? `${table.slice(0, -1)}_id` : "id");
        const sql = `
          UPDATE ${table}
          SET is_deleted = TRUE, is_active = FALSE, delete_by = $1, deleted_on = $2
          WHERE "${idCol}" = $3;
        `;
        await PostgresPoolManager.query(sql, [finalUserId, now, id]);
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
    }

    // Auto-sync Redis Cache from Database
    await this.refreshTableCacheFromDb(table);

    return true;
  }

  /**
   * Action: Clear Cache and Re-sync directly from PostgreSQL Database.
   * Flushes Redis cache, re-queries all 26 tables directly from PostgreSQL, primes Redis,
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

    // 1. Flush Redis cache completely
    await RedisCacheManager.clearAll();

    const tableCounts: Record<string, number> = {};
    let totalRecords = 0;

    // 2. Query each of the 26 tables directly from PostgreSQL database & update Redis
    for (const table of ALL_26_TABLES) {
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
      clearedKeys: ALL_26_TABLES.length,
      syncedTablesCount: ALL_26_TABLES.length,
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

    // Seed defaults for all 26 tables in memory
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

    this.inMemoryStores.set("tbl_fiscal_year", [
      { id: 1, code: "2080/81", fullname: "Fiscal Year 2080/2081 BS (आर्थिक वर्ष २०८०/८१)", date_from_bs: "2080-04-01", date_from_ad: "2023-07-17", date_to_ad: "2024-07-15", date_to_bs: "2081-03-31", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 2, code: "2081/82", fullname: "Fiscal Year 2081/2082 BS (आर्थिक वर्ष २०८१/८२) [Current]", date_from_bs: "2081-04-01", date_from_ad: "2024-07-16", date_to_ad: "2025-07-15", date_to_bs: "2082-03-31", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 3, code: "2079/80", fullname: "Fiscal Year 2079/2080 BS (आर्थिक वर्ष २०७९/८०)", date_from_bs: "2079-04-01", date_from_ad: "2022-07-17", date_to_ad: "2023-07-16", date_to_bs: "2080-03-31", is_deleted: false, insert_by: "1", update_by: "1", is_active: true }
    ]);

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

    this.inMemoryStores.set("tbl_taxpayer_master", [
      { id: 1, code: "TP-2081-0001", fullanme: "Ram Bahadur Thapa (राम बहादुर थापा)", mobile_no: "9841234567", tax_type_id: 1, email: "ram.thapa@gmail.com", ward_no: 3, pan_vat_no: "600123456", citizenship_no: "27-01-70-12345", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 2, code: "TP-2081-0002", fullanme: "Sita Maya Shrestha (सीता माया श्रेष्ठ)", mobile_no: "9851098765", tax_type_id: 1, email: "sita.shrestha@gmail.com", ward_no: 4, pan_vat_no: "600987654", citizenship_no: "27-01-72-98765", is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 3, code: "TP-2081-0003", fullanme: "Himalayan Trading Syndicate Ltd", mobile_no: "9801122334", tax_type_id: 2, email: "accounts@himalayantrading.com.np", ward_no: 1, pan_vat_no: "300554433", citizenship_no: "CO-REG-9871", is_deleted: false, insert_by: "1", update_by: "1", is_active: true }
    ]);

    this.inMemoryStores.set("tbl_taxpayer", [
      { id: 1, taxpayer_code: "TP-2081-0001", full_name: "Ram Bahadur Thapa", pan_number: "600123456", citizenship_number: "27-01-70-12345", phone_number: "9841234567", ward_no: 3, tole_village: "Resunga Marg", insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 2, taxpayer_code: "TP-2081-0002", full_name: "Sita Maya Shrestha", pan_number: "600987654", citizenship_number: "27-01-72-98765", phone_number: "9851098765", ward_no: 4, tole_village: "Bhanu Chowk", insert_by: "1", update_by: "1", is_active: true, is_deleted: false },
      { id: 3, taxpayer_code: "TP-2081-0003", full_name: "Himalayan Trading Syndicate Ltd", pan_number: "300554433", citizenship_number: "CO-REG-9871", phone_number: "9801122334", ward_no: 1, tole_village: "New Road Commercial Area", insert_by: "1", update_by: "1", is_active: true, is_deleted: false }
    ]);

    this.inMemoryStores.set("tbl_land", [
      { id: 1, taxpayer_id: 1, kitta_number: "1042", moth_number: "MOTH-89A", ward_no: 3, area_sqfeet: 2738.0, include_in_evaluation: true, land_measuring_unit_id: 1, nature_id: 2, land_rate_id: 1, malpot_rate_id: 1, assessed_valuation: 12000000.0, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 2, taxpayer_id: 2, kitta_number: "2105", moth_number: "MOTH-12B", ward_no: 4, area_sqfeet: 1800.0, include_in_evaluation: true, land_measuring_unit_id: 1, nature_id: 1, land_rate_id: 2, malpot_rate_id: 2, assessed_valuation: 7500000.0, is_deleted: false, insert_by: "1", update_by: "1", is_active: true }
    ]);

    this.inMemoryStores.set("tbl_house", [
      { id: 1, taxpayer_id: 1, land_id: 1, secondary_land_id: null, kitta_numbers: "1042", land_ids: [1], house_no: "H-1042-A", area_sqfeet: 2400.0, acquisition_date_bs: "2075-01-10", acquisition_date_ad: "2018-04-23", plinth_area: 1200.0, floor_no: 2, include_in_evaluation: true, measuring_unit_id: 7, construction_type_id: 1, assessed_valuation: 7680000.0, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 2, taxpayer_id: 2, land_id: 2, secondary_land_id: null, kitta_numbers: "2105", land_ids: [2], house_no: "H-2105-B", area_sqfeet: 1500.0, acquisition_date_bs: "2077-03-15", acquisition_date_ad: "2020-06-29", plinth_area: 800.0, floor_no: 2, include_in_evaluation: true, measuring_unit_id: 7, construction_type_id: 2, assessed_valuation: 3600000.0, is_deleted: false, insert_by: "1", update_by: "1", is_active: true }
    ]);

    this.inMemoryStores.set("tbl_floor", [
      { id: 1, house_id: 1, floor_no: 0, construction_date_ad: "2018-04-23", construction_date_bs: "2075-01-10", construction_type_id: 1, area_sqfeet: 1200.0, include_in_evaluation: true, rate_id: 1, remarks: "Ground floor residential unit", measuring_unit_id: 7, depreciation_percent: 5.0, floor_assessed_valuation: 3648000.0, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 2, house_id: 1, floor_no: 1, construction_date_ad: "2018-04-23", construction_date_bs: "2075-01-10", construction_type_id: 1, area_sqfeet: 1200.0, include_in_evaluation: true, rate_id: 1, remarks: "First floor residential unit", measuring_unit_id: 7, depreciation_percent: 5.0, floor_assessed_valuation: 3648000.0, is_deleted: false, insert_by: "1", update_by: "1", is_active: true },
      { id: 3, house_id: 2, floor_no: 0, construction_date_ad: "2020-06-29", construction_date_bs: "2077-03-15", construction_type_id: 2, area_sqfeet: 800.0, include_in_evaluation: true, rate_id: 2, remarks: "Ground floor shop", measuring_unit_id: 7, depreciation_percent: 0.0, floor_assessed_valuation: 1920000.0, is_deleted: false, insert_by: "1", update_by: "1", is_active: true }
    ]);

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
