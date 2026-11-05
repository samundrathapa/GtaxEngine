import { IMeasurementUnitRecord } from "../../serverside/MeasurementUnit/MeasurementUnitModel.ts";

export interface IMeasurementUnitStoreState {
  units: IMeasurementUnitRecord[];
  selectedUnit: IMeasurementUnitRecord | null;
  comboOptions: Array<{ id: number; name: string; code?: string }>;
  loading: boolean;
  error: string | null;
}

export class MeasurementUnitStore {
  private state: IMeasurementUnitStoreState = {
    units: [],
    selectedUnit: null,
    comboOptions: [],
    loading: false,
    error: null,
  };

  private listeners: Array<() => void> = [];

  getState(): IMeasurementUnitStoreState {
    return this.state;
  }

  setState(partial: Partial<IMeasurementUnitStoreState>) {
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

export const measurementUnitStoreInstance = new MeasurementUnitStore();
