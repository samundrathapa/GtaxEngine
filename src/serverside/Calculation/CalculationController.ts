import { Request, Response } from "express";
import { CalculationModel } from "./CalculationModel.ts";
import { calculationServiceInstance, CalculationService } from "./CalculationService.ts";
import { ApiResponse } from "../../server/BaseFrame/response/ApiResponse.ts";

export class CalculationController {
  public service: CalculationService = calculationServiceInstance;
  public model = CalculationModel;

  GetSearchTemplate = async (req: Request, res: Response) => {
    try {
      const q = (req.query.q || req.query.query || "") as string;
      const data = await this.service.getSearch(q);
      res.json(ApiResponse.buildSuccess({ items: data, total: data.length, model: this.model }, "Grid search records for Calculation"));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure("GetSearchTemplate error", [err.message]));
    }
  };

  GetItemTemplate = async (req: Request, res: Response) => {
    try {
      const id = req.params.id || (req.query.id as string);
      if (!id) {
        return res.status(400).json(ApiResponse.buildFailure("ID required", ["ID required"]));
      }
      const data = await this.service.getItem(id);
      if (!data) {
        return res.status(404).json(ApiResponse.buildFailure("Calculation not found", ["Not found"]));
      }
      res.json(ApiResponse.buildSuccess(data, "Calculation item record for edit"));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure("GetItemTemplate error", [err.message]));
    }
  };

  GetComboTemplate = async (req: Request, res: Response) => {
    try {
      const combo = await this.service.getCombo();
      res.json(ApiResponse.buildSuccess(combo, "Calculation combo dropdown items"));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure("GetComboTemplate error", [err.message]));
    }
  };

  Create = async (req: Request, res: Response) => {
    try {
      const userId = (req.headers["x-user-id"] as string) || "1";
      const created = await this.service.create(req.body, userId);
      res.status(201).json(ApiResponse.buildSuccess(created, "Calculation created successfully", 201));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure("Calculation creation failed", [err.message]));
    }
  };

  Update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const userId = (req.headers["x-user-id"] as string) || "1";
      const updated = await this.service.update(id, req.body, userId);
      res.json(ApiResponse.buildSuccess(updated, "Calculation updated successfully"));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure("Calculation update failed", [err.message]));
    }
  };

  Delete = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const userId = (req.headers["x-user-id"] as string) || "1";
      await this.service.delete(id, userId);
      res.json(ApiResponse.buildSuccess({ id }, "Calculation deleted successfully"));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure("Calculation deletion failed", [err.message]));
    }
  };
}

export const calculationControllerInstance = new CalculationController();
