-- =========================================================================
-- gtax Enterprise - Navicat / GUI PostgreSQL Setup Script
-- Compatible with Navicat 12/15/16/17, DBeaver, pgAdmin, and DataGrip
-- NOTE: Contains NO psql backslash commands (\connect, \i, \gexec, \echo)
-- =========================================================================

-- =========================================================================
-- STEP 1: Run these statements while connected as 'postgres' superuser
-- =========================================================================

-- 1. Create or Update Role 'gtax_user' with password 'gtax_password'
-- We support both SCRAM-SHA-256 (modern) and MD5 (legacy Navicat)
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'gtax_user') THEN
      CREATE ROLE gtax_user WITH LOGIN PASSWORD 'gtax_password';
   ELSE
      ALTER ROLE gtax_user WITH LOGIN PASSWORD 'gtax_password';
   END IF;
END $$;

-- 2. Ensure gtax_user has permission to create databases and login
ALTER ROLE gtax_user WITH LOGIN SUPERUSER CREATEDB;

-- 3. Reset password explicitly (fixes password authentication failed in Navicat)
-- If your Navicat is older (Navicat 12 or 15), uncomment the SET line below:
-- SET password_encryption = 'md5';
ALTER ROLE gtax_user WITH PASSWORD 'gtax_password';

-- 4. Verify user exists and can login:
SELECT rolname, rolcanlogin, rolsuper, rolcreatedb 
FROM pg_roles 
WHERE rolname = 'gtax_user';

-- =========================================================================
-- STEP 2: Create Database 'gtax_db' (Run if gtax_db does not exist yet)
-- In Navicat: Right-click your server -> New Database -> Name: gtax_db, Owner: gtax_user
-- Or execute:
-- =========================================================================
-- CREATE DATABASE gtax_db OWNER gtax_user;

-- =========================================================================
-- STEP 3: Grant permissions on gtax_db (Run inside gtax_db Query Editor)
-- =========================================================================
GRANT ALL PRIVILEGES ON DATABASE gtax_db TO gtax_user;
GRANT ALL ON SCHEMA public TO gtax_user;
ALTER SCHEMA public OWNER TO gtax_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gtax_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gtax_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO gtax_user;

-- =========================================================================
-- STEP 4: Create User & Role Tables in gtax_db
-- =========================================================================

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
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- Seed Initial Superadmin and Roles
INSERT INTO tbl_role (id, role_name, description) VALUES
(1, 'superadmin', 'Unrestricted Master Control & System Oversight'),
(2, 'admin', 'Corporate Tax Manager & Department Security Admin'),
(3, 'operator', 'Tax Operations Specialist & Real-Time Sync Operator'),
(4, 'user', 'Standard Tax Analyst & Invoicing Reviewer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tbl_user (id, fullname, email, password, mobile, employee_id, insert_by, insert_on, update_by, update_on, is_active) VALUES
(1, 'Eleanor Vance (Chief Tax Officer)', 'superadmin@gtax.enterprise', 'Password123!', '+1 (555) 019-2831', 'EMP-SA-001', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true),
(2, 'Marcus Thorne (Senior Tax Strategist)', 'admin@gtax.enterprise', 'Password123!', '+1 (555) 024-8192', 'EMP-ADM-002', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true),
(3, 'Sarah Chen (Global Compliance Director)', 'operator@gtax.enterprise', 'Password123!', '+1 (555) 038-7241', 'EMP-OP-003', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true),
(4, 'Julian Keller (Tax Analyst)', 'user@gtax.enterprise', 'Password123!', '+1 (555) 042-9918', 'EMP-USR-004', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO tbl_user_role (user_id, role_id) VALUES
(1, 1), (2, 2), (3, 3), (4, 4)
ON CONFLICT DO NOTHING;

-- =========================================================================
-- STEP 5: Synchronize Auto-Increment Sequences (CRITICAL for Navicat & App)
-- Ensures new users added from the UI or Navicat get the next ID without duplicate key error
-- =========================================================================
SELECT setval(pg_get_serial_sequence('tbl_user', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user), 0), 1));
SELECT setval(pg_get_serial_sequence('tbl_role', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_role), 0), 1));
SELECT setval(pg_get_serial_sequence('tbl_user_role', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user_role), 0), 1));

-- Verify users in tbl_user:
SELECT id, fullname, email, mobile, is_active FROM tbl_user ORDER BY id ASC;
