@echo off
title YAS TSSR Monitor
cd /d "%~dp0"

echo.
echo   YAS TSSR Monitor - Quick Launch
echo   ================================
echo.

:: Quick check for dependencies
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

if not exist "firebase-sync\node_modules" (
    echo Installing Firebase sync...
    cd firebase-sync && call npm install && cd ..
)

:: Start Firebase sync in background (hidden window)
start /min "Firebase Sync" cmd /c "cd /d "%~dp0firebase-sync" && node server/server.js"

:: Start the app
npm run start
