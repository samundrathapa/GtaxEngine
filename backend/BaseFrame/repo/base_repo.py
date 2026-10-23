"""
Base Repository: Manages database connections, raw SQL queries, and audit tracking.
All database raw queries are managed in this section.
"""
from typing import Any, Dict, List, Optional
import datetime
from backend.BaseFrame.db.DbConnects import DbConnects

class BaseRepo:
    def __init__(self, table_name: str, primary_key: str = "id"):
        self.table_name = table_name
        self.primary_key = primary_key

    def get_by_id(self, record_id: Any) -> Optional[Dict[str, Any]]:
        query = f"""
            SELECT * FROM {self.table_name} 
            WHERE {self.primary_key} = %s AND is_active = TRUE
        """
        rows = DbConnects.execute_raw_query(query, (record_id,))
        return rows[0] if rows else None

    def list_all(self, limit: int = 100, offset: int = 0, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        clauses = ["is_active = TRUE"]
        params = []
        if filters:
            for k, v in filters.items():
                clauses.append(f"{k} = %s")
                params.append(v)
        where_stmt = " AND ".join(clauses)
        query = f"""
            SELECT * FROM {self.table_name} 
            WHERE {where_stmt} 
            ORDER BY insert_on DESC 
            LIMIT %s OFFSET %s
        """
        params.extend([limit, offset])
        return DbConnects.execute_raw_query(query, tuple(params))

    def insert(self, data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """
        Inserts record with standard audit columns:
        insert_by, insert_on, update_by, update_on, delete_by, deleted_on, is_active
        """
        now = datetime.datetime.utcnow().isoformat()
        payload = data.copy()
        payload["insert_by"] = user_id
        payload["insert_on"] = now
        payload["update_by"] = user_id
        payload["update_on"] = now
        payload["delete_by"] = None
        payload["deleted_on"] = None
        payload["is_active"] = True

        cols = list(payload.keys())
        placeholders = [f"%s" for _ in cols]
        cols_str = ", ".join(cols)
        placeholders_str = ", ".join(placeholders)

        query = f"""
            INSERT INTO {self.table_name} ({cols_str}) 
            VALUES ({placeholders_str}) 
            RETURNING *
        """
        rows = DbConnects.execute_raw_query(query, tuple(payload.values()))
        return rows[0] if rows else payload

    def update(self, record_id: Any, data: Dict[str, Any], user_id: str) -> Optional[Dict[str, Any]]:
        now = datetime.datetime.utcnow().isoformat()
        payload = data.copy()
        payload["update_by"] = user_id
        payload["update_on"] = now

        set_clauses = [f"{k} = %s" for k in payload.keys()]
        set_str = ", ".join(set_clauses)
        params = list(payload.values())
        params.append(record_id)

        query = f"""
            UPDATE {self.table_name} 
            SET {set_str} 
            WHERE {self.primary_key} = %s AND is_active = TRUE 
            RETURNING *
        """
        rows = DbConnects.execute_raw_query(query, tuple(params))
        return rows[0] if rows else None

    def soft_delete(self, record_id: Any, user_id: str) -> bool:
        """
        Soft delete with delete_by, deleted_on, and is_active=False
        """
        now = datetime.datetime.utcnow().isoformat()
        query = f"""
            UPDATE {self.table_name} 
            SET is_active = FALSE, delete_by = %s, deleted_on = %s 
            WHERE {self.primary_key} = %s AND is_active = TRUE
        """
        DbConnects.execute_raw_query(query, (user_id, now, record_id))
        return True

    def execute_raw(self, raw_sql: str, params: tuple = None) -> List[Dict[str, Any]]:
        """Direct raw SQL execution for complex joins and multi-jurisdictional aggregations."""
        return DbConnects.execute_raw_query(raw_sql, params)
