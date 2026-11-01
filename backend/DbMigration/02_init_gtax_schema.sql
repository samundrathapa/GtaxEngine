-- =========================================================================
-- Step 2: Initialize Tables and Base Seed Data in gtax_db
-- Run this as gtax_user:
--   PGPASSWORD='gtax_password' psql -h localhost -U gtax_user -d gtax_db -f database/02_init_gtax_schema.sql
-- =========================================================================
-- Note for Navicat / GUI: Connect to gtax_db directly before running this script.
-- \connect gtax_db

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. tbl_fiscal_year
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_fiscal_year (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    fullname VARCHAR(200) NOT NULL,
    date_from_bs VARCHAR(20) NOT NULL,
    date_from_ad DATE NOT NULL,
    date_to_ad DATE NOT NULL,
    date_to_bs VARCHAR(20) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- -------------------------------------------------------------------------
-- 2. tbl_unit (Measuring units: Ropani, Aana, Paisa, Daam, Kattha, Bigha, Sq.Ft)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_unit (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    fullanme VARCHAR(200) NOT NULL,
    unit_value NUMERIC(14, 4) DEFAULT 1.0000 NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- -------------------------------------------------------------------------
-- 3. tbl_construction_type (RCC, Brick, Mud, Steel, Wood)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_construction_type (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    fullanme VARCHAR(200) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- -------------------------------------------------------------------------
-- 4. tbl_land_nature (Residential, Commercial, Agricultural, Industrial)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_land_nature (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    fullanme VARCHAR(200) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- -------------------------------------------------------------------------
-- 5. tbl_land_rate (Municipal Land Valuation Rates)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_land_rate (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    fullanme VARCHAR(200) NOT NULL,
    fiscal_year_id INT REFERENCES tbl_fiscal_year(id) NOT NULL,
    is_parent BOOLEAN DEFAULT FALSE NOT NULL,
    parent_id INT REFERENCES tbl_land_rate(id) DEFAULT NULL,
    unit_id INT REFERENCES tbl_unit(id) NOT NULL,
    rate_per_unit NUMERIC(14, 2) NOT NULL,
    area_upto NUMERIC(14, 2) DEFAULT 0.00,
    area_per_unit NUMERIC(14, 2) DEFAULT 1.00,
    ward_no_ids TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- -------------------------------------------------------------------------
-- 6. tbl_malpot_rates (Government Land Revenue Valuation Rates)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_malpot_rates (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    fullanme VARCHAR(200) NOT NULL,
    fiscal_year_id INT REFERENCES tbl_fiscal_year(id) NOT NULL,
    unit_id INT REFERENCES tbl_unit(id) NOT NULL,
    rate_per_unit NUMERIC(14, 2) NOT NULL,
    ward_no_ids TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- -------------------------------------------------------------------------
-- 7. tbl_construction_rate (Building Base Construction Rates)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_construction_rate (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    fullanme VARCHAR(200) NOT NULL,
    fiscal_year_id INT REFERENCES tbl_fiscal_year(id) NOT NULL,
    construction_type_id INT REFERENCES tbl_construction_type(id) NOT NULL,
    rate_per_sqft NUMERIC(14, 2) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- -------------------------------------------------------------------------
-- 8. tbl_depreciation (Structure Age Depreciation Slabs)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_depreciation (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    fullanme VARCHAR(200) NOT NULL,
    fiscal_year_id INT REFERENCES tbl_fiscal_year(id) NOT NULL,
    construction_type_id INT REFERENCES tbl_construction_type(id) NOT NULL,
    year_from INT NOT NULL,
    year_to INT NOT NULL,
    depreciation_pct NUMERIC(6, 2) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- -------------------------------------------------------------------------
-- 9. tbl_taxpayer (Citizen Taxpayer Master)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_taxpayer (
    id SERIAL PRIMARY KEY,
    taxpayer_code VARCHAR(32) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    pan_number VARCHAR(32),
    citizenship_number VARCHAR(64),
    phone_number VARCHAR(32) NOT NULL,
    email_address VARCHAR(128),
    ward_no INT NOT NULL,
    tole_village VARCHAR(128),
    gender VARCHAR(16) DEFAULT 'MALE',
    registration_date DATE DEFAULT CURRENT_DATE NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- -------------------------------------------------------------------------
-- 10. tbl_property_master (Citizen Land & Structural Assets)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_property_master (
    id SERIAL PRIMARY KEY,
    property_code VARCHAR(32) UNIQUE NOT NULL,
    taxpayer_id INT REFERENCES tbl_taxpayer(id) ON DELETE CASCADE NOT NULL,
    property_type VARCHAR(64) DEFAULT 'RESIDENTIAL' NOT NULL,
    ward_no INT NOT NULL,
    kitta_no VARCHAR(64) NOT NULL,
    moth_no VARCHAR(64),
    total_area_sqft NUMERIC(14, 2) NOT NULL,
    land_rate_id INT REFERENCES tbl_land_rate(id),
    malpot_rate_id INT REFERENCES tbl_malpot_rates(id),
    estimated_market_value NUMERIC(16, 2) DEFAULT 0.00,
    assessed_taxable_value NUMERIC(16, 2) DEFAULT 0.00,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- -------------------------------------------------------------------------
-- 11. tbl_tax_calculation_year (Multi-Year Calculated Tax Liabilities)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_tax_calculation_year (
    id SERIAL PRIMARY KEY,
    calc_code VARCHAR(64) UNIQUE NOT NULL,
    taxpayer_id INT REFERENCES tbl_taxpayer(id) NOT NULL,
    property_id INT REFERENCES tbl_property_master(id),
    fiscal_year_id INT REFERENCES tbl_fiscal_year(id) NOT NULL,
    land_valuation NUMERIC(16, 2) DEFAULT 0.00,
    building_valuation NUMERIC(16, 2) DEFAULT 0.00,
    total_valuation NUMERIC(16, 2) NOT NULL,
    gross_tax NUMERIC(14, 2) NOT NULL,
    rebate_amount NUMERIC(14, 2) DEFAULT 0.00,
    penalty_amount NUMERIC(14, 2) DEFAULT 0.00,
    cess_levy NUMERIC(14, 2) DEFAULT 0.00,
    net_payable_tax NUMERIC(14, 2) NOT NULL,
    status VARCHAR(32) DEFAULT 'UNPAID' NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- -------------------------------------------------------------------------
-- 12. tbl_users (Staff & Operators)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    role VARCHAR(32) DEFAULT 'OFFICER' NOT NULL,
    ward_access VARCHAR(64) DEFAULT 'ALL',
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
);

-- -------------------------------------------------------------------------
-- 13. tbl_role (RBAC Roles: superadmin, admin, operator, user)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 14. tbl_user (Enterprise Staff, Superadmins, and Operators)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 15. tbl_user_role (Role assignments)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 16. tbl_sync_event (Real-time CDC Audit Ledger)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tbl_sync_event (
    id SERIAL PRIMARY KEY,
    event_uuid VARCHAR(64) UNIQUE NOT NULL,
    table_name VARCHAR(64) NOT NULL,
    action_type VARCHAR(16) NOT NULL, -- INSERT, UPDATE, DELETE
    record_id VARCHAR(64) NOT NULL,
    payload JSONB,
    sync_status VARCHAR(32) DEFAULT 'SYNCED' NOT NULL,
    insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM_INIT',
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- =========================================================================
-- INITIAL BASE SEED DATA (Default Municipal Setup)
-- =========================================================================

-- Seed Fiscal Year 2081/82
INSERT INTO tbl_fiscal_year (code, fullname, date_from_bs, date_from_ad, date_to_ad, date_to_bs, insert_by, update_by)
VALUES ('081/82', 'Fiscal Year 2081/2082 BS (2024/2025 AD)', '2081-04-01', '2024-07-16', '2025-07-15', '2082-03-31', 'SYSTEM_SEED', 'SYSTEM_SEED')
ON CONFLICT (code) DO NOTHING;

-- Seed Units
INSERT INTO tbl_unit (code, fullanme, unit_value, insert_by, update_by) VALUES
('AANA', 'Aana (342.25 Sq.Ft)', 342.25, 'SYSTEM_SEED', 'SYSTEM_SEED'),
('ROPANI', 'Ropani (5476 Sq.Ft / 16 Aana)', 5476.00, 'SYSTEM_SEED', 'SYSTEM_SEED'),
('KATTHA', 'Kattha (3645 Sq.Ft)', 3645.00, 'SYSTEM_SEED', 'SYSTEM_SEED'),
('SQFT', 'Square Feet', 1.00, 'SYSTEM_SEED', 'SYSTEM_SEED')
ON CONFLICT (code) DO NOTHING;

-- Seed Construction Types
INSERT INTO tbl_construction_type (code, fullanme, insert_by, update_by) VALUES
('RCC_FRAME', 'R.C.C. Pillar & Slab Structure Grade A', 'SYSTEM_SEED', 'SYSTEM_SEED'),
('BRICK_MUD', 'Brick with Mud Mortar Traditional Masonry', 'SYSTEM_SEED', 'SYSTEM_SEED'),
('STEEL_TRUSS', 'Industrial Steel Truss & Prefab Panel', 'SYSTEM_SEED', 'SYSTEM_SEED')
ON CONFLICT (code) DO NOTHING;

-- Seed Land Natures
INSERT INTO tbl_land_nature (code, fullanme, insert_by, update_by) VALUES
('RESIDENTIAL', 'Municipal Residential Zone', 'SYSTEM_SEED', 'SYSTEM_SEED'),
('COMMERCIAL', 'High Street Commercial Zone', 'SYSTEM_SEED', 'SYSTEM_SEED'),
('AGRICULTURAL', 'Agricultural / Fertile Cultivation Zone', 'SYSTEM_SEED', 'SYSTEM_SEED')
ON CONFLICT (code) DO NOTHING;

-- Seed Initial Land Rates
INSERT INTO tbl_land_rate (code, fullanme, fiscal_year_id, unit_id, rate_per_unit, ward_no_ids, insert_by, update_by)
SELECT 'LR-001', 'Main Arterial Highway (Paved 40ft)', 1, 1, 1200000.00, '1,2,3,4,5', 'SYSTEM_SEED', 'SYSTEM_SEED'
WHERE NOT EXISTS (SELECT 1 FROM tbl_land_rate WHERE code = 'LR-001');

INSERT INTO tbl_land_rate (code, fullanme, fiscal_year_id, unit_id, rate_per_unit, ward_no_ids, insert_by, update_by)
SELECT 'LR-002', 'Secondary Branch Road (Paved 20ft)', 1, 1, 800000.00, '1,2,3', 'SYSTEM_SEED', 'SYSTEM_SEED'
WHERE NOT EXISTS (SELECT 1 FROM tbl_land_rate WHERE code = 'LR-002');

-- Seed Sample Taxpayers
INSERT INTO tbl_taxpayer (taxpayer_code, full_name, pan_number, citizenship_number, phone_number, ward_no, tole_village, insert_by, update_by)
SELECT 'TP-2081-0001', 'Ram Bahadur Thapa', '600123456', '27-01-70-12345', '9841234567', 3, 'Resunga Marg', 'SYSTEM_SEED', 'SYSTEM_SEED'
WHERE NOT EXISTS (SELECT 1 FROM tbl_taxpayer WHERE taxpayer_code = 'TP-2081-0001');

INSERT INTO tbl_taxpayer (taxpayer_code, full_name, pan_number, citizenship_number, phone_number, ward_no, tole_village, insert_by, update_by)
SELECT 'TP-2081-0002', 'Sita Maya Shrestha', '600987654', '27-01-72-98765', '9851098765', 4, 'Bhanu Chowk', 'SYSTEM_SEED', 'SYSTEM_SEED'
WHERE NOT EXISTS (SELECT 1 FROM tbl_taxpayer WHERE taxpayer_code = 'TP-2081-0002');

-- Seed Roles into tbl_role
INSERT INTO tbl_role (id, role_name, description, insert_by, update_by) VALUES
(1, 'superadmin', 'Unrestricted Master Control & System Oversight', 'SYSTEM_SEED', 'SYSTEM_SEED'),
(2, 'admin', 'Corporate Tax Manager & Department Security Admin', 'SYSTEM_SEED', 'SYSTEM_SEED'),
(3, 'operator', 'Tax Operations Specialist & Real-Time Sync Operator', 'SYSTEM_SEED', 'SYSTEM_SEED'),
(4, 'user', 'Standard Tax Analyst & Invoicing Reviewer', 'SYSTEM_SEED', 'SYSTEM_SEED')
ON CONFLICT (id) DO NOTHING;

-- Seed Users into tbl_user
INSERT INTO tbl_user (id, fullname, email, password, mobile, employee_id, insert_by, insert_on, update_by, update_on, is_active) VALUES
(1, 'Eleanor Vance (Chief Tax Officer)', 'superadmin@gtax.enterprise', 'Password123!', '+1 (555) 019-2831', 'EMP-SA-001', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true),
(2, 'Marcus Thorne (Senior Tax Strategist)', 'admin@gtax.enterprise', 'Password123!', '+1 (555) 024-8192', 'EMP-ADM-002', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true),
(3, 'Sarah Chen (Global Compliance Director)', 'operator@gtax.enterprise', 'Password123!', '+1 (555) 038-7241', 'EMP-OP-003', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true),
(4, 'Julian Keller (Tax Analyst)', 'user@gtax.enterprise', 'Password123!', '+1 (555) 042-9918', 'EMP-USR-004', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true)
ON CONFLICT (email) DO NOTHING;

-- Seed User Roles into tbl_user_role
INSERT INTO tbl_user_role (user_id, role_id, insert_by, update_by) VALUES
(1, 1, 'SYSTEM_SEED', 'SYSTEM_SEED'),
(2, 2, 'SYSTEM_SEED', 'SYSTEM_SEED'),
(3, 3, 'SYSTEM_SEED', 'SYSTEM_SEED'),
(4, 4, 'SYSTEM_SEED', 'SYSTEM_SEED')
ON CONFLICT DO NOTHING;

-- Synchronize sequences for all tables
SELECT setval(pg_get_serial_sequence('tbl_user', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user), 0), 1));
SELECT setval(pg_get_serial_sequence('tbl_role', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_role), 0), 1));
SELECT setval(pg_get_serial_sequence('tbl_user_role', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user_role), 0), 1));
SELECT setval(pg_get_serial_sequence('tbl_fiscal_year', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_fiscal_year), 0), 1));
SELECT setval(pg_get_serial_sequence('tbl_unit', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_unit), 0), 1));
SELECT setval(pg_get_serial_sequence('tbl_construction_type', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_construction_type), 0), 1));
SELECT setval(pg_get_serial_sequence('tbl_land_nature', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_land_nature), 0), 1));
SELECT setval(pg_get_serial_sequence('tbl_land_rate', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_land_rate), 0), 1));
SELECT setval(pg_get_serial_sequence('tbl_taxpayer', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_taxpayer), 0), 1));

\echo '---------------------------------------------------------'
\echo 'SUCCESS: All database tables, seed data, and sequences initialized successfully!'
\echo 'Audit Contract: 7 mandatory audit columns enforced on every table.'
\echo '---------------------------------------------------------'
