@echo off
title TSSR Monitor - System Diagnostic
color 0B
cd /d "%~dp0"

echo.
echo ════════════════════════════════════════════════════════════
echo   TSSR Monitor - System Diagnostic
echo ════════════════════════════════════════════════════════════
echo.

:: Check 1: Node.js
echo [1/10] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('node --version') do set NODE_VERSION=%%i
    echo       ✓ Node.js: !NODE_VERSION!
) else (
    echo       ✗ Node.js: NOT INSTALLED
    set ERRORS=1
)
echo.

:: Check 2: npm
echo [2/10] Checking npm...
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo       ✓ npm: !NPM_VERSION!
) else (
    echo       ✗ npm: NOT INSTALLED
    set ERRORS=1
)
echo.

:: Check 3: Main dependencies
echo [3/10] Checking main dependencies...
if exist "node_modules" (
    if exist "node_modules\vite" (
        echo       ✓ vite: Installed
    ) else (
        echo       ✗ vite: MISSING
        set ERRORS=1
    )
    
    if exist "node_modules\react" (
        echo       ✓ react: Installed
    ) else (
        echo       ✗ react: MISSING
        set ERRORS=1
    )
    
    if exist "node_modules\electron" (
        echo       ✓ electron: Installed
    ) else (
        echo       ✗ electron: MISSING
        set ERRORS=1
    )
    
    if exist "node_modules\ag-grid-react" (
        echo       ✓ ag-grid: Installed
    ) else (
        echo       ⚠ ag-grid: MISSING (optional)
    )
) else (
    echo       ✗ node_modules: NOT FOUND
    echo       Run: npm install --include=dev
    set ERRORS=1
)
echo.

:: Check 4: Firebase Sync
echo [4/10] Checking Firebase Sync...
if exist "firebase-sync" (
    echo       ✓ Firebase Sync folder exists
    if exist "firebase-sync\server\server.js" (
        echo       ✓ Server file exists
    ) else (
        echo       ⚠ Server file missing
    )
    
    if exist "firebase-sync\node_modules" (
        echo       ✓ Dependencies installed
    ) else (
        echo       ⚠ Dependencies not installed
    )
) else (
    echo       ⚠ Firebase Sync not found (optional)
)
echo.

:: Check 5: Port 3000
echo [5/10] Checking port 3000...
netstat -ano | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo       ⚠ Port 3000 is IN USE
    echo       You may need to stop the process using it
) else (
    echo       ✓ Port 3000 is available
)
echo.

:: Check 6: Project structure
echo [6/10] Checking project structure...
if exist "src" (
    echo       ✓ src folder exists
) else (
    echo       ✗ src folder MISSING
    set ERRORS=1
)

if exist "electron" (
    echo       ✓ electron folder exists
) else (
    echo       ✗ electron folder MISSING
    set ERRORS=1
)

if exist "package.json" (
    echo       ✓ package.json exists
) else (
    echo       ✗ package.json MISSING
    set ERRORS=1
)

if exist "vite.config.js" (
    echo       ✓ vite.config.js exists
) else (
    echo       ✗ vite.config.js MISSING
    set ERRORS=1
)
echo.

:: Check 7: Required files
echo [7/10] Checking required files...
if exist "src\main.jsx" (
    echo       ✓ src\main.jsx
) else (
    echo       ✗ src\main.jsx MISSING
    set ERRORS=1
)

if exist "src\App.jsx" (
    echo       ✓ src\App.jsx
) else (
    echo       ✗ src\App.jsx MISSING
    set ERRORS=1
)

if exist "electron\main.js" (
    echo       ✓ electron\main.js
) else (
    echo       ✗ electron\main.js MISSING
    set ERRORS=1
)
echo.

:: Check 8: Spreadsheet features
echo [8/10] Checking new features...
if exist "src\pages\Admin\SpreadsheetView" (
    echo       ✓ SpreadsheetView component
) else (
    echo       ⚠ SpreadsheetView MISSING
)

if exist "src\pages\Admin\TransformImport" (
    echo       ✓ TransformImport component
) else (
    echo       ⚠ TransformImport MISSING
)

if exist "src\services\transformationEngine.js" (
    echo       ✓ TransformationEngine service
) else (
    echo       ⚠ TransformationEngine MISSING
)
echo.

:: Check 9: Database
echo [9/10] Checking database...
if exist "data" (
    echo       ✓ data folder exists
    if exist "data\tssr.db" (
        echo       ✓ tssr.db exists
    ) else (
        echo       ⚠ tssr.db not found (will be created)
    )
) else (
    echo       ⚠ data folder not found (will be created)
)
echo.

:: Check 10: Config files
echo [10/10] Checking config files...
if exist "config.json" (
    echo       ✓ config.json exists
) else (
    echo       ⚠ config.json not found (optional)
)

if exist ".env" (
    echo       ✓ .env exists
) else (
    echo       ⚠ .env not found (optional)
)
echo.

:: Summary
echo.
echo ════════════════════════════════════════════════════════════
if defined ERRORS (
    echo   ✗ DIAGNOSTIC FAILED - Please fix errors above
    echo   ════════════════════════════════════════════════════════
    echo.
    echo   Recommended actions:
    echo   1. Install Node.js from https://nodejs.org
    echo   2. Run: npm install --include=dev
    echo   3. Check that all files are present
) else (
    echo   ✓ ALL CHECKS PASSED - System is ready!
    echo   ════════════════════════════════════════════════════════
    echo.
    echo   You can now run: START_ALL.bat
)
echo.
pause
