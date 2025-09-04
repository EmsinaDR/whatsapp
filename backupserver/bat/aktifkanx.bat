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

cd /d C:\laragon\www\siakad\whatsapp

:: Set path Node.js atau pakai path langsung
set "NODE_PATH=C:\Program Files\nodejs\node.exe"

:: Jalankan server.js
start "" /B "C:\Program Files\nodejs\node.exe" "C:\laragon\www\siakad\whatsapp\server.js"


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
exit
