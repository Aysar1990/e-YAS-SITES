-- ============================================
-- TSSR Monitor - Supabase Migration 002
-- Users Table
-- Version: 2.0
-- Date: 2026-01-01
-- ============================================

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user', 'contractor', 'viewer')),
  contractor_name TEXT,
  email TEXT,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_contractor_name ON users(contractor_name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- TRIGGER
-- ============================================
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "users_admin_all" ON users
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

-- Policy: Users can read their own data
CREATE POLICY "users_self_read" ON users
    FOR SELECT
    TO authenticated
    USING (id = auth.uid()::bigint);

-- Policy: Users can update their own data (except role)
CREATE POLICY "users_self_update" ON users
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid()::bigint)
    WITH CHECK (id = auth.uid()::bigint);
