"""
Base CRUD Controller: Auto-registers REST endpoints onto FastAPI routers.
Dispatches requests through services and handles standardized responses.
"""
from typing import Any, Dict, Optional, Type
from fastapi import APIRouter, Depends, Query, Path
from pydantic import BaseModel
from backend.BaseFrame.services.base_service import BaseService
from backend.BaseFrame.response.api_response import ApiResponse
from backend.BaseFrame.auth.rbac_handler import RbacHandler, CurrentUser

class BaseCrudController:
    def __init__(
        self,
        prefix: str,
        service: BaseService,
        tag: str,
        create_schema: Type[BaseModel] = None,
        update_schema: Type[BaseModel] = None,
        required_roles: list = None
    ):
        self.router = APIRouter(prefix=prefix, tags=[tag])
        self.service = service
        self.create_schema = create_schema or BaseModel
        self.update_schema = update_schema or BaseModel
        self.required_roles = required_roles or ["user", "admin", "tax_accountant"]
        self._register_crud_routes()

    def _register_crud_routes(self):
        """Registers the 5 fundamental CRUD endpoints wired to base service."""

        @self.router.get("", response_model=ApiResponse)
        def list_all(
            limit: int = Query(default=100, ge=1, le=1000),
            offset: int = Query(default=0, ge=0),
            current_user: CurrentUser = Depends(RbacHandler.require_roles(self.required_roles))
        ):
            return self.service.list_records(limit=limit, offset=offset)

        @self.router.get("/{record_id}", response_model=ApiResponse)
        def get_one(
            record_id: str = Path(...),
            current_user: CurrentUser = Depends(RbacHandler.require_roles(self.required_roles))
        ):
            return self.service.get_by_id(record_id)

        @self.router.post("", response_model=ApiResponse, status_code=201)
        def create(
            payload: Dict[str, Any],
            current_user: CurrentUser = Depends(RbacHandler.require_roles(self.required_roles))
        ):
            return self.service.create(data=payload, user_id=current_user.user_id)

        @self.router.put("/{record_id}", response_model=ApiResponse)
        def update(
            record_id: str = Path(...),
            payload: Dict[str, Any] = None,
            current_user: CurrentUser = Depends(RbacHandler.require_roles(self.required_roles))
        ):
            return self.service.update(record_id, data=payload or {}, user_id=current_user.user_id)

        @self.router.delete("/{record_id}", response_model=ApiResponse)
        def delete(
            record_id: str = Path(...),
            current_user: CurrentUser = Depends(RbacHandler.require_roles(self.required_roles))
        ):
            return self.service.delete(record_id, user_id=current_user.user_id)

    def get_router(self) -> APIRouter:
        return self.router
