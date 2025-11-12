"""
User routes for user management.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user, require_roles
from app.modules.users.models import User, UserRole
from app.modules.users.schemas import (
    UserResponse,
    UserListResponse,
    UserUpdate,
    UserUpdateByAdmin,
)
from app.modules.users.service import UserService

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get current user information."""
    return current_user


@router.patch("/me", response_model=UserResponse)
def update_current_user(
    update_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Update current user profile."""
    service = UserService(db)
    updated_user = service.update_user(current_user, update_data)
    return updated_user


@router.get("", response_model=UserListResponse)
def get_users(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    role: UserRole | None = None,
    q: str | None = None,
):
    """Get all users with optional filters (requires authentication)."""
    service = UserService(db)
    users, total = service.get_users(skip=skip, limit=limit, role=role, q=q)
    return UserListResponse(users=users, total=total)


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get user by ID."""
    service = UserService(db)
    user = service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


@router.patch("/{user_id}", response_model=UserResponse)
def update_user_by_admin(
    user_id: int,
    update_data: UserUpdateByAdmin,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles("hr", "admin", "superadmin"))],
):
    """Update user by admin (role, is_active, etc.)."""
    service = UserService(db)
    user = service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    updated_user = service.update_user_by_admin(user, update_data)
    return updated_user
