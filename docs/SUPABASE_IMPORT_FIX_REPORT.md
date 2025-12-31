# Supabase Import System - Fix Report

## Date: December 29, 2025

---

## Executive Summary

This report documents the comprehensive fixes applied to enable direct Excel import to Supabase in the TSSR Monitor application.

---

## Issues Identified & Fixed

### Issue #1: Wrong Table Name (CRITICAL)

**Problem:** `supabaseSync.js` was reading from `sites_cache` instead of `sites`

**Files Fixed:**
- `electron/services/supabaseSync.js` (lines 143-144, 308-309)
- `electron/ipc/supabaseHandlers.js` (lines 66, 206-208)

**Before:**
```javascript
const stmt = db.prepare('SELECT * FROM sites_cache WHERE phase_name = ?')
```

**After:**
```javascript
const stmt = db.prepare('SELECT * FROM sites WHERE phase_name = ?')
```

---

### Issue #2: No Direct Supabase Import (CRITICAL)

**Problem:** Import always went to SQLite first, requiring manual sync to Supabase

**Solution:** Added new IPC handlers for direct Supabase import

**New IPC Handlers:**
| Handler | Purpose |
|---------|---------|
| `supabase:direct-import` | Import array of sites directly to Supabase |
| `supabase:import-excel` | Import Excel file directly to Supabase |

**New Frontend Methods:**
| Method | Purpose |
|--------|---------|
| `window.electron.supabaseDirectImport(sites)` | Direct array import |
| `window.electron.supabaseImportExcel(params)` | Direct Excel import |
| `importService.uploadSitesToSupabase(sites, onProgress)` | Frontend wrapper |
| `importService.checkSupabaseConnection()` | Test Supabase connection |

---

### Issue #3: Column Mapping Inconsistency (MEDIUM)

**Problem:** Different column mappings between import and sync services

**Solution:** Standardized column mapping in `supabaseSync.js`

**Mapping Table:**
| SQLite Column | Supabase Column |
|---------------|-----------------|
| `longitude` | `long` |
| `latitude` | `lat` |
| `site_sectors` | `site_sectors` (no change) |
| `rf_opt_status` | `rf_opt_status` (no change) |

---

## New Architecture

### Data Flow Options

**Option 1: SQLite First (Default)**
```
Excel → importHandlers → singleFileProcessor → SQLite → (manual sync) → Supabase
```

**Option 2: Direct Supabase (NEW)**
```
Excel → supabaseHandlers → supabaseSync.importDirectToSupabase() → Supabase
```

### Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                         NEW ARCHITECTURE                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Excel File]                                                         │
│       │                                                               │
│       ├──────────────────────────────────────────┐                   │
│       │                                          │                   │
│       ▼                                          ▼                   │
│  [SQLite Path]                            [Supabase Path]            │
│       │                                          │                   │
│       ▼                                          ▼                   │
│  import-excel-from-base64              supabase:import-excel         │
│       │                                          │                   │
│       ▼                                          ▼                   │
│  singleFileProcessor                   supabaseSync.importDirect     │
│       │                                          │                   │
│       ▼                                          ▼                   │
│  [SQLite: sites] ──── sync ────────► [Supabase: sites]              │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Database Type: 'sqlite' or 'supabase'
DATABASE_TYPE=supabase

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### Supabase Table Schema

Ensure your Supabase `sites` table has these columns:

```sql
CREATE TABLE sites (
  id SERIAL PRIMARY KEY,
  site_id TEXT UNIQUE NOT NULL,
  final_site_name TEXT,
  site_code TEXT,
  site_type TEXT,
  key_number TEXT,
  long DECIMAL,
  lat DECIMAL,
  governorate TEXT,
  structure TEXT,
  structure_type TEXT,
  part_of TEXT,
  height_m DECIMAL,
  site_owner TEXT,
  phase_name TEXT,
  priority INTEGER,
  cluster TEXT,
  area TEXT,
  weekly_plan TEXT,
  tss_smp TEXT,
  tssr_subcon TEXT,
  tssr_po TEXT,
  ts_survey_ac TEXT,
  tssr_overall_status TEXT,
  tssr_status_date TEXT,
  tssr_remark TEXT,
  action_age INTEGER,
  five_g_sectors_names TEXT,
  five_g_solution TEXT,
  site_sectors INTEGER,
  ibs_sector TEXT,
  tdd_site BOOLEAN,
  version TEXT,
  rec_cab_swap TEXT,
  spoc_readiness TEXT,
  spoc_status TEXT,
  spoc_reviewed TEXT,
  week_number INTEGER,
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
  mw_comment TEXT,
  cluster_owner_mw TEXT,
  nokia_npo_status TEXT,
  nokia_npo_comment TEXT,
  nokia_site_owner TEXT,
  rfi_status TEXT,
  gap_analysis TEXT,
  approved BOOLEAN,
  tssr_ready BOOLEAN,
  dismantle_status TEXT,
  dismantle_date TEXT,
  red_zone_sites TEXT,
  sequence INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint for upsert
ALTER TABLE sites ADD CONSTRAINT sites_site_id_unique UNIQUE (site_id);
```

---

## Usage Examples

### Frontend: Direct Supabase Import

```javascript
import { importService } from '../services/importService';

// Check Supabase connection first
const connection = await importService.checkSupabaseConnection();
if (!connection.available) {
  console.error('Supabase not available:', connection.message);
  return;
}

// Parse Excel file
const result = await importService.parseExcelFile(file);

// Import directly to Supabase
const summary = await importService.uploadSitesToSupabase(result.data, (percentage) => {
  console.log(`Progress: ${percentage}%`);
});

console.log(`Imported ${summary.updated} sites to Supabase`);
```

### Backend: IPC Handler Usage

```javascript
// From renderer process
const result = await window.electron.supabaseImportExcel({
  filePath: '/path/to/file.xlsx'
  // OR
  base64Data: 'base64-encoded-data',
  fileName: 'import.xlsx'
});

if (result.success) {
  console.log('Import complete:', result.data.summary);
} else {
  console.error('Import failed:', result.error);
}
```

---

## Files Modified

| File | Changes |
|------|---------|
| `electron/services/supabaseSync.js` | Fixed table name, added `importDirectToSupabase()`, `upsertSite()`, `deleteSite()`, `getSitesFromSupabase()` |
| `electron/ipc/supabaseHandlers.js` | Fixed table name, added `supabase:direct-import` and `supabase:import-excel` handlers |
| `electron/preload.js` | Added `supabaseDirectImport()` and `supabaseImportExcel()` methods |
| `src/services/importService.js` | Added `uploadSitesToSupabase()` and `checkSupabaseConnection()` |

---

## Testing

### Test Supabase Connection

```javascript
const result = await window.electron.supabaseTestConnection();
console.log(result);
// { success: true, data: { message: 'Connected', latency: 150 } }
```

### Test Direct Import

```javascript
const sites = [
  { site_id: 'TEST-001', phase_name: 'RO4', tssr_overall_status: 'Approved' },
  { site_id: 'TEST-002', phase_name: 'RO4', tssr_overall_status: 'Pending' }
];

const result = await window.electron.supabaseDirectImport(sites);
console.log(result);
// { success: true, data: { summary: { total: 2, updated: 2, failed: 0 } } }
```

---

## Troubleshooting

### Error: "Supabase client not initialized"

**Cause:** Missing environment variables

**Solution:** Ensure `.env` has:
```env
SUPABASE_URL=your-url
SUPABASE_SERVICE_KEY=your-key
```

### Error: "No data found in Excel file"

**Cause:** Excel file format not recognized

**Solution:** Ensure:
1. File has `.xlsx` or `.xlsm` extension
2. Data sheet is named "Data", "Export", or "Master"
3. Header row contains "Site ID" column

### Error: "duplicate key value violates unique constraint"

**Cause:** Supabase table missing unique constraint

**Solution:** Run:
```sql
ALTER TABLE sites ADD CONSTRAINT sites_site_id_unique UNIQUE (site_id);
```

---

## Summary

| Before | After |
|--------|-------|
| Import → SQLite only | Import → SQLite OR Supabase directly |
| Manual sync required | Auto-sync option available |
| Wrong table name (sites_cache) | Correct table name (sites) |
| Inconsistent column mapping | Standardized mapping |
| No connection testing | Connection test available |

---

## Author

TSSR Monitor Development Team

## Version

1.1.0 - Supabase Direct Import Support
