-- =========================================================================
-- Migration: V005__create_realtime_sync_events.sql
-- Description: Microservices real-time data synchronization events, change data capture log, and replication state
-- Mandatory Audit Columns included: insert_by, insert_on, update_by, update_on, delete_by, deleted_on, is_active
-- =========================================================================

CREATE TABLE IF NOT EXISTS realtime_sync_events (
    event_id VARCHAR(64) PRIMARY KEY,
    aggregate_type VARCHAR(64) NOT NULL, -- 'transaction', 'rule_update', 'nexus_threshold', 'rate_change'
    aggregate_id VARCHAR(64) NOT NULL,
    event_version INT NOT NULL,
    event_type VARCHAR(64) NOT NULL, -- 'CALCULATED', 'SYNC_REQUESTED', 'ACKNOWLEDGED', 'CONFLICT_DETECTED'
    source_service VARCHAR(64) NOT NULL, -- 'gtax-calc-engine', 'gtax-erp-connector', 'gtax-rules-service'
    target_jurisdictions JSONB NOT NULL,
    payload JSONB NOT NULL,
    checksum_hash VARCHAR(128) NOT NULL,
    status VARCHAR(32) DEFAULT 'QUEUED' NOT NULL, -- 'QUEUED', 'BROADCAST', 'DELIVERED', 'RESOLVED'
    
    -- Mandatory BaseFrame Audit Columns
    insert_by VARCHAR(64) NOT NULL,
    insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    update_by VARCHAR(64) NOT NULL,
    update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delete_by VARCHAR(64) DEFAULT NULL,
    deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);

CREATE TABLE IF NOT EXISTS schema_version_tracker (
    installed_rank INT PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL,
    script VARCHAR(1000) NOT NULL,
    checksum INT,
    installed_by VARCHAR(100) NOT NULL,
    installed_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    execution_time INT NOT NULL,
    success BOOLEAN NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_events_status ON realtime_sync_events(status);
CREATE INDEX IF NOT EXISTS idx_sync_events_aggregate ON realtime_sync_events(aggregate_type, aggregate_id);
