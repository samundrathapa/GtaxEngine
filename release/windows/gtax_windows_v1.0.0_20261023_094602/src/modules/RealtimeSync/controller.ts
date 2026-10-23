import { ApiController } from "../../api/controller.ts";
import { SyncEventRecord } from "../../server/ApiServiceStruct/SyncEventApiService.ts";

export class RealtimeSyncController {
  static async fetchSyncEvents(): Promise<SyncEventRecord[]> {
    const res = await ApiController.getSyncEvents();
    if (res.success && res.data?.items) {
      return res.data.items as SyncEventRecord[];
    }
    return [];
  }

  static async broadcastSync(aggregateId: string): Promise<{ success: boolean; message: string }> {
    const res = await ApiController.broadcastSync(aggregateId, {
      initiated_by: "manual_console",
      target_systems: ["KAFKA_CLUSTER", "POSTGRES_CDC", "REDIS_REPLICAS"]
    });
    return {
      success: res.success,
      message: res.message || "Sync broadcast dispatched"
    };
  }
}
