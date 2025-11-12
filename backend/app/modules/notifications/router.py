"""
Notification routes for user notifications.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.notifications.schemas import (
    NotificationResponse,
    NotificationListResponse,
    NotificationStatsResponse,
    NotificationMarkReadRequest,
)
from app.modules.notifications.service import NotificationService

router = APIRouter()


@router.get("", response_model=NotificationListResponse)
def list_notifications(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    unread_only: bool = Query(False),
    notification_type: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
):
    """Get user's notifications."""
    service = NotificationService(db)

    notifications, total, unread_count = service.get_user_notifications(
        user_id=current_user.id,
        unread_only=unread_only,
        notification_type=notification_type,
        skip=skip,
        limit=limit,
    )

    return NotificationListResponse(
        notifications=[NotificationResponse.model_validate(n) for n in notifications],
        total=total,
        unread_count=unread_count,
    )


@router.get("/stats", response_model=NotificationStatsResponse)
def get_notification_stats(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get notification statistics."""
    service = NotificationService(db)
    stats = service.get_stats(current_user.id)

    return NotificationStatsResponse(**stats)


@router.post("/mark-read", status_code=status.HTTP_204_NO_CONTENT)
def mark_notifications_read(
    mark_data: NotificationMarkReadRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Mark specific notifications as read."""
    service = NotificationService(db)
    service.mark_as_read(mark_data.notification_ids, current_user.id)


@router.post("/mark-all-read", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_notifications_read(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Mark all notifications as read."""
    service = NotificationService(db)
    service.mark_all_as_read(current_user.id)


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Delete a specific notification."""
    service = NotificationService(db)

    deleted = service.delete_notification(notification_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )


@router.delete("/clear-read", status_code=status.HTTP_204_NO_CONTENT)
def clear_read_notifications(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Clear all read notifications."""
    service = NotificationService(db)
    service.clear_read_notifications(current_user.id)
