# Enterprise System Base - Application Architecture Blueprint

**Document Type:** Universal Foundation Platform & Microservices Architecture Blueprint  
**Design Pattern:** 4-Tier Symmetrical Clean Architecture (Client & Server) with BaseFrame Inheritance  
**Target:** Reusable Base Architecture for Any Enterprise Application (ERP, CRM, Billing, Portal, Workflow)  
**Version:** 2.0.0 (Foundation Core)  

---

## 1. Executive Summary & System Foundation Goals

This blueprint defines the **universal system foundation architecture**. It strips away domain-specific business logic so the core foundation—routing, BaseFrame inheritance, dynamic template generation, versioned schema migrations, audit invariants, resilient caching, and reverse-proxy deployment—can be ported cleanly into **any other enterprise software project**.

### Universal Architectural Guarantees
- **Inherited BaseFrame**: Every microservice/domain inherits base controller routing, business validation pipelines, raw query connectors, and standard `ApiResponse` envelopes directly from `BaseFrame`.
- **Symmetrical 4-Tier Layering**: Symmetrical structure on both frontend and backend (`Controller`, `Service`, `Model`, `Repo` / `Panel`).
- **Standardized Dynamic Templates**: Dynamic data-grid generation powered by `GetSearchTemplate`, `GetItemTemplate`, and `GetComboTemplate`.
- **Zero-Trust Multi-Tenancy & RBAC**: Header-based Bearer JWT verification, tenant fencing (`company_id`), and role-rights matrices.
- **Strict Immutable Audit Standard**: Enforced 7 audit columns across every single relational table in every database migration.
- **Resilient Dual-Mode Data Tier**: Fast TCP port probe (< 400ms) with zero-crash fallback to in-memory/Redis cache synchronization if PostgreSQL is offline or restarting.

---

## 2. Microservices Architecture & High-Level Topology

```
                +-------------------------------------------------------------+
                |                Next.js / React UI Client                     |
                |  [User]   [TaxCalculation]   [Jurisdiction]   [AiAgent(Voice)] |
                +------------------------------+------------------------------+
                                               |
                                     HTTPS REST / WSS / Bearer JWT
                                               v
+---------------------------------------------------------------------------------------------+
|                           API Gateway / Ingress Router (FastAPI)                             |
|          [BaseFrame Auth RBAC]   [Rate Limiting]   [Unified ApiResponse Formatter]           |
+------+--------------------------+---------------------------+------------------------+------+
       |                          |                           |                        |
       v                          v                           v                        v
+--------------+          +----------------+          +---------------+        +---------------+
| gtax-user    |          | gtax-tax-calc  |          | gtax-sync-cdc |        | gtax-ai-agent |
| microservice |          | microservice   |          | microservice  |        | microservice  |
+------+-------+          +-------+--------+          +-------+-------+        +-------+-------+
       |                          |                           |                        |
       |  Inherits BaseFrame:     |  Inherits BaseFrame:      |  Inherits BaseFrame:   | (Gemini/      |
       |  Controller, Service,    |  Repo, Dapper ORM,        |  Event store, CDC,     |  OpenAI/Grok) |
       |  Repo, Validation        |  Compounding Helpers      |  Pub/Sub Replicator    | + Voice Parser|
       v                          v                           v                        v
+---------------------------------------------------------------------------------------------+
|                           Enterprise Data Tier (PostgreSQL)                                  |
|   DbMigration versioned schemas: V001_core, V002_jurisdictions, V003_rules, V004_txs        |
|   Enforced audit columns: insert_by, insert_on, update_by, update_on, delete_by, is_active   |
+---------------------------------------------------------------------------------------------+
       |                                                                               |
       v                                                                               v
+------------------------------------+                               +-------------------------+
|     Distributed Redis Cache        |                               |  Multi-Format Reports   |
| (Dapper-style Cache & Invalidation)|                               | (PDF, Excel, HTML, CSV) |
+------------------------------------+                               +-------------------------+
```

### Universal Base Mapping (Porting This Topology to Any Project)

To re-use this exact 4-microservice topology for any other business domain (ERP, Healthcare, CRM, Fintech, Logistics):

| Layer / Component | Reference Implementation (`gtax`) | Universal Base Pattern (Your Project) | Inherited BaseFrame Capabilities |
| :--- | :--- | :--- | :--- |
| **Microservice 1** | `gtax-user` | `<project>-identity` | Inherits `BaseCrudController`, `BaseService`, `BaseRepo`. Manages JWT auth, tenant company fences, role matrices, user profiles, session logs. |
| **Microservice 2** | `gtax-tax-calc` | `<project>-core-business` | Inherits `BaseService` & `BaseRepo`. Manages the primary domain calculation engine, transaction ledgers, invoicing, and compounding logic. |
| **Microservice 3** | `gtax-sync-cdc` | `<project>-sync-cdc` | Inherits `BaseRepo` & event broker. Manages Change Data Capture (CDC), offline cache replication, WebSocket real-time updates, and conflict resolution. |
| **Microservice 4** | `gtax-ai-agent` | `<project>-ai-agent` | Pluggable LLM orchestrator (Gemini / OpenAI / Grok), speech/voice STT parser, action intent dispatch to BaseFrame controllers. |
| **API Gateway** | Express / FastAPI Router | API Ingress Gateway | Enforces Bearer JWT verification, rate limiting, and standard `ApiResponse` envelope formatting across all routes. |
| **Enterprise Data Tier** | PostgreSQL + versioned schemas | PostgreSQL / Relational DB | Sequential `V001..Vnnn` migrations, enforcing the mandatory 7-column audit standard across every table. |
| **Distributed Cache** | In-Memory + Redis sync | Redis / Memory Cache | Sub-millisecond lookup, Dapper-style micro-ORM mapping, zero-crash offline fallback via TCP port probing. |
| **Reports Engine** | Multi-Format Reporter | Unified Reporting Pipeline | Generates PDF, Excel, HTML, and CSV exports using uniform query definitions. |

---

## 3. Server-Side Foundation Directory Structure

```
/backend (or /src/server)
│
├── BaseFrame/                         # Universal Foundation Framework (Domain-Agnostic)
│   ├── controller/
│   │   └── base_crud_controller.ts    # REST endpoints, GetSearchTemplate, GetItemTemplate, GetCombo
│   ├── services/
│   │   └── base_service.ts            # Business logic lifecycle, validation pipelines, audit injection
│   ├── repo/
│   │   └── base_repo.ts               # Parameterized SQL builder, soft-delete filters, CRUD abstractions
│   ├── cache/
│   │   └── redis_cache_manager.ts     # Redis replication client & Dapper-style micro-ORM mapper
│   ├── reports/
│   │   └── report_engine.ts           # Multi-format report export pipeline (PDF, Excel, HTML, CSV)
│   ├── response/
│   │   └── api_response.ts            # Standard envelope: success, status, data, message, errors, validationErrors
│   ├── auth/
│   │   └── rbac_handler.ts            # Bearer token validator, tenant company fence, permission matrix
│   └── db/
│       └── DbConnects.ts              # Unified connection manager & raw SQL executor
│
├── DbMigration/                       # Sequential Versioned SQL Migrations (V001..Vnnn)
│   ├── V001__init_core_security.sql   # Users, roles, rights, session logs, audit tables
│   ├── V002__create_tenants.sql       # Companies, organizational units, jurisdictions
│   ├── V003__create_master_rules.sql  # Universal classification, lookup tables & matrix rules
│   ├── V004__create_transactions.sql  # Financial transactions, line items, and ledgers
│   ├── V005__create_cdc_events.sql    # Event log for real-time synchronization
│   └── migration_runner.ts            # Idempotent runner with schema_version_tracker
│
├── ApiServiceStruct/                  # Domain Services (Inheriting BaseFrame)
│   ├── identity_api_service.ts        # Inherits BaseCrudController, BaseService, BaseRepo
│   ├── business_api_service.ts        # Inherits BaseFrame + domain-specific calculation algorithms
│   ├── reporting_api_service.ts       # Inherits BaseFrame for ad-hoc queries & report generation
│   └── sync_event_api_service.ts      # Inherits BaseFrame for CDC real-time event streaming
│
└── StartDomain/                       # Domain Orchestrator & Multi-Provider AI
    ├── domain_registry.ts             # App bootstrap, middleware mounting, service discovery
    ├── business_domain.ts             # Transaction & calculation pipeline coordinator
    ├── realtime_sync_domain.ts        # Conflict resolution & event replication engine
    └── ai_orchestrator_domain.ts      # Multi-LLM provider (Gemini / OpenAI / Grok) + Action Parser
```

---

## 4. Symmetrical 4-Tier Clean Architecture

To allow teams to work independently and scale maintenance, every module adheres to an identical 4-tier symmetrical pattern on both frontend and backend:

```
[ Frontend: src/clientside/<Entity>/ ]          [ Backend: src/serverside/<Entity>/ ]
+------------------------------------+          +------------------------------------+
|  <Entity>Panel.tsx                 |          |  <Entity>Controller.ts             |
|  (Data grid, filter bar, actions)  |          |  (HTTP routes, template dispatch)  |
+-----------------+------------------+          +-----------------+------------------+
                  |                                               |
                  v                                               v
+-----------------+------------------+          +-----------------+------------------+
|  <Entity>Controller.ts             |  HTTP    |  <Entity>Service.ts                |
|  (UI event coordination, calls API)|<========>|  (Validation, business logic, audit)
+-----------------+------------------+          +-----------------+------------------+
                  |                                               |
                  v                                               v
+-----------------+------------------+          +-----------------+------------------+
|  <Entity>Model.ts                  |          |  <Entity>Repo.ts                   |
|  (TypeScript contracts & schemas)  |          |  (SQL queries, parameterized params)
+------------------------------------+          +-----------------+------------------+
                                                                  |
                                                                  v
                                                +-----------------+------------------+
                                                |  <Entity>Model.ts                  |
                                                |  (Server entity & DB interfaces)   |
                                                +------------------------------------+
```

### Standard Entity File Checklist

| Tier | Client-Side (`src/clientside/<Entity>/`) | Server-Side (`src/serverside/<Entity>/`) |
| :--- | :--- | :--- |
| **Tier 1 (Presentation / Routing)** | `<Entity>Panel.tsx`<br>• Search bar & filter inputs<br>• Dynamic grid derived from template<br>• Action buttons (Add, Edit, Delete, Export) | `<Entity>Controller.ts`<br>• `GET /api/<Entity>/GetSearchTemplate`<br>• `GET /api/<Entity>/GetItemTemplate`<br>• `GET /api/<Entity>/GetCombo`<br>• Standard REST `GET`, `POST`, `PUT`, `DELETE` |
| **Tier 2 (Logic / Coordination)** | `<Entity>Controller.ts`<br>• Event listeners & validation<br>• Calls backend via `ApiController`<br>• Manages loading & toast feedback | `<Entity>Service.ts`<br>• Business rules & domain invariants<br>• Audit field stamping (`insert_by`, `update_by`)<br>• Decoupled from HTTP `req`/`res` objects |
| **Tier 3 (Data Schema / Modeling)** | `<Entity>Model.ts`<br>• Client TypeScript interfaces<br>• Form state & filter models<br>• Grid column definitions | `<Entity>Model.ts`<br>• Server entity interfaces<br>• DTO input/output schemas<br>• Database column mappings |
| **Tier 4 (Persistence / UI Dialogs)**| `<Entity>Window.tsx` (or Modal)<br>• Add / Edit dialog modal<br>• Field validation & dirty state<br>• Save & Cancel lifecycle | `<Entity>Repo.ts`<br>• Parameterized SQL queries<br>• Automatic `is_deleted = false` filter<br>• Soft-delete updates |

---

## 5. Universal Standardized Template Endpoints

The system eliminates boilerplate by exposing three standardized metadata endpoints for every entity:

```
GET /api/<Entity>/GetSearchTemplate
GET /api/<Entity>/GetItemTemplate
GET /api/<Entity>/GetCombo
```

### 5.1 `GetSearchTemplate`
Provides runtime column metadata so grids, search fields, sorting, and widths are dynamically configured:
```json
{
  "success": true,
  "status": 200,
  "data": {
    "entityName": "User",
    "primaryKey": "id",
    "columns": [
      { "field": "id", "label": "ID", "type": "number", "sortable": true, "width": 80 },
      { "field": "code", "label": "Code", "type": "string", "sortable": true, "width": 120 },
      { "field": "fullname", "label": "Full Name", "type": "string", "sortable": true, "width": 200 },
      { "field": "email", "label": "Email", "type": "string", "sortable": true, "width": 180 },
      { "field": "is_active", "label": "Active Status", "type": "boolean", "sortable": true, "width": 100 }
    ],
    "defaultSort": { "field": "id", "direction": "ASC" },
    "pageSize": 25
  },
  "message": "Search template schema retrieved"
}
```

### 5.2 `GetItemTemplate`
Supplies zero-state initialization for forms without hardcoding field defaults on the frontend:
```json
{
  "success": true,
  "status": 200,
  "data": {
    "id": 0,
    "code": "",
    "fullname": "",
    "email": "",
    "role_id": 1,
    "is_active": true
  },
  "message": "Blank item template initialized"
}
```

### 5.3 `GetCombo`
Supplies lightweight key-value pairs for foreign key dropdowns and combo-boxes:
```json
{
  "success": true,
  "status": 200,
  "data": [
    { "id": 1, "code": "ADM", "name": "Administrator" },
    { "id": 2, "code": "USR", "name": "Standard User" }
  ],
  "message": "Lookup records retrieved"
}
```

---

## 6. Mandatory Database Schema Audit Invariant Contract

Every relational table defined across all migrations strictly implements the **7-Column Audit Standard**:

```sql
CREATE TABLE tbl_<entity> (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL,
    fullname VARCHAR(255) NOT NULL,

    -- =========================================================================
    -- Mandatory 7-Column Audit Contract (Inherited on Every Table)
    -- =========================================================================
    insert_by   VARCHAR(64) DEFAULT 'SYSTEM' NOT NULL,
    insert_on   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by   VARCHAR(64) DEFAULT 'SYSTEM' NOT NULL,
    update_on   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by   VARCHAR(64) DEFAULT NULL,
    deleted_on  TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active   BOOLEAN DEFAULT TRUE NOT NULL,
    is_deleted  BOOLEAN DEFAULT FALSE NOT NULL
);
```

### Core Invariant Rules
1. **Soft Delete Always**: Physical deletion (`DELETE FROM`) is strictly prohibited. Records are deactivated via `UPDATE tbl SET is_deleted = TRUE, is_active = FALSE, delete_by = $1, deleted_on = CURRENT_TIMESTAMP WHERE id = $2`.
2. **Audit Attribution**: `insert_by` and `update_by` record authenticated user identity strings on every write operation.
3. **Audit Immutability**: `insert_by` and `insert_on` cannot be modified after initial creation.
4. **Active Record Filter**: Standard application queries automatically enforce `WHERE is_deleted = FALSE`.

---

## 7. Resilient Dual-Mode Data Tier & TCP Probing

The base architecture implements an **offline-resilient data engine** preventing server crashes when the database is restarting or running in offline container environments:

```
[Incoming Request]
        │
        ▼
[PostgresPoolManager]
        │
        ├─► [Fast TCP Port Probe: 400ms]
        │         │
        │         ├──► [PORT OPEN] ──► Connect to PostgreSQL Server (Live DB Mode)
        │         │
        │         └──► [PORT CLOSED / OFFLINE] ──► Log Warning & Fallback
        │                                                   │
        ▼                                                   ▼
[TableCacheDbSyncService] <====================== [In-Memory Table Store]
        │                                         (Offline-Safe / Zero Crash)
        ├─► Serves cached snapshot
        └─► Write-Through background sync to PostgreSQL when restored
```

- **Fast TCP Probe (< 400ms)**: Tests socket reachability before pool creation to eliminate unhandled `ECONNREFUSED` crashes.
- **In-Memory Store & Redis Sync**: Caches table state in memory with sub-millisecond lookup latency.
- **Auto-Sync**: Automatically writes through updates to PostgreSQL whenever the connection is alive.

---

## 8. Windows IIS Production Hosting & Deployment

The architecture includes a pre-configured production deployment setup for Windows IIS and reverse proxies:

```
[External Web Client]
        │
        ▼
[Windows IIS (Port 80 / 443)]
        │
        ├──► Static Assets (.js, .css, .woff2, images)
        │    └─► Served directly by IIS with <clientCache cacheControlMode="DisableCache" />
        │
        ├──► Client SPA Routing (/users, /orders, /settings)
        │    └─► Rewritten by URL Rewrite to root index.html
        │
        └──► Backend API Requests (/api/*)
             └─► Reverse-proxied via Application Request Routing (ARR)
                 directly to Node.js backend on http://127.0.0.1:3000/api/{R:1}
```

### Deployment Best Practices
1. **Non-Caching HTML**: `web.config` sends `Cache-Control: no-cache, no-store, must-revalidate` for `index.html`, ensuring client browsers always download the new build upon page reload.
2. **Hashed Assets**: JavaScript and CSS bundles are generated with content hashes (`index-[hash].js`), enabling instant updates without browser cache conflicts.
3. **Dual File Placement in Releases**: Packaging scripts place `index.html` and `assets/` in both the **root** and the `dist/` subfolder, ensuring copying to `C:\inetpub\wwwroot\<app>` replaces existing root files cleanly.
4. **Environment Flag**: `start_server.bat` explicitly sets `NODE_ENV=production` so the backend serves compiled production assets.

---

## 9. How to Adapt This Base Architecture to Any New Project

To use this framework as the starting point for a brand new application (e.g. ERP, Hospital Management, Supply Chain, CRM):

1. **Keep Foundation Directories**:
   - `src/server/BaseFrame/` (ApiResponse, DbConnects, RedisCacheManager, ReportEngine)
   - `src/server/db/` (postgresPool, TableCacheDbSyncService)
   - `src/server/DbMigration/` (MigrationRunner)
   - `web.config`, `publish_release.bat`, `start_server.bat`, `update_iis.bat`
2. **Scaffold Your First Domain Entity (e.g., `Product`)**:
   - Create SQL migration: `backend/DbMigration/V001__create_tbl_product.sql` implementing the 7-column audit standard.
   - Create server service: `src/serverside/Product/` with `ProductController.ts`, `ProductService.ts`, `ProductModel.ts`, `ProductRepo.ts`.
   - Register route: In `src/serverside/index.ts`, add `router.use("/Product", productRouter)`.
   - Create client module: `src/clientside/Product/` with `ProductPanel.tsx`, `ProductController.ts`, `ProductModel.ts`.
3. **Run Migrations & Launch**:
   - Execute `run_migrations.bat` to provision the database schema.
   - Run `npm run dev` to start the development server with live reload.
