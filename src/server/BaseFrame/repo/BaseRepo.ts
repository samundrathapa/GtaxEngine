import { DbConnects } from "../db/DbConnects.ts";

export interface AuditFields {
  insert_by: string;
  insert_on: string;
  update_by: string;
  update_on: string;
  delete_by: string | null;
  deleted_on: string | null;
  is_active: boolean;
}

export class BaseRepo<T extends { id?: string | number } = any> {
  protected tableName: string;
  protected primaryKey: string;
  protected localStore: Map<string, T & AuditFields> = new Map();

  constructor(tableName: string, primaryKey: string = "id") {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
  }

  async getById(recordId: string): Promise<(T & AuditFields) | null> {
    const item = this.localStore.get(String(recordId));
    if (item && item.is_active) {
      return item;
    }
    return null;
  }

  async listAll(limit = 100, offset = 0): Promise<(T & AuditFields)[]> {
    const active = Array.from(this.localStore.values()).filter((item) => item.is_active);
    return active.slice(offset, offset + limit);
  }

  async insert(data: any, userId: string): Promise<T & AuditFields> {
    const id = data[this.primaryKey] || `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const record: T & AuditFields = {
      ...data,
      [this.primaryKey]: id,
      insert_by: userId,
      insert_on: now,
      update_by: userId,
      update_on: now,
      delete_by: null,
      deleted_on: null,
      is_active: true
    };
    this.localStore.set(String(id), record);
    return record;
  }

  async update(recordId: string, data: any, userId: string): Promise<(T & AuditFields) | null> {
    const existing = await this.getById(recordId);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated: T & AuditFields = {
      ...existing,
      ...data,
      update_by: userId,
      update_on: now
    };
    this.localStore.set(String(recordId), updated);
    return updated;
  }

  async softDelete(recordId: string, userId: string): Promise<boolean> {
    const existing = this.localStore.get(String(recordId));
    if (!existing || !existing.is_active) return false;

    existing.is_active = false;
    existing.delete_by = userId;
    existing.deleted_on = new Date().toISOString();
    this.localStore.set(String(recordId), existing);
    return true;
  }

  async executeRawQuery(sql: string, params: any[] = []): Promise<any[]> {
    return DbConnects.executeRawQuery(sql, params);
  }
}
