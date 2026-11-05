import { ITaxpayerRecord } from "../../serverside/Taxpayer/TaxpayerModel.ts";

export interface ITaxpayerStoreState {
  taxpayers: ITaxpayerRecord[];
  selectedTaxpayer: ITaxpayerRecord | null;
  comboOptions: Array<{ id: number; name: string; code?: string }>;
  loading: boolean;
  error: string | null;
}

export class TaxpayerStore {
  private state: ITaxpayerStoreState = {
    taxpayers: [],
    selectedTaxpayer: null,
    comboOptions: [],
    loading: false,
    error: null,
  };

  private listeners: Array<() => void> = [];

  getState(): ITaxpayerStoreState {
    return this.state;
  }

  setState(partial: Partial<ITaxpayerStoreState>) {
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

export const taxpayerStoreInstance = new TaxpayerStore();
