@echo off
title Monthly Report Generator
powershell -ExecutionPolicy Bypass -File c:\Users\ASUS\Desktop\AI\run_monthly_report.ps1
ping 127.0.0.1 -n 5 > nul