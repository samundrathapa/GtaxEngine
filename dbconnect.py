"""
gtax Enterprise - dbconnect.py
Alias and CLI helper for DbConnects.
Allows:
  from dbconnect import DbConnects
  import dbconnect
  python dbconnect.py
"""
import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.BaseFrame.db.DbConnects import DbConnects

if __name__ == "__main__":
    print("=" * 70)
    print("gtax Enterprise - Dynamic Python Database Connector (dbconnect.py)")
    print("=" * 70)
    config = DbConnects.get_config()
    print(f"  Host:            {config['host']}")
    print(f"  Port:            {config['port']}")
    print(f"  Database Target: {config['database']}")
    print(f"  User:            {config['user']}")
    print(f"  Connection URL:  {config['db_url_masked']}")
    print("=" * 70)
    print("Testing connection...")
    pool = DbConnects.initialize_pool()
    if pool:
        res = DbConnects.execute_raw_query("SELECT current_database(), current_user, version();")
        print("Connected to PostgreSQL successfully:", res)
    else:
        print("Database not currently reachable from this terminal. Run within your local environment with PostgreSQL running.")
