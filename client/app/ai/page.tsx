/**
 * gtax Enterprise - Next.js App Router AI Tax Assistant Page
 * Gemini 2.5 Flash Autonomous Agent & Speech Command Processing
 */

import React from "react";
import { AiAgentPanel } from "../../../src/modules/AiAgent/panel.tsx";

export default function NextJsAiPage() {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Gemini AI Tax Intelligence & Voice Assistant
        </h1>
        <p className="text-sm text-slate-500">
          Next.js App Router domain view for AI-assisted auditing, natural language tax queries, and automated voice workflow execution.
        </p>
      </div>

      <AiAgentPanel />
    </div>
  );
}
