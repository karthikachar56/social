@echo off
title Android Emulator Launcher
echo ===================================================
echo Starting Android Emulator (No snapshot, No audio)
echo ===================================================
"C:\Users\karth\AppData\Local\Android\Sdk\emulator\emulator.exe" -avd Medium_Phone_API_36.1 -no-snapshot-load -no-audio
pause
