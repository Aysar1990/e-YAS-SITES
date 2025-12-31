@echo off
echo ========================================
echo  Deleting OLD SQLite Database
echo ========================================
echo.

cd /d "%~dp0data"
if exist tssr.db (
    del /F /Q tssr.db
    echo [SUCCESS] SQLite database deleted!
) else (
    echo [INFO] No SQLite database found.
)

echo.
echo Done! Press any key to exit...
pause >nul
