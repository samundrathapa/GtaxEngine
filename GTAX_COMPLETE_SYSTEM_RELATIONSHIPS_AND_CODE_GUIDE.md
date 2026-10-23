# gtax Enterprise - Complete System Relationships & Code Modification Guide

> **Single Source of Truth** for Developers and Software Engineers.  
> Explains how **Client (Next.js / React 19)**, **Server (Node.js Express / BaseFrame Microservices)**, **Database (PostgreSQL Relational Tables with 7 Mandatory Audit Columns)**, and **AI (Google Gemini 2.5 Flash & Voice Command Engine)** are interconnected, and provides practical step-by-step instructions for modifying the codebase.

---

## 📑 Table of Contents
1. [Architectural Overview & 4-Tier Topology](#1-architectural-overview--4-tier-topology)
2. [End-to-End System Relationships & Data Flow Diagram](#2-end-to-end-system-relationships--data-flow-diagram)
3. [Tier 1: Client Tier (Next.js 15+ & React 19)](#3-tier-1-client-tier-nextjs-15--react-19)
4. [Tier 2: Server Tier (Express & BaseFrame Microservices)](#4-tier-2-server-tier-express--baseframe-microservices)
5. [Tier 3: Database Tier (PostgreSQL & 7 Audit Columns Contract)](#5-tier-3-database-tier-postgresql--7-audit-columns-contract)
6. [Tier 4: Artificial Intelligence Tier (Gemini 2.5 Flash & Speech Engine)](#6-tier-4-artificial-intelligence-tier-gemini-25-flash--speech-engine)
7. [Step-by-Step Code Modification Tutorials](#7-step-by-step-code-modification-tutorials)
   - [Tutorial A: Adding a New Field Across All Tiers](#tutorial-a-adding-a-new-field-across-all-tiers)
   - [Tutorial B: Adding a New Voice Command](#tutorial-b-adding-a-new-voice-command)
   - [Tutorial C: Modifying Tax Calculation Formulas](#tutorial-c-modifying-tax-calculation-formulas)
   - [Tutorial D: Creating a New Database Table with Audit Contract](#tutorial-d-creating-a-new-database-table-with-audit-contract)
8. [Master File Reference Map](#8-master-file-reference-map)

---

## 1. Architectural Overview & 4-Tier Topology

The **gtax** system is structured into four cleanly isolated tiers coordinated by a **Single Common Entry Point**:

```
                                  [ USER / OPERATOR ]
                        (Web Browser, Field Tablet, Voice Audio)
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    ▼                                             ▼
          ┌─────────────────────┐                       ┌─────────────────────┐
          │   client/ (Web)     │                       │  mobileapp/ (Field) │
          │ Next.js 15+ App     │                       │ Flutter 3.x         │
          │ React 19 + Tailwind │                       │ iOS & Android Native│
          └──────────┬──────────┘                       └──────────┬──────────┘
                     │                                             │
                     └──────────────────────┬──────────────────────┘
                                            ▼
                           HTTPS REST & WebSockets (Port 3000)
                     ┌─────────────────────────────────────────────┐
                     │     SINGLE COMMON ENTRY POINT: /api/v1      │
                     │          (server.ts / server/entry.ts)      │
                     └──────────────────────┬──────────────────────┘
                                            │
        ┌───────────────────────────────────┼───────────────────────────────────┐
        ▼                                   ▼                                   ▼
┌───────────────────────┐       ┌───────────────────────┐       ┌───────────────────────┐
│     server/ Tier      │       │     Database Tier     │       │       ai/ Tier        │
│ Node Express Services │       │ PostgreSQL Relational │       │ Google Gemini 2.5     │
│ BaseFrame Controllers │◄─────►│ 7 Mandatory Audit Cols│◄─────►│ Voice Intent Parser   │
│ ApiServiceStruct      │       │ DbMigration (V001..)  │       │ Auto-Action Engine    │
└───────────────────────┘       └───────────────────────┘       └───────────────────────┘
```

### Core Architecture Principles:
- **Client Tier (`/client`, `/src`)**: Pure Next.js App Router & React 19 SPA. **Zero React Native code**.
- **Server Tier (`/server`, `/backend`)**: Single Common Entry Point API at `/api/v1`. Employs the **BaseFrame** pattern where services inherit standardized CRUD controllers, raw SQL executors, and standard `ApiResponse` models.
- **Database Tier (`/backend/DbMigration`, `src/server/ApiServiceStruct`)**: Relational PostgreSQL tables where **every single entity strictly implements the 7 mandatory audit columns**.
- **AI Tier (`/ai`, `/src/components/AiTaxChatbotModal.tsx`)**: Google Gemini 2.5 Flash integrated with Web Speech recognition. Voice commands auto-execute database mutations and window state transitions.
- **Mobile App Tier (`/mobileapp`)**: Complete Flutter 3.x cross-platform project for iOS and Android, mirroring all 5-step property valuation calculations and AI voice triggers.

---

## 2. End-to-End System Relationships & Data Flow Diagram

The following sequence illustrates what happens when an operator speaks:  
**`"add landrate 1 to land rate"`** or **`"open taxpayer"`**:

```
+-------------+      +------------------+      +-------------------+      +------------------+      +---------------+
|   Operator  |      | Next.js Client   |      | Server /api/v1    |      | Database Engine  |      | Gemini 2.5 AI |
+-------------+      +------------------+      +-------------------+      +------------------+      +---------------+
       |                      |                          |                          |                       |
       | 1. Speaks command    |                          |                          |                       |
       |--------------------->|                          |                          |                       |
       |                      | 2. Web Speech API        |                          |                       |
       |                      |    detects final phrase  |                          |                       |
       |                      |                          |                          |                       |
       |                      | 3. Parses intent locally |                          |                       |
       |                      |    or posts to AI endpoint                          |                       |
       |                      |---------------------------------------------------------------------------->|
       |                      |                                                     | 4. Returns structured |
       |                      |                                                     |    intent & SQL params|
       |                      |<----------------------------------------------------------------------------|
       |                      |                                                     |                       |
       |                      | 5. POST /api/v1/rates/land_rate                     |                       |
       |                      |------------------------->|                          |                       |
       |                      |                          | 6. BaseFrame Service     |                       |
       |                      |                          |    attaches 7 audit cols |                       |
       |                      |                          |    (insert_by, insert_on)|                       |
       |                      |                          |------------------------->|                       |
       |                      |                          |                          | 7. Inserts record     |
       |                      |                          |                          |    into tbl_land_rate |
       |                      |                          |<-------------------------|                       |
       |                      | 8. Returns 201 Created   |                          |                       |
       |                      |<-------------------------|                          |                       |
       |                      |                                                     |                       |
       |                      | 9. Emits window event:                              |                       |
       |                      |    'gtax:rates_updated'                             |                       |
       |                      |    (RatesMasterPanel refreshes without page reload) |                       |
       |                      |                                                     |                       |
       | 10. Speaks TTS audio |                                                     |                       |
       |     & opens card     |                                                     |                       |
       |<---------------------|                                                     |                       |
```

---

## 3. Tier 1: Client Tier (Next.js 15+ & React 19)

### 3.1 Directory Organization

```
client/
├── README.md                 # Tier summary (Next.js 15 App Router, zero React Native)
├── next.config.js            # Reverse proxy config (/api/* -> http://localhost:3000/api/*)
├── config.ts                 # Base URLs, versioning, single common entry path
├── types.ts                  # Next.js page props, layout props, API models
├── index.ts                  # Master re-export file for panels, hooks, and services
│
├── app/                      # Next.js 15 App Router Routes
│   ├── layout.tsx            # HTML shell, metadata, theme, and global styling
│   ├── page.tsx              # Main Dashboard (hosts App.tsx)
│   ├── taxpayer/page.tsx     # 1-Door Taxpayer continuous registration
│   ├── calculation/page.tsx  # 5-Step Property Valuation & Multi-Year Tax Engine
│   ├── rates/page.tsx        # Land, Building, Malpot, Slab Rates Master
│   ├── ai/page.tsx           # Gemini AI Assistant & Voice Command view
│   └── reports/page.tsx      # Revenue analytics, ward stats, and audit logs
│
├── components/               # Next.js Client Components
│   ├── ClientHeader.tsx      # Header with brand, quick voice mic, lang toggle
│   └── VoiceMicAction.tsx    # Standalone pulsing mic with auto-submission
│
├── hooks/                    # Custom React Hooks
│   ├── useTaxpayer.ts        # Taxpayer CRUD, today's registrations, search
│   ├── useTaxCalculation.ts  # 5-Step valuation math, rebates, penalties, DB save
│   └── useVoiceCommands.ts   # SpeechRecognition + TTS auto-execution
│
└── services/                 # Next.js API Services
    └── apiClient.ts          # Typed HTTP wrapper calling /api/v1 endpoints
```

### 3.2 Client Domain Pattern (`src/modules/*`)
Each business domain inside `src/modules/` adheres to a strict, ExtJS-inspired MVC-like separation:
- `panel.tsx`: The primary View component (renders tables, forms, charts, Tailwind UI).
- `controller.ts`: Handles event listeners, validation logic, and calls `ApiController`.
- `model.ts`: TypeScript data schemas, form defaults, and table column definitions.
- `window.tsx`: Modal dialogs or popup detail inspectors for that specific domain.

### 3.3 Event-Driven Real-Time Sync
The client avoids full page reloads by using custom DOM events:
- `window.dispatchEvent(new CustomEvent("gtax:rates_updated"))`: Dispatched when a rate is inserted via voice or form; triggers `RatesMasterPanel` to auto-fetch new records.
- `window.dispatchEvent(new CustomEvent("gtax:taxpayer_updated"))`: Triggers global taxpayer search and dossier refresh.

---

## 4. Tier 2: Server Tier (Express & BaseFrame Microservices)

### 4.1 Entry Point & Routing
- **Entry File**: `/server.ts`
  - Runs Express on Port 3000.
  - In development, Vite middleware is mounted: `vite.middlewares`.
  - Exposes all Single Common Entry Point routes under `/api/v1/*`.
- **Coordinator**: `/server/entry.ts`
  - Exposes `CommonEntryPointCoordinator.getSystemManifest()` at `/api/v1/entry/manifest`.
  - Returns live tier statuses for `client`, `server`, `ai`, and `mobileapp`.

### 4.2 The BaseFrame Pattern (`/backend/BaseFrame`)
The server architecture follows enterprise inheritance:
1. `BaseCrudController`: Standardizes REST endpoints (`GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`).
2. `BaseService`: Implements input validation, business rule evaluation, Redis caching, and audit logging.
3. `BaseRepo`: Manages raw SQL execution and enforces the **7 Mandatory Audit Columns**.
4. `ApiResponse`: Standardizes every HTTP response across all microservices:
   ```json
   {
     "success": true,
     "statusCode": 200,
     "data": { ... },
     "message": "Operation completed successfully",
     "validation_errors": null,
     "timestamp": "2026-10-19T08:30:00.000Z"
   }
   ```

### 4.3 Active Microservices (`src/server/ApiServiceStruct/TaxpayerPropertyService.ts`)
Manages:
- Citizen registration (`tbl_taxpayer`)
- Land and property records (`tbl_property_master`)
- Multi-category rate matrices (`tbl_land_rate`, `tbl_malpot_rate`, `tbl_building_rate`, `tbl_tax_rate_rule`)
- Valuation calculations and multi-year tax liabilities (`tbl_tax_calculation_year`)

---

## 5. Tier 3: Database Tier (PostgreSQL & 7 Audit Columns Contract)

### 5.1 Mandatory Audit Contract
Every table created or modified in **gtax** MUST include these 7 audit columns without exception:

| Column Name | SQL Type | Description |
| :--- | :--- | :--- |
| `insert_by` | `VARCHAR(64)` | User ID or System Actor who created the row |
| `insert_on` | `TIMESTAMP / TIMESTAMPTZ` | Timestamp when row was inserted (UTC) |
| `update_by` | `VARCHAR(64)` | User ID or System Actor who last updated the row |
| `update_on` | `TIMESTAMP / TIMESTAMPTZ` | Timestamp when row was last modified (UTC) |
| `delete_by` | `VARCHAR(64)` | User ID who soft-deleted the record (NULL if active) |
| `deleted_on`| `TIMESTAMP / TIMESTAMPTZ` | Timestamp of soft-deletion (NULL if active) |
| `is_active` | `BOOLEAN DEFAULT TRUE` | Soft-delete flag (`TRUE` = active, `FALSE` = deleted) |

### 5.2 Core Entity-Relationship Diagram (ERD)

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│          tbl_taxpayer           │ 1       * │      tbl_property_master        │
├─────────────────────────────────┤───────────┼─────────────────────────────────┤
│ PK taxpayer_id   VARCHAR(64)    │           │ PK property_id     VARCHAR(64)  │
│    taxpayer_code VARCHAR(32)    │           │ FK taxpayer_id     VARCHAR(64)  │
│    full_name     VARCHAR(128)   │           │    property_code   VARCHAR(32)  │
│    phone_number  VARCHAR(32)    │           │    ward_no         INTEGER      │
│    pan_number    VARCHAR(32)    │           │    kitta_no        VARCHAR(64)  │
│    ward_no       INTEGER        │           │    total_area_sqft NUMERIC      │
│    [7 AUDIT COLUMNS]            │           │    [7 AUDIT COLUMNS]            │
└─────────────────────────────────┘           └────────────────┬────────────────┘
                 │ 1                                           │ 1
                 │                                             │
                 │ *                                           │ *
┌────────────────▼────────────────┐           ┌────────────────▼────────────────┐
│    tbl_tax_calculation_year     │           │         tbl_land_rate           │
├─────────────────────────────────┤           ├─────────────────────────────────┤
│ PK calc_id       VARCHAR(64)    │           │ PK rate_id         VARCHAR(64)  │
│ FK taxpayer_id   VARCHAR(64)    │           │    rate_code       VARCHAR(32)  │
│ FK property_id   VARCHAR(64)    │           │    rate_name       VARCHAR(128) │
│    fiscal_year   VARCHAR(16)    │           │    rate_value      NUMERIC      │
│    total_tax     NUMERIC        │           │    road_type       VARCHAR(64)  │
│    [7 AUDIT COLUMNS]            │           │    [7 AUDIT COLUMNS]            │
```

### 5.3 Existing PostgreSQL Setup & Where to Change DB Config

If PostgreSQL is already installed on your machine or server, **there is no need to reinstall or install a separate database**. You only need to create `gtax_db` and the role `gtax_user`.

#### 1. Quick One-Command Setup on Your Existing PostgreSQL
Run the all-in-one script as the PostgreSQL superuser (`postgres`):
```bash
# On Linux:
sudo -u postgres psql -f database/setup_gtax_db.sql

# Or using the automated helper script:
chmod +x database/setup_postgres.sh && ./database/setup_postgres.sh

# On Windows / macOS:
psql -U postgres -f database/setup_gtax_db.sql
```

#### 2. Manual SQL Commands:
```sql
CREATE ROLE gtax_user LOGIN PASSWORD 'gtax_password';
ALTER ROLE gtax_user CREATEDB;
CREATE DATABASE gtax_db OWNER gtax_user;
GRANT ALL PRIVILEGES ON DATABASE gtax_db TO gtax_user;
\c gtax_db
\i database/02_init_gtax_schema.sql
```

#### 3. Where to Change DB Config in the Codebase:
- **Root `.env` file**:
  ```env
  DB_HOST="localhost"
  DB_PORT="5432"
  DB_NAME="gtax_db"
  DB_USER="gtax_user"
  DB_PASSWORD="gtax_password"
  DB_SSL="false"
  
  # Or unified connection string:
  DATABASE_URL="postgresql://gtax_user:gtax_password@localhost:5432/gtax_db"
  ```
- **Node.js Pool Connector**: `src/server/db/postgresPool.ts` (manages the `pg.Pool` connection and status).
- **BaseFrame Connector**: `src/server/BaseFrame/db/DbConnects.ts` and `backend/BaseFrame/db/DbConnects.py`.
- **Live Status Inspector**: Check `GET /api/v1/db/status` to view connection health and masked configuration.
- **Dedicated Guide**: See `docs/DATABASE_CONFIGURATION.md`.

---

## 6. Tier 4: Artificial Intelligence Tier (Gemini 2.5 Flash & Speech Engine)

### 6.1 Gemini SDK Integration
- Uses the modern `@google/genai` TypeScript SDK:
  ```ts
  import { GoogleGenAI } from "@google/genai";
  const ai = new GoogleGenAI({});
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  ```
- Located in `/ai/GeminiFeaturesService.ts` and `/ai/AiAgentRoutes.ts`.

### 6.2 Speech Recognition & Automated Execution Engine
- Dual Microphone UI:
  1. **Header Mic Button** (`src/App.tsx` & `client/components/VoiceMicAction.tsx`): Allows instant voice commands from anywhere in the application.
  2. **Chatbot Modal Mic** (`src/components/AiTaxChatbotModal.tsx`): Provides conversation context, formula assistance, and interactive preview cards.
- **Auto-Execution Logic**:
  - `recognition.onresult`: Captures transcripts and detects `isFinal = true`.
  - Automatically triggers `handleSendMessage()` after a 350ms debounce.
  - Evaluates intents:
    - `"open taxpayer"`: Auto-navigates to Taxpayer registration and closes the chatbot modal.
    - `"close chat"`: Closes the chatbot modal.
    - `"list taxpayer today registered"`: Queries `/api/v1/taxpayers` (or date filter) and displays citizen cards.
    - `"add landrate 1 to land rate"`: Calls `ApiController.saveRateItem("land_rate", ...)` and dispatches `gtax:rates_updated`.
  - Speaks immediate Text-To-Speech (TTS) confirmation to the operator.

---

## 7. Step-by-Step Code Modification Tutorials

### Tutorial A: Adding a New Field Across All Tiers
*Scenario: Adding `water_harvesting_rebate` (numeric) to property tax calculations.*

#### 1. Database Tier:
Add column in `backend/DbMigration/V006__add_water_harvesting.sql`:
```sql
ALTER TABLE tbl_tax_calculation_year
ADD COLUMN water_harvesting_rebate NUMERIC DEFAULT 0.00;
```

#### 2. Server Tier:
In `src/server/ApiServiceStruct/TaxpayerPropertyService.ts`:
```ts
// Update interface:
export interface TblTaxCalculationYear {
  // ... existing fields
  water_harvesting_rebate?: number;
  // 7 mandatory audit columns
  insert_by: string;
  // ...
}
```

#### 3. Client Calculation Hook:
In `client/hooks/useTaxCalculation.ts` & `src/modules/TaxCalculation/OverallCalculationPanel.tsx`:
```ts
// In computeLocalValuation:
const waterRebate = params.hasWaterHarvesting ? 500 : 0;
const netPayable = Math.max(0, grossTax - rebateAmount - waterRebate + penaltyAmount + params.sanitationCess);
```

#### 4. UI Form Panel:
In `src/modules/TaxCalculation/OverallCalculationPanel.tsx`:
```tsx
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={hasWaterHarvesting}
    onChange={(e) => setHasWaterHarvesting(e.target.checked)}
  />
  <span>Water Harvesting Rebate (NPR 500)</span>
</label>
```

---

### Tutorial B: Adding a New Voice Command
*Scenario: Adding a voice command `"show ward 3 taxpayers"`.*

#### 1. Add Intent Parsing in `src/components/AiTaxChatbotModal.tsx` and `client/hooks/useVoiceCommands.ts`:
```ts
if (lower.includes("show ward") || lower.includes("ward 3")) {
  speakText("Filtering taxpayers for Ward 3");
  // Set tab to taxpayer
  if (onOpenNewTaxpayer) {
    onOpenNewTaxpayer();
  }
  // Dispatch custom filter event
  window.dispatchEvent(new CustomEvent("gtax:filter_ward", { detail: { ward: 3 } }));
  return;
}
```

#### 2. Listen to Event in `src/modules/TaxpayerWorkflow/panel.tsx`:
```ts
useEffect(() => {
  const handleWardFilter = (e: CustomEvent) => {
    setSelectedWard(e.detail.ward);
  };
  window.addEventListener("gtax:filter_ward", handleWardFilter as EventListener);
  return () => window.removeEventListener("gtax:filter_ward", handleWardFilter as EventListener);
}, []);
```

---

### Tutorial C: Modifying Tax Calculation Formulas
*Scenario: Adjusting the RCC structural building base rate from NPR 2,800/sqft to NPR 3,000/sqft.*

#### 1. Web Client:
In `src/modules/TaxCalculation/OverallCalculationPanel.tsx` (and `client/hooks/useTaxCalculation.ts`):
```ts
// Locate building rate parameter:
const DEFAULT_RCC_BASE_RATE = 3000; // Updated from 2800
```

#### 2. Mobile App (Flutter):
In `mobileapp/lib/screens/calculation_screen.dart` (and `src/components/FlutterMobileAppSimulator.tsx`):
```dart
// Update Flutter building rate default:
double buildingRatePerSqft = 3000.0;
```

#### 3. Rates Master:
Update or seed in `src/server/ApiServiceStruct/TaxpayerPropertyService.ts`:
```ts
{
  rate_code: "BR-RCC-01",
  rate_name: "RCC Frame Structure Grade A",
  rate_value: 3000,
  is_active: true,
  // mandatory audit columns...
}
```

---

### Tutorial D: Creating a New Database Table with Audit Contract
*Scenario: Creating a new table `tbl_tax_exemption_certificate`.*

#### 1. Create Migration SQL:
```sql
CREATE TABLE tbl_tax_exemption_certificate (
  certificate_id VARCHAR(64) PRIMARY KEY,
  taxpayer_id VARCHAR(64) NOT NULL REFERENCES tbl_taxpayer(taxpayer_id),
  exemption_type VARCHAR(64) NOT NULL,
  exemption_percentage NUMERIC NOT NULL,
  valid_until DATE NOT NULL,
  
  -- Mandatory 7 Audit Columns
  insert_by VARCHAR(64) NOT NULL,
  insert_on TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_by VARCHAR(64) NOT NULL,
  update_on TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delete_by VARCHAR(64),
  deleted_on TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);
```

#### 2. Expose in `server.ts`:
```ts
app.get("/api/v1/exemptions/:taxpayerId", async (req, res) => {
  const records = await db.query(
    "SELECT * FROM tbl_tax_exemption_certificate WHERE taxpayer_id = $1 AND is_active = TRUE",
    [req.params.taxpayerId]
  );
  res.json({ success: true, statusCode: 200, data: records });
});
```

---

## 8. Master File Reference Map

| Directory / File | Tier | Responsibility |
| :--- | :--- | :--- |
| `client/` | **Client (Next.js)** | Next.js 15 App Router pages, components, hooks, and apiClient |
| `client/app/page.tsx` | **Client (Next.js)** | Main Next.js dashboard entry route |
| `client/hooks/useVoiceCommands.ts` | **Client (Next.js)** | Web speech recognition & automated intent execution hook |
| `src/App.tsx` | **Client (React)** | Core application shell, tab routing, header mic, and modals |
| `src/components/AiTaxChatbotModal.tsx` | **Client / AI** | Speech auto-submission, voice command routing, interactive cards |
| `src/modules/TaxpayerWorkflow/` | **Client** | 1-Door continuous citizen registration & property link wizard |
| `src/modules/TaxCalculation/` | **Client** | 5-Step Property Valuation and progressive slab tax computation |
| `src/modules/RatesMaster/` | **Client** | Municipal rate matrices (Land, Malpot, Building, Slabs) |
| `server.ts` | **Server** | Express server entry point, `/api/v1` routes, Vite middleware |
| `server/entry.ts` | **Server** | Single Common Entry Point manifest (`/api/v1/entry/manifest`) |
| `src/server/ApiServiceStruct/` | **Server / DB** | Domain CRUD services enforcing the 7 audit columns contract |
| `backend/BaseFrame/` | **Server** | Abstract base controllers, services, raw SQL repos, Redis cache |
| `backend/DbMigration/` | **Database** | Sequential SQL migrations (V001..V999) |
| `ai/GeminiFeaturesService.ts` | **AI** | `@google/genai` TypeScript SDK integration |
| `mobileapp/` | **Mobile** | Flutter 3.x cross-platform iOS & Android mobile application |
| `logininfo.txt` | **Docs** | System login credentials, demo accounts, and audit contracts |

---

*Documentation Version: 2.5.0 - Fully synchronized across Next.js Client, Server, Database, and AI Tiers.*
