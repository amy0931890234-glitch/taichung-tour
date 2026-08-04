@echo off
title Invoice Details Auto Filler
powershell -ExecutionPolicy Bypass -File c:\Users\ASUS\Desktop\AI\fill_invoice_details.ps1
ping 127.0.0.1 -n 5 > nul