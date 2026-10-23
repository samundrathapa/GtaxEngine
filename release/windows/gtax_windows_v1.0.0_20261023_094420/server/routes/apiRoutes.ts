import { Router } from "express";
import { AuthSessionService } from "../../src/server/ApiServiceStruct/AuthSessionService.ts";
import { propertyDb } from "../../src/server/ApiServiceStruct/TaxpayerPropertyService.ts";
import { ApiResponse } from "../../src/server/BaseFrame/response/ApiResponse.ts";
import { userApiServiceInstance } from "../../src/server/ApiServiceStruct/UserApiService.ts";
import { taxCalcApiServiceInstance } from "../../src/server/ApiServiceStruct/TaxCalcApiService.ts";
import { jurisdictionApiServiceInstance } from "../../src/server/ApiServiceStruct/JurisdictionApiService.ts";
import { syncEventApiServiceInstance } from "../../src/server/ApiServiceStruct/SyncEventApiService.ts";
import { MigrationRunner } from "../../src/server/DbMigration/MigrationRunner.ts";
import { ReportEngine } from "../../src/server/BaseFrame/reports/ReportEngine.ts";
import { aiRouter } from "../../ai/index.ts";
import { mobileRouter } from "./mobileRoutes.ts";
import { CommonEntryPointCoordinator } from "../entry.ts";

export const apiRouter = Router();

// Mount AI domain routes
apiRouter.use("/ai", aiRouter);

// Mount Mobile domain routes (Flutter iOS & Android)
apiRouter.use("/mobile", mobileRouter);

// Single Common Entry Point Manifest
apiRouter.get("/entry/manifest", (req, res) => {
  res.json(ApiResponse.buildSuccess(CommonEntryPointCoordinator.getSystemManifest(), "Common entry manifest"));
});

// Health check
apiRouter.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    architecture: {
      tiers: ["client", "server", "ai", "mobileapp"],
      entryPoint: "single_common",
      flutterReady: true
    },
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
apiRouter.post("/auth/login", async (req, res) => {
  const { identifier, password } = req.body;
  const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "127.0.0.1";
  const userAgent = req.headers["user-agent"] || "gtax-client";
  const result = await AuthSessionService.login(identifier || "", password || "", clientIp, userAgent);
  res.status(result.status).json(result);
});

apiRouter.post("/auth/logout", async (req, res) => {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const userId = req.body.user_id ? Number(req.body.user_id) : undefined;
  const result = await AuthSessionService.logout(token, userId);
  res.status(result.status).json(result);
});

apiRouter.get("/auth/session", (req, res) => {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const sessionData = AuthSessionService.validateToken(token);
  if (!sessionData) {
    return res.status(401).json(ApiResponse.buildFailure("Invalid or expired session token", ["Session expired"], {}, 401));
  }
  res.json(ApiResponse.buildSuccess(sessionData, "Session active"));
});

// Taxpayer Property & Valuation routes
apiRouter.get("/taxpayer", (req, res) => {
  const list = propertyDb.getAllTaxpayers();
  res.json(ApiResponse.buildSuccess(list, "Taxpayer registry list"));
});

apiRouter.get("/taxpayer/:id/dossier", (req, res) => {
  const id = Number(req.params.id);
  const dossier = propertyDb.getTaxpayerDossier(id);
  if (!dossier) {
    return res.status(404).json(ApiResponse.buildFailure("Taxpayer not found", ["Not found"]));
  }
  res.json(ApiResponse.buildSuccess(dossier, "Taxpayer complete portfolio dossier"));
});

apiRouter.get("/taxpayer-properties/masters", (req, res) => {
  const masters = propertyDb.getMasterTables();
  res.json(ApiResponse.buildSuccess(masters, "Taxpayer masters loaded"));
});
