# gtax Enterprise - Next.js Web Client Tier

This directory represents the **pure Next.js (App Router) & React 19 Client Tier** of the gtax Enterprise Tax Liabilities & Architecture Engine.

> **Important Architecture Clarification**:
> - The client tier is **100% Next.js 15+ & React 19** with Tailwind CSS v4 and TypeScript.
> - **There is NO React Native** in the web client tier. Any mobile access is powered either directly via the responsive Next.js web application or natively via the dedicated **Flutter 3.x** cross-platform engine located in `/mobileapp`.

---

## 🏗️ Directory Structure

```
client/
├── README.md               # Architecture documentation & developer guide
├── next.config.js          # Next.js config with reverse-proxy rewrites to /api/v1
├── config.ts               # Client runtime configuration & API endpoints
├── types.ts                # TypeScript types for Next.js pages, hooks, and services
├── index.ts                # Master export file for all client modules & components
│
├── app/                    # Next.js 15 App Router Structure
│   ├── layout.tsx          # Root Next.js Layout (HTML shell, Theme, Navigation)
│   ├── page.tsx            # Main Portal Dashboard (Municipal statistics & workflows)
│   ├── taxpayer/
│   │   └── page.tsx        # 1-Door Taxpayer Registration & Dossier Management
│   ├── calculation/
│   │   └── page.tsx        # 5-Step Property Valuation & Multi-Year Tax Engine
│   ├── rates/
│   │   └── page.tsx        # Rates Master Matrix (Land, Malpot, Building, Slabs)
│   ├── ai/
│   │   └── page.tsx        # Gemini AI Assistant & Voice Command Execution
│   └── reports/
│       └── page.tsx        # Multi-Format Municipal Tax Reports & Audit Ledger
│
├── components/             # Reusable Next.js Client Components
│   ├── ClientHeader.tsx    # Header with Quick Voice Command Mic & Language switcher
│   └── VoiceMicAction.tsx  # Web Speech API voice trigger with auto-execution
│
├── hooks/                  # Next.js Custom React Hooks
│   ├── useTaxpayer.ts      # Taxpayer CRUD, search, and dossier loading
│   ├── useTaxCalculation.ts# 5-Step valuation math, rebates, penalties, & persistent save
│   └── useVoiceCommands.ts # Voice recognition with automated intent execution
│
└── services/               # Client-Side API Services (REST / JSON)
    └── apiClient.ts        # Typed HTTP client communicating with /api/v1 endpoints
```

---

## 🔌 Connection to Server, Database, and AI

1. **Server Connection**: All client requests target the Single Common Entry Point:
   - Base URL: `/api/v1`
   - Manifest: `/api/v1/entry/manifest`
   - Reverse proxy configured in `next.config.js` to route `/api/*` to the Node.js Express backend on port 3000.

2. **Database Integration**: The client never queries SQL directly. It interacts with the BaseFrame `ApiServiceStruct` controllers on the server, which enforce the **7 mandatory audit columns**:
   - `insert_by`, `insert_on`, `update_by`, `update_on`, `delete_by`, `deleted_on`, `is_active`.

3. **AI & Voice Command Integration**:
   - Voice commands spoken into the header or modal microphone (`"open taxpayer"`, `"close chat"`, `"list taxpayer today registered"`, `"add landrate 1 to land rate"`) are processed in real time.
   - Speech recognition detects final utterances, automatically triggers API updates, dispatches DOM events (`gtax:rates_updated`), and navigates the Next.js routes seamlessly.
