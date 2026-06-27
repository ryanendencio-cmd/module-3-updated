======================================
  DASHBOARD MODULE - M3 SETUP GUIDE
======================================

--- BAGO I-RUN (isang beses lang) ---

1. I-install ang Node.js (https://nodejs.org)
2. I-install ang MySQL, root password = jane2005
3. I-download ang ngrok.exe (https://ngrok.com/download)
   - I-extract at ilagay sa module-3-updated\ngrok_setup\ngrok.exe
4. I-run ito sa CMD (isang beses lang):
     cd module-3-updated\ngrok_setup
     ngrok.exe config add-authtoken 3FhO78cop1waL5ArzNEmNqqnC9c_YzgKfYd4jeUo3y4m11c8
5. I-setup ang database:
     cd module-3-updated
     npm install
     mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS dashboard_db;"
     mysql -u root -p dashboard_db < backend\schema.sql
     (type password: jane2005)
6. I-copy ang backend\env.example -> backend\.env
   - Buksan sa Notepad at baguhin ang DJANGO_API_URL at POS_API_URL kung kinakailangan

--- SA PRESENTATION DAY ---

Bukas ng 3 terminals (CMD):

Terminal 1 - Backend:
  cd module-3-updated
  npm run dev:server

Terminal 2 - Ngrok:
  cd module-3-updated\ngrok_setup
  ngrok.exe http 8003
  (kopyahin ang URL na lalabas, i-share kay Jane at Classmate A)

Terminal 3 - Frontend:
  cd module-3-updated
  npm run dev

--- SA BROWSER ---
Bukas: http://localhost:5175

--- KUNG MAY ERROR SA .env ---
Buksan backend\.env sa Notepad, siguraduhing ganito format:
  DB_HOST=127.0.0.1
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=jane2005
  DB_NAME=dashboard_db
  DJANGO_API_URL=https://tamper-polio-speller.ngrok-free.dev/api
  POS_API_URL=http://127.0.0.1:8002/api

Walang extra spaces o quotes. Save as "All Files" -> filename ".env"
