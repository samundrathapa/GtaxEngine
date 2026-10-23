# gtax Enterprise - Database Migration Engine (Windows & Linux)

This folder (`dbmigration/`) contains the versioned database schema migration scripts for the **gtax Enterprise Tax Liabilities & Architecture Engine**.

---

## 🚀 Windows Batch Runner: `run_migrations.bat`

A Windows batch script is provided in the project root and in this folder.

### What it does:
1. **Auto-detects PostgreSQL**: Automatically searches your Windows installation for `psql.exe` across PostgreSQL 11 through 18 in `C:\Program Files\PostgreSQL\`.
2. **Creates User & Database**: Idempotently creates `gtax_user` (with password `gtax_password`) and `gtax_db` if they do not exist yet.
3. **Migration Tracker Table**: Creates `schema_version_tracker` inside `gtax_db` to record which files have already been executed.
4. **Applies Pending Migrations**: Executes only newly added `.sql` files in sorted alphabetical order (`V001` -> `V002` -> `V003`...).
5. **Auto-Run Watch Mode**: Continuously monitors this folder; as soon as you drop or save a new `.sql` file here, it applies it to PostgreSQL immediately!

---

## 💻 How to Use on Windows

### Option 1: Double-Click (Interactive Menu)
Simply double-click **`run_migrations.bat`**. You will see:

```
=========================================================================
       gtax Enterprise - Windows Database & Migration Manager
=========================================================================
 Target Host:       127.0.0.1:5432
 Target Database:   gtax_db
 Database User:     gtax_user
 Migration Folder:  C:\...\dbmigration
=========================================================================

 [1] Create Database + Run All Migrations (Full Setup)
 [2] Run Pending Migrations Only (Apply new .sql files)
 [3] Auto-Run Watch Mode (Automatically apply newly added .sql files)
 [4] View Migration History / Status
 [5] Exit

Enter choice [1-5] (default=1):
```

### Option 2: Command Line (CMD or PowerShell)

- **One-click run all pending migrations:**
  ```cmd
  run_migrations.bat
  ```

- **Run in Watch Mode (Auto-run on file addition):**
  ```cmd
  run_migrations.bat --watch
  ```
  *Leave this terminal window open in the background. Whenever you create a new migration like `V008__add_discount_table.sql`, it will detect and apply it within 3 seconds!*

- **View applied migration history:**
  ```cmd
  run_migrations.bat --status
  ```

---

## 📁 Naming Convention for New Migrations

When creating a new migration, place it in `dbmigration/` using standard flyway-style sequential naming:

```
V001__init_gtax_core_users.sql
V002__create_tax_jurisdictions.sql
V003__create_tax_rules_matrix.sql
V004__create_transactions_and_liabilities.sql
V005__create_realtime_sync_events.sql
V006__create_auth_and_session_tables.sql
V007__create_taxpayer_property_tables.sql
V008__your_new_custom_table.sql   <-- Next file to add!
```

---

## 🛡️ BaseFrame Mandatory 7 Audit Columns

Every table created must include the 7 mandatory BaseFrame audit columns:
```sql
insert_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM',
insert_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
update_by VARCHAR(64) NOT NULL DEFAULT 'SYSTEM',
update_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
delete_by VARCHAR(64) DEFAULT NULL,
deleted_on TIMESTAMP WITH TIME ZONE DEFAULT NULL,
is_active BOOLEAN DEFAULT TRUE NOT NULL
```
