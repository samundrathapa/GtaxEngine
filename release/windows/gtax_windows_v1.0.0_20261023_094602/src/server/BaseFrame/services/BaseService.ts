import { BaseRepo } from "../repo/BaseRepo.ts";
import { RedisCacheManager } from "../cache/RedisCacheManager.ts";
import { ApiResponse, IApiResponse } from "../response/ApiResponse.ts";

export class BaseService<T extends { id?: string | number } = any> {
  protected repo: BaseRepo<T>;
  protected cachePrefix: string;

  constructor(repo: BaseRepo<T>, cachePrefix: string) {
    this.repo = repo;
    this.cachePrefix = cachePrefix;
  }

  validateData(data: any, isCreate: boolean = true): Record<string, string[]> {
    return {};
  }

  async getById(recordId: string): Promise<IApiResponse<T | null>> {
    const cacheKey = `${this.cachePrefix}:${recordId}`;
    const cached = await RedisCacheManager.get(cacheKey);
    if (cached) {
      try {
        return ApiResponse.buildSuccess(JSON.parse(cached), "Retrieved from cache layer");
      } catch (e) {
        // Fallback to repo
      }
    }

    const item = await this.repo.getById(recordId);
    if (!item) {
      return ApiResponse.buildFailure(`Record with ID ${recordId} not found`, [], {}, 404);
    }

    await RedisCacheManager.set(cacheKey, item, 300);
    return ApiResponse.buildSuccess(item, "Fetched successfully");
  }

  async listRecords(limit = 100, offset = 0): Promise<IApiResponse<{ items: any[]; total: number }>> {
    const items = await this.repo.listAll(limit, offset);
    return ApiResponse.buildSuccess({
      items,
      total: items.length
    }, "Records retrieved successfully");
  }

  async create(data: any, userId: string): Promise<IApiResponse<T | null>> {
    const validationErrors = this.validateData(data, true);
    if (Object.keys(validationErrors).length > 0) {
      return ApiResponse.buildFailure("Validation errors detected", [], validationErrors, 422);
    }

    const created = await this.repo.insert(data, userId);
    await RedisCacheManager.invalidatePrefix(this.cachePrefix);
    return ApiResponse.buildSuccess(created, "Record created successfully", 201);
  }

  async update(recordId: string, data: any, userId: string): Promise<IApiResponse<T | null>> {
    const existing = await this.repo.getById(recordId);
    if (!existing) {
      return ApiResponse.buildFailure(`Record ${recordId} not found`, [], {}, 404);
    }

    const validationErrors = this.validateData(data, false);
    if (Object.keys(validationErrors).length > 0) {
      return ApiResponse.buildFailure("Validation errors detected", [], validationErrors, 422);
    }

    const updated = await this.repo.update(recordId, data, userId);
    await RedisCacheManager.delete(`${this.cachePrefix}:${recordId}`);
    return ApiResponse.buildSuccess(updated, "Record updated successfully");
  }

  async delete(recordId: string, userId: string): Promise<IApiResponse<{ deleted_id: string } | null>> {
    const ok = await this.repo.softDelete(recordId, userId);
    if (!ok) {
      return ApiResponse.buildFailure(`Record ${recordId} not found or already inactive`, [], {}, 404);
    }

    await RedisCacheManager.delete(`${this.cachePrefix}:${recordId}`);
    return ApiResponse.buildSuccess({ deleted_id: recordId }, "Record soft-deleted successfully");
  }
}
