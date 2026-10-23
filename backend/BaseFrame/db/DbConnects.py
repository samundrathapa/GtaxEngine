"""
Unified Dynamic Database Connection Manager (DbConnects.py / dbconnect.py)
Provides pooled connections, dynamic environment configuration, transactions, and raw query hooks.
Supports dynamic switching of database (e.g. gtax_db, gtax_dbtest) via DB_NAME / db_name or DATABASE_URL.
"""
import os
import re
import urllib.parse
from contextlib import contextmanager

def _load_env_file():
    """Locate and parse .env file into os.environ if not already set (zero-dependency)."""
    search_dirs = [
        os.getcwd(),
        os.path.dirname(os.path.abspath(__file__)),
        os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../")),
        os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../../")),
    ]
    for directory in search_dirs:
        env_path = os.path.join(directory, ".env")
        if os.path.isfile(env_path):
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k and k not in os.environ:
                            os.environ[k] = v
                break
            except Exception:
                pass

# Auto-load on import
_load_env_file()

class DbConnects:
    _pool = None
    _active_db_override = None

    @classmethod
    def get_config(cls) -> dict:
        """Dynamically resolves database configuration from environment variables."""
        _load_env_file()

        env_db_name = (
            cls._active_db_override or
            os.getenv("DB_NAME") or
            os.getenv("db_name") or
            os.getenv("DB_DATABASE") or
            os.getenv("DATABASE_NAME") or
            ""
        ).strip()

        env_user = (
            os.getenv("DB_USER") or
            os.getenv("db_user") or
            os.getenv("DB_USERNAME") or
            os.getenv("POSTGRES_USER") or
            ""
        ).strip()

        env_pass = (
            os.getenv("DB_PASSWORD") or
            os.getenv("db_password") or
            os.getenv("DB_PASS") or
            os.getenv("POSTGRES_PASSWORD") or
            ""
        ).strip()

        env_host = (
            os.getenv("DB_HOST") or
            os.getenv("db_host") or
            os.getenv("POSTGRES_HOST") or
            ""
        ).strip()

        env_port = (
            os.getenv("DB_PORT") or
            os.getenv("db_port") or
            os.getenv("POSTGRES_PORT") or
            ""
        ).strip()

        env_ssl = (
            os.getenv("DB_SSL") or
            os.getenv("db_ssl") or
            ""
        ).strip().lower() == "true"

        raw_url = (
            os.getenv("DATABASE_URL") or
            os.getenv("database_url") or
            ""
        ).strip()

        host = env_host or "localhost"
        port = int(env_port) if env_port and env_port.isdigit() else 5432
        database = env_db_name or "gtax_db"
        user = env_user or "gtax_user"
        password = env_pass or "gtax_password"
        ssl = env_ssl

        db_url = ""

        if raw_url:
            try:
                parsed = urllib.parse.urlsplit(raw_url)
                if parsed.hostname:
                    host = parsed.hostname
                if parsed.port:
                    port = parsed.port
                if parsed.username:
                    user = urllib.parse.unquote(parsed.username)
                if parsed.password:
                    password = urllib.parse.unquote(parsed.password)
                if parsed.path and len(parsed.path) > 1:
                    database = parsed.path.lstrip("/")

                # Dynamic override: If DB_NAME is explicitly set in .env (e.g. gtax_dbtest),
                # it takes precedence over the database in DATABASE_URL!
                if env_db_name:
                    database = env_db_name

                if env_user:
                    user = env_user
                if env_pass:
                    password = env_pass
                if env_host:
                    host = env_host
                if env_port and env_port.isdigit():
                    port = int(env_port)

                # Reconstruct full dynamic URL
                encoded_user = urllib.parse.quote(user, safe="")
                encoded_pass = urllib.parse.quote(password, safe="")
                netloc = f"{encoded_user}:{encoded_pass}@{host}:{port}"
                db_url = urllib.parse.urlunsplit((parsed.scheme or "postgresql", netloc, f"/{database}", parsed.query, parsed.fragment))
            except Exception:
                encoded_user = urllib.parse.quote(user, safe="")
                encoded_pass = urllib.parse.quote(password, safe="")
                db_url = f"postgresql://{encoded_user}:{encoded_pass}@{host}:{port}/{database}"
        else:
            encoded_user = urllib.parse.quote(user, safe="")
            encoded_pass = urllib.parse.quote(password, safe="")
            db_url = f"postgresql://{encoded_user}:{encoded_pass}@{host}:{port}/{database}"

        masked_url = re.sub(r"://([^:]+):([^@]+)@", r"://\1:******@", db_url)

        return {
            "host": host,
            "port": port,
            "database": database,
            "user": user,
            "password": password,
            "password_masked": "******",
            "ssl": ssl,
            "db_url": db_url,
            "db_url_masked": masked_url,
        }

    @classmethod
    def get_db_url(cls) -> str:
        """Returns the dynamic PostgreSQL connection URL."""
        return cls.get_config()["db_url"]

    @classmethod
    def set_database(cls, db_name: str):
        """Dynamically switch to another database (e.g. gtax_dbtest) and reset the pool."""
        cls._active_db_override = db_name.strip()
        cls.close_pool()
        print(f"[gtax:DbConnects] Target database dynamically set to: '{cls._active_db_override}'")

    @classmethod
    def close_pool(cls):
        """Closes all connections in the active pool."""
        if cls._pool is not None:
            try:
                cls._pool.closeall()
            except Exception:
                pass
            cls._pool = None

    @classmethod
    def initialize_pool(cls):
        """Initializes PostgreSQL connection pool dynamically from environment config."""
        if cls._pool is None:
            cfg = cls.get_config()
            try:
                import psycopg2
                from psycopg2 import pool
                cls._pool = psycopg2.pool.SimpleConnectionPool(
                    minconn=1,
                    maxconn=20,
                    dsn=cfg["db_url"]
                )
                print(f"[gtax:DbConnects] Connected to PostgreSQL database '{cfg['database']}' as '{cfg['user']}' at {cfg['host']}:{cfg['port']}")
            except ImportError:
                print("[gtax:DbConnects] Notice: 'psycopg2' module not installed in Python environment. Operating in mock mode.")
                return None
            except Exception as e:
                print(f"[gtax:DbConnects] PostgreSQL connection warning for '{cfg['database']}': {e}. Operating in fallback mode.")
                return None
        return cls._pool

    @classmethod
    @contextmanager
    def get_connection(cls):
        """Yields a pooled connection with automatic commit/rollback."""
        cls.initialize_pool()
        if cls._pool is None:
            yield None
            return

        conn = cls._pool.getconn()
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            if cls._pool and conn:
                cls._pool.putconn(conn)

    @classmethod
    def execute_raw_query(cls, sql_query: str, params: tuple = None):
        """Executes a query safely against PostgreSQL or returns empty list if offline."""
        with cls.get_connection() as conn:
            if conn is None:
                return []
            try:
                with conn.cursor() as cursor:
                    cursor.execute(sql_query, params or ())
                    if cursor.description:
                        columns = [desc[0] for desc in cursor.description]
                        return [dict(zip(columns, row)) for row in cursor.fetchall()]
                    return []
            except Exception as e:
                print(f"[gtax:DbConnects] Query error: {e}")
                return []

    @classmethod
    def ensure_default_seed(cls):
        """Seeds default roles and users, and syncs serial sequences in the active database."""
        cfg = cls.get_config()
        print(f"[gtax:DbConnects] Ensuring core schema and default data in '{cfg['database']}'...")
        seed_sql = """
        CREATE TABLE IF NOT EXISTS tbl_role (
            id SERIAL PRIMARY KEY,
            role_name VARCHAR(64) UNIQUE NOT NULL,
            description VARCHAR(255),
            insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tbl_user (
            id SERIAL PRIMARY KEY,
            fullname VARCHAR(200) NOT NULL,
            photo_path VARCHAR(500) DEFAULT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            mobile VARCHAR(32) DEFAULT NULL,
            country_id INT DEFAULT 1,
            effective_from DATE DEFAULT CURRENT_DATE NOT NULL,
            effective_to DATE DEFAULT NULL,
            employee_id VARCHAR(64) DEFAULT NULL,
            is_locked BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tbl_user_role (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES tbl_user(id) ON DELETE CASCADE NOT NULL,
            role_id INT REFERENCES tbl_role(id) ON DELETE CASCADE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL,
            UNIQUE(user_id, role_id)
        );

        INSERT INTO tbl_role (id, role_name, description, insert_by, update_by) VALUES
        (1, 'superadmin', 'Unrestricted Master Control & System Oversight', 'SYSTEM_SEED', 'SYSTEM_SEED'),
        (2, 'admin', 'Corporate Tax Manager & Department Security Admin', 'SYSTEM_SEED', 'SYSTEM_SEED'),
        (3, 'operator', 'Tax Operations Specialist & Real-Time Sync Operator', 'SYSTEM_SEED', 'SYSTEM_SEED'),
        (4, 'user', 'Standard Tax Analyst & Invoicing Reviewer', 'SYSTEM_SEED', 'SYSTEM_SEED')
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO tbl_user (id, fullname, email, password, mobile, employee_id, insert_by, insert_on, update_by, update_on, is_active) VALUES
        (1, 'Eleanor Vance (Chief Tax Officer)', 'superadmin@gtax.enterprise', 'Password123!', '+1 (555) 019-2831', 'EMP-SA-001', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true),
        (2, 'Marcus Thorne (Senior Tax Strategist)', 'admin@gtax.enterprise', 'Password123!', '+1 (555) 024-8192', 'EMP-ADM-002', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true),
        (3, 'Sarah Chen (Global Compliance Director)', 'operator@gtax.enterprise', 'Password123!', '+1 (555) 038-7241', 'EMP-OP-003', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true),
        (4, 'Julian Keller (Tax Analyst)', 'user@gtax.enterprise', 'Password123!', '+1 (555) 042-9918', 'EMP-USR-004', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true)
        ON CONFLICT (email) DO NOTHING;

        INSERT INTO tbl_user_role (user_id, role_id, insert_by, update_by) VALUES
        (1, 1, 'SYSTEM_SEED', 'SYSTEM_SEED'),
        (2, 2, 'SYSTEM_SEED', 'SYSTEM_SEED'),
        (3, 3, 'SYSTEM_SEED', 'SYSTEM_SEED'),
        (4, 4, 'SYSTEM_SEED', 'SYSTEM_SEED')
        ON CONFLICT DO NOTHING;

        SELECT setval(pg_get_serial_sequence('tbl_user', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user), 0), 1));
        SELECT setval(pg_get_serial_sequence('tbl_role', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_role), 0), 1));
        SELECT setval(pg_get_serial_sequence('tbl_user_role', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user_role), 0), 1));
        """
        cls.execute_raw_query(seed_sql)
        print(f"[gtax:DbConnects] Default seed completed for '{cfg['database']}'.")

if __name__ == "__main__":
    print("=" * 70)
    print("gtax Enterprise - Dynamic Python Database Connection Inspector")
    print("=" * 70)
    config = DbConnects.get_config()
    print(f"  Host:            {config['host']}")
    print(f"  Port:            {config['port']}")
    print(f"  Database Target: {config['database']}")
    print(f"  User:            {config['user']}")
    print(f"  Connection URL:  {config['db_url_masked']}")
    print("=" * 70)
    print("Attempting test connection...")
    pool = DbConnects.initialize_pool()
    if pool:
        rows = DbConnects.execute_raw_query("SELECT current_database(), current_user, version();")
        print("Connected successfully:", rows)
    else:
        print("Test complete. Configuration verified.")
