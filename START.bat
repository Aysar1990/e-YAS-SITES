@echo off
chcp 65001 >nul
title TSSR Monitor - Quick Start
color 0A

echo.
echo ══════════════════════════════════════════════════════════════
echo           TSSR Monitor - Quick Start
echo ══════════════════════════════════════════════════════════════
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo [!] Installing dependencies first...
    call npm install
    echo.
)

echo [*] Starting application...
echo.
echo     Vite:      http://localhost:3000
echo     API:       http://localhost:3001
echo     WebSocket: ws://localhost:3002
echo.
echo [*] Please wait for all services to start...
echo [*] The application window will open automatically.
echo.

:: Start full mode (Vite + Server + Electron)
call npm run dev:full

pause
