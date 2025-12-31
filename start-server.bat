@echo off
title YAS TSSR Monitor - Server Mode
cd /d "%~dp0"

echo ========================================
echo    YAS TSSR Monitor - Server Mode
echo ========================================
echo.
echo This will start the API server for client connections.
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

:: Start the standalone server
echo Starting API Server on port 3001...
echo Clients can connect to this machine's IP:3001
echo.
npm run server:dev

pause
