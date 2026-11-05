import { IFiscalYearRecord } from "../../serverside/FiscalYear/FiscalYearModel.ts";

export interface IFiscalYearStoreState {
  fiscalYears: IFiscalYearRecord[];
  selectedFiscalYear: IFiscalYearRecord | null;
  comboOptions: Array<{ id: number; name: string; code?: string }>;
  loading: boolean;
  error: string | null;
}

export class FiscalYearStore {
  private state: IFiscalYearStoreState = {
    fiscalYears: [],
    selectedFiscalYear: null,
    comboOptions: [],
    loading: false,
    error: null,
  };

  private listeners: Array<() => void> = [];

  getState(): IFiscalYearStoreState {
    return this.state;
  }

  setState(partial: Partial<IFiscalYearStoreState>) {
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

export const fiscalYearStoreInstance = new FiscalYearStore();
