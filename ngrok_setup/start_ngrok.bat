@echo off
title M3 Dashboard - Ngrok Tunnel
cd /d "%~dp0"
echo Starting ngrok tunnel for port 8003...
echo.
echo IMPORTANT: I-share ang URL na lalabas kay Jane at Classmate A!
echo.
echo Kung first time, i-run muna sa CMD:
echo   ngrok config add-authtoken 3FhO78cop1waL5ArzNEmNqqnC9c_YzgKfYd4jeUo3y4m11c8
echo.
ngrok.exe http 8003
pause
