@echo off
chcp 65001 >nul
title e-YAS SITES - TSSR Monitor
color 0A

echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║           e-YAS SITES - TSSR Monitor                      ║
echo  ║         Site Intelligence Tracking System                 ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo [!] node_modules not found. Installing dependencies...
    echo.
    call npm install
    if errorlevel 1 (
        echo [X] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
    echo [✓] Dependencies installed successfully!
    echo.
)

:: Check if data directory exists
if not exist "data" (
    echo [+] Creating data directory...
    mkdir data
)

:: Menu
:menu
echo.
echo  ┌─────────────────────────────────────────┐
echo  │          Select Startup Mode            │
echo  ├─────────────────────────────────────────┤
echo  │  1. Development Mode (Full)             │
echo  │  2. Server Only                         │
echo  │  3. Electron App Only                   │
echo  │  4. Build Production                    │
echo  │  5. Import Excel Data                   │
echo  │  6. Database Status                     │
echo  │  7. Run Tests                           │
echo  │  0. Exit                                │
echo  └─────────────────────────────────────────┘
echo.
set /p choice="Enter choice [1-7, 0]: "

if "%choice%"=="1" goto dev_full
if "%choice%"=="2" goto server
if "%choice%"=="3" goto electron
if "%choice%"=="4" goto build
if "%choice%"=="5" goto import
if "%choice%"=="6" goto db_status
if "%choice%"=="7" goto tests
if "%choice%"=="0" goto end

echo [!] Invalid choice. Try again.
goto menu

:dev_full
echo.
echo [*] Starting Development Mode (Vite + Server + Electron)...
echo [*] Press Ctrl+C to stop
echo.
call npm run dev:full
goto menu

:server
echo.
echo [*] Starting Server Only (http://localhost:3001)...
echo [*] Press Ctrl+C to stop
echo.
call npm run server
goto menu

:electron
echo.
echo [*] Starting Electron App...
echo.
call npm run electron:dev
goto menu

:build
echo.
echo [*] Building for Production...
echo.
call npm run build:prod
if errorlevel 1 (
    echo [X] Build failed!
) else (
    echo [✓] Build completed! Check the 'dist' folder.
)
pause
goto menu

:import
echo.
echo [*] Starting Excel Import...
echo.
set /p excelFile="Enter Excel file path (or drag file here): "
node -e "const XLSX=require('xlsx');const Database=require('better-sqlite3');const {COLUMNS,getSQLiteColumns}=require('./electron/columnDefinitions');const wb=XLSX.readFile('%excelFile%'.replace(/\"/g,''));const sheet=wb.Sheets[wb.SheetNames[0]];const data=XLSX.utils.sheet_to_json(sheet,{header:1});const headers=data[2];const cols=getSQLiteColumns();const db=new Database('./data/tssr.db');const headerMap={};headers.forEach((h,i)=>{const c=COLUMNS.find(x=>x.excel.toLowerCase()===String(h).trim().toLowerCase());if(c)headerMap[i]=c.sqlite});const stmt=db.prepare('INSERT OR REPLACE INTO sites ('+cols.join(',')+') VALUES ('+cols.map(()=>'?').join(',')+')');let ok=0,fail=0;for(let i=3;i<data.length;i++){const row=data[i];if(!row||!row[0])continue;try{const m={};for(let j=0;j<row.length;j++){if(headerMap[j]){let v=row[j];if(headerMap[j]==='site_id')v=String(Math.floor(Number(v)));m[headerMap[j]]=v}}if(!m.phase_name)m.phase_name='Unknown';stmt.run(...cols.map(c=>m[c]??null));ok++}catch(e){fail++}}db.close();console.log('Imported:',ok,'Failed:',fail)"
echo.
pause
goto menu

:db_status
echo.
echo [*] Database Status...
echo.
node -e "const Database=require('better-sqlite3');try{const db=new Database('./data/tssr.db');const sites=db.prepare('SELECT COUNT(*) as c FROM sites').get();const phases=db.prepare('SELECT phase_name,COUNT(*) as cnt FROM sites GROUP BY phase_name ORDER BY cnt DESC').all();console.log('Total Sites:',sites.c);console.log('');console.log('By Phase:');phases.forEach(p=>console.log(' ',p.phase_name,':',p.cnt));db.close()}catch(e){console.log('Database not found or error:',e.message)}"
echo.
pause
goto menu

:tests
echo.
echo [*] Running Tests...
echo.
call npm run test:unit
pause
goto menu

:end
echo.
echo Goodbye!
exit /b 0
