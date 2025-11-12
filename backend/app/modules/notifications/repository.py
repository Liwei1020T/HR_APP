"""
Notification repository for database operations.
"""
from typing import List
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session

from app.modules.notifications.models import Notification


class NotificationRepository:
    """Repository for Notification database operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, notification_id: int) -> Notification | None:
        """Get notification by ID."""
        return self.db.execute(
            select(Notification).where(Notification.id == notification_id)
        ).scalar_one_or_none()

    def get_user_notifications(
        self,
        user_id: int,
        unread_only: bool = False,
        notification_type: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Notification]:
        """Get all notifications for a user with filters."""
        query = select(Notification).where(Notification.user_id == user_id)

        if unread_only:
            query = query.where(Notification.is_read == False)

        if notification_type:
            query = query.where(Notification.type == notification_type)

        query = (
            query.offset(skip)
            .limit(limit)
            .order_by(Notification.created_at.desc())
        )

        return list(self.db.execute(query).scalars().all())

    def count_user_notifications(
        self,
        user_id: int,
        unread_only: bool = False,
        notification_type: str | None = None,
    ) -> int:
        """Count notifications for a user."""
        query = select(func.count(Notification.id)).where(Notification.user_id == user_id)

        if unread_only:
            query = query.where(Notification.is_read == False)

        if notification_type:
            query = query.where(Notification.type == notification_type)

        return self.db.execute(query).scalar() or 0

    def get_stats_by_type(self, user_id: int) -> dict[str, int]:
        """Get notification count by type for a user."""
        query = (
            select(Notification.type, func.count(Notification.id))
            .where(Notification.user_id == user_id)
            .group_by(Notification.type)
        )

        results = self.db.execute(query).all()
        return {type_: count for type_, count in results}

    def create(self, notification: Notification) -> Notification:
        """Create a new notification."""
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def mark_as_read(self, notification_ids: List[int], user_id: int) -> int:
        """Mark notifications as read. Returns count of updated notifications."""
        from sqlalchemy import update

        stmt = (
            update(Notification)
            .where(
                and_(
                    Notification.id.in_(notification_ids),
                    Notification.user_id == user_id,
                )
            )
            .values(is_read=True)
        )

        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount

    def mark_all_as_read(self, user_id: int) -> int:
        """Mark all notifications as read for a user. Returns count of updated notifications."""
        from sqlalchemy import update

        stmt = (
            update(Notification)
            .where(
                and_(
                    Notification.user_id == user_id,
                    Notification.is_read == False,
                )
            )
            .values(is_read=True)
        )

        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount

    def delete(self, notification: Notification) -> None:
        """Delete a notification."""
        self.db.delete(notification)
        self.db.commit()

    def delete_read_notifications(self, user_id: int) -> int:
        """Delete all read notifications for a user. Returns count of deleted notifications."""
        from sqlalchemy import delete

        stmt = delete(Notification).where(
            and_(
                Notification.user_id == user_id,
                Notification.is_read == True,
            )
        )

        result = self.db.execute(stmt)
        self.db.commit()
        return result.rowcount
