@echo off
title Real-time Mode Checker
color 0B

echo.
echo =========================================
echo   TSSR Real-time Mode Checker
echo =========================================
echo.

cd /d "%~dp0"

echo Checking current Real-time mode...
echo.

REM Check if WebSocket server is running
netstat -ano | findstr ":3002" >nul 2>&1
if %errorlevel% == 0 (
    echo [32m✓[0m WebSocket Server is RUNNING on port 3002
    echo [32m→[0m Real-time Mode: WebSocket [FREE - NO LIMITS][0m
    echo.
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002" ^| findstr "LISTENING"') do (
        echo [33m  Process ID: %%a[0m
        for /f "tokens=*" %%b in ('tasklist /FI "PID eq %%a" /FO CSV /NH') do echo [33m  %%b[0m
    )
    set websocket_running=true
) else (
    echo [31m✗[0m WebSocket Server NOT running
    echo [31m→[0m Real-time Mode: DISABLED[0m
    set websocket_running=false
)

echo.
echo =========================================
echo   Firebase Sync Status
echo =========================================
echo.

REM Check if Firebase sync is running
tasklist /FI "IMAGENAME eq node.exe" /FO CSV | findstr /C:"node.exe" >nul 2>&1
if %errorlevel% == 0 (
    echo [33m⚠[0m  Node.js processes detected
    echo [33m→[0m Firebase Sync might be RUNNING
    echo [33m→[0m This uses Firebase quota [LIMITED][0m
    echo.
    tasklist /FI "IMAGENAME eq node.exe" /FO TABLE
) else (
    echo [32m✓[0m No Firebase Sync detected
    echo [32m→[0m Firebase quota NOT being used[0m
)

echo.
echo =========================================
echo   Recommendations
echo =========================================
echo.

if "%websocket_running%"=="true" (
    echo [32m✓ OPTIMAL SETUP[0m
    echo.
    echo You are using WebSocket Real-time:
    echo   • [32mFREE[0m - No quota limits
    echo   • [32mFAST[0m - Instant updates
    echo   • [32mLOCAL[0m - No internet needed
    echo.
) else (
    echo [31m! SUBOPTIMAL SETUP[0m
    echo.
    echo WebSocket is NOT running. To enable Real-time:
    echo.
    echo Option 1: Start Server Mode
    echo   [33m1. Run: START_SERVER.bat[0m
    echo   [33m2. Other PCs: Settings → Mode: Client[0m
    echo.
    echo Option 2: Use Firebase [NOT RECOMMENDED - Limited quota]
    echo   [33m1. Enable Firebase in Settings[0m
    echo   [33m2. Configure sync interval to 30+ minutes[0m
    echo.
)

echo =========================================
echo   Quick Actions
echo =========================================
echo.
echo Press 1: Start WebSocket Server
echo Press 2: Check Firebase Config
echo Press 3: View Real-time Explained
echo Press 4: Exit
echo.
set /p choice="Your choice: "

if "%choice%"=="1" (
    echo.
    echo Starting WebSocket Server...
    start START_SERVER.bat
    echo [32m✓[0m Server started! Run this script again to verify.
    timeout /t 3
)

if "%choice%"=="2" (
    echo.
    if exist "firebase-sync\shared\config.json" (
        type "firebase-sync\shared\config.json"
    ) else (
        echo [31m✗[0m Firebase config not found
    )
    echo.
    pause
)

if "%choice%"=="3" (
    if exist "Real-time_Explained.md" (
        start Real-time_Explained.md
    ) else (
        echo [31m✗[0m Documentation not found
    )
)

if "%choice%"=="4" exit

echo.
pause
