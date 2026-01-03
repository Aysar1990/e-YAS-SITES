# إصلاح مشكلة الاستيراد من Excel

## المشكلة
عملية الاستيراد من صفحة Import لا تحفظ البيانات في قاعدة البيانات

## السبب
جدول `sites` غير موجود في قائمة الجداول المحلية في `DatabaseManager`

## الحل

### الملف: `electron/database/db.js`

#### التعديل 1: دالة prepare() (السطر ~816)

**قبل:**
```javascript
const localOnlyTables = ['settings', 'users', 'phases', 'import_history', 'change_requests', 'audit_logs', 'rejections', 'rejections_log', 'nokia_reviews', 'sites_cache', 'sync_queue', 'sync_conflicts']
```

**بعد:**
```javascript
const localOnlyTables = ['settings', 'users', 'phases', 'import_history', 'change_requests', 'audit_logs', 'rejections', 'rejections_log', 'nokia_reviews', 'sites_cache', 'sync_queue', 'sync_conflicts', 'sites']
```

#### التعديل 2: دالة exec() (السطر ~853)

**قبل:**
```javascript
const localOnlyTables = ['settings', 'users', 'phases', 'import_history', 'change_requests', 'audit_logs', 'rejections', 'rejections_log', 'nokia_reviews', 'sites_cache']
```

**بعد:**
```javascript
const localOnlyTables = ['settings', 'users', 'phases', 'import_history', 'change_requests', 'audit_logs', 'rejections', 'rejections_log', 'nokia_reviews', 'sites_cache', 'sites']
```

## خطوات التطبيق

1. افتح الملف: `electron/database/db.js`
2. اذهب للسطر 816 (في دالة `prepare()`)
3. أضف `'sites'` في نهاية المصفوفة `localOnlyTables`
4. اذهب للسطر 853 (في دالة `exec()`)  
5. أضف `'sites'` في نهاية المصفوفة `localOnlyTables`
6. احفظ الملف
7. أعد تشغيل التطبيق

## التفسير

عند الاستيراد من Excel:
1. يستدعي `importService.uploadSites()` العملية
2. تمر البيانات عبر `processSingleFile()` 
3. تستدعي `db.prepare()` و `db.exec()`
4. إذا كان الجدول في `localOnlyTables` ← يستخدم SQLite مباشرة ✅
5. إذا لم يكن في القائمة ← يحاول استخدام Supabase (يفشل) ❌

بإضافة `'sites'` للقائمة، كل عمليات الاستيراد ستستخدم SQLite مباشرة!
