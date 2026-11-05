import { MeasurementUnitRepo } from "./MeasurementUnitRepo.ts";
import { IMeasurementUnitRecord } from "./MeasurementUnitModel.ts";

export class MeasurementUnitService {
  public repo: MeasurementUnitRepo;

  constructor() {
    this.repo = new MeasurementUnitRepo();
  }

  async getSearch(query?: string): Promise<IMeasurementUnitRecord[]> {
    return await this.repo.GetSearchTemplate(query);
  }

  async getItem(id: string | number): Promise<IMeasurementUnitRecord | null> {
    return await this.repo.GetItemTemplate(id);
  }

  async getCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    return await this.repo.GetComboTemplate();
  }

  async create(record: Partial<IMeasurementUnitRecord>, userId: string = "1"): Promise<IMeasurementUnitRecord> {
    return await this.repo.insert(record, userId);
  }

  async update(id: string | number, record: Partial<IMeasurementUnitRecord>, userId: string = "1"): Promise<IMeasurementUnitRecord | null> {
    return await this.repo.update(id, record, userId);
  }

  async delete(id: string | number, userId: string = "1"): Promise<boolean> {
    return await this.repo.delete(id, userId);
  }
}

export const measurementUnitServiceInstance = new MeasurementUnitService();
