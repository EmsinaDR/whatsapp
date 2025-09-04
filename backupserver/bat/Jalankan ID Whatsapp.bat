@echo off
title Jalankan ID Whatsapp
echo [i] Sedang pindah direktori ke Laravel project...

CD /D "C:\laragon\www\siakad" || (
    echo [!] Gagal pindah ke direktori project.
    exit /b
)

echo [✔] Direktori aktif: %CD%
echo [i] Menjalankan perintah: php artisan start:wa-sessions
echo -----------------------------------------
timeout /t 1 >nul

php artisan start:wa-sessions
php artisan start:ServerAktif
echo -----------------------------------------
echo [✔] Eksekusi selesai.

exit
