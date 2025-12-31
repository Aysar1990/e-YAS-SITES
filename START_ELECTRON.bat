@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ===========================================================
echo                  e-YAS SITES Application
echo            Site Intelligence Tracking System
echo ===========================================================
echo.

echo [1] Full Application (Vite + Server + Electron)
echo [2] Server Only (for remote clients)
echo [3] Vite Only (frontend development)
echo [4] Exit
echo.

set /p choice="Select option (1-4): "

if "%choice%"=="1" goto full
if "%choice%"=="2" goto server
if "%choice%"=="3" goto vite
if "%choice%"=="4" goto end

:full
echo.
echo ===========================================================
echo                 Starting Full Application
echo ===========================================================
echo.
echo    Vite:      http://localhost:3000
echo    API:       http://localhost:3001
echo    WebSocket: ws://localhost:3002
echo.
echo -----------------------------------------------------------
echo                    Login Credentials
echo -----------------------------------------------------------
echo    admin       / admin123      (Full Access)
echo    management  / 123456        (Reports, Sites)
echo    contractor  / 123456        (Own Sites Only)
echo    nokia       / 123456        (Nokia Features)
echo -----------------------------------------------------------
echo.
npm run dev:full
goto end

:server
echo.
echo ===========================================================
echo                   Starting Server Only
echo ===========================================================
echo.
echo    API:       http://localhost:3001
echo    WebSocket: ws://localhost:3002
echo.
echo    Clients connect via: http://YOUR_IP:3001
echo.
npm run server
goto end

:vite
echo.
echo ===========================================================
echo                    Starting Vite Only
echo ===========================================================
echo.
echo    Frontend: http://localhost:3000
echo.
npm run dev
goto end

:end
pause
