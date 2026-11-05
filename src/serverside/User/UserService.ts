import { UserRepo } from "./UserRepo.ts";
import { IUserRecord } from "./UserModel.ts";

export class UserService {
  public repo: UserRepo;

  constructor() {
    this.repo = new UserRepo();
  }

  async getSearch(query?: string): Promise<IUserRecord[]> {
    return await this.repo.GetSearchTemplate(query);
  }

  async getItem(id: string | number): Promise<IUserRecord | null> {
    return await this.repo.GetItemTemplate(id);
  }

  async getCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    return await this.repo.GetComboTemplate();
  }

  async create(record: Partial<IUserRecord>, userId: string = "1"): Promise<IUserRecord> {
    return await this.repo.insert(record, userId);
  }

  async update(id: string | number, record: Partial<IUserRecord>, userId: string = "1"): Promise<IUserRecord | null> {
    return await this.repo.update(id, record, userId);
  }

  async delete(id: string | number, userId: string = "1"): Promise<boolean> {
    return await this.repo.delete(id, userId);
  }
}

export const userServiceInstance = new UserService();
