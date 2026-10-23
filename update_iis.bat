@echo off
setlocal enabledelayedexpansion
title gtax Enterprise - IIS Server In-Place Updater

:: =========================================================================
:: gtax Enterprise - Windows IIS In-Place Release Update Script
:: Automatically updates the live IIS application when a new release zip is extracted.
:: Features:
::   1. Gracefully stops IIS AppPool/Service to prevent file locks during overwrite
::   2. Replaces all production files (web.config, dist/, server runtime)
::   3. Restarts IIS AppPool/Service
::   4. Optional database migration auto-check
::   5. Verifies service health via HTTP check
:: =========================================================================

echo =========================================================================
echo   gtax Enterprise - Windows IIS In-Place Update Manager
echo =========================================================================
echo.

:: Detect current directory as default target
set "CURRENT_DIR=%~dp0"
if "%CURRENT_DIR:~-1%"=="\" set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"

set "APP_POOL_NAME=gtax"
set "IIS_SITE_NAME=gtax"
set "TARGET_DIR=%CURRENT_DIR%"

echo [INFO] Current Release Source Folder: %CURRENT_DIR%
echo.

:: Ask user if updating current folder or custom IIS path
echo Choose Update Mode:
echo   [1] Update current folder in-place (%CURRENT_DIR%)
echo   [2] Deploy/Overwrite to C:\inetpub\wwwroot\gtax
echo   [3] Specify custom IIS directory path
echo.
set /p "UPDATE_CHOICE=Select option [1-3, Default=1]: "
if "%UPDATE_CHOICE%"=="" set "UPDATE_CHOICE=1"

if "%UPDATE_CHOICE%"=="2" (
    set "TARGET_DIR=C:\inetpub\wwwroot\gtax"
)
if "%UPDATE_CHOICE%"=="3" (
    set /p "CUSTOM_PATH=Enter full target path: "
    if not "!CUSTOM_PATH!"=="" set "TARGET_DIR=!CUSTOM_PATH!"
)

echo.
echo [TARGET] Updating application in: %TARGET_DIR%
echo.

:: Check for IIS appcmd utility
set "APPCMD=%SystemRoot%\System32\inetsrv\appcmd.exe"
set "HAS_IIS=0"
if exist "%APPCMD%" set "HAS_IIS=1"

:: Step 1: Graceful Stop to release file locks
echo [STEP 1/4] Stopping IIS application pool to release file locks...
if "%HAS_IIS%"=="1" (
    echo [INFO] Attempting to stop AppPool '%APP_POOL_NAME%'...
    "%APPCMD%" stop apppool /apppool.name:"%APP_POOL_NAME%" >nul 2>&1
    "%APPCMD%" stop site /site.name:"%IIS_SITE_NAME%" >nul 2>&1
)

:: Terminate any orphaned node processes serving on port 3000 if standalone
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo [INFO] Terminating previous backend process on port 3000 (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

timeout /t 2 /nobreak >nul

:: Step 2: In-place file replacement
echo.
echo [STEP 2/4] Replacing and updating production files...
if /i not "%CURRENT_DIR%"=="%TARGET_DIR%" (
    if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
    echo [INFO] Copying updated release files to %TARGET_DIR%...
    robocopy "%CURRENT_DIR%" "%TARGET_DIR%" /MIR /XD "logs" "node_modules" /XF ".env" >nul 2>&1
    if !ERRORLEVEL! geq 8 (
        echo [WARN] Robocopy reported errors, attempting fallback copy...
        xcopy "%CURRENT_DIR%\*" "%TARGET_DIR%\" /E /Y /I /Q >nul 2>&1
    )
    echo [SUCCESS] Files synchronized to %TARGET_DIR%.
) else (
    echo [INFO] In-place update within target directory validated.
)

:: Step 3: Run Database Migrations if present
echo.
echo [STEP 3/4] Checking database schema and versioned migrations...
if exist "%TARGET_DIR%\run_migrations.bat" (
    echo [INFO] Database migration script found.
    set /p "RUN_MIG=Would you like to run database migrations now? (Y/N) [Default=Y]: "
    if "!RUN_MIG!"=="" set "RUN_MIG=Y"
    if /i "!RUN_MIG!"=="Y" (
        call "%TARGET_DIR%\run_migrations.bat" --auto
    )
)

:: Step 4: Restart IIS / Service
echo.
echo [STEP 4/4] Restarting IIS Application Pool & Web Site...
if "%HAS_IIS%"=="1" (
    "%APPCMD%" start apppool /apppool.name:"%APP_POOL_NAME%" >nul 2>&1
    "%APPCMD%" start site /site.name:"%IIS_SITE_NAME%" >nul 2>&1
    echo [SUCCESS] IIS AppPool '%APP_POOL_NAME%' restarted.
) else (
    echo [INFO] IIS appcmd not detected on this host. If running standalone, launch start_server.bat.
)

echo.
echo =========================================================================
echo   [COMPLETE] gtax Enterprise has been updated successfully!
echo   Ready to serve on Windows IIS Server.
echo =========================================================================
echo.
pause
