-- =========================================================================
-- Step 1: Create Database User and Database (Dynamic Configuration)
-- 
-- Reads variables from command line or .env:
--   psql -U postgres -v DB_USER=gtax_user -v DB_PASSWORD=gtax_password -v DB_NAME=gtax_db -f backend/DbMigration/01_create_database_and_user.sql
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

-- 2. Create User if it does not already exist
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
      RAISE NOTICE 'Role % created with specified password', v_user;
   ELSE
      EXECUTE format('ALTER ROLE %I WITH LOGIN PASSWORD %L', v_user, v_pass);
      RAISE NOTICE 'Role % password updated', v_user;
   END IF;
   EXECUTE format('ALTER ROLE %I CREATEDB', v_user);
END
$do$;

-- 3. Create Database if it does not already exist
SELECT format('CREATE DATABASE %I OWNER %I', :'db_name', :'db_user')
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'db_name')\gexec

-- 4. Grant all privileges on database
SELECT format('GRANT ALL PRIVILEGES ON DATABASE %I TO %I', :'db_name', :'db_user')\gexec

-- 5. Connect to target database and set schema permissions
\connect :db_name

SELECT format('GRANT ALL ON SCHEMA public TO %I', :'db_user')\gexec
SELECT format('ALTER SCHEMA public OWNER TO %I', :'db_user')\gexec
SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO %I', :'db_user')\gexec
SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO %I', :'db_user')\gexec
SELECT format('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO %I', :'db_user')\gexec

\echo '---------------------------------------------------------'
\echo 'SUCCESS: Database and user initialized with full permissions!'
\echo '---------------------------------------------------------'
