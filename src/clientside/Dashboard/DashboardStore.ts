import { IDashboardRecord } from "../../serverside/Dashboard/DashboardModel.ts";

export interface IDashboardStoreState {
  metrics: IDashboardRecord | null;
  loading: boolean;
  error: string | null;
}

export class DashboardStore {
  private state: IDashboardStoreState = {
    metrics: null,
    loading: false,
    error: null,
  };

  private listeners: Array<() => void> = [];

  getState(): IDashboardStoreState {
    return this.state;
  }

  setState(partial: Partial<IDashboardStoreState>) {
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

export const dashboardStoreInstance = new DashboardStore();
