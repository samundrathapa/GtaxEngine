-- V011: Alter tbl_land add column unit_id

ALTER TABLE IF EXISTS tbl_land ADD COLUMN IF NOT EXISTS unit_id int DEFAULT null null;
