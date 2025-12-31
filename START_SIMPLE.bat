@echo off
title TSSR Monitor - Quick Start
color 0A
cd /d "%~dp0"

echo.
echo ════════════════════════════════════════════════════════════
echo   TSSR Monitor v2.0 - Quick Start
echo ════════════════════════════════════════════════════════════
echo.

:: Clean up
echo [1/3] Cleaning old processes...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM electron.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo       ✓ Done!
echo.

:: Start Vite Dev Server
echo [2/3] Starting Vite Dev Server...
start "Vite Dev Server" cmd /k "cd /d "%~dp0" && color 0B && title Vite Dev Server && npm run dev"
echo       ✓ Vite started on http://localhost:3000
echo.

:: Wait for server
echo [3/3] Waiting for server to be ready...
timeout /t 8 /nobreak >nul
echo       ✓ Server should be ready
echo.

:: Start Electron
echo Starting Electron App...
echo.
start "Electron App" cmd /k "cd /d "%~dp0" && color 0C && title Electron App && npm run electron:dev"

echo.
echo ════════════════════════════════════════════════════════════
echo   ✓ TSSR Monitor is running!
echo ════════════════════════════════════════════════════════════
echo.
echo   To stop: Close all windows or run STOP_ALL.bat
echo.
pause
