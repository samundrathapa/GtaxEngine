@echo off
setlocal enabledelayedexpansion
title gtax Enterprise - Automatic Release Asset Copier

:: =========================================================================
:: gtax Enterprise - Automatic Release Asset Synchronization Script
:: Automatically copies all frontend dist, public assets, server files,
:: data stores, migration scripts, and configuration files into the release directory.
:: =========================================================================

set "ROOT_DIR=%~dp0"
if "%ROOT_DIR:~-1%"=="\" set "ROOT_DIR=%ROOT_DIR:~0,-1%"
cd /d "%ROOT_DIR%"

echo =========================================================================
echo   gtax Enterprise - Automatic Release Asset Sync
echo =========================================================================
echo   Workspace: %ROOT_DIR%
echo =========================================================================
echo.

:: Detect or create target release folder
set "TARGET_DIR=%~1"
if "%TARGET_DIR%"=="" (
    :: Find newest directory in release\windows or default to release\latest
    if exist "%ROOT_DIR%\release\windows" (
        for /f "delims=" %%i in ('dir /b /ad /o-d "%ROOT_DIR%\release\windows" 2^>nul') do (
            set "TARGET_DIR=%ROOT_DIR%\release\windows\%%i"
            goto TARGET_FOUND
        )
    )
    set "TARGET_DIR=%ROOT_DIR%\release\latest"
)

:TARGET_FOUND
echo [INFO] Copying assets to target directory:
echo        %TARGET_DIR%
echo.

if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

:: 1. Copy Frontend Build (dist/)
if exist "%ROOT_DIR%\dist" (
    echo [COPY] Synchronizing dist\ ...
    if not exist "%TARGET_DIR%\dist" mkdir "%TARGET_DIR%\dist"
    xcopy "%ROOT_DIR%\dist" "%TARGET_DIR%\dist\" /E /Y /I /Q >nul
)

:: 2. Copy Public Assets (public/)
if exist "%ROOT_DIR%\public" (
    echo [COPY] Synchronizing public\ assets ...
    if not exist "%TARGET_DIR%\public" mkdir "%TARGET_DIR%\public"
    xcopy "%ROOT_DIR%\public" "%TARGET_DIR%\public\" /E /Y /I /Q >nul
)

:: 3. Copy Data Stores (data/)
if exist "%ROOT_DIR%\data" (
    echo [COPY] Synchronizing data\ stores ...
    if not exist "%TARGET_DIR%\data" mkdir "%TARGET_DIR%\data"
    xcopy "%ROOT_DIR%\data" "%TARGET_DIR%\data\" /E /Y /I /Q >nul
)

:: 4. Copy Scripts (scripts/)
if exist "%ROOT_DIR%\scripts" (
    echo [COPY] Synchronizing scripts\ ...
    if not exist "%TARGET_DIR%\scripts" mkdir "%TARGET_DIR%\scripts"
    xcopy "%ROOT_DIR%\scripts" "%TARGET_DIR%\scripts\" /E /Y /I /Q >nul
)

:: 5. Copy Database Migrations (DbMigration/)
if exist "%ROOT_DIR%\DbMigration" (
    echo [COPY] Synchronizing DbMigration\ ...
    if not exist "%TARGET_DIR%\DbMigration" mkdir "%TARGET_DIR%\DbMigration"
    xcopy "%ROOT_DIR%\DbMigration" "%TARGET_DIR%\DbMigration\" /E /Y /I /Q >nul
)

:: 6. Copy Source Code (src/, server/, ai/)
if exist "%ROOT_DIR%\src" (
    echo [COPY] Synchronizing src\ ...
    if not exist "%TARGET_DIR%\src" mkdir "%TARGET_DIR%\src"
    xcopy "%ROOT_DIR%\src" "%TARGET_DIR%\src\" /E /Y /I /Q >nul
)
if exist "%ROOT_DIR%\server" (
    echo [COPY] Synchronizing server\ ...
    if not exist "%TARGET_DIR%\server" mkdir "%TARGET_DIR%\server"
    xcopy "%ROOT_DIR%\server" "%TARGET_DIR%\server\" /E /Y /I /Q >nul
)
if exist "%ROOT_DIR%\ai" (
    echo [COPY] Synchronizing ai\ ...
    if not exist "%TARGET_DIR%\ai" mkdir "%TARGET_DIR%\ai"
    xcopy "%ROOT_DIR%\ai" "%TARGET_DIR%\ai\" /E /Y /I /Q >nul
)

:: 7. Copy Root Configuration & Batch Scripts
echo [COPY] Synchronizing root batch and config files ...
if exist "%ROOT_DIR%\web.config" copy /y "%ROOT_DIR%\web.config" "%TARGET_DIR%\web.config" >nul
if exist "%ROOT_DIR%\update_iis.bat" copy /y "%ROOT_DIR%\update_iis.bat" "%TARGET_DIR%\update_iis.bat" >nul
if exist "%ROOT_DIR%\start_server.bat" copy /y "%ROOT_DIR%\start_server.bat" "%TARGET_DIR%\start_server.bat" >nul
if exist "%ROOT_DIR%\run_migrations.bat" copy /y "%ROOT_DIR%\run_migrations.bat" "%TARGET_DIR%\run_migrations.bat" >nul
if exist "%ROOT_DIR%\migrun.bat" copy /y "%ROOT_DIR%\migrun.bat" "%TARGET_DIR%\migrun.bat" >nul
if exist "%ROOT_DIR%\publish_release.bat" copy /y "%ROOT_DIR%\publish_release.bat" "%TARGET_DIR%\publish_release.bat" >nul
if exist "%ROOT_DIR%\package.json" copy /y "%ROOT_DIR%\package.json" "%TARGET_DIR%\package.json" >nul
if exist "%ROOT_DIR%\tsconfig.json" copy /y "%ROOT_DIR%\tsconfig.json" "%TARGET_DIR%\tsconfig.json" >nul
if exist "%ROOT_DIR%\.env.example" copy /y "%ROOT_DIR%\.env.example" "%TARGET_DIR%\.env.example" >nul
if exist "%ROOT_DIR%\server.ts" copy /y "%ROOT_DIR%\server.ts" "%TARGET_DIR%\server.ts" >nul

echo.
echo =========================================================================
echo   [SUCCESS] All assets and files successfully copied to:
echo   %TARGET_DIR%
echo =========================================================================
echo.
pause
