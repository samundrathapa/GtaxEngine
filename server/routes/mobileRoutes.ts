import { Router } from "express";
import { propertyDb } from "../../src/server/ApiServiceStruct/TaxpayerPropertyService.ts";
import { ApiResponse } from "../../src/server/BaseFrame/response/ApiResponse.ts";
import { AuthSessionService } from "../../src/server/ApiServiceStruct/AuthSessionService.ts";

export const mobileRouter = Router();

/**
 * Mobile-optimized manifest & initial boot configuration
 * Single common entry handshake for Flutter iOS and Android apps
 */
mobileRouter.get("/boot-config", (req, res) => {
  res.json(ApiResponse.buildSuccess({
    appName: "gtax Enterprise Mobile",
    version: "1.0.0",
    buildNumber: 1,
    targetPlatforms: ["ios", "android"],
    flutterSdkVersion: ">=3.2.0 <4.0.0",
    singleCommonEntry: {
      apiBaseUrl: "/api/v1",
      webAppUrl: "/",
      aiEndpoint: "/api/v1/ai",
      mobileSyncEndpoint: "/api/v1/mobile"
    },
    supportedLocales: [
      { code: "eng", label: "English", flag: "🇺🇸" },
      { code: "nep", label: "नेपाली", flag: "🇳🇵" },
      { code: "ind", label: "हिन्दी", flag: "🇮🇳" }
    ],
    featureFlags: {
      voiceAiEnabled: true,
      offlineDossierCache: true,
      cameraOcrEnabled: true,
      hybridWebBridge: true,
      biometricAuth: true
    },
    municipalInfo: {
      name: "Kathmandu Metropolitan City / Municipal Tax Revenue Board",
      fiscalYear: "2081/82 (2024/25)",
      currency: "NPR",
      helpline: "+977-1-4231481"
    }
  }, "Mobile boot configuration loaded"));
});

/**
 * Quick search endpoint optimized for mobile autocomplete
 */
mobileRouter.get("/quick-search", (req, res) => {
  const query = String(req.query.q || "").toLowerCase().trim();
  const allTaxpayers = propertyDb.getAllTaxpayers();

  if (!query) {
    const recents = allTaxpayers.slice(0, 5).map(tp => ({
      id: tp.id,
      code: tp.code,
      fullname: tp.fullanme,
      mobile: tp.mobile_no,
      ward: tp.ward_no,
      pan: tp.pan_vat_no || "N/A"
    }));
    return res.json(ApiResponse.buildSuccess(recents, "Recent taxpayers"));
  }

  const results = allTaxpayers.filter(tp => 
    tp.fullanme.toLowerCase().includes(query) ||
    tp.code.toLowerCase().includes(query) ||
    (tp.pan_vat_no && tp.pan_vat_no.toLowerCase().includes(query)) ||
    (tp.citizenship_no && tp.citizenship_no.toLowerCase().includes(query)) ||
    tp.mobile_no.includes(query)
  ).slice(0, 15).map(tp => ({
    id: tp.id,
    code: tp.code,
    fullname: tp.fullanme,
    mobile: tp.mobile_no,
    ward: tp.ward_no,
    pan: tp.pan_vat_no || "N/A",
    citizenship: tp.citizenship_no || "N/A"
  }));

  res.json(ApiResponse.buildSuccess(results, `Found ${results.length} taxpayer(s)`));
});

/**
 * Mobile dashboard summary counters
 */
mobileRouter.get("/dashboard-summary", (req, res) => {
  const taxpayers = propertyDb.getAllTaxpayers();
  const masterTables = propertyDb.getMasterTables();

  let totalPropertiesCount = 0;
  taxpayers.forEach(tp => {
    const dossier = propertyDb.getTaxpayerDossier(tp.id);
    if (dossier) {
      totalPropertiesCount += (dossier.lands.length + dossier.houses.length);
    }
  });

  res.json(ApiResponse.buildSuccess({
    totalTaxpayers: taxpayers.length,
    totalProperties: totalPropertiesCount,
    currentFiscalYear: "2081/82",
    pendingAssessments: Math.max(1, Math.floor(taxpayers.length * 0.3)),
    recentTaxpayersCount: Math.min(taxpayers.length, 10),
    activeWards: Array.from(new Set(taxpayers.map(t => t.ward_no))).sort((a,b) => a-b),
    unitCount: masterTables.units.length,
    landRateTypes: masterTables.landRates.length
  }, "Mobile dashboard summary retrieved"));
});

/**
 * Register mobile device for push notifications & sync token
 */
mobileRouter.post("/device-register", (req, res) => {
  const { deviceId, platform, appVersion, pushToken } = req.body;
  res.json(ApiResponse.buildSuccess({
    registered: true,
    deviceId: deviceId || "mobile-dev-001",
    platform: platform || "ios",
    syncChannel: `sync-${deviceId || "mobile-dev-001"}`,
    registeredAt: new Date().toISOString()
  }, "Mobile device registered for synchronization"));
});
