@echo off
title gtax Mobile - ADB Android Device Installer
echo =========================================================================
echo   gtax Mobile - Android ADB Deployment Utility
echo =========================================================================
echo.
where adb >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Android Debug Bridge (adb) not found in PATH!
    echo Please ensure Android SDK Platform-Tools is installed and in PATH.
    pause
    exit /b 1
)
echo [INFO] Checking connected Android devices...
adb devices
echo.
set "APK_FILE="
for /f "delims=" %%a in ('dir /b /s "*.apk" 2^>nul') do set "APK_FILE=%%a"
if "%APK_FILE%"=="" (
    echo [INFO] No pre-compiled APK located in this folder.
    echo To build APK, run build_apk.bat or flutter build apk --release.
    pause
    exit /b 0
)
echo [INSTALL] Deploying %APK_FILE% to device...
adb install -r "%APK_FILE%"
pause
