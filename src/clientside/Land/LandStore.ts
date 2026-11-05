import { ILandRecord } from "../../serverside/Land/LandModel.ts";

export interface ILandStoreState {
  lands: ILandRecord[];
  selectedLand: ILandRecord | null;
  comboOptions: Array<{ id: number; name: string; code?: string }>;
  loading: boolean;
  error: string | null;
}

export class LandStore {
  private state: ILandStoreState = {
    lands: [],
    selectedLand: null,
    comboOptions: [],
    loading: false,
    error: null,
  };

  private listeners: Array<() => void> = [];

  getState(): ILandStoreState {
    return this.state;
  }

  setState(partial: Partial<ILandStoreState>) {
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

export const landStoreInstance = new LandStore();
