# Database Integration Audit Report

**Generated:** 2025-12-29
**System:** TSSR Monitor - Excel-to-Database Import System
**Auditor:** Database Integration Audit Specialist

---

## Executive Summary

This audit identified **CRITICAL** issues in the database integration layer that are causing import failures, data inconsistency, and potential ghost data. The root cause is a **TABLE NAME MISMATCH** between different parts of the codebase.

### Health Score: 45/100 (Needs Immediate Attention)

---

## PHASE 1: System Diagnosis

### 1.1 Architecture Overview

```
Excel File (.xlsm/.xlsx)
       |
       v
  ExcelReader (electron/services/excelReader.js)
       |
       v
  [Batch/Single Processor] --> Uses 'sites' table (WRONG!)
       |
       v
  Database Adapter (SQLite/Supabase)
       |
       v
  [sites_cache table] <-- Schema creates this
```

### 1.2 Table Name Mismatch (CRITICAL)

| Component | Table Used | Correct? |
|-----------|------------|----------|
| `001_initial.sql` (Migration) | `sites_cache` | Source of Truth |
| `dataSync.js` | `sites_cache` | CORRECT |
| `sites.js` (Queries) | `sites` | WRONG |
| `liveSyncProcessor.js` | `sites` | WRONG |
| `batchProcessor.js` | `sites` | WRONG |
| `singleFileProcessor.js` | `sites` | WRONG |
| `realtimeSync.js` | `sites` | WRONG |
| Server routes (contractors, stats) | `sites_cache` | CORRECT |

**Impact:** Data is being inserted into a non-existent `sites` table or a dynamically created one, while queries read from `sites_cache`. This causes:
- Import appears successful but data doesn't show in UI
- Ghost data accumulates in wrong tables
- Statistics and dashboards show stale/incorrect data

### 1.3 Data Flow Analysis

**Working Flow (dataSync.js):**
```
Excel -> ExcelReader -> dataSync.js -> sites_cache (CORRECT)
```

**Broken Flows:**
```
Excel -> ExcelReader -> batchProcessor.js -> sites (NON-EXISTENT OR SEPARATE)
Excel -> ExcelReader -> singleFileProcessor.js -> sites (NON-EXISTENT OR SEPARATE)
Excel -> ExcelReader -> liveSyncProcessor.js -> sites (NON-EXISTENT OR SEPARATE)
```

### 1.4 Schema Analysis

**Defined Schema (sites_cache):**
- 55 columns defined
- Unique constraint: `UNIQUE(site_id, phase_name)`
- Indexes on: `phase_name`, `tssr_subcon`, `tssr_overall_status`, `governorate`, `site_id`

**Import Types Mapping (importTypes.js):**
- 62 Excel column mappings defined
- Column name variations handled (e.g., `Part of`, `Part Of`, `PART OF`)
- Numeric fields: `longitude`, `latitude`, `height_m`, `priority`, `action_age`, `site_sectors_count`, `week_number`, `sequence`
- Boolean fields: `approved`, `tssr_ready`, `tdd_site`

**Potential Mapping Issues:**
| Import Types Column | Schema Column | Status |
|---------------------|---------------|--------|
| `site_sectors_count` | `site_sectors` | MISMATCH |
| `rf_optim_status` | `rf_opt_status` | MISMATCH |
| `owner_name` | N/A | MISSING IN SCHEMA |
| `owner_contact_number` | N/A | MISSING IN SCHEMA |
| `new_allocation` | N/A | MISSING IN SCHEMA |
| `abcd`, `ab` | N/A | MISSING IN SCHEMA |
| `spoc_readiness`, `spoc_status`, `spoc_reviewed` | N/A | MISSING IN SCHEMA |
| `week_number`, `sequence` | N/A | MISSING IN SCHEMA |
| `dismantle_status`, `dismantle_date` | N/A | MISSING IN SCHEMA |
| `red_zone_sites` | N/A | MISSING IN SCHEMA |

---

## PHASE 2: Ghost Data & Issues Identified

### 2.1 Ghost Data Sources

1. **Dual Table Ghost Data:**
   - `sites` table may contain orphaned records from broken import flows
   - `sites_cache` contains correct data from dataSync.js only

2. **Duplicate Records:**
   - Same `site_id` with different/empty `phase_name` values
   - `INSERT OR REPLACE` creates new rows when composite key differs

3. **Orphaned Relationships:**
   - `nokia_reviews.site_id` references may not match actual `sites_cache` records
   - `rejections_log` entries may reference non-existent sites

### 2.2 Data Integrity Violations

| Issue Type | Description | Severity |
|------------|-------------|----------|
| Table Mismatch | Code references `sites`, schema has `sites_cache` | CRITICAL |
| Column Mismatch | `site_sectors_count` vs `site_sectors` | HIGH |
| Missing Columns | 10+ columns in mapping not in schema | MEDIUM |
| No FK Constraints | No foreign keys between tables | LOW |

### 2.3 Import Flow Errors

**Error Pattern 1: "no such table: sites"**
```
SQL exec error: no such table: sites
```
- Occurs in batchProcessor.js, singleFileProcessor.js, liveSyncProcessor.js
- Root cause: Table name mismatch

**Error Pattern 2: Silent Data Loss**
- Import reports success but data doesn't appear
- Root cause: Data inserted into wrong table

---

## PHASE 3: Remediation Plan

### Priority 1: Fix Table Name References (CRITICAL)

**Files to Update:**

1. `electron/database/queries/sites.js` - 40+ references
2. `electron/services/liveSyncProcessor.js` - 1 reference
3. `electron/services/batchProcessor.js` - uses `generateInsertSQL('sites', ...)`
4. `electron/services/importProcessors/singleFileProcessor.js` - 2 references
5. `electron/services/realtimeSync.js` - 1 reference
6. `electron/services/importTypes.js` - `SINGLE_FILE_CONFIG.tableName`
7. `electron/scripts/performance-test.js` - multiple references
8. `electron/scripts/seed-database.js` - multiple references

### Priority 2: Schema Migration

Create migration `005_sites_table_alias.sql` to add a view:

```sql
-- Create a view alias for backward compatibility
CREATE VIEW IF NOT EXISTS sites AS SELECT * FROM sites_cache;

-- Add missing columns to sites_cache
ALTER TABLE sites_cache ADD COLUMN owner_name TEXT;
ALTER TABLE sites_cache ADD COLUMN owner_contact_number TEXT;
ALTER TABLE sites_cache ADD COLUMN new_allocation TEXT;
ALTER TABLE sites_cache ADD COLUMN spoc_readiness TEXT;
ALTER TABLE sites_cache ADD COLUMN spoc_status TEXT;
ALTER TABLE sites_cache ADD COLUMN spoc_reviewed TEXT;
ALTER TABLE sites_cache ADD COLUMN week_number INTEGER;
ALTER TABLE sites_cache ADD COLUMN sequence INTEGER;
ALTER TABLE sites_cache ADD COLUMN dismantle_status TEXT;
ALTER TABLE sites_cache ADD COLUMN dismantle_date DATETIME;
ALTER TABLE sites_cache ADD COLUMN red_zone_sites TEXT;
```

### Priority 3: Data Cleanup Scripts

See `scripts/database-cleanup.js` for automated cleanup.

### Priority 4: Column Name Standardization

Update `importTypes.js`:
- Change `site_sectors_count` to `site_sectors`
- Change `rf_optim_status` to `rf_opt_status`

---

## Cleanup Scripts

### Quick Fix: Create View Alias

```sql
-- Run this immediately to fix table reference issues
CREATE VIEW IF NOT EXISTS sites AS SELECT * FROM sites_cache;
```

### Data Migration (if sites table exists with data)

```sql
-- Check if sites table has data
SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='sites';

-- If exists, migrate data to sites_cache
INSERT OR REPLACE INTO sites_cache
SELECT * FROM sites
WHERE site_id NOT IN (SELECT site_id FROM sites_cache);

-- Verify migration
SELECT 'sites' as source, COUNT(*) as count FROM sites
UNION ALL
SELECT 'sites_cache' as source, COUNT(*) as count FROM sites_cache;
```

### Ghost Data Cleanup

```sql
-- Find duplicate site_id entries (different phases)
SELECT site_id, COUNT(*) as cnt, GROUP_CONCAT(phase_name) as phases
FROM sites_cache
GROUP BY site_id
HAVING cnt > 1;

-- Find sites with empty/null phase_name
SELECT COUNT(*) as empty_phase_count
FROM sites_cache
WHERE phase_name IS NULL OR phase_name = '';

-- Find orphaned nokia_reviews
SELECT nr.site_id, nr.checked, nr.note
FROM nokia_reviews nr
LEFT JOIN sites_cache sc ON nr.site_id = sc.site_id
WHERE sc.site_id IS NULL;

-- Find orphaned rejections
SELECT rl.site_id, rl.contractor_name, rl.department
FROM rejections_log rl
LEFT JOIN sites_cache sc ON rl.site_id = sc.site_id
WHERE sc.site_id IS NULL;
```

---

## Verification Queries

After applying fixes, run these queries to verify:

```sql
-- 1. Check table exists
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('sites', 'sites_cache');

-- 2. Count records
SELECT 'sites_cache' as tbl, COUNT(*) as cnt FROM sites_cache;

-- 3. Check phase distribution
SELECT phase_name, COUNT(*) as cnt
FROM sites_cache
WHERE phase_name IS NOT NULL AND phase_name != ''
GROUP BY phase_name
ORDER BY cnt DESC;

-- 4. Check Part Of distribution
SELECT
  CASE
    WHEN LOWER(TRIM(part_of)) IN ('thinlayer', 'thin layer') THEN 'ThinLayer'
    WHEN LOWER(TRIM(part_of)) = 'full swap' THEN 'Full Swap'
    WHEN LOWER(TRIM(part_of)) LIKE '%swap%exist%' THEN 'Swap Existing'
    ELSE 'Other/Not Specified'
  END as category,
  COUNT(*) as cnt
FROM sites_cache
GROUP BY category;

-- 5. Verify unique constraint
SELECT site_id, phase_name, COUNT(*) as cnt
FROM sites_cache
GROUP BY site_id, phase_name
HAVING cnt > 1;
```

---

## Recommendations

### Immediate Actions (Today)

1. Create `sites` view alias for backward compatibility
2. Update `SINGLE_FILE_CONFIG.tableName` to `'sites_cache'`
3. Update `generateInsertSQL` calls to use `'sites_cache'`

### Short-term (This Week)

1. Update all 40+ references in `sites.js` queries
2. Update all import processors
3. Run data migration if `sites` table has orphan data
4. Add comprehensive logging to import processes

### Long-term

1. Add database schema validation on startup
2. Implement automatic migration runner
3. Add data integrity checks post-import
4. Consider using ORM for type-safe queries

---

## Appendix: File References

### Files Using `sites` Table (Need Update)

```
electron/database/queries/sites.js:10:  SELECT * FROM sites
electron/database/queries/sites.js:17:  SELECT * FROM sites
electron/database/queries/sites.js:27:  SELECT * FROM sites WHERE site_id = ?
electron/database/queries/sites.js:31:  SELECT * FROM sites WHERE site_id = ?
electron/database/queries/sites.js:50:  FROM sites
electron/database/queries/sites.js:86:  FROM sites
electron/database/queries/sites.js:109: FROM sites
electron/database/queries/sites.js:131: FROM sites
electron/database/queries/sites.js:143: FROM sites
electron/database/queries/sites.js:156: FROM sites WHERE phase_name = ?
electron/database/queries/sites.js:159: FROM sites
electron/database/queries/sites.js:186: SELECT * FROM sites
electron/database/queries/sites.js:223: FROM sites
electron/database/queries/sites.js:291: FROM sites
electron/database/queries/sites.js:316: FROM sites
electron/database/queries/sites.js:342: FROM sites
electron/database/queries/sites.js:363: FROM sites
electron/database/queries/sites.js:376: FROM sites
electron/database/queries/sites.js:383: FROM sites
electron/database/queries/sites.js:391: FROM sites
electron/database/queries/sites.js:418: FROM sites
electron/database/queries/sites.js:435: FROM sites
electron/database/queries/sites.js:444: FROM sites
electron/database/queries/sites.js:452: FROM sites
electron/database/queries/sites.js:461: FROM sites
electron/database/queries/sites.js:470: FROM sites
electron/database/queries/sites.js:488: FROM sites
electron/database/queries/sites.js:575: UPDATE sites SET
electron/services/importProcessors/singleFileProcessor.js:300: FROM sites WHERE site_id = ?
electron/services/liveSyncProcessor.js:31: SELECT * FROM sites WHERE site_id = ?
electron/services/batchProcessor.js:227: generateInsertSQL('sites', columns)
electron/services/importTypes.js:173: tableName: 'sites'
```

### Files Using `sites_cache` Table (Correct)

```
electron/database/migrations/001_initial.sql:47: CREATE TABLE sites_cache
electron/services/dataSync.js:63: FROM sites_cache
electron/server/routes/*.js: Multiple correct references
electron/ipc/statsHandlers.js: Multiple correct references
```

---

**Report Status:** Complete
**Next Steps:** Implement Priority 1 fixes immediately
