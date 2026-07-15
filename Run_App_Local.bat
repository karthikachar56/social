@echo off
title EventHub Local Emulator Test Runner
echo ===================================================
echo Starting and Running EventHub User App on Emulator
echo ===================================================

set ADB_PATH="C:\Users\karth\AppData\Local\Android\Sdk\platform-tools\adb.exe"
set EMULATOR_PATH="C:\Users\karth\AppData\Local\Android\Sdk\emulator\emulator.exe"
set APK_PATH="public\eventhub-user.apk"

if not exist %APK_PATH% (
    echo [ERROR] Compiled APK not found at %APK_PATH%!
    echo Please make sure you are running this from the project root folder.
    pause
    exit /b 1
)

echo Step 1: Checking for running emulator...
%ADB_PATH% devices | findstr "emulator" >nul
if %ERRORLEVEL% equ 0 (
    echo Emulator is already running!
) else (
    echo Starting Android Emulator (AVD: Medium_Phone_API_36.1)...
    start "Android Emulator" %EMULATOR_PATH% -avd Medium_Phone_API_36.1 -no-snapshot-load -no-audio
)

echo Step 2: Waiting for emulator connection...
%ADB_PATH% wait-for-device

echo Step 3: Waiting for device boot to complete (this might take a minute)...
:wait_boot
timeout /t 2 >nul
%ADB_PATH% shell getprop sys.boot_completed 2>nul | findstr "1" >nul
if %ERRORLEVEL% neq 0 (
    echo Device is booting...
    goto wait_boot
)
echo Device is fully booted!

echo Step 4: Installing %APK_PATH%...
%ADB_PATH% install -r %APK_PATH%
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Installation failed!
    pause
    exit /b 1
)

echo Step 5: Launching App...
%ADB_PATH% shell am start -n com.example.eventhubuser/com.example.eventhubuser.MainActivity
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to send launch command!
    pause
    exit /b 1
)

echo ===================================================
echo Success! App is running.
echo ===================================================
pause
