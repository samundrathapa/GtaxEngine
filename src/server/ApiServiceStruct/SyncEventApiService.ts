import { BaseRepo } from "../BaseFrame/repo/BaseRepo.ts";
import { BaseService } from "../BaseFrame/services/BaseService.ts";
import { BaseCrudController } from "../BaseFrame/controller/BaseCrudController.ts";

export interface SyncEventRecord {
  id?: string;
  event_id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_version: number;
  event_type: string;
  source_service: string;
  target_jurisdictions: string[];
  payload: Record<string, any>;
  checksum_hash: string;
  status: "QUEUED" | "BROADCAST" | "DELIVERED" | "RESOLVED";
}

export class SyncEventRepo extends BaseRepo<SyncEventRecord> {
  constructor() {
    super("realtime_sync_events", "event_id");
    // Seed initial sync events
    this.insert(
      {
        event_id: "EVT_CDC_INIT_001",
        aggregate_type: "tax_liability",
        aggregate_id: "TX-2026-8801",
        event_version: 1,
        event_type: "REPLICATION_COMPLETED",
        source_service: "gtax-tax-engine",
        target_jurisdictions: ["US-FED", "US-CA", "SF-COUNTY-DIST"],
        payload: { gross: 150000, tax: 13875, nexusChecked: true },
        checksum_hash: "sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
        status: "DELIVERED"
      },
      "SYSTEM_BOOT"
    );
    this.insert(
      {
        event_id: "EVT_CDC_INIT_002",
        aggregate_type: "rate_update",
        aggregate_id: "JUR-EU-DE-VAT",
        event_version: 2,
        event_type: "STATUTORY_RATE_SYNCHRONIZED",
        source_service: "gtax-rules-registry",
        target_jurisdictions: ["DE-BZST-VAT"],
        payload: { standard_rate: 19.0, reduced_rate: 7.0 },
        checksum_hash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        status: "DELIVERED"
      },
      "SYSTEM_BOOT"
    );
  }
}

export class SyncEventService extends BaseService<SyncEventRecord> {
  constructor() {
    super(new SyncEventRepo(), "gtax:sync_events");
  }
}

export class SyncEventApiService extends BaseCrudController<SyncEventRecord> {
  constructor() {
    super("/api/v1/sync-events", new SyncEventService(), ["admin", "tax_manager", "tax_analyst"]);
  }
}

export const syncEventApiServiceInstance = new SyncEventApiService();
