-- =========================================================================
-- Migration: V006__create_auth_and_session_tables.sql
-- Description: Core User Authentication, RBAC Role-Right Hierarchy, User Logs, and Session Logs
-- Mandatory BaseFrame Audit Columns included on every table:
-- insert_by, insert_on, update_by, update_on, delete_by, deleted_on, is_active
-- =========================================================================

-- 1. tbl_user
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
    
    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 2. tbl_role (master role as superadmin, admin, operator, user)
CREATE TABLE IF NOT EXISTS tbl_role (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(64) UNIQUE NOT NULL,
    description VARCHAR(255),
    
    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 3. tbl_right (data as tablename_menu, tablename_new, tablename_edit, tablename_delete, tablename_print)
CREATE TABLE IF NOT EXISTS tbl_right (
    id SERIAL PRIMARY KEY,
    right_code VARCHAR(128) UNIQUE NOT NULL,
    right_name VARCHAR(200) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(32) NOT NULL, -- 'menu', 'new', 'edit', 'delete', 'print'
    
    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 4. tbl_role_right
CREATE TABLE IF NOT EXISTS tbl_role_right (
    id SERIAL PRIMARY KEY,
    role_id INT REFERENCES tbl_role(id) ON DELETE CASCADE NOT NULL,
    right_id INT REFERENCES tbl_right(id) ON DELETE CASCADE NOT NULL,
    
    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE(role_id, right_id)
);

-- 5. tbl_user_role (assigned to user)
CREATE TABLE IF NOT EXISTS tbl_user_role (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES tbl_user(id) ON DELETE CASCADE NOT NULL,
    role_id INT REFERENCES tbl_role(id) ON DELETE CASCADE NOT NULL,
    
    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE(user_id, role_id)
);

-- 6. tbl_user_right (assigned to user directly)
CREATE TABLE IF NOT EXISTS tbl_user_right (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES tbl_user(id) ON DELETE CASCADE NOT NULL,
    right_id INT REFERENCES tbl_right(id) ON DELETE CASCADE NOT NULL,
    is_granted BOOLEAN DEFAULT TRUE NOT NULL,
    
    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    UNIQUE(user_id, right_id)
);

-- 7. tbl_user_log
CREATE TABLE IF NOT EXISTS tbl_user_log (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES tbl_user(id) ON DELETE SET NULL,
    username_attempt VARCHAR(200) NOT NULL,
    action_name VARCHAR(100) NOT NULL, -- 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_RESET', etc.
    ip_address VARCHAR(64) DEFAULT '127.0.0.1',
    user_agent VARCHAR(500) DEFAULT NULL,
    details TEXT DEFAULT NULL,
    
    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

-- 8. tbl_session_log
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
    
    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tbl_user_email ON tbl_user(email);
CREATE INDEX IF NOT EXISTS idx_tbl_user_mobile ON tbl_user(mobile);
CREATE INDEX IF NOT EXISTS idx_tbl_session_token ON tbl_session_log(token_hash);
CREATE INDEX IF NOT EXISTS idx_tbl_session_user ON tbl_session_log(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tbl_user_log_user ON tbl_user_log(user_id, insert_on);
