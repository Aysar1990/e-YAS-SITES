@echo off
chcp 65001 >nul
title TSSR Monitor - Application Launcher
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║           TSSR Monitor - Application Launcher                ║
echo ║                    e-YAS SITES                               ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo [!] node_modules not found. Installing dependencies...
    echo.
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed successfully.
    echo.
)

:: Menu
echo Select startup mode:
echo.
echo   [1] Full Mode (Vite + API Server + Electron) - RECOMMENDED
echo   [2] Simple Mode (Vite + Electron only)
echo   [3] Server Only (API Server for remote clients)
echo   [4] Development Mode (Vite only - for browser testing)
echo   [5] Production Build and Run
echo   [6] Exit
echo.

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto full_mode
if "%choice%"=="2" goto simple_mode
if "%choice%"=="3" goto server_only
if "%choice%"=="4" goto dev_mode
if "%choice%"=="5" goto prod_mode
if "%choice%"=="6" goto end

echo [!] Invalid choice. Please try again.
pause
goto :eof

:full_mode
echo.
echo [*] Starting Full Mode (Vite + API Server + Electron)...
echo [*] This will start all services concurrently.
echo.
echo     - Vite Dev Server: http://localhost:3000
echo     - API Server: http://localhost:3001
echo     - WebSocket: ws://localhost:3002
echo.
call npm run dev:full
goto end

:simple_mode
echo.
echo [*] Starting Simple Mode (Vite + Electron)...
echo.
call npm run start
goto end

:server_only
echo.
echo [*] Starting API Server only...
echo [*] Use this for remote client connections.
echo.
echo     - API Server: http://localhost:3001
echo     - WebSocket: ws://localhost:3002
echo.
call npm run server:dev
goto end

:dev_mode
echo.
echo [*] Starting Development Mode (Vite only)...
echo [*] Open http://localhost:3000 in your browser.
echo.
call npm run dev
goto end

:prod_mode
echo.
echo [*] Building for production and starting...
echo.
call npm run start:prod
goto end

:end
echo.
echo [*] Application closed.
pause
