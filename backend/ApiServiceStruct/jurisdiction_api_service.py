"""
ApiServiceStruct: JurisdictionApiService
Inherits base CRUD properties directly from BaseFrame architecture for tax jurisdictions & rates.
"""
from typing import Dict, List, Any
from backend.BaseFrame.repo.base_repo import BaseRepo
from backend.BaseFrame.services.base_service import BaseService
from backend.BaseFrame.controller.base_crud_controller import BaseCrudController
from backend.BaseFrame.response.api_response import ApiResponse

class JurisdictionRepo(BaseRepo):
    def __init__(self):
        super().__init__(table_name="tax_jurisdictions", primary_key="jurisdiction_id")

class JurisdictionService(BaseService):
    def __init__(self):
        self.jur_repo = JurisdictionRepo()
        super().__init__(repository=self.jur_repo, cache_prefix="gtax:jurisdictions")

    def validate_data(self, data: Dict[str, Any], is_create: bool = True) -> Dict[str, List[str]]:
        errors = {}
        if is_create:
            if not data.get("jurisdiction_code"):
                errors["jurisdiction_code"] = ["Jurisdiction code is required."]
            if not data.get("jurisdiction_name"):
                errors["jurisdiction_name"] = ["Jurisdiction name is required."]
            if not data.get("country_iso"):
                errors["country_iso"] = ["ISO-3 country code is required."]
        return errors

class JurisdictionController(BaseCrudController):
    def __init__(self):
        self.jur_service = JurisdictionService()
        super().__init__(
            prefix="/api/v1/jurisdictions",
            service=self.jur_service,
            tag="Jurisdictions (Inherited BaseFrame CRUD)",
            required_roles=["tax_manager", "admin"]
        )

jurisdiction_api_router = JurisdictionController().get_router()
