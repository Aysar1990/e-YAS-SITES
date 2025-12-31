@echo off
echo ========================================
echo   TSSR Monitor - Database Fix Script
echo ========================================
echo.
echo This will delete the SQLite database and let it recreate with correct schema.
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

echo.
echo Deleting old database...
del /f /q "data\tssr.db" 2>nul

echo.
echo Database deleted. Please restart the application.
echo The database will be recreated with the correct schema.
echo.
pause
