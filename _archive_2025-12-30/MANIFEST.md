# Archive Manifest
## Date: 2025-12-30
## Project: TSSR Monitor / e-YAS SITES

---

## Summary

| Category | Files Moved |
|----------|-------------|
| Backup Configs | 8 |
| Deprecated Code | 1 |
| Temp/Debug Files | 16 |
| Old Docs | 8 |
| **Total** | **33** |

---

## Files Moved

### backup_configs/ (8 files)

| File | Original Location | Reason |
|------|-------------------|--------|
| EditSiteModal.jsx.backup | src/components/EditSiteModal/ | Backup file |
| AdminDashboard.jsx.backup | src/pages/Admin/ | Backup file |
| index.jsx.backup | src/pages/Admin/Settings/ | Backup file |
| Sites.jsx.backup | src/pages/Admin/ | Backup file |
| FormattingRules.jsx.backup | src/pages/Admin/SpreadsheetView/components/ | Backup file |
| SpreadsheetView.jsx.backup | src/pages/Admin/SpreadsheetView/ | Backup file |
| ManagementReports.jsx.backup | src/pages/Management/ | Backup file |
| NokiaDashboard.jsx.backup | src/pages/Nokia/ | Backup file |

### deprecated_code/ (1 file)

| File | Original Location | Reason |
|------|-------------------|--------|
| tssr_old.db | data/ | Old database backup |

### temp_files/ (16 files)

| File | Original Location | Reason |
|------|-------------------|--------|
| CHECK_DATABASE.bat | root | Debug script |
| CHECK_DATA_SOURCE.bat | root | Debug script |
| CHECK_REALTIME.bat | root | Debug script |
| CHECK_SUPABASE_COLUMNS.bat | root | Debug script |
| COMPARE_DB_COLUMNS.bat | root | Debug script |
| DELETE_SQLITE.bat | root | Debug script |
| DIAGNOSTIC.bat | root | Debug script |
| FIX_DATABASE.bat | root | Debug script |
| TEST_START.bat | root | Test script |
| TEST_IMPORT.bat | root | Test script |
| FRESH_START.bat | root | Debug script |
| REINSTALL_ALL.bat | root | Debug script |
| COPY_LOGO.ps1 | root | Utility script |
| columnDefinitions.js | root | Temp file |
| quick-check.js | root | Temp file |
| update-admin.js | root | Temp file |

### old_docs/ (8 files)

| File | Original Location | Reason |
|------|-------------------|--------|
| fiاااااles.zip | root | Unused archive |
| fiتانles.zip | root | Unused archive |
| استراتيجية_قاعدة_البيانات.md | root | Old documentation |
| الشيت_الخرافي.md | root | Old documentation |
| الميزات_الجديدة.md | root | Old documentation |
| تقسيم الملفات.txt | root | Old documentation |
| كيف_تشغل_التطبيق.md | root | Old documentation |
| كيف_تفهم_مصدر_البيانات.md | root | Old documentation |

---

## Restoration

To restore any file, move it back to its original location:

```bash
# Example: Restore AdminDashboard.jsx.backup
move "_archive_2025-12-30\backup_configs\AdminDashboard.jsx.backup" "src\pages\Admin\"
```

---

## Notes

- All files moved are non-essential for production
- Project verified to work after cleanup
- No source code was deleted, only moved
- Archive can be safely deleted after confirming project stability

---

**Archived by:** Claude Code
**Date:** 2025-12-30
