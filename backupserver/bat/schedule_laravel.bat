@echo off
:loop
"C:\laragon\bin\php\php-8.3.10-Win32-vs16-x64\php.exe" "C:\laragon\www\siakad\whatsapp\artisan" schedule:run
timeout /t 60 /nobreak
goto loop
