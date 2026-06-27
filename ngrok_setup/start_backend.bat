@echo off
title M3 Dashboard - Backend
cd /d "%~dp0.."
node --watch backend\server.js
pause
