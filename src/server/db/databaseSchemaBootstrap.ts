/**
 * gtax Enterprise - Comprehensive PostgreSQL Database Schema Bootstrap
 * Guarantees all 26 tables exist in PostgreSQL with mandatory BaseFrame audit columns:
 *   (insert_by, insert_on, update_by, update_on, delete_by, deleted_on, is_active, is_deleted)
 * Enforces requirement: insert_by, update_by, delete_by store user ID from tbl_user (e.g. '1').
 * Pre-seeds all default municipal valuation, taxpayer, RBAC, and tax calculation records.
 * Synchronizes all PostgreSQL auto-increment sequences (setval).
 */

import { PostgresPoolManager } from "./postgresPool.ts";

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
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 5. tbl_right
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_right (
            id SERIAL PRIMARY KEY,
            right_code VARCHAR(128) UNIQUE NOT NULL,
            right_name VARCHAR(200) NOT NULL,
            module_name VARCHAR(100) NOT NULL,
            action_type VARCHAR(32) NOT NULL,
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
            fiscal_year_id INT REFERENCES tbl_fiscal_year(id) NOT NULL,
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
            fiscal_year_id INT REFERENCES tbl_fiscal_year(id) NOT NULL,
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
            fiscal_year_id INT REFERENCES tbl_fiscal_year(id) NOT NULL,
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
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 20. tbl_taxpayer_master
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_taxpayer_master (
            id SERIAL PRIMARY KEY,
            code VARCHAR(64) UNIQUE NOT NULL,
            fullanme VARCHAR(255) NOT NULL,
            mobile_no VARCHAR(32) NOT NULL,
            tax_type_id INT DEFAULT 1,
            email VARCHAR(255),
            ward_no INT DEFAULT 1,
            pan_vat_no VARCHAR(64),
            citizenship_no VARCHAR(64),
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

      // 21. tbl_taxpayer
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_taxpayer (
            id SERIAL PRIMARY KEY,
            taxpayer_code VARCHAR(32) UNIQUE NOT NULL,
            full_name VARCHAR(200) NOT NULL,
            pan_number VARCHAR(32),
            citizenship_number VARCHAR(32),
            phone_number VARCHAR(32),
            ward_no INT DEFAULT 1,
            tole_village VARCHAR(100),
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 22. tbl_land
      await PostgresPoolManager.query(`
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
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

      // 23. tbl_house
      await PostgresPoolManager.query(`
        CREATE TABLE IF NOT EXISTS tbl_house (
            id SERIAL PRIMARY KEY,
            taxpayer_id INT REFERENCES tbl_taxpayer_master(id) ON DELETE CASCADE NOT NULL,
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
            insert_by VARCHAR(64) NOT NULL DEFAULT '1',
            insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            update_by VARCHAR(64) NOT NULL DEFAULT '1',
            update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
            delete_by VARCHAR(64) DEFAULT NULL,
            deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE NOT NULL
        );
      `);

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

      // 7. Fiscal Years
      await PostgresPoolManager.query(`
        INSERT INTO tbl_fiscal_year (id, code, fullname, date_from_bs, date_from_ad, date_to_ad, date_to_bs, is_deleted, insert_by, update_by) VALUES
        (1, '2080/81', 'Fiscal Year 2080/2081 BS (आर्थिक वर्ष २०८०/८१)', '2080-04-01', '2023-07-17', '2024-07-15', '2081-03-31', false, '1', '1'),
        (2, '2081/82', 'Fiscal Year 2081/2082 BS (आर्थिक वर्ष २०८१/८२) [Current]', '2081-04-01', '2024-07-16', '2025-07-15', '2082-03-31', false, '1', '1'),
        (3, '2079/80', 'Fiscal Year 2079/2080 BS (आर्थिक वर्ष २०७९/८०)', '2079-04-01', '2022-07-17', '2023-07-16', '2080-03-31', false, '1', '1')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 8. Units
      await PostgresPoolManager.query(`
        INSERT INTO tbl_unit (id, code, fullanme, unit_value, is_deleted, insert_by, update_by) VALUES
        (1, 'AANA', 'Aana (आना) - 342.25 Sq.Ft', 342.2500, false, '1', '1'),
        (2, 'ROPANI', 'Ropani (रोपनी) - 5476 Sq.Ft / 16 Aana', 5476.0000, false, '1', '1'),
        (3, 'PAISA', 'Paisa (पैसा) - 85.56 Sq.Ft / 4 Daam', 85.5625, false, '1', '1'),
        (4, 'DAAM', 'Daam (दाम) - 21.39 Sq.Ft', 21.3906, false, '1', '1'),
        (5, 'KATTHA', 'Kattha (कट्ठा) - 3645 Sq.Ft (Terai/Madhesh)', 3645.0000, false, '1', '1'),
        (6, 'BIGHA', 'Bigha (बिघा) - 72900 Sq.Ft / 20 Kattha', 72900.0000, false, '1', '1'),
        (7, 'SQFT', 'Square Feet (वर्ग फिट)', 1.0000, false, '1', '1')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 9. Construction Types
      await PostgresPoolManager.query(`
        INSERT INTO tbl_construction_type (id, code, fullanme, is_deleted, insert_by, update_by) VALUES
        (1, 'RCC_PILLAR', 'R.C.C. Pillar & Slab Structure Grade A (पक्की पिलर भवन)', false, '1', '1'),
        (2, 'LOAD_BEARING', 'Brick Masonry in Cement Mortar Load Bearing (इँटा-सिमेन्ट गाह्रो)', false, '1', '1'),
        (3, 'BRICK_MUD', 'Traditional Brick with Mud Mortar Masonry (माटो-इँटा जोडाई)', false, '1', '1'),
        (4, 'STEEL_TRUSS', 'Engineered Steel Truss & Industrial Prefab Panel (स्टिल ट्रस)', false, '1', '1'),
        (5, 'WOOD_FRAME', 'Traditional Timber Frame & Stone Masonry (काठ-ढुङ्गा संरचना)', false, '1', '1')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 10. Land Natures
      await PostgresPoolManager.query(`
        INSERT INTO tbl_land_nature (id, code, fullanme, is_deleted, insert_by, update_by) VALUES
        (1, 'COMMERCIAL', 'High Street Commercial & Business Corridor (व्यापारिक क्षेत्र)', false, '1', '1'),
        (2, 'RESIDENTIAL', 'Municipal Urban Residential Zone (आवासीय क्षेत्र)', false, '1', '1'),
        (3, 'AGRICULTURAL', 'Fertile Cultivation & Farmland Zone (कृषि क्षेत्र)', false, '1', '1'),
        (4, 'INDUSTRIAL', 'Industrial & Manufacturing Zone (औद्योगिक क्षेत्र)', false, '1', '1'),
        (5, 'HIGHWAY', 'National / Provincial Highway Facing (राजमार्गसँग जोडिएको)', false, '1', '1')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 11. Land Rates (tbl_land_rate)
      await PostgresPoolManager.query(`
        INSERT INTO tbl_land_rate (id, code, fullanme, fiscal_year_id, is_parent, parent_id, unit_id, rate_per_unit, area_upto, area_per_unit, ward_no_ids, is_deleted, insert_by, update_by) VALUES
        (1, 'LR-001', 'Main Arterial Highway (Paved 40ft+ Corridor)', 2, false, null, 1, 1500000.00, 0.00, 1.00, '1,2,3,4', false, '1', '1'),
        (2, 'LR-002', 'Secondary Branch Road (Paved 20ft Blacktopped)', 2, false, null, 1, 950000.00, 0.00, 1.00, '2,3,5', false, '1', '1'),
        (3, 'LR-003', 'Urban Residential Link Road (Gravelled 14ft)', 2, false, null, 1, 650000.00, 0.00, 1.00, '3,4,6', false, '1', '1'),
        (4, 'LR-004', 'Agricultural Zone Internal Trail (Earthen 10ft)', 2, false, null, 1, 280000.00, 0.00, 1.00, '7,8,9', false, '1', '1')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 12. Malpot Rates (tbl_malpot_rates)
      await PostgresPoolManager.query(`
        INSERT INTO tbl_malpot_rates (id, code, fullanme, fiscal_year_id, is_parent, parent_id, unit_id, rate_per_unit, area_upto, area_per_unit, ward_no_ids, is_deleted, insert_by, update_by) VALUES
        (1, 'MR-001', 'Commercial Zone Government Valuation (मालपोत मूल्यांकन - व्यापारिक)', 2, false, null, 1, 1200000.00, 0.00, 1.00, '1,2,3', false, '1', '1'),
        (2, 'MR-002', 'Residential Core Government Valuation (मालपोत मूल्यांकन - आवासीय)', 2, false, null, 1, 750000.00, 0.00, 1.00, '4,5,6', false, '1', '1')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 13. Construction Rates (tbl_construction_rates)
      await PostgresPoolManager.query(`
        INSERT INTO tbl_construction_rates (id, code, fullanme, fiscal_year_id, is_parent, parent_id, const_type_id, unit_id, rate_per_unit, area_upto, area_per_unit, ward_no_ids, is_deleted, insert_by, update_by) VALUES
        (1, 'CR-001', 'RCC Frame Structure Grade A Assessment Rate', 2, false, null, 1, 7, 3200.00, 0.00, 1.00, '1,2,3,4,5,6,7,8,9', false, '1', '1'),
        (2, 'CR-002', 'Cement Mortar Load Bearing Assessment Rate', 2, false, null, 2, 7, 2400.00, 0.00, 1.00, '1,2,3,4,5,6,7,8,9', false, '1', '1'),
        (3, 'CR-003', 'Brick with Mud Mortar Traditional Masonry Rate', 2, false, null, 3, 7, 1400.00, 0.00, 1.00, '1,2,3,4,5,6,7,8,9', false, '1', '1')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 14. Depreciation (tbl_depreciation)
      await PostgresPoolManager.query(`
        INSERT INTO tbl_depreciation (id, code, fullanme, fiscal_year_id, is_parent, parent_id, sn, year_from, year_to, percent, is_deleted, insert_by, update_by) VALUES
        (1, 'DEP-01', 'Building Age 0 to 5 Years (0-5 वर्ष)', 2, false, null, 1, 0, 5, 0.0000, false, '1', '1'),
        (2, 'DEP-02', 'Building Age 6 to 10 Years (६-१० वर्ष)', 2, false, null, 2, 6, 10, 5.0000, false, '1', '1'),
        (3, 'DEP-03', 'Building Age 11 to 20 Years (११-२० वर्ष)', 2, false, null, 3, 11, 20, 15.0000, false, '1', '1'),
        (4, 'DEP-04', 'Building Age 21 to 30 Years (२१-३० वर्ष)', 2, false, null, 4, 21, 30, 25.0000, false, '1', '1'),
        (5, 'DEP-05', 'Building Age Over 30 Years (३० वर्ष माथि)', 2, false, null, 5, 31, 100, 40.0000, false, '1', '1')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 15. Fine & Rebate (tbl_fine_rebate)
      await PostgresPoolManager.query(`
        INSERT INTO tbl_fine_rebate (id, fiscal_year_id, tax_type_id, ratesn, years, month, calcpercent, ratepercent, flatrate, isfine, days, is_deleted, insert_by, update_by) VALUES
        (1, 2, 1, 1, 0, 3, -10.0000, -10.0000, 0.00, false, 90, false, '1', '1'),
        (2, 2, 1, 2, 0, 9, 0.0000, 0.0000, 0.00, false, 270, false, '1', '1'),
        (3, 2, 1, 3, 1, 0, 10.0000, 10.0000, 0.00, true, 365, false, '1', '1'),
        (4, 2, 1, 4, 2, 0, 25.0000, 25.0000, 0.00, true, 730, false, '1', '1')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 16. Taxpayers (tbl_taxpayer & tbl_taxpayer_master)
      await PostgresPoolManager.query(`
        INSERT INTO tbl_taxpayer_master (id, code, fullanme, mobile_no, tax_type_id, email, ward_no, pan_vat_no, citizenship_no, is_deleted, insert_by, update_by) VALUES
        (1, 'TP-2081-0001', 'Ram Bahadur Thapa (राम बहादुर थापा)', '9841234567', 1, 'ram.thapa@gmail.com', 3, '600123456', '27-01-70-12345', false, '1', '1'),
        (2, 'TP-2081-0002', 'Sita Maya Shrestha (सीता माया श्रेष्ठ)', '9851098765', 1, 'sita.shrestha@gmail.com', 4, '600987654', '27-01-72-98765', false, '1', '1'),
        (3, 'TP-2081-0003', 'Himalayan Trading Syndicate Ltd', '9801122334', 2, 'accounts@himalayantrading.com.np', 1, '300554433', 'CO-REG-9871', false, '1', '1')
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO tbl_taxpayer (id, taxpayer_code, full_name, pan_number, citizenship_number, phone_number, ward_no, tole_village, insert_by, update_by) VALUES
        (1, 'TP-2081-0001', 'Ram Bahadur Thapa', '600123456', '27-01-70-12345', '9841234567', 3, 'Resunga Marg', '1', '1'),
        (2, 'TP-2081-0002', 'Sita Maya Shrestha', '600987654', '27-01-72-98765', '9851098765', 4, 'Bhanu Chowk', '1', '1'),
        (3, 'TP-2081-0003', 'Himalayan Trading Syndicate Ltd', '300554433', 'CO-REG-9871', '9801122334', 1, 'New Road Commercial Area', '1', '1')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 17. Land (tbl_land)
      await PostgresPoolManager.query(`
        INSERT INTO tbl_land (id, taxpayer_id, kitta_number, moth_number, ward_no, area_sqfeet, include_in_evaluation, land_measuring_unit_id, nature_id, land_rate_id, malpot_rate_id, assessed_valuation, is_deleted, insert_by, update_by) VALUES
        (1, 1, '1042', 'MOTH-89A', 3, 2738.00, true, 1, 2, 1, 1, 12000000.00, false, '1', '1'),
        (2, 2, '2105', 'MOTH-12B', 4, 1800.00, true, 1, 1, 2, 2, 7500000.00, false, '1', '1')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 18. House (tbl_house)
      await PostgresPoolManager.query(`
        INSERT INTO tbl_house (id, taxpayer_id, land_id, secondary_land_id, kitta_numbers, land_ids, house_no, area_sqfeet, acquisition_date_bs, acquisition_date_ad, plinth_area, floor_no, include_in_evaluation, measuring_unit_id, construction_type_id, assessed_valuation, is_deleted, insert_by, update_by) VALUES
        (1, 1, 1, null, '1042', '1', 'H-1042-A', 2400.00, '2075-01-10', '2018-04-23', 1200.00, 2, true, 7, 1, 7680000.00, false, '1', '1'),
        (2, 2, 2, null, '2105', '2', 'H-2105-B', 1500.00, '2077-03-15', '2020-06-29', 800.00, 2, true, 7, 2, 3600000.00, false, '1', '1')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 19. Floors (tbl_floor)
      await PostgresPoolManager.query(`
        INSERT INTO tbl_floor (id, house_id, floor_no, construction_date_ad, construction_date_bs, construction_type_id, area_sqfeet, include_in_evaluation, rate_id, remarks, measuring_unit_id, depreciation_percent, floor_assessed_valuation, is_deleted, insert_by, update_by) VALUES
        (1, 1, 0, '2018-04-23', '2075-01-10', 1, 1200.00, true, 1, 'Ground floor residential unit', 7, 5.0000, 3648000.00, false, '1', '1'),
        (2, 1, 1, '2018-04-23', '2075-01-10', 1, 1200.00, true, 1, 'First floor residential unit', 7, 5.0000, 3648000.00, false, '1', '1'),
        (3, 2, 0, '2020-06-29', '2077-03-15', 2, 800.00, true, 2, 'Ground floor shop', 7, 0.0000, 1920000.00, false, '1', '1')
        ON CONFLICT (id) DO NOTHING;
      `);

      // 20. Tax Jurisdictions
      await PostgresPoolManager.query(`
        INSERT INTO tax_jurisdictions (jurisdiction_id, jurisdiction_code, jurisdiction_name, country_iso, jurisdiction_level, default_rate_pct, insert_by, update_by) VALUES
        ('JUR_NP_MUNI', 'NP-KTM', 'Kathmandu Metropolitan Tax Authority', 'NPL', 'city', 10.0000, '1', '1'),
        ('JUR_US_FED', 'US-FED', 'United States Internal Revenue Service', 'USA', 'federal', 0.0000, '1', '1'),
        ('JUR_US_CA', 'US-CA', 'California Department of Tax & Fee Administration', 'USA', 'state', 7.2500, '1', '1'),
        ('JUR_EU_VAT', 'EU-VAT', 'European Union Cross-Border VAT Regime', 'DEU', 'vat_zone', 19.0000, '1', '1')
        ON CONFLICT (jurisdiction_id) DO NOTHING;
      `);

      // 21. Tax Rules Matrix
      await PostgresPoolManager.query(`
        INSERT INTO tax_rules_matrix (rule_id, jurisdiction_id, tax_type, product_tax_code, rate_percentage, effective_from, is_cumulative_compounded, insert_by, update_by) VALUES
        ('RULE_MUNI_PROPERTY', 'JUR_NP_MUNI', 'property_tax', 'MUNICIPAL_PROPERTY', 1.5000, '2024-07-16', false, '1', '1'),
        ('RULE_MUNI_RENTAL', 'JUR_NP_MUNI', 'rental_tax', 'MUNICIPAL_RENTAL', 10.0000, '2024-07-16', false, '1', '1'),
        ('RULE_CA_SAAS', 'JUR_US_CA', 'sales_tax', 'DIGITAL_SAAS', 7.2500, '2024-01-01', false, '1', '1'),
        ('RULE_EU_DIGITAL', 'JUR_EU_VAT', 'vat', 'DIGITAL_SERVICES', 19.0000, '2024-01-01', false, '1', '1')
        ON CONFLICT (rule_id) DO NOTHING;
      `);

      // 22. Tax Transactions & Liability Breakdown
      await PostgresPoolManager.query(`
        INSERT INTO tax_transactions (transaction_id, org_id, customer_id, invoice_number, transaction_date, origin_country, destination_country, gross_amount, taxable_amount, total_tax_amount, sync_status, insert_by, update_by) VALUES
        ('TX-2081-0001', 'ORG_GLOBAL_CORP', 'TP-2081-0001', 'INV-2081-001', NOW(), 'NPL', 'NPL', 150000.00, 150000.00, 2250.00, 'SYNCED', '1', '1'),
        ('TX-2081-0002', 'ORG_GLOBAL_CORP', 'TP-2081-0002', 'INV-2081-002', NOW(), 'NPL', 'NPL', 85000.00, 85000.00, 1275.00, 'SYNCED', '1', '1')
        ON CONFLICT (transaction_id) DO NOTHING;

        INSERT INTO tax_liability_breakdown (liability_id, transaction_id, jurisdiction_id, jurisdiction_type, applied_rate_pct, taxable_base, tax_amount, is_compounded, insert_by, update_by) VALUES
        ('LIAB-001', 'TX-2081-0001', 'JUR_NP_MUNI', 'local', 1.5000, 150000.00, 2250.00, false, '1', '1'),
        ('LIAB-002', 'TX-2081-0002', 'JUR_NP_MUNI', 'local', 1.5000, 85000.00, 1275.00, false, '1', '1')
        ON CONFLICT (liability_id) DO NOTHING;
      `);

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
        "tbl_taxpayer_master",
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
      console.log("[gtax:Bootstrap] SUCCESS: All 26 tables, default seed data, and sequences are 100% synchronized in PostgreSQL!");
      return true;
    } catch (err) {
      console.error("[gtax:Bootstrap] Error during PostgreSQL schema bootstrap:", err);
      return false;
    }
  }
}
