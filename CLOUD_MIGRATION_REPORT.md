# TSSR Monitor - Cloud Migration Analysis Report
# تقرير تحليل التحويل للـ Cloud

**تاريخ التقرير:** 2025-12-31
**المشروع:** TSSR Monitor (e-YAS SITES)
**الهدف:** نشر التطبيق على Cloud (Vercel + Render + Supabase)

---

## 1. ملخص تنفيذي

| البند | القيمة |
|-------|--------|
| **حالة المشروع** | جاهز للتحويل بنسبة 70% |
| **الجهد المتوقع** | متوسط (2-3 ساعات عمل) |
| **المخاطر** | منخفضة - البنية التحتية موجودة |
| **Supabase Project ID** | `kszdatqbykpodxmnfzfg` |

### الخطة المقترحة:
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│   Render    │────▶│  Supabase   │
│  (Frontend) │     │  (Backend)  │     │ (Database)  │
│   React     │     │  Express    │     │  PostgreSQL │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 2. تحليل البنية الحالية

### 2.1 هيكل المشروع
```
tssr-app/
│
├── 📁 electron/                    [BACKEND - سيُنقل لـ Render]
│   ├── standaloneServer.js         ✅ Server مستقل موجود
│   ├── 📁 server/
│   │   ├── apiServer.js            ✅ Express server
│   │   ├── websocket.js            ✅ WebSocket server
│   │   ├── websocketServer.js      ✅ WS implementation
│   │   ├── 📁 routes/
│   │   │   ├── auth.js             ✅ Authentication routes
│   │   │   ├── sites.js            ⚠️ يستخدم sites_cache
│   │   │   ├── users.js            ✅ User management
│   │   │   ├── stats.js            ⚠️ SQL queries مباشرة
│   │   │   ├── contractors.js      ⚠️ SQL queries مباشرة
│   │   │   ├── nokiaReviews.js     ✅ Nokia reviews
│   │   │   ├── auditLogs.js        ✅ Audit logging
│   │   │   └── backup.js           ❌ خاص بـ SQLite
│   │   ├── 📁 middleware/
│   │   │   └── auth.js             ✅ JWT middleware
│   │   └── 📁 utils/
│   │       ├── validation.js       ✅ Input validation
│   │       ├── rateLimiter.js      ✅ Rate limiting
│   │       └── wsEvents.js         ✅ WS event types
│   │
│   ├── 📁 database/
│   │   ├── db.js                   ✅ Adapter pattern موجود
│   │   ├── schema.sql              ✅ Database schema
│   │   ├── 📁 adapters/
│   │   │   ├── baseAdapter.js      ✅ Base class
│   │   │   ├── sqliteAdapter.js    ❌ سيُحذف
│   │   │   └── supabaseAdapter.js  ✅ Supabase ready
│   │   ├── 📁 migrations/          ⚠️ SQLite migrations
│   │   └── 📁 supabase-migrations/ ✅ Supabase migrations
│   │
│   └── 📁 services/
│       ├── supabaseSync.js         ⚠️ يحتاج تعديل
│       ├── realtimeSync.js         ✅ يدعم Supabase Realtime
│       ├── excelReader.js          ✅ Excel parsing
│       ├── batchProcessor.js       ✅ Batch operations
│       └── calculations/           ✅ Business logic
│
├── 📁 src/                         [FRONTEND - سيُنشر على Vercel]
│   ├── 📁 services/
│   │   ├── api.js                  ⚠️ يحتاج تعديل URL
│   │   ├── apiClient.js            ✅ يدعم domains
│   │   └── importService.js        ✅ Import logic
│   ├── 📁 context/
│   │   └── AuthContext.jsx         ⚠️ يفحص Electron
│   ├── 📁 pages/                   ✅ React pages
│   ├── 📁 components/              ✅ React components
│   └── 📁 hooks/                   ✅ Custom hooks
│
├── vite.config.js                  ✅ Vite configured
├── package.json                    ⚠️ يحتاج تعديل scripts
├── .env                            ✅ Supabase configured
└── index.html                      ✅ Entry point
```

### 2.2 التقنيات المستخدمة

| الطبقة | التقنية الحالية | التقنية المستهدفة |
|--------|-----------------|-------------------|
| **Frontend** | React 18 + Vite | React 18 + Vite (Vercel) |
| **Backend** | Express.js (Electron) | Express.js (Render) |
| **Database** | SQLite + Supabase | Supabase فقط |
| **Real-time** | WebSocket | Supabase Realtime |
| **Auth** | JWT | JWT (نفسه) |
| **File Storage** | Local | Supabase Storage (اختياري) |

---

## 3. تحليل API Endpoints

### 3.1 قائمة كاملة بالـ Endpoints

```
┌────────────────────────────────────────────────────────────────┐
│                     PUBLIC ENDPOINTS                           │
├────────────────────────────────────────────────────────────────┤
│ GET  /api/health              → Health check                   │
│ POST /api/login               → User login                     │
│ POST /api/auth/login          → Alternative login              │
│ GET  /api/server/info         → Server information             │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│                   PROTECTED ENDPOINTS                          │
├────────────────────────────────────────────────────────────────┤
│ GET  /api/auth/verify         → Verify JWT token               │
│                                                                │
│ GET  /api/sites               → Get all sites (filtered)       │
│ GET  /api/sites/:siteId       → Get single site                │
│ PUT  /api/sites/:siteId       → Update site                    │
│                                                                │
│ GET  /api/phases              → Get all phases                 │
│                                                                │
│ GET  /api/stats               → Get statistics                 │
│ GET  /api/stats/breakdown     → Stats by part_of               │
│ GET  /api/stats/overview      → Overview table                 │
│                                                                │
│ GET  /api/contractors         → Get contractors list           │
│ GET  /api/contractors/detailed → Detailed contractor stats     │
│ GET  /api/contractors/:name/stats → Single contractor stats    │
│                                                                │
│ GET  /api/users               → Get all users (admin)          │
│ POST /api/users               → Create user (admin)            │
│ DELETE /api/users/:id         → Delete user (admin)            │
│                                                                │
│ GET  /api/nokia-reviews       → Get Nokia reviews              │
│ POST /api/nokia-reviews       → Create/Update review           │
│                                                                │
│ GET  /api/ghirbal-sites       → Get Ghirbal sites              │
│ GET  /api/checked-sites       → Get checked sites              │
│                                                                │
│ GET  /api/audit-logs          → Get audit logs                 │
│                                                                │
│ GET  /api/settings            → Get app settings               │
│                                                                │
│ GET  /api/backups             → List backups (SQLite only)     │
│ POST /api/backups             → Create backup (SQLite only)    │
└────────────────────────────────────────────────────────────────┘
```

### 3.2 تحليل كل Route

| Route File | الحالة | التعديلات المطلوبة |
|------------|--------|-------------------|
| `routes/auth.js` | ✅ جاهز | لا تعديلات |
| `routes/users.js` | ✅ جاهز | لا تعديلات |
| `routes/sites.js` | ⚠️ يحتاج تعديل | تغيير `sites_cache` → `sites` |
| `routes/stats.js` | ⚠️ يحتاج تعديل | تحويل SQL → Supabase |
| `routes/contractors.js` | ⚠️ يحتاج تعديل | تحويل SQL → Supabase |
| `routes/nokiaReviews.js` | ✅ جاهز | لا تعديلات |
| `routes/auditLogs.js` | ✅ جاهز | لا تعديلات |
| `routes/backup.js` | ❌ سيُحذف | خاص بـ SQLite |

---

## 4. تحليل قاعدة البيانات

### 4.1 Schema الحالي (71 عمود للـ sites)

```sql
-- Main Sites Table
CREATE TABLE sites (
    id INTEGER PRIMARY KEY,
    site_id TEXT NOT NULL,
    phase_name TEXT,

    -- Site Information (15 columns)
    final_site_name TEXT,
    site_owner TEXT,
    site_code TEXT,
    site_type TEXT,
    key_number TEXT,
    longitude REAL,
    latitude REAL,
    governorate TEXT,
    structure TEXT,
    owner_name TEXT,
    owner_contact_number TEXT,
    structure_type TEXT,
    height_m REAL,
    part_of TEXT,

    -- Planning (15 columns)
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

    -- Department Status (20 columns)
    nokia_npo_status TEXT,
    nokia_npo_comment TEXT,
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
    cluster_owner_mw TEXT,
    rec_cab_swap TEXT,
    spoc_readiness TEXT,
    version TEXT,
    spoc_status TEXT,

    -- TSSR Status (15 columns)
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

    -- Timestamps
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(site_id, phase_name)
);

-- Supporting Tables
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    contractor_name TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments (
    id INTEGER PRIMARY KEY,
    site_id TEXT NOT NULL,
    user_id INTEGER,
    username TEXT,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY,
    action TEXT,
    site_id TEXT,
    user_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE sync_log (
    id INTEGER PRIMARY KEY,
    sync_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT,
    records_synced INTEGER DEFAULT 0,
    source TEXT,
    error_message TEXT,
    duration_ms INTEGER
);
```

### 4.2 Supabase Migration Required

```sql
-- يجب تنفيذ هذا في Supabase Dashboard

-- 1. Sites Table (إذا لم يكن موجوداً)
-- (نفس schema أعلاه مع تعديلات PostgreSQL)

-- 2. Users Table
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

-- 3. Enable RLS
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for service role
CREATE POLICY "Service role full access" ON sites FOR ALL USING (true);
CREATE POLICY "Service role full access" ON users FOR ALL USING (true);

-- 5. Indexes
CREATE INDEX idx_sites_site_id ON sites(site_id);
CREATE INDEX idx_sites_phase_name ON sites(phase_name);
CREATE INDEX idx_sites_tssr_subcon ON sites(tssr_subcon);
CREATE INDEX idx_users_username ON users(username);
```

---

## 5. تحليل Frontend

### 5.1 ملفات تحتاج تعديل

| الملف | المشكلة | الحل |
|-------|---------|------|
| `src/services/api.js:3` | `localhost:3001` hardcoded | استخدام `VITE_API_URL` |
| `src/services/apiClient.js:57` | Port hardcoded | إزالة port logic للـ domains |
| `src/context/AuthContext.jsx:6` | `window.electron` check | إزالة Electron checks |

### 5.2 Environment Variables المطلوبة

```env
# Frontend (.env.production)
VITE_API_URL=https://tssr-api.onrender.com/api
VITE_WS_URL=wss://tssr-api.onrender.com/ws
VITE_APP_NAME=TSSR Monitor
VITE_APP_VERSION=1.0.0
```

---

## 6. الملفات المطلوب إنشاؤها

### 6.1 للـ Backend (Render)

```
📁 server/                    [مجلد جديد لـ Render]
├── index.js                  ← Entry point
├── package.json              ← Dependencies
├── .env.example              ← Environment template
└── render.yaml               ← Render configuration
```

### 6.2 للـ Frontend (Vercel)

```
📁 root/
├── vercel.json               ← Vercel configuration
├── .env.production           ← Production environment
└── .env.example              ← Environment template
```

---

## 7. خطة التنفيذ المقترحة

### المرحلة 2: تعديل Backend (60 دقيقة)

```
الخطوة 2.1: إنشاء server/index.js
├── نسخ logic من standaloneServer.js
├── إزالة SQLite dependencies
└── تفعيل Supabase only mode

الخطوة 2.2: تعديل Routes
├── sites.js: sites_cache → sites
├── stats.js: SQL → Supabase queries
└── contractors.js: SQL → Supabase queries

الخطوة 2.3: إنشاء ملفات النشر
├── render.yaml
├── package.json (server only)
└── .env.example
```

### المرحلة 3: تعديل Frontend (30 دقيقة)

```
الخطوة 3.1: تعديل API connections
├── api.js: dynamic API_URL
├── apiClient.js: remove port logic
└── AuthContext.jsx: remove Electron checks

الخطوة 3.2: إنشاء ملفات النشر
├── vercel.json
├── .env.production
└── build script verification
```

### المرحلة 4: النشر والاختبار (30 دقيقة)

```
الخطوة 4.1: نشر Backend على Render
├── إنشاء Web Service
├── إضافة Environment Variables
└── اختبار API endpoints

الخطوة 4.2: نشر Frontend على Vercel
├── ربط GitHub repository
├── إضافة Environment Variables
└── اختبار التطبيق
```

---

## 8. المخاطر والتخفيف

| المخاطرة | الاحتمال | التأثير | التخفيف |
|----------|----------|---------|---------|
| فقدان البيانات | منخفض | عالي | Backup قبل التحويل |
| توقف الخدمة | متوسط | متوسط | نشر تدريجي |
| مشاكل CORS | متوسط | منخفض | تكوين صحيح |
| WebSocket issues | متوسط | متوسط | استخدام Supabase Realtime |

---

## 9. Supabase Configuration الحالي

```javascript
// .env (موجود)
SUPABASE_URL=https://kszdatqbykpodxmnfzfg.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_TYPE=supabase
```

### الجداول في Supabase (للتأكيد):
- [ ] `sites` - جدول المواقع الرئيسي
- [ ] `users` - جدول المستخدمين
- [ ] `comments` - التعليقات
- [ ] `activity_log` - سجل النشاط
- [ ] `settings` - الإعدادات

---

## 10. الخلاصة والتوصيات

### نقاط القوة:
1. ✅ Supabase adapter موجود ومختبر
2. ✅ Standalone server يعمل بدون Electron
3. ✅ CORS مُفعّل
4. ✅ JWT authentication جاهز
5. ✅ API client يدعم domains

### نقاط تحتاج عمل:
1. ⚠️ بعض routes تستخدم SQL مباشرة
2. ⚠️ Frontend يفحص Electron
3. ⚠️ WebSocket يحتاج تكييف للـ cloud

### التوصية:
**البدء فوراً بالمرحلة 2** - المشروع جاهز بنسبة عالية والتعديلات المطلوبة محدودة.

---

## 11. الملحقات

### 11.1 قائمة الـ Dependencies المطلوبة للـ Backend

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.89.0",
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "express": "^5.2.1",
    "jsonwebtoken": "^9.0.3",
    "ws": "^8.18.3",
    "exceljs": "^4.4.0"
  }
}
```

### 11.2 Render.yaml Template

```yaml
services:
  - type: web
    name: tssr-api
    env: node
    buildCommand: npm install
    startCommand: node index.js
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: NODE_ENV
        value: production
```

### 11.3 Vercel.json Template

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

**نهاية التقرير**

*تم إنشاء هذا التقرير بواسطة Claude Code*
*التاريخ: 2025-12-31*
