@echo off
cd /d C:\laragon\etc\apps\nssm\win64

sc query myNodeserver
sc query LaravelSchedule
curl http://localhost:3000
pause