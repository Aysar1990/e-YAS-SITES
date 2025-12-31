@echo off
title YAS TSSR Monitor - Unified Launcher
cd /d "%~dp0"

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║         YAS TSSR Monitor - Unified Launcher                ║
echo ║                                                            ║
echo ║  Starting:                                                 ║
echo ║    1. Firebase Sync Server (Excel to Firebase)             ║
echo ║    2. Electron App (Vite + React)                          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

:: Check if node_modules exists in main app
if not exist "node_modules" (
    echo [Setup] Installing main app dependencies...
    call npm install
    echo.
)

:: Check if node_modules exists in firebase-sync
if not exist "firebase-sync\node_modules" (
    echo [Setup] Installing Firebase sync dependencies...
    cd firebase-sync
    call npm install
    cd ..
    echo.
)

echo ============================================================
echo [Step 1] Starting Firebase Sync Server...
echo ============================================================
echo.

:: Start Firebase sync server in a new window
start "Firebase Sync Server" cmd /k "cd /d "%~dp0firebase-sync" && node server/server.js"

:: Wait a moment for Firebase to initialize
echo Waiting for Firebase to initialize...
timeout /t 3 /nobreak > nul

echo.
echo ============================================================
echo [Step 2] Starting Electron App...
echo ============================================================
echo.

:: Start the Electron app with Vite
echo Starting Vite dev server + Electron...
call npm run start

:: If we get here, the app was closed
echo.
echo ============================================================
echo Application closed.
echo ============================================================
echo.
echo Note: The Firebase Sync Server may still be running in
echo       its own window. Close it manually if needed.
echo.
pause
