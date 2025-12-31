@echo off
chcp 65001 >nul
title TSSR - Initialize Database & Import

echo.
echo ══════════════════════════════════════════════════════════════
echo           TSSR Monitor - Fresh Start
echo ══════════════════════════════════════════════════════════════
echo.

cd /d "%~dp0"

echo [1/2] Initializing SQLite Database...
node scripts/init-database.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Database initialization failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Ready to import Excel file
echo.
echo Drag and drop your Excel file here, or enter the path:
echo.

set /p EXCEL_PATH="Excel file path: "

if "%EXCEL_PATH%"=="" (
    echo ❌ No file specified
    pause
    exit /b 1
)

:: Remove quotes if present
set EXCEL_PATH=%EXCEL_PATH:"=%

echo.
echo Importing: %EXCEL_PATH%
echo.

node scripts/import-and-sync.js "%EXCEL_PATH%"

echo.
pause
