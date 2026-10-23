/**
 * gtax Enterprise - Next.js App Router Taxpayer Page
 * 1-Door Taxpayer continuous registration and citizen property portfolio
 */

import React from "react";
import { TaxpayerWorkflowPanel } from "../../../src/modules/TaxpayerWorkflow/panel.tsx";

export default function NextJsTaxpayerPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Citizen Taxpayer Registration & Dossier
        </h1>
        <p className="text-sm text-slate-500">
          Next.js App Router domain view for 1-Door Taxpayer registration, property linking, and valuation.
        </p>
      </div>

      <TaxpayerWorkflowPanel currentLang="eng" />
    </div>
  );
}
