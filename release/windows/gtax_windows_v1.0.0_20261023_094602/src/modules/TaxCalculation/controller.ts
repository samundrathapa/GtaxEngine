import { ApiController } from "../../api/controller.ts";
import { TaxCalculationParams, TaxCalculationResponseData } from "./model.ts";
import { TaxTransactionRecord } from "../../server/ApiServiceStruct/TaxCalcApiService.ts";

export class TaxCalculationController {
  static async fetchTransactions(): Promise<TaxTransactionRecord[]> {
    const res = await ApiController.getTransactions();
    if (res.success && res.data?.items) {
      return res.data.items as TaxTransactionRecord[];
    }
    return [];
  }

  static async computeLiability(
    params: TaxCalculationParams
  ): Promise<{ success: boolean; data?: TaxCalculationResponseData; message: string }> {
    const res = await ApiController.calculateTaxLiability(params);
    return {
      success: res.success,
      data: res.data as TaxCalculationResponseData,
      message: res.message
    };
  }
}
