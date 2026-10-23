@echo off
setlocal enabledelayedexpansion
title gtax Enterprise - Database & Migration Manager

:: =========================================================================
:: gtax Enterprise - Dynamic Windows PostgreSQL DB Setup & Auto-Migration Runner
:: Supports:
::   1. Dynamic .env resolution (reads DB_NAME, db_name, DB_USER, DB_PASSWORD, etc.)
::   2. Automatic detection of PostgreSQL bin path on Windows
::   3. Idempotent Database creation (e.g. gtax_db, gtax_dbtest) and User setup
::   4. Automatic migration tracking via schema_version_tracker
::   5. One-click migration execution for all .sql files in dbmigration\
::   6. Continuous Watch Mode to auto-apply newly added .sql files immediately
::   7. Clean & Reset option with default seed data and synchronized sequences
:: =========================================================================

:: Default Configuration
set "DB_HOST=127.0.0.1"
set "DB_PORT=5432"
set "DB_NAME=gtax_db"
set "DB_USER=gtax_user"
set "DB_PASSWORD=gtax_password"
set "PG_SUPERUSER=postgres"
set "PG_SUPERUSER_PASSWORD=postgres"

:: Locate .env file dynamically across possible directories
set "ENV_FILE="
if exist "%~dp0.env" set "ENV_FILE=%~dp0.env"
if exist "%~dp0..\.env" set "ENV_FILE=%~dp0..\.env"
if exist "%CD%\.env" set "ENV_FILE=%CD%\.env"

if not "%ENV_FILE%"=="" (
    for /f "usebackq tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
        set "VAR_KEY=%%A"
        set "VAR_VAL=%%B"
        for /f "tokens=* delims= " %%k in ("!VAR_KEY!") do set "VAR_KEY=%%k"
        if not "!VAR_KEY!"=="" (
            if "!VAR_KEY:~0,1!" neq "#" (
                for /f "tokens=*" %%v in ("!VAR_VAL!") do set "VAR_VAL=%%~v"
                if /i "!VAR_KEY!"=="DB_HOST" set "DB_HOST=!VAR_VAL!"
                if /i "!VAR_KEY!"=="db_host" set "DB_HOST=!VAR_VAL!"
                if /i "!VAR_KEY!"=="DB_PORT" set "DB_PORT=!VAR_VAL!"
                if /i "!VAR_KEY!"=="db_port" set "DB_PORT=!VAR_VAL!"
                if /i "!VAR_KEY!"=="DB_NAME" set "DB_NAME=!VAR_VAL!"
                if /i "!VAR_KEY!"=="db_name" set "DB_NAME=!VAR_VAL!"
                if /i "!VAR_KEY!"=="DATABASE_NAME" set "DB_NAME=!VAR_VAL!"
                if /i "!VAR_KEY!"=="DB_USER" set "DB_USER=!VAR_VAL!"
                if /i "!VAR_KEY!"=="db_user" set "DB_USER=!VAR_VAL!"
                if /i "!VAR_KEY!"=="DB_PASSWORD" set "DB_PASSWORD=!VAR_VAL!"
                if /i "!VAR_KEY!"=="db_password" set "DB_PASSWORD=!VAR_VAL!"
            )
        )
    )
)

:: CLI override: if user ran "run_migrations.bat gtax_dbtest" or similar
if not "%~1"=="" (
    set "ARG1=%~1"
    if "!ARG1:~0,1!" neq "-" (
        set "DB_NAME=%~1"
    )
)

:: Locate Migration Folder
set "MIGRATION_DIR=%~dp0dbmigration"
if not exist "%MIGRATION_DIR%" (
    if exist "%~dp0backend\DbMigration" (
        set "MIGRATION_DIR=%~dp0backend\DbMigration"
    ) else (
        if exist "%~dp0..\dbmigration" (
            set "MIGRATION_DIR=%~dp0..\dbmigration"
        ) else (
            mkdir "%~dp0dbmigration"
            set "MIGRATION_DIR=%~dp0dbmigration"
        )
    )
)

:: Find psql.exe on Windows
set "PSQL_CMD=psql"
where psql >nul 2>nul
if %ERRORLEVEL% equ 0 goto PSQL_FOUND

for %%V in (18 17 16 15 14 13 12 11 10) do (
    if exist "C:\Program Files\PostgreSQL\%%V\bin\psql.exe" (
        set "PATH=C:\Program Files\PostgreSQL\%%V\bin;!PATH!"
        set "PSQL_CMD=C:\Program Files\PostgreSQL\%%V\bin\psql.exe"
        goto PSQL_FOUND
    )
    if exist "C:\Program Files (x86)\PostgreSQL\%%V\bin\psql.exe" (
        set "PATH=C:\Program Files (x86)\PostgreSQL\%%V\bin;!PATH!"
        set "PSQL_CMD=C:\Program Files (x86)\PostgreSQL\%%V\bin\psql.exe"
        goto PSQL_FOUND
    )
)

echo =========================================================================
echo [ERROR] PostgreSQL 'psql.exe' was not found on your system!
echo =========================================================================
echo Please ensure PostgreSQL is installed. Common install path:
echo   C:\Program Files\PostgreSQL\^<version^>\bin\psql.exe
echo Add its 'bin' directory to your Windows PATH, or install from:
echo   https://www.postgresql.org/download/windows/
echo.
pause
exit /b 1

:PSQL_FOUND
:: CLI argument switches
if /i "%~1"=="--watch" goto DO_WATCH
if /i "%~1"=="-w" goto DO_WATCH
if /i "%~1"=="watch" goto DO_WATCH
if /i "%~1"=="--status" goto SHOW_STATUS
if /i "%~1"=="status" goto SHOW_STATUS
if /i "%~1"=="--run" goto DO_MIGRATE_ONLY
if /i "%~1"=="run" goto DO_MIGRATE_ONLY
if /i "%~1"=="--all" goto DO_FULL_SETUP
if /i "%~1"=="auto" goto DO_FULL_SETUP
if /i "%~1"=="--seed" goto DO_SEED_ONLY
if /i "%~1"=="seed" goto DO_SEED_ONLY

:MENU
cls
echo =========================================================================
echo        gtax Enterprise - Windows Database & Migration Manager
echo =========================================================================
echo  Target Host:       %DB_HOST%:%DB_PORT%
echo  Target Database:   %DB_NAME% (dynamically loaded from .env)
echo  Database User:     %DB_USER%
echo  Migration Folder:  %MIGRATION_DIR%
echo =========================================================================
echo.
echo  [1] Create Database + Run All Migrations (Full Setup)
echo  [2] Run Pending Migrations Only (Apply new .sql files in dbmigration\)
echo  [3] Auto-Run Watch Mode (Continuously auto-apply newly added .sql files)
echo  [4] Seed Default Data ^& Sync Sequences (tbl_user, tbl_role, taxpayers)
echo  [5] Clean ^& Re-Seed (Reset default users in %DB_NAME%)
echo  [6] View Migration History / Status
echo  [7] Exit
echo.
set /p "CHOICE=Enter choice [1-7] (default=1): "
if "%CHOICE%"=="" set "CHOICE=1"
if "%CHOICE%"=="1" goto DO_FULL_SETUP
if "%CHOICE%"=="2" goto DO_MIGRATE_ONLY
if "%CHOICE%"=="3" goto DO_WATCH
if "%CHOICE%"=="4" goto DO_SEED_ONLY
if "%CHOICE%"=="5" goto DO_CLEAN_RESEED
if "%CHOICE%"=="6" goto SHOW_STATUS
if "%CHOICE%"=="7" exit /b 0
goto MENU

:DO_FULL_SETUP
cls
echo =========================================================================
echo Step 1: Checking PostgreSQL Connection and Database Status...
echo =========================================================================

set "PGPASSWORD=%DB_PASSWORD%"
"%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -c "SELECT 1;" >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [OK] User '%DB_USER%' and Database '%DB_NAME%' are ready and accessible.
    goto INIT_TRACKER
)

echo Attempting to create user '%DB_USER%' and database '%DB_NAME%' via '%PG_SUPERUSER%'...
set "PGPASSWORD=%PG_SUPERUSER_PASSWORD%"
"%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%PG_SUPERUSER%" -d "postgres" -c "SELECT 1;" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo [PROMPT] Please enter password for PostgreSQL superuser '%PG_SUPERUSER%':
    set /p "PG_SUPERUSER_PASSWORD="
    set "PGPASSWORD=!PG_SUPERUSER_PASSWORD!"
)

echo Ensuring role '%DB_USER%' exists...
"%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%PG_SUPERUSER%" -d "postgres" -c "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '%DB_USER%') THEN CREATE ROLE %DB_USER% WITH LOGIN SUPERUSER PASSWORD '%DB_PASSWORD%'; ELSE ALTER ROLE %DB_USER% WITH LOGIN SUPERUSER PASSWORD '%DB_PASSWORD%'; END IF; END $$;" >nul 2>nul
"%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%PG_SUPERUSER%" -d "postgres" -c "ALTER ROLE %DB_USER% WITH PASSWORD '%DB_PASSWORD%';" >nul 2>nul

echo Ensuring database '%DB_NAME%' exists...
"%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%PG_SUPERUSER%" -d "postgres" -c "SELECT 1 FROM pg_database WHERE datname = '%DB_NAME%';" | findstr "1" >nul
if %ERRORLEVEL% neq 0 (
    "%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%PG_SUPERUSER%" -d "postgres" -c "CREATE DATABASE %DB_NAME% OWNER %DB_USER%;"
    echo [OK] Database '%DB_NAME%' created successfully.
) else (
    echo [OK] Database '%DB_NAME%' already exists.
)

"%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%PG_SUPERUSER%" -d "postgres" -c "GRANT ALL PRIVILEGES ON DATABASE %DB_NAME% TO %DB_USER%;" >nul 2>nul

:INIT_TRACKER
echo.
echo =========================================================================
echo Step 2: Initializing Migration Version Tracker Table in %DB_NAME%...
echo =========================================================================
set "PGPASSWORD=%DB_PASSWORD%"
"%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -c "CREATE TABLE IF NOT EXISTS schema_version_tracker (id SERIAL PRIMARY KEY, version_file VARCHAR(255) UNIQUE NOT NULL, applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL, status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS', execution_time_ms INTEGER DEFAULT 0);" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to connect to %DB_NAME% as %DB_USER%.
    echo Please verify credentials in .env.
    pause
    goto MENU
)
echo [OK] Tracker 'schema_version_tracker' is ready.

:DO_MIGRATE_ONLY
echo.
echo =========================================================================
echo Step 3: Scanning and Applying Pending Migrations from:
echo   %MIGRATION_DIR%
echo Target Database: %DB_NAME%
echo =========================================================================

set "PGPASSWORD=%DB_PASSWORD%"
set "TEMP_APPLIED=%TEMP%\gtax_applied_%RANDOM%.txt"
"%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -t -A -c "SELECT version_file FROM schema_version_tracker;" > "%TEMP_APPLIED%" 2>nul

set "APPLIED_COUNT=0"
set "SKIPPED_COUNT=0"
set "ERROR_COUNT=0"

for /f "delims=" %%F in ('dir /b /a-d /on "%MIGRATION_DIR%\*.sql" 2^>nul') do (
    set "FILE_NAME=%%F"
    findstr /x /c:"%%F" "%TEMP_APPLIED%" >nul 2>nul
    if !ERRORLEVEL! equ 0 (
        echo   [ALREADY APPLIED] %%F
        set /a SKIPPED_COUNT+=1
    ) else (
        echo   [APPLYING]        %%F ...
        "%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -v ON_ERROR_STOP=1 -f "%MIGRATION_DIR%\%%F" >nul 2>&1
        if !ERRORLEVEL! equ 0 (
            "%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -c "INSERT INTO schema_version_tracker (version_file, status) VALUES ('%%F', 'SUCCESS');" >nul 2>&1
            echo   [SUCCESS]         %%F applied successfully!
            set /a APPLIED_COUNT+=1
        ) else (
            echo   [FAILED]          Error executing %%F!
            "%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -v ON_ERROR_STOP=1 -f "%MIGRATION_DIR%\%%F"
            set /a ERROR_COUNT+=1
            del "%TEMP_APPLIED%" >nul 2>nul
            echo.
            echo Migration halted due to error in %%F.
            pause
            goto MENU
        )
    )
)

del "%TEMP_APPLIED%" >nul 2>nul

:: Automatically synchronize all serial sequences and verify default seed
goto DO_SEED_ONLY_QUIET

:DO_SEED_ONLY
cls
echo =========================================================================
echo Seeding Default Data and Synchronizing Sequences in %DB_NAME%...
echo =========================================================================
set "PGPASSWORD=%DB_PASSWORD%"

:DO_SEED_ONLY_QUIET
set "PGPASSWORD=%DB_PASSWORD%"
"%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -c "
DO \$\$
BEGIN
  -- 1. Ensure tbl_role has default roles
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tbl_role') THEN
    INSERT INTO tbl_role (id, role_name, description, insert_by, update_by) VALUES
    (1, 'superadmin', 'Unrestricted Master Control & System Oversight', 'SYSTEM_SEED', 'SYSTEM_SEED'),
    (2, 'admin', 'Corporate Tax Manager & Department Security Admin', 'SYSTEM_SEED', 'SYSTEM_SEED'),
    (3, 'operator', 'Tax Operations Specialist & Real-Time Sync Operator', 'SYSTEM_SEED', 'SYSTEM_SEED'),
    (4, 'user', 'Standard Tax Analyst & Invoicing Reviewer', 'SYSTEM_SEED', 'SYSTEM_SEED')
    ON CONFLICT (id) DO NOTHING;
    PERFORM setval(pg_get_serial_sequence('tbl_role', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_role), 0), 1));
  END IF;

  -- 2. Ensure tbl_user has default users
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tbl_user') THEN
    INSERT INTO tbl_user (id, fullname, email, password, mobile, employee_id, insert_by, insert_on, update_by, update_on, is_active) VALUES
    (1, 'Eleanor Vance (Chief Tax Officer)', 'superadmin@gtax.enterprise', 'Password123!', '+1 (555) 019-2831', 'EMP-SA-001', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true),
    (2, 'Marcus Thorne (Senior Tax Strategist)', 'admin@gtax.enterprise', 'Password123!', '+1 (555) 024-8192', 'EMP-ADM-002', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true),
    (3, 'Sarah Chen (Global Compliance Director)', 'operator@gtax.enterprise', 'Password123!', '+1 (555) 038-7241', 'EMP-OP-003', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true),
    (4, 'Julian Keller (Tax Analyst)', 'user@gtax.enterprise', 'Password123!', '+1 (555) 042-9918', 'EMP-USR-004', 'SYSTEM_SEED', NOW(), 'SYSTEM_SEED', NOW(), true)
    ON CONFLICT (email) DO NOTHING;
    PERFORM setval(pg_get_serial_sequence('tbl_user', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user), 0), 1));
  END IF;

  -- 3. Ensure tbl_user_role has assignments
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tbl_user_role') THEN
    INSERT INTO tbl_user_role (user_id, role_id, insert_by, update_by) VALUES
    (1, 1, 'SYSTEM_SEED', 'SYSTEM_SEED'),
    (2, 2, 'SYSTEM_SEED', 'SYSTEM_SEED'),
    (3, 3, 'SYSTEM_SEED', 'SYSTEM_SEED'),
    (4, 4, 'SYSTEM_SEED', 'SYSTEM_SEED')
    ON CONFLICT DO NOTHING;
    PERFORM setval(pg_get_serial_sequence('tbl_user_role', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user_role), 0), 1));
  END IF;

  -- 4. Ensure tbl_taxpayer has initial taxpayers
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tbl_taxpayer') THEN
    INSERT INTO tbl_taxpayer (taxpayer_code, full_name, pan_number, citizenship_number, phone_number, ward_no, tole_village, insert_by, update_by)
    VALUES
    ('TP-2081-0001', 'Ram Bahadur Thapa', '600123456', '27-01-70-12345', '9841234567', 3, 'Resunga Marg', 'SYSTEM_SEED', 'SYSTEM_SEED'),
    ('TP-2081-0002', 'Sita Maya Shrestha', '600987654', '27-01-72-98765', '9851098765', 4, 'Bhanu Chowk', 'SYSTEM_SEED', 'SYSTEM_SEED')
    ON CONFLICT (taxpayer_code) DO NOTHING;
    PERFORM setval(pg_get_serial_sequence('tbl_taxpayer', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_taxpayer), 0), 1));
  END IF;
END \$\$;
" >nul 2>nul

echo [OK] Default seed data verified and serial sequences synchronized in %DB_NAME%.
echo.
echo =========================================================================
echo Setup Complete for Database '%DB_NAME%'!
echo   Active users in tbl_user:
"%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -c "SELECT id, fullname, email, is_active FROM tbl_user ORDER BY id ASC;"
echo =========================================================================
echo.
if "%~1"=="" pause
if "%CHOICE%"=="4" goto MENU
if "%CHOICE%"=="2" goto MENU
if "%CHOICE%"=="1" goto MENU
exit /b 0

:DO_CLEAN_RESEED
cls
echo =========================================================================
echo Clean ^& Reset Default Data in Database: %DB_NAME%
echo =========================================================================
echo WARNING: This will reset tbl_user, tbl_role, and tbl_user_role to default!
echo.
set /p "CONFIRM=Are you sure you want to proceed? (Y/N): "
if /i "%CONFIRM%" neq "Y" goto MENU

set "PGPASSWORD=%DB_PASSWORD%"
"%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -c "
TRUNCATE TABLE tbl_user_role CASCADE;
TRUNCATE TABLE tbl_user CASCADE;
TRUNCATE TABLE tbl_role CASCADE;
" >nul 2>nul
echo Tables truncated cleanly. Re-seeding defaults...
goto DO_SEED_ONLY_QUIET

:SHOW_STATUS
cls
echo =========================================================================
echo         gtax Enterprise - Migration & Table Status Report (%DB_NAME%)
echo =========================================================================
set "PGPASSWORD=%DB_PASSWORD%"
echo Applied Migrations:
"%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -c "SELECT id, version_file, applied_at, status FROM schema_version_tracker ORDER BY id ASC;" 2>nul
echo.
echo Database Tables:
"%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name ASC;"
echo.
pause
goto MENU

:DO_WATCH
cls
echo =========================================================================
echo       gtax Enterprise - Auto-Migration Watch Mode ACTIVE
echo =========================================================================
echo  Monitoring Folder: %MIGRATION_DIR%
echo  Target Database:   %DB_NAME% (%DB_HOST%:%DB_PORT%)
echo.
echo  Drop any new .sql file (e.g. V008__new_table.sql) into:
echo    %MIGRATION_DIR%
echo  It will be automatically detected and applied immediately to %DB_NAME%!
echo.
echo  (Press Ctrl+C to stop watching at any time)
echo =========================================================================
echo.

set "PGPASSWORD=%DB_PASSWORD%"
"%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -c "CREATE TABLE IF NOT EXISTS schema_version_tracker (id SERIAL PRIMARY KEY, version_file VARCHAR(255) UNIQUE NOT NULL, applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL, status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS', execution_time_ms INTEGER DEFAULT 0);" >nul 2>nul

:WATCH_LOOP
set "TEMP_APPLIED=%TEMP%\gtax_applied_watch.txt"
"%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -t -A -c "SELECT version_file FROM schema_version_tracker;" > "%TEMP_APPLIED%" 2>nul

for /f "delims=" %%F in ('dir /b /a-d /on "%MIGRATION_DIR%\*.sql" 2^>nul') do (
    findstr /x /c:"%%F" "%TEMP_APPLIED%" >nul 2>nul
    if !ERRORLEVEL! neq 0 (
        echo.
        echo [!TIME!] New migration detected: %%F
        echo   Executing %%F on %DB_NAME%...
        "%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -v ON_ERROR_STOP=1 -f "%MIGRATION_DIR%\%%F"
        if !ERRORLEVEL! equ 0 (
            "%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -c "INSERT INTO schema_version_tracker (version_file, status) VALUES ('%%F', 'SUCCESS');" >nul 2>&1
            echo [!TIME!] [SUCCESS] %%F applied and recorded in schema_version_tracker!
            :: Sync sequence automatically
            "%PSQL_CMD%" -h "%DB_HOST%" -p "%DB_PORT%" -U "%DB_USER%" -d "%DB_NAME%" -c "DO \$\$ BEGIN IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tbl_user') THEN PERFORM setval(pg_get_serial_sequence('tbl_user', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM tbl_user), 0), 1)); END IF; END \$\$;" >nul 2>nul
            echo.
        ) else (
            echo [!TIME!] [ERROR] Failed to apply %%F! Please check SQL syntax.
            echo.
        )
    )
)

del "%TEMP_APPLIED%" >nul 2>nul
timeout /t 3 /nobreak >nul
goto WATCH_LOOP
