-- ============================================
-- TSSR Monitor - SQLite Database Schema
-- Version: 2.0
-- Date: 2026-01-01
--
-- This schema is designed for local SQLite database
-- in Electron desktop application.
-- ============================================

-- ============================================
-- SITES TABLE (Main table - 68 columns from Excel)
-- ============================================
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Site Identification (1-6)
  site_id TEXT NOT NULL,
  final_site_name TEXT,
  site_owner TEXT,
  site_code TEXT,
  site_type TEXT,
  key_number TEXT,

  -- Location (7-9)
  longitude REAL,
  latitude REAL,
  governorate TEXT,

  -- Structure & Owner Info (10-15)
  structure TEXT,
  owner_name TEXT,
  owner_contact_number TEXT,
  structure_type TEXT,
  height_m REAL,
  part_of TEXT,

  -- Project Info (16-20)
  phase_name TEXT NOT NULL,
  priority REAL,
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
  action_age REAL,

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
  sequence REAL,

  -- Timestamps
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

  -- Unique constraint on site_id + phase_name
  UNIQUE(site_id, phase_name)
);

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user', 'contractor', 'viewer')),
  contractor_name TEXT,
  email TEXT,
  full_name TEXT,
  is_active INTEGER DEFAULT 1,
  last_login TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- REJECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rejections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  phase_name TEXT,
  rejection_reason TEXT,
  department TEXT,
  rejected_by TEXT,
  rejection_date TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'resolved', 'escalated')),
  resolution_notes TEXT,
  resolved_by TEXT,
  resolved_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CHANGE REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS change_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  request_type TEXT,
  old_value TEXT,
  new_value TEXT,
  field_name TEXT,
  requested_by TEXT,
  approved_by TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  approval_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  category TEXT DEFAULT 'general',
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PHASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused')),
  priority INTEGER DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- IMPORT HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS import_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT,
  file_size INTEGER,
  records_imported INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  imported_by TEXT,
  import_date TEXT DEFAULT CURRENT_TIMESTAMP,
  duration_ms INTEGER,
  notes TEXT,
  error_log TEXT
);

-- ============================================
-- CONTRACTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contractors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  record_id INTEGER,
  action TEXT CHECK(action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values TEXT,
  new_values TEXT,
  user_id INTEGER,
  username TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Sites indexes
CREATE INDEX IF NOT EXISTS idx_sites_site_id ON sites(site_id);
CREATE INDEX IF NOT EXISTS idx_sites_phase_name ON sites(phase_name);
CREATE INDEX IF NOT EXISTS idx_sites_tssr_subcon ON sites(tssr_subcon);
CREATE INDEX IF NOT EXISTS idx_sites_governorate ON sites(governorate);
CREATE INDEX IF NOT EXISTS idx_sites_cluster ON sites(cluster);
CREATE INDEX IF NOT EXISTS idx_sites_tssr_overall_status ON sites(tssr_overall_status);
CREATE INDEX IF NOT EXISTS idx_sites_site_owner ON sites(site_owner);
CREATE INDEX IF NOT EXISTS idx_sites_area ON sites(area);
CREATE INDEX IF NOT EXISTS idx_sites_weekly_plan ON sites(weekly_plan);

-- Rejections indexes
CREATE INDEX IF NOT EXISTS idx_rejections_site_id ON rejections(site_id);
CREATE INDEX IF NOT EXISTS idx_rejections_status ON rejections(status);
CREATE INDEX IF NOT EXISTS idx_rejections_department ON rejections(department);
CREATE INDEX IF NOT EXISTS idx_rejections_date ON rejections(rejection_date);

-- Change requests indexes
CREATE INDEX IF NOT EXISTS idx_change_requests_site_id ON change_requests(site_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_contractor_name ON users(contractor_name);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default admin user (password: admin123)
INSERT OR IGNORE INTO users (username, password_hash, role, full_name)
VALUES ('admin', '$2b$10$rM7Y5P0j9k9LQ8k9k9k9kOeF8F8F8F8F8F8F8F8F8F8F8F8F8F8F8', 'admin', 'System Administrator');

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value, category, description) VALUES
  ('app_name', 'TSSR Monitor', 'general', 'Application name'),
  ('version', '2.0.0', 'general', 'Application version'),
  ('theme', 'dark', 'appearance', 'Default theme'),
  ('language', 'en', 'appearance', 'Default language'),
  ('auto_backup', 'true', 'backup', 'Enable automatic backups'),
  ('backup_interval', '24', 'backup', 'Backup interval in hours'),
  ('data_retention_days', '365', 'data', 'Data retention period in days');

-- Insert common phases
INSERT OR IGNORE INTO phases (name, description, priority) VALUES
  ('Full Swap', 'Full equipment swap phase', 1),
  ('RO4', 'Rollout Phase 4', 2),
  ('RO5', 'Rollout Phase 5', 3),
  ('RO6', 'Rollout Phase 6', 4),
  ('Modernization', 'Network modernization', 5);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp on sites update
CREATE TRIGGER IF NOT EXISTS update_sites_timestamp
  AFTER UPDATE ON sites
  FOR EACH ROW
BEGIN
  UPDATE sites SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update updated_at timestamp on users update
CREATE TRIGGER IF NOT EXISTS update_users_timestamp
  AFTER UPDATE ON users
  FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update updated_at timestamp on rejections update
CREATE TRIGGER IF NOT EXISTS update_rejections_timestamp
  AFTER UPDATE ON rejections
  FOR EACH ROW
BEGIN
  UPDATE rejections SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update updated_at timestamp on change_requests update
CREATE TRIGGER IF NOT EXISTS update_change_requests_timestamp
  AFTER UPDATE ON change_requests
  FOR EACH ROW
BEGIN
  UPDATE change_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Update updated_at timestamp on settings update
CREATE TRIGGER IF NOT EXISTS update_settings_timestamp
  AFTER UPDATE ON settings
  FOR EACH ROW
BEGIN
  UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
