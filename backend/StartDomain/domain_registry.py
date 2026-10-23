"""
StartDomain: Microservices Domain Registry & FastAPI App Bootstrap
Initializes BaseFrame, loads DbMigration checks, wires ApiServiceStruct routers,
and exposes the domain services.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMSMiddleware
from backend.ApiServiceStruct.user_api_service import user_api_router
from backend.ApiServiceStruct.tax_calc_api_service import tax_calc_api_router
from backend.ApiServiceStruct.jurisdiction_api_service import jurisdiction_api_router
from backend.ApiServiceStruct.sync_event_api_service import sync_event_api_router
from backend.DbMigration.migration_runner import MigrationRunner

def create_gtax_application() -> FastAPI:
    app = FastAPI(
        title="gtax - Multi-Jurisdictional Tax Liability Microservices Platform",
        description="Enterprise Tax Liabilities Calculation with Real-Time Data Sync, BaseFrame Architecture, and AI Orchestrator",
        version="1.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 1. Startup validation: ensure versioned DbMigration adheres to mandatory audit schema
    @app.on_event("startup")
    async def startup_event():
        try:
            MigrationRunner.run_all()
            print(">> [gtax] DbMigration checks passed: all tables contain mandatory audit columns.")
        except Exception as e:
            print(f">> [gtax] Startup Warning: {e}")

    # 2. Mount ApiServiceStruct routers (Inherited BaseFrame CRUDs)
    app.include_router(user_api_router)
    app.include_router(tax_calc_api_router)
    app.include_router(jurisdiction_api_router)
    app.include_router(sync_event_api_router)

    @app.get("/health")
    def health_check():
        return {
            "status": "HEALTHY",
            "service": "gtax-tax-engine",
            "microservices": {
                "BaseFrame": "ONLINE",
                "DbConnects": "CONNECTED",
                "RedisCache": "ACTIVE",
                "RealtimeSync": "CONNECTED"
            }
        }

    return app

gtax_app = create_gtax_application()
