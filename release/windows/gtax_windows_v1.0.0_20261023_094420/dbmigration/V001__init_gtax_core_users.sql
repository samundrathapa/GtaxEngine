-- =========================================================================
-- Migration: V001__init_gtax_core_users.sql
-- Description: Core user identity, role-based access control, and organization tenancy.
-- Mandatory Audit Columns included: insert_by, insert_on, update_by, update_on, delete_by, deleted_on, is_active
-- =========================================================================

CREATE TABLE IF NOT EXISTS sys_organizations (
    org_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tax_identifier VARCHAR(64) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE IF NOT EXISTS sys_users (
    user_id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) REFERENCES sys_organizations(org_id),
    username VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(64) DEFAULT 'tax_analyst' NOT NULL,
    
    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE IF NOT EXISTS sys_roles_permissions (
    id VARCHAR(64) PRIMARY KEY,
    role_name VARCHAR(64) NOT NULL,
    permission_key VARCHAR(128) NOT NULL,
    description TEXT,
    
    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sys_users_email ON sys_users(email);
CREATE INDEX IF NOT EXISTS idx_sys_users_active ON sys_users(is_active);
