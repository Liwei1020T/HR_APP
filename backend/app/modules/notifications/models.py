"""
Notification models for user notifications.
"""
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class NotificationType(str, Enum):
    """Notification type enumeration."""

    FEEDBACK_CREATED = "feedback_created"
    FEEDBACK_UPDATED = "feedback_updated"
    FEEDBACK_ASSIGNED = "feedback_assigned"
    FEEDBACK_COMMENT = "feedback_comment"
    CHANNEL_INVITATION = "channel_invitation"
    ANNOUNCEMENT = "announcement"
    SYSTEM = "system"


class Notification(Base):
    """Notification model for user notifications."""

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)

    # Optional link to related entity
    related_entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    related_entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Foreign key
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), index=True
    )

    # Relationships
    user = relationship("User", backref="notifications")
