import { BaseService } from "../services/BaseService.ts";
import { RbacHandler, AuthUser } from "../auth/RbacHandler.ts";
import { ApiResponse, IApiResponse } from "../response/ApiResponse.ts";

export class BaseCrudController<T extends { id?: string | number } = any> {
  protected prefix: string;
  protected service: BaseService<T>;
  protected allowedRoles: string[];

  constructor(prefix: string, service: BaseService<T>, allowedRoles: string[] = ["admin", "tax_analyst", "user"]) {
    this.prefix = prefix;
    this.service = service;
    this.allowedRoles = allowedRoles;
  }

  getPrefix(): string {
    return this.prefix;
  }

  getService(): BaseService<T> {
    return this.service;
  }

  protected authenticate(authHeader?: string): AuthUser | null {
    if (!authHeader) return null;
    return RbacHandler.verifyBearerToken(authHeader);
  }

  async handleList(authHeader?: string, limit = 100, offset = 0): Promise<IApiResponse<any>> {
    const user = this.authenticate(authHeader);
    if (!user) return ApiResponse.buildFailure("Missing or invalid Bearer token", [], {}, 401);
    if (!RbacHandler.checkAuthorization(user, this.allowedRoles)) {
      return ApiResponse.buildFailure(`Forbidden. Required roles: ${this.allowedRoles.join(", ")}`, [], {}, 403);
    }
    return this.service.listRecords(limit, offset);
  }

  async handleGet(id: string, authHeader?: string): Promise<IApiResponse<any>> {
    const user = this.authenticate(authHeader);
    if (!user) return ApiResponse.buildFailure("Missing or invalid Bearer token", [], {}, 401);
    if (!RbacHandler.checkAuthorization(user, this.allowedRoles)) {
      return ApiResponse.buildFailure(`Forbidden. Required roles: ${this.allowedRoles.join(", ")}`, [], {}, 403);
    }
    return this.service.getById(id);
  }

  async handleCreate(data: any, authHeader?: string): Promise<IApiResponse<any>> {
    const user = this.authenticate(authHeader);
    if (!user) return ApiResponse.buildFailure("Missing or invalid Bearer token", [], {}, 401);
    if (!RbacHandler.checkAuthorization(user, this.allowedRoles)) {
      return ApiResponse.buildFailure(`Forbidden. Required roles: ${this.allowedRoles.join(", ")}`, [], {}, 403);
    }
    return this.service.create(data, user.user_id);
  }

  async handleUpdate(id: string, data: any, authHeader?: string): Promise<IApiResponse<any>> {
    const user = this.authenticate(authHeader);
    if (!user) return ApiResponse.buildFailure("Missing or invalid Bearer token", [], {}, 401);
    if (!RbacHandler.checkAuthorization(user, this.allowedRoles)) {
      return ApiResponse.buildFailure(`Forbidden. Required roles: ${this.allowedRoles.join(", ")}`, [], {}, 403);
    }
    return this.service.update(id, data, user.user_id);
  }

  async handleDelete(id: string, authHeader?: string): Promise<IApiResponse<any>> {
    const user = this.authenticate(authHeader);
    if (!user) return ApiResponse.buildFailure("Missing or invalid Bearer token", [], {}, 401);
    if (!RbacHandler.checkAuthorization(user, this.allowedRoles)) {
      return ApiResponse.buildFailure(`Forbidden. Required roles: ${this.allowedRoles.join(", ")}`, [], {}, 403);
    }
    return this.service.delete(id, user.user_id);
  }
}
