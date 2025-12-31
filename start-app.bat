@echo off
title YAS TSSR Monitor
cd /d "%~dp0"

echo ========================================
echo    YAS TSSR Monitor - Starting...
echo ========================================
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

:: Start the application
echo Starting Electron app...
npm run electron:dev

pause
