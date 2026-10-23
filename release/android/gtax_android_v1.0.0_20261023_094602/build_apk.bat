@echo off
title gtax Mobile - Build Android Release
echo =========================================================================
echo   gtax Mobile - Build Android APK & Bundle
echo =========================================================================
echo.
where flutter >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Flutter SDK not detected in PATH!
    pause
    exit /b 1
)
call flutter pub get
echo Building Release APK...
call flutter build apk --release
echo Building Google Play App Bundle (AAB)...
call flutter build appbundle --release
echo Build Complete!
pause
