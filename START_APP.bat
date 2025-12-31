@echo off
title TSSR Monitor - Starting...
color 0A

echo.
echo ============================================
echo        TSSR Monitor v2.0
echo ============================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    color 0C
    echo ERROR: Node.js is not installed!
    pause
    exit /b 1
)
echo       Node.js: OK

echo.
echo [2/4] Starting Vite Dev Server...
start "TSSR - Vite Server" cmd /c "npm run dev"

echo.
echo [3/4] Waiting for Vite to start (5 seconds)...
timeout /t 5 /nobreak >nul

echo.
echo [4/4] Starting Electron App with Servers...
start "TSSR - Electron" cmd /c "npm run electron"

echo.
echo ============================================
echo   Application Started Successfully!
echo ============================================
echo.
echo   Login Credentials:
echo   -----------------
echo   Username: admin
echo   Password: admin123
echo.
echo   URLs:
echo   -----
echo   Web:  http://localhost:5173
echo   API:  http://localhost:3001
echo.
echo ============================================
echo   Press any key to close this window
echo   (The app will continue running)
echo ============================================
pause >nul
