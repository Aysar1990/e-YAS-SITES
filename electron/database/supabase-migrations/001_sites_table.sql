-- ============================================
-- TSSR Monitor - Supabase Migration 001
-- Sites Table (Main table - 68 columns from Excel)
-- Version: 2.0
-- Date: 2026-01-01
-- ============================================

-- ============================================
-- SITES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sites (
  id BIGSERIAL PRIMARY KEY,

  -- Site Identification (1-6)
  site_id TEXT NOT NULL,
  final_site_name TEXT,
  site_owner TEXT,
  site_code TEXT,
  site_type TEXT,
  key_number TEXT,

  -- Location (7-9)
  longitude NUMERIC,
  latitude NUMERIC,
  governorate TEXT,

  -- Structure & Owner Info (10-15)
  structure TEXT,
  owner_name TEXT,
  owner_contact_number TEXT,
  structure_type TEXT,
  height_m NUMERIC,
  part_of TEXT,

  -- Project Info (16-20)
  phase_name TEXT NOT NULL,
  priority NUMERIC,
  cluster TEXT,
  area TEXT,
  weekly_plan TEXT,

  -- TSSR Info (21-25)
  tss_smp TEXT,
  tssr_subcon TEXT,
  new_allocation TEXT,
  tssr_po TEXT,
  ts_survey_ac TEXT,

  -- Custom/Unknown Fields (26-27)
  abcd TEXT,
  ab TEXT,

  -- 5G Info (28-32)
  five_g_sectors_names TEXT,
  five_g_solution TEXT,
  site_sectors TEXT,
  ibs_sector TEXT,
  tdd_site TEXT,

  -- Nokia Status (33-34)
  nokia_npo_status TEXT,
  nokia_npo_comment TEXT,

  -- TI Department (35-37)
  ti_status TEXT,
  ti_comment TEXT,
  cluster_owner_ti TEXT,

  -- RF Planning Department (38-40)
  rf_plan_status TEXT,
  rf_plan_comment TEXT,
  cluster_owner_planning TEXT,

  -- RF Optimization Department (41-43)
  rf_opt_status TEXT,
  rf_opt_comment TEXT,
  cluster_owner_optimization TEXT,

  -- Civil Department (44-46)
  civil_status TEXT,
  civil_comment TEXT,
  cluster_owner_civil TEXT,

  -- MW Department (47-48)
  mw_status TEXT,
  cluster_owner_mw TEXT,

  -- Additional Info (49-52)
  rec_cab_swap TEXT,
  spoc_readiness TEXT,
  version TEXT,
  spoc_status TEXT,

  -- TSSR Status (53-58)
  tssr_overall_status TEXT,
  tssr_status_date TEXT,
  spoc_reviewed TEXT,
  week_number TEXT,
  tssr_remark TEXT,
  action_age NUMERIC,

  -- RFI & Approval (59-63)
  rfi_status TEXT,
  gap_analysis TEXT,
  approved TEXT,
  nokia_site_owner TEXT,
  tssr_ready TEXT,

  -- Dismantle Info (64-65)
  dismantle_status TEXT,
  dismantle_date TEXT,

  -- Validation & Zone (66-68)
  validate TEXT,
  red_zone_sites TEXT,
  sequence NUMERIC,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint on site_id + phase_name
  UNIQUE(site_id, phase_name)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sites_site_id ON sites(site_id);
CREATE INDEX IF NOT EXISTS idx_sites_phase_name ON sites(phase_name);
CREATE INDEX IF NOT EXISTS idx_sites_tssr_subcon ON sites(tssr_subcon);
CREATE INDEX IF NOT EXISTS idx_sites_governorate ON sites(governorate);
CREATE INDEX IF NOT EXISTS idx_sites_cluster ON sites(cluster);
CREATE INDEX IF NOT EXISTS idx_sites_tssr_overall_status ON sites(tssr_overall_status);
CREATE INDEX IF NOT EXISTS idx_sites_site_owner ON sites(site_owner);
CREATE INDEX IF NOT EXISTS idx_sites_area ON sites(area);
CREATE INDEX IF NOT EXISTS idx_sites_weekly_plan ON sites(weekly_plan);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users
CREATE POLICY "sites_authenticated_all" ON sites
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Allow read access for anonymous users
CREATE POLICY "sites_anon_read" ON sites
    FOR SELECT
    TO anon
    USING (true);
