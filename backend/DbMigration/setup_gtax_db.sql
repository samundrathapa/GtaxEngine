-- =========================================================================
-- All-in-One Setup Script for Existing PostgreSQL Installation
-- 
-- FOR COMMAND LINE (Terminal / PowerShell / psql):
--   sudo -u postgres psql -f database/setup_gtax_db.sql
--   or: psql -U postgres -f database/setup_gtax_db.sql
--
-- FOR NAVICAT / DBeaver / pgAdmin GUI:
--   Use database/navicat_setup_gtax_db.sql instead (no backslash commands)
-- =========================================================================

-- 1. Create Role gtax_user
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'gtax_user') THEN

      CREATE ROLE gtax_user LOGIN PASSWORD 'gtax_password';
      RAISE NOTICE 'Role gtax_user created with password gtax_password';
   ELSE
      ALTER ROLE gtax_user WITH PASSWORD 'gtax_password';
      RAISE NOTICE 'Role gtax_user already exists, updated password';
   END IF;
END
$do$;

ALTER ROLE gtax_user CREATEDB;

-- 2. Create Database gtax_db
SELECT 'CREATE DATABASE gtax_db OWNER gtax_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'gtax_db')\gexec

GRANT ALL PRIVILEGES ON DATABASE gtax_db TO gtax_user;

-- 3. Connect to gtax_db
\connect gtax_db

GRANT ALL ON SCHEMA public TO gtax_user;
ALTER SCHEMA public OWNER TO gtax_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gtax_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gtax_user;

-- 4. Execute Table Schemas
\i database/02_init_gtax_schema.sql
