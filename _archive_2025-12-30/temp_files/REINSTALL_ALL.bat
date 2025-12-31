@echo off
echo ════════════════════════════════════════════════════════════
echo   Complete Clean Reinstall of ALL Dependencies
echo ════════════════════════════════════════════════════════════
echo.

cd /d "%~dp0"

echo [1/6] Killing Node processes...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM electron.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul
echo       ✓ Done
echo.

echo [2/6] Removing node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo       ✓ Removed
) else (
    echo       ✓ Already clean
)
echo.

echo [3/6] Removing package-lock.json...
if exist package-lock.json (
    del /f package-lock.json
    echo       ✓ Removed
) else (
    echo       ✓ Already clean
)
echo.

echo [4/6] Cleaning npm cache...
call npm cache clean --force
echo       ✓ Cache cleaned
echo.

echo [5/6] Installing ALL dependencies...
echo       This may take 2-3 minutes...
echo.
call npm install --legacy-peer-deps
echo.
echo       ✓ Installation complete
echo.

echo [6/6] Verifying installation...
echo.
if exist "node_modules\vite" (
    echo       ✓ vite installed
) else (
    echo       ✗ vite NOT installed
)

if exist "node_modules\electron" (
    echo       ✓ electron installed
) else (
    echo       ✗ electron NOT installed
)

if exist "node_modules\react" (
    echo       ✓ react installed
) else (
    echo       ✗ react NOT installed
)

if exist "node_modules\ag-grid-react" (
    echo       ✓ ag-grid-react installed
) else (
    echo       ✗ ag-grid-react NOT installed
)

echo.
echo ════════════════════════════════════════════════════════════
echo   Installation Complete!
echo ════════════════════════════════════════════════════════════
echo.

dir node_modules /b | find /c ":" >nul
if %errorlevel% equ 0 (
    echo Total packages installed:
    for /f %%a in ('dir node_modules /ad /b ^| find /c /v ""') do echo %%a packages
)

echo.
pause
