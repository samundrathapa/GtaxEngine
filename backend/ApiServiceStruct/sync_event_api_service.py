"""
ApiServiceStruct: SyncEventApiService
Inherits base CRUD properties directly from BaseFrame architecture for real-time synchronization events.
"""
from typing import Dict, List, Any
from backend.BaseFrame.repo.base_repo import BaseRepo
from backend.BaseFrame.services.base_service import BaseService
from backend.BaseFrame.controller.base_crud_controller import BaseCrudController
from backend.BaseFrame.response.api_response import ApiResponse

class SyncEventRepo(BaseRepo):
    def __init__(self):
        super().__init__(table_name="realtime_sync_events", primary_key="event_id")

class SyncEventService(BaseService):
    def __init__(self):
        self.sync_repo = SyncEventRepo()
        super().__init__(repository=self.sync_repo, cache_prefix="gtax:sync_events")

    def broadcast_sync(self, event_type: str, aggregate_id: str, payload: Dict[str, Any], user_id: str) -> ApiResponse:
        data = {
            "event_id": f"EVT_{aggregate_id}_{int(__import__('time').time())}",
            "aggregate_type": "tax_liability",
            "aggregate_id": aggregate_id,
            "event_version": 1,
            "event_type": event_type,
            "source_service": "gtax-realtime-sync",
            "target_jurisdictions": ["US-FED", "US-CA", "EU-VAT"],
            "payload": payload,
            "checksum_hash": "sha256-verified-sync-token",
            "status": "DELIVERED"
        }
        res = self.create(data, user_id=user_id)
        return res

class SyncEventController(BaseCrudController):
    def __init__(self):
        self.sync_service = SyncEventService()
        super().__init__(
            prefix="/api/v1/sync-events",
            service=self.sync_service,
            tag="Sync Events (Inherited BaseFrame CRUD)",
            required_roles=["admin", "system_sync"]
        )

sync_event_api_router = SyncEventController().get_router()
