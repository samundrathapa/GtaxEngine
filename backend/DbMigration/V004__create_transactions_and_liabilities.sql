-- =========================================================================
-- Migration: V004__create_transactions_and_liabilities.sql
-- Description: Financial transactions, assessed complex multi-jurisdictional liabilities, and line item breakdowns
-- Mandatory Audit Columns included: insert_by, insert_on, update_by, update_on, delete_by, deleted_on, is_active
-- =========================================================================

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
    sync_status VARCHAR(32) DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'SYNCED', 'CONFLICT', 'RECONCILED'
    
    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE IF NOT EXISTS tax_liability_breakdown (
    liability_id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) REFERENCES tax_transactions(transaction_id) ON DELETE CASCADE NOT NULL,
    jurisdiction_id VARCHAR(64) REFERENCES tax_jurisdictions(jurisdiction_id) NOT NULL,
    jurisdiction_type VARCHAR(32) NOT NULL, -- 'federal', 'state', 'local', 'vat'
    applied_rate_pct NUMERIC(8, 4) NOT NULL,
    taxable_base NUMERIC(14, 2) NOT NULL,
    tax_amount NUMERIC(14, 2) NOT NULL,
    is_compounded BOOLEAN DEFAULT FALSE NOT NULL,
    statute_reference VARCHAR(128),
    
    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tx_org_date ON tax_transactions(org_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_tx_sync_status ON tax_transactions(sync_status);
CREATE INDEX IF NOT EXISTS idx_liability_tx ON tax_liability_breakdown(transaction_id);
