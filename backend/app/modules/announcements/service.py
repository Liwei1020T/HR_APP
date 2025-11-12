"""
Announcement service for business logic.
"""
from typing import List
from datetime import datetime

from sqlalchemy.orm import Session

from app.modules.announcements.models import Announcement, AnnouncementCategory
from app.modules.announcements.repository import AnnouncementRepository
from app.modules.users.models import UserRole
from app.core.events import publish


class AnnouncementService:
    """Service for announcement business logic."""

    def __init__(self, db: Session):
        self.repo = AnnouncementRepository(db)
        self.db = db

    def create_announcement(
        self,
        user_id: int,
        title: str,
        content: str,
        category: str,
        is_pinned: bool = False,
        expires_at: datetime | None = None,
    ) -> Announcement:
        """Create new announcement."""
        announcement = Announcement(
            title=title,
            content=content,
            category=category,
            is_pinned=is_pinned,
            expires_at=expires_at,
            created_by=user_id,
            is_active=True,
        )

        created = self.repo.create(announcement)

        # Publish event for notifications
        publish("AnnouncementCreated", {
            "announcement_id": created.id,
            "title": title,
            "category": category,
            "is_pinned": is_pinned,
        })

        return created

    def get_announcement(self, announcement_id: int) -> Announcement | None:
        """Get announcement by ID."""
        return self.repo.get_by_id(announcement_id)

    def get_all_announcements(
        self,
        category: str | None = None,
        is_pinned: bool | None = None,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[Announcement], int, int]:
        """
        Get all announcements with filters.
        Returns (announcements, total_count, pinned_count).
        """
        announcements = self.repo.get_all(
            category=category,
            is_pinned=is_pinned,
            active_only=active_only,
            skip=skip,
            limit=limit,
        )

        total = self.repo.count(
            category=category,
            is_pinned=is_pinned,
            active_only=active_only,
        )

        pinned_count = self.repo.count(
            category=category,
            is_pinned=True,
            active_only=active_only,
        )

        return announcements, total, pinned_count

    def update_announcement(
        self,
        announcement: Announcement,
        title: str | None = None,
        content: str | None = None,
        category: str | None = None,
        is_pinned: bool | None = None,
        is_active: bool | None = None,
        expires_at: datetime | None = None,
    ) -> Announcement:
        """Update announcement details."""
        if title is not None:
            announcement.title = title
        if content is not None:
            announcement.content = content
        if category is not None:
            announcement.category = category
        if is_pinned is not None:
            announcement.is_pinned = is_pinned
        if is_active is not None:
            announcement.is_active = is_active
        if expires_at is not None:
            announcement.expires_at = expires_at

        return self.repo.update(announcement)

    def delete_announcement(self, announcement: Announcement) -> None:
        """Delete announcement."""
        self.repo.delete(announcement)

    def can_user_modify(self, announcement: Announcement, user_id: int, user_role: UserRole) -> bool:
        """Check if user can modify this announcement."""
        # Admin/Superadmin can modify any announcement
        if user_role in [UserRole.ADMIN, UserRole.SUPERADMIN]:
            return True

        # HR can modify their own announcements
        if user_role == UserRole.HR and announcement.created_by == user_id:
            return True

        return False

    def get_stats(self) -> dict:
        """Get announcement statistics."""
        total = self.repo.count(active_only=False)
        active = self.repo.count(active_only=True)
        pinned = self.repo.count(is_pinned=True, active_only=True)
        by_category = self.repo.count_by_category()

        return {
            "total": total,
            "active": active,
            "pinned": pinned,
            "by_category": by_category,
        }
