@echo off
chcp 65001 >nul
title Sync to Supabase - TSSR Monitor

echo.
echo ══════════════════════════════════════════════════════════════
echo           Sync SQLite to Supabase
echo ══════════════════════════════════════════════════════════════
echo.

node scripts/sync-to-supabase.js

pause
