"""
ApiServiceStruct: UserApiService
Inherits base CRUD properties directly from BaseFrame architecture.
"""
from typing import Dict, List, Any
from backend.BaseFrame.repo.base_repo import BaseRepo
from backend.BaseFrame.services.base_service import BaseService
from backend.BaseFrame.controller.base_crud_controller import BaseCrudController
from backend.BaseFrame.response.api_response import ApiResponse

class UserRepo(BaseRepo):
    def __init__(self):
        super().__init__(table_name="sys_users", primary_key="user_id")

    def find_by_email(self, email: str) -> Dict[str, Any]:
        rows = self.execute_raw("SELECT * FROM sys_users WHERE email = %s AND is_active = TRUE", (email,))
        return rows[0] if rows else None

class UserService(BaseService):
    def __init__(self):
        self.user_repo = UserRepo()
        super().__init__(repository=self.user_repo, cache_prefix="gtax:users")

    def validate_data(self, data: Dict[str, Any], is_create: bool = True) -> Dict[str, List[str]]:
        errors = {}
        if is_create:
            if not data.get("email") or "@" not in data.get("email", ""):
                errors["email"] = ["Valid email address is required."]
            if not data.get("username"):
                errors["username"] = ["Username cannot be blank."]
            if not data.get("full_name"):
                errors["full_name"] = ["Full name is required."]
        return errors

class UserController(BaseCrudController):
    def __init__(self):
        self.user_service = UserService()
        super().__init__(
            prefix="/api/v1/users",
            service=self.user_service,
            tag="Users (Inherited BaseFrame CRUD)",
            required_roles=["admin", "super_admin"]
        )

# Instantiable endpoint router
user_api_router = UserController().get_router()
