# Database Migration Guide

## Overview

e-YAS SITES uses a **dual database strategy** that allows seamless switching between:

| Database | Type | Use Case |
|----------|------|----------|
| **SQLite** | Local | Offline work, development, single-user mode |
| **Supabase** | Cloud | Team collaboration, multi-user, real-time sync |

### When to Use Each

| Scenario | Recommended Database |
|----------|---------------------|
| No internet connection | SQLite |
| Single user on one machine | SQLite |
| Multiple users collaborating | Supabase |
| Real-time updates needed | Supabase |
| Development/Testing | SQLite |
| Production deployment | Supabase |

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and API keys from Settings > API

### 2. Create Tables in Supabase Dashboard

Run this SQL in the Supabase SQL Editor:

```sql
-- Sites Table (68 columns matching Excel structure)
CREATE TABLE sites (
  -- Primary Keys
  id SERIAL PRIMARY KEY,
  site_id VARCHAR(50) NOT NULL,
  phase_name VARCHAR(50) NOT NULL,

  -- Basic Site Info
  site_name VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  governorate VARCHAR(100),
  district VARCHAR(100),
  city VARCHAR(100),
  site_type VARCHAR(50),
  site_category VARCHAR(50),

  -- Priority & Status
  priority INTEGER DEFAULT 999,
  tssr_overall_status VARCHAR(50) DEFAULT 'Pending',
  comments TEXT,

  -- TI Department
  ti_assigned_to VARCHAR(100),
  ti_status VARCHAR(50) DEFAULT 'Pending',
  ti_rejection_reason TEXT,
  ti_rejection_count INTEGER DEFAULT 0,
  ti_date DATE,
  ti_notes TEXT,

  -- RF Planning Department
  rf_plan_assigned_to VARCHAR(100),
  rf_plan_status VARCHAR(50) DEFAULT 'Pending',
  rf_plan_rejection_reason TEXT,
  rf_plan_rejection_count INTEGER DEFAULT 0,
  rf_plan_date DATE,
  rf_plan_notes TEXT,

  -- RF Optimization Department
  rf_opt_assigned_to VARCHAR(100),
  rf_opt_status VARCHAR(50) DEFAULT 'Pending',
  rf_opt_rejection_reason TEXT,
  rf_opt_rejection_count INTEGER DEFAULT 0,
  rf_opt_date DATE,
  rf_opt_notes TEXT,

  -- Civil Department
  civil_assigned_to VARCHAR(100),
  civil_status VARCHAR(50) DEFAULT 'Pending',
  civil_rejection_reason TEXT,
  civil_rejection_count INTEGER DEFAULT 0,
  civil_date DATE,
  civil_notes TEXT,

  -- MW Department
  mw_assigned_to VARCHAR(100),
  mw_status VARCHAR(50) DEFAULT 'Pending',
  mw_rejection_reason TEXT,
  mw_rejection_count INTEGER DEFAULT 0,
  mw_date DATE,
  mw_notes TEXT,

  -- Contractor Info
  contractor_name VARCHAR(100),
  contractor_status VARCHAR(50),
  contractor_submission_date DATE,

  -- Nokia Fields (NPO/GSD)
  npo_status VARCHAR(50),
  npo_assigned_to VARCHAR(100),
  npo_date DATE,
  npo_notes TEXT,
  gsd_status VARCHAR(50),
  gsd_assigned_to VARCHAR(100),
  gsd_date DATE,
  gsd_notes TEXT,

  -- Technical Details
  antenna_height DECIMAL(5, 2),
  tower_type VARCHAR(50),
  power_source VARCHAR(50),
  backup_power BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,

  -- Unique constraint
  UNIQUE(site_id, phase_name)
);

-- Create indexes for performance
CREATE INDEX idx_sites_phase ON sites(phase_name);
CREATE INDEX idx_sites_status ON sites(tssr_overall_status);
CREATE INDEX idx_sites_contractor ON sites(contractor_name);
CREATE INDEX idx_sites_priority ON sites(priority);
CREATE INDEX idx_sites_governorate ON sites(governorate);
CREATE INDEX idx_sites_updated ON sites(updated_at);

-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'contractor',
  full_name VARCHAR(100),
  department VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings Table
CREATE TABLE settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log Table
CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50),
  table_name VARCHAR(50),
  record_id VARCHAR(100),
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rejections History Table
CREATE TABLE rejection_history (
  id SERIAL PRIMARY KEY,
  site_id VARCHAR(50) NOT NULL,
  phase_name VARCHAR(50) NOT NULL,
  department VARCHAR(50) NOT NULL,
  rejection_reason TEXT,
  rejected_by VARCHAR(100),
  rejected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(100)
);
```

### 3. Required Indexes

```sql
-- Performance indexes (if not created above)
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_rejections_site ON rejection_history(site_id, phase_name);
```

### 4. Row Level Security (RLS)

```sql
-- Enable RLS on sites table
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY admin_all ON sites
  FOR ALL
  TO authenticated
  USING (
    (SELECT role FROM users WHERE username = current_user) = 'admin'
  );

-- Policy: Users can read all sites
CREATE POLICY read_all ON sites
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Contractors can only update their assigned sites
CREATE POLICY contractor_update ON sites
  FOR UPDATE
  TO authenticated
  USING (
    contractor_name = (SELECT full_name FROM users WHERE username = current_user)
  );

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY user_read_own ON users
  FOR SELECT
  TO authenticated
  USING (username = current_user OR (SELECT role FROM users WHERE username = current_user) = 'admin');
```

---

## Migration Process

### From Excel to SQLite

1. **Open the application** in SQLite mode:
   ```bash
   DATABASE_TYPE=sqlite npm start
   ```

2. **Import Excel file**:
   - Go to Admin > Import
   - Select your `.xlsm` file
   - Choose worksheets to import
   - Click "Import"

3. **Verify data**:
   - Check Admin Dashboard for correct counts
   - Verify sample sites in Sites view

### From SQLite to Supabase

1. **Configure Supabase credentials** in `.env`:
   ```bash
   DATABASE_TYPE=supabase
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   ```

2. **Configure server credentials** in `electron/.env.server`:
   ```bash
   SUPABASE_SERVICE_KEY=your_service_key
   ```

3. **Run migration script**:
   ```bash
   node electron/scripts/migrate-to-supabase.js
   ```

4. **Verify in Supabase Dashboard**:
   - Check Tables > sites for data
   - Verify row counts match

### Conflict Resolution Rules

When syncing between databases:

| Conflict Type | Resolution |
|--------------|------------|
| Same site, different data | Latest `updated_at` wins |
| Site exists in one DB only | Copy to other DB |
| Different phase_name | Treat as separate records |
| Status mismatch | Cloud (Supabase) takes priority |

---

## Schema Definition

### Sites Table (68 Columns)

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Auto-increment primary key |
| `site_id` | VARCHAR(50) | Site identifier (e.g., "ZJO1234") |
| `phase_name` | VARCHAR(50) | Phase name (e.g., "RO4", "RO5") |
| `site_name` | VARCHAR(255) | Human-readable site name |
| `latitude` | DECIMAL(10,8) | GPS latitude |
| `longitude` | DECIMAL(11,8) | GPS longitude |
| `governorate` | VARCHAR(100) | Governorate name |
| `priority` | INTEGER | Sort priority (1 = highest) |
| `tssr_overall_status` | VARCHAR(50) | Overall TSSR status |
| `ti_status` | VARCHAR(50) | TI department status |
| `rf_plan_status` | VARCHAR(50) | RF Planning status |
| `rf_opt_status` | VARCHAR(50) | RF Optimization status |
| `civil_status` | VARCHAR(50) | Civil department status |
| `mw_status` | VARCHAR(50) | MW department status |
| `contractor_name` | VARCHAR(100) | Assigned contractor |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

*See full schema in SQL above*

### Data Types Mapping

| Excel Type | SQLite Type | Supabase Type |
|------------|-------------|---------------|
| Text | TEXT | VARCHAR/TEXT |
| Number | INTEGER/REAL | INTEGER/DECIMAL |
| Date | TEXT (ISO) | DATE/TIMESTAMPTZ |
| Yes/No | INTEGER (0/1) | BOOLEAN |
| Long Text | TEXT | TEXT |

---

## Troubleshooting

### Common Issues

#### "Connection refused" to Supabase

**Cause**: Network issue or incorrect URL
**Solution**:
1. Check `SUPABASE_URL` in `.env`
2. Verify internet connection
3. Check Supabase project is active

#### "Permission denied" errors

**Cause**: RLS policies blocking access
**Solution**:
1. Verify user role in users table
2. Check RLS policies in Supabase Dashboard
3. Use Service Key for admin operations

#### Data not syncing

**Cause**: WebSocket connection failed
**Solution**:
1. Check port 3002 is open
2. Verify real-time is enabled in Supabase
3. Check browser console for errors

#### Duplicate sites after migration

**Cause**: Missing unique constraint
**Solution**:
```sql
-- Remove duplicates (keep latest)
DELETE FROM sites a USING sites b
WHERE a.id < b.id
  AND a.site_id = b.site_id
  AND a.phase_name = b.phase_name;

-- Add constraint
ALTER TABLE sites ADD CONSTRAINT unique_site_phase UNIQUE (site_id, phase_name);
```

#### Slow queries

**Cause**: Missing indexes
**Solution**:
```sql
-- Check which indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'sites';

-- Create missing indexes
CREATE INDEX CONCURRENTLY idx_sites_search ON sites(site_id, site_name);
```

---

## Best Practices

1. **Always backup before migration**
   ```bash
   cp data/tssr.db data/tssr_backup_$(date +%Y%m%d).db
   ```

2. **Test with small dataset first**
   - Export 100 sites to new environment
   - Verify all columns transfer correctly

3. **Use transactions for bulk operations**
   - Supabase has 1000-row limit per insert
   - Batch large imports

4. **Monitor Supabase quotas**
   - Free tier: 500MB database
   - Check usage in Dashboard > Settings > Billing

---

*Last Updated: December 2025*
