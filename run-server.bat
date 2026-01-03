@echo off
chcp 65001 >nul
title e-YAS SITES - Server
color 0B

echo.
echo  ╔═══════════════════════════════════════╗
echo  ║     e-YAS SITES - Server Mode         ║
echo  ╚═══════════════════════════════════════╝
echo.

:: Check node_modules
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

:: Create data folder if not exists
if not exist "data" mkdir data

echo Starting server on http://localhost:3001
echo.
echo Press Ctrl+C to stop
echo.

call npm run server

pause
