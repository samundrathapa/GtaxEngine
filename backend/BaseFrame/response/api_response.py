"""
Standardized API Response Structure for gtax BaseFrame
Matches: success, failure, status, errors, message, validation_errors
"""
from typing import Any, List, Optional, Dict
from pydantic import BaseModel, Field

class ApiResponse(BaseModel):
    success: bool = Field(default=True, description="Indicates if operation succeeded")
    failure: bool = Field(default=False, description="Explicit failure indicator")
    status: int = Field(default=200, description="HTTP status code")
    message: str = Field(default="Operation completed successfully", description="User-facing summary message")
    data: Optional[Any] = Field(default=None, description="Payload data")
    errors: Optional[List[str]] = Field(default_factory=list, description="System/Execution error messages")
    validation_errors: Optional[Dict[str, List[str]]] = Field(default_factory=dict, description="Field-level validation error maps")
    timestamp: str = Field(default="", description="ISO timestamp of response")

    @classmethod
    def build_success(cls, data: Any = None, message: str = "Success", status: int = 200) -> "ApiResponse":
        import datetime
        return cls(
            success=True,
            failure=False,
            status=status,
            message=message,
            data=data,
            errors=[],
            validation_errors={},
            timestamp=datetime.datetime.utcnow().isoformat() + "Z"
        )

    @classmethod
    def build_failure(cls, message: str, errors: List[str] = None, validation_errors: Dict[str, List[str]] = None, status: int = 400) -> "ApiResponse":
        import datetime
        return cls(
            success=False,
            failure=True,
            status=status,
            message=message,
            data=None,
            errors=errors or [message],
            validation_errors=validation_errors or {},
            timestamp=datetime.datetime.utcnow().isoformat() + "Z"
        )
