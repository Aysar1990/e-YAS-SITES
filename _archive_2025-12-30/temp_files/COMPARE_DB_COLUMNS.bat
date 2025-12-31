@echo off
chcp 65001 >nul
title Compare SQLite vs Supabase Columns

echo.
echo ══════════════════════════════════════════════════════════════
echo           Compare SQLite vs Supabase Columns
echo ══════════════════════════════════════════════════════════════
echo.

node scripts/compare-db-columns.js

pause
