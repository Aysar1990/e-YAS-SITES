@echo off
title YAS TSSR Monitor - Development
cd /d "%~dp0"

echo ========================================
echo    YAS TSSR Monitor - Dev Mode
echo ========================================
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

:: Start both Vite and Electron
echo Starting Vite dev server + Electron...
npm run start

pause
