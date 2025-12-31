@echo off
echo.
echo ========================================
echo    TSSR Monitor - Import Test
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [ERROR] node_modules not found!
    echo Please run: npm install
    pause
    exit /b 1
)

REM Check .env file
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo Please create .env from .env.example
    pause
    exit /b 1
)

REM Check database type
findstr /C:"DATABASE_TYPE=supabase" .env >nul
if %errorlevel% neq 0 (
    echo [WARNING] DATABASE_TYPE is not set to 'supabase' in .env
    echo Current setting:
    findstr /C:"DATABASE_TYPE=" .env
    echo.
    set /p continue="Continue anyway? (y/n): "
    if /i not "%continue%"=="y" exit /b 1
)

echo.
echo [OK] Environment checks passed!
echo.
echo Starting TSSR Monitor in TEST mode...
echo.
echo INSTRUCTIONS:
echo 1. Login as Admin
echo 2. Go to Settings -^> Import
echo 3. Drag TSSR Excel file
echo 4. Check Analysis
echo 5. Click "Start Import"
echo 6. Wait for success message
echo 7. Go to Sites page to verify
echo.
echo Press any key to start...
pause >nul

npm start
