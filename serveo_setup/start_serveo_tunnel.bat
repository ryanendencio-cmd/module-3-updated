@echo off
REM Serveo Tunnel for M3 Dashboard Frontend
REM Exposes localhost:5175 via a public URL
REM URL format: https://RANDOM.serveo.net
REM Copy the URL and update ..\.env VITE_INVENTORY_URL and VITE_POS_URL
echo Starting Serveo tunnel to port 5175...
echo Wait for the "Forwarding" message, then copy the https URL.
echo.
ssh -o ServerAliveInterval=60 -R 80:localhost:5175 serveo.net
echo.
echo Tunnel closed.
pause
