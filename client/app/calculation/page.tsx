/**
 * gtax Enterprise - Next.js App Router Tax Calculation Page
 * 5-Step Property Valuation and Multi-Year compounding tax liabilities
 */

import React from "react";
import { OverallCalculationPanel } from "../../../src/modules/TaxCalculation/OverallCalculationPanel.tsx";

export default function NextJsCalculationPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          5-Step Property Valuation & Multi-Year Tax Engine
        </h1>
        <p className="text-sm text-slate-500">
          Next.js App Router domain view for land rate valuation, structural depreciation, progressive tax slabs, rebates, and penalties.
        </p>
      </div>

      <OverallCalculationPanel />
    </div>
  );
}
