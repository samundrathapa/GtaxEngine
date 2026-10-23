@echo off
setlocal enabledelayedexpansion
title gtax Enterprise - Production Server Launcher

echo =========================================================================
echo   gtax Enterprise - Windows Application Server
echo =========================================================================
echo.

:: Change to script directory
cd /d "%~dp0"

:: Check for Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js (v18, v20 or v22 LTS) from https://nodejs.org/
    pause
    exit /b 1
)

:: Ensure .env exists
if not exist ".env" (
    if exist ".env.example" (
        echo [INFO] Creating .env from .env.example...
        copy /y ".env.example" ".env" >nul
    )
)

:: Ensure logs directory exists
if not exist "logs" mkdir "logs"

:: Check dependencies
if not exist "node_modules" (
    echo [INFO] Installing required dependencies...
    call npm install --omit=dev
)

echo [INFO] Starting gtax Enterprise backend server on port 3000...
echo [INFO] Server logs writing to logs\server.log...
echo.

:: Launch via tsx or node
if exist "node_modules\tsx\dist\cli.mjs" (
    node "node_modules\tsx\dist\cli.mjs" server.ts
) else (
    npx tsx server.ts
)

pause
