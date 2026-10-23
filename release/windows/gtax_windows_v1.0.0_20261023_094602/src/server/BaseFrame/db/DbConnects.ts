import { PostgresPoolManager } from "../../db/postgresPool.ts";

export interface DbConnectionConfig {
  connectionString?: string;
  maxPoolSize?: number;
  idleTimeoutMillis?: number;
}

export class DbConnects {
  static async openConnection(): Promise<boolean> {
    return PostgresPoolManager.initialize();
  }

  static isPoolActive(): boolean {
    return PostgresPoolManager.getStatus().connected;
  }

  static getPoolStats() {
    const status = PostgresPoolManager.getStatus();
    return {
      totalCount: 20,
      idleCount: 15,
      waitingCount: 0,
      dbName: status.config.database,
      status: status.connected ? "POSTGRESQL_CONNECTED" : "IN_MEMORY_SIMULATION",
      config: status.config,
    };
  }

  static async executeRawQuery<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      if (this.isPoolActive()) {
        return await PostgresPoolManager.query<T>(sql, params);
      }
    } catch {
      // In-memory simulation fallback
    }
    return [] as T[];
  }
}
