import { ILandNatureRecord } from "../../serverside/LandNature/LandNatureModel.ts";

export interface ILandNatureStoreState {
  landNatures: ILandNatureRecord[];
  selectedNature: ILandNatureRecord | null;
  comboOptions: Array<{ id: number; name: string; code?: string }>;
  loading: boolean;
  error: string | null;
}

export class LandNatureStore {
  private state: ILandNatureStoreState = {
    landNatures: [],
    selectedNature: null,
    comboOptions: [],
    loading: false,
    error: null,
  };

  private listeners: Array<() => void> = [];

  getState(): ILandNatureStoreState {
    return this.state;
  }

  setState(partial: Partial<ILandNatureStoreState>) {
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

export const landNatureStoreInstance = new LandNatureStore();
