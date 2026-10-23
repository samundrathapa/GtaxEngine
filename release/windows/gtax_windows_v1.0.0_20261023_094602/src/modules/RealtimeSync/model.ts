import { SyncEventRecord } from "../../server/ApiServiceStruct/SyncEventApiService.ts";

export interface SyncNodeTelemetry {
  serviceId: string;
  region: string;
  status: "ONLINE" | "SYNCHRONIZING" | "STANDBY";
  latencyMs: number;
  lastSyncTimestamp: string;
  eventSequenceNumber: number;
}

export const initialNodeTelemetry: SyncNodeTelemetry[] = [
  {
    serviceId: "gtax-core-engine-us-east",
    region: "us-east1 (Primary Coordinator)",
    status: "ONLINE",
    latencyMs: 12,
    lastSyncTimestamp: "Just now",
    eventSequenceNumber: 84920
  },
  {
    serviceId: "gtax-tax-rules-eu-central",
    region: "europe-west3 (Frankfurt)",
    status: "ONLINE",
    latencyMs: 38,
    lastSyncTimestamp: "1s ago",
    eventSequenceNumber: 84919
  },
  {
    serviceId: "gtax-crossborder-asia",
    region: "asia-northeast1 (Tokyo)",
    status: "ONLINE",
    latencyMs: 64,
    lastSyncTimestamp: "2s ago",
    eventSequenceNumber: 84918
  },
  {
    serviceId: "gtax-audit-ledger-replica",
    region: "us-central1 (Immutable Vault)",
    status: "ONLINE",
    latencyMs: 18,
    lastSyncTimestamp: "Just now",
    eventSequenceNumber: 84920
  }
];
