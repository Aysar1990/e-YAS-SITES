-- Migration: Add contractor_name to users table
-- Date: 2024-12-30
-- Note: This migration is now handled in JavaScript to check column existence

-- SQLite doesn't support IF NOT EXISTS for columns
-- The migration runner will handle this gracefully
-- ALTER TABLE users ADD COLUMN contractor_name TEXT;

-- This file is kept for documentation purposes
-- The actual column addition is handled by the migration runner with error handling
SELECT 1;
