@echo off
cd /d "%~dp0"
echo Starting TSSR Monitor (Electron)...
echo.
echo Login: admin / admin123
echo.
npm run dev:full
pause
