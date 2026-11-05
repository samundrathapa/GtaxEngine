import { TaxpayerRepo } from "./TaxpayerRepo.ts";
import { ITaxpayerRecord } from "./TaxpayerModel.ts";

export class TaxpayerService {
  public repo: TaxpayerRepo;

  constructor() {
    this.repo = new TaxpayerRepo();
  }

  async getSearch(query?: string): Promise<ITaxpayerRecord[]> {
    return await this.repo.GetSearchTemplate(query);
  }

  async getItem(id: string | number): Promise<ITaxpayerRecord | null> {
    return await this.repo.GetItemTemplate(id);
  }

  async getCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    return await this.repo.GetComboTemplate();
  }

  async create(record: Partial<ITaxpayerRecord>, userId: string = "1"): Promise<ITaxpayerRecord> {
    return await this.repo.insert(record, userId);
  }

  async update(id: string | number, record: Partial<ITaxpayerRecord>, userId: string = "1"): Promise<ITaxpayerRecord | null> {
    return await this.repo.update(id, record, userId);
  }

  async delete(id: string | number, userId: string = "1"): Promise<boolean> {
    return await this.repo.delete(id, userId);
  }
}

export const taxpayerServiceInstance = new TaxpayerService();
