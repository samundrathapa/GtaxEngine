import { userApiServiceInstance } from "../ApiServiceStruct/UserApiService.ts";
import { taxCalcApiServiceInstance } from "../ApiServiceStruct/TaxCalcApiService.ts";
import { jurisdictionApiServiceInstance } from "../ApiServiceStruct/JurisdictionApiService.ts";
import { syncEventApiServiceInstance } from "../ApiServiceStruct/SyncEventApiService.ts";
import { MigrationRunner } from "../DbMigration/MigrationRunner.ts";
import { DbConnects } from "../BaseFrame/db/DbConnects.ts";
import { RedisCacheManager } from "../BaseFrame/cache/RedisCacheManager.ts";

export class DomainRegistry {
  private static isInitialized = false;

  static async initialize() {
    if (this.isInitialized) return;

    // 1. Establish unified database pool
    await DbConnects.openConnection();

    // 2. Run versioned DbMigration audit column checks
    const auditStatus = MigrationRunner.verifyAuditColumnsCompliance();
    if (!auditStatus.compliant) {
      throw new Error("Critical: DbMigration tables missing required BaseFrame audit columns!");
    }

    // 3. Mark initialized
    this.isInitialized = true;
  }

  static getRegisteredServices() {
    return {
      userApi: userApiServiceInstance,
      taxCalcApi: taxCalcApiServiceInstance,
      jurisdictionApi: jurisdictionApiServiceInstance,
      syncEventApi: syncEventApiServiceInstance
    };
  }

  static getSystemTopology() {
    return {
      system: "gtax Enterprise Platform",
      status: "OPERATIONAL",
      baseFrame: {
        controllers: 4,
        services: 4,
        repos: 4,
        dbConnects: DbConnects.getPoolStats(),
        redisCache: RedisCacheManager.getStats(),
        reportEngine: ["PDF", "EXCEL_XML", "HTML", "CSV"],
        rbacEnabled: true
      },
      dbMigration: {
        appliedCount: MigrationRunner.getMigrations().length,
        mandatoryColumnsEnforced: [
          "insert_by",
          "insert_on",
          "update_by",
          "update_on",
          "delete_by",
          "deleted_on",
          "is_active"
        ]
      },
      apiServiceStruct: [
        "/api/v1/users",
        "/api/v1/tax-calc",
        "/api/v1/jurisdictions",
        "/api/v1/sync-events"
      ],
      aiOrchestrator: {
        supportedProviders: ["gemini", "openai", "grok"],
        voiceCommandActive: true
      }
    };
  }
}
