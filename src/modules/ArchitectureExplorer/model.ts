export interface ArchFolderItem {
  id: string;
  name: string;
  type: "folder" | "file";
  path: string;
  category: "BaseFrame" | "DbMigration" | "ApiServiceStruct" | "StartDomain" | "Docs";
  description: string;
  contentSnippet: string;
  children?: ArchFolderItem[];
}

export const architectureFileTree: ArchFolderItem[] = [
  {
    id: "bf",
    name: "BaseFrame",
    type: "folder",
    path: "/backend/BaseFrame",
    category: "BaseFrame",
    description: "Contains all foundational framework logic, raw query managers, response contracts, caching, and auth handlers.",
    contentSnippet: "# BaseFrame root directory",
    children: [
      {
        id: "bf_ctrl",
        name: "controller/base_crud_controller.py",
        type: "file",
        path: "/backend/BaseFrame/controller/base_crud_controller.py",
        category: "BaseFrame",
        description: "Registers CRUDs which call API to reach. Automatically binds standard REST endpoints to services.",
        contentSnippet: `class BaseCrudController:
    def __init__(self, prefix: str, service: BaseService, tag: str, required_roles: list = None):
        self.router = APIRouter(prefix=prefix, tags=[tag])
        self.service = service
        self._register_crud_routes()

    def _register_crud_routes(self):
        @self.router.get("", response_model=ApiResponse)
        def list_all(limit: int = 100, offset: int = 0):
            return self.service.list_records(limit=limit, offset=offset)

        @self.router.post("", response_model=ApiResponse, status_code=201)
        def create(payload: Dict[str, Any], user: CurrentUser = Depends(RbacHandler.require_roles)):
            return self.service.create(data=payload, user_id=user.user_id)`
      },
      {
        id: "bf_srv",
        name: "services/base_service.py",
        type: "file",
        path: "/backend/BaseFrame/services/base_service.py",
        category: "BaseFrame",
        description: "Contains business logic, domain validation hooks, cache coordination, and audit logging.",
        contentSnippet: `class BaseService:
    def __init__(self, repository: BaseRepo, cache_prefix: str):
        self.repo = repository
        self.cache_prefix = cache_prefix

    def create(self, data: Dict[str, Any], user_id: str) -> ApiResponse:
        errs = self.validate_data(data, is_create=True)
        if errs:
            return ApiResponse.build_failure("Validation failed", validation_errors=errs, status=422)
        record = self.repo.insert(data, user_id=user_id)
        RedisCacheManager.invalidate_prefix(self.cache_prefix)
        return ApiResponse.build_success(data=record, message="Created", status=201)`
      },
      {
        id: "bf_repo",
        name: "repo/base_repo.py",
        type: "file",
        path: "/backend/BaseFrame/repo/base_repo.py",
        category: "BaseFrame",
        description: "Services to database connector. All database raw queries are managed in this section with mandatory audit columns.",
        contentSnippet: `class BaseRepo:
    def insert(self, data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        now = datetime.datetime.utcnow().isoformat()
        payload = data.copy()
        payload["insert_by"] = user_id
        payload["insert_on"] = now
        payload["update_by"] = user_id
        payload["update_on"] = now
        payload["delete_by"] = None
        payload["deleted_on"] = None
        payload["is_active"] = True
        return DbConnects.execute_raw_query(insert_sql, tuple(payload.values()))`
      },
      {
        id: "bf_cache",
        name: "cache/redis_cache_manager.py",
        type: "file",
        path: "/backend/BaseFrame/cache/redis_cache_manager.py",
        category: "BaseFrame",
        description: "Data cache using Redis configuration and ORM like Dapper for high-speed materialization.",
        contentSnippet: `class RedisCacheManager:
    @classmethod
    def get(cls, key: str) -> Optional[str]:
        return cls.get_client().get(key)

class DapperMapper:
    @staticmethod
    def query(model_cls: Type[T], raw_rows: List[dict]) -> List[T]:
        return [model_cls(**row) for row in raw_rows]`
      },
      {
        id: "bf_reports",
        name: "reports/report_engine.py",
        type: "file",
        path: "/backend/BaseFrame/reports/report_engine.py",
        category: "BaseFrame",
        description: "PDF, Excel, HTML, CSV configuration and export engine.",
        contentSnippet: `class ReportEngine:
    @staticmethod
    def generate_csv(headers: List[str], data_rows: List[Dict[str, Any]]) -> str: ...
    @staticmethod
    def generate_html(title: str, headers: List[str], data_rows: List[Dict[str, Any]]) -> str: ...
    @staticmethod
    def generate_excel_xml(title: str, headers: List[str], data_rows: List[Dict[str, Any]]) -> str: ...
    @staticmethod
    def generate_pdf_definition(title: str, headers: List[str], data_rows: List[Dict[str, Any]]) -> Dict: ...`
      },
      {
        id: "bf_resp",
        name: "response/api_response.py",
        type: "file",
        path: "/backend/BaseFrame/response/api_response.py",
        category: "BaseFrame",
        description: "Standard response contract: success, failure, status, errors, message, validation_errors.",
        contentSnippet: `class ApiResponse(BaseModel):
    success: bool = True
    failure: bool = False
    status: int = 200
    message: str = "Operation completed successfully"
    data: Optional[Any] = None
    errors: Optional[List[str]] = []
    validation_errors: Optional[Dict[str, List[str]]] = {}
    timestamp: str`
      },
      {
        id: "bf_auth",
        name: "auth/rbac_handler.py",
        type: "file",
        path: "/backend/BaseFrame/auth/rbac_handler.py",
        category: "BaseFrame",
        description: "Authentication handler using RBAC with Bearer token & authorization policies.",
        contentSnippet: `class RbacHandler:
    @classmethod
    def require_roles(cls, allowed_roles: List[str]):
        def role_checker(user: CurrentUser = Security(cls.get_current_user)):
            if not set(user.roles).intersection(set(allowed_roles)):
                raise HTTPException(403, "Access denied")
            return user
        return role_checker`
      },
      {
        id: "bf_db",
        name: "db/DbConnects.py",
        type: "file",
        path: "/backend/BaseFrame/db/DbConnects.py",
        category: "BaseFrame",
        description: "DbConnects code in one file which is called from anywhere to connect and open database connection pool.",
        contentSnippet: `class DbConnects:
    _pool = None
    @classmethod
    def initialize_pool(cls): ...
    @classmethod
    @contextmanager
    def get_connection(cls): ...
    @classmethod
    def execute_raw_query(cls, sql: str, params: tuple = None): ...`
      }
    ]
  },
  {
    id: "dbmig",
    name: "DbMigration",
    type: "folder",
    path: "/backend/DbMigration",
    category: "DbMigration",
    description: "All DB migration using version. In every table: insert_by, insert_on, update_by, update_on, delete_by, deleted_on, is_active.",
    contentSnippet: "# DbMigration folder containing V001..V005 migrations",
    children: [
      {
        id: "dbmig_v1",
        name: "V001__init_gtax_core_users.sql",
        type: "file",
        path: "/backend/DbMigration/V001__init_gtax_core_users.sql",
        category: "DbMigration",
        description: "Core sys_users, sys_organizations, sys_roles_permissions with mandatory audit columns.",
        contentSnippet: `CREATE TABLE IF NOT EXISTS sys_users (
    user_id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) REFERENCES sys_organizations(org_id),
    username VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(64) NOT NULL,
    
    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);`
      },
      {
        id: "dbmig_v2",
        name: "V002__create_tax_jurisdictions.sql",
        type: "file",
        path: "/backend/DbMigration/V002__create_tax_jurisdictions.sql",
        category: "DbMigration",
        description: "Tax jurisdictions and nexus thresholds with audit columns.",
        contentSnippet: `CREATE TABLE IF NOT EXISTS tax_jurisdictions (
    jurisdiction_id VARCHAR(64) PRIMARY KEY,
    jurisdiction_code VARCHAR(32) UNIQUE NOT NULL,
    jurisdiction_name VARCHAR(255) NOT NULL,
    default_rate_pct NUMERIC(8, 4) NOT NULL,
    nexus_sales_threshold NUMERIC(14, 2),
    
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);`
      },
      {
        id: "dbmig_v4",
        name: "V004__create_transactions_and_liabilities.sql",
        type: "file",
        path: "/backend/DbMigration/V004__create_transactions_and_liabilities.sql",
        category: "DbMigration",
        description: "Financial transactions and assessed multi-jurisdictional liabilities with audit columns.",
        contentSnippet: `CREATE TABLE IF NOT EXISTS tax_transactions (
    transaction_id VARCHAR(64) PRIMARY KEY,
    invoice_number VARCHAR(128) NOT NULL,
    gross_amount NUMERIC(14, 2) NOT NULL,
    total_tax_amount NUMERIC(14, 2) NOT NULL,
    sync_status VARCHAR(32) NOT NULL,
    
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);`
      },
      {
        id: "dbmig_runner",
        name: "migration_runner.py",
        type: "file",
        path: "/backend/DbMigration/migration_runner.py",
        category: "DbMigration",
        description: "Enforces version ordering and validates all tables declare the 7 required audit columns.",
        contentSnippet: `REQUIRED_AUDIT_COLUMNS = [
    "insert_by", "insert_on", "update_by", "update_on", "delete_by", "deleted_on", "is_active"
]
class MigrationRunner:
    @classmethod
    def validate_audit_columns(cls, sql: str, fname: str): ...`
      }
    ]
  },
  {
    id: "apisvc",
    name: "ApiServiceStruct",
    type: "folder",
    path: "/backend/ApiServiceStruct",
    category: "ApiServiceStruct",
    description: "Contains same CRUDs inherited property from BaseFrame for every domain service.",
    contentSnippet: "# ApiServiceStruct folder",
    children: [
      {
        id: "apisvc_user",
        name: "user_api_service.py",
        type: "file",
        path: "/backend/ApiServiceStruct/user_api_service.py",
        category: "ApiServiceStruct",
        description: "Inherits BaseCrudController, BaseService, and BaseRepo for sys_users.",
        contentSnippet: `class UserRepo(BaseRepo):
    def __init__(self):
        super().__init__(table_name="sys_users", primary_key="user_id")

class UserService(BaseService):
    def __init__(self):
        super().__init__(repository=UserRepo(), cache_prefix="gtax:users")

class UserController(BaseCrudController):
    def __init__(self):
        super().__init__(prefix="/api/v1/users", service=UserService(), tag="Users")`
      },
      {
        id: "apisvc_tax",
        name: "tax_calc_api_service.py",
        type: "file",
        path: "/backend/ApiServiceStruct/tax_calc_api_service.py",
        category: "ApiServiceStruct",
        description: "Inherits BaseFrame CRUD and implements multi-jurisdiction compounding tax math.",
        contentSnippet: `class TaxCalcService(BaseService):
    def calculate_multi_jurisdictional_liability(self, ...):
        tax_result = TaxEngineHelper.calculate_compound_liability(gross_amount, rules)
        # Stored with BaseFrame audit columns
        return ApiResponse.build_success(data=response_payload)`
      }
    ]
  },
  {
    id: "startdom",
    name: "StartDomain",
    type: "folder",
    path: "/backend/StartDomain",
    category: "StartDomain",
    description: "Initializes microservice domain coordinators, AI orchestrator, and FastAPI application.",
    contentSnippet: "# StartDomain bootstrap",
    children: [
      {
        id: "startdom_reg",
        name: "domain_registry.py",
        type: "file",
        path: "/backend/StartDomain/domain_registry.py",
        category: "StartDomain",
        description: "Bootstraps FastAPI app, mounts inherited ApiServiceStruct routers, and verifies DbMigration audit checks on startup.",
        contentSnippet: `def create_gtax_application() -> FastAPI:
    app = FastAPI(title="gtax Platform")
    app.include_router(user_api_router)
    app.include_router(tax_calc_api_router)
    app.include_router(jurisdiction_api_router)
    app.include_router(sync_event_api_router)
    return app`
      },
      {
        id: "startdom_ai",
        name: "ai_orchestrator_domain.py",
        type: "file",
        path: "/backend/StartDomain/ai_orchestrator_domain.py",
        category: "StartDomain",
        description: "Multi-LLM engine supporting Gemini, OpenAI, Grok, and Voice Command intent parser.",
        contentSnippet: `class AiOrchestratorDomain:
    @staticmethod
    def parse_voice_command(transcript: str) -> Dict[str, Any]: ...
    @staticmethod
    def prompt_tax_agent(prompt: str, provider: str = "gemini"): ...`
      }
    ]
  }
];
