import { AuditLogsRepo } from "./AuditLogsRepo.ts";
import { IAuditLogRecord } from "./AuditLogsModel.ts";

export class AuditLogsService {
  public repo: AuditLogsRepo;

  constructor() {
    this.repo = new AuditLogsRepo();
  }

  async getSearch(query?: string): Promise<IAuditLogRecord[]> {
    return await this.repo.GetSearchTemplate(query);
  }

  async getItem(id: string | number): Promise<IAuditLogRecord | null> {
    return await this.repo.GetItemTemplate(id);
  }

  async getCombo(): Promise<Array<{ id: number; name: string; code?: string }>> {
    return await this.repo.GetComboTemplate();
  }

  async create(record: Partial<IAuditLogRecord>, userId: string = "1"): Promise<IAuditLogRecord> {
    return await this.repo.insert(record, userId);
  }

  async update(id: string | number, record: Partial<IAuditLogRecord>, userId: string = "1"): Promise<IAuditLogRecord | null> {
    return await this.repo.update(id, record, userId);
  }

  async delete(id: string | number, userId: string = "1"): Promise<boolean> {
    return await this.repo.delete(id, userId);
  }
}

export const auditLogsServiceInstance = new AuditLogsService();
