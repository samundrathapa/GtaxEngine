import { DashboardRepo } from "./DashboardRepo.ts";
import { IDashboardRecord } from "./DashboardModel.ts";

export class DashboardService {
  public repo: DashboardRepo;

  constructor() {
    this.repo = new DashboardRepo();
  }

  async getSearch(query?: string): Promise<IDashboardRecord[]> {
    return await this.repo.GetSearchTemplate(query);
  }

  async getItem(id: string | number): Promise<IDashboardRecord | null> {
    return await this.repo.GetItemTemplate(id);
  }

  async getCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    return await this.repo.GetComboTemplate();
  }

  async create(record: Partial<IDashboardRecord>, userId: string = "1"): Promise<IDashboardRecord> {
    return await this.repo.insert(record, userId);
  }

  async update(id: string | number, record: Partial<IDashboardRecord>, userId: string = "1"): Promise<IDashboardRecord | null> {
    return await this.repo.update(id, record, userId);
  }

  async delete(id: string | number, userId: string = "1"): Promise<boolean> {
    return await this.repo.delete(id, userId);
  }
}

export const dashboardServiceInstance = new DashboardService();
