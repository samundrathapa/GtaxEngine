-- V009: Alter tbl_malpot_rates to add is_parent boolean and parent_id columns
-- Supports parent-child hierarchical malpot rates across municipal wards

ALTER TABLE IF EXISTS tbl_malpot_rates ADD COLUMN IF NOT EXISTS is_parent BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE IF EXISTS tbl_malpot_rates ADD COLUMN IF NOT EXISTS parent_id INT REFERENCES tbl_malpot_rates(id) DEFAULT NULL;
