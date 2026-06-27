==============================
  DASHBOARD MODULE - M3 SETUP
==============================

--- BAGO I-RUN (isang beses lang) ---

1. Install Node.js (https://nodejs.org)
2. Install MySQL, set root password sa "jane2005"
3. I-download ang ngrok:
   - Pumunta sa https://ngrok.com/download
   - I-download ang Windows version
   - I-extract ang .exe sa C:\ngrok\ o kahit saan
4. I-right click + Run as Administrator sa "setup.bat"

--- SA PRESENTATION DAY ---

1. I-double click ang "start_backend.bat" (mag-oopen yan ng terminal)
2. Hintayin mag-load (makikita "Server running on port 8003")
3. I-double click ang "start_ngrok.bat" (mag-oopen yan ng terminal)
4. Sa terminal ng ngrok, makikita yung URL (hal: https://xxx.ngrok-free.dev)
5. I-share yung URL kay Jane at Classmate A
6. Kunin ang URL nila at ilagay sa backend\.env
7. I-restart backend (close + open ulit start_backend.bat)
8. I-double click ang "start_frontend.bat"
9. Pumunta sa http://localhost:5175 sa browser
