"""
Authentication and Authorization Handler with RBAC using Bearer Tokens
"""
import os
import time
import jwt
from typing import List, Optional, Set
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

JWT_SECRET = os.getenv("JWT_SECRET", "gtax-enterprise-secret-key-38294729482")
JWT_ALGORITHM = "HS256"

security = HTTPBearer()

class CurrentUser(BaseModel):
    user_id: str
    email: str
    username: str
    roles: List[str]
    permissions: List[str]
    organization_id: str

class RbacHandler:
    @staticmethod
    def create_access_token(user_id: str, email: str, username: str, roles: List[str], permissions: List[str], organization_id: str = "default_org", expires_in: int = 86400) -> str:
        payload = {
            "sub": user_id,
            "email": email,
            "username": username,
            "roles": roles,
            "permissions": permissions,
            "org": organization_id,
            "iat": int(time.time()),
            "exp": int(time.time()) + expires_in
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    @staticmethod
    def decode_token(token: str) -> dict:
        try:
            return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bearer token")

    @classmethod
    def get_current_user(cls, credentials: HTTPAuthorizationCredentials = Security(security)) -> CurrentUser:
        token = credentials.credentials
        payload = cls.decode_token(token)
        return CurrentUser(
            user_id=payload.get("sub", ""),
            email=payload.get("email", ""),
            username=payload.get("username", ""),
            roles=payload.get("roles", []),
            permissions=payload.get("permissions", []),
            organization_id=payload.get("org", "default_org")
        )

    @classmethod
    def require_roles(cls, allowed_roles: List[str]):
        """Dependency factory to enforce role-based access control."""
        def role_checker(current_user: CurrentUser = Security(cls.get_current_user)):
            user_roles = set(current_user.roles)
            if not user_roles.intersection(set(allowed_roles)):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Requires one of roles: {allowed_roles}"
                )
            return current_user
        return role_checker

    @classmethod
    def require_permissions(cls, required_perms: List[str]):
        """Dependency factory to enforce granular permission checks."""
        def perm_checker(current_user: CurrentUser = Security(cls.get_current_user)):
            user_perms = set(current_user.permissions)
            for req in required_perms:
                if req not in user_perms and "admin:all" not in user_perms:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Missing permission: {req}"
                    )
            return current_user
        return perm_checker
