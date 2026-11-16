-- =========================================================================
-- Migration: V011__align_all_table_columns_with_ui.sql
-- Description: Align all table columns and column aliases across PostgreSQL
-- tables with client-side UI and models:
--   - tbl_taxpayer: mobile, phone_number, phone, mobile_no, full_name, fullname,
--                   pan_number, pan_vat_no, citizenship_number, citizenship_no,
--                   taxpayer_code, taxpayer_id, code
--   - tbl_user: username, user_id, role, full_name, fullname, password, password_hash
--   - tbl_company: company_name, fullname, phone_number, pan_number
--   - tbl_fiscal_year: name, bs_year, ad_year, drop NOT NULL on dates
--   - tbl_unit: fullname, name, symbol, unit_value, drop NOT NULL on fullanme
--   - tbl_construction_type: fullname, name, depreciation_rate, drop NOT NULL
--   - tbl_land_nature: fullname, name, drop NOT NULL
--   - tbl_land: kitta_no, moth_no, area_sqft, unit_id, drop NOT NULL on kitta/moth/area
--   - tbl_house: area_sqft, house_number, drop NOT NULL on house_no/area
--   - tbl_floor: area_sqft, drop NOT NULL on construction dates
--   - tbl_user_log: action_type, client_ip, module_name, created_at
--   - Rates tables: fullname, name
-- =========================================================================

DO $$
BEGIN
    -- 1. tbl_taxpayer
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tbl_taxpayer') THEN
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS mobile VARCHAR(32);
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS phone_number VARCHAR(32);
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS mobile_no VARCHAR(32);
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS fullname VARCHAR(255);
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS pan_number VARCHAR(64);
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS pan_vat_no VARCHAR(64);
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS citizenship_number VARCHAR(64);
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS citizenship_no VARCHAR(64);
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS taxpayer_code VARCHAR(64);
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS taxpayer_id VARCHAR(64);
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS code VARCHAR(64);
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS email VARCHAR(255);
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS tax_type_id INT DEFAULT 1;
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS tole_village VARCHAR(128);
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS gender VARCHAR(16) DEFAULT 'MALE';
        ALTER TABLE tbl_taxpayer ADD COLUMN IF NOT EXISTS registration_date DATE DEFAULT CURRENT_DATE;

        -- Auto-heal aliases
        UPDATE tbl_taxpayer SET mobile = COALESCE(mobile, phone_number, mobile_no, phone) WHERE mobile IS NULL;
        UPDATE tbl_taxpayer SET phone_number = COALESCE(phone_number, mobile, mobile_no, phone) WHERE phone_number IS NULL;
        UPDATE tbl_taxpayer SET full_name = COALESCE(full_name, fullname) WHERE full_name IS NULL;
        UPDATE tbl_taxpayer SET fullname = COALESCE(fullname, full_name) WHERE fullname IS NULL;
        UPDATE tbl_taxpayer SET pan_number = COALESCE(pan_number, pan_vat_no) WHERE pan_number IS NULL;
        UPDATE tbl_taxpayer SET citizenship_number = COALESCE(citizenship_number, citizenship_no) WHERE citizenship_number IS NULL;
        UPDATE tbl_taxpayer SET citizenship_no = COALESCE(citizenship_no, citizenship_number) WHERE citizenship_no IS NULL;
        UPDATE tbl_taxpayer SET taxpayer_code = COALESCE(taxpayer_code, taxpayer_id, code, 'TP-' || id) WHERE taxpayer_code IS NULL;
        UPDATE tbl_taxpayer SET taxpayer_id = COALESCE(taxpayer_id, taxpayer_code) WHERE taxpayer_id IS NULL;
    END IF;

    -- 2. tbl_user
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tbl_user') THEN
        ALTER TABLE tbl_user ADD COLUMN IF NOT EXISTS username VARCHAR(100);
        ALTER TABLE tbl_user ADD COLUMN IF NOT EXISTS user_id VARCHAR(50);
        ALTER TABLE tbl_user ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'OPERATOR';
        ALTER TABLE tbl_user ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);
        ALTER TABLE tbl_user ADD COLUMN IF NOT EXISTS fullname VARCHAR(200);
        ALTER TABLE tbl_user ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
        ALTER TABLE tbl_user ADD COLUMN IF NOT EXISTS phone VARCHAR(32);
        ALTER TABLE tbl_user ALTER COLUMN password DROP NOT NULL;
        ALTER TABLE tbl_user ALTER COLUMN effective_from DROP NOT NULL;

        UPDATE tbl_user SET username = SPLIT_PART(email, '@', 1) WHERE username IS NULL OR username = '';
        UPDATE tbl_user SET user_id = 'USR_' || id WHERE user_id IS NULL OR user_id = '';
        UPDATE tbl_user SET full_name = COALESCE(full_name, fullname) WHERE full_name IS NULL;
        UPDATE tbl_user SET fullname = COALESCE(fullname, full_name) WHERE fullname IS NULL;
        UPDATE tbl_user SET password = COALESCE(password, password_hash, 'Password123!') WHERE password IS NULL;
        UPDATE tbl_user SET password_hash = COALESCE(password_hash, password) WHERE password_hash IS NULL;
    END IF;

    -- 3. tbl_company
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tbl_company') THEN
        ALTER TABLE tbl_company ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
        ALTER TABLE tbl_company ADD COLUMN IF NOT EXISTS fullname VARCHAR(255);
        ALTER TABLE tbl_company ADD COLUMN IF NOT EXISTS phone_number VARCHAR(64);
        ALTER TABLE tbl_company ADD COLUMN IF NOT EXISTS pan_number VARCHAR(64);

        UPDATE tbl_company SET company_name = COALESCE(company_name, name, fullname) WHERE company_name IS NULL;
        UPDATE tbl_company SET fullname = COALESCE(fullname, name, company_name) WHERE fullname IS NULL;
        UPDATE tbl_company SET name = COALESCE(name, company_name, fullname) WHERE name IS NULL;
        UPDATE tbl_company SET phone = COALESCE(phone, phone_number) WHERE phone IS NULL;
        UPDATE tbl_company SET phone_number = COALESCE(phone_number, phone) WHERE phone_number IS NULL;
    END IF;

    -- 4. tbl_fiscal_year
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tbl_fiscal_year') THEN
        ALTER TABLE tbl_fiscal_year ADD COLUMN IF NOT EXISTS name VARCHAR(200);
        ALTER TABLE tbl_fiscal_year ADD COLUMN IF NOT EXISTS bs_year VARCHAR(50);
        ALTER TABLE tbl_fiscal_year ADD COLUMN IF NOT EXISTS ad_year VARCHAR(50);
        ALTER TABLE tbl_fiscal_year ALTER COLUMN date_from_bs DROP NOT NULL;
        ALTER TABLE tbl_fiscal_year ALTER COLUMN date_from_ad DROP NOT NULL;
        ALTER TABLE tbl_fiscal_year ALTER COLUMN date_to_ad DROP NOT NULL;
        ALTER TABLE tbl_fiscal_year ALTER COLUMN date_to_bs DROP NOT NULL;

        UPDATE tbl_fiscal_year SET name = COALESCE(name, fullname, code) WHERE name IS NULL;
        UPDATE tbl_fiscal_year SET fullname = COALESCE(fullname, name, code) WHERE fullname IS NULL;
    END IF;

    -- 5. tbl_unit
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tbl_unit') THEN
        ALTER TABLE tbl_unit ADD COLUMN IF NOT EXISTS fullname VARCHAR(200);
        ALTER TABLE tbl_unit ADD COLUMN IF NOT EXISTS name VARCHAR(200);
        ALTER TABLE tbl_unit ADD COLUMN IF NOT EXISTS symbol VARCHAR(50);
        ALTER TABLE tbl_unit ALTER COLUMN fullanme DROP NOT NULL;
        ALTER TABLE tbl_unit ALTER COLUMN unit_value DROP NOT NULL;

        UPDATE tbl_unit SET name = COALESCE(name, fullanme, fullname, code) WHERE name IS NULL;
        UPDATE tbl_unit SET fullanme = COALESCE(fullanme, name, fullname, code) WHERE fullanme IS NULL;
        UPDATE tbl_unit SET fullname = COALESCE(fullname, fullanme, name, code) WHERE fullname IS NULL;
        UPDATE tbl_unit SET symbol = COALESCE(symbol, code) WHERE symbol IS NULL;
        UPDATE tbl_unit SET unit_value = 1.0000 WHERE unit_value IS NULL;
    END IF;

    -- 6. tbl_construction_type
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tbl_construction_type') THEN
        ALTER TABLE tbl_construction_type ADD COLUMN IF NOT EXISTS fullname VARCHAR(200);
        ALTER TABLE tbl_construction_type ADD COLUMN IF NOT EXISTS name VARCHAR(200);
        ALTER TABLE tbl_construction_type ADD COLUMN IF NOT EXISTS depreciation_rate NUMERIC(8, 4) DEFAULT 0.00;
        ALTER TABLE tbl_construction_type ALTER COLUMN fullanme DROP NOT NULL;

        UPDATE tbl_construction_type SET name = COALESCE(name, fullanme, fullname, code) WHERE name IS NULL;
        UPDATE tbl_construction_type SET fullanme = COALESCE(fullanme, name, fullname, code) WHERE fullanme IS NULL;
        UPDATE tbl_construction_type SET fullname = COALESCE(fullname, fullanme, name, code) WHERE fullname IS NULL;
    END IF;

    -- 7. tbl_land_nature
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tbl_land_nature') THEN
        ALTER TABLE tbl_land_nature ADD COLUMN IF NOT EXISTS fullname VARCHAR(200);
        ALTER TABLE tbl_land_nature ADD COLUMN IF NOT EXISTS name VARCHAR(200);
        ALTER TABLE tbl_land_nature ALTER COLUMN fullanme DROP NOT NULL;

        UPDATE tbl_land_nature SET name = COALESCE(name, fullanme, fullname, code) WHERE name IS NULL;
        UPDATE tbl_land_nature SET fullanme = COALESCE(fullanme, name, fullname, code) WHERE fullanme IS NULL;
        UPDATE tbl_land_nature SET fullname = COALESCE(fullname, fullanme, name, code) WHERE fullname IS NULL;
    END IF;

    -- 8. tbl_land
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tbl_land') THEN
        ALTER TABLE tbl_land ADD COLUMN IF NOT EXISTS kitta_no VARCHAR(64);
        ALTER TABLE tbl_land ADD COLUMN IF NOT EXISTS moth_no VARCHAR(64);
        ALTER TABLE tbl_land ADD COLUMN IF NOT EXISTS area_sqft NUMERIC(14, 2);
        ALTER TABLE tbl_land ADD COLUMN IF NOT EXISTS unit_id INT;
        ALTER TABLE tbl_land ALTER COLUMN kitta_number DROP NOT NULL;
        ALTER TABLE tbl_land ALTER COLUMN moth_number DROP NOT NULL;
        ALTER TABLE tbl_land ALTER COLUMN area_sqfeet DROP NOT NULL;
        ALTER TABLE tbl_land ALTER COLUMN land_measuring_unit_id DROP NOT NULL;
        ALTER TABLE tbl_land ALTER COLUMN nature_id DROP NOT NULL;
        ALTER TABLE tbl_land ALTER COLUMN land_rate_id DROP NOT NULL;
        ALTER TABLE tbl_land ALTER COLUMN malpot_rate_id DROP NOT NULL;

        UPDATE tbl_land SET kitta_no = COALESCE(kitta_no, kitta_number) WHERE kitta_no IS NULL;
        UPDATE tbl_land SET kitta_number = COALESCE(kitta_number, kitta_no) WHERE kitta_number IS NULL;
        UPDATE tbl_land SET moth_no = COALESCE(moth_no, moth_number) WHERE moth_no IS NULL;
        UPDATE tbl_land SET moth_number = COALESCE(moth_number, moth_no) WHERE moth_number IS NULL;
        UPDATE tbl_land SET area_sqft = COALESCE(area_sqft, area_sqfeet) WHERE area_sqft IS NULL;
        UPDATE tbl_land SET area_sqfeet = COALESCE(area_sqfeet, area_sqft) WHERE area_sqfeet IS NULL;
        UPDATE tbl_land SET unit_id = COALESCE(unit_id, land_measuring_unit_id) WHERE unit_id IS NULL;
        UPDATE tbl_land SET land_measuring_unit_id = COALESCE(land_measuring_unit_id, unit_id) WHERE land_measuring_unit_id IS NULL;
    END IF;

    -- 9. tbl_house
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tbl_house') THEN
        ALTER TABLE tbl_house ADD COLUMN IF NOT EXISTS area_sqft NUMERIC(14, 2);
        ALTER TABLE tbl_house ADD COLUMN IF NOT EXISTS house_number VARCHAR(64);
        ALTER TABLE tbl_house ALTER COLUMN house_no DROP NOT NULL;
        ALTER TABLE tbl_house ALTER COLUMN area_sqfeet DROP NOT NULL;
        ALTER TABLE tbl_house ALTER COLUMN acquisition_date_bs DROP NOT NULL;
        ALTER TABLE tbl_house ALTER COLUMN acquisition_date_ad DROP NOT NULL;
        ALTER TABLE tbl_house ALTER COLUMN plinth_area DROP NOT NULL;
        ALTER TABLE tbl_house ALTER COLUMN measuring_unit_id DROP NOT NULL;
        ALTER TABLE tbl_house ALTER COLUMN construction_type_id DROP NOT NULL;

        UPDATE tbl_house SET area_sqft = COALESCE(area_sqft, area_sqfeet) WHERE area_sqft IS NULL;
        UPDATE tbl_house SET area_sqfeet = COALESCE(area_sqfeet, area_sqft) WHERE area_sqfeet IS NULL;
        UPDATE tbl_house SET house_number = COALESCE(house_number, house_no) WHERE house_number IS NULL;
        UPDATE tbl_house SET house_no = COALESCE(house_no, house_number) WHERE house_no IS NULL;
    END IF;

    -- 10. tbl_floor
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tbl_floor') THEN
        ALTER TABLE tbl_floor ADD COLUMN IF NOT EXISTS area_sqft NUMERIC(14, 2);
        ALTER TABLE tbl_floor ALTER COLUMN construction_date_ad DROP NOT NULL;
        ALTER TABLE tbl_floor ALTER COLUMN construction_date_bs DROP NOT NULL;
        ALTER TABLE tbl_floor ALTER COLUMN construction_type_id DROP NOT NULL;
        ALTER TABLE tbl_floor ALTER COLUMN area_sqfeet DROP NOT NULL;
        ALTER TABLE tbl_floor ALTER COLUMN rate_id DROP NOT NULL;
        ALTER TABLE tbl_floor ALTER COLUMN measuring_unit_id DROP NOT NULL;

        UPDATE tbl_floor SET area_sqft = COALESCE(area_sqft, area_sqfeet) WHERE area_sqft IS NULL;
        UPDATE tbl_floor SET area_sqfeet = COALESCE(area_sqfeet, area_sqft) WHERE area_sqfeet IS NULL;
    END IF;

    -- 11. tbl_user_log
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tbl_user_log') THEN
        ALTER TABLE tbl_user_log ADD COLUMN IF NOT EXISTS action_type VARCHAR(100);
        ALTER TABLE tbl_user_log ADD COLUMN IF NOT EXISTS module_name VARCHAR(100);
        ALTER TABLE tbl_user_log ADD COLUMN IF NOT EXISTS client_ip VARCHAR(64);
        ALTER TABLE tbl_user_log ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE;

        UPDATE tbl_user_log SET action_type = COALESCE(action_type, action_name) WHERE action_type IS NULL;
        UPDATE tbl_user_log SET action_name = COALESCE(action_name, action_type) WHERE action_name IS NULL;
        UPDATE tbl_user_log SET client_ip = COALESCE(client_ip, ip_address) WHERE client_ip IS NULL;
        UPDATE tbl_user_log SET ip_address = COALESCE(ip_address, client_ip) WHERE ip_address IS NULL;
        UPDATE tbl_user_log SET created_at = COALESCE(created_at, insert_on) WHERE created_at IS NULL;
    END IF;

    -- 12. Rate tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tbl_land_rate') THEN
        ALTER TABLE tbl_land_rate ADD COLUMN IF NOT EXISTS fullname VARCHAR(200);
        ALTER TABLE tbl_land_rate ADD COLUMN IF NOT EXISTS name VARCHAR(200);
        UPDATE tbl_land_rate SET fullname = COALESCE(fullname, fullanme, name, code) WHERE fullname IS NULL;
        UPDATE tbl_land_rate SET name = COALESCE(name, fullname, fullanme, code) WHERE name IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tbl_malpot_rates') THEN
        ALTER TABLE tbl_malpot_rates ADD COLUMN IF NOT EXISTS fullname VARCHAR(200);
        ALTER TABLE tbl_malpot_rates ADD COLUMN IF NOT EXISTS name VARCHAR(200);
        UPDATE tbl_malpot_rates SET fullname = COALESCE(fullname, fullanme, name, code) WHERE fullname IS NULL;
        UPDATE tbl_malpot_rates SET name = COALESCE(name, fullname, fullanme, code) WHERE name IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tbl_construction_rates') THEN
        ALTER TABLE tbl_construction_rates ADD COLUMN IF NOT EXISTS fullname VARCHAR(200);
        ALTER TABLE tbl_construction_rates ADD COLUMN IF NOT EXISTS name VARCHAR(200);
        UPDATE tbl_construction_rates SET fullname = COALESCE(fullname, fullanme, name, code) WHERE fullname IS NULL;
        UPDATE tbl_construction_rates SET name = COALESCE(name, fullname, fullanme, code) WHERE name IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tbl_depreciation') THEN
        ALTER TABLE tbl_depreciation ADD COLUMN IF NOT EXISTS fullname VARCHAR(200);
        ALTER TABLE tbl_depreciation ADD COLUMN IF NOT EXISTS name VARCHAR(200);
        UPDATE tbl_depreciation SET fullname = COALESCE(fullname, fullanme, name, code) WHERE fullname IS NULL;
        UPDATE tbl_depreciation SET name = COALESCE(name, fullname, fullanme, code) WHERE name IS NULL;
    END IF;
END $$;
