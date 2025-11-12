"""
User repository for database operations.
"""
from typing import List
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.users.models import User, UserRole


class UserRepository:
    """Repository for User database operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        """Get user by ID."""
        return self.db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()

    def get_by_email(self, email: str) -> User | None:
        """Get user by email."""
        return self.db.execute(select(User).where(User.email == email)).scalar_one_or_none()

    def get_all(
        self, skip: int = 0, limit: int = 100, role: UserRole | None = None, q: str | None = None
    ) -> List[User]:
        """Get all users with optional filters."""
        query = select(User)

        if role:
            query = query.where(User.role == role)

        if q:
            search = f"%{q}%"
            query = query.where(
                (User.name.ilike(search))
                | (User.email.ilike(search))
                | (User.department.ilike(search))
            )

        query = query.offset(skip).limit(limit)
        return list(self.db.execute(query).scalars().all())

    def count(self, role: UserRole | None = None, q: str | None = None) -> int:
        """Count users with optional filters."""
        from sqlalchemy import func
        
        query = select(func.count(User.id))

        if role:
            query = query.where(User.role == role)

        if q:
            search = f"%{q}%"
            query = query.where(
                (User.name.ilike(search))
                | (User.email.ilike(search))
                | (User.department.ilike(search))
            )

        return self.db.execute(query).scalar() or 0

    def create(self, user: User) -> User:
        """Create a new user."""
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(self, user: User) -> User:
        """Update a user."""
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        """Delete a user."""
        self.db.delete(user)
        self.db.commit()
