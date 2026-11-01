-- V008: Allow NULL fiscal_year_id in rate tables to support default / universal rates
-- When fiscal_year_id IS NULL, the rate serves as the base/universal default template.
-- Administrators can copy default (null) rates into any selected fiscal year via the Copy Rate feature.

ALTER TABLE IF EXISTS tbl_land_rate ALTER COLUMN fiscal_year_id DROP NOT NULL;
ALTER TABLE IF EXISTS tbl_malpot_rates ALTER COLUMN fiscal_year_id DROP NOT NULL;
ALTER TABLE IF EXISTS tbl_construction_rates ALTER COLUMN fiscal_year_id DROP NOT NULL;
ALTER TABLE IF EXISTS tbl_construction_rate ALTER COLUMN fiscal_year_id DROP NOT NULL;
ALTER TABLE IF EXISTS tbl_depreciation ALTER COLUMN fiscal_year_id DROP NOT NULL;
ALTER TABLE IF EXISTS tbl_fine_rebate ALTER COLUMN fiscal_year_id DROP NOT NULL;
ALTER TABLE IF EXISTS tbl_property_range ALTER COLUMN fiscal_year_id DROP NOT NULL;
