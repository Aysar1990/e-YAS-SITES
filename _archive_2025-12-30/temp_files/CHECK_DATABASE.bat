@echo off
chcp 65001 >nul
title Database Check - TSSR Monitor

node scripts/check-database.js

pause
