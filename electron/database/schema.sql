-- TSSR Monitor - SQLite Schema (Matches Supabase & Excel exactly)
-- 68 columns from Excel + id + created_at + updated_at = 71 columns

CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id TEXT NOT NULL,
    final_site_name TEXT,
    site_owner TEXT,
    site_code TEXT,
    site_type TEXT,
    key_number TEXT,
    longitude REAL,
    latitude REAL,
    governorate TEXT,
    structure TEXT,
    owner_name TEXT,
    owner_contact_number TEXT,
    structure_type TEXT,
    height_m REAL,
    part_of TEXT,
    phase_name TEXT,
    priority INTEGER,
    cluster TEXT,
    area TEXT,
    weekly_plan TEXT,
    tss_smp TEXT,
    tssr_subcon TEXT,
    new_allocation TEXT,
    tssr_po TEXT,
    ts_survey_ac TEXT,
    abcd TEXT,
    ab TEXT,
    five_g_sectors_names TEXT,
    five_g_solution TEXT,
    site_sectors TEXT,
    ibs_sector TEXT,
    tdd_site TEXT,
    nokia_npo_status TEXT,
    nokia_npo_comment TEXT,
    ti_status TEXT,
    ti_comment TEXT,
    cluster_owner_ti TEXT,
    rf_plan_status TEXT,
    rf_plan_comment TEXT,
    cluster_owner_planning TEXT,
    rf_opt_status TEXT,
    rf_opt_comment TEXT,
    cluster_owner_optimization TEXT,
    civil_status TEXT,
    civil_comment TEXT,
    cluster_owner_civil TEXT,
    mw_status TEXT,
    cluster_owner_mw TEXT,
    rec_cab_swap TEXT,
    spoc_readiness TEXT,
    version TEXT,
    spoc_status TEXT,
    tssr_overall_status TEXT,
    tssr_status_date TEXT,
    spoc_reviewed TEXT,
    week_number INTEGER,
    tssr_remark TEXT,
    action_age INTEGER,
    rfi_status TEXT,
    gap_analysis TEXT,
    approved TEXT,
    nokia_site_owner TEXT,
    tssr_ready TEXT,
    dismantle_status TEXT,
    dismantle_date TEXT,
    validate TEXT,
    red_zone_sites TEXT,
    sequence INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(site_id, phase_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sites_site_id ON sites(site_id);
CREATE INDEX IF NOT EXISTS idx_sites_phase_name ON sites(phase_name);
CREATE INDEX IF NOT EXISTS idx_sites_governorate ON sites(governorate);
CREATE INDEX IF NOT EXISTS idx_sites_tssr_subcon ON sites(tssr_subcon);
CREATE INDEX IF NOT EXISTS idx_sites_tssr_overall_status ON sites(tssr_overall_status);
CREATE INDEX IF NOT EXISTS idx_sites_ti_status ON sites(ti_status);
CREATE INDEX IF NOT EXISTS idx_sites_rf_plan_status ON sites(rf_plan_status);
CREATE INDEX IF NOT EXISTS idx_sites_civil_status ON sites(civil_status);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    contractor_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id TEXT NOT NULL,
    user_id INTEGER,
    username TEXT,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(site_id)
);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT,
    site_id TEXT,
    user_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sync log table for tracking synchronization
CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT,
    records_synced INTEGER DEFAULT 0,
    source TEXT,
    error_message TEXT,
    duration_ms INTEGER
);

-- Sites cache table for temporary storage
CREATE TABLE IF NOT EXISTS sites_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id TEXT NOT NULL,
    phase_name TEXT,
    data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(site_id, phase_name)
);
