# 🔄 الانتقال من Excel إلى Database - الخطة الكاملة

## 🎯 الهدف النهائي
تحويل TSSR Monitor من **Excel-Centric** إلى **Database-Centric Application**
- Database = المصدر الأساسي للبيانات
- Excel = Import/Export Format فقط
- التطبيق = المركز الكامل للعمليات

---

## ✅ الإجابة المختصرة: نعم ممكن جداً!

### لكن بشرط واحد مهم:
**استخدام Hybrid Approach** - الجمع بين قوة Database وسهولة Excel

---

## 📊 المقارنة: الوضع الحالي vs المستقبلي

| الميزة | الوضع الحالي (Excel) | الوضع المستقبلي (Database) |
|--------|---------------------|---------------------------|
| **مصدر البيانات** | Excel (.xlsm) 2.8MB | SQLite + Firebase |
| **التحديثات** | يدوي في Excel + Macros | من التطبيق مباشرة |
| **Real-time Collaboration** | ❌ صعب جداً | ✅ مدمج |
| **Performance** | 🐌 بطيء (3,791 sites) | ⚡ سريع جداً |
| **Multi-user** | ❌ مشكلة كبيرة | ✅ بدون مشاكل |
| **Audit Trail** | ⚠️ ActivityLog محدود | ✅ كامل ومفصل |
| **Automation** | ⚠️ VBA Macros فقط | ✅ Workflows قوية |
| **Mobile Access** | ❌ مستحيل | ✅ كامل |
| **Offline Mode** | ✅ ممتاز | ⚠️ ممكن (Service Workers) |
| **Data Analysis** | ✅ ممتاز (Excel) | ⚠️ جيد (Reports) |
| **Backup** | ⚠️ يدوي | ✅ أوتوماتيكي |
| **Scalability** | ❌ محدود جداً | ✅ غير محدود |

---

## 🏗️ البنية المقترحة (Hybrid Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    TSSR Monitor Application                  │
│                  (Electron + React + Firebase)               │
└────────────────┬────────────────────────────────┬────────────┘
                 │                                │
    ┌────────────▼────────────┐      ┌───────────▼────────────┐
    │   Local Database        │      │   Cloud Database       │
    │   (SQLite)              │◄────►│   (Firebase)           │
    │                         │      │                        │
    │   • Fast queries        │      │   • Real-time sync     │
    │   • Offline work        │      │   • Multi-user         │
    │   • Primary source      │      │   • External access    │
    └────────────┬────────────┘      └───────────┬────────────┘
                 │                                │
                 │         ┌──────────────────────┘
                 │         │
    ┌────────────▼─────────▼────────────┐
    │       Excel Files                 │
    │   (Import/Export Only)            │
    │                                   │
    │   • Import: Excel → Database      │
    │   • Export: Database → Excel      │
    │   • Templates for Reports         │
    │   • Legacy data migration         │
    └───────────────────────────────────┘
```

---

## 🎯 خطة التنفيذ (4 مراحل)

---

# المرحلة 1: إعداد Database Schema (أسبوع 1-2)

## 1.1 تصميم Database Schema

### الجداول الرئيسية:

```sql
-- Sites Table (البيانات الأساسية)
CREATE TABLE sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id TEXT UNIQUE NOT NULL,
    final_site_name TEXT,
    site_code TEXT,
    site_type TEXT,
    key_number TEXT,
    
    -- Location
    longitude REAL,
    latitude REAL,
    governorate TEXT,
    
    -- Structure
    structure_type TEXT,
    height REAL,
    part_of TEXT,
    
    -- Ownership
    site_owner TEXT,
    owner_name TEXT,
    owner_contact TEXT,
    
    -- Project Info
    phase_name TEXT,
    priority TEXT,
    cluster TEXT,
    area TEXT,
    weekly_plan TEXT,
    
    -- Technical
    tss_smp TEXT,
    tssr_subcon TEXT,
    new_allocation TEXT,
    tssr_po TEXT,
    
    -- 5G Info
    fiveg_sectors_names TEXT,
    fiveg_solution TEXT,
    site_sectors_num INTEGER,
    ibs_sector TEXT,
    tdd_site TEXT,
    
    -- TSSR Status
    tssr_overall_status TEXT,
    tssr_status_date TEXT,
    tssr_remark TEXT,
    action_age INTEGER,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT 0,
    deleted_at DATETIME,
    deleted_by INTEGER REFERENCES users(id)
);

-- Department Status Tables (TI, RF, Civil, etc.)
CREATE TABLE site_department_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER REFERENCES sites(id),
    department TEXT NOT NULL, -- 'TI', 'RF_PLAN', 'RF_OPTIM', 'CIVIL', 'MW'
    status TEXT,
    comment TEXT,
    cluster_owner TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(site_id, department)
);

-- Nokia Status
CREATE TABLE site_nokia_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER REFERENCES sites(id),
    npo_status TEXT,
    npo_comment TEXT,
    site_owner TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Status Change History (مثل TSSR Status Tracker)
CREATE TABLE status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER REFERENCES sites(id),
    department TEXT,
    previous_status TEXT,
    current_status TEXT,
    change_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    aging_days INTEGER,
    nokia_engineer TEXT,
    action_applied TEXT,
    changed_by INTEGER REFERENCES users(id),
    
    -- Automatic trigger data
    trigger_type TEXT, -- 'MANUAL', 'AUTO_RULE', 'WORKFLOW'
    trigger_id INTEGER
);

-- Activity Log (مثل ActivityLog في Excel)
CREATE TABLE activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'IMPORT', 'EXPORT'
    entity_type TEXT NOT NULL, -- 'SITE', 'USER', 'SETTING', etc.
    entity_id INTEGER,
    user_id INTEGER REFERENCES users(id),
    description TEXT,
    old_value TEXT, -- JSON
    new_value TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rejection Tracking
CREATE TABLE rejections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER REFERENCES sites(id),
    department TEXT,
    reviewer TEXT,
    status TEXT,
    comment TEXT,
    rejection_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Automation Rules (بديل VBA Macros)
CREATE TABLE automation_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT, -- 'STATUS_CHANGE', 'TIME_BASED', 'FIELD_UPDATE'
    trigger_conditions TEXT, -- JSON
    actions TEXT, -- JSON array of actions
    is_active BOOLEAN DEFAULT 1,
    priority INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Workflows (بديل للعمليات اليدوية المتكررة)
CREATE TABLE workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    steps TEXT, -- JSON array of workflow steps
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled Tasks (بديل للـ Macros المجدولة)
CREATE TABLE scheduled_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    task_type TEXT, -- 'BACKUP', 'REPORT', 'SYNC', 'CLEANUP'
    schedule TEXT, -- Cron expression
    last_run DATETIME,
    next_run DATETIME,
    is_active BOOLEAN DEFAULT 1,
    config TEXT -- JSON
);

-- Users & Permissions (موجود بالفعل، نحسّنه)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL, -- 'admin', 'management', 'contractor', 'nokia_engineer'
    contractor_name TEXT,
    email TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Comments System (للتعاون)
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER REFERENCES sites(id),
    user_id INTEGER REFERENCES users(id),
    parent_comment_id INTEGER REFERENCES comments(id),
    comment_text TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Attachments/Documents
CREATE TABLE attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER REFERENCES sites(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    notification_type TEXT,
    title TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT 0,
    action_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Import/Export History
CREATE TABLE import_export_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_type TEXT, -- 'IMPORT', 'EXPORT'
    file_name TEXT,
    file_path TEXT,
    records_count INTEGER,
    success_count INTEGER,
    error_count INTEGER,
    errors_log TEXT, -- JSON
    user_id INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes للأداء:

```sql
-- Essential Indexes
CREATE INDEX idx_sites_site_id ON sites(site_id);
CREATE INDEX idx_sites_governorate ON sites(governorate);
CREATE INDEX idx_sites_phase ON sites(phase_name);
CREATE INDEX idx_sites_status ON sites(tssr_overall_status);
CREATE INDEX idx_sites_contractor ON sites(tssr_subcon);
CREATE INDEX idx_sites_is_deleted ON sites(is_deleted);

CREATE INDEX idx_status_history_site_id ON status_history(site_id);
CREATE INDEX idx_status_history_date ON status_history(change_date);

CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_date ON activity_log(created_at);

CREATE INDEX idx_comments_site ON comments(site_id);
CREATE INDEX idx_comments_user ON comments(user_id);
```

---

## 1.2 Database Triggers (بديل VBA Macros)

```sql
-- Auto-update updated_at timestamp
CREATE TRIGGER update_sites_timestamp 
AFTER UPDATE ON sites
BEGIN
    UPDATE sites SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Auto-log status changes
CREATE TRIGGER log_status_change
AFTER UPDATE ON sites
WHEN OLD.tssr_overall_status != NEW.tssr_overall_status
BEGIN
    INSERT INTO status_history (
        site_id, 
        department, 
        previous_status, 
        current_status, 
        changed_by,
        trigger_type
    ) VALUES (
        NEW.id,
        'OVERALL',
        OLD.tssr_overall_status,
        NEW.tssr_overall_status,
        NEW.updated_by,
        'AUTO_TRIGGER'
    );
END;

-- Auto-log all changes to activity_log
CREATE TRIGGER log_site_update
AFTER UPDATE ON sites
BEGIN
    INSERT INTO activity_log (
        action_type,
        entity_type,
        entity_id,
        user_id,
        description
    ) VALUES (
        'UPDATE',
        'SITE',
        NEW.id,
        NEW.updated_by,
        'Site ' || NEW.site_id || ' updated'
    );
END;

-- Prevent hard delete (enforce soft delete)
CREATE TRIGGER prevent_site_delete
BEFORE DELETE ON sites
BEGIN
    SELECT RAISE(ABORT, 'Direct deletion not allowed. Use soft delete.');
END;

-- Auto-create notification on status change
CREATE TRIGGER notify_status_change
AFTER UPDATE ON sites
WHEN OLD.tssr_overall_status != NEW.tssr_overall_status
BEGIN
    INSERT INTO notifications (
        user_id,
        notification_type,
        title,
        message,
        action_url
    )
    SELECT 
        id,
        'STATUS_CHANGE',
        'Status Changed',
        'Site ' || NEW.site_id || ' status changed to ' || NEW.tssr_overall_status,
        '/sites/' || NEW.id
    FROM users
    WHERE role IN ('admin', 'management');
END;
```

---

# المرحلة 2: Migration من Excel (أسبوع 2-3)

## 2.1 One-Time Migration Script

```javascript
// migration/migrateFromExcel.js

const XLSX = require('xlsx');
const Database = require('better-sqlite3');

async function migrateFromExcel(excelPath, dbPath) {
    console.log('🔄 Starting migration from Excel to Database...');
    
    const db = new Database(dbPath);
    const workbook = XLSX.readFile(excelPath);
    
    // Start transaction
    db.prepare('BEGIN TRANSACTION').run();
    
    try {
        // 1. Migrate Master Sheet (Sites)
        await migrateSites(workbook, db);
        
        // 2. Migrate TSSR Status Tracker
        await migrateStatusHistory(workbook, db);
        
        // 3. Migrate Rejections
        await migrateRejections(workbook, db);
        
        // 4. Migrate Activity Log
        await migrateActivityLog(workbook, db);
        
        // Commit
        db.prepare('COMMIT').run();
        
        console.log('✅ Migration completed successfully!');
        
        // Generate migration report
        generateMigrationReport(db);
        
    } catch (error) {
        db.prepare('ROLLBACK').run();
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

function migrateSites(workbook, db) {
    const sheet = workbook.Sheets['Master'];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Skip header rows (assuming row 3 is header)
    const headers = data[2];
    const rows = data.slice(3);
    
    const insertStmt = db.prepare(`
        INSERT INTO sites (
            site_id, final_site_name, site_code, site_type,
            longitude, latitude, governorate,
            structure_type, height, part_of,
            site_owner, owner_name, owner_contact,
            phase_name, priority, cluster, area,
            tss_smp, tssr_subcon, new_allocation, tssr_po,
            fiveg_sectors_names, fiveg_solution, site_sectors_num,
            tssr_overall_status, tssr_status_date, tssr_remark
        ) VALUES (
            @site_id, @final_site_name, @site_code, @site_type,
            @longitude, @latitude, @governorate,
            @structure_type, @height, @part_of,
            @site_owner, @owner_name, @owner_contact,
            @phase_name, @priority, @cluster, @area,
            @tss_smp, @tssr_subcon, @new_allocation, @tssr_po,
            @fiveg_sectors_names, @fiveg_solution, @site_sectors_num,
            @tssr_overall_status, @tssr_status_date, @tssr_remark
        )
    `);
    
    const insertDeptStatus = db.prepare(`
        INSERT INTO site_department_status (
            site_id, department, status, comment, cluster_owner
        ) VALUES (?, ?, ?, ?, ?)
    `);
    
    let migrated = 0;
    let errors = [];
    
    for (const row of rows) {
        try {
            // Map Excel columns to database fields
            const siteData = mapExcelRowToSite(row, headers);
            
            // Insert site
            const result = insertStmt.run(siteData);
            const siteId = result.lastInsertRowid;
            
            // Insert department statuses
            const departments = ['TI', 'RF_PLAN', 'RF_OPTIM', 'CIVIL', 'MW'];
            departments.forEach(dept => {
                const status = getDepartmentStatus(row, headers, dept);
                if (status) {
                    insertDeptStatus.run(
                        siteId,
                        dept,
                        status.status,
                        status.comment,
                        status.cluster_owner
                    );
                }
            });
            
            migrated++;
            
            if (migrated % 100 === 0) {
                console.log(`   Migrated ${migrated} sites...`);
            }
            
        } catch (error) {
            errors.push({
                row: row[0], // Site ID
                error: error.message
            });
        }
    }
    
    console.log(`✅ Migrated ${migrated} sites`);
    if (errors.length > 0) {
        console.warn(`⚠️  ${errors.length} errors occurred`);
        // Save errors to file
        fs.writeFileSync('migration_errors.json', JSON.stringify(errors, null, 2));
    }
}

function mapExcelRowToSite(row, headers) {
    // Create mapping from Excel column names to database fields
    const columnMap = {
        'Site ID': 'site_id',
        'Final Site Name': 'final_site_name',
        'Site Code': 'site_code',
        'Site Type': 'site_type',
        'Longitude': 'longitude',
        'Latitude': 'latitude',
        'Governorate': 'governorate',
        // ... map all 68 columns
    };
    
    const siteData = {};
    
    headers.forEach((header, index) => {
        const dbField = columnMap[header];
        if (dbField) {
            siteData[dbField] = row[index];
        }
    });
    
    return siteData;
}

function generateMigrationReport(db) {
    const stats = {
        total_sites: db.prepare('SELECT COUNT(*) as count FROM sites').get().count,
        by_status: db.prepare(`
            SELECT tssr_overall_status, COUNT(*) as count 
            FROM sites 
            GROUP BY tssr_overall_status
        `).all(),
        by_governorate: db.prepare(`
            SELECT governorate, COUNT(*) as count 
            FROM sites 
            GROUP BY governorate
        `).all(),
        by_phase: db.prepare(`
            SELECT phase_name, COUNT(*) as count 
            FROM sites 
            GROUP BY phase_name
        `).all()
    };
    
    console.log('\n📊 Migration Report:');
    console.log('Total Sites:', stats.total_sites);
    console.log('\nBy Status:');
    stats.by_status.forEach(s => console.log(`  ${s.tssr_overall_status}: ${s.count}`));
    
    // Save full report
    fs.writeFileSync('migration_report.json', JSON.stringify(stats, null, 2));
}

// Run migration
migrateFromExcel(
    './data/TSSR Tracker Zain Jo 5.xlsm',
    './data/tssr.db'
);
```

---

## 2.2 Validation بعد Migration

```javascript
// migration/validateMigration.js

function validateMigration(excelPath, dbPath) {
    console.log('🔍 Validating migration...');
    
    const workbook = XLSX.readFile(excelPath);
    const db = new Database(dbPath);
    
    const checks = [
        checkRecordCount,
        checkDataIntegrity,
        checkRelationships,
        checkCalculations
    ];
    
    const results = checks.map(check => check(workbook, db));
    
    const allPassed = results.every(r => r.passed);
    
    if (allPassed) {
        console.log('✅ All validation checks passed!');
    } else {
        console.error('❌ Some validation checks failed');
        results.filter(r => !r.passed).forEach(r => {
            console.error(`  ❌ ${r.name}: ${r.message}`);
        });
    }
    
    return allPassed;
}

function checkRecordCount(workbook, db) {
    const excelCount = XLSX.utils.sheet_to_json(
        workbook.Sheets['Master']
    ).length - 2; // Minus headers
    
    const dbCount = db.prepare('SELECT COUNT(*) as count FROM sites').get().count;
    
    return {
        name: 'Record Count',
        passed: excelCount === dbCount,
        message: `Excel: ${excelCount}, DB: ${dbCount}`
    };
}
```

---

# المرحلة 3: تحويل VBA Macros إلى Automation (أسبوع 3-4)

## 3.1 تحليل Macros الموجودة

أولاً نحتاج تحليل الـ VBA Macros في ملف Excel:

```vbscript
' من ملف Excel الأصلي - نحتاج نستخرجها ونفهم وظائفها

' Example Macros (افتراضية):
' 1. Auto-update TSSR Status based on department approvals
' 2. Calculate Action Age
' 3. Send notifications on status change
' 4. Auto-backup on save
' 5. Validate data entry
```

## 3.2 تحويلها إلى Automation Rules

```javascript
// automation/rules.js

const automationRules = [
    {
        id: 1,
        name: 'Auto-Approve TSSR',
        description: 'Automatically approve TSSR when all departments approve',
        trigger_type: 'FIELD_UPDATE',
        trigger_conditions: {
            watch_tables: ['site_department_status'],
            conditions: {
                all: [
                    { field: 'TI.status', operator: 'equals', value: 'Approved' },
                    { field: 'RF_PLAN.status', operator: 'equals', value: 'Approved' },
                    { field: 'RF_OPTIM.status', operator: 'equals', value: 'Approved' },
                    { field: 'CIVIL.status', operator: 'equals', value: 'Approved' }
                ]
            }
        },
        actions: [
            {
                type: 'UPDATE_FIELD',
                table: 'sites',
                field: 'tssr_overall_status',
                value: 'Approved'
            },
            {
                type: 'UPDATE_FIELD',
                table: 'sites',
                field: 'tssr_status_date',
                value: 'CURRENT_TIMESTAMP'
            },
            {
                type: 'SEND_NOTIFICATION',
                recipients: ['management', 'nokia_engineer'],
                template: 'tssr_approved',
                data: {
                    site_id: '{{site_id}}',
                    site_name: '{{final_site_name}}'
                }
            },
            {
                type: 'LOG_ACTIVITY',
                message: 'TSSR auto-approved - all departments approved'
            }
        ],
        is_active: true,
        priority: 10
    },
    
    {
        id: 2,
        name: 'Calculate Action Age',
        description: 'Auto-calculate days since last status change',
        trigger_type: 'TIME_BASED',
        schedule: '0 0 * * *', // Daily at midnight
        trigger_conditions: {
            all_sites: true
        },
        actions: [
            {
                type: 'EXECUTE_QUERY',
                query: `
                    UPDATE sites 
                    SET action_age = JULIANDAY('now') - JULIANDAY(tssr_status_date)
                    WHERE tssr_status_date IS NOT NULL
                `
            }
        ],
        is_active: true
    },
    
    {
        id: 3,
        name: 'Alert on Aging Sites',
        description: 'Send alert for sites pending > 14 days',
        trigger_type: 'TIME_BASED',
        schedule: '0 9 * * 1', // Every Monday at 9 AM
        trigger_conditions: {
            query: `
                SELECT * FROM sites 
                WHERE action_age > 14 
                AND tssr_overall_status NOT IN ('Approved', 'Rejected')
            `
        },
        actions: [
            {
                type: 'SEND_NOTIFICATION',
                recipients: ['management'],
                template: 'aging_sites_alert',
                data: {
                    sites: '{{query_results}}'
                }
            }
        ],
        is_active: true
    },
    
    {
        id: 4,
        name: 'Auto-Backup Database',
        description: 'Create daily backup',
        trigger_type: 'TIME_BASED',
        schedule: '0 2 * * *', // Daily at 2 AM
        trigger_conditions: {},
        actions: [
            {
                type: 'CREATE_BACKUP',
                description: 'Scheduled daily backup'
            },
            {
                type: 'CLEANUP_OLD_BACKUPS',
                keep_days: 30
            }
        ],
        is_active: true
    }
];

// Automation Engine
class AutomationEngine {
    constructor(db) {
        this.db = db;
        this.rules = this.loadRules();
    }
    
    loadRules() {
        return this.db.prepare(`
            SELECT * FROM automation_rules 
            WHERE is_active = 1 
            ORDER BY priority DESC
        `).all();
    }
    
    // Execute rule when triggered
    async executeRule(rule, context = {}) {
        console.log(`⚡ Executing rule: ${rule.name}`);
        
        const conditions = JSON.parse(rule.trigger_conditions);
        const actions = JSON.parse(rule.actions);
        
        // Check if conditions met
        if (!this.checkConditions(conditions, context)) {
            return { executed: false, reason: 'Conditions not met' };
        }
        
        // Execute actions
        const results = [];
        for (const action of actions) {
            const result = await this.executeAction(action, context);
            results.push(result);
        }
        
        // Log execution
        this.logRuleExecution(rule, results);
        
        return { executed: true, results };
    }
    
    async executeAction(action, context) {
        switch (action.type) {
            case 'UPDATE_FIELD':
                return this.updateField(action, context);
            
            case 'SEND_NOTIFICATION':
                return this.sendNotification(action, context);
            
            case 'LOG_ACTIVITY':
                return this.logActivity(action, context);
            
            case 'EXECUTE_QUERY':
                return this.executeQuery(action);
            
            case 'CREATE_BACKUP':
                return this.createBackup(action);
            
            default:
                throw new Error(`Unknown action type: ${action.type}`);
        }
    }
    
    updateField(action, context) {
        const { table, field, value } = action;
        const actualValue = this.resolveValue(value, context);
        
        const stmt = this.db.prepare(`
            UPDATE ${table} 
            SET ${field} = ? 
            WHERE id = ?
        `);
        
        return stmt.run(actualValue, context.site_id);
    }
    
    sendNotification(action, context) {
        const { recipients, template, data } = action;
        
        // Resolve template data
        const resolvedData = this.resolveTemplateData(data, context);
        
        // Get recipient user IDs
        const users = this.db.prepare(`
            SELECT id FROM users 
            WHERE role IN (${recipients.map(() => '?').join(',')})
        `).all(...recipients);
        
        // Create notifications
        const stmt = this.db.prepare(`
            INSERT INTO notifications (
                user_id, notification_type, title, message, action_url
            ) VALUES (?, ?, ?, ?, ?)
        `);
        
        users.forEach(user => {
            stmt.run(
                user.id,
                template,
                resolvedData.title,
                resolvedData.message,
                resolvedData.action_url
            );
        });
        
        return { sent: users.length };
    }
}

// Initialize automation engine
const engine = new AutomationEngine(db);

// Set up listeners for triggers
db.on('update', (table, rowid) => {
    const relevantRules = engine.rules.filter(r => 
        r.trigger_type === 'FIELD_UPDATE' &&
        JSON.parse(r.trigger_conditions).watch_tables?.includes(table)
    );
    
    relevantRules.forEach(rule => {
        engine.executeRule(rule, { table, rowid });
    });
});

// Set up cron jobs for time-based rules
const cron = require('node-cron');

engine.rules
    .filter(r => r.trigger_type === 'TIME_BASED')
    .forEach(rule => {
        const schedule = JSON.parse(rule.trigger_conditions).schedule || rule.schedule;
        cron.schedule(schedule, () => {
            engine.executeRule(rule);
        });
    });
```

---

# المرحلة 4: إنشاء Import/Export System (أسبوع 4-5)

## 4.1 Import من Excel

```javascript
// features/import/ImportFromExcel.jsx

import React, { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ImportFromExcel = () => {
    const [file, setFile] = useState(null);
    const [step, setStep] = useState('upload'); // upload, preview, importing, complete
    const [preview, setPreview] = useState(null);
    const [importResults, setImportResults] = useState(null);
    
    const handleFileSelect = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        
        setFile(selectedFile);
        setStep('parsing');
        
        // Parse Excel file
        const result = await window.electron.parseExcelForImport(selectedFile.path);
        
        if (result.success) {
            setPreview(result.preview);
            setStep('preview');
        } else {
            alert('Error parsing Excel file: ' + result.error);
            setStep('upload');
        }
    };
    
    const handleImport = async (options) => {
        setStep('importing');
        
        const result = await window.electron.importFromExcel({
            filePath: file.path,
            options: {
                mode: options.mode, // 'insert', 'update', 'upsert'
                conflictResolution: options.conflictResolution, // 'skip', 'overwrite', 'merge'
                validateData: true,
                createBackup: true
            }
        });
        
        setImportResults(result);
        setStep('complete');
    };
    
    return (
        <div className="import-excel">
            {step === 'upload' && (
                <div className="upload-zone">
                    <Upload size={48} />
                    <h3>Import Sites from Excel</h3>
                    <p>Select an Excel file (.xlsx, .xlsm) to import</p>
                    <input 
                        type="file" 
                        accept=".xlsx,.xlsm" 
                        onChange={handleFileSelect} 
                    />
                </div>
            )}
            
            {step === 'preview' && (
                <PreviewStep 
                    preview={preview} 
                    onImport={handleImport}
                    onCancel={() => setStep('upload')}
                />
            )}
            
            {step === 'importing' && (
                <ImportingStep />
            )}
            
            {step === 'complete' && (
                <ResultsStep results={importResults} />
            )}
        </div>
    );
};

const PreviewStep = ({ preview, onImport, onCancel }) => {
    const [options, setOptions] = useState({
        mode: 'upsert',
        conflictResolution: 'merge'
    });
    
    return (
        <div className="preview-step">
            <h3>Preview Import Data</h3>
            
            <div className="stats">
                <div className="stat-card">
                    <Info size={20} />
                    <div>
                        <span className="label">Total Rows</span>
                        <span className="value">{preview.totalRows}</span>
                    </div>
                </div>
                
                <div className="stat-card">
                    <CheckCircle size={20} />
                    <div>
                        <span className="label">New Sites</span>
                        <span className="value">{preview.newSites}</span>
                    </div>
                </div>
                
                <div className="stat-card">
                    <AlertCircle size={20} />
                    <div>
                        <span className="label">Updates</span>
                        <span className="value">{preview.existingSites}</span>
                    </div>
                </div>
                
                {preview.errors.length > 0 && (
                    <div className="stat-card error">
                        <AlertCircle size={20} />
                        <div>
                            <span className="label">Errors</span>
                            <span className="value">{preview.errors.length}</span>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="options">
                <h4>Import Options</h4>
                
                <label>
                    <span>Import Mode:</span>
                    <select 
                        value={options.mode}
                        onChange={e => setOptions({...options, mode: e.target.value})}
                    >
                        <option value="insert">Insert New Only</option>
                        <option value="update">Update Existing Only</option>
                        <option value="upsert">Insert + Update (Recommended)</option>
                    </select>
                </label>
                
                <label>
                    <span>If Conflict:</span>
                    <select 
                        value={options.conflictResolution}
                        onChange={e => setOptions({...options, conflictResolution: e.target.value})}
                    >
                        <option value="skip">Skip (Keep Database Version)</option>
                        <option value="overwrite">Overwrite (Use Excel Version)</option>
                        <option value="merge">Merge (Combine Both)</option>
                    </select>
                </label>
            </div>
            
            <div className="preview-table">
                <h4>Sample Data (First 10 Rows)</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Site ID</th>
                            <th>Site Name</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {preview.sampleRows.map((row, i) => (
                            <tr key={i}>
                                <td>{row.site_id}</td>
                                <td>{row.final_site_name}</td>
                                <td>{row.tssr_overall_status}</td>
                                <td>
                                    {row.isNew ? (
                                        <span className="badge new">New</span>
                                    ) : (
                                        <span className="badge update">Update</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {preview.errors.length > 0 && (
                <div className="errors-section">
                    <h4>Validation Errors</h4>
                    <ul>
                        {preview.errors.slice(0, 10).map((error, i) => (
                            <li key={i}>
                                Row {error.row}: {error.message}
                            </li>
                        ))}
                    </ul>
                    {preview.errors.length > 10 && (
                        <p>... and {preview.errors.length - 10} more errors</p>
                    )}
                </div>
            )}
            
            <div className="actions">
                <button onClick={onCancel} className="btn-secondary">
                    Cancel
                </button>
                <button 
                    onClick={() => onImport(options)} 
                    className="btn-primary"
                    disabled={preview.errors.length > 0}
                >
                    Import {preview.totalRows} Sites
                </button>
            </div>
        </div>
    );
};
```

## 4.2 Export إلى Excel

```javascript
// features/export/ExportToExcel.jsx

const ExportToExcel = ({ sites, options = {} }) => {
    const [exporting, setExporting] = useState(false);
    const [template, setTemplate] = useState('standard'); // standard, custom, dashboard
    
    const handleExport = async () => {
        setExporting(true);
        
        try {
            const result = await window.electron.exportToExcel({
                sites,
                template,
                options: {
                    includeFormulas: true,
                    includeFormatting: true,
                    includeMacros: false, // لن نحتاجها بعد الآن
                    includeCharts: template === 'dashboard',
                    ...options
                }
            });
            
            if (result.success) {
                // Open file or show download dialog
                window.electron.openFile(result.filePath);
            }
        } catch (error) {
            alert('Export failed: ' + error.message);
        } finally {
            setExporting(false);
        }
    };
    
    return (
        <button onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export to Excel'}
        </button>
    );
};

// Backend: electron/handlers/exportToExcel.js

async function exportToExcel({ sites, template, options }) {
    const XLSX = require('xlsx');
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Add Master sheet
    const masterData = sites.map(site => ({
        'Site ID': site.site_id,
        'Final Site Name': site.final_site_name,
        'Site Code': site.site_code,
        // ... map all 68 columns
    }));
    
    const masterSheet = XLSX.utils.json_to_sheet(masterData);
    
    // Apply formatting
    if (options.includeFormatting) {
        applyFormatting(masterSheet);
    }
    
    // Add formulas
    if (options.includeFormulas) {
        addFormulas(masterSheet, sites);
    }
    
    XLSX.utils.book_append_sheet(workbook, masterSheet, 'Master');
    
    // Add Dashboard sheet if requested
    if (template === 'dashboard') {
        const dashboardSheet = createDashboardSheet(sites);
        XLSX.utils.book_append_sheet(workbook, dashboardSheet, 'Dashboard');
    }
    
    // Add TSSR Status Tracker
    const statusHistory = await getStatusHistory(sites.map(s => s.id));
    const trackerSheet = XLSX.utils.json_to_sheet(statusHistory);
    XLSX.utils.book_append_sheet(workbook, trackerSheet, 'TSSR Status Tracker');
    
    // Save file
    const fileName = `TSSR_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filePath = path.join(app.getPath('downloads'), fileName);
    
    XLSX.writeFile(workbook, filePath);
    
    // Log export
    await logExport(sites.length, filePath);
    
    return { success: true, filePath, fileName };
}

function applyFormatting(sheet) {
    // Apply colors, borders, fonts
    const range = XLSX.utils.decode_range(sheet['!ref']);
    
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = { c: C, r: R };
            const cell_ref = XLSX.utils.encode_cell(cell_address);
            
            if (!sheet[cell_ref]) continue;
            
            // Header row
            if (R === 0) {
                sheet[cell_ref].s = {
                    font: { bold: true, color: { rgb: 'FFFFFF' } },
                    fill: { fgColor: { rgb: 'FF8566' } },
                    alignment: { horizontal: 'center' }
                };
            }
            
            // Status column - conditional formatting
            if (C === getColumnIndex('TSSR Overall Status')) {
                const status = sheet[cell_ref].v;
                sheet[cell_ref].s = {
                    fill: { fgColor: { rgb: getStatusColor(status) } }
                };
            }
        }
    }
}

function addFormulas(sheet, sites) {
    // Example: Add formula for Action Age calculation
    const ageColumn = getColumnIndex('Action Age');
    const dateColumn = getColumnIndex('TSSR Status Date');
    
    for (let i = 1; i <= sites.length; i++) {
        const cell_ref = XLSX.utils.encode_cell({ r: i, c: ageColumn });
        const date_ref = XLSX.utils.encode_cell({ r: i, c: dateColumn });
        
        sheet[cell_ref] = {
            f: `IF(${date_ref}="","",TODAY()-${date_ref})`
        };
    }
}
```

---

# المرحلة 5: إنشاء Admin Interface (أسبوع 5-6)

## 5.1 Database Management Page

```javascript
// pages/Admin/DatabaseManagement.jsx

const DatabaseManagement = () => {
    return (
        <div className="database-management">
            <h1>Database Management</h1>
            
            <section className="db-stats">
                <h2>Database Statistics</h2>
                <DatabaseStats />
            </section>
            
            <section className="db-tools">
                <h2>Tools</h2>
                
                <div className="tools-grid">
                    <ToolCard
                        icon={<Database />}
                        title="Optimize Database"
                        description="Vacuum, reindex, and optimize"
                        action={optimizeDatabase}
                    />
                    
                    <ToolCard
                        icon={<FileUp />}
                        title="Import from Excel"
                        description="Import sites from Excel file"
                        action={() => navigate('/import')}
                    />
                    
                    <ToolCard
                        icon={<FileDown />}
                        title="Export to Excel"
                        description="Export all data to Excel"
                        action={exportToExcel}
                    />
                    
                    <ToolCard
                        icon={<Trash2 />}
                        title="Cleanup"
                        description="Remove soft-deleted records"
                        action={cleanupDatabase}
                    />
                </div>
            </section>
            
            <section className="automation">
                <h2>Automation Rules</h2>
                <AutomationRulesList />
            </section>
        </div>
    );
};
```

---

# الخلاصة النهائية

## ✅ نعم، يمكنك الاستغناء عن Excel كمصدر أساسي!

### المزايا الكبرى:
1. ⚡ **أداء أفضل بكثير** - لا حاجة لقراءة 2.8MB في كل مرة
2. 👥 **تعاون حقيقي** - عدة مستخدمين في نفس الوقت
3. 🤖 **Automation أقوى** - قواعد وworkflows معقدة
4. 📱 **Mobile-ready** - الوصول من أي مكان
5. 🔒 **أمان أفضل** - التحكم الكامل في الصلاحيات
6. 📊 **تقارير أفضل** - Analytics متقدمة
7. 💾 **Backup تلقائي** - لا تخاف من فقدان البيانات
8. 🔄 **Real-time sync** - Firebase للتعاون

### Excel يبقى موجود لكن كـ:
- ✅ Import format (استيراد بيانات جديدة)
- ✅ Export format (تصدير للتحليل الخارجي)
- ✅ Report template (تقارير للطباعة)
- ✅ Legacy support (التوافق مع الأنظمة القديمة)

### الـ Migration Path:
1. **أسبوع 1-2:** إعداد Database Schema
2. **أسبوع 2-3:** Migration من Excel مرة واحدة
3. **أسبوع 3-4:** تحويل VBA Macros إلى Automation
4. **أسبوع 4-5:** إنشاء Import/Export System
5. **أسبوع 5-6:** Testing والتدريب

### التوصية:
**نعم، انتقل للـ Database-first approach!**
لكن احتفظ بـ Excel كـ:
- 📤 Export format للمستخدمين المعتادين عليه
- 📥 Import format للبيانات الجديدة
- 📊 Analysis tool للتحليلات المعقدة

**Best of both worlds!** 🚀
