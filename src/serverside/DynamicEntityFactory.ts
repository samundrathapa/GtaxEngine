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
    let targetId: string | number = id;
    const targetNum = Number(id);
    if (isNaN(targetNum)) {
      const list = await TableCacheDbSyncService.getTableData<any>(this.model.tableName as any, true);
      const found = list.find(
        (item) =>
          String(item.id) === String(id) ||
          String(item[this.model.primaryKey]) === String(id) ||
          String(item.code) === String(id) ||
          String(item.user_id) === String(id) ||
          String(item.taxpayer_id) === String(id)
      );
      if (found && !isNaN(Number(found.id))) {
        targetId = Number(found.id);
      }
    } else {
      targetId = targetNum;
    }
    return await TableCacheDbSyncService.updateRecord(this.model.tableName as any, targetId, record, userId);
  }

  async delete(id: string | number, userId: string = "1"): Promise<boolean> {
    let targetId: string | number = id;
    const targetNum = Number(id);
    if (isNaN(targetNum)) {
      const list = await TableCacheDbSyncService.getTableData<any>(this.model.tableName as any, true);
      const found = list.find(
        (item) =>
          String(item.id) === String(id) ||
          String(item[this.model.primaryKey]) === String(id) ||
          String(item.code) === String(id) ||
          String(item.user_id) === String(id) ||
          String(item.taxpayer_id) === String(id)
      );
      if (found && !isNaN(Number(found.id))) {
        targetId = Number(found.id);
      }
    } else {
      targetId = targetNum;
    }
    return await TableCacheDbSyncService.deleteRecord(this.model.tableName as any, targetId, userId);
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
      const tbl = String(this.model.tableName).toLowerCase();

      if (tbl === "tbl_land" && (!req.body.taxpayer_id || Number(req.body.taxpayer_id) <= 0 || isNaN(Number(req.body.taxpayer_id)))) {
        return res.status(400).json(
          ApiResponse.buildFailure("Validation Failed", ["Taxpayer selection (taxpayer_id) is required to register a land parcel."])
        );
      }
      const tpName = req.body.fullname || req.body.full_name || req.body.fullanme || req.body.name;
      if ((tbl === "tbl_taxpayer" || tbl === "tbl_taxpayer_master") && !tpName) {
        return res.status(400).json(
          ApiResponse.buildFailure("Validation Failed", ["Full Name is required for taxpayer registration."])
        );
      }
      const userName = req.body.fullname || req.body.full_name || req.body.name || req.body.username;
      if (tbl === "tbl_user" && !userName) {
        return res.status(400).json(
          ApiResponse.buildFailure("Validation Failed", ["Full Name or Username is required for user registration."])
        );
      }
      const compName = req.body.name || req.body.company_name || req.body.fullname || req.body.fullanme;
      if (tbl === "tbl_company" && !compName) {
        return res.status(400).json(
          ApiResponse.buildFailure("Validation Failed", ["Company Name is required."])
        );
      }

      const created = await this.service.create(req.body, userId);
      res.status(201).json(ApiResponse.buildSuccess(created, `${this.model.entityName} created successfully`, 201));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure(`${this.model.entityName} creation failed`, [err.message || String(err)]));
    }
  };

  Update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const userId = (req.headers["x-user-id"] as string) || "1";
      const updated = await this.service.update(id, req.body, userId);
      if (!updated) {
        return res.status(400).json(
          ApiResponse.buildFailure(`${this.model.entityName} update failed`, ["Record not found or update rejected."])
        );
      }
      res.json(ApiResponse.buildSuccess(updated, `${this.model.entityName} updated successfully`));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure(`${this.model.entityName} update failed`, [err.message || String(err)]));
    }
  };

  Delete = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const userId = (req.headers["x-user-id"] as string) || "1";
      const ok = await this.service.delete(id, userId);
      if (!ok) {
        return res.status(400).json(
          ApiResponse.buildFailure(`${this.model.entityName} deletion failed`, ["Record not found or deletion rejected."])
        );
      }
      res.json(ApiResponse.buildSuccess({ id }, `${this.model.entityName} deleted successfully`));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure(`${this.model.entityName} deletion failed`, [err.message || String(err)]));
    }
  };
}
