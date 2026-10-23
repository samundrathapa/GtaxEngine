import { ApiController } from "../../api/controller.ts";
import { JurisdictionRecord } from "../../server/ApiServiceStruct/JurisdictionApiService.ts";
import { JurisdictionFormData } from "./model.ts";

export class JurisdictionController {
  static async fetchJurisdictions(): Promise<JurisdictionRecord[]> {
    const res = await ApiController.getJurisdictions();
    if (res.success && res.data?.items) {
      return res.data.items as JurisdictionRecord[];
    }
    return [];
  }

  static async createJurisdiction(data: JurisdictionFormData): Promise<{ success: boolean; message: string }> {
    const res = await ApiController.createJurisdiction(data);
    return {
      success: res.success,
      message: res.message || (res.success ? "Jurisdiction registered" : "Failed to register jurisdiction")
    };
  }
}
