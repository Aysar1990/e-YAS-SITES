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
echo [1/5] Cleaning up old processes...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM electron.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo       Done!
echo.

:: Check dependencies
echo [2/5] Checking dependencies...
if not exist "node_modules" (
    echo       Installing main dependencies...
    call npm install
)
if not exist "firebase-sync\node_modules" (
    echo       Installing Firebase Sync dependencies...
    cd firebase-sync
    call npm install
    cd ..
)
echo       Done!
echo.

:: Clear caches
echo [3/5] Clearing caches...
if exist "node_modules\.vite" rd /s /q "node_modules\.vite" >nul 2>&1
echo       Done!
echo.

:: Start Firebase Sync Server
echo [4/5] Starting Firebase Sync Server...
start "Firebase Sync" cmd /k "cd /d "%~dp0firebase-sync" && color 0E && title Firebase Sync Server && node server/server.js"
timeout /t 2 /nobreak >nul
echo       Firebase Sync Server started on background
echo.

:: Start Vite + Electron
echo [5/5] Starting Vite Dev Server + Electron...
echo.
echo  ┌────────────────────────────────────────────────────────────┐
echo  │  Services Running:                                         │
echo  │  ► Vite Dev Server    : http://localhost:3000              │
echo  │  ► Firebase Sync      : Running in background              │
echo  │  ► Electron App       : Starting...                        │
echo  └────────────────────────────────────────────────────────────┘
echo.
echo  Press Ctrl+C to stop all services
echo.

:: Start main app (Vite + Electron)
call npm start

:: Cleanup on exit
echo.
echo Shutting down all services...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM electron.exe /T >nul 2>&1
echo All services stopped.
pause
