@echo off
cd /d E:\laragon\etc\apps\nssm\win64
sc stop myNodeserver
sc stop LaravelSchedule
timeout /t 5 >nul
sc query myNodeserver
sc query LaravelSchedule
curl http://localhost:3000
pause