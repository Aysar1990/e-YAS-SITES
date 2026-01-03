@echo off
chcp 65001 >nul
title TSSR Monitor - Application Launcher

echo.
echo ============================================================
echo    TSSR Monitor - Full Application Launcher
echo ============================================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Set working directory
cd /d "%~dp0"
echo [INFO] Working Directory: %cd%
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo [WARN] node_modules not found. Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo.
)

:: Kill any existing Node processes on our ports
echo [INFO] Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)
timeout /t 2 /nobreak >nul

:: Create data directory if needed
if not exist "data" mkdir data

:: Initialize database tables
echo [INFO] Checking database...
node -e "const db=require('better-sqlite3')('./data/tssr.db');const t=db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' AND name='sites'\").get();if(!t){console.log('[DB] Initializing schema...');const{generateCreateTableSQL}=require('./electron/columnDefinitions');db.exec(generateCreateTableSQL())}else{console.log('[DB] Sites table OK')};db.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, role TEXT DEFAULT \"user\", contractor_name TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP, updated_at TEXT DEFAULT CURRENT_TIMESTAMP)');db.exec('CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, user_id INTEGER, username TEXT, table_name TEXT, record_id TEXT, old_value TEXT, new_value TEXT, ip_address TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP)');console.log('[DB] All tables ready');db.close()" 2>nul
echo.

echo ============================================================
echo    Starting Services...
echo ============================================================
echo.

:: Start Backend Server in new window
echo [1/3] Starting Backend Server (API + WebSocket)...
start "TSSR-Backend" cmd /k "cd /d "%~dp0" && title TSSR Backend Server && node electron/standaloneServer.js"
timeout /t 3 /nobreak >nul

:: Start Vite Dev Server in new window
echo [2/3] Starting Frontend Dev Server (Vite)...
start "TSSR-Frontend" cmd /k "cd /d "%~dp0" && title TSSR Frontend Server && npm run dev"
timeout /t 5 /nobreak >nul

:: Wait for servers
echo [3/3] Waiting for servers to be ready...
set /a attempts=0
:wait_loop
set /a attempts+=1
if %attempts% gtr 30 (
    echo [WARN] Timeout waiting for servers. They may still be starting...
    goto servers_ready
)
timeout /t 1 /nobreak >nul

:: Check backend
curl -s http://localhost:3001 >nul 2>nul
if %errorlevel% neq 0 (
    echo        [%attempts%/30] Waiting for backend server...
    goto wait_loop
)

:: Check frontend
curl -s http://localhost:3000 >nul 2>nul
if %errorlevel% neq 0 (
    echo        [%attempts%/30] Waiting for frontend server...
    goto wait_loop
)

:servers_ready
echo        Servers are ready!
echo.
echo ============================================================
echo    All Services Running Successfully!
echo ============================================================
echo.
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:3001
echo    WebSocket: ws://localhost:3002
echo.
echo    Default Login:
echo      Username: admin
echo      Password: 123456
echo.
echo ============================================================
echo.

:: Menu
echo Choose an option:
echo.
echo   [1] Open in Browser (recommended)
echo   [2] Launch Electron Desktop App
echo   [3] Keep servers running only
echo   [4] Stop all and exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo [INFO] Opening browser...
    start "" "http://localhost:3000"
    echo.
    echo ============================================================
    echo   Browser opened at http://localhost:3000
    echo
    echo   DO NOT close the server windows!
    echo   Press any key to close only this launcher window...
    echo ============================================================
    pause >nul
    goto end
)

if "%choice%"=="2" (
    echo.
    echo [INFO] Launching Electron app...
    start "TSSR-Electron" cmd /k "cd /d "%~dp0" && title TSSR Electron App && npm run electron:dev"
    echo.
    echo ============================================================
    echo   Electron app is launching...
    echo
    echo   DO NOT close the server windows!
    echo   Press any key to close only this launcher window...
    echo ============================================================
    pause >nul
    goto end
)

if "%choice%"=="3" (
    echo.
    echo ============================================================
    echo   Servers are running in separate windows.
    echo
    echo   Close those windows to stop the servers.
    echo   Press any key to close this launcher...
    echo ============================================================
    pause >nul
    goto end
)

if "%choice%"=="4" (
    echo.
    echo [INFO] Stopping all services...
    taskkill /FI "WINDOWTITLE eq TSSR Backend*" /F >nul 2>nul
    taskkill /FI "WINDOWTITLE eq TSSR Frontend*" /F >nul 2>nul
    taskkill /FI "WINDOWTITLE eq TSSR Electron*" /F >nul 2>nul
    echo [OK] All services stopped.
    timeout /t 2 /nobreak >nul
    goto end
)

echo [INFO] Invalid choice. Servers will continue running.
pause >nul

:end
exit /b 0
