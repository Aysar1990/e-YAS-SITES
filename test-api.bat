@echo off
chcp 65001 >nul
title TSSR Monitor - API Test
color 0B

echo.
echo Running API tests for all users...
echo.

node test-api-users.js

echo.
pause
