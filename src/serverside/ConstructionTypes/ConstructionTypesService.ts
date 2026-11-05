import { ConstructionTypesRepo } from "./ConstructionTypesRepo.ts";
import { IConstructionTypeRecord } from "./ConstructionTypesModel.ts";

export class ConstructionTypesService {
  public repo: ConstructionTypesRepo;

  constructor() {
    this.repo = new ConstructionTypesRepo();
  }

  async getSearch(query?: string): Promise<IConstructionTypeRecord[]> {
    return await this.repo.GetSearchTemplate(query);
  }

  async getItem(id: string | number): Promise<IConstructionTypeRecord | null> {
    return await this.repo.GetItemTemplate(id);
  }

  async getCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    return await this.repo.GetComboTemplate();
  }

  async create(record: Partial<IConstructionTypeRecord>, userId: string = "1"): Promise<IConstructionTypeRecord> {
    return await this.repo.insert(record, userId);
  }

  async update(id: string | number, record: Partial<IConstructionTypeRecord>, userId: string = "1"): Promise<IConstructionTypeRecord | null> {
    return await this.repo.update(id, record, userId);
  }

  async delete(id: string | number, userId: string = "1"): Promise<boolean> {
    return await this.repo.delete(id, userId);
  }
}

export const constructionTypesServiceInstance = new ConstructionTypesService();
