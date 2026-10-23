-- =========================================================================
-- Migration: V002__create_tax_jurisdictions.sql
-- Description: Multi-jurisdictional geographic levels (Federal, State, Municipal, Cross-Border VAT/GST)
-- Mandatory Audit Columns included: insert_by, insert_on, update_by, update_on, delete_by, deleted_on, is_active
-- =========================================================================

CREATE TABLE IF NOT EXISTS tax_jurisdictions (
    jurisdiction_id VARCHAR(64) PRIMARY KEY,
    jurisdiction_code VARCHAR(32) UNIQUE NOT NULL,
    jurisdiction_name VARCHAR(255) NOT NULL,
    country_iso VARCHAR(3) NOT NULL,
    jurisdiction_level VARCHAR(32) NOT NULL, -- 'federal', 'state', 'county', 'city', 'vat_zone'
    parent_jurisdiction_id VARCHAR(64) REFERENCES tax_jurisdictions(jurisdiction_id),
    default_rate_pct NUMERIC(8, 4) DEFAULT 0.0000 NOT NULL,
    nexus_sales_threshold NUMERIC(14, 2) DEFAULT 100000.00,
    nexus_tx_threshold INT DEFAULT 200,
    is_destination_based BOOLEAN DEFAULT TRUE NOT NULL,

    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_jurisdiction_country ON tax_jurisdictions(country_iso);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_level ON tax_jurisdictions(jurisdiction_level);
