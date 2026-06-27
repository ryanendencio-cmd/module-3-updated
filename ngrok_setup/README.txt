======================================
  DASHBOARD MODULE - M3 SETUP GUIDE
======================================

--- ISANG BESES LANG ---

1. I-install ang Node.js (https://nodejs.org)
2. I-install ang MySQL, root password = jane2005
3. I-download ang ngrok.exe (https://ngrok.com/download)
   - I-extract at ilagay sa ngrok_setup folder
4. I-run ito sa CMD:
     cd module-3-updated
     npm install
     mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS dashboard_db;"
     mysql -u root -p dashboard_db < backend\schema.sql
     (type password: jane2005)
5. I-copy ang backend\env.example -> backend\.env
6. I-configure ang ngrok:
     cd ngrok_setup
     ngrok config add-authtoken 3FhO78cop1waL5ArzNEmNqqnC9c_YzgKfYd4jeUo3y4m11c8

--- SA PRESENTATION ---

Bukas ng 3 terminals (CMD):

Terminal 1 - Backend:
  cd module-3-updated
  npm run dev:server

Terminal 2 - Ngrok:
  cd module-3-updated\ngrok_setup
  ngrok.exe http 8003
  (kopyahin URL, i-share kay Jane at Classmate A)

Terminal 3 - Frontend:
  cd module-3-updated
  npm run dev

Bukas browser: http://localhost:5175
