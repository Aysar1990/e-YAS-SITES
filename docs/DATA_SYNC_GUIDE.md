# 📊 TSSR Monitor - Data Synchronization Guide

## نظرة عامة

هذا الدليل يشرح كيفية تطابق البيانات بين:
- **Excel** (المصدر الرئيسي)
- **SQLite** (قاعدة البيانات المحلية)
- **Supabase** (قاعدة البيانات السحابية)

---

## 🗂️ هيكل الأعمدة (68 عمود + 3 نظام = 71)

### Excel Headers → Database Columns

| # | Excel Header | Database Column | النوع |
|---|--------------|-----------------|-------|
| 1 | Site ID | site_id | TEXT |
| 2 | Final Site Name | final_site_name | TEXT |
| 3 | Site Owner | site_owner | TEXT |
| 4 | Site Code | site_code | TEXT |
| 5 | Site Type | site_type | TEXT |
| 6 | Key Number | key_number | TEXT |
| 7 | long | long | REAL/NUMERIC |
| 8 | lat | lat | REAL/NUMERIC |
| 9 | Governorate | governorate | TEXT |
| 10 | Structure | structure | TEXT |
| 11 | Owner Name | owner_name | TEXT |
| 12 | Owner contact number | owner_contact_number | TEXT |
| 13 | Structure Type | structure_type | TEXT |
| 14 | Hieght (m) | height_m | REAL/NUMERIC |
| 15 | Part of | part_of | TEXT |
| 16 | Phase Name | phase_name | TEXT |
| 17 | Priority | priority | INTEGER |
| 18 | Cluster | cluster | TEXT |
| 19 | Area | area | TEXT |
| 20 | Weekly Plan | weekly_plan | TEXT |
| 21 | TSS SMP | tss_smp | TEXT |
| 22 | TSSR Subcon | tssr_subcon | TEXT |
| 23 | NEW Allocation | new_allocation | TEXT |
| 24 | TSSR PO# | tssr_po | TEXT |
| 25 | TS Survey (Ac) | ts_survey_ac | TEXT |
| 26 | abcd | abcd | TEXT |
| 27 | ab | ab | TEXT |
| 28 | 5G sectors Names | five_g_sectors_names | TEXT |
| 29 | 5G solution | five_g_solution | TEXT |
| 30 | Site Sectors # | site_sectors | TEXT |
| 31 | IBS Sector | ibs_sector | TEXT |
| 32 | TDD Site | tdd_site | TEXT |
| 33 | NoKia NPO status | nokia_npo_status | TEXT |
| 34 | Nokia NPO Comment | nokia_npo_comment | TEXT |
| 35 | TI Status | ti_status | TEXT |
| 36 | TI Comment | ti_comment | TEXT |
| 37 | Cluster Owner (TI) | cluster_owner_ti | TEXT |
| 38 | RF Plan. Status | rf_plan_status | TEXT |
| 39 | RF Plan Comment | rf_plan_comment | TEXT |
| 40 | Cluster Owner (Planing) | cluster_owner_planning | TEXT |
| 41 | RF Optim Status | rf_optim_status | TEXT |
| 42 | RF Opt. comment | rf_opt_comment | TEXT |
| 43 | Cluster Owner (Optimization) | cluster_owner_optimization | TEXT |
| 44 | Civil Status | civil_status | TEXT |
| 45 | Civil Comment | civil_comment | TEXT |
| 46 | Cluster Owner (Civil) | cluster_owner_civil | TEXT |
| 47 | MW Status | mw_status | TEXT |
| 48 | Cluster Owner (MW) | cluster_owner_mw | TEXT |
| 49 | REC. Cab. Swap | rec_cab_swap | TEXT |
| 50 | SPOC Readiness | spoc_readiness | TEXT |
| 51 | Version | version | TEXT |
| 52 | SPOC Status | spoc_status | TEXT |
| 53 | TSSR Overall Status | tssr_overall_status | TEXT |
| 54 | TSSR status Date | tssr_status_date | TEXT |
| 55 | SPOC Reviewed | spoc_reviewed | TEXT |
| 56 | Week number | week_number | INTEGER |
| 57 | TSSR Remark | tssr_remark | TEXT |
| 58 | Action Age | action_age | INTEGER |
| 59 | RFI Status | rfi_status | TEXT |
| 60 | Gap Analysis | gap_analysis | TEXT |
| 61 | Approved | approved | TEXT |
| 62 | Nokia Site Owner | nokia_site_owner | TEXT |
| 63 | TSSR Ready | tssr_ready | TEXT |
| 64 | Dismantle Status | dismantle_status | TEXT |
| 65 | Dismantle Date | dismantle_date | TEXT |
| 66 | Validate | validate | TEXT |
| 67 | Red Zone Sites | red_zone_sites | TEXT |
| 68 | Sequence | sequence | INTEGER |

### أعمدة النظام (تُضاف تلقائياً)

| # | Column | النوع | الوصف |
|---|--------|-------|-------|
| 69 | id | INTEGER/BIGSERIAL | المعرف الفريد |
| 70 | created_at | DATETIME/TIMESTAMPTZ | تاريخ الإنشاء |
| 71 | updated_at | DATETIME/TIMESTAMPTZ | تاريخ التحديث |

---

## 🔑 المفتاح الفريد

```
UNIQUE(site_id, phase_name)
```

**السبب:** نفس الموقع قد يظهر في phases مختلفة.

---

## 📁 ملفات التكوين

### 1. Column Mapping
```
electron/database/columnMapping.js
```
يحتوي على:
- `COLUMN_MAPPING`: تحويل Excel headers → database columns
- `DB_COLUMNS`: قائمة أعمدة قاعدة البيانات
- `excelRowToDbObject()`: دالة التحويل

### 2. SQLite Schema
```
electron/database/migrations/001_initial.sql
```

### 3. Supabase Configuration
```
.env
```
```env
SUPABASE_URL=https://kszdatqbykpodxmnfzfg.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

---

## 🔄 خطوات المزامنة

### الخطوة 1: تهيئة SQLite
```powershell
cd 'C:\Users\aysar\Downloads\New folder (3)\New folder (3)\TSSR Monitor\tssr-app'
node scripts/init-database.js
```

### الخطوة 2: استيراد Excel ومزامنة Supabase
```powershell
node scripts/import-and-sync.js 'path/to/excel.xlsx'
```

### الخطوة 3: التحقق من التطابق
```powershell
node scripts/compare-db-columns.js
```

---

## 🛠️ الأوامر المتاحة

| الأمر | الوصف |
|-------|-------|
| `node scripts/init-database.js` | إنشاء SQLite جديد |
| `node scripts/import-and-sync.js "file.xlsx"` | استيراد Excel → SQLite → Supabase |
| `node scripts/compare-db-columns.js` | مقارنة أعمدة SQLite و Supabase |
| `node scripts/find-duplicates.js "file.xlsx"` | البحث عن المواقع المكررة |

---

## ⚠️ ملاحظات مهمة

### 1. موقع Headers في Excel
```
Row 1: أرقام الأعمدة
Row 2: إحصائيات
Row 3: Headers ← هنا
Row 4+: البيانات
```

### 2. تحويل التواريخ
Excel يخزن التواريخ كأرقام. التحويل:
```javascript
const date = new Date((excelDate - 25569) * 86400 * 1000);
```

### 3. الأعمدة الرقمية
```javascript
// INTEGER
['priority', 'week_number', 'action_age', 'sequence']

// REAL/NUMERIC
['long', 'lat', 'height_m']
```

---

## 📊 Supabase SQL Schema

```sql
-- حذف الجدول القديم
DROP TABLE IF EXISTS sites CASCADE;

-- إنشاء الجدول
CREATE TABLE sites (
    id BIGSERIAL PRIMARY KEY,
    site_id TEXT NOT NULL,
    final_site_name TEXT,
    site_owner TEXT,
    site_code TEXT,
    site_type TEXT,
    key_number TEXT,
    long NUMERIC,
    lat NUMERIC,
    governorate TEXT,
    structure TEXT,
    owner_name TEXT,
    owner_contact_number TEXT,
    structure_type TEXT,
    height_m NUMERIC,
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
    rf_optim_status TEXT,
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(site_id, phase_name)
);

-- الفهارس
CREATE INDEX idx_sites_site_id ON sites(site_id);
CREATE INDEX idx_sites_phase_name ON sites(phase_name);
CREATE INDEX idx_sites_governorate ON sites(governorate);
CREATE INDEX idx_sites_tssr_subcon ON sites(tssr_subcon);
CREATE INDEX idx_sites_tssr_overall_status ON sites(tssr_overall_status);
CREATE INDEX idx_sites_ti_status ON sites(ti_status);
CREATE INDEX idx_sites_rf_plan_status ON sites(rf_plan_status);
CREATE INDEX idx_sites_civil_status ON sites(civil_status);
```

---

## ✅ التحقق من النجاح

بعد المزامنة، يجب أن تكون الأرقام متطابقة:

```
📊 Excel rows:    3,769
💾 SQLite sites:  3,769 ✅
☁️  Supabase:      3,769 ✅
```

---

## 🔗 روابط مهمة

- **Supabase Dashboard:** https://supabase.com/dashboard/project/kszdatqbykpodxmnfzfg
- **SQL Editor:** https://supabase.com/dashboard/project/kszdatqbykpodxmnfzfg/sql/new
- **Table Editor:** https://supabase.com/dashboard/project/kszdatqbykpodxmnfzfg/editor

---

*آخر تحديث: 2024-12-30*
