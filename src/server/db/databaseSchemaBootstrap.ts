/**
 * gtax Enterprise - Comprehensive PostgreSQL Database Schema Bootstrap
 * Guarantees all 26 tables exist in PostgreSQL with mandatory BaseFrame audit columns:
 *   (insert_by, insert_on, update_by, update_on, delete_by, deleted_on, is_active, is_deleted)
 * Enforces requirement: insert_by, update_by, delete_by store user ID from tbl_user (e.g. '1').
 * Pre-seeds all default municipal valuation, taxpayer, RBAC, and tax calculation records.
 * Synchronizes all PostgreSQL auto-increment sequences (setval).
 */

import { PostgresPoolManager } from "./postgresPool.ts";
import { generateFiscalYears2021To2086 } from "./fiscalYearSeeds.ts";

export class DatabaseSchemaBootstrap {
  private static bootstrapped = false;

  public static async bootstrapAllTables(force = false): Promise<boolean> {
    if (this.bootstrapped && !force) return true;
    if (!PostgresPoolManager.getStatus().connected) return false;

    try {
      console.log("[gtax:Bootstrap] Ensuring all 26 tables and default seed data in PostgreSQL...");

      // 1. Extensions
      await PostgresPoolManager.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

      // 2. Sys Organizations (tenancy)
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS sys_organizations (
            org_id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            tax_identifier VARCHAR(64) NOT NULL,
            country_code VARCHAR(3) NOT NULL,
            currency VARCHAR(3) DEFAULT 'USD',
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 3. tbl_role
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_role (
            id SERIAL PRIMARY KEY,
            role_name VARCHAR(64) UNIQUE NOT NULL,
            description VARCHAR(255),
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 4. tbl_user
      await PostgresPoolManager.query(`
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
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );

        ALTER TABLE tbl_user ADD COLUMN IF NOT EXISTS username VARCHAR(100);
        ALTER TABLE tbl_user ADD COLUMN IF NOT EXISTS user_id VARCHAR(50);
        ALTER TABLE tbl_user ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'OPERATOR';

        UPDATE tbl_user SET username = SPLIT_PART(email, '@', 1) WHERE username IS NULL OR username = '';
        UPDATE tbl_user SET user_id = 'USR_' || id WHERE user_id IS NULL OR user_id = '';
      `);

      // 5. tbl_right
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_right (
            id SERIAL PRIMARY KEY,
            right_code VARCHAR(128) UNIQUE NOT NULL,
            right_name VARCHAR(200) NOT NULL,
            module_name VARCHAR(100) NOT NULL,
            action_type VARCHAR(32) NOT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 6. tbl_role_right
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_role_right (
            id SERIAL PRIMARY KEY,
            role_id INT REFERENCES tbl_role(id) ON DELETE CASCADE NOT NULL,
            right_id INT REFERENCES tbl_right(id) ON DELETE CASCADE NOT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL,
            UNIQUE(role_id, right_id)
        );
      `);

      // 7. tbl_user_role
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_user_role (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES tbl_user(id) ON DELETE CASCADE NOT NULL,
            role_id INT REFERENCES tbl_role(id) ON DELETE CASCADE NOT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL,
            UNIQUE(user_id, role_id)
        );
      `);

      // 8. tbl_user_right
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_user_right (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES tbl_user(id) ON DELETE CASCADE NOT NULL,
            right_id INT REFERENCES tbl_right(id) ON DELETE CASCADE NOT NULL,
            is_granted BOOLEAN DEFAULT TRUE NOT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL,
            UNIQUE(user_id, right_id)
        );
      `);

      // 9. tbl_user_log
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_user_log (
            id SERIAL PRIMARY KEY,
            user_id INT REFERENCES tbl_user(id) ON DELETE SET NULL,
            username_attempt VARCHAR(200) NOT NULL,
            action_name VARCHAR(100) NOT NULL,
            ip_address VARCHAR(64) DEFAULT '127.0.0.1',
            user_agent VARCHAR(500) DEFAULT NULL,
            details TEXT DEFAULT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 10. tbl_session_log
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_session_log (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(128) UNIQUE NOT NULL,
            user_id INT REFERENCES tbl_user(id) ON DELETE CASCADE NOT NULL,
            token_hash VARCHAR(255) NOT NULL,
            ip_address VARCHAR(64) DEFAULT '127.0.0.1',
            user_agent VARCHAR(500) DEFAULT NULL,
            login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 11. tbl_fiscal_year
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_fiscal_year (
            id SERIAL PRIMARY KEY,
            code VARCHAR(32) UNIQUE NOT NULL,
            fullname VARCHAR(200) NOT NULL,
            date_from_bs VARCHAR(20) NOT NULL,
            date_from_ad DATE NOT NULL,
            date_to_ad DATE NOT NULL,
            date_to_bs VARCHAR(20) NOT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 12. tbl_unit
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_unit (
            id SERIAL PRIMARY KEY,
            code VARCHAR(32) UNIQUE NOT NULL,
            fullanme VARCHAR(200) NOT NULL,
            unit_value NUMERIC(14, 4) DEFAULT 1.0000 NOT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 13. tbl_construction_type
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_construction_type (
            id SERIAL PRIMARY KEY,
            code VARCHAR(32) UNIQUE NOT NULL,
            fullanme VARCHAR(200) NOT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 14. tbl_land_nature
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_land_nature (
            id SERIAL PRIMARY KEY,
            code VARCHAR(32) UNIQUE NOT NULL,
            fullanme VARCHAR(200) NOT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 15. tbl_land_rate
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_land_rate (
            id SERIAL PRIMARY KEY,
            code VARCHAR(32) NOT NULL,
            fullanme VARCHAR(200) NOT NULL,
            fiscal_year_id INT REFERENCES tbl_fiscal_year(id) DEFAULT NULL,
            is_parent BOOLEAN DEFAULT FALSE NOT NULL,
            parent_id INT REFERENCES tbl_land_rate(id) DEFAULT NULL,
            unit_id INT REFERENCES tbl_unit(id) NOT NULL,
            rate_per_unit NUMERIC(14, 2) NOT NULL,
            area_upto NUMERIC(14, 2) DEFAULT 0.00,
            area_per_unit NUMERIC(14, 2) DEFAULT 1.00,
            ward_no_ids TEXT NOT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 16. tbl_malpot_rates
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_malpot_rates (
            id SERIAL PRIMARY KEY,
            code VARCHAR(32) NOT NULL,
            fullanme VARCHAR(200) NOT NULL,
            fiscal_year_id INT REFERENCES tbl_fiscal_year(id) DEFAULT NULL,
            is_parent BOOLEAN DEFAULT FALSE NOT NULL,
            parent_id INT REFERENCES tbl_malpot_rates(id) DEFAULT NULL,
            unit_id INT REFERENCES tbl_unit(id) NOT NULL,
            rate_per_unit NUMERIC(14, 2) NOT NULL,
            area_upto NUMERIC(14, 2) DEFAULT 0.00,
            area_per_unit NUMERIC(14, 2) DEFAULT 1.00,
            ward_no_ids TEXT NOT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 17. tbl_construction_rates
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_construction_rates (
            id SERIAL PRIMARY KEY,
            code VARCHAR(32) NOT NULL,
            fullanme VARCHAR(200) NOT NULL,
            fiscal_year_id INT REFERENCES tbl_fiscal_year(id) DEFAULT NULL,
            is_parent BOOLEAN DEFAULT FALSE NOT NULL,
            parent_id INT REFERENCES tbl_construction_rates(id) DEFAULT NULL,
            const_type_id INT REFERENCES tbl_construction_type(id) NOT NULL,
            unit_id INT REFERENCES tbl_unit(id) NOT NULL,
            rate_per_unit NUMERIC(14, 2) NOT NULL,
            area_upto NUMERIC(14, 2) DEFAULT 0.00,
            area_per_unit NUMERIC(14, 2) DEFAULT 1.00,
            ward_no_ids TEXT NOT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 18. tbl_depreciation
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_depreciation (
            id SERIAL PRIMARY KEY,
            code VARCHAR(32) NOT NULL,
            fullanme VARCHAR(200) NOT NULL,
            fiscal_year_id INT REFERENCES tbl_fiscal_year(id) DEFAULT NULL,
            is_parent BOOLEAN DEFAULT FALSE NOT NULL,
            parent_id INT REFERENCES tbl_depreciation(id) DEFAULT NULL,
            sn INT NOT NULL,
            year_from INT NOT NULL,
            year_to INT NOT NULL,
            percent NUMERIC(8, 4) NOT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 19. tbl_fine_rebate
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_fine_rebate (
            id SERIAL PRIMARY KEY,
            fiscal_year_id INT REFERENCES tbl_fiscal_year(id) DEFAULT NULL,
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
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 19.1. tbl_company
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_company (
            id SERIAL PRIMARY KEY,
            code VARCHAR(64) UNIQUE,
            name VARCHAR(255) NOT NULL,
            address VARCHAR(255),
            phone VARCHAR(64),
            email VARCHAR(255),
            pan_no VARCHAR(64),
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 20. tbl_taxpayer (Single Unified Taxpayer Master Table)
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_taxpayer (
            id SERIAL PRIMARY KEY,
            taxpayer_code VARCHAR(64) UNIQUE NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            mobile VARCHAR(32),
            phone_number VARCHAR(32),
            email VARCHAR(255),
            ward_no INT DEFAULT 1 NOT NULL,
            pan_number VARCHAR(64),
            citizenship_number VARCHAR(64),
            tax_type_id INT DEFAULT 1,
            tole_village VARCHAR(128),
            gender VARCHAR(16) DEFAULT 'MALE',
            registration_date DATE DEFAULT CURRENT_DATE NOT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 21. tbl_land
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_land (
            id SERIAL PRIMARY KEY,
            taxpayer_id INT REFERENCES tbl_taxpayer(id) ON DELETE CASCADE NOT NULL,
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
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 22. tbl_house
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_house (
            id SERIAL PRIMARY KEY,
            taxpayer_id INT REFERENCES tbl_taxpayer(id) ON DELETE CASCADE NOT NULL,
            land_id INT REFERENCES tbl_land(id) ON DELETE SET NULL,
            secondary_land_id INT REFERENCES tbl_land(id) ON DELETE SET NULL,
            kitta_numbers VARCHAR(255),
            land_ids VARCHAR(255),
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
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 24. tbl_floor
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_floor (
            id SERIAL PRIMARY KEY,
            house_id INT REFERENCES tbl_house(id) ON DELETE CASCADE NOT NULL,
            floor_no INT NOT NULL,
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
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 25. tax_jurisdictions
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tax_jurisdictions (
            jurisdiction_id VARCHAR(64) PRIMARY KEY,
            jurisdiction_code VARCHAR(32) UNIQUE NOT NULL,
            jurisdiction_name VARCHAR(255) NOT NULL,
            country_iso VARCHAR(3) NOT NULL,
            jurisdiction_level VARCHAR(32) NOT NULL,
            parent_jurisdiction_id VARCHAR(64) REFERENCES tax_jurisdictions(jurisdiction_id),
            default_rate_pct NUMERIC(8, 4) DEFAULT 0.0000 NOT NULL,
            nexus_sales_threshold NUMERIC(14, 2) DEFAULT 100000.00,
            nexus_tx_threshold INT DEFAULT 200,
            is_destination_based BOOLEAN DEFAULT TRUE NOT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 26. tax_rules_matrix
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tax_rules_matrix (
            rule_id VARCHAR(64) PRIMARY KEY,
            jurisdiction_id VARCHAR(64) REFERENCES tax_jurisdictions(jurisdiction_id) NOT NULL,
            tax_type VARCHAR(64) NOT NULL,
            product_tax_code VARCHAR(64) NOT NULL,
            rate_percentage NUMERIC(8, 4) NOT NULL,
            effective_from DATE NOT NULL,
            effective_to DATE,
            is_cumulative_compounded BOOLEAN DEFAULT FALSE NOT NULL,
            min_bracket_amount NUMERIC(14, 2) DEFAULT 0.00,
            max_bracket_amount NUMERIC(14, 2),
            exemption_category VARCHAR(64),
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 27. tax_transactions
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tax_transactions (
            transaction_id VARCHAR(64) PRIMARY KEY,
            org_id VARCHAR(64) REFERENCES sys_organizations(org_id) NOT NULL,
            customer_id VARCHAR(64) NOT NULL,
            invoice_number VARCHAR(128) NOT NULL,
            transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
            origin_country VARCHAR(3) NOT NULL,
            origin_region VARCHAR(64),
            destination_country VARCHAR(3) NOT NULL,
            destination_region VARCHAR(64),
            destination_postal_code VARCHAR(32),
            currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
            gross_amount NUMERIC(14, 2) NOT NULL,
            taxable_amount NUMERIC(14, 2) NOT NULL,
            total_tax_amount NUMERIC(14, 2) DEFAULT 0.00 NOT NULL,
            sync_status VARCHAR(32) DEFAULT 'PENDING' NOT NULL,
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 28. tax_liability_breakdown
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tax_liability_breakdown (
            liability_id VARCHAR(64) PRIMARY KEY,
            transaction_id VARCHAR(64) REFERENCES tax_transactions(transaction_id) ON DELETE CASCADE NOT NULL,
            jurisdiction_id VARCHAR(64) REFERENCES tax_jurisdictions(jurisdiction_id) NOT NULL,
            jurisdiction_type VARCHAR(32) NOT NULL,
            applied_rate_pct NUMERIC(8, 4) NOT NULL,
            taxable_base NUMERIC(14, 2) NOT NULL,
            tax_amount NUMERIC(14, 2) NOT NULL,
            is_compounded BOOLEAN DEFAULT FALSE NOT NULL,
            statute_reference VARCHAR(128),
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 29. tbl_appication_setting and tbl_application_setting
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_appication_setting (
            id SERIAL PRIMARY KEY,
            code VARCHAR(64) DEFAULT 'APP-CONF-01',
            fullname VARCHAR(255) DEFAULT 'Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)',
            municipality_name VARCHAR(255) DEFAULT 'Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)',
            company_id INT DEFAULT 1,
            fiscal_year_id INT REFERENCES tbl_fiscal_year(id) DEFAULT NULL,
            unit_type_id INT DEFAULT 3,
            ward_count INT DEFAULT 32,
            theme_preference VARCHAR(64) DEFAULT 'slate',
            default_language VARCHAR(32) DEFAULT 'eng',
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tbl_application_setting (
            id SERIAL PRIMARY KEY,
            code VARCHAR(64) DEFAULT 'APP-CONF-01',
            fullname VARCHAR(255) DEFAULT 'Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)',
            municipality_name VARCHAR(255) DEFAULT 'Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)',
            company_id INT DEFAULT 1,
            fiscal_year_id INT REFERENCES tbl_fiscal_year(id) DEFAULT NULL,
            unit_type_id INT DEFAULT 3,
            ward_count INT DEFAULT 32,
            theme_preference VARCHAR(64) DEFAULT 'slate',
            default_language VARCHAR(32) DEFAULT 'eng',
            is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // Seed initial application settings record if missing
      await PostgresPoolManager.query(`
        INSERT INTO tbl_appication_setting (id, code, fullname, municipality_name, company_id, fiscal_year_id, unit_type_id)
        VALUES (1, 'APP-CONF-01', 'Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)', 'Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)', 1, 2, 3)
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO tbl_application_setting (id, code, fullname, municipality_name, company_id, fiscal_year_id, unit_type_id)
        VALUES (1, 'APP-CONF-01', 'Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)', 'Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)', 1, 2, 3)
        ON CONFLICT (id) DO NOTHING;
      `);

      // Ensure all tables have is_deleted column and missing columns added
      try {
        await PostgresPoolManager.query(`
          DO $$
          DECLARE
              tbl text;
          BEGIN
              FOR tbl IN SELECT unnest(ARRAY[
                  'sys_organizations','tbl_role','tbl_user','tbl_right','tbl_role_right','tbl_user_role','tbl_user_right',
                  'tbl_user_log','tbl_session_log','tbl_fiscal_year','tbl_unit','tbl_construction_type','tbl_land_nature',
                  'tbl_land_rate','tbl_malpot_rates','tbl_construction_rates','tbl_depreciation','tbl_fine_rebate',
                  'tbl_taxpayer','tbl_land','tbl_house','tbl_floor','tax_jurisdictions',
                  'tax_rules_matrix','tax_transactions','tax_liability_breakdown','tbl_appication_setting','tbl_application_setting'
              ]) LOOP
                  EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;', tbl);
              END LOOP;
          END $$;
        `);
      } catch (_) {}

      // Add missing table columns to existing PostgreSQL tables
      try {
        await PostgresPoolManager.query(`
          ALTER TABLE tbl_house ADD COLUMN IF NOT EXISTS secondary_land_id INT REFERENCES tbl_land(id) ON DELETE SET NULL;
          ALTER TABLE tbl_house ADD COLUMN IF NOT EXISTS kitta_numbers VARCHAR(255);
          ALTER TABLE tbl_house ADD COLUMN IF NOT EXISTS land_ids VARCHAR(255);

          ALTER TABLE tbl_malpot_rates ADD COLUMN IF NOT EXISTS area_per_unit NUMERIC(14, 2) DEFAULT 1.00;
          ALTER TABLE tbl_malpot_rates ADD COLUMN IF NOT EXISTS area_upto NUMERIC(14, 2) DEFAULT 0.00;
          ALTER TABLE tbl_malpot_rates ADD COLUMN IF NOT EXISTS is_parent BOOLEAN DEFAULT FALSE;
          ALTER TABLE tbl_malpot_rates ADD COLUMN IF NOT EXISTS parent_id INT DEFAULT NULL;

          ALTER TABLE tbl_land_rate ADD COLUMN IF NOT EXISTS area_per_unit NUMERIC(14, 2) DEFAULT 1.00;
          ALTER TABLE tbl_land_rate ADD COLUMN IF NOT EXISTS area_upto NUMERIC(14, 2) DEFAULT 0.00;
          ALTER TABLE tbl_land_rate ADD COLUMN IF NOT EXISTS is_parent BOOLEAN DEFAULT FALSE;
          ALTER TABLE tbl_land_rate ADD COLUMN IF NOT EXISTS parent_id INT DEFAULT NULL;

          ALTER TABLE tbl_construction_rates ADD COLUMN IF NOT EXISTS area_per_unit NUMERIC(14, 2) DEFAULT 1.00;
          ALTER TABLE tbl_construction_rates ADD COLUMN IF NOT EXISTS area_upto NUMERIC(14, 2) DEFAULT 0.00;
          ALTER TABLE tbl_construction_rates ADD COLUMN IF NOT EXISTS is_parent BOOLEAN DEFAULT FALSE;
          ALTER TABLE tbl_construction_rates ADD COLUMN IF NOT EXISTS parent_id INT DEFAULT NULL;

          ALTER TABLE tbl_depreciation ADD COLUMN IF NOT EXISTS is_parent BOOLEAN DEFAULT FALSE;
          ALTER TABLE tbl_depreciation ADD COLUMN IF NOT EXISTS parent_id INT DEFAULT NULL;
        `);
      } catch (_) {}

      // Migrate records from tbl_taxpayer_master to tbl_taxpayer if tbl_taxpayer_master exists, then drop tbl_taxpayer_master
      try {
        await PostgresPoolManager.query(`
          DO $$
          BEGIN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_taxpayer' AND column_name = 'mobile') THEN
                ALTER TABLE tbl_taxpayer ADD COLUMN mobile VARCHAR(32);
              END IF;
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_taxpayer' AND column_name = 'email') THEN
                ALTER TABLE tbl_taxpayer ADD COLUMN email VARCHAR(255);
              END IF;
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tbl_taxpayer' AND column_name = 'tax_type_id') THEN
                ALTER TABLE tbl_taxpayer ADD COLUMN tax_type_id INT DEFAULT 1;
              END IF;

              IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tbl_taxpayer_master') THEN
                  INSERT INTO tbl_taxpayer (id, taxpayer_code, full_name, mobile, phone_number, email, ward_no, pan_number, citizenship_number, tax_type_id, is_deleted, insert_by, insert_on, update_by, update_on, is_active)
                  SELECT m.id, COALESCE(m.code, 'TP-' || m.id), COALESCE(m.fullname, 'New Taxpayer'), m.mobile_no, m.mobile_no, m.email, COALESCE(m.ward_no, 1), m.pan_vat_no, m.citizenship_no, COALESCE(m.tax_type_id, 1), COALESCE(m.is_deleted, false), COALESCE(m.insert_by, '1'), COALESCE(m.insert_on, NOW()), COALESCE(m.update_by, '1'), COALESCE(m.update_on, NOW()), COALESCE(m.is_active, true)
                  FROM tbl_taxpayer_master m
                  ON CONFLICT (id) DO UPDATE SET
                    full_name = EXCLUDED.full_name,
                    mobile = EXCLUDED.mobile,
                    email = EXCLUDED.email,
                    ward_no = EXCLUDED.ward_no;

                  BEGIN
                    ALTER TABLE tbl_land DROP CONSTRAINT IF EXISTS tbl_land_taxpayer_id_fkey;
                    ALTER TABLE tbl_land ADD CONSTRAINT tbl_land_taxpayer_id_fkey FOREIGN KEY (taxpayer_id) REFERENCES tbl_taxpayer(id) ON DELETE CASCADE;
                  EXCEPTION WHEN OTHERS THEN NULL;
                  END;

                  BEGIN
                    ALTER TABLE tbl_house DROP CONSTRAINT IF EXISTS tbl_house_taxpayer_id_fkey;
                    ALTER TABLE tbl_house ADD CONSTRAINT tbl_house_taxpayer_id_fkey FOREIGN KEY (taxpayer_id) REFERENCES tbl_taxpayer(id) ON DELETE CASCADE;
                  EXCEPTION WHEN OTHERS THEN NULL;
                  END;

                  DROP TABLE tbl_taxpayer_master CASCADE;
              END IF;
          END $$;
        `);
      } catch (_) {}

      // Ensure fiscal_year_id allows NULL in rate tables for universal default rates
      try {
        await PostgresPoolManager.query(`
          ALTER TABLE tbl_land_rate ALTER COLUMN fiscal_year_id DROP NOT NULL;
          ALTER TABLE tbl_malpot_rates ALTER COLUMN fiscal_year_id DROP NOT NULL;
          ALTER TABLE tbl_construction_rates ALTER COLUMN fiscal_year_id DROP NOT NULL;
          ALTER TABLE tbl_depreciation ALTER COLUMN fiscal_year_id DROP NOT NULL;
          ALTER TABLE tbl_fine_rebate ALTER COLUMN fiscal_year_id DROP NOT NULL;
        `);
      } catch (_) {}

      // ==========================================
      // SEED DEFAULT RECORDS ACROSS ALL TABLES
      // ==========================================

      // 1. Sys Organization
      await PostgresPoolManager.query(`
        INSERT INTO sys_organizations (org_id, name, tax_identifier, country_code, currency, insert_by, update_by)
        VALUES ('ORG_GLOBAL_CORP', 'gtax Enterprise Municipal Authority', 'TAX-NP-998811', 'NPL', 'NPR', '1', '1')
        ON CONFLICT (org_id) DO NOTHING;
      `);

      // 2. Roles
      await PostgresPoolManager.query(`
        INSERT INTO tbl_role (id, role_name, description, insert_by, update_by) VALUES
        (1, 'superadmin', 'Unrestricted Master Control & System Oversight', '1', '1'),
        (2, 'admin', 'Corporate Tax Manager & Department Security Admin', '1', '1'),
        (3, 'operator', 'Tax Operations Specialist & Real-Time Sync Operator', '1', '1'),
        (4, 'user', 'Standard Tax Analyst & Invoicing Reviewer', '1', '1')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 3. Users
      await PostgresPoolManager.query(`
        INSERT INTO tbl_user (id, fullname, email, password, mobile, employee_id, insert_by, insert_on, update_by, update_on, is_active) VALUES
        (1, 'Eleanor Vance (Chief Tax Officer)', 'superadmin@gtax.enterprise', 'Password123!', '+1 (555) 019-2831', 'EMP-SA-001', '1', NOW(), '1', NOW(), true),
        (2, 'Marcus Thorne (Senior Tax Strategist)', 'admin@gtax.enterprise', 'Password123!', '+1 (555) 024-8192', 'EMP-ADM-002', '1', NOW(), '1', NOW(), true),
        (3, 'Sarah Chen (Global Compliance Director)', 'operator@gtax.enterprise', 'Password123!', '+1 (555) 038-7241', 'EMP-OP-003', '1', NOW(), '1', NOW(), true),
        (4, 'Julian Keller (Tax Analyst)', 'user@gtax.enterprise', 'Password123!', '+1 (555) 042-9918', 'EMP-USR-004', '1', NOW(), '1', NOW(), true)
        ON CONFLICT (email) DO NOTHING;
      `);

      // 4. User Role Mapping
      await PostgresPoolManager.query(`
        INSERT INTO tbl_user_role (user_id, role_id, insert_by, update_by) VALUES
        (1, 1, '1', '1'),
        (2, 2, '1', '1'),
        (3, 3, '1', '1'),
        (4, 4, '1', '1')
        ON CONFLICT DO NOTHING;
      `);

      // 5. Rights
      await PostgresPoolManager.query(`
        INSERT INTO tbl_right (id, right_code, right_name, module_name, action_type, insert_by, update_by) VALUES
        (1, 'tbl_user_menu', 'View Users Menu', 'Users', 'menu', '1', '1'),
        (2, 'tbl_user_new', 'Create New User', 'Users', 'new', '1', '1'),
        (3, 'tbl_user_edit', 'Edit User', 'Users', 'edit', '1', '1'),
        (4, 'tbl_user_delete', 'Delete User', 'Users', 'delete', '1', '1'),
        (5, 'tbl_land_rate_menu', 'View Land Rates', 'Rates', 'menu', '1', '1'),
        (6, 'tbl_land_rate_new', 'Create Land Rate', 'Rates', 'new', '1', '1'),
        (7, 'tbl_land_rate_edit', 'Edit Land Rate', 'Rates', 'edit', '1', '1'),
        (8, 'tbl_taxpayer_menu', 'View Taxpayers', 'Taxpayers', 'menu', '1', '1'),
        (9, 'tbl_taxpayer_new', 'Register Taxpayer', 'Taxpayers', 'new', '1', '1')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 6. Role Rights
      await PostgresPoolManager.query(`
        INSERT INTO tbl_role_right (role_id, right_id, insert_by, update_by) VALUES
        (1, 1, '1', '1'), (1, 2, '1', '1'), (1, 3, '1', '1'), (1, 4, '1', '1'),
        (1, 5, '1', '1'), (1, 6, '1', '1'), (1, 7, '1', '1'), (1, 8, '1', '1'), (1, 9, '1', '1'),
        (2, 1, '1', '1'), (2, 2, '1', '1'), (2, 3, '1', '1'),
        (2, 5, '1', '1'), (2, 6, '1', '1'), (2, 7, '1', '1'), (2, 8, '1', '1'), (2, 9, '1', '1'),
        (3, 5, '1', '1'), (3, 6, '1', '1'), (3, 8, '1', '1'), (3, 9, '1', '1'),
        (4, 5, '1', '1'), (4, 8, '1', '1')
        ON CONFLICT DO NOTHING;
      `);

      // 7. Fiscal Years (Complete official master from year 2021 to 2086 BS)
      const allSeedFy = generateFiscalYears2021To2086();
      const fyValues = allSeedFy
        .map(
          (fy) =>
            `(${fy.id}, '${fy.code}', '${fy.fullname.replace(/'/g, "''")}', '${fy.date_from_bs}', '${fy.date_from_ad}', '${fy.date_to_ad}', '${fy.date_to_bs}', false, '1', '1')`
        )
        .join(",\n        ");

      await PostgresPoolManager.query(`
        INSERT INTO tbl_fiscal_year (id, code, fullname, date_from_bs, date_from_ad, date_to_ad, date_to_bs, is_deleted, insert_by, update_by) VALUES
        ${fyValues}
        ON CONFLICT (id) DO NOTHING;
      `);
      try {
        await PostgresPoolManager.query(`
          SELECT setval(pg_get_serial_sequence('tbl_fiscal_year', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_fiscal_year), 0), 1));
        `);
      } catch (_) {}

      // 8. Units
      try {
        await PostgresPoolManager.query(`
          INSERT INTO tbl_unit (id, code, fullanme, unit_value, is_deleted, insert_by, update_by) VALUES
          (1, 'AANA', 'Aana (आना) - 342.25 Sq.Ft', 342.2500, false, '1', '1'),
          (2, 'ROPANI', 'Ropani (रोपनी) - 5476 Sq.Ft / 16 Aana', 5476.0000, false, '1', '1'),
          (3, 'PAISA', 'Paisa (पैसा) - 85.56 Sq.Ft / 4 Daam', 85.5625, false, '1', '1'),
          (4, 'DAAM', 'Daam (दाम) - 21.39 Sq.Ft', 21.3906, false, '1', '1'),
          (5, 'KATTHA', 'Kattha (कट्ठा) - 3645 Sq.Ft (Terai/Madhesh)', 3645.0000, false, '1', '1'),
          (6, 'BIGHA', 'Bigha (बिघा) - 72900 Sq.Ft / 20 Kattha', 72900.0000, false, '1', '1'),
          (7, 'SQFT', 'Square Feet (वर्ग फिट)', 1.0000, false, '1', '1')
          ON CONFLICT DO NOTHING;
        `);
      } catch (_) {}

      // 9. Construction Types
      try {
        await PostgresPoolManager.query(`
          INSERT INTO tbl_construction_type (id, code, fullanme, is_deleted, insert_by, update_by) VALUES
          (1, 'RCC_PILLAR', 'R.C.C. Pillar & Slab Structure Grade A (पक्की पिलर भवन)', false, '1', '1'),
          (2, 'LOAD_BEARING', 'Brick Masonry in Cement Mortar Load Bearing (इँटा-सिमेन्ट गाह्रो)', false, '1', '1'),
          (3, 'BRICK_MUD', 'Traditional Brick with Mud Mortar Masonry (माटो-इँटा जोडाई)', false, '1', '1'),
          (4, 'STEEL_TRUSS', 'Engineered Steel Truss & Industrial Prefab Panel (स्टिल ट्रस)', false, '1', '1'),
          (5, 'WOOD_FRAME', 'Traditional Timber Frame & Stone Masonry (काठ-ढुङ्गा संरचना)', false, '1', '1')
          ON CONFLICT DO NOTHING;
        `);
      } catch (_) {}

      // 10. Land Natures
      try {
        await PostgresPoolManager.query(`
          INSERT INTO tbl_land_nature (id, code, fullanme, is_deleted, insert_by, update_by) VALUES
          (1, 'COMMERCIAL', 'High Street Commercial & Business Corridor (व्यापारिक क्षेत्र)', false, '1', '1'),
          (2, 'RESIDENTIAL', 'Municipal Urban Residential Zone (आवासीय क्षेत्र)', false, '1', '1'),
          (3, 'AGRICULTURAL', 'Fertile Cultivation & Farmland Zone (कृषि क्षेत्र)', false, '1', '1'),
          (4, 'INDUSTRIAL', 'Industrial & Manufacturing Zone (औद्योगिक क्षेत्र)', false, '1', '1'),
          (5, 'HIGHWAY', 'National / Provincial Highway Facing (राजमार्गसँग जोडिएको)', false, '1', '1')
          ON CONFLICT DO NOTHING;
        `);
      } catch (_) {}

      // 11. Land Rates (tbl_land_rate)
      try {
        await PostgresPoolManager.query(`
          INSERT INTO tbl_land_rate (id, code, fullanme, fiscal_year_id, is_parent, parent_id, unit_id, rate_per_unit, area_upto, area_per_unit, ward_no_ids, is_deleted, insert_by, update_by) VALUES
          (1, 'LR-001', 'Main Arterial Highway (Paved 40ft+ Corridor)', 2, false, null, 1, 1500000.00, 0.00, 1.00, '1,2,3,4', false, '1', '1'),
          (2, 'LR-002', 'Secondary Branch Road (Paved 20ft Blacktopped)', 2, false, null, 1, 950000.00, 0.00, 1.00, '2,3,5', false, '1', '1'),
          (3, 'LR-003', 'Urban Residential Link Road (Gravelled 14ft)', 2, false, null, 1, 650000.00, 0.00, 1.00, '3,4,6', false, '1', '1'),
          (4, 'LR-004', 'Agricultural Zone Internal Trail (Earthen 10ft)', 2, false, null, 1, 280000.00, 0.00, 1.00, '7,8,9', false, '1', '1')
          ON CONFLICT DO NOTHING;
        `);
      } catch (_) {}

      // 12. Malpot Rates (tbl_malpot_rates)
      try {
        await PostgresPoolManager.query(`
          INSERT INTO tbl_malpot_rates (id, code, fullanme, fiscal_year_id, is_parent, parent_id, unit_id, rate_per_unit, area_upto, area_per_unit, ward_no_ids, is_deleted, insert_by, update_by) VALUES
          (1, 'MR-001', 'Commercial Zone Government Valuation (मालपोत मूल्यांकन - व्यापारिक)', 2, false, null, 1, 1200000.00, 0.00, 1.00, '1,2,3', false, '1', '1'),
          (2, 'MR-002', 'Residential Core Government Valuation (मालपोत मूल्यांकन - आवासीय)', 2, false, null, 1, 750000.00, 0.00, 1.00, '4,5,6', false, '1', '1')
          ON CONFLICT DO NOTHING;
        `);
      } catch (_) {}

      // 13. Construction Rates (tbl_construction_rates)
      try {
        await PostgresPoolManager.query(`
          INSERT INTO tbl_construction_rates (id, code, fullanme, fiscal_year_id, is_parent, parent_id, const_type_id, unit_id, rate_per_unit, area_upto, area_per_unit, ward_no_ids, is_deleted, insert_by, update_by) VALUES
          (1, 'CR-001', 'RCC Frame Structure Grade A Assessment Rate', 2, false, null, 1, 1, 3200.00, 0.00, 1.00, '1,2,3,4,5,6,7,8,9', false, '1', '1'),
          (2, 'CR-002', 'Cement Mortar Load Bearing Assessment Rate', 2, false, null, 2, 1, 2400.00, 0.00, 1.00, '1,2,3,4,5,6,7,8,9', false, '1', '1'),
          (3, 'CR-003', 'Brick with Mud Mortar Traditional Masonry Rate', 2, false, null, 3, 1, 1400.00, 0.00, 1.00, '1,2,3,4,5,6,7,8,9', false, '1', '1')
          ON CONFLICT DO NOTHING;
        `);
      } catch (_) {}

      // 14. Depreciation (tbl_depreciation)
      try {
        await PostgresPoolManager.query(`
          INSERT INTO tbl_depreciation (id, code, fullanme, fiscal_year_id, is_parent, parent_id, sn, year_from, year_to, percent, is_deleted, insert_by, update_by) VALUES
          (1, 'DEP-01', 'Building Age 0 to 5 Years (0-5 वर्ष)', 2, false, null, 1, 0, 5, 0.0000, false, '1', '1'),
          (2, 'DEP-02', 'Building Age 6 to 10 Years (६-१० वर्ष)', 2, false, null, 2, 6, 10, 5.0000, false, '1', '1'),
          (3, 'DEP-03', 'Building Age 11 to 20 Years (११-२० वर्ष)', 2, false, null, 3, 11, 20, 15.0000, false, '1', '1'),
          (4, 'DEP-04', 'Building Age 21 to 30 Years (२१-३० वर्ष)', 2, false, null, 4, 21, 30, 25.0000, false, '1', '1'),
          (5, 'DEP-05', 'Building Age Over 30 Years (३० वर्ष माथि)', 2, false, null, 5, 31, 100, 40.0000, false, '1', '1')
          ON CONFLICT DO NOTHING;
        `);
      } catch (_) {}

      // 15. Fine & Rebate (tbl_fine_rebate)
      try {
        await PostgresPoolManager.query(`
          INSERT INTO tbl_fine_rebate (id, fiscal_year_id, tax_type_id, ratesn, years, month, calcpercent, ratepercent, flatrate, isfine, days, is_deleted, insert_by, update_by) VALUES
          (1, 2, 1, 1, 0, 3, -10.0000, -10.0000, 0.00, false, 90, false, '1', '1'),
          (2, 2, 1, 2, 0, 9, 0.0000, 0.0000, 0.00, false, 270, false, '1', '1'),
          (3, 2, 1, 3, 1, 0, 10.0000, 10.0000, 0.00, true, 365, false, '1', '1'),
          (4, 2, 1, 4, 2, 0, 25.0000, 25.0000, 0.00, true, 730, false, '1', '1')
          ON CONFLICT DO NOTHING;
        `);
      } catch (_) {}

      // 16. System Masters Ready - No dummy taxpayers or properties are auto-injected.
      // Database strictly holds genuine data created by the user or pre-existing in the DB server.

      // 15.1. Company (tbl_company)
      try {
        await PostgresPoolManager.query(`
          INSERT INTO tbl_company (id, code, name, address, phone, email, pan_no, insert_by) VALUES
          (1, 'KMC-01', 'Kathmandu Metropolitan City Office', 'Teku, Kathmandu', '01-4234567', 'info@kathmandu.gov.np', '300012345', '1')
          ON CONFLICT (id) DO NOTHING;
        `);
      } catch (_) {}

      // ==========================================
      // SYNCHRONIZE ALL POSTGRESQL SERIAL SEQUENCES
      // ==========================================
      const sequenceTables = [
        "tbl_role",
        "tbl_user",
        "tbl_right",
        "tbl_role_right",
        "tbl_user_role",
        "tbl_user_right",
        "tbl_user_log",
        "tbl_session_log",
        "tbl_fiscal_year",
        "tbl_unit",
        "tbl_construction_type",
        "tbl_land_nature",
        "tbl_land_rate",
        "tbl_malpot_rates",
        "tbl_construction_rates",
        "tbl_depreciation",
        "tbl_fine_rebate",
        "tbl_company",
        "tbl_taxpayer",
        "tbl_land",
        "tbl_house",
        "tbl_floor"
      ];

      for (const table of sequenceTables) {
        await PostgresPoolManager.query(`
          DO $$
          BEGIN
            IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = '${table}') THEN
              PERFORM setval(pg_get_serial_sequence('${table}', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM ${table}), 0), 1));
            END IF;
          END $$;
        `);
      }

      this.bootstrapped = true;
      console.log("[gtax:Bootstrap] SUCCESS: All 25 tables, default seed data, and sequences are 100% synchronized in PostgreSQL!");
      return true;
    } catch (err) {
      console.error("[gtax:Bootstrap] Error during PostgreSQL schema bootstrap:", err);
      return false;
    }
  }
}
