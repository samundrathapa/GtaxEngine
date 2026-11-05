import { ICompanyRecord } from "../../serverside/Company/CompanyModel.ts";

export interface ICompanyStoreState {
  companies: ICompanyRecord[];
  selectedCompany: ICompanyRecord | null;
  comboOptions: Array<{ id: number; name: string; code?: string }>;
  loading: boolean;
  error: string | null;
}

export class CompanyStore {
  private state: ICompanyStoreState = {
    companies: [],
    selectedCompany: null,
    comboOptions: [],
    loading: false,
    error: null,
  };

  private listeners: Array<() => void> = [];

  getState(): ICompanyStoreState {
    return this.state;
  }

  setState(partial: Partial<ICompanyStoreState>) {
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

export const companyStoreInstance = new CompanyStore();
