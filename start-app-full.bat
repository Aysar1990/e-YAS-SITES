@echo off
REM ====================================
REM TSSR Monitor - Full Stack Startup
REM Starts: Frontend + Backend + Electron
REM ====================================

echo.
echo ============================================
echo   TSSR Monitor - Full Stack Application
echo ============================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
    echo.
)

REM Clean up ports
echo [INFO] Cleaning up ports...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3002" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak >nul
echo [OK] Ports cleared
echo.

REM Start services
echo [INFO] Starting services...
echo.
echo   ^> Vite Dev Server     : http://localhost:3000
echo   ^> Backend API Server  : http://localhost:3001
echo   ^> WebSocket Server    : ws://localhost:3002
echo   ^> Electron Desktop    : Opening...
echo.

REM Start Vite dev server in background
start "Vite Dev" cmd /k "npm run dev"
echo [OK] Vite server starting...
timeout /t 3 /nobreak >nul

REM Start Backend API server in background
start "Backend API" cmd /k "npm run server:dev"
echo [OK] Backend server starting...
timeout /t 3 /nobreak >nul

REM Wait for servers to be ready
echo [INFO] Waiting for servers to start...
timeout /t 5 /nobreak >nul

REM Start Electron app
echo [OK] Opening Electron desktop app...
start "Electron" cmd /k "npm run electron:dev"

echo.
echo ============================================
echo   All services started successfully!
echo ============================================
echo.
echo To stop all services:
echo   - Close all command windows
echo   - Or run: npm run clean
echo.
echo Press any key to exit this launcher...
pause >nul
