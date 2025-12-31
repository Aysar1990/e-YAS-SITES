@echo off
title TSSR Data Source Checker
color 0A

echo.
echo =========================================
echo   TSSR Monitor - Data Source Checker
echo =========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking database file...
if exist "data\tssr.db" (
    echo   [32m✓[0m Database file found: data\tssr.db
    for %%A in ("data\tssr.db") do echo   [32m✓[0m File size: %%~zA bytes
) else (
    echo   [31m✗[0m Database file NOT found!
    echo   [33m![0m Using MOCK DATA
    goto :end
)

echo.
echo [2/3] Checking Excel source file...
if exist "TSSR Tracker Zain Jo 5.xlsm" (
    echo   [32m✓[0m Excel file found: TSSR Tracker Zain Jo 5.xlsm
) else (
    echo   [33m![0m Excel source file not found
)

echo.
echo [3/3] Checking backup files...
if exist "data\tssr_backup_*.db" (
    echo   [32m✓[0m Backup files found
    dir /b data\tssr_backup_*.db | find /c /v "" > temp_count.txt
    set /p backup_count=<temp_count.txt
    del temp_count.txt
    echo   [32m✓[0m Total backups: %backup_count%
) else (
    echo   [33m![0m No backup files found
)

echo.
echo =========================================
echo   Data Source Test
echo =========================================
echo.
echo Testing database connection...
node -e "const db = require('./electron/database/db'); db.initialize().then(() => { const sites = db.prepare('SELECT COUNT(*) as count FROM sites_cache').get(); console.log('[32m✓[0m Total sites in database:', sites.count); if(sites.count > 100) { console.log('[32m✓[0m Using REAL DATA'); } else { console.log('[31m✗[0m Database might be empty'); } db.close(); }).catch(err => { console.log('[31m✗[0m Database error:', err.message); });"

:end
echo.
echo =========================================
echo   Results Summary
echo =========================================
echo.
echo If you see:
echo   [32m✓[0m Database found + Total sites: 3791
echo   [32m→[0m Application uses REAL DATA
echo.
echo If you see:
echo   [31m✗[0m Database NOT found OR Total sites: 5
echo   [31m→[0m Application uses MOCK DATA
echo.
pause
