@echo off
REM ====================================
REM TSSR Monitor - Startup Script
REM ====================================

echo.
echo ========================================
echo   TSSR Monitor - Starting Application
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install
    echo.
)

REM Kill any existing processes on ports
echo [INFO] Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3002" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
echo [OK] Ports cleared
echo.

REM Start the application
echo [INFO] Starting TSSR Monitor...
echo.
echo   - Vite Dev Server (Port 3000)
echo   - Backend API Server (Port 3001)
echo   - WebSocket Server (Port 3002)
echo   - Electron Desktop App
echo.

REM Use npm start which runs vite + electron together
start "TSSR Monitor" cmd /k "npm start"

echo.
echo ========================================
echo   Application is starting...
echo   Please wait for Electron window
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
