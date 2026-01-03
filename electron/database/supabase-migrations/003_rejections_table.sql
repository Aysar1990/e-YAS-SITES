-- ============================================
-- TSSR Monitor - Supabase Migration 003
-- Rejections Table
-- Version: 2.0
-- Date: 2026-01-01
-- ============================================

-- ============================================
-- REJECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rejections (
  id BIGSERIAL PRIMARY KEY,
  site_id TEXT NOT NULL,
  phase_name TEXT,
  rejection_reason TEXT,
  department TEXT,
  rejected_by TEXT,
  rejection_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'resolved', 'escalated')),
  resolution_notes TEXT,
  resolved_by TEXT,
  resolved_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_rejections_site_id ON rejections(site_id);
CREATE INDEX IF NOT EXISTS idx_rejections_status ON rejections(status);
CREATE INDEX IF NOT EXISTS idx_rejections_department ON rejections(department);
CREATE INDEX IF NOT EXISTS idx_rejections_date ON rejections(rejection_date);
CREATE INDEX IF NOT EXISTS idx_rejections_rejected_by ON rejections(rejected_by);

-- ============================================
-- TRIGGER
-- ============================================
CREATE TRIGGER update_rejections_updated_at
    BEFORE UPDATE ON rejections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE rejections ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all rejections
CREATE POLICY "rejections_authenticated_read" ON rejections
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Authenticated users can insert rejections
CREATE POLICY "rejections_authenticated_insert" ON rejections
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Authenticated users can update rejections
CREATE POLICY "rejections_authenticated_update" ON rejections
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Only admins can delete rejections
CREATE POLICY "rejections_admin_delete" ON rejections
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()::bigint AND u.role = 'admin'
        )
    );
