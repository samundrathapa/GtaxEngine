import { LandNatureRepo } from "./LandNatureRepo.ts";
import { ILandNatureRecord } from "./LandNatureModel.ts";

export class LandNatureService {
  public repo: LandNatureRepo;

  constructor() {
    this.repo = new LandNatureRepo();
  }

  async getSearch(query?: string): Promise<ILandNatureRecord[]> {
    return await this.repo.GetSearchTemplate(query);
  }

  async getItem(id: string | number): Promise<ILandNatureRecord | null> {
    return await this.repo.GetItemTemplate(id);
  }

  async getCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    return await this.repo.GetComboTemplate();
  }

  async create(record: Partial<ILandNatureRecord>, userId: string = "1"): Promise<ILandNatureRecord> {
    return await this.repo.insert(record, userId);
  }

  async update(id: string | number, record: Partial<ILandNatureRecord>, userId: string = "1"): Promise<ILandNatureRecord | null> {
    return await this.repo.update(id, record, userId);
  }

  async delete(id: string | number, userId: string = "1"): Promise<boolean> {
    return await this.repo.delete(id, userId);
  }
}

export const landNatureServiceInstance = new LandNatureService();
