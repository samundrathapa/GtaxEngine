-- =========================================================================
-- Step 1: Create Database User (gtax_user) and Database (gtax_db)
-- Run this as PostgreSQL superuser (e.g. postgres user):
--   psql -U postgres -f database/01_create_database_and_user.sql
-- or in Linux terminal:
--   sudo -u postgres psql -f database/01_create_database_and_user.sql
-- =========================================================================

-- 1. Create User if it does not already exist
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

-- 2. Grant role creation / login permissions
ALTER ROLE gtax_user CREATEDB;

-- 3. Create Database gtax_db if it does not already exist
SELECT 'CREATE DATABASE gtax_db OWNER gtax_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'gtax_db')\gexec

-- 4. Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE gtax_db TO gtax_user;

-- 5. Connect to gtax_db and set schema permissions
\connect gtax_db

GRANT ALL ON SCHEMA public TO gtax_user;
ALTER SCHEMA public OWNER TO gtax_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gtax_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gtax_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO gtax_user;

\echo '---------------------------------------------------------'
\echo 'SUCCESS: gtax_db and gtax_user have been created and granted full permissions!'
\echo 'Database: gtax_db'
\echo 'User:     gtax_user'
\echo 'Password: gtax_password'
\echo 'Host:     localhost:5432'
\echo 'Now execute step 2 to create the tables:'
\echo 'psql -U gtax_user -d gtax_db -f database/02_init_gtax_schema.sql'
\echo '---------------------------------------------------------'
