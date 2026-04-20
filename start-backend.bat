@echo off
title Kaizen ERM - Django Backend
cd /d "c:\Web App Development\Kaizen ERM\erp_backend"
echo Starting Kaizen ERM Django Backend...
"C:\Users\Asus\AppData\Local\Programs\Python\Python312\python.exe" manage.py runserver --settings=config.settings.development
pause
