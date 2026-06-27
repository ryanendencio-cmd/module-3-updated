@echo off
title M3 Dashboard - Ngrok Tunnel
cd /d "%~dp0"
echo Starting ngrok tunnel for port 8003...
echo.
echo IMPORTANT: I-share ang URL na lalabas kay Jane at Classmate A!
echo.
C:\ngrok\ngrok.exe http 8003 --config=ngrok.yml
pause
