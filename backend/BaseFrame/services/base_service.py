"""
Base Service: Encapsulates core business logic, validation, audit hooks, and caching.
"""
from typing import Any, Dict, List, Optional
from backend.BaseFrame.repo.base_repo import BaseRepo
from backend.BaseFrame.cache.redis_cache_manager import RedisCacheManager
from backend.BaseFrame.response.api_response import ApiResponse

class BaseService:
    def __init__(self, repository: BaseRepo, cache_prefix: str):
        self.repo = repository
        self.cache_prefix = cache_prefix

    def validate_data(self, data: Dict[str, Any], is_create: bool = True) -> Dict[str, List[str]]:
        """Override in subclasses for domain-specific validation rules."""
        errors: Dict[str, List[str]] = {}
        return errors

    def get_by_id(self, record_id: Any) -> ApiResponse:
        cache_key = f"{self.cache_prefix}:{record_id}"
        cached = RedisCacheManager.get(cache_key)
        if cached:
            import json
            return ApiResponse.build_success(data=json.loads(cached), message="Retrieved from cache")

        record = self.repo.get_by_id(record_id)
        if not record:
            return ApiResponse.build_failure(message=f"Record not found with ID {record_id}", status=404)

        RedisCacheManager.set(cache_key, record, ttl_seconds=300)
        return ApiResponse.build_success(data=record, message="Record fetched successfully")

    def list_records(self, limit: int = 100, offset: int = 0, filters: Dict[str, Any] = None) -> ApiResponse:
        records = self.repo.list_all(limit=limit, offset=offset, filters=filters)
        return ApiResponse.build_success(
            data={"items": records, "total": len(records), "limit": limit, "offset": offset},
            message="Records retrieved successfully"
        )

    def create(self, data: Dict[str, Any], user_id: str) -> ApiResponse:
        validation_errs = self.validate_data(data, is_create=True)
        if validation_errs:
            return ApiResponse.build_failure(
                message="Validation failed",
                validation_errors=validation_errs,
                status=422
            )

        new_record = self.repo.insert(data, user_id=user_id)
        RedisCacheManager.invalidate_prefix(self.cache_prefix)
        return ApiResponse.build_success(data=new_record, message="Record created successfully", status=201)

    def update(self, record_id: Any, data: Dict[str, Any], user_id: str) -> ApiResponse:
        existing = self.repo.get_by_id(record_id)
        if not existing:
            return ApiResponse.build_failure(message=f"Record {record_id} does not exist", status=404)

        validation_errs = self.validate_data(data, is_create=False)
        if validation_errs:
            return ApiResponse.build_failure(
                message="Validation failed",
                validation_errors=validation_errs,
                status=422
            )

        updated = self.repo.update(record_id, data, user_id=user_id)
        RedisCacheManager.delete(f"{self.cache_prefix}:{record_id}")
        return ApiResponse.build_success(data=updated, message="Record updated successfully")

    def delete(self, record_id: Any, user_id: str) -> ApiResponse:
        existing = self.repo.get_by_id(record_id)
        if not existing:
            return ApiResponse.build_failure(message=f"Record {record_id} does not exist", status=404)

        self.repo.soft_delete(record_id, user_id=user_id)
        RedisCacheManager.delete(f"{self.cache_prefix}:{record_id}")
        return ApiResponse.build_success(data={"deleted_id": record_id}, message="Record deleted successfully")
