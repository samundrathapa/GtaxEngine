import { FiscalYearRepo } from "./FiscalYearRepo.ts";
import { IFiscalYearRecord } from "./FiscalYearModel.ts";

export class FiscalYearService {
  public repo: FiscalYearRepo;

  constructor() {
    this.repo = new FiscalYearRepo();
  }

  async getSearch(query?: string): Promise<IFiscalYearRecord[]> {
    return await this.repo.GetSearchTemplate(query);
  }

  async getItem(id: string | number): Promise<IFiscalYearRecord | null> {
    return await this.repo.GetItemTemplate(id);
  }

  async getCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    return await this.repo.GetComboTemplate();
  }

  async create(record: Partial<IFiscalYearRecord>, userId: string = "1"): Promise<IFiscalYearRecord> {
    return await this.repo.insert(record, userId);
  }

  async update(id: string | number, record: Partial<IFiscalYearRecord>, userId: string = "1"): Promise<IFiscalYearRecord | null> {
    return await this.repo.update(id, record, userId);
  }

  async delete(id: string | number, userId: string = "1"): Promise<boolean> {
    return await this.repo.delete(id, userId);
  }
}

export const fiscalYearServiceInstance = new FiscalYearService();
