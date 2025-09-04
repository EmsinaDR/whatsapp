@echo off
::cd /d C:\laragon\www\siakad
::C:\laragon\bin\php\php-8.3.10-Win32-vs16-x64\php.exe artisan schedule:work
REM Cek apakah PHP ada di PATH
where php >nul 2>&1
if %ERRORLEVEL%==0 (
    REM PHP ada di PATH
    php artisan schedule:work
) else (
    REM PHP tidak ada di PATH, pakai path lengkap
    cd /d C:\laragon\www\siakad
    C:\laragon\bin\php\php-8.3.10-Win32-vs16-x64\php.exe artisan schedule:work
)
