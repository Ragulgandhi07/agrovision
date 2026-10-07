@echo off
title SmartFarm Localhost Server
echo ========================================================
echo       Starting Permanent Localhost Server
echo       URL: http://localhost:5173
echo ========================================================
cd /d "%~dp0"
npm run dev
pause
