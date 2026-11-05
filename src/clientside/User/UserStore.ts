import { IUserRecord } from "../../serverside/User/UserModel.ts";

export interface IUserStoreState {
  users: IUserRecord[];
  selectedUser: IUserRecord | null;
  comboOptions: Array<{ id: number; name: string; code?: string }>;
  loading: boolean;
  error: string | null;
}

export class UserStore {
  private state: IUserStoreState = {
    users: [],
    selectedUser: null,
    comboOptions: [],
    loading: false,
    error: null,
  };

  private listeners: Array<() => void> = [];

  getState(): IUserStoreState {
    return this.state;
  }

  setState(partial: Partial<IUserStoreState>) {
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

export const userStoreInstance = new UserStore();
