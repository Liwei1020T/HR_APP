"""
User service for business logic.
"""
from typing import List

from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.modules.users.models import User, UserRole
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserCreate, UserUpdate, UserUpdateByAdmin


class UserService:
    """Service for user business logic."""

    def __init__(self, db: Session):
        self.repo = UserRepository(db)

    def get_user_by_id(self, user_id: int) -> User | None:
        """Get user by ID."""
        return self.repo.get_by_id(user_id)

    def get_user_by_email(self, email: str) -> User | None:
        """Get user by email."""
        return self.repo.get_by_email(email)

    def get_users(
        self, skip: int = 0, limit: int = 100, role: UserRole | None = None, q: str | None = None
    ) -> tuple[List[User], int]:
        """Get users with pagination and filters."""
        users = self.repo.get_all(skip=skip, limit=limit, role=role, q=q)
        total = self.repo.count(role=role, q=q)
        return users, total

    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user."""
        # Hash password
        hashed_password = hash_password(user_data.password)

        # Create user instance
        user = User(
            email=user_data.email,
            password_hash=hashed_password,
            name=user_data.name,
            phone=user_data.phone,
            department=user_data.department,
            role=user_data.role,
        )

        return self.repo.create(user)

    def update_user(self, user: User, update_data: UserUpdate) -> User:
        """Update user profile."""
        if update_data.name is not None:
            user.name = update_data.name
        if update_data.phone is not None:
            user.phone = update_data.phone
        if update_data.department is not None:
            user.department = update_data.department

        return self.repo.update(user)

    def update_user_by_admin(self, user: User, update_data: UserUpdateByAdmin) -> User:
        """Update user by admin (including role and is_active)."""
        if update_data.name is not None:
            user.name = update_data.name
        if update_data.phone is not None:
            user.phone = update_data.phone
        if update_data.department is not None:
            user.department = update_data.department
        if update_data.role is not None:
            user.role = update_data.role
        if update_data.is_active is not None:
            user.is_active = update_data.is_active

        return self.repo.update(user)

    def delete_user(self, user: User) -> None:
        """Delete a user."""
        self.repo.delete(user)
