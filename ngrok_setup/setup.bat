@echo off
echo ==============================
echo  DASHBOARD MODULE - ONE-TIME SETUP
echo ==============================
echo.
echo Step 1: Installing npm dependencies...
cd /d "%~dp0.."
call npm install
echo Done!
echo.
echo Step 2: Create database...
echo Importing schema.sql...
mysql -u root -p jane2005 < backend\schema.sql
echo Done!
echo.
echo Step 3: Downloading ngrok...
echo Please download from: https://ngrok.com/download
echo Extract the ngrok.exe to C:\ngrok\
echo.
echo ==============================
echo  SETUP COMPLETE!
echo ==============================
pause
