@echo off
setlocal enabledelayedexpansion
Title Restart Server Whatsapp
color 0A
echo ============================
echo     ATA DIGITAL SYSTEM
echo ============================

echo   Dibangun oleh ATA DIGITAL
echo   HP		: 0853-2986-0005
echo   website	: -
echo ----------------------------
timeout /t 5 >nul

echo Siap lanjut proses...
timeout /t 10 >nul


cls
:: Restart Service WhatsApp Server
echo ====================================================
echo Matikan Service WhatsApp Server : 
echo ====================================================
echo.
timeout /t 2 >nul
echo Proses stop service
timeout /t 2 >nul
cd /d C:\laragon\etc\apps\nssm\win64
sc stop myNodeserver
timeout /t 5 >nul
sc stop LaravelSchedule
timeout /t 10 >nul
echo Proses stop service myNodeserver dan myNodeserver selesai...
timeout /t 10 >nul

cls

echo ====================================================
echo Aktifkan Service WhatsApp Server : 
echo ====================================================
echo.
timeout /t 2 >nul
echo Siap lanjutkan aktifkan ulang service...
timeout /t 2 >nul
echo.
sc start myNodeserver
timeout /t 5 >nul
sc start LaravelSchedule
timeout /t 5 >nul
echo Jika START_PENDING berarti proses sudah bekerja tunggu sejenak...
timeout /t 5 >nul
cls

echo ====================================================
echo Perubahan Status : 
echo ====================================================
echo.
timeout /t 2 >nul
echo Lihat ulang perubahan status...
timeout /t 2 >nul
echo Tunggu proses START_PENDING berubah RUNNING...
timeout /t 2 >nul
sc query myNodeserver
timeout /t 5 >nul
sc query LaravelSchedule
timeout /t 5 >nul
echo Proses Selesai...
timeout /t 10 >nul
cls

timeout /t 5 >nul
echo.
echo Tunggu sejenak hasil penyesuaian data aktif...
echo.
timeout /t 10 >nul

REM Path ke project Laravel
set projectDir=C:\laragon\www\siakad

REM Cek server Node
for /f %%i in ('curl -s -o nul -w "%%{http_code}" http://localhost:3000/status 2^>nul') do set status=%%i

if "%status%"=="200" (
    echo Server Aktif dan siap digunakan...
    cd /d %projectDir%
::php artisan start:wa-sessions
timeout /t 15 >nul
    php artisan start:ServerAktif
    timeout /t 10 >nul
) else (
    echo Server tidak merespon, status=%status%
)
timeout /t 10 >nul
exit