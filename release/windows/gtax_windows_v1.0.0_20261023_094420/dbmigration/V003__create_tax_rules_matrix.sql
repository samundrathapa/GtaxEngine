-- =========================================================================
-- Migration: V003__create_tax_rules_matrix.sql
-- Description: Dynamic multi-jurisdiction rules matrix, product tax codes, tiered brackets, and compounding rules
-- Mandatory Audit Columns included: insert_by, insert_on, update_by, update_on, delete_by, deleted_on, is_active
-- =========================================================================

CREATE TABLE IF NOT EXISTS tax_rules_matrix (
    rule_id VARCHAR(64) PRIMARY KEY,
    jurisdiction_id VARCHAR(64) REFERENCES tax_jurisdictions(jurisdiction_id) NOT NULL,
    tax_type VARCHAR(64) NOT NULL, -- 'sales_tax', 'vat', 'gst', 'dst', 'excise', 'withholding'
    product_tax_code VARCHAR(64) NOT NULL, -- 'DIGITAL_SAAS', 'PHYSICAL_GOODS', 'FIN_SERVICES'
    rate_percentage NUMERIC(8, 4) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_cumulative_compounded BOOLEAN DEFAULT FALSE NOT NULL,
    min_bracket_amount NUMERIC(14, 2) DEFAULT 0.00,
    max_bracket_amount NUMERIC(14, 2),
    exemption_category VARCHAR(64),
    
    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tax_rules_ptc ON tax_rules_matrix(product_tax_code);
CREATE INDEX IF NOT EXISTS idx_tax_rules_jurisdiction ON tax_rules_matrix(jurisdiction_id);
