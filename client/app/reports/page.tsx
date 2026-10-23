/**
 * gtax Enterprise - Next.js App Router Reports Page
 * Municipal Revenue Reports & Multi-Format Exports
 */

import React from "react";
import { ReportsPanel } from "../../../src/modules/Reports/panel.tsx";

export default function NextJsReportsPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Municipal Revenue & Tax Liability Reports
        </h1>
        <p className="text-sm text-slate-500">
          Next.js App Router domain view for ward-wise summaries, taxpayer rosters, and collection reports.
        </p>
      </div>

      <ReportsPanel />
    </div>
  );
}
