import { IAuditLogRecord } from "../../serverside/AuditLogs/AuditLogsModel.ts";

export interface IAuditLogsStoreState {
  logs: IAuditLogRecord[];
  selectedLog: IAuditLogRecord | null;
  comboOptions: Array<{ id: number; name: string; code?: string }>;
  loading: boolean;
  error: string | null;
}

export class AuditLogsStore {
  private state: IAuditLogsStoreState = {
    logs: [],
    selectedLog: null,
    comboOptions: [],
    loading: false,
    error: null,
  };

  private listeners: Array<() => void> = [];

  getState(): IAuditLogsStoreState {
    return this.state;
  }

  setState(partial: Partial<IAuditLogsStoreState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const auditLogsStoreInstance = new AuditLogsStore();
