@echo off
title gtax Enterprise - Dynamic Migration Creator (migrun)
setlocal enabledelayedexpansion

echo =========================================================================
echo       gtax Enterprise - Dynamic Migration File Generator
echo =========================================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    node "%~dp0..\..\scripts\migrun.js" %*
) else (
    echo [ERROR] Node.js is required to execute migrun generator.
    echo Please ensure Node.js is installed on your system.
    pause
    exit /b 1
)

if "%~1"=="" (
    echo.
    echo =========================================================================
    echo Migration generated! You can apply pending migrations now by running:
    echo   ..\..\run_migrations.bat
    echo or simply start/restart the server to auto-apply on startup!
    echo =========================================================================
    echo.
    pause
)
