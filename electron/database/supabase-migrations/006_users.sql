-- Migration: Create users table for cloud sync
-- Date: 2024-12-31
-- Description: Stores user accounts with role-based access control

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'contractor',
    contractor_name VARCHAR(200),
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_contractor ON users(contractor_name);

-- Enable Row Level Security (optional - can be customized)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for service role (your backend)
CREATE POLICY "Service role full access" ON users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Insert default admin user if not exists
INSERT INTO users (username, password, role, is_active)
VALUES ('admin', '$2a$10$defaulthashedpassword', 'admin', 1)
ON CONFLICT (username) DO NOTHING;

-- Add comment
COMMENT ON TABLE users IS 'TSSR Monitor user accounts with role-based access control';
