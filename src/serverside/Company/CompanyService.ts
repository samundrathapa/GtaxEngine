import { CompanyRepo } from "./CompanyRepo.ts";
import { ICompanyRecord } from "./CompanyModel.ts";

export class CompanyService {
  public repo: CompanyRepo;

  constructor() {
    this.repo = new CompanyRepo();
  }

  async getSearch(query?: string): Promise<ICompanyRecord[]> {
    return await this.repo.GetSearchTemplate(query);
  }

  async getItem(id: string | number): Promise<ICompanyRecord | null> {
    return await this.repo.GetItemTemplate(id);
  }

  async getCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    return await this.repo.GetComboTemplate();
  }

  async create(record: Partial<ICompanyRecord>, userId: string = "1"): Promise<ICompanyRecord> {
    return await this.repo.insert(record, userId);
  }

  async update(id: string | number, record: Partial<ICompanyRecord>, userId: string = "1"): Promise<ICompanyRecord | null> {
    return await this.repo.update(id, record, userId);
  }

  async delete(id: string | number, userId: string = "1"): Promise<boolean> {
    return await this.repo.delete(id, userId);
  }
}

export const companyServiceInstance = new CompanyService();
