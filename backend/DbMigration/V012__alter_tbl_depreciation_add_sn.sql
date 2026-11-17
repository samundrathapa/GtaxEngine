-- V012: Alter tbl_depreciation add column sn

ALTER TABLE IF EXISTS tbl_depreciation ADD COLUMN IF NOT EXISTS sn numeric  NULL;
