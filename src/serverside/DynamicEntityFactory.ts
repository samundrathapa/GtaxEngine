import { Request, Response, Router } from "express";
import { TableCacheDbSyncService, ALL_25_TABLES, GtaxTableName } from "../server/db/TableCacheDbSyncService.ts";
import { ApiResponse } from "../server/BaseFrame/response/ApiResponse.ts";

export interface IEntityColumnMapping {
  [columnName: string]: string;
}

export interface IEntityModel {
  entityName: string;
  tableName: GtaxTableName | string;
  primaryKey: string;
  columnMappings: IEntityColumnMapping;
}

export class EntityRepo {
  constructor(public model: IEntityModel) {}

  async GetSearchTemplate(queryStr?: string): Promise<any[]> {
    const list = await TableCacheDbSyncService.getTableData<any>(this.model.tableName as any, true);
    if (!queryStr) return list;
    const q = queryStr.toLowerCase();
    return list.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  }

  async GetItemTemplate(id: string | number): Promise<any | null> {
    const list = await TableCacheDbSyncService.getTableData<any>(this.model.tableName as any, true);
    const targetIdStr = String(id);
    const targetIdNum = Number(id);
    return (
      list.find(
        (item) =>
          String(item.id) === targetIdStr ||
          Number(item.id) === targetIdNum ||
          String(item[this.model.primaryKey]) === targetIdStr ||
          String(item.code) === targetIdStr ||
          String(item.user_id) === targetIdStr ||
          String(item.taxpayer_id) === targetIdStr
      ) || null
    );
  }

  async GetComboTemplate(): Promise<Array<{ id: number | string; name: string; code?: string }>> {
    const list = await TableCacheDbSyncService.getTableData<any>(this.model.tableName as any, true);
    return list.map((item) => {
      const name =
        item.fullname ||
        item.full_name ||
        item.name ||
        item.nepali_name ||
        item.title ||
        item.code ||
        `${this.model.entityName} #${item.id}`;
      const code = item.code || item.user_id || item.taxpayer_id || String(item.id);
      return {
        id: item.id || item[this.model.primaryKey],
        name,
        code,
      };
    });
  }

  async insert(record: Record<string, any>, userId: string = "1"): Promise<any> {
    return await TableCacheDbSyncService.insertRecord(this.model.tableName as any, record, userId);
  }

  async update(id: string | number, record: Record<string, any>, userId: string = "1"): Promise<any> {
    return await TableCacheDbSyncService.updateRecord(this.model.tableName as any, Number(id), record, userId);
  }

  async delete(id: string | number, userId: string = "1"): Promise<boolean> {
    return await TableCacheDbSyncService.deleteRecord(this.model.tableName as any, Number(id), userId);
  }
}

export class EntityService {
  public repo: EntityRepo;

  constructor(public model: IEntityModel) {
    this.repo = new EntityRepo(model);
  }

  async getSearch(query?: string): Promise<any[]> {
    return await this.repo.GetSearchTemplate(query);
  }

  async getItem(id: string | number): Promise<any | null> {
    return await this.repo.GetItemTemplate(id);
  }

  async getCombo(): Promise<Array<{ id: number | string; name: string; code?: string }>> {
    return await this.repo.GetComboTemplate();
  }

  async create(record: Record<string, any>, userId: string = "1"): Promise<any> {
    return await this.repo.insert(record, userId);
  }

  async update(id: string | number, record: Record<string, any>, userId: string = "1"): Promise<any> {
    return await this.repo.update(id, record, userId);
  }

  async delete(id: string | number, userId: string = "1"): Promise<boolean> {
    return await this.repo.delete(id, userId);
  }
}

export class EntityController {
  public service: EntityService;
  public model: IEntityModel;

  constructor(model: IEntityModel) {
    this.model = model;
    this.service = new EntityService(model);
  }

  GetSearchTemplate = async (req: Request, res: Response) => {
    try {
      const q = (req.query.q || req.query.query || "") as string;
      const data = await this.service.getSearch(q);
      res.json(
        ApiResponse.buildSuccess(
          { items: data, total: data.length, model: this.model },
          `Grid records for ${this.model.entityName}`
        )
      );
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure("GetSearchTemplate error", [err.message]));
    }
  };

  GetItemTemplate = async (req: Request, res: Response) => {
    try {
      const id = req.params.id || (req.query.id as string);
      if (!id) {
        return res.status(400).json(ApiResponse.buildFailure("Missing ID parameter", ["ID parameter is required"]));
      }
      const item = await this.service.getItem(id);
      if (!item) {
        return res.status(404).json(ApiResponse.buildFailure("Record not found", ["Not found"]));
      }
      res.json(ApiResponse.buildSuccess(item, `Selected item for edit in ${this.model.entityName}`));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure("GetItemTemplate error", [err.message]));
    }
  };

  GetComboTemplate = async (req: Request, res: Response) => {
    try {
      const combo = await this.service.getCombo();
      res.json(ApiResponse.buildSuccess(combo, `Combo dropdown items for ${this.model.entityName}`));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure("GetComboTemplate error", [err.message]));
    }
  };

  Create = async (req: Request, res: Response) => {
    try {
      const userId = (req.headers["x-user-id"] as string) || "1";
      const created = await this.service.create(req.body, userId);
      res.status(201).json(ApiResponse.buildSuccess(created, `${this.model.entityName} created successfully`, 201));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure("Create error", [err.message]));
    }
  };

  Update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const userId = (req.headers["x-user-id"] as string) || "1";
      const updated = await this.service.update(id, req.body, userId);
      res.json(ApiResponse.buildSuccess(updated, `${this.model.entityName} updated successfully`));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure("Update error", [err.message]));
    }
  };

  Delete = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const userId = (req.headers["x-user-id"] as string) || "1";
      await this.service.delete(id, userId);
      res.json(ApiResponse.buildSuccess({ id }, `${this.model.entityName} deleted successfully`));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure("Delete error", [err.message]));
    }
  };
}
