import { Request, Response } from "express";
import { DashboardModel } from "./DashboardModel.ts";
import { dashboardServiceInstance, DashboardService } from "./DashboardService.ts";
import { ApiResponse } from "../../server/BaseFrame/response/ApiResponse.ts";

export class DashboardController {
  public service: DashboardService = dashboardServiceInstance;
  public model = DashboardModel;

  GetSearchTemplate = async (req: Request, res: Response) => {
    try {
      const q = (req.query.q || req.query.query || "") as string;
      const data = await this.service.getSearch(q);
      res.json(ApiResponse.buildSuccess({ items: data, total: data.length, model: this.model }, "Grid search records for Dashboard"));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure("GetSearchTemplate error", [err.message]));
    }
  };

  GetItemTemplate = async (req: Request, res: Response) => {
    try {
      const id = req.params.id || (req.query.id as string) || "1";
      const data = await this.service.getItem(id);
      if (!data) {
        return res.status(404).json(ApiResponse.buildFailure("Dashboard data not found", ["Not found"]));
      }
      res.json(ApiResponse.buildSuccess(data, "Dashboard item record"));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure("GetItemTemplate error", [err.message]));
    }
  };

  GetComboTemplate = async (req: Request, res: Response) => {
    try {
      const combo = await this.service.getCombo();
      res.json(ApiResponse.buildSuccess(combo, "Dashboard combo options"));
    } catch (err: any) {
      res.status(500).json(ApiResponse.buildFailure("GetComboTemplate error", [err.message]));
    }
  };

  Create = async (req: Request, res: Response) => {
    res.json(ApiResponse.buildSuccess({ id: 1 }, "Dashboard metric refreshed"));
  };

  Update = async (req: Request, res: Response) => {
    res.json(ApiResponse.buildSuccess({ id: 1 }, "Dashboard metric updated"));
  };

  Delete = async (req: Request, res: Response) => {
    res.json(ApiResponse.buildSuccess({ id: 1 }, "Dashboard metric reset"));
  };
}

export const dashboardControllerInstance = new DashboardController();
