"""
Notification service for business logic.
"""
from typing import List

from sqlalchemy.orm import Session

from app.modules.notifications.models import Notification, NotificationType
from app.modules.notifications.repository import NotificationRepository


class NotificationService:
    """Service for notification business logic."""

    def __init__(self, db: Session):
        self.repo = NotificationRepository(db)

    def create_notification(
        self,
        user_id: int,
        notification_type: NotificationType,
        title: str,
        message: str,
        related_entity_type: str | None = None,
        related_entity_id: int | None = None,
    ) -> Notification:
        """Create a new notification for a user."""
        notification = Notification(
            user_id=user_id,
            type=notification_type.value,
            title=title,
            message=message,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            is_read=False,
        )
        return self.repo.create(notification)

    def get_user_notifications(
        self,
        user_id: int,
        unread_only: bool = False,
        notification_type: str | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[Notification], int, int]:
        """
        Get user notifications with pagination.
        Returns (notifications, total_count, unread_count).
        """
        notifications = self.repo.get_user_notifications(
            user_id=user_id,
            unread_only=unread_only,
            notification_type=notification_type,
            skip=skip,
            limit=limit,
        )

        total = self.repo.count_user_notifications(
            user_id=user_id,
            unread_only=False,
            notification_type=notification_type,
        )

        unread = self.repo.count_user_notifications(
            user_id=user_id,
            unread_only=True,
            notification_type=notification_type,
        )

        return notifications, total, unread

    def get_stats(self, user_id: int) -> dict:
        """Get notification statistics for a user."""
        total = self.repo.count_user_notifications(user_id)
        unread = self.repo.count_user_notifications(user_id, unread_only=True)
        by_type = self.repo.get_stats_by_type(user_id)

        return {
            "total": total,
            "unread": unread,
            "by_type": by_type,
        }

    def mark_as_read(self, notification_ids: List[int], user_id: int) -> int:
        """Mark specific notifications as read."""
        return self.repo.mark_as_read(notification_ids, user_id)

    def mark_all_as_read(self, user_id: int) -> int:
        """Mark all notifications as read for a user."""
        return self.repo.mark_all_as_read(user_id)

    def delete_notification(self, notification_id: int, user_id: int) -> bool:
        """Delete a notification. Returns True if deleted."""
        notification = self.repo.get_by_id(notification_id)
        if not notification or notification.user_id != user_id:
            return False

        self.repo.delete(notification)
        return True

    def clear_read_notifications(self, user_id: int) -> int:
        """Clear all read notifications for a user."""
        return self.repo.delete_read_notifications(user_id)
