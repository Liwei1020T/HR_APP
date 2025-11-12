"""
Announcement repository for database operations.
"""
from typing import List
from datetime import datetime

from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session

from app.modules.announcements.models import Announcement


class AnnouncementRepository:
    """Repository for Announcement database operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, announcement_id: int) -> Announcement | None:
        """Get announcement by ID."""
        return self.db.execute(
            select(Announcement).where(Announcement.id == announcement_id)
        ).scalar_one_or_none()

    def get_all(
        self,
        category: str | None = None,
        is_pinned: bool | None = None,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Announcement]:
        """Get all announcements with filters."""
        query = select(Announcement)

        # Filter active and non-expired by default
        if active_only:
            query = query.where(Announcement.is_active == True)
            # Include announcements that haven't expired or have no expiry
            query = query.where(
                or_(
                    Announcement.expires_at.is_(None),
                    Announcement.expires_at > datetime.utcnow(),
                )
            )

        if category:
            query = query.where(Announcement.category == category)

        if is_pinned is not None:
            query = query.where(Announcement.is_pinned == is_pinned)

        # Order by pinned first, then by created date descending
        query = (
            query.order_by(Announcement.is_pinned.desc(), Announcement.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        return list(self.db.execute(query).scalars().all())

    def count(
        self,
        category: str | None = None,
        is_pinned: bool | None = None,
        active_only: bool = True,
    ) -> int:
        """Count announcements with filters."""
        query = select(func.count(Announcement.id))

        if active_only:
            query = query.where(Announcement.is_active == True)
            query = query.where(
                or_(
                    Announcement.expires_at.is_(None),
                    Announcement.expires_at > datetime.utcnow(),
                )
            )

        if category:
            query = query.where(Announcement.category == category)

        if is_pinned is not None:
            query = query.where(Announcement.is_pinned == is_pinned)

        return self.db.execute(query).scalar() or 0

    def count_by_category(self) -> dict[str, int]:
        """Get announcement count by category."""
        query = (
            select(Announcement.category, func.count(Announcement.id))
            .where(Announcement.is_active == True)
            .group_by(Announcement.category)
        )

        results = self.db.execute(query).all()
        return {category: count for category, count in results}

    def create(self, announcement: Announcement) -> Announcement:
        """Create a new announcement."""
        self.db.add(announcement)
        self.db.commit()
        self.db.refresh(announcement)
        return announcement

    def update(self, announcement: Announcement) -> Announcement:
        """Update announcement."""
        self.db.commit()
        self.db.refresh(announcement)
        return announcement

    def delete(self, announcement: Announcement) -> None:
        """Delete announcement."""
        self.db.delete(announcement)
        self.db.commit()
