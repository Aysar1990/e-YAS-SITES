@echo off
chcp 65001 >nul
title TSSR Monitor - Multi-User Testing
color 0A

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║           TSSR Monitor - Multi-User Testing Script               ║
echo ╠══════════════════════════════════════════════════════════════════╣
echo ║  This script opens multiple browser windows for testing          ║
echo ║  different user roles simultaneously                             ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

set APP_URL=https://e-yas-app.vercel.app

echo ┌──────────────────────────────────────────────────────────────────┐
echo │                     USER CREDENTIALS                             │
echo ├──────────────────────────────────────────────────────────────────┤
echo │                                                                  │
echo │  1. ADMIN                                                        │
echo │     Username: admin                                              │
echo │     Password: admin123                                           │
echo │     Access: Full system access                                   │
echo │                                                                  │
echo │  2. MANAGEMENT (Musab)                                            │
echo │     Username: Musab                                              │
echo │     Password: Musab123                                           │
echo │     Access: Reports, Sites view, Dashboard                       │
echo │                                                                  │
echo │  3. NOKIA ENGINEER (Mofeed)                                      │
echo │     Username: Mofeed                                             │
echo │     Password: Mofeed123                                          │
echo │     Access: Nokia Dashboard, Sites review, Reports               │
echo │                                                                  │
echo │  4. CONTRACTOR - Al Lewan (645 sites)                            │
echo │     Username: Al Lewan                                           │
echo │     Password: Al Lewan123                                        │
echo │     Access: Own sites only, Dashboard, Rejections                │
echo │                                                                  │
echo │  5. CONTRACTOR - Al Tawseaa (117 sites)                          │
echo │     Username: Al Tawseaa                                         │
echo │     Password: Al Tawseaa123                                      │
echo │     Access: Own sites only, Dashboard, Rejections                │
echo │                                                                  │
echo └──────────────────────────────────────────────────────────────────┘
echo.

echo Select testing mode:
echo.
echo   [1] Open ALL user windows (5 windows)
echo   [2] Open Admin only
echo   [3] Open Management only
echo   [4] Open Nokia only
echo   [5] Open Al Lewan (Contractor) only
echo   [6] Open Al Tawseaa (Contractor) only
echo   [7] Open all Contractors (2 windows)
echo   [8] Show API test commands
echo   [0] Exit
echo.

set /p choice="Enter your choice (0-8): "

if "%choice%"=="1" goto open_all
if "%choice%"=="2" goto open_admin
if "%choice%"=="3" goto open_management
if "%choice%"=="4" goto open_nokia
if "%choice%"=="5" goto open_lewan
if "%choice%"=="6" goto open_tawseaa
if "%choice%"=="7" goto open_contractors
if "%choice%"=="8" goto show_api_tests
if "%choice%"=="0" goto end

echo Invalid choice. Please try again.
pause
goto :eof

:open_all
echo.
echo Opening 5 browser windows for all roles...
echo.

echo [1/5] Opening Admin window...
start "" "%APP_URL%/#/login"
timeout /t 2 /nobreak >nul

echo [2/5] Opening Management window...
start "" "%APP_URL%/#/login"
timeout /t 2 /nobreak >nul

echo [3/5] Opening Nokia window...
start "" "%APP_URL%/#/login"
timeout /t 2 /nobreak >nul

echo [4/5] Opening Al Lewan (Contractor) window...
start "" "%APP_URL%/#/login"
timeout /t 2 /nobreak >nul

echo [5/5] Opening Al Tawseaa (Contractor) window...
start "" "%APP_URL%/#/login"

echo.
echo ✓ All windows opened! Use the credentials above to login.
echo.
echo TIP: Arrange windows side by side to compare different roles.
pause
goto :eof

:open_admin
echo Opening Admin window...
start "" "%APP_URL%/#/login"
echo.
echo Admin Credentials:
echo   Username: admin
echo   Password: admin123
echo.
pause
goto :eof

:open_management
echo Opening Management (Musab) window...
start "" "%APP_URL%/#/login"
echo.
echo Management Credentials:
echo   Username: Musab
echo   Password: Musab123
echo.
pause
goto :eof

:open_nokia
echo Opening Nokia (Mofeed) window...
start "" "%APP_URL%/#/login"
echo.
echo Nokia Credentials:
echo   Username: Mofeed
echo   Password: Mofeed123
echo.
pause
goto :eof

:open_lewan
echo Opening Al Lewan (Contractor) window...
start "" "%APP_URL%/#/login"
echo.
echo Al Lewan Credentials:
echo   Username: Al Lewan
echo   Password: Al Lewan123
echo   Sites: 645
echo.
pause
goto :eof

:open_tawseaa
echo Opening Al Tawseaa (Contractor) window...
start "" "%APP_URL%/#/login"
echo.
echo Al Tawseaa Credentials:
echo   Username: Al Tawseaa
echo   Password: Al Tawseaa123
echo   Sites: 117
echo.
pause
goto :eof

:open_contractors
echo Opening Contractor windows...
start "" "%APP_URL%/#/login"
timeout /t 2 /nobreak >nul
start "" "%APP_URL%/#/login"
echo.
echo Contractor Credentials:
echo.
echo   Al Lewan:
echo     Username: Al Lewan
echo     Password: Al Lewan123
echo     Sites: 645
echo.
echo   Al Tawseaa:
echo     Username: Al Tawseaa
echo     Password: Al Tawseaa123
echo     Sites: 117
echo.
pause
goto :eof

:show_api_tests
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║                    API TEST COMMANDS                              ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo Copy these commands to test the API directly:
echo.
echo ─────────────────────────────────────────────────────────────────────
echo 1. Test Health:
echo    curl https://e-yas-sites-api.onrender.com/api/health
echo.
echo ─────────────────────────────────────────────────────────────────────
echo 2. Test Phases (Public):
echo    curl https://e-yas-sites-api.onrender.com/api/phases
echo.
echo ─────────────────────────────────────────────────────────────────────
echo 3. Login as Admin:
echo    curl -X POST https://e-yas-sites-api.onrender.com/api/auth/login ^
echo         -H "Content-Type: application/json" ^
echo         -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
echo.
echo ─────────────────────────────────────────────────────────────────────
echo 4. Login as Contractor (Al Lewan):
echo    curl -X POST https://e-yas-sites-api.onrender.com/api/auth/login ^
echo         -H "Content-Type: application/json" ^
echo         -d "{\"username\":\"Al Lewan\",\"password\":\"Al Lewan123\"}"
echo.
echo ─────────────────────────────────────────────────────────────────────
echo 5. Get Sites (needs token):
echo    curl https://e-yas-sites-api.onrender.com/api/sites ^
echo         -H "Authorization: Bearer YOUR_TOKEN_HERE"
echo.
echo ─────────────────────────────────────────────────────────────────────
echo.
pause
goto :eof

:end
echo.
echo Goodbye!
exit /b 0
