/**
 * gtax Enterprise - Next.js Web Client Tier
 * Clean Next.js 15+ App Router & React 19 Client Engine
 * Connects directly to Single Common Entry Point API (/api/v1)
 */

// Application Main Entry Point
export { default as App } from "../src/App.tsx";

// Core Domain Workflow Panels
export { TaxpayerWorkflowPanel } from "../src/modules/TaxpayerWorkflow/panel.tsx";
export { OverallCalculationPanel } from "../src/modules/TaxCalculation/OverallCalculationPanel.tsx";
export { RatesMasterPanel } from "../src/modules/RatesMaster/panel.tsx";
export { AiAgentPanel } from "../src/modules/AiAgent/panel.tsx";
export { JurisdictionPanel } from "../src/modules/Jurisdiction/panel.tsx";
export { UserPanel } from "../src/modules/User/panel.tsx";
export { RealtimeSyncPanel } from "../src/modules/RealtimeSync/panel.tsx";
export { ArchitectureExplorerPanel } from "../src/modules/ArchitectureExplorer/panel.tsx";
export { ReportsPanel } from "../src/modules/Reports/panel.tsx";
export { SessionLogsPanel } from "../src/modules/Auth/sessionLogsPanel.tsx";
export { AuthPanel } from "../src/modules/Auth/panel.tsx";

// Next.js Native Client Components
export { ClientHeader } from "./components/ClientHeader.tsx";
export { VoiceMicAction } from "./components/VoiceMicAction.tsx";

// Next.js Custom Hooks
export { useTaxpayer } from "./hooks/useTaxpayer.ts";
export { useTaxCalculation } from "./hooks/useTaxCalculation.ts";
export { useVoiceCommands } from "./hooks/useVoiceCommands.ts";

// Next.js API Services
export { apiClient } from "./services/apiClient.ts";

// Reusable Universal Components
export { AiTaxChatbotModal } from "../src/components/AiTaxChatbotModal.tsx";
export { FlutterMobileAppSimulator } from "../src/components/FlutterMobileAppSimulator.tsx";
export { DbColumnLanguageModal } from "../src/components/DbColumnLanguageModal.tsx";
export { GlobalTaxpayerSearch } from "../src/components/GlobalTaxpayerSearch.tsx";
export { UserMenu } from "../src/components/UserMenu.tsx";
export { TaxLiabilityComparisonChart } from "../src/components/TaxLiabilityComparisonChart.tsx";

// Unified Client API Controller & I18n Engine
export { ApiController } from "../src/api/controller.ts";
export { baseUiTranslations, getDbColumnLabel } from "../src/utils/i18n.ts";
export type { SupportedLang, SupportedTheme } from "../src/utils/i18n.ts";

// Client Configuration & Universal Types
export * from "./config.ts";
export * from "./types.ts";
