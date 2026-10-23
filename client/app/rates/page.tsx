/**
 * gtax Enterprise - Next.js App Router Rates Master Page
 * Municipal Land, Malpot, Building, Depreciation, and Progressive Slab Rates
 */

import React from "react";
import { RatesMasterPanel } from "../../../src/modules/RatesMaster/panel.tsx";

export default function NextJsRatesPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Rates Master Matrix & Valuation Parameters
        </h1>
        <p className="text-sm text-slate-500">
          Next.js App Router domain view for managing municipal land rates, statutory rates, depreciation schedules, and progressive slab rules.
        </p>
      </div>

      <RatesMasterPanel currentLang="eng" />
    </div>
  );
}
