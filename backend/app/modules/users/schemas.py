"""
User schemas for request/response validation.
"""
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.modules.users.models import UserRole


# Base schemas
class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=50)
    department: str | None = Field(None, max_length=100)


# Request schemas
class UserCreate(UserBase):
    """Schema for creating a user."""

    password: str = Field(..., min_length=8, max_length=100)
    role: UserRole = UserRole.EMPLOYEE


class UserUpdate(BaseModel):
    """Schema for updating a user."""

    name: str | None = Field(None, min_length=1, max_length=255)
    phone: str | None = Field(None, max_length=50)
    department: str | None = Field(None, max_length=100)


class UserUpdateByAdmin(UserUpdate):
    """Schema for admin updating a user."""

    role: UserRole | None = None
    is_active: bool | None = None


# Response schemas
class UserResponse(UserBase):
    """Schema for user response."""

    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    """Schema for user list response."""

    users: list[UserResponse]
    total: int
