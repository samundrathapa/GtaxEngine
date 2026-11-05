import { IConstructionTypeRecord } from "../../serverside/ConstructionTypes/ConstructionTypesModel.ts";

export interface IConstructionTypesStoreState {
  constructionTypes: IConstructionTypeRecord[];
  selectedType: IConstructionTypeRecord | null;
  comboOptions: Array<{ id: number; name: string; code?: string }>;
  loading: boolean;
  error: string | null;
}

export class ConstructionTypesStore {
  private state: IConstructionTypesStoreState = {
    constructionTypes: [],
    selectedType: null,
    comboOptions: [],
    loading: false,
    error: null,
  };

  private listeners: Array<() => void> = [];

  getState(): IConstructionTypesStoreState {
    return this.state;
  }

  setState(partial: Partial<IConstructionTypesStoreState>) {
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

export const constructionTypesStoreInstance = new ConstructionTypesStore();
