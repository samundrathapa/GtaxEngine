@echo off
setlocal enabledelayedexpansion
title gtax Enterprise - Multi-Platform Release Publisher

:: =========================================================================
:: gtax Enterprise - Unified Release Publishing Script
:: Targets:
::   [1] Windows IIS Server (in-place extract & replace ready)
::   [2] Android Mobile (APK, Bundle, ADB tools)
::   [3] iOS Mobile (Runner, Podfile, ExportOptions)
::   [4] All Platforms (Windows + Android + iOS)
::
:: Generates specific release folder & timestamped zip under release\
:: =========================================================================

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
cd /d "%ROOT_DIR%"

:: Banner
echo =========================================================================
echo   gtax Enterprise - Unified Multi-Platform Release Publisher
echo =========================================================================
echo   Root Workspace: %ROOT_DIR%
echo =========================================================================
echo.

:: CLI arguments support: publish_release.bat [windows|android|ios|all] [version]
set "ARG_TARGET=%~1"
set "ARG_VERSION=%~2"

:: Step 1: Select Release Target
if not "%ARG_TARGET%"=="" (
    if /i "%ARG_TARGET%"=="windows" set "TARGET_OPTION=1"
    if /i "%ARG_TARGET%"=="1"       set "TARGET_OPTION=1"
    if /i "%ARG_TARGET%"=="android" set "TARGET_OPTION=2"
    if /i "%ARG_TARGET%"=="2"       set "TARGET_OPTION=2"
    if /i "%ARG_TARGET%"=="ios"     set "TARGET_OPTION=3"
    if /i "%ARG_TARGET%"=="3"       set "TARGET_OPTION=3"
    if /i "%ARG_TARGET%"=="all"     set "TARGET_OPTION=4"
    if /i "%ARG_TARGET%"=="4"       set "TARGET_OPTION=4"
)

if "%TARGET_OPTION%"=="" (
    echo Select the release target to build and publish:
    echo.
    echo   [1] Windows IIS Server  (dist, server, web.config, in-place update_iis.bat)
    echo   [2] Android Mobile      (APK, App Bundle, ADB tools, Flutter manifest)
    echo   [3] iOS Mobile          (Runner xcarchive, Podfile, ExportOptions, guide)
    echo   [4] All Platforms       (Windows + Android + iOS)
    echo.
    set /p "TARGET_OPTION=Enter selection [1-4, Default=1]: "
    if "!TARGET_OPTION!"=="" set "TARGET_OPTION=1"
)

:: Validate Target Option
if not "%TARGET_OPTION%"=="1" if not "%TARGET_OPTION%"=="2" if not "%TARGET_OPTION%"=="3" if not "%TARGET_OPTION%"=="4" (
    echo [ERROR] Invalid selection: %TARGET_OPTION%. Please choose 1, 2, 3, or 4.
    pause
    exit /b 1
)

:: Step 2: Prompt for Manual Version Number
set "RELEASE_VERSION=%ARG_VERSION%"
if "%RELEASE_VERSION%"=="" (
    echo.
    echo -------------------------------------------------------------------------
    set /p "RELEASE_VERSION=Enter release version number [e.g. 1.0.0, 1.2.3, 2.0.0]: "
    if "!RELEASE_VERSION!"=="" set "RELEASE_VERSION=1.0.0"
)

:: Clean version string (strip leading 'v' if user typed 'v1.0.0')
if /i "!RELEASE_VERSION:~0,1!"=="v" set "RELEASE_VERSION=!RELEASE_VERSION:~1!"

:: Step 3: Compute Formatted Timestamp (YYYYMMDD_HHMMSS)
set "TIMESTAMP="
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss" 2^>nul') do set "TIMESTAMP=%%a"

if "%TIMESTAMP%"=="" (
    :: Fallback using standard date/time
    for /f "tokens=2 delims==" %%a in ('wmic os get localdatetime /value 2^>nul') do set "DT=%%a"
    if not "!DT!"=="" (
        set "TIMESTAMP=!DT:~0,8!_!DT:~8,6!"
    ) else (
        set "TIMESTAMP=%date:~10,4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
        set "TIMESTAMP=!TIMESTAMP: =0!"
    )
)

echo.
echo =========================================================================
echo   Release Version:   v%RELEASE_VERSION%
echo   Build Timestamp:   %TIMESTAMP%
if "%TARGET_OPTION%"=="1" echo   Selected Target:   Windows IIS Server
if "%TARGET_OPTION%"=="2" echo   Selected Target:   Android Mobile
if "%TARGET_OPTION%"=="3" echo   Selected Target:   iOS Mobile
if "%TARGET_OPTION%"=="4" echo   Selected Target:   All Platforms (Windows, Android, iOS)
echo =========================================================================
echo.

:: Ensure base release directory exists
if not exist "release" mkdir "release"

:: Delegate to individual platform packagers
if "%TARGET_OPTION%"=="1" goto PUBLISH_WINDOWS
if "%TARGET_OPTION%"=="2" goto PUBLISH_ANDROID
if "%TARGET_OPTION%"=="3" goto PUBLISH_IOS
if "%TARGET_OPTION%"=="4" goto PUBLISH_ALL

:: -------------------------------------------------------------------------
:: WINDOWS IIS PUBLISHER
:: -------------------------------------------------------------------------
:PUBLISH_WINDOWS
echo -------------------------------------------------------------------------
echo [BUILD 1/3] Compiling and packaging Windows IIS Server release...
echo -------------------------------------------------------------------------

:: Build frontend if npm is available
where npm >nul 2>&1
if !ERRORLEVEL! equ 0 (
    echo [INFO] Running 'npm run build' for production client bundle...
    call npm run build
    if !ERRORLEVEL! neq 0 (
        echo [WARN] npm run build returned an exit code, checking if dist/ exists...
    )
) else (
    echo [INFO] npm not found in current PATH. Using pre-existing dist/ directory.
)

if not exist "dist" (
    echo [ERROR] 'dist' folder is missing! Please build frontend first.
    pause
    exit /b 1
)

set "WIN_FOLDER_NAME=gtax_windows_v%RELEASE_VERSION%_%TIMESTAMP%"
set "WIN_PKG_DIR=%ROOT_DIR%\release\windows\%WIN_FOLDER_NAME%"
set "WIN_ZIP_FILE=%ROOT_DIR%\release\%WIN_FOLDER_NAME%.zip"

if not exist "%ROOT_DIR%\release\windows" mkdir "%ROOT_DIR%\release\windows"
if exist "%WIN_PKG_DIR%" rmdir /s /q "%WIN_PKG_DIR%"
mkdir "%WIN_PKG_DIR%"

echo [COPY] Assembling IIS production files into:
echo        %WIN_PKG_DIR%

:: 1. Copy Frontend dist/
mkdir "%WIN_PKG_DIR%\dist"
xcopy "%ROOT_DIR%\dist" "%WIN_PKG_DIR%\dist\" /E /Y /I /Q >nul

:: 2. Copy IIS Configuration & Update Scripts (Drop-in replacements)
copy /y "%ROOT_DIR%\web.config" "%WIN_PKG_DIR%\web.config" >nul
copy /y "%ROOT_DIR%\update_iis.bat" "%WIN_PKG_DIR%\update_iis.bat" >nul
copy /y "%ROOT_DIR%\start_server.bat" "%WIN_PKG_DIR%\start_server.bat" >nul
copy /y "%ROOT_DIR%\run_migrations.bat" "%WIN_PKG_DIR%\run_migrations.bat" >nul
copy /y "%ROOT_DIR%\package.json" "%WIN_PKG_DIR%\package.json" >nul
if exist "%ROOT_DIR%\tsconfig.json" copy /y "%ROOT_DIR%\tsconfig.json" "%WIN_PKG_DIR%\tsconfig.json" >nul
if exist "%ROOT_DIR%\.env.example" copy /y "%ROOT_DIR%\.env.example" "%WIN_PKG_DIR%\.env.example" >nul

:: 3. Copy Server code and runtime modules
copy /y "%ROOT_DIR%\server.ts" "%WIN_PKG_DIR%\server.ts" >nul
if exist "%ROOT_DIR%\server" (
    mkdir "%WIN_PKG_DIR%\server"
    xcopy "%ROOT_DIR%\server" "%WIN_PKG_DIR%\server\" /E /Y /I /Q >nul
)
if exist "%ROOT_DIR%\ai" (
    mkdir "%WIN_PKG_DIR%\ai"
    xcopy "%ROOT_DIR%\ai" "%WIN_PKG_DIR%\ai\" /E /Y /I /Q >nul
)
if exist "%ROOT_DIR%\database" (
    mkdir "%WIN_PKG_DIR%\database"
    xcopy "%ROOT_DIR%\database" "%WIN_PKG_DIR%\database\" /E /Y /I /Q >nul
)
if exist "%ROOT_DIR%\dbmigration" (
    mkdir "%WIN_PKG_DIR%\dbmigration"
    xcopy "%ROOT_DIR%\dbmigration" "%WIN_PKG_DIR%\dbmigration\" /E /Y /I /Q >nul
)
if exist "%ROOT_DIR%\src" (
    mkdir "%WIN_PKG_DIR%\src"
    xcopy "%ROOT_DIR%\src" "%WIN_PKG_DIR%\src\" /E /Y /I /Q >nul
)

:: 4. Write Quick Start & In-Place Update Instructions
(
    echo =========================================================================
    echo   gtax Enterprise - Windows IIS In-Place Update Guide
    echo   Version: %RELEASE_VERSION%  ^|  Build Timestamp: %TIMESTAMP%
    echo =========================================================================
    echo.
    echo HOW TO UPDATE YOUR RUNNING IIS SERVER:
    echo -------------------------------------------------------------------------
    echo Option A ^(Direct Overwrite - Recommended^):
    echo   1. Stop your IIS Application Pool ^(or let update_iis.bat do it for you^).
    echo   2. Extract all contents of this ZIP file directly into your IIS website root:
    echo      Default path: C:\inetpub\wwwroot\gtax
    echo   3. Select 'Yes to All' when prompted to replace existing files.
    echo   4. Right-click 'update_iis.bat' and select 'Run as Administrator'.
    echo      This script will:
    echo        - Ensure AppPool locks are released
    echo        - Synchronize files
    echo        - Run any pending database migrations
    echo        - Restart the IIS AppPool and Site
    echo.
    echo Option B ^(Automated Synchronizer^):
    echo   1. Extract this zip into any temporary folder ^(e.g., C:\Deploy\v%RELEASE_VERSION%^).
    echo   2. Run 'update_iis.bat' and select option [2] or enter your IIS folder.
    echo.
    echo CONFIGURATION FILES:
    echo   - web.config: Pre-configured with SPA fallback ^& Reverse Proxy to port 3000.
    echo   - start_server.bat: Launches backend Node.js server.
    echo   - run_migrations.bat: Manages PostgreSQL schemas and seed data.
    echo =========================================================================
) > "%WIN_PKG_DIR%\README_IIS_UPDATE.txt"

:: 5. Write Release Metadata
(
    echo {
    echo   "platform": "windows",
    echo   "target": "iis_web_server",
    echo   "version": "%RELEASE_VERSION%",
    echo   "timestamp": "%TIMESTAMP%",
    echo   "updateMethod": "extract_and_replace",
    echo   "updateScript": "update_iis.bat",
    echo   "config": "web.config"
    echo }
) > "%WIN_PKG_DIR%\RELEASE_INFO.json"

:: 6. Create Zip Archive
echo [ZIP] Compressing Windows release archive:
echo       %WIN_ZIP_FILE%

if exist "%WIN_ZIP_FILE%" del /f /q "%WIN_ZIP_FILE%"

where tar >nul 2>&1
if !ERRORLEVEL! equ 0 (
    tar.exe -a -c -f "%WIN_ZIP_FILE%" -C "%ROOT_DIR%\release\windows\%WIN_FOLDER_NAME%" *
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%WIN_PKG_DIR%\*' -DestinationPath '%WIN_ZIP_FILE%' -Force"
)

echo [SUCCESS] Windows IIS package created: %WIN_ZIP_FILE%
if "%TARGET_OPTION%"=="1" goto FINISH
goto CONTINUE_AFTER_WINDOWS

:: -------------------------------------------------------------------------
:: ANDROID MOBILE PUBLISHER
:: -------------------------------------------------------------------------
:PUBLISH_ANDROID
echo -------------------------------------------------------------------------
echo [BUILD 2/3] Packaging Android Mobile release...
echo -------------------------------------------------------------------------

set "AND_FOLDER_NAME=gtax_android_v%RELEASE_VERSION%_%TIMESTAMP%"
set "AND_PKG_DIR=%ROOT_DIR%\release\android\%AND_FOLDER_NAME%"
set "AND_ZIP_FILE=%ROOT_DIR%\release\%AND_FOLDER_NAME%.zip"

if not exist "%ROOT_DIR%\release\android" mkdir "%ROOT_DIR%\release\android"
if exist "%AND_PKG_DIR%" rmdir /s /q "%AND_PKG_DIR%"
mkdir "%AND_PKG_DIR%"

echo [COPY] Assembling Android release files into:
echo        %AND_PKG_DIR%

:: Copy Android native files and mobile app source
if exist "%ROOT_DIR%\mobileapp\android" (
    mkdir "%AND_PKG_DIR%\android"
    xcopy "%ROOT_DIR%\mobileapp\android" "%AND_PKG_DIR%\android\" /E /Y /I /Q >nul
)
if exist "%ROOT_DIR%\mobileapp\lib" (
    mkdir "%AND_PKG_DIR%\lib"
    xcopy "%ROOT_DIR%\mobileapp\lib" "%AND_PKG_DIR%\lib\" /E /Y /I /Q >nul
)
if exist "%ROOT_DIR%\mobileapp\pubspec.yaml" copy /y "%ROOT_DIR%\mobileapp\pubspec.yaml" "%AND_PKG_DIR%\pubspec.yaml" >nul
if exist "%ROOT_DIR%\mobileapp\README.md" copy /y "%ROOT_DIR%\mobileapp\README.md" "%AND_PKG_DIR%\README.md" >nul

:: Create ADB Installer helper script
(
    echo @echo off
    echo title gtax Mobile - ADB Android Device Installer
    echo echo =========================================================================
    echo echo   gtax Mobile - Android ADB Deployment Utility
    echo echo =========================================================================
    echo echo.
    echo where adb ^>nul 2^>^&1
    echo if %%ERRORLEVEL%% neq 0 ^(
    echo     echo [ERROR] Android Debug Bridge ^(adb^) not found in PATH!
    echo     echo Please ensure Android SDK Platform-Tools is installed and in PATH.
    echo     pause
    echo     exit /b 1
    echo ^)
    echo echo [INFO] Checking connected Android devices...
    echo adb devices
    echo echo.
    echo for /f "delims=" %%%%a in ^('dir /b /s "*.apk" 2^^^>nul'^) do ^(
    echo     set "APK_FILE=%%%%a"
    echo ^)
    echo if "!APK_FILE!"=="" ^(
    echo     echo [INFO] No pre-built APK found in this package.
    echo     echo To compile release APK, run: build_apk.bat
    echo     pause
    echo     exit /b 0
    echo ^)
    echo echo [INSTALL] Deploying !APK_FILE! to connected device...
    echo adb install -r "!APK_FILE!"
    echo pause
) > "%AND_PKG_DIR%\install_apk.bat"

:: Create Flutter Build Script
(
    echo @echo off
    echo title gtax Mobile - Build Android Release
    echo echo =========================================================================
    echo echo   gtax Mobile - Build Android APK ^& Bundle
    echo echo =========================================================================
    echo echo.
    echo where flutter ^>nul 2^>^&1
    echo if %%ERRORLEVEL%% neq 0 ^(
    echo     echo [ERROR] Flutter SDK not detected in PATH!
    echo     echo Please install Flutter SDK from https://flutter.dev
    echo     pause
    echo     exit /b 1
    echo ^)
    echo call flutter pub get
    echo echo.
    echo echo Building Release APK...
    echo call flutter build apk --release
    echo echo.
    echo echo Building Google Play App Bundle ^(AAB^)...
    echo call flutter build appbundle --release
    echo echo.
    echo echo Build Complete! APK is in build\app\outputs\flutter-apk\app-release.apk
    echo pause
) > "%AND_PKG_DIR%\build_apk.bat"

:: Write README_ANDROID.txt
(
    echo =========================================================================
    echo   gtax Mobile - Android Release Package
    echo   Version: %RELEASE_VERSION%  ^|  Build Timestamp: %TIMESTAMP%
    echo =========================================================================
    echo.
    echo PACKAGE CONTENTS:
    echo   - android/          : Native Android Gradle project configuration
    echo   - lib/              : Flutter / Dart cross-platform mobile source
    echo   - pubspec.yaml      : Flutter dependencies and asset mappings
    echo   - install_apk.bat   : One-click ADB deployment to USB connected device
    echo   - build_apk.bat     : Automated Flutter APK ^& App Bundle compiler
    echo.
    echo TO DEPLOY TO DEVICE:
    echo   1. Connect Android phone with USB Debugging enabled.
    echo   2. Double-click install_apk.bat
    echo =========================================================================
) > "%AND_PKG_DIR%\README_ANDROID.txt"

:: Write Release Metadata
(
    echo {
    echo   "platform": "android",
    echo   "version": "%RELEASE_VERSION%",
    echo   "timestamp": "%TIMESTAMP%",
    echo   "package": "com.gtax.enterprise",
    echo   "entryPoint": "lib/main.dart",
    echo   "gradle": "android/build.gradle"
    echo }
) > "%AND_PKG_DIR%\RELEASE_INFO.json"

:: Create Zip Archive
echo [ZIP] Compressing Android release archive:
echo       %AND_ZIP_FILE%

if exist "%AND_ZIP_FILE%" del /f /q "%AND_ZIP_FILE%"

where tar >nul 2>&1
if !ERRORLEVEL! equ 0 (
    tar.exe -a -c -f "%AND_ZIP_FILE%" -C "%ROOT_DIR%\release\android\%AND_FOLDER_NAME%" *
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%AND_PKG_DIR%\*' -DestinationPath '%AND_ZIP_FILE%' -Force"
)

echo [SUCCESS] Android package created: %AND_ZIP_FILE%
if "%TARGET_OPTION%"=="2" goto FINISH
goto CONTINUE_AFTER_ANDROID

:: -------------------------------------------------------------------------
:: IOS MOBILE PUBLISHER
:: -------------------------------------------------------------------------
:PUBLISH_IOS
echo -------------------------------------------------------------------------
echo [BUILD 3/3] Packaging iOS Mobile release...
echo -------------------------------------------------------------------------

set "IOS_FOLDER_NAME=gtax_ios_v%RELEASE_VERSION%_%TIMESTAMP%"
set "IOS_PKG_DIR=%ROOT_DIR%\release\ios\%IOS_FOLDER_NAME%"
set "IOS_ZIP_FILE=%ROOT_DIR%\release\%IOS_FOLDER_NAME%.zip"

if not exist "%ROOT_DIR%\release\ios" mkdir "%ROOT_DIR%\release\ios"
if exist "%IOS_PKG_DIR%" rmdir /s /q "%IOS_PKG_DIR%"
mkdir "%IOS_PKG_DIR%"

echo [COPY] Assembling iOS release files into:
echo        %IOS_PKG_DIR%

:: Copy iOS native files and mobile app source
if exist "%ROOT_DIR%\mobileapp\ios" (
    mkdir "%IOS_PKG_DIR%\ios"
    xcopy "%ROOT_DIR%\mobileapp\ios" "%IOS_PKG_DIR%\ios\" /E /Y /I /Q >nul
)
if exist "%ROOT_DIR%\mobileapp\lib" (
    mkdir "%IOS_PKG_DIR%\lib"
    xcopy "%ROOT_DIR%\mobileapp\lib" "%IOS_PKG_DIR%\lib\" /E /Y /I /Q >nul
)
if exist "%ROOT_DIR%\mobileapp\pubspec.yaml" copy /y "%ROOT_DIR%\mobileapp\pubspec.yaml" "%AND_PKG_DIR%\pubspec.yaml" >nul
if exist "%ROOT_DIR%\mobileapp\README.md" copy /y "%ROOT_DIR%\mobileapp\README.md" "%IOS_PKG_DIR%\README.md" >nul

:: Create ExportOptions.plist for Xcode distribution
(
    echo ^<?xml version="1.0" encoding="UTF-8"?^>
    echo ^<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"^>
    echo ^<plist version="1.0"^>
    echo ^<dict^>
    echo     ^<key^>method^</key^>
    echo     ^<string^>app-store^</string^>
    echo     ^<key^>signingStyle^</key^>
    echo     ^<string^>automatic^</string^>
    echo     ^<key^>stripSwiftSymbols^</key^>
    echo     ^<true/^>
    echo     ^<key^>uploadBitcode^</key^>
    echo     ^<false/^>
    echo     ^<key^>uploadSymbols^</key^>
    echo     ^<true/^>
    echo ^</dict^>
    echo ^</plist^>
) > "%IOS_PKG_DIR%\ExportOptions.plist"

:: Create iOS build script for macOS CI/CD
(
    echo #!/bin/bash
    echo set -e
    echo echo "Building gtax iOS Archive for App Store / TestFlight..."
    echo flutter pub get
    echo cd ios ^&^& pod install ^&^& cd ..
    echo flutter build ipa --release --export-options-plist=ExportOptions.plist
    echo echo "Build complete: build/ios/ipa/gtax.ipa"
) > "%IOS_PKG_DIR%\build_ios.sh"

:: Create Windows batch wrapper
(
    echo @echo off
    echo title gtax Mobile - iOS Build Helper
    echo echo =========================================================================
    echo echo   gtax Mobile - iOS Build Instructions
    echo echo =========================================================================
    echo echo NOTE: iOS compilation requires a macOS workstation or macOS CI runner.
    echo echo To build on macOS:
    echo echo   1. Transfer this folder to macOS.
    echo echo   2. Run: chmod +x build_ios.sh ^&^& ./build_ios.sh
    echo echo   3. Or open ios/Runner.xcworkspace in Xcode and archive.
    echo echo =========================================================================
    echo pause
) > "%IOS_PKG_DIR%\build_ios.bat"

:: Write README_IOS.txt
(
    echo =========================================================================
    echo   gtax Mobile - iOS Release Package
    echo   Version: %RELEASE_VERSION%  ^|  Build Timestamp: %TIMESTAMP%
    echo =========================================================================
    echo.
    echo PACKAGE CONTENTS:
    echo   - ios/                 : Xcode workspace, Runner project ^& Podfile
    echo   - lib/                 : Flutter / Dart cross-platform mobile source
    echo   - ExportOptions.plist  : Apple App Store / TestFlight signing config
    echo   - build_ios.sh         : Automated macOS build script
    echo   - build_ios.bat        : Instructions for Windows operators
    echo.
    echo STEPS TO PUBLISH TO APP STORE / TESTFLIGHT:
    echo   1. Transfer package to macOS machine or trigger GitHub Actions macOS runner.
    echo   2. Open 'ios/Runner.xcworkspace' in Xcode 15+.
    echo   3. Select Runner -^> Signing ^& Capabilities -^> Choose your Apple Team.
    echo   4. Run 'Product' -^> 'Archive' or execute './build_ios.sh'.
    echo =========================================================================
) > "%IOS_PKG_DIR%\README_IOS.txt"

:: Write Release Metadata
(
    echo {
    echo   "platform": "ios",
    echo   "version": "%RELEASE_VERSION%",
    echo   "timestamp": "%TIMESTAMP%",
    echo   "bundleIdentifier": "com.gtax.enterprise",
    echo   "workspace": "ios/Runner.xcworkspace"
    echo }
) > "%IOS_PKG_DIR%\RELEASE_INFO.json"

:: Create Zip Archive
echo [ZIP] Compressing iOS release archive:
echo       %IOS_ZIP_FILE%

if exist "%IOS_ZIP_FILE%" del /f /q "%IOS_ZIP_FILE%"

where tar >nul 2>&1
if !ERRORLEVEL! equ 0 (
    tar.exe -a -c -f "%IOS_ZIP_FILE%" -C "%ROOT_DIR%\release\ios\%IOS_FOLDER_NAME%" *
) else (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Compress-Archive -Path '%IOS_PKG_DIR%\*' -DestinationPath '%IOS_ZIP_FILE%' -Force"
)

echo [SUCCESS] iOS package created: %IOS_ZIP_FILE%
if "%TARGET_OPTION%"=="3" goto FINISH
goto CONTINUE_AFTER_IOS

:: -------------------------------------------------------------------------
:: ALL PLATFORMS SEQUENCE
:: -------------------------------------------------------------------------
:PUBLISH_ALL
call :PUBLISH_WINDOWS
:CONTINUE_AFTER_WINDOWS
call :PUBLISH_ANDROID
:CONTINUE_AFTER_ANDROID
call :PUBLISH_IOS
:CONTINUE_AFTER_IOS
goto FINISH

:: -------------------------------------------------------------------------
:: SUMMARY & COMPLETION
:: -------------------------------------------------------------------------
:FINISH
echo.
echo =========================================================================
echo   [COMPLETE] Release Publishing Completed Successfully!
echo =========================================================================
echo   Release Version: v%RELEASE_VERSION%
echo   Build Timestamp: %TIMESTAMP%
echo   Output Directory: %ROOT_DIR%\release\
echo.
if exist "%ROOT_DIR%\release\gtax_windows_v%RELEASE_VERSION%_%TIMESTAMP%.zip" (
    echo   [WINDOWS IIS]:
    echo     Folder: release\windows\gtax_windows_v%RELEASE_VERSION%_%TIMESTAMP%\
    echo     Zip:    release\gtax_windows_v%RELEASE_VERSION%_%TIMESTAMP%.zip
    echo     Note:   Extract to IIS root ^& overwrite; run update_iis.bat.
    echo.
)
if exist "%ROOT_DIR%\release\gtax_android_v%RELEASE_VERSION%_%TIMESTAMP%.zip" (
    echo   [ANDROID]:
    echo     Folder: release\android\gtax_android_v%RELEASE_VERSION%_%TIMESTAMP%\
    echo     Zip:    release\gtax_android_v%RELEASE_VERSION%_%TIMESTAMP%.zip
    echo     Note:   Contains Android Gradle, Dart source, and install_apk.bat.
    echo.
)
if exist "%ROOT_DIR%\release\gtax_ios_v%RELEASE_VERSION%_%TIMESTAMP%.zip" (
    echo   [iOS]:
    echo     Folder: release\ios\gtax_ios_v%RELEASE_VERSION%_%TIMESTAMP%\
    echo     Zip:    release\gtax_ios_v%RELEASE_VERSION%_%TIMESTAMP%.zip
    echo     Note:   Contains Xcode Runner, Podfile, ExportOptions.plist.
    echo.
)
echo =========================================================================
echo.
if "%ARG_TARGET%"=="" pause
exit /b 0
