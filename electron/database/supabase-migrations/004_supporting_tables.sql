-- ============================================
-- TSSR Monitor - Supabase Migration 004
-- Supporting Tables (Settings, Phases, Contractors, etc.)
-- Version: 2.0
-- Date: 2026-01-01
-- ============================================

-- ============================================
-- SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  category TEXT DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_authenticated_read" ON settings
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "settings_admin_write" ON settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()::bigint AND u.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()::bigint AND u.role = 'admin'
        )
    );

-- ============================================
-- PHASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS phases (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused')),
  priority INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phases_name ON phases(name);
CREATE INDEX IF NOT EXISTS idx_phases_status ON phases(status);

CREATE TRIGGER update_phases_updated_at
    BEFORE UPDATE ON phases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phases_authenticated_all" ON phases
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "phases_anon_read" ON phases
    FOR SELECT
    TO anon
    USING (true);

-- ============================================
-- CONTRACTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contractors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contractors_name ON contractors(name);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON contractors(status);

CREATE TRIGGER update_contractors_updated_at
    BEFORE UPDATE ON contractors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contractors_authenticated_all" ON contractors
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- IMPORT HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS import_history (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT,
  file_size BIGINT,
  records_imported INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  imported_by TEXT,
  import_date TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER,
  notes TEXT,
  error_log TEXT
);

CREATE INDEX IF NOT EXISTS idx_import_history_date ON import_history(import_date);
CREATE INDEX IF NOT EXISTS idx_import_history_imported_by ON import_history(imported_by);

ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_history_authenticated_all" ON import_history
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id BIGINT,
  action TEXT CHECK(action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  user_id BIGINT,
  username TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_admin_read" ON audit_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()::bigint AND u.role = 'admin'
        )
    );

CREATE POLICY "audit_log_authenticated_insert" ON audit_log
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default settings
INSERT INTO settings (key, value, category, description) VALUES
  ('app_name', 'TSSR Monitor', 'general', 'Application name'),
  ('version', '2.0.0', 'general', 'Application version'),
  ('theme', 'dark', 'appearance', 'Default theme'),
  ('language', 'en', 'appearance', 'Default language'),
  ('auto_backup', 'true', 'backup', 'Enable automatic backups'),
  ('backup_interval', '24', 'backup', 'Backup interval in hours'),
  ('data_retention_days', '365', 'data', 'Data retention period in days')
ON CONFLICT (key) DO NOTHING;

-- Insert common phases
INSERT INTO phases (name, description, priority) VALUES
  ('Full Swap', 'Full equipment swap phase', 1),
  ('RO4', 'Rollout Phase 4', 2),
  ('RO5', 'Rollout Phase 5', 3),
  ('RO6', 'Rollout Phase 6', 4),
  ('Modernization', 'Network modernization', 5)
ON CONFLICT (name) DO NOTHING;
