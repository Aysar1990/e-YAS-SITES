@echo off
title YAS TSSR - Stop All Services
color 0C

echo.
echo  Stopping all YAS TSSR services...
echo.

taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM electron.exe /T >nul 2>&1

echo  ✓ All services stopped!
echo.
timeout /t 2
