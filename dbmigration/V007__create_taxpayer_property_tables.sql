-- =========================================================================
-- Migration: V007__create_taxpayer_property_tables.sql
-- Description: Nepali & Indian Municipal Taxpayer, Fiscal Year, Land Rates, 
-- Malpot Rates, Construction, Depreciation, Taxpayer Master, Land, House & Floors
-- Mandatory BaseFrame Audit Columns included on every table:
-- insert_by, insert_on, update_by, update_on, delete_by, deleted_on, is_active, is_deleted
-- =========================================================================

-- 1. tbl_fiscal_year
CREATE TABLE IF NOT EXISTS tbl_fiscal_year (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL, -- e.g. '080/81', '2024/25'
    fullname VARCHAR(200) NOT NULL, -- 'Fiscal Year 2080/2081 BS'
    date_from_bs VARCHAR(20) NOT NULL, -- '2080-04-01'
    date_from_ad DATE NOT NULL, -- '2023-07-17'
    date_to_ad DATE NOT NULL, -- '2024-07-15'
    date_to_bs VARCHAR(20) NOT NULL, -- '2081-03-31'
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 2. tbl_unit (Measuring units: Ropani, Aana, Paisa, Daam, Kattha, Bigha, Sq.Ft, Sq.Meter)
CREATE TABLE IF NOT EXISTS tbl_unit (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    fullanme VARCHAR(200) NOT NULL,
    unit_value NUMERIC(14, 4) DEFAULT 1.0000 NOT NULL, -- Conversion ratio to square feet
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 3. tbl_construction_type (R.C.C. Frame, Brick Masonry, Mud Masonry, Steel Structure, Wood)
CREATE TABLE IF NOT EXISTS tbl_construction_type (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    fullanme VARCHAR(200) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 4. tbl_land_nature (Agricultural, Commercial, Residential, Industrial, Highway-Facing)
CREATE TABLE IF NOT EXISTS tbl_land_nature (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    fullanme VARCHAR(200) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 5. tbl_land_rate
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
    ward_no_ids TEXT NOT NULL, -- e.g. '1,2,3,4'
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 6. tbl_malpot_rates (Government Land Revenue evaluation matrix)
CREATE TABLE IF NOT EXISTS tbl_malpot_rates (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    fullanme VARCHAR(200) NOT NULL,
    fiscal_year_id INT REFERENCES tbl_fiscal_year(id) NOT NULL,
    is_parent BOOLEAN DEFAULT FALSE NOT NULL,
    parent_id INT REFERENCES tbl_malpot_rates(id) DEFAULT NULL,
    unit_id INT REFERENCES tbl_unit(id) NOT NULL,
    rate_per_unit NUMERIC(14, 2) NOT NULL,
    area_upto NUMERIC(14, 2) DEFAULT 0.00,
    area_per_unit NUMERIC(14, 2) DEFAULT 1.00,
    ward_no_ids TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 7. tbl_construction_rates
CREATE TABLE IF NOT EXISTS tbl_construction_rates (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    fullanme VARCHAR(200) NOT NULL,
    fiscal_year_id INT REFERENCES tbl_fiscal_year(id) NOT NULL,
    is_parent BOOLEAN DEFAULT FALSE NOT NULL,
    parent_id INT REFERENCES tbl_construction_rates(id) DEFAULT NULL,
    const_type_id INT REFERENCES tbl_construction_type(id) NOT NULL,
    unit_id INT REFERENCES tbl_unit(id) NOT NULL,
    rate_per_unit NUMERIC(14, 2) NOT NULL,
    area_upto NUMERIC(14, 2) DEFAULT 0.00,
    area_per_unit NUMERIC(14, 2) DEFAULT 1.00,
    ward_no_ids TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 8. tbl_depreciation (Structure aging depreciation brackets)
CREATE TABLE IF NOT EXISTS tbl_depreciation (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) NOT NULL,
    fullanme VARCHAR(200) NOT NULL,
    fiscal_year_id INT REFERENCES tbl_fiscal_year(id) NOT NULL,
    is_parent BOOLEAN DEFAULT FALSE NOT NULL,
    parent_id INT REFERENCES tbl_depreciation(id) DEFAULT NULL,
    sn INT NOT NULL,
    year_from INT NOT NULL,
    year_to INT NOT NULL,
    percent NUMERIC(8, 4) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 9. tbl_fine_rebate
CREATE TABLE IF NOT EXISTS tbl_fine_rebate (
    id SERIAL PRIMARY KEY,
    fiscal_year_id INT REFERENCES tbl_fiscal_year(id) NOT NULL,
    tax_type_id INT DEFAULT 1,
    ratesn INT NOT NULL,
    years INT DEFAULT 0,
    month INT DEFAULT 0,
    calcpercent NUMERIC(8, 4) DEFAULT 0.00,
    ratepercent NUMERIC(8, 4) DEFAULT 0.00,
    flatrate NUMERIC(14, 2) DEFAULT 0.00,
    isfine BOOLEAN DEFAULT TRUE NOT NULL,
    days INT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 10. tbl_taxpayer_master
CREATE TABLE IF NOT EXISTS tbl_taxpayer_master (
    id SERIAL PRIMARY KEY,
    code VARCHAR(64) UNIQUE NOT NULL, -- e.g. 'TP-2080-0012'
    fullanme VARCHAR(255) NOT NULL,
    mobile_no VARCHAR(32) NOT NULL,
    tax_type_id INT DEFAULT 1,
    email VARCHAR(255),
    ward_no INT DEFAULT 1,
    pan_vat_no VARCHAR(64),
    citizenship_no VARCHAR(64),
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 11. tbl_land
CREATE TABLE IF NOT EXISTS tbl_land (
    id SERIAL PRIMARY KEY,
    taxpayer_id INT REFERENCES tbl_taxpayer_master(id) ON DELETE CASCADE NOT NULL,
    kitta_number VARCHAR(64) NOT NULL,
    moth_number VARCHAR(64) NOT NULL,
    ward_no INT DEFAULT 1,
    area_sqfeet NUMERIC(14, 2) NOT NULL,
    include_in_evaluation BOOLEAN DEFAULT TRUE NOT NULL,
    land_measuring_unit_id INT REFERENCES tbl_unit(id) NOT NULL,
    nature_id INT REFERENCES tbl_land_nature(id) NOT NULL,
    land_rate_id INT REFERENCES tbl_land_rate(id) NOT NULL,
    malpot_rate_id INT REFERENCES tbl_malpot_rates(id) NOT NULL,
    assessed_valuation NUMERIC(14, 2) DEFAULT 0.00,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 12. tbl_house
CREATE TABLE IF NOT EXISTS tbl_house (
    id SERIAL PRIMARY KEY,
    taxpayer_id INT REFERENCES tbl_taxpayer_master(id) ON DELETE CASCADE NOT NULL,
    land_id INT REFERENCES tbl_land(id) ON DELETE SET NULL,
    house_no VARCHAR(64) NOT NULL,
    area_sqfeet NUMERIC(14, 2) NOT NULL,
    acquisition_date_bs VARCHAR(20) NOT NULL,
    acquisition_date_ad DATE NOT NULL,
    plinth_area NUMERIC(14, 2) NOT NULL,
    floor_no INT DEFAULT 1 NOT NULL,
    include_in_evaluation BOOLEAN DEFAULT TRUE NOT NULL,
    measuring_unit_id INT REFERENCES tbl_unit(id) NOT NULL,
    construction_type_id INT REFERENCES tbl_construction_type(id) NOT NULL,
    assessed_valuation NUMERIC(14, 2) DEFAULT 0.00,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 13. tbl_floor
CREATE TABLE IF NOT EXISTS tbl_floor (
    id SERIAL PRIMARY KEY,
    house_id INT REFERENCES tbl_house(id) ON DELETE CASCADE NOT NULL,
    floor_no INT NOT NULL, -- 0 for Ground, 1 for First Floor, etc.
    construction_date_ad DATE NOT NULL,
    construction_date_bs VARCHAR(20) NOT NULL,
    construction_type_id INT REFERENCES tbl_construction_type(id) NOT NULL,
    area_sqfeet NUMERIC(14, 2) NOT NULL,
    include_in_evaluation BOOLEAN DEFAULT TRUE NOT NULL,
    rate_id INT REFERENCES tbl_construction_rates(id) NOT NULL,
    remarks VARCHAR(255),
    measuring_unit_id INT REFERENCES tbl_unit(id) NOT NULL,
    depreciation_percent NUMERIC(8, 4) DEFAULT 0.00,
    floor_assessed_valuation NUMERIC(14, 2) DEFAULT 0.00,
    is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);
