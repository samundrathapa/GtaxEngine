import { Router, Request, Response } from "express";
import { userControllerInstance } from "./User/UserController.ts";
import { taxpayerControllerInstance } from "./Taxpayer/TaxpayerController.ts";
import { landControllerInstance } from "./Land/LandController.ts";
import { companyControllerInstance } from "./Company/CompanyController.ts";
import { fiscalYearControllerInstance } from "./FiscalYear/FiscalYearController.ts";
import { constructionTypesControllerInstance } from "./ConstructionTypes/ConstructionTypesController.ts";
import { measurementUnitControllerInstance } from "./MeasurementUnit/MeasurementUnitController.ts";
import { landNatureControllerInstance } from "./LandNature/LandNatureController.ts";
import { auditLogsControllerInstance } from "./AuditLogs/AuditLogsController.ts";
import { calculationControllerInstance } from "./Calculation/CalculationController.ts";
import { dashboardControllerInstance } from "./Dashboard/DashboardController.ts";

import { EntityController, IEntityModel } from "./DynamicEntityFactory.ts";
import { ALL_25_TABLES } from "../server/db/TableCacheDbSyncService.ts";

export const serversideRouter = Router();

// Table Entity Config Map
const TABLE_MODELS: Record<string, IEntityModel> = {
  User: {
    entityName: "User",
    tableName: "tbl_user",
    primaryKey: "id",
    columnMappings: {
      id: "INTEGER PRIMARY KEY",
      user_id: "VARCHAR(50)",
      username: "VARCHAR(100)",
      fullname: "VARCHAR(255)",
      email: "VARCHAR(150)",
      role: "VARCHAR(50)",
      mobile: "VARCHAR(20)",
      is_active: "BOOLEAN"
    }
  },
  Taxpayer: {
    entityName: "Taxpayer",
    tableName: "tbl_taxpayer",
    primaryKey: "id",
    columnMappings: {
      id: "INTEGER PRIMARY KEY",
      taxpayer_id: "VARCHAR(50)",
      fullname: "VARCHAR(255)",
      pan_number: "VARCHAR(50)",
      ward_no: "INTEGER",
      phone: "VARCHAR(20)",
      citizenship_no: "VARCHAR(50)"
    }
  },
  Land: {
    entityName: "Land",
    tableName: "tbl_land",
    primaryKey: "id",
    columnMappings: {
      id: "INTEGER PRIMARY KEY",
      taxpayer_id: "INTEGER",
      kitta_no: "VARCHAR(50)",
      area_sqft: "NUMERIC",
      ward_no: "INTEGER"
    }
  },
  Company: {
    entityName: "Company",
    tableName: "tbl_company",
    primaryKey: "id",
    columnMappings: {
      id: "INTEGER PRIMARY KEY",
      code: "VARCHAR(50)",
      name: "VARCHAR(255)",
      address: "VARCHAR(255)",
      phone: "VARCHAR(50)",
      email: "VARCHAR(150)",
      pan_no: "VARCHAR(50)"
    }
  },
  FiscalYear: {
    entityName: "FiscalYear",
    tableName: "tbl_fiscal_year",
    primaryKey: "id",
    columnMappings: {
      id: "INTEGER PRIMARY KEY",
      code: "VARCHAR(50)",
      name: "VARCHAR(100)",
      is_active: "BOOLEAN"
    }
  },
  ConstructionTypes: {
    entityName: "ConstructionTypes",
    tableName: "tbl_construction_type",
    primaryKey: "id",
    columnMappings: {
      id: "INTEGER PRIMARY KEY",
      code: "VARCHAR(50)",
      name: "VARCHAR(100)",
      depreciation_rate: "NUMERIC"
    }
  },
  MeasurementUnit: {
    entityName: "MeasurementUnit",
    tableName: "tbl_unit",
    primaryKey: "id",
    columnMappings: {
      id: "INTEGER PRIMARY KEY",
      code: "VARCHAR(50)",
      name: "VARCHAR(100)",
      symbol: "VARCHAR(50)"
    }
  },
  LandNature: {
    entityName: "LandNature",
    tableName: "tbl_land_nature",
    primaryKey: "id",
    columnMappings: {
      id: "INTEGER PRIMARY KEY",
      code: "VARCHAR(50)",
      name: "VARCHAR(100)"
    }
  },
  AuditLogs: {
    entityName: "AuditLogs",
    tableName: "tbl_user_log",
    primaryKey: "id",
    columnMappings: {
      id: "INTEGER PRIMARY KEY",
      user_id: "VARCHAR(50)",
      action_type: "VARCHAR(100)",
      module_name: "VARCHAR(100)",
      client_ip: "VARCHAR(50)"
    }
  },
  Calculation: {
    entityName: "Calculation",
    tableName: "tax_transactions",
    primaryKey: "id",
    columnMappings: {
      id: "INTEGER PRIMARY KEY",
      taxpayer_id: "INTEGER",
      fiscal_year_id: "INTEGER",
      net_payable_tax: "NUMERIC"
    }
  },
  Dashboard: {
    entityName: "Dashboard",
    tableName: "tbl_application_setting",
    primaryKey: "id",
    columnMappings: {
      id: "INTEGER PRIMARY KEY",
      total_taxpayers: "INTEGER",
      total_properties: "INTEGER"
    }
  }
};

// Cache controller instances
const controllerCache = new Map<string, any>();

function getControllerForEntity(entityName: string): any {
  const norm = entityName.toLowerCase();
  if (norm === "user" || norm === "tbl_user") return userControllerInstance;
  if (norm === "taxpayer" || norm === "tbl_taxpayer") return taxpayerControllerInstance;
  if (norm === "land" || norm === "tbl_land") return landControllerInstance;
  if (norm === "company" || norm === "tbl_company") return companyControllerInstance;
  if (norm === "fiscalyear" || norm === "tbl_fiscal_year") return fiscalYearControllerInstance;
  if (norm === "constructiontypes" || norm === "tbl_construction_type") return constructionTypesControllerInstance;
  if (norm === "measurementunit" || norm === "measurmentunit" || norm === "tbl_unit") return measurementUnitControllerInstance;
  if (norm === "landnature" || norm === "tbl_land_nature") return landNatureControllerInstance;
  if (norm === "auditlogs" || norm === "tbl_user_log") return auditLogsControllerInstance;
  if (norm === "calculation" || norm === "tax_transactions") return calculationControllerInstance;
  if (norm === "dashboard") return dashboardControllerInstance;

  if (controllerCache.has(norm)) {
    return controllerCache.get(norm)!;
  }

  // Find matching model or construct on the fly for any table
  let modelKey = Object.keys(TABLE_MODELS).find(
    (k) => k.toLowerCase() === norm || TABLE_MODELS[k].tableName.toLowerCase() === norm
  );

  let model: IEntityModel;
  if (modelKey && TABLE_MODELS[modelKey]) {
    model = TABLE_MODELS[modelKey];
  } else {
    const matchingTable = ALL_25_TABLES.find((t) => t.toLowerCase() === norm) || (norm.startsWith("tbl_") ? norm : `tbl_${norm}`);
    model = {
      entityName,
      tableName: matchingTable,
      primaryKey: "id",
      columnMappings: { id: "INTEGER PRIMARY KEY" }
    };
  }

  const ctrl = new EntityController(model);
  controllerCache.set(norm, ctrl);
  return ctrl;
}

// 1. GetSearchTemplate endpoint: GET /api/:entity/GetSearchTemplate
serversideRouter.get("/:entity/GetSearchTemplate", (req: Request, res: Response) => {
  const ctrl = getControllerForEntity(req.params.entity);
  ctrl.GetSearchTemplate(req, res);
});

// 2. GetItemTemplate endpoint: GET /api/:entity/:id/GetItemTemplate or GET /api/:entity/GetItemTemplate?id=1
serversideRouter.get("/:entity/:id/GetItemTemplate", (req: Request, res: Response) => {
  const ctrl = getControllerForEntity(req.params.entity);
  ctrl.GetItemTemplate(req, res);
});

serversideRouter.get("/:entity/GetItemTemplate", (req: Request, res: Response) => {
  const ctrl = getControllerForEntity(req.params.entity);
  ctrl.GetItemTemplate(req, res);
});

// 3. GetCombo & GetComboTemplate endpoint: GET /api/:entity/GetCombo or GET /api/:entity/GetComboTemplate
serversideRouter.get("/:entity/GetCombo", (req: Request, res: Response) => {
  const ctrl = getControllerForEntity(req.params.entity);
  ctrl.GetComboTemplate(req, res);
});

serversideRouter.get("/:entity/GetComboTemplate", (req: Request, res: Response) => {
  const ctrl = getControllerForEntity(req.params.entity);
  ctrl.GetComboTemplate(req, res);
});

// Generic CRUD handlers: GET, POST, PUT, DELETE
serversideRouter.get("/:entity", (req: Request, res: Response) => {
  const ctrl = getControllerForEntity(req.params.entity);
  ctrl.GetSearchTemplate(req, res);
});

serversideRouter.get("/:entity/:id", (req: Request, res: Response) => {
  const ctrl = getControllerForEntity(req.params.entity);
  ctrl.GetItemTemplate(req, res);
});

serversideRouter.post("/:entity", (req: Request, res: Response) => {
  const ctrl = getControllerForEntity(req.params.entity);
  ctrl.Create(req, res);
});

serversideRouter.put("/:entity/:id", (req: Request, res: Response) => {
  const ctrl = getControllerForEntity(req.params.entity);
  ctrl.Update(req, res);
});

serversideRouter.delete("/:entity/:id", (req: Request, res: Response) => {
  const ctrl = getControllerForEntity(req.params.entity);
  ctrl.Delete(req, res);
});
