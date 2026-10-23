/**
 * gtax Enterprise - PostgreSQL Connection Pool Manager
 * Connects to the local/remote PostgreSQL database (e.g. gtax_db, gtax_dbtest)
 * Reads credentials dynamically from environment variables (.env / process.env).
 * Fully dynamic: DB_NAME (or db_name) dynamically configures or overrides the database target.
 * Gracefully falls back to in-memory store if database is offline or not configured.
 */

import net from "net";
import pg from "pg";
import type { PoolConfig, Pool as PgPool } from "pg";
const { Pool } = pg;

export interface DatabaseConfigInfo {
  host: string;
  port: number;
  database: string;
  user: string;
  passwordMasked: string;
  ssl: boolean;
  connectionStringMasked: string;
}

/**
 * Fast TCP probe to check if database port is open before attempting pool initialization
 */
function isPortReachable(host: string, port: number, timeoutMs = 800): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    socket.setTimeout(timeoutMs);

    socket.once("connect", () => {
      settled = true;
      socket.destroy();
      resolve(true);
    });

    socket.once("timeout", () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(false);
      }
    });

    socket.once("error", () => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(false);
      }
    });

    try {
      socket.connect(port, host);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Dynamic environment resolver for database configuration.
 * Supports:
 * - Case-insensitive env keys: DB_NAME, db_name, DATABASE_NAME, etc.
 * - Dynamic URL rewriting: If DATABASE_URL is set but DB_NAME is also specified (e.g. gtax_dbtest),
 *   the explicit DB_NAME dynamically replaces the database name in the connection string!
 */
function resolveDynamicConfig() {
  const envDbName = (
    process.env.DB_NAME ||
    process.env.db_name ||
    process.env.DB_DATABASE ||
    process.env.DATABASE_NAME ||
    ""
  ).trim();

  const envUser = (
    process.env.DB_USER ||
    process.env.db_user ||
    process.env.DB_USERNAME ||
    process.env.POSTGRES_USER ||
    ""
  ).trim();

  const envPassword = (
    process.env.DB_PASSWORD ||
    process.env.db_password ||
    process.env.DB_PASS ||
    process.env.POSTGRES_PASSWORD ||
    ""
  ).trim();

  const envHost = (
    process.env.DB_HOST ||
    process.env.db_host ||
    process.env.POSTGRES_HOST ||
    ""
  ).trim();

  const envPort = (
    process.env.DB_PORT ||
    process.env.db_port ||
    process.env.POSTGRES_PORT ||
    ""
  ).trim();

  const envSsl = (
    process.env.DB_SSL ||
    process.env.db_ssl ||
    ""
  ).trim().toLowerCase() === "true";

  const rawUrl = (
    process.env.DATABASE_URL ||
    process.env.database_url ||
    ""
  ).trim();

  let host = envHost || "localhost";
  let port = envPort ? parseInt(envPort, 10) : 5432;
  let database = envDbName || "gtax_db";
  let user = envUser || "gtax_user";
  let password = envPassword || "gtax_password";
  let ssl = envSsl;

  let connectionString = "";

  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      if (parsed.hostname) host = parsed.hostname;
      if (parsed.port) port = parseInt(parsed.port, 10);
      if (parsed.username) user = decodeURIComponent(parsed.username);
      if (parsed.password) password = decodeURIComponent(parsed.password);
      if (parsed.pathname && parsed.pathname.length > 1) {
        database = parsed.pathname.slice(1);
      }

      // Dynamic override: If the user explicitly provided DB_NAME in .env (e.g. gtax_dbtest),
      // it takes precedence over whatever was in the raw DATABASE_URL!
      if (envDbName) {
        database = envDbName;
        parsed.pathname = `/${database}`;
      }
      if (envUser) {
        user = envUser;
        parsed.username = user;
      }
      if (envPassword) {
        password = envPassword;
        parsed.password = password;
      }
      if (envHost) {
        host = envHost;
        parsed.hostname = host;
      }
      if (envPort) {
        port = parseInt(envPort, 10);
        parsed.port = String(port);
      }

      connectionString = parsed.toString();
    } catch {
      connectionString = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
    }
  } else {
    connectionString = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }

  const maskedUrl = connectionString.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:******@");

  return {
    host,
    port,
    database,
    user,
    password,
    ssl,
    connectionString,
    maskedUrl,
  };
}

export class PostgresPoolManager {
  private static pool: PgPool | null = null;
  private static isConnected: boolean = false;
  private static initialized: boolean = false;
  private static noticeMessage: string = "In-memory simulation store initialized.";
  private static activeDatabase: string = "gtax_db";
  private static activeUser: string = "gtax_user";

  /**
   * Resolves connection configuration dynamically from environment variables
   */
  public static getConfig(): DatabaseConfigInfo {
    const resolved = resolveDynamicConfig();
    return {
      host: resolved.host,
      port: resolved.port,
      database: this.isConnected ? this.activeDatabase : resolved.database,
      user: this.isConnected ? this.activeUser : resolved.user,
      passwordMasked: "******",
      ssl: resolved.ssl,
      connectionStringMasked: resolved.maskedUrl,
    };
  }

  /**
   * Initializes the PostgreSQL connection pool dynamically
   * @param force - If true, re-initializes even if already connected
   */
  public static async initialize(force = false): Promise<boolean> {
    if (this.initialized && !force) {
      return this.isConnected;
    }

    const resolved = resolveDynamicConfig();
    const { host, port, database, user, password, ssl, connectionString } = resolved;

    // Fast check: If pointing to localhost / 127.0.0.1 probe port first
    const isLocalhostTarget = host === "localhost" || host === "127.0.0.1" || host === "::1";
    if (isLocalhostTarget) {
      const portOpen = await isPortReachable(host, port, 500);
      if (!portOpen) {
        this.isConnected = false;
        this.initialized = true;
        this.noticeMessage = `PostgreSQL port ${port} on ${host} is inactive. System operating in in-memory simulation mode.`;
        console.log(`[gtax:Database] ${this.noticeMessage}`);
        return false;
      }
    } else {
      const reachable = await isPortReachable(host, port, 1200);
      if (!reachable) {
        this.isConnected = false;
        this.initialized = true;
        this.noticeMessage = `Database target ${host}:${port} is currently unreachable. System operating in in-memory simulation mode.`;
        console.log(`[gtax:Database] ${this.noticeMessage}`);
        return false;
      }
    }

    const poolConfig: PoolConfig = {
      host,
      port,
      database,
      user,
      password,
      ssl: ssl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3500,
    };

    try {
      if (this.pool) {
        await this.pool.end().catch(() => {});
        this.pool = null;
      }

      this.pool = new Pool(poolConfig);

      // Register silent error listener to prevent unhandled pool error events
      this.pool.on("error", () => {
        // Handled silently; queries fall back to in-memory store
      });

      // Verify connection with query
      const client = await this.pool.connect();
      const res = await client.query("SELECT current_database(), current_user, version()");
      client.release();

      this.activeDatabase = res.rows[0].current_database || database;
      this.activeUser = res.rows[0].current_user || user;
      this.isConnected = true;
      this.initialized = true;
      this.noticeMessage = `Connected to PostgreSQL database '${this.activeDatabase}' as '${this.activeUser}'`;
      console.log(`[gtax:Postgres] ${this.noticeMessage}`);

      // Automatically ensure core schema, default seed data, and synced sequences in the target database
      await this.ensureCoreDatabase();

      return true;
    } catch {
      if (this.pool) {
        await this.pool.end().catch(() => {});
        this.pool = null;
      }
      this.isConnected = false;
      this.initialized = true;
      this.noticeMessage = "PostgreSQL service offline or not configured. System operating in in-memory simulation mode.";
      console.log(`[gtax:Database] ${this.noticeMessage}`);
      return false;
    }
  }

  /**
   * Ensures all 26 municipal and tax tables, default seed data, and synced sequences exist in the connected database
   */
  public static async ensureCoreDatabase(): Promise<void> {
    if (!this.isConnected || !this.pool) return;
    const { DatabaseSchemaBootstrap } = await import("./databaseSchemaBootstrap.ts");
    await DatabaseSchemaBootstrap.bootstrapAllTables();
  }

  /**
   * Fetches a clean snapshot of all 26 tables directly from PostgreSQL database for Redis caching
   */
  public static async getAllTablesSnapshot(): Promise<Record<string, any[]>> {
    const tableNames = [
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
    ];

    const snapshot: Record<string, any[]> = {};
    if (!this.isConnected || !this.pool) return snapshot;

    for (const tbl of tableNames) {
      try {
        const rows = await this.query(`SELECT * FROM ${tbl} ORDER BY 1 ASC;`);
        snapshot[tbl] = rows;
      } catch {
        try {
          const rows = await this.query(`SELECT * FROM ${tbl};`);
          snapshot[tbl] = rows;
        } catch {
          snapshot[tbl] = [];
        }
      }
    }
    return snapshot;
  }


  public static async ensureDefaultSeed(): Promise<void> {
    await this.ensureCoreDatabase();
  }


  /**
   * Execute raw SQL query with parameter binding if live pool is active
   */
  public static async query<T = unknown>(text: string, params: unknown[] = []): Promise<T[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.pool || !this.isConnected) {
      return [];
    }

    try {
      const result = await this.pool.query(text, params);
      return result.rows as T[];
    } catch {
      // Return empty array on failure
      return [];
    }
  }

  /**
   * Health and status inspector
   */
  public static getStatus() {
    const config = this.getConfig();
    return {
      connected: this.isConnected,
      mode: this.isConnected ? "POSTGRESQL_LIVE" : "IN_MEMORY_SIMULATION",
      config: {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.passwordMasked,
        connectionString: config.connectionStringMasked,
      },
      message: this.noticeMessage,
      lastError: null,
      setupHelp: {
        sqlCreateScript: "database/01_create_database_and_user.sql",
        schemaInitScript: "database/02_init_gtax_schema.sql",
        allInOneScript: "database/setup_gtax_db.sql",
        navicatScript: "database/navicat_setup_gtax_db.sql",
        migrationBatchScript: "run_migrations.bat",
        docsFile: "docs/DATABASE_CONFIGURATION.md",
      },
    };
  }
}
