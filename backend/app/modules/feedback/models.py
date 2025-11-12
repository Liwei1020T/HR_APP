"""
Feedback models for employee feedback and HR review system.
"""
from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class FeedbackStatus(str, Enum):
    """Feedback status enumeration."""

    PENDING = "pending"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"
    CLOSED = "closed"


class FeedbackCategory(str, Enum):
    """Feedback category enumeration."""

    WORKPLACE = "workplace"
    BENEFITS = "benefits"
    MANAGEMENT = "management"
    CULTURE = "culture"
    COMPENSATION = "compensation"
    TRAINING = "training"
    OTHER = "other"


class Feedback(Base):
    """Feedback model for employee feedback submissions."""

    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default=FeedbackStatus.PENDING
    )
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Foreign keys
    submitted_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    assigned_to: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True, index=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    submitter = relationship("User", foreign_keys=[submitted_by], backref="submitted_feedback")
    assignee = relationship("User", foreign_keys=[assigned_to], backref="assigned_feedback")
    comments = relationship("FeedbackComment", back_populates="feedback", cascade="all, delete-orphan")


class FeedbackComment(Base):
    """Comment model for feedback discussions."""

    __tablename__ = "feedback_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_internal: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )  # HR-only comments

    # Foreign keys
    feedback_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("feedback.id"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    # Relationships
    feedback = relationship("Feedback", back_populates="comments")
    user = relationship("User", backref="feedback_comments")
