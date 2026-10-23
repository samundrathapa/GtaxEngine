=========================================================================
gtax Enterprise - Windows IIS In-Place Update Guide
Version: 1.0.0  |  Build Timestamp: 20261023_094602
=========================================================================

UPDATING YOUR RUNNING IIS SERVER:
-------------------------------------------------------------------------
Option A (Direct Overwrite - Recommended):
  1. Stop your IIS Application Pool (or let update_iis.bat do it for you).
  2. Extract all contents of this ZIP file directly into your IIS website root:
     Default path: C:\inetpub\wwwroot\gtax
  3. Select 'Yes to All' when prompted to replace existing files.
  4. Right-click 'update_iis.bat' and select 'Run as Administrator'.
     This script will:
       - Ensure AppPool locks are released
       - Synchronize files cleanly
       - Run any pending database migrations
       - Restart the IIS AppPool and Site

Option B (Automated Synchronizer):
  1. Extract this zip into any temporary folder (e.g., C:\Deploy\v1.0.0).
  2. Run 'update_iis.bat' and select option [2] or enter your IIS folder.

CONFIGURATION FILES:
  - web.config: Pre-configured with SPA fallback & Reverse Proxy to port 3000.
  - start_server.bat: Launches backend Node.js server.
  - run_migrations.bat: Manages PostgreSQL schemas and seed data.
=========================================================================