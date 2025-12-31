@echo off
title YAS TSSR Monitor - Stop All Services
echo.
echo Stopping all TSSR Monitor services...
echo.

:: Kill Node.js processes related to our app
taskkill /F /FI "WINDOWTITLE eq Firebase Sync Server" 2>nul
taskkill /F /FI "WINDOWTITLE eq Firebase Sync" 2>nul

:: Kill any node processes on our ports
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    echo Stopping process on port 3000 (PID: %%a)
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do (
    echo Stopping process on port 3001 (PID: %%a)
    taskkill /F /PID %%a 2>nul
)

echo.
echo All services stopped.
pause
