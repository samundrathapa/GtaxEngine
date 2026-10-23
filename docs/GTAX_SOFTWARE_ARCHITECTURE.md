# gtax - Enterprise Software Architecture Blueprint

## 1. Executive Summary & System Goals
**gtax** is a mission-critical platform engineered to compute complex, multi-jurisdictional tax liabilities (Federal, State, Municipal, District, Cross-border VAT/GST) with continuous **real-time data synchronization** across distributed enterprise systems (ERPs, billing engines, CRM, and regional tax authority gateways).

### Core Architectural Pillars
- **Zero-Trust Multi-Tenancy & RBAC**: Every operation checks bearer token claims, role hierarchies, and organization fences.
- **Strict Audit Immutability**: Every persistent entity in every table includes the mandatory audit columns: `insert_by`, `insert_on`, `update_by`, `update_on`, `delete_by`, `deleted_on`, `is_active`.
- **Inherited CRUD Architecture (BaseFrame)**: Rapid, uniform microservice development where domain services (`ApiServiceStruct`) inherit controller routing, business validation pipelines, raw query connectors, and response formatting directly from `BaseFrame`.
- **Hybrid AI Tax Intelligence**: Multi-provider LLM support (**Gemini**, **OpenAI**, **Grok**) paired with a high-fidelity **voice command engine** for speech-driven tax modeling.
- **Enterprise Frontend Architecture**: ExtJS-inspired clean separation of concerns: `panel` (view), `controller` (events/actions), `model` (data/schema), and `window` (dialogs/modals) for every domain.

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

---

## 3. Server-Side Directory Structure

```
/backend
│
├── BaseFrame/                      # Foundation Framework & Base Logic
│   ├── controller/
│   │   └── base_crud_controller.py  # Registers CRUD REST endpoints & routing hooks
│   ├── services/
│   │   └── base_service.py          # Business logic, audit triggers, validation
│   ├── repo/
│   │   └── base_repo.py             # Database connector, raw SQL query runner, soft delete
│   ├── cache/
│   │   └── redis_cache_manager.py   # Redis config & Dapper-style micro-ORM mapper
│   ├── reports/
│   │   └── report_engine.py         # PDF, Excel XML, HTML, CSV generation configuration
│   ├── response/
│   │   └── api_response.py          # Standard response: success, failure, status, errors, message, validation_errors
│   ├── helpers/
│   │   └── tax_helpers.py           # Multi-jurisdictional compounding, nexus thresholds, currency
│   ├── auth/
│   │   └── rbac_handler.py          # RBAC using Bearer token, permissions matrix
│   └── db/
│       └── DbConnects.py            # Unified single-file connection pool & raw SQL manager
│
├── DbMigration/                    # Versioned Database Migrations (V001..V999)
│   ├── V001__init_gtax_core_users.sql
│   ├── V002__create_tax_jurisdictions.sql
│   ├── V003__create_tax_rules_matrix.sql
│   ├── V004__create_transactions_and_liabilities.sql
│   ├── V005__create_realtime_sync_events.sql
│   └── migration_runner.py          # Enforces sequential versions & mandatory audit columns
│
├── ApiServiceStruct/               # Domain CRUDs Inheriting BaseFrame
│   ├── user_api_service.py          # Inherits BaseCrudController, BaseService, BaseRepo
│   ├── tax_calc_api_service.py      # Inherits BaseFrame + complex liability math
│   ├── jurisdiction_api_service.py  # Inherits BaseFrame for jurisdiction management
│   └── sync_event_api_service.py    # Inherits BaseFrame for CDC real-time events
│
└── StartDomain/                    # Microservices Domain Orchestration
    ├── domain_registry.py           # Application initialization, middleware, routing
    ├── tax_engine_domain.py         # Calculation domain orchestration
    ├── realtime_sync_domain.py      # Real-time event propagation & conflict resolution
    └── ai_orchestrator_domain.py    # Multi-LLM (Gemini, OpenAI, Grok) + Voice command processor
```

---

## 4. Mandatory Database Schema Audit Contract
Every table defined across all migrations under `DbMigration` strictly implements:
- `insert_by VARCHAR(64) NOT NULL` - Login user ID creating the row
- `insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP` - Creation timestamp
- `update_by VARCHAR(64) NOT NULL` - Last user modifying the record
- `update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP` - Modification timestamp
- `delete_by VARCHAR(64) DEFAULT NULL` - User performing soft deletion
- `deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL` - Soft deletion timestamp
- `is_active BOOLEAN DEFAULT TRUE NOT NULL` - Active record status flag

---

## 5. Frontend Architectural Standard (ExtJS / Modular Pattern)
For every functional entity, the frontend structure uses a dedicated folder with 4 distinct files:
1. **panel**: The primary display container / interactive UI workspace.
2. **controller**: Handles user interactions, triggers calculations, and interfaces with the API controller.
3. **model**: Defines typed state schemas, data validation rules, and stores.
4. **window**: Manages modals, floating tools, detail sheets, and specialized dialogues.
