# gtax - Enterprise Software Architecture Blueprint

**Document Version:** 2.4.0  
**Target Systems:** Municipal Local Government Tax Engine, Enterprise Property Assessment, Multi-Jurisdiction Liabilities, Real-Time Data Sync, Cross-Platform Mobile  
**Last Updated:** November 2026  

---

## 1. Executive Summary & System Goals

**gtax** is a mission-critical municipal government and enterprise property tax assessment platform designed specifically for local government bodies (Palikas, Metropolitan, Sub-Metropolitan, and Municipalities) as well as multi-jurisdictional tax authorities. The platform handles end-to-end taxpayer registration, property dossier management (land parcels, houses, and floor units), automated statutory valuations, Integrated Property Tax (IPT / एकीकृत सम्पत्ति कर) calculations, multi-year arrears and fine/rebate compounding, and real-time database synchronization.

### Core Architectural Pillars
- **Zero-Trust Multi-Tenancy & RBAC**: Granular permission hierarchies across roles (`SuperAdmin`, `Admin`, `TaxOfficer`, `WardOfficer`, `Auditor`), organization fences (`tbl_company`), and token-verified session lifecycles with configurable idle timeout warnings.
- **Strict Audit Immutability**: Every persistent entity across all 25+ database tables implements standard audit columns: `insert_by`, `insert_on`, `update_by`, `update_on`, `delete_by`, `deleted_on`, and `is_active`.
- **Inherited CRUD Architecture (BaseFrame)**: Domain services (`ApiServiceStruct`) inherit standard controller routing, business validation pipelines, raw query connectors, and uniform response formatting (`ApiResponse`) directly from `BaseFrame`.
- **4-Tier Modular Clean Architecture**: Clean separation of concerns between `controller` (HTTP/route dispatch), `service` (business logic, tax math, validation), `model` (data definitions, schemas), and `repo` (data access, SQL generation). Implemented identically across client-side modules (`src/clientside/`) and server-side services (`src/serverside/`).
- **Resilient Dual-Mode Data Tier**: Fast TCP port probing via `PostgresPoolManager` allows the system to seamlessly switch between a live PostgreSQL database server and an ultra-fast in-memory cache sync layer (`TableCacheDbSyncService`), preventing unhandled connection errors (`ECONNREFUSED`) in offline, test, or container preview environments.
- **Multi-Year Tax Liability & Visualization Engine**: Complete multi-fiscal-year progression calculation (from 2021 BS to 2086 BS) with progressive structural depreciation, slab-based tax assessment, arrears fine compounding, prompt-payment discounts, and interactive historical liability visualization powered by **Recharts**.
- **Interactive Tree-View Hierarchy**: Modal-based hierarchical tree-view selection for parent-child rates (`parent_id`) across Land Rates, Malpot Rates, and Construction Rates.
- **Production-Ready IIS Hosting & Multi-Platform Release Pipeline**: Pre-configured `web.config` with ARR reverse proxying, SPA routing fallback, client-cache invalidation, and automated packaging scripts (`publish_release.bat`, `update_iis.bat`) for Windows IIS, Android, and iOS.

---

## 2. High-Level System Topology & Microservices Blueprint

```
                     +-------------------------------------------------------------+
                     |                Vite + React 19 SPA Frontend                 |
                     |  - Taxpayer Registration & Dossier (OneDoorRegistration)    |
                     |  - Multi-Year Tax Assessment Engine (Recharts Charts)       |
                     |  - Rate Masters Management (Tree-View Parent Selector)      |
                     |  - User Management (4-Tier GetSearchTemplate / GetCombo)    |
                     |  - AI Assistant & Voice Command Engine                      |
                     |  - Persistent Theme (Slate/Dark/Emerald/Light) & I18n       |
                     +------------------------------+------------------------------+
                                                    |
                                          HTTP REST / SSE / Bearer JWT
                                                    v
+-------------------------------------------------------------------------------------------------+
|                                 Windows IIS / Reverse Proxy (ARR)                               |
|          [web.config: SPA Fallback | Non-Caching Headers | /api ARR Proxy -> Port 3000]         |
+---------------------------------------------------+---------------------------------------------+
                                                    |
                                                    v
+-------------------------------------------------------------------------------------------------+
|                                Node.js Express Application Server                               |
|                                         (server.ts)                                             |
|                                                                                                 |
|   +-----------------------------------------------------------------------------------------+   |
|   |                          Restructured 4-Tier Server Routers                             |   |
|   |   - /api/User (GetSearchTemplate, GetItemTemplate, GetCombo)                            |   |
|   |   - /api/v1/property (Lands, Houses, Floors, Multi-Year Assessment, Calculation Save)   |   |
|   |   - /api/v1/rates (Land, Malpot, Construction, Depreciation, Fine/Rebate, Copy Rates)   |   |
|   |   - /api/v1/auth (Login, Logout, Session Verification, Idle Timeout Config)             |   |
|   |   - /api/v1/db (Status, Config, Live Ping, Migrations Runner)                           |   |
|   |   - /api/v1/ai (Gemini AI Tax Intelligence & Voice Action Orchestrator)                 |   |
|   +-----------------------------------------------------------------------------------------+   |
|                                                    |                                            |
|                  +---------------------------------+---------------------------------+          |
|                  v                                                                   v          |
|   +-------------------------------+                                   +---------------------+   |
|   |   TableCacheDbSyncService     |                                   |  PostgresPoolManager|   |
|   |  - 25 In-Memory Table Stores  | <====== Bidirectional Sync =====> |  - TCP Port Probe   |   |
|   |  - Redis Cache Replication    |                                   |  - Dynamic .env Pool|   |
|   |  - Instant Fallback Cache     |                                   |  - Migration Runner |   |
|   +-------------------------------+                                   +----------+----------+   |
+----------------------------------------------------------------------------------|--------------+
                                                                                   |
                                                                                   v
+-------------------------------------------------------------------------------------------------+
|                                 PostgreSQL Database (gtax_db)                                   |
|   - 12 Versioned Migrations (V001__... to V012__alter_tbl_depreciation_add_sn.sql)              |
|   - Master Tables (tbl_fiscal_year, tbl_unit, tbl_land_rate, tbl_malpot_rates, etc.)            |
|   - Property Tables (tbl_taxpayer, tbl_land, tbl_house, tbl_floor)                              |
|   - Calculation Tables (calc_master, calc_land, calc_house, calc_floor, calc_additional)        |
|   - RBAC & Security (tbl_user, tbl_role, tbl_right, tbl_user_log, tbl_session_log)             |
+-------------------------------------------------------------------------------------------------+
```

---

## 3. Directory Structure & Codebase Organization

The codebase follows a unified TypeScript/Node.js full-stack architecture designed for seamless portability between cloud dev environments and on-premise Windows Server IIS deployments.

```
/
├── backend/
│   └── DbMigration/                        # Canonical SQL Database Migration Scripts
│       ├── V001__init_gtax_core_users.sql
│       ├── V002__create_tax_jurisdictions.sql
│       ├── V003__create_tax_rules_matrix.sql
│       ├── V004__create_transactions_and_liabilities.sql
│       ├── V005__create_realtime_sync_events.sql
│       ├── V006__create_auth_and_session_tables.sql
│       ├── V007__create_taxpayer_property_tables.sql
│       ├── V008__allow_null_fiscal_year_for_default_rates.sql
│       ├── V009__alter_tbl_malpot_rates_add_is_parent.sql
│       ├── V010__fix_audit_columns_defaults_and_constraints.sql
│       ├── V011__align_all_table_columns_with_ui.sql
│       ├── V012__alter_tbl_depreciation_add_sn.sql
│       ├── navicat_setup_gtax_db.sql        # Full standalone script for Navicat/pgAdmin
│       ├── setup_gtax_db.sql                # Complete idempotent setup script
│       └── 01_create_database_and_user.sql
│
├── src/
│   ├── api/
│   │   └── controller.ts                   # Centralized frontend API client (ApiController)
│   │
│   ├── clientside/                         # ExtJS-Inspired 4-Tier Client Modules
│   │   └── User/
│   │       ├── UserController.ts           # Event handling & UI actions
│   │       ├── UserModel.ts                # TypeScript interface & form models
│   │       └── UserPanel.tsx               # Data grid, search filter & management UI
│   │
│   ├── serverside/                         # Restructured 4-Tier Server Services
│   │   ├── index.ts                        # Root router mounting /api/User endpoints
│   │   └── User/
│   │       ├── UserController.ts           # GetSearchTemplate, GetItemTemplate, GetCombo
│   │       ├── UserService.ts              # Business validation & transformation
│   │       ├── UserModel.ts                # Server entity definitions
│   │       └── UserRepo.ts                 # Database access & query builder
│   │
│   ├── components/                         # Global Reusable UI Components
│   │   ├── DbStatusModal.tsx               # Live PostgreSQL connection inspector
│   │   ├── GlobalTaxpayerSearch.tsx        # Omni-search for taxpayers & properties
│   │   ├── IdleSessionWarningModal.tsx     # Session timeout countdown modal
│   │   ├── PrivacyPolicyPage.tsx           # Public Privacy Policy & Terms of Service
│   │   ├── UserMenu.tsx                    # User profile, theme & language switcher
│   │   └── TaxLiabilityComparisonChart.tsx # Multi-year comparison charts
│   │
│   ├── modules/                            # Core Feature Modules
│   │   ├── Auth/                           # Login, session logs & state
│   │   ├── RatesMaster/                    # Land, Malpot, Construction, Depreciation rates
│   │   │   └── panel.tsx                   # RatesMasterPanel with ParentTreeModal
│   │   ├── TaxpayerWorkflow/               # Taxpayer registration, assets & dossier
│   │   │   ├── OneDoorRegistrationModal.tsx # Single-window taxpayer + land/house entry
│   │   │   └── DossierModal.tsx            # Complete property ledger & asset viewer
│   │   └── TaxCalculation/                 # Tax Computation Engines
│   │       ├── MultiYearTaxEngine.tsx      # Multi-year assessment & Recharts visualization
│   │       └── OverallCalculationPanel.tsx # Municipal calculation workspace
│   │
│   ├── server/                             # Server Infrastructure & BaseFrame
│   │   ├── ApiServiceStruct/               # Domain Services
│   │   │   ├── AuthSessionService.ts       # Authentication, hashing, token management
│   │   │   ├── TaxpayerPropertyService.ts  # Master tables, land/house valuation, multi-year math
│   │   │   └── UserApiService.ts           # User CRUD & role assignments
│   │   ├── BaseFrame/                      # Foundation Framework
│   │   │   ├── cache/RedisCacheManager.ts  # Distributed cache client
│   │   │   ├── db/DbConnects.ts            # Query helpers
│   │   │   ├── reports/ReportEngine.ts     # Multi-format report generators
│   │   │   └── response/ApiResponse.ts     # Unified API response builders
│   │   ├── db/                             # Database Access Tier
│   │   │   ├── databaseSchemaBootstrap.ts  # 25-table DDL bootstrap
│   │   │   ├── fiscalYearSeeds.ts          # 2021-2086 BS fiscal year master generator
│   │   │   ├── postgresPool.ts             # Connection pool with TCP probe & .env resolver
│   │   │   └── TableCacheDbSyncService.ts  # In-memory store & Postgres sync manager
│   │   └── DbMigration/
│   │       └── MigrationRunner.ts          # Version tracking & pending migration runner
│   │
│   └── utils/
│       ├── calculationEngine.ts            # Mathematical formulas for land/house/tax
│       └── i18n.ts                         # English, Nepali, and Hindi translations
│
├── server.ts                               # Unified Express entry point & Vite middleware mount
├── web.config                              # Windows IIS Reverse Proxy & SPA routing config
├── publish_release.bat                     # Windows/Android/iOS release packaging script
├── update_iis.bat                          # Automated in-place IIS application updater
├── start_server.bat                        # Production backend server launcher
├── copy_release_assets.bat                 # Manual release asset synchronizer
└── run_migrations.bat                      # Windows batch database migration manager
```

---

## 4. Complete Database Migration Catalog (V001 to V012)

Every migration script in `backend/DbMigration` is versioned sequentially, strictly enforcing idempotent execution via `schema_version_tracker`:

| Migration | File | Description | Core Tables / Alterations |
| :--- | :--- | :--- | :--- |
| **V001** | `V001__init_gtax_core_users.sql` | Core identity and access control | `tbl_role`, `tbl_user`, `tbl_right`, `tbl_role_right`, `tbl_user_role`, `tbl_user_right` |
| **V002** | `V002__create_tax_jurisdictions.sql` | Municipal jurisdictions | `tax_jurisdictions` (National, Provincial, Municipal, Ward) |
| **V003** | `V003__create_tax_rules_matrix.sql` | Tax rule matrix & evaluation parameters | `tax_rules_matrix` |
| **V004** | `V004__create_transactions_and_liabilities.sql` | Financial ledger and assessment breakdown | `tax_transactions`, `tax_liability_breakdown` |
| **V005** | `V005__create_realtime_sync_events.sql` | Change data capture (CDC) sync events | `realtime_sync_events` |
| **V006** | `V006__create_auth_and_session_tables.sql` | Audit logging & user sessions | `tbl_session_log`, `tbl_user_log` |
| **V007** | `V007__create_taxpayer_property_tables.sql` | Core taxpayer & municipal property registry | `tbl_fiscal_year`, `tbl_unit`, `tbl_land_nature`, `tbl_construction_type`, `tbl_land_rate`, `tbl_malpot_rates`, `tbl_construction_rates`, `tbl_depreciation`, `tbl_fine_rebate`, `tbl_taxpayer`, `tbl_land`, `tbl_house`, `tbl_floor` |
| **V008** | `V008__allow_null_fiscal_year_for_default_rates.sql` | Universal base rate support | Modifies rate tables to allow `fiscal_year_id = NULL` for universal default rates |
| **V009** | `V009__alter_tbl_malpot_rates_add_is_parent.sql` | Hierarchical rate structures | Adds `is_parent` and `parent_id` columns to rate tables |
| **V010** | `V010__fix_audit_columns_defaults_and_constraints.sql` | Audit integrity and nullability safety | Reconciles audit defaults (`insert_by`, `insert_on`, `update_by`, `update_on`) |
| **V011** | `V011__align_all_table_columns_with_ui.sql` | Client-server column alignment | Aligns column naming (`mobile_no`, `citizenship_no`, `ward_no_ids`, `area_sqfeet`) with UI payloads |
| **V012** | `V012__alter_tbl_depreciation_add_sn.sql` | Depreciation sorting sequence | Adds numeric sequence `sn` column to `tbl_depreciation` |

### Mandatory Schema Audit Contract
Every table created or altered throughout the lifecycle implements:
```sql
insert_by   VARCHAR(64) DEFAULT 'SYSTEM' NOT NULL,
insert_on   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
update_by   VARCHAR(64) DEFAULT 'SYSTEM' NOT NULL,
update_on   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
delete_by   VARCHAR(64) DEFAULT NULL,
deleted_on  TIMESTAMP WITH TIME ZONE DEFAULT NULL,
is_active   BOOLEAN DEFAULT TRUE NOT NULL,
is_deleted  BOOLEAN DEFAULT FALSE NOT NULL
```

---

## 5. Core Business & Valuation Engines

### 5.1 Municipal Property Tax & Valuation Engine
Located in `src/utils/calculationEngine.ts` and `src/server/ApiServiceStruct/TaxpayerPropertyService.ts`.

1. **Land Unit Conversion & Valuation**:
   - Converts regional measurement units (Ropani, Aana, Paisa, Daam in Hilly regions; Bigha, Kattha, Dhur in Terai regions) into Square Feet (`area_sqfeet`).
   - Standard conversion factors: 1 Ropani = 5,476 SqFt, 1 Aana = 342.25 SqFt, 1 Bigha = 72,900 SqFt, 1 Kattha = 3,645 SqFt.
   - Land Assessed Value formula:
     $$\text{Assessed Valuation} = \left(\frac{\text{area\_sqfeet}}{\text{unit\_value}}\right) \times \text{rate\_per\_unit}$$
2. **Structure Age & Progressive Depreciation**:
   - Computes building structure age based on construction date Bikram Sambat (`construction_date_bs`) relative to the active fiscal year.
   - Applies statutory depreciation brackets (e.g., 0–5 years: 5%, 6–15 years: 15%, 16–25 years: 25%, 26–40 years: 35%, >40 years: 50%).
   - Floor Assessed Value formula:
     $$\text{Floor Valuation} = (\text{area\_sqfeet} \times \text{rate\_per\_unit}) \times (1 - \text{depreciation\_percent} / 100)$$
   - House valuation automatically rolls up all child floor valuations.
3. **Integrated Property Tax (IPT) Slabs**:
   - Total Property Valuation = $\sum \text{Land Valuation} + \sum \text{House Valuation}$.
   - Evaluates progressive municipal tax slabs:
     - Up to 10 Lakh: 0.05%
     - 10 Lakh to 50 Lakh: 0.10%
     - 50 Lakh to 1 Crore: 0.15%
     - Above 1 Crore: 0.20%
4. **Interactive Formula Explanations & "Obtain Value" Locks**:
   - Both `OneDoorRegistrationModal` and `DossierModal` display interactive breakdown formulas for land, house, and floor calculations with one-click **"Obtain Value"** buttons that automatically compute and lock assessed valuations into persistence payloads.

---

### 5.2 Multi-Year Tax Liability & Visualization Engine
Located in `src/modules/TaxCalculation/MultiYearTaxEngine.tsx` and `TaxpayerPropertyService.calculateMultiYearTaxAssessment`.

- **Comprehensive Fiscal Year Range Evaluation**:
  - Dynamically evaluates tax liability across multi-fiscal-year ranges (e.g. 2079/80 to 2081/82) across all 66 canonical fiscal years (2021 BS to 2086 BS).
  - Automatically handles year status transitions:
    - **Past / Overdue (Arrears)**: Accumulates late fine penalties (10% to 25%).
    - **Current Fiscal Year**: Applies timely payment rebates (10% discount).
    - **Advance Years**: Applies advance payment incentives (15% discount).
- **Interactive Recharts Visualization**:
  - Embedded within the **Multi-Year Engine** tab.
  - Combines `BarChart`, `Bar`, and `Line` components inside a `ResponsiveContainer` to plot:
    - Base Tax Liability (Bar)
    - Net Payable Year Tax after Fines/Rebates (Bar)
    - Cumulative Running Arrears Total (Line)
- **Automatic Fallback Seeding**:
  - If calculations are executed when the database or cache is freshly initialized, the calculation engine automatically provisions fallback fiscal years, taxpayers, and sample land/structure assets, preventing null calculation failures.

---

### 5.3 Hierarchical Rate Management & Tree-View Selector
Located in `src/modules/RatesMaster/panel.tsx`.

- **Compact Input with Modal Tree Trigger**:
  - Form dialogs for Land Rates, Malpot Rates, and Construction Rates display a clean `parent_id` input paired with a **"🌳 Tree View"** launcher button.
- **Tree View Modal Window (`ParentTreeModal`)**:
  - Loads all existing rate records into a hierarchical tree structure with real-time text search (filtering by ID, code, or name).
  - Allows selecting root level (`parent_id = null`) or any parent record with a single click.
  - Automatically assigns the selected parent ID to the form field and closes the modal.
- **Rate Cloning (`copyRates`)**:
  - Enables copying Universal Default rates (`fiscal_year_id: null`) into any specific fiscal year (or between fiscal years) with overwrite protection.

---

## 6. Client-Side State, Themes & Session Management

- **Theme & Language Persistence**:
  - `src/App.tsx` synchronizes `currentTheme` (`slate`, `dark`, `emerald`, `light`) and `currentLang` (`nep`, `ind`, `eng`) with `localStorage` (`gtax_active_theme`, `gtax_active_lang`).
  - Reloading the browser preserves the user's selected visual theme and language without resetting to defaults.
- **Idle Session Timeout Management**:
  - Controlled by `useIdleSessionTimeout.ts` and `IdleSessionWarningModal.tsx`.
  - Monitors user interaction (mouse movement, key presses, clicks).
  - Displays a 60-second warning countdown before automatically logging out inactive users, recording the audit session termination in `tbl_session_log`.

---

## 7. Windows IIS Deployment Architecture & Release Pipeline

### 7.1 Production IIS Configuration (`web.config`)
The system provides a production-grade `web.config` configured for Windows Server IIS:
1. **Default Document**: Directs incoming requests to `index.html` (and `dist/index.html`).
2. **Non-Caching Headers**:
   ```xml
   <staticContent>
     <clientCache cacheControlMode="DisableCache" />
   </staticContent>
   <httpProtocol>
     <customHeaders>
       <add name="Cache-Control" value="no-cache, no-store, must-revalidate" />
       <add name="Pragma" value="no-cache" />
       <add name="Expires" value="0" />
     </customHeaders>
   </httpProtocol>
   ```
   Ensures updated releases show immediately when users reload their browsers without stale browser caching.
3. **ARR Reverse Proxy**: Rewrites all `/api/*` requests directly to the Node.js backend running on `http://127.0.0.1:3000`.
4. **SPA Client Routing**: Rewrites non-file client routes back to `index.html` while preserving static assets (`.js`, `.css`, `.woff2`, `.svg`, `.json`).

### 7.2 Release Packaging (`publish_release.bat`)
When running `publish_release.bat`:
1. Cleans any previous stale build (`rmdir /s /q dist`).
2. Executes `npm run build` to generate minified, hashed production bundles.
3. Assembles the Windows IIS release package under `release\windows\gtax_windows_v<VERSION>_<TIMESTAMP>\`:
   - Copies `dist/index.html` and `dist/assets/` directly to the **root** of the release folder, guaranteeing that manual copy/paste into `C:\inetpub\wwwroot\gtax` immediately overwrites the live IIS root files.
   - Preserves a duplicate in `dist/` for dual compatibility.
   - Bundles all backend runtime files (`server.ts`, `server/`, `src/`, `ai/`, `data/`, `scripts/`, `DbMigration/`, `web.config`, `start_server.bat`, `run_migrations.bat`).
4. Compresses the release into `release\gtax_windows_v<VERSION>_<TIMESTAMP>.zip`.
5. Prompts instructions for manual copy to `C:\inetpub\wwwroot\gtax` without unexpected automated overwrite side-effects.

### 7.3 In-Place IIS Updater (`update_iis.bat`)
Supports both manual interactive mode and automated deployment (`update_iis.bat --auto`):
1. Gracefully stops the IIS Application Pool (`appcmd stop apppool /apppool.name:"gtax"`).
2. Terminates any orphaned Node.js backend processes on port 3000.
3. Overwrites application files using `robocopy /MIR` (excluding logs and node_modules).
4. Automatically checks and applies any pending SQL migrations via `run_migrations.bat --auto`.
5. Restarts the IIS Application Pool and website (`appcmd start apppool`).

---

## 8. Summary of Architectural Guarantees

1. **Zero Data Loss**: In-memory caching and PostgreSQL write-through synchronization ensure transactions are preserved even during unexpected database restarts.
2. **Strict Compliance**: Audit trails (`insert_by`, `update_by`, `deleted_on`) are non-nullable and enforced at both database schema and service layers.
3. **Accurate Municipal Accounting**: Land and structural valuations match statutory Nepalese municipal taxation guidelines.
4. **Frictionless Operations**: One-click batch files manage database migrations, backend launching, release packaging, and IIS updates.
