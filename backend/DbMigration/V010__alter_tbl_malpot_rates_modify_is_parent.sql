-- V010: Alter tbl_malpot_rates modify column is_parent
ALTER TABLE IF EXISTS tbl_depreciation ADD COLUMN IF NOT EXISTS is_parent BOOLEAN DEFAULT FALSE  NULL;
ALTER TABLE IF EXISTS tbl_depreciation ADD sn IF NOT EXISTS sn int   NULL;
