#!/usr/bin/env bash
# =========================================================================
# gtax Enterprise - PostgreSQL Automated Setup Helper
# Run this on your system where PostgreSQL is installed
# =========================================================================

set -e

echo "========================================================="
echo "   gtax Enterprise - PostgreSQL Database Initialization  "
echo "========================================================="

DB_NAME=${DB_NAME:-"gtax_db"}
DB_USER=${DB_USER:-"gtax_user"}
DB_PASSWORD=${DB_PASSWORD:-"gtax_password"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}

echo "Target Database: $DB_NAME"
echo "Target User:     $DB_USER"
echo "Target Host:     $DB_HOST:$DB_PORT"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "⚠️  psql command not found in current PATH."
    echo "If PostgreSQL is installed on a separate server or container, run the SQL script manually:"
    echo "   psql -h <POSTGRES_HOST> -U postgres -f database/setup_gtax_db.sql"
    exit 1
fi

echo "Step 1: Creating database $DB_NAME and user $DB_USER..."
if [ "$(id -u)" -eq 0 ] || command -v sudo &> /dev/null; then
    echo "Running with sudo -u postgres..."
    sudo -u postgres psql -f "$(dirname "$0")/01_create_database_and_user.sql"
else
    echo "Running psql as current user..."
    psql -U postgres -f "$(dirname "$0")/01_create_database_and_user.sql"
fi

echo ""
echo "Step 2: Initializing schema tables with 7 mandatory audit columns..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/02_init_gtax_schema.sql"

echo ""
echo "========================================================="
echo "✅ Database $DB_NAME is fully initialized and ready!"
echo "Configuration in your .env file should be:"
echo "DB_HOST=\"$DB_HOST\""
echo "DB_PORT=\"$DB_PORT\""
echo "DB_NAME=\"$DB_NAME\""
echo "DB_USER=\"$DB_USER\""
echo "DB_PASSWORD=\"$DB_PASSWORD\""
echo "DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME\""
echo "========================================================="
