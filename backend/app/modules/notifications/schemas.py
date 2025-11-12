"""
Notification schemas for request/response validation.
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.modules.notifications.models import NotificationType


# Request schemas
class NotificationMarkReadRequest(BaseModel):
    """Schema for marking notification as read."""

    notification_ids: list[int]


# Response schemas
class NotificationResponse(BaseModel):
    """Schema for notification response."""

    id: int
    type: str
    title: str
    message: str
    is_read: bool
    related_entity_type: str | None
    related_entity_id: int | None
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    """Schema for notification list response."""

    notifications: list[NotificationResponse]
    total: int
    unread_count: int


class NotificationStatsResponse(BaseModel):
    """Schema for notification statistics."""

    total: int
    unread: int
    by_type: dict[str, int]
