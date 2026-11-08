-- =========================================================================
-- Migration: V010__fix_audit_columns_defaults_and_constraints.sql
-- Description: Ensures insert_by and update_by audit columns have DEFAULT '1'
-- across all tables in existing and fresh databases. Prevents NULL constraint
-- errors when inserting roles, users, or taxpayers without explicit audit columns.
-- =========================================================================

DO $$
DECLARE
    tbl text;
    col text;
BEGIN
    -- 1. Loop through all public base tables and enforce default values on audit columns
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('schema_version_tracker')
    LOOP
        -- Fix insert_by: Set DEFAULT '1' and fill existing NULLs
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tbl AND column_name='insert_by') THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN insert_by SET DEFAULT ''1'';', tbl);
            EXECUTE format('UPDATE %I SET insert_by = ''1'' WHERE insert_by IS NULL;', tbl);
        END IF;

        -- Fix update_by: Set DEFAULT '1' and fill existing NULLs
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tbl AND column_name='update_by') THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN update_by SET DEFAULT ''1'';', tbl);
            EXECUTE format('UPDATE %I SET update_by = ''1'' WHERE update_by IS NULL;', tbl);
        END IF;

        -- Fix insert_on: Set DEFAULT CURRENT_TIMESTAMP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tbl AND column_name='insert_on') THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN insert_on SET DEFAULT CURRENT_TIMESTAMP;', tbl);
        END IF;

        -- Fix update_on: Set DEFAULT CURRENT_TIMESTAMP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tbl AND column_name='update_on') THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN update_on SET DEFAULT CURRENT_TIMESTAMP;', tbl);
        END IF;

        -- Fix is_active: Set DEFAULT TRUE
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tbl AND column_name='is_active') THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN is_active SET DEFAULT TRUE;', tbl);
            EXECUTE format('UPDATE %I SET is_active = TRUE WHERE is_active IS NULL;', tbl);
        END IF;

        -- Fix is_deleted: Set DEFAULT FALSE
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=tbl AND column_name='is_deleted') THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN is_deleted SET DEFAULT FALSE;', tbl);
            EXECUTE format('UPDATE %I SET is_deleted = FALSE WHERE is_deleted IS NULL;', tbl);
        END IF;
    END LOOP;
END $$;

-- 2. Ensure unique constraint on tbl_user_role for ON CONFLICT resolution
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tbl_user_role') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'tbl_user_role_user_id_role_id_key'
        ) THEN
            ALTER TABLE tbl_user_role ADD CONSTRAINT tbl_user_role_user_id_role_id_key UNIQUE (user_id, role_id);
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- 3. Ensure default seed data in tbl_role and tbl_user
INSERT INTO tbl_role (id, role_name, description, insert_by, update_by) VALUES
(1, 'superadmin', 'Unrestricted Master Control & System Oversight', '1', '1'),
(2, 'admin', 'Corporate Tax Manager & Department Security Admin', '1', '1'),
(3, 'operator', 'Tax Operations Specialist & Real-Time Sync Operator', '1', '1'),
(4, 'user', 'Standard Tax Analyst & Invoicing Reviewer', '1', '1')
ON CONFLICT (id) DO UPDATE SET
    role_name = EXCLUDED.role_name,
    description = EXCLUDED.description;

INSERT INTO tbl_user (id, fullname, email, password, mobile, employee_id, insert_by, update_by, is_active) VALUES
(1, 'Eleanor Vance (Chief Tax Officer)', 'superadmin@gtax.enterprise', 'Password123!', '+1 (555) 019-2831', 'EMP-SA-001', '1', '1', true),
(2, 'Marcus Thorne (Senior Tax Strategist)', 'admin@gtax.enterprise', 'Password123!', '+1 (555) 024-8192', 'EMP-ADM-002', '1', '1', true),
(3, 'Sarah Chen (Global Compliance Director)', 'operator@gtax.enterprise', 'Password123!', '+1 (555) 038-7241', 'EMP-OP-003', '1', '1', true),
(4, 'Julian Keller (Tax Analyst)', 'user@gtax.enterprise', 'Password123!', '+1 (555) 042-9918', 'EMP-USR-004', '1', '1', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO tbl_user_role (user_id, role_id, insert_by, update_by) VALUES
(1, 1, '1', '1'),
(2, 2, '1', '1'),
(3, 3, '1', '1'),
(4, 4, '1', '1')
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Synchronize sequences
SELECT setval(pg_get_serial_sequence('tbl_role', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_role), 0), 1));
SELECT setval(pg_get_serial_sequence('tbl_user', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user), 0), 1));
SELECT setval(pg_get_serial_sequence('tbl_user_role', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user_role), 0), 1));
