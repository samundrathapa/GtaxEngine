-- =========================================================================
-- All-in-One Dynamic Setup Script for PostgreSQL Installation
-- 
-- Dynamically loads role name, user password, and database name from:
--   1. psql -v flags: -v DB_USER=myuser -v DB_PASSWORD=mypass -v DB_NAME=mydb
--   2. Environment variables / .env values passed via command line
--   3. Defaults to 'gtax_user', 'gtax_password', 'gtax_db' if unassigned
--
-- FOR COMMAND LINE:
--   psql -U postgres -v DB_USER=gtax_user -v DB_PASSWORD=gtax_password -v DB_NAME=gtax_db -f backend/DbMigration/setup_gtax_db.sql
-- =========================================================================

-- 1. Resolve Dynamic Variable Defaults
\if :{?DB_USER}
  \set db_user :DB_USER
\elif :{?db_user}
  \set db_user :db_user
\elif :{?gtax_user}
  \set db_user :gtax_user
\else
  \set db_user gtax_user
\endif

\if :{?DB_PASSWORD}
  \set db_pass :DB_PASSWORD
\elif :{?db_password}
  \set db_pass :db_password
\elif :{?gtax_pass}
  \set db_pass :gtax_pass
\else
  \set db_pass gtax_password
\endif

\if :{?DB_NAME}
  \set db_name :DB_NAME
\elif :{?db_name}
  \set db_name :db_name
\else
  \set db_name gtax_db
\endif

-- 2. Create or Update Role dynamically
DO
$do$
DECLARE
  v_user text := :'db_user';
  v_pass text := :'db_pass';
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = v_user) THEN

      EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', v_user, v_pass);
      RAISE NOTICE 'Role % created successfully', v_user;
   ELSE
      EXECUTE format('ALTER ROLE %I WITH LOGIN PASSWORD %L', v_user, v_pass);
      RAISE NOTICE 'Role % password updated successfully', v_user;
   END IF;
   EXECUTE format('ALTER ROLE %I CREATEDB', v_user);
END
$do$;

-- 3. Create Database dynamically
SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'db_user')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'db_name')\gexec

SELECT format('GRANT ALL PRIVILEGES ON DATABASE %I TO %I', :'db_name', :'db_user')\gexec

-- 4. Connect to target Database
\connect :db_name

-- 5. Grant Schema Privileges dynamically
SELECT format('GRANT ALL ON SCHEMA public TO %I', :'db_user')\gexec
SELECT format('ALTER SCHEMA public OWNER TO %I', :'db_user')\gexec
SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO %I', :'db_user')\gexec
SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO %I', :'db_user')\gexec
SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO %I', :'db_user')\gexec

-- 6. Execute Table Schemas
\i 02_init_gtax_schema.sql
