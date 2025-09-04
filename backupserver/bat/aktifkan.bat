@echo off
title 🔌 Menyalakan WhatsApp Gateway - ATA DIGITAL
color 0A

echo ============================
echo     ATA DIGITAL SYSTEM
echo ============================
echo [✔] Menyiapkan koneksi...
timeout /t 1 >nul
echo [✔] Mencari file server.js...
timeout /t 1 >nul
echo [⚙] Menyalakan mesin Node.js dengan Nodemon...

echo 🚀 Bersihin port 3000 jika ada proses lama...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a

cd /d C:\laragon\www\siakad\whatsapp
start "" node server.js >> runwa.log 2>&1
timeout /t 1 >nul
echo [🚀] server.js berhasil dijalankan dengan Nodemon di background.
echo ----------------------------
echo 📡 WhatsApp Gateway Siap!
echo ----------------------------
echo   Dibangun oleh ATA DIGITAL
echo   HP   : 0853-2986-0005
echo   website : -
echo ----------------------------

timeout /t 10 >nul
