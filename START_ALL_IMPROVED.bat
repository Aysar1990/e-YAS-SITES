@echo off
title YAS TSSR Monitor - Full Stack
color 0A
cd /d "%~dp0"

echo.
echo  ╔════════════════════════════════════════════════════════════╗
echo  ║                                                            ║
echo  ║   ██╗   ██╗ █████╗ ███████╗    ████████╗███████╗███████╗  ║
echo  ║   ╚██╗ ██╔╝██╔══██╗██╔════╝    ╚══██╔══╝██╔════╝██╔════╝  ║
echo  ║    ╚████╔╝ ███████║███████╗       ██║   ███████╗███████╗  ║
echo  ║     ╚██╔╝  ██╔══██║╚════██║       ██║   ╚════██║╚════██║  ║
echo  ║      ██║   ██║  ██║███████║       ██║   ███████║███████║  ║
echo  ║      ╚═╝   ╚═╝  ╚═╝╚══════╝       ╚═╝   ╚══════╝╚══════╝  ║
echo  ║                                                            ║
echo  ║              TSSR Monitor - Full Stack                     ║
echo  ╚════════════════════════════════════════════════════════════╝
echo.

:: Kill any existing processes
echo [1/6] Cleaning up old processes...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM electron.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo       ✓ Done!
echo.

:: Check port 3000
echo [2/6] Checking port availability...
netstat -ano | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo       ⚠ WARNING: Port 3000 is in use!
    echo       Attempting to free port...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
)
echo       ✓ Port 3000 is available
echo.

:: Check Node.js
echo [3/6] Verifying Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo       ✗ ERROR: Node.js is not installed!
    echo       Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
echo       ✓ Node.js is installed
echo.

:: Check dependencies
echo [4/6] Checking dependencies...
if not exist "node_modules" (
    echo       Installing main dependencies...
    call npm install --include=dev
    if %errorlevel% neq 0 (
        echo       ✗ ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
) else (
    echo       ✓ Main dependencies OK
)

if exist "firebase-sync" (
    if not exist "firebase-sync\node_modules" (
        echo       Installing Firebase Sync dependencies...
        cd firebase-sync
        call npm install
        if %errorlevel% neq 0 (
            echo       ⚠ WARNING: Firebase Sync dependencies failed
            echo       Continuing without Firebase Sync...
            cd ..
        ) else (
            echo       ✓ Firebase Sync dependencies OK
            cd ..
        )
    ) else (
        echo       ✓ Firebase Sync dependencies OK
    )
) else (
    echo       ⚠ Firebase Sync folder not found - skipping
)
echo.

:: Clear caches
echo [5/6] Clearing caches...
if exist "node_modules\.vite" rd /s /q "node_modules\.vite" >nul 2>&1
if exist "dist" rd /s /q "dist" >nul 2>&1
echo       ✓ Caches cleared
echo.

:: Start Firebase Sync Server (if exists)
echo [6/6] Starting services...
if exist "firebase-sync\server\server.js" (
    echo       Starting Firebase Sync Server...
    start "Firebase Sync Server" cmd /k "cd /d "%~dp0firebase-sync" && color 0E && title Firebase Sync Server && echo Starting server... && node server/server.js || (echo ✗ Server failed to start && pause)"
    timeout /t 3 /nobreak >nul
    echo       ✓ Firebase Sync Server started
) else (
    echo       ⚠ Firebase Sync not available - continuing without it
)
echo.

:: Start Vite + Electron
echo  ┌────────────────────────────────────────────────────────────┐
echo  │  Services Running:                                         │
echo  │  ► Vite Dev Server    : http://localhost:3000              │
if exist "firebase-sync\server\server.js" (
    echo  │  ► Firebase Sync      : Running in background              │
) else (
    echo  │  ► Firebase Sync      : Not available                      │
)
echo  │  ► Electron App       : Starting...                        │
echo  └────────────────────────────────────────────────────────────┘
echo.
echo  Press Ctrl+C to stop all services
echo.

:: Start main app (Vite + Electron)
call npm start

:: Cleanup on exit
echo.
echo.
echo ════════════════════════════════════════════════════════════
echo   Shutting down all services...
echo ════════════════════════════════════════════════════════════
timeout /t 2 /nobreak >nul
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM electron.exe /T >nul 2>&1
timeout /t 1 /nobreak >nul
echo   ✓ All services stopped.
echo.
pause
