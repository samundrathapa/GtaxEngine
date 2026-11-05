import { ICalculationRecord } from "../../serverside/Calculation/CalculationModel.ts";

export interface ICalculationStoreState {
  calculations: ICalculationRecord[];
  selectedCalculation: ICalculationRecord | null;
  comboOptions: Array<{ id: number; name: string; code?: string }>;
  loading: boolean;
  error: string | null;
}

export class CalculationStore {
  private state: ICalculationStoreState = {
    calculations: [],
    selectedCalculation: null,
    comboOptions: [],
    loading: false,
    error: null,
  };

  private listeners: Array<() => void> = [];

  getState(): ICalculationStoreState {
    return this.state;
  }

  setState(partial: Partial<ICalculationStoreState>) {
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

export const calculationStoreInstance = new CalculationStore();
