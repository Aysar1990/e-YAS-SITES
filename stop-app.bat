@echo off
chcp 65001 >nul
title TSSR Monitor - Stop All Services

echo.
echo ============================================================
echo    TSSR Monitor - Stopping All Services
echo ============================================================
echo.

echo [INFO] Stopping Backend Server...
taskkill /FI "WINDOWTITLE eq TSSR Backend*" /F >nul 2>nul

echo [INFO] Stopping Frontend Server...
taskkill /FI "WINDOWTITLE eq TSSR Frontend*" /F >nul 2>nul

echo [INFO] Stopping Electron App...
taskkill /FI "WINDOWTITLE eq TSSR Electron*" /F >nul 2>nul

echo [INFO] Killing processes on ports 3000, 3001, 3002...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo ============================================================
echo    All TSSR Monitor services have been stopped.
echo ============================================================
echo.
timeout /t 3 /nobreak >nul
