# gtax Enterprise - PostgreSQL Database Configuration Guide

> **For existing PostgreSQL installations**: If you already have PostgreSQL installed on your machine or server, you do **NOT** need to install a separate database. You only need to create the database (`gtax_db`), the database user (`gtax_user`), set the password (`gtax_password`), and run the schema initialization script.

---

## 📌 Why `gtax_db` was not showing up initially

When PostgreSQL is installed, it creates default template databases (`postgres`, `template0`, `template1`). It does not automatically create application-specific databases.  
To use your existing PostgreSQL instance with **gtax**, follow the quick steps below to create `gtax_db` and grant permissions.

---

## 🚀 Quick Setup (Choose Option A or Option B)

### Option A: One-Command Setup (Recommended)

Run the all-in-one setup script as the PostgreSQL superuser (`postgres`):

#### On Linux (Ubuntu / Debian / CentOS):
```bash
sudo -u postgres psql -f database/setup_gtax_db.sql
```
*Or execute the automated helper script:*
```bash
chmod +x database/setup_postgres.sh
./database/setup_postgres.sh
```

#### On macOS:
```bash
psql -U postgres -f database/setup_gtax_db.sql
```

#### On Windows (PowerShell / Command Prompt):
```cmd
psql -U postgres -f database\setup_gtax_db.sql
```

---

### Option B: Step-by-Step Manual Commands

If you prefer executing SQL commands manually or using a GUI tool (such as **pgAdmin** or **DBeaver**):

#### Step 1: Connect as superuser and create user & database
Open `psql -U postgres` and paste:
```sql
-- 1. Create User
CREATE ROLE gtax_user LOGIN PASSWORD 'gtax_password';
ALTER ROLE gtax_user CREATEDB;

-- 2. Create Database
CREATE DATABASE gtax_db OWNER gtax_user;

-- 3. Grant Privileges
GRANT ALL PRIVILEGES ON DATABASE gtax_db TO gtax_user;

-- 4. Connect to gtax_db and set schema permissions
\connect gtax_db
GRANT ALL ON SCHEMA public TO gtax_user;
ALTER SCHEMA public OWNER TO gtax_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gtax_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gtax_user;
```

#### Step 2: Initialize Tables & Base Seed Data
Execute the schema script into `gtax_db`:
```bash
PGPASSWORD='gtax_password' psql -h localhost -U gtax_user -d gtax_db -f database/02_init_gtax_schema.sql
```

---

## ⚙️ Where to Change DB Config in the Codebase

All database connection settings are centralized in **environment variables** and handled gracefully by the pool manager:

### 1. In `.env` (Root Directory)
Create or edit `.env` in the root folder:

```env
# =========================================================================
# gtax Database Configuration (100% Dynamic)
# =========================================================================
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="gtax_db"       # Or change to any database, e.g. "gtax_dbtest"
DB_USER="gtax_user"
DB_PASSWORD="gtax_password"
DB_SSL="false"

# Optional: If specified alongside DB_NAME, the explicit DB_NAME dynamically overrides
# the database name inside DATABASE_URL!
# DATABASE_URL="postgresql://gtax_user:gtax_password@localhost:5432/gtax_db"
```

### 2. Code-Level Configuration Locations

| Component | File Path | Description |
| :--- | :--- | :--- |
| **Node.js / Express DB Pool** | `src/server/db/postgresPool.ts` | Fully dynamic `pg.Pool` manager. Reads `DB_NAME` / `db_name` and dynamically rewrites `DATABASE_URL` target. Automatically bootstraps default data and synchronizes serial sequences. |
| **BaseFrame DB Connector** | `src/server/BaseFrame/db/DbConnects.ts` | Delegates raw query execution to `postgresPool.ts` with transparent fallback. Dynamic DB name stats. |
| **Python BaseFrame Connector**| `backend/BaseFrame/db/DbConnects.py` | Dynamic Python connector reading `.env`, `DB_NAME`, and auto-updating connection string. |
| **Python CLI Helper** | `dbconnect.py` | Top-level Python script for inspecting database config and testing connectivity (`python dbconnect.py`). |
| **Windows Migration Runner** | `run_migrations.bat` | Windows batch file to auto-create DB, run pending migrations from `dbmigration\`, and watch for new files. |
| **Environment Template** | `.env.example` | Template file showing all available database variables. |

---

## 🔍 How to Verify the Database Connection

### 1. In PostgreSQL terminal (`psql`):
```sql
-- List databases (gtax_db should now appear)
\l

-- Connect to gtax_db
\c gtax_db

-- List all tables (should show tbl_taxpayer, tbl_property_master, etc.)
\dt
```

### 2. Via Live Health API:
Make an HTTP GET request to the running server:
```bash
curl http://localhost:3000/api/v1/db/status
```
Example response:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "connected": true,
    "mode": "POSTGRESQL_LIVE",
    "config": {
      "host": "localhost",
      "port": 5432,
      "database": "gtax_db",
      "user": "gtax_user",
      "password": "******",
      "connectionString": "postgresql://gtax_user:******@localhost:5432/gtax_db"
    },
    "lastError": null
  },
  "message": "Database connection status and configuration"
}
```

---

## 🛡️ The 7 Mandatory Audit Columns Contract

Every table in `gtax_db` automatically enforces the 7 mandatory audit columns:
1. `insert_by`: User ID or system actor who created the record.
2. `insert_on`: Timestamp of record creation (UTC).
3. `update_by`: User ID or system actor who last modified the record.
4. `update_on`: Timestamp of last modification (UTC).
5. `delete_by`: User ID who soft-deleted the record (`NULL` if active).
6. `deleted_on`: Timestamp of soft-deletion (`NULL` if active).
7. `is_active`: Boolean flag (`TRUE` = active record, `FALSE` = soft-deleted).

---

## 🛠️ Summary of Provided Files in `database/`

- **`database/navicat_setup_gtax_db.sql`**: Pure SQL script with NO backslash commands, designed specifically for Navicat, DBeaver, and pgAdmin.
- **`database/setup_gtax_db.sql`**: All-in-one terminal script for psql (creates user, database, permissions, and all tables).
- **`database/01_create_database_and_user.sql`**: Creates `gtax_user` and `gtax_db` via terminal psql.
- **`database/02_init_gtax_schema.sql`**: Creates all municipal tables, foreign keys, and default seed data.
- **`database/setup_postgres.sh`**: Executable bash script for automated local execution.

---

## 🧭 Navicat Connection & "Password Authentication Failed" Solutions

### 1. Navicat Connection Settings
When creating a new PostgreSQL connection in Navicat:

| Field | Value | Notes |
| :--- | :--- | :--- |
| **Connection Name** | `gtax_local` | Any friendly name |
| **Host** | **`127.0.0.1`** | ⚠️ Use `127.0.0.1` instead of `localhost` (avoids IPv6 `::1` resolution errors) |
| **Port** | `5432` | Default PostgreSQL port |
| **Initial Database** | `gtax_db` | Or `postgres` if you haven't created `gtax_db` yet |
| **User Name** | `gtax_user` | Exactly `gtax_user` (case-sensitive) |
| **Password** | `gtax_password` | Exactly `gtax_password` |

---

### 2. Fixing "Password authentication failed for user" in Navicat

If you see `FATAL: password authentication failed for user "gtax_user"`, follow these steps:

#### Fix 1: Did you run `setup_gtax_db.sql` inside Navicat?
`setup_gtax_db.sql` contains `psql` terminal meta-commands (`\gexec`, `\connect`, `\i`). **Navicat does not support backslash commands**, so the script failed halfway and `gtax_user` was never created or its password was skipped.
👉 **Solution**: Connect to your PostgreSQL server in Navicat as **`postgres`** (the superuser), open **Query Editor**, and run:
```sql
-- 1. Create or update gtax_user
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'gtax_user') THEN
      CREATE ROLE gtax_user WITH LOGIN PASSWORD 'gtax_password' CREATEDB SUPERUSER;
   ELSE
      ALTER ROLE gtax_user WITH LOGIN PASSWORD 'gtax_password';
   END IF;
END $$;

-- 2. Explicitly set password
ALTER ROLE gtax_user WITH PASSWORD 'gtax_password';
```
*(Or execute the pure SQL script `database/navicat_setup_gtax_db.sql`)*

---

#### Fix 2: Password Encryption Mismatch (SCRAM-SHA-256 vs MD5)
PostgreSQL 13, 14, 15, and 16 default to `scram-sha-256` password hashing. **Older versions of Navicat (Navicat 12, 15, or older Navicat 16 releases) cannot negotiate SCRAM-SHA-256 and will fail with password authentication error.**

👉 **Solution**: In Navicat (logged in as `postgres`), force the password to be hashed using the algorithm your Navicat supports:

**For Navicat 12 / 15 / Legacy versions:**
```sql
SET password_encryption = 'md5';
ALTER ROLE gtax_user WITH PASSWORD 'gtax_password';
```

**For Navicat 16 / 17 (Modern):**
```sql
SET password_encryption = 'scram-sha-256';
ALTER ROLE gtax_user WITH PASSWORD 'gtax_password';
```

---

#### Fix 3: Change Host from `localhost` to `127.0.0.1`
In Navicat's Connection properties, change **Host** from `localhost` to `127.0.0.1`.  
On many Windows, Linux, and macOS systems, `localhost` resolves to IPv6 address `::1`. If your PostgreSQL `pg_hba.conf` does not allow password auth on `::1`, authentication will fail even with the correct password.

---

#### Fix 4: Verify the User Actually Exists in PostgreSQL
Run this query as `postgres` to verify `gtax_user` exists and can log in:
```sql
SELECT rolname, rolcanlogin, rolsuper, rolcreatedb 
FROM pg_roles 
WHERE rolname = 'gtax_user';
```
You should see:
- `rolname`: `gtax_user`
- `rolcanlogin`: `true`

