@echo off
chcp 65001 >nul
title e-YAS SITES - Development
color 0E

echo.
echo  ╔═══════════════════════════════════════╗
echo  ║   e-YAS SITES - Development Mode      ║
echo  ╚═══════════════════════════════════════╝
echo.

:: Check node_modules
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Failed to install dependencies!
        pause
        exit /b 1
    )
)

:: Create data folder if not exists
if not exist "data" mkdir data

echo Starting:
echo  - Vite Dev Server (http://localhost:3000)
echo  - Backend Server (http://localhost:3001)
echo  - Electron App
echo.
echo Press Ctrl+C to stop all services
echo.

call npm run dev:full

pause
