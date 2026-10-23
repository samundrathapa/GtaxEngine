"""
Redis Cache Manager and Lightweight Dapper-style ORM Mapper.
Handles high-throughput caching, key namespaces, TTL policies, and model materialization.
"""
import os
import json
import redis
from typing import Any, Optional, Type, TypeVar, List
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)

class RedisCacheManager:
    _client = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            redis_host = os.getenv("REDIS_HOST", "localhost")
            redis_port = int(os.getenv("REDIS_PORT", "6379"))
            redis_db = int(os.getenv("REDIS_DB", "0"))
            cls._client = redis.Redis(
                host=redis_host, 
                port=redis_port, 
                db=redis_db, 
                decode_responses=True
            )
        return cls._client

    @classmethod
    def get(cls, key: str) -> Optional[str]:
        try:
            return cls.get_client().get(key)
        except Exception:
            return None

    @classmethod
    def set(cls, key: str, value: Any, ttl_seconds: int = 3600) -> bool:
        try:
            val_str = json.dumps(value) if not isinstance(value, str) else value
            cls.get_client().setex(key, ttl_seconds, val_str)
            return True
        except Exception:
            return False

    @classmethod
    def delete(cls, key: str) -> bool:
        try:
            cls.get_client().delete(key)
            return True
        except Exception:
            return False

    @classmethod
    def invalidate_prefix(cls, prefix: str):
        try:
            client = cls.get_client()
            keys = client.keys(f"{prefix}*")
            if keys:
                client.delete(*keys)
        except Exception:
            pass

class DapperMapper:
    """
    Lightweight Dapper-style micro-ORM mapper for Python.
    Maps raw database cursor tuples or dictionaries directly to typed Pydantic models.
    """
    @staticmethod
    def query(model_cls: Type[T], raw_rows: List[dict]) -> List[T]:
        results = []
        for row in raw_rows:
            try:
                results.append(model_cls(**row))
            except Exception as e:
                # Fallback to permissive dict initialization
                results.append(model_cls.model_construct(**row))
        return results

    @staticmethod
    def query_first(model_cls: Type[T], raw_rows: List[dict]) -> Optional[T]:
        items = DapperMapper.query(model_cls, raw_rows)
        return items[0] if items else None
