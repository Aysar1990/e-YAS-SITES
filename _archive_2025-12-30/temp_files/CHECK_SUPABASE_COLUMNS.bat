@echo off
chcp 65001 >nul
title Check Supabase Columns - TSSR Monitor

echo.
echo ══════════════════════════════════════════════════════════════
echo           Check Supabase Columns vs Expected
echo ══════════════════════════════════════════════════════════════
echo.

node scripts/check-supabase-columns.js

pause
