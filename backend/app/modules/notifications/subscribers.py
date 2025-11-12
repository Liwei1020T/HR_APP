"""
Event subscribers for automatic notification creation.
Subscribe to domain events and create notifications for relevant users.
"""
from sqlalchemy.orm import Session
from app.core.events import subscribe
from app.db.session import SessionLocal
from app.modules.notifications.service import NotificationService
from app.modules.notifications.models import NotificationType
from app.modules.users.models import UserRole
import logging

logger = logging.getLogger(__name__)


def get_hr_users(db: Session) -> list[int]:
    """Get all HR/Admin/Superadmin user IDs."""
    from app.modules.users.models import User

    hr_users = db.query(User).filter(
        User.role.in_([UserRole.HR, UserRole.ADMIN, UserRole.SUPERADMIN]),
        User.is_active == True,
    ).all()

    return [user.id for user in hr_users]


@subscribe("FeedbackCreated")
def on_feedback_created(payload: dict):
    """
    When feedback is created, notify all HR users.

    Payload:
        - feedback_id: int
        - user_id: int (submitter)
        - title: str
        - is_anonymous: bool
    """
    db = SessionLocal()
    try:
        service = NotificationService(db)
        hr_users = get_hr_users(db)

        submitter_name = "Anonymous" if payload.get("is_anonymous") else payload.get("submitter_name", "Someone")

        for hr_user_id in hr_users:
            service.create_notification(
                user_id=hr_user_id,
                notification_type=NotificationType.FEEDBACK_CREATED,
                title="New Feedback Submitted",
                message=f"{submitter_name} submitted feedback: {payload['title']}",
                related_entity_type="feedback",
                related_entity_id=payload["feedback_id"],
            )

        logger.info(f"Created notifications for {len(hr_users)} HR users about feedback {payload['feedback_id']}")
    except Exception as e:
        logger.error(f"Error creating notifications for FeedbackCreated: {e}")
    finally:
        db.close()


@subscribe("FeedbackStatusUpdated")
def on_feedback_status_updated(payload: dict):
    """
    When feedback status is updated, notify the submitter.

    Payload:
        - feedback_id: int
        - user_id: int (submitter)
        - old_status: str
        - new_status: str
        - title: str
    """
    db = SessionLocal()
    try:
        service = NotificationService(db)

        service.create_notification(
            user_id=payload["user_id"],
            notification_type=NotificationType.FEEDBACK_UPDATED,
            title="Feedback Status Updated",
            message=f"Your feedback '{payload['title']}' status changed from {payload['old_status']} to {payload['new_status']}",
            related_entity_type="feedback",
            related_entity_id=payload["feedback_id"],
        )

        logger.info(f"Notified user {payload['user_id']} about feedback status change")
    except Exception as e:
        logger.error(f"Error creating notification for FeedbackStatusUpdated: {e}")
    finally:
        db.close()


@subscribe("FeedbackAssigned")
def on_feedback_assigned(payload: dict):
    """
    When feedback is assigned to someone, notify the assignee.

    Payload:
        - feedback_id: int
        - assigned_to: int
        - title: str
    """
    db = SessionLocal()
    try:
        service = NotificationService(db)

        service.create_notification(
            user_id=payload["assigned_to"],
            notification_type=NotificationType.FEEDBACK_ASSIGNED,
            title="Feedback Assigned to You",
            message=f"You have been assigned to handle: {payload['title']}",
            related_entity_type="feedback",
            related_entity_id=payload["feedback_id"],
        )

        logger.info(f"Notified user {payload['assigned_to']} about feedback assignment")
    except Exception as e:
        logger.error(f"Error creating notification for FeedbackAssigned: {e}")
    finally:
        db.close()


@subscribe("FeedbackCommentAdded")
def on_feedback_comment_added(payload: dict):
    """
    When a comment is added to feedback, notify the submitter (if not the commenter).

    Payload:
        - feedback_id: int
        - comment_id: int
        - commenter_id: int
        - commenter_name: str
        - submitter_id: int
        - title: str
        - is_internal: bool
    """
    db = SessionLocal()
    try:
        # Don't notify about internal comments
        if payload.get("is_internal", False):
            return

        # Don't notify the commenter about their own comment
        if payload["commenter_id"] == payload["submitter_id"]:
            return

        service = NotificationService(db)

        service.create_notification(
            user_id=payload["submitter_id"],
            notification_type=NotificationType.FEEDBACK_COMMENT,
            title="New Comment on Your Feedback",
            message=f"{payload['commenter_name']} commented on: {payload['title']}",
            related_entity_type="feedback",
            related_entity_id=payload["feedback_id"],
        )

        logger.info(f"Notified user {payload['submitter_id']} about new comment")
    except Exception as e:
        logger.error(f"Error creating notification for FeedbackCommentAdded: {e}")
    finally:
        db.close()


@subscribe("AnnouncementCreated")
def on_announcement_created(payload: dict):
    """
    When announcement is created, notify all active users.

    Payload:
        - announcement_id: int
        - title: str
        - category: str
        - is_pinned: bool
    """
    db = SessionLocal()
    try:
        from app.modules.users.models import User
        
        service = NotificationService(db)

        # Get all active users
        active_users = db.query(User).filter(User.is_active == True).all()

        pin_flag = " [PINNED]" if payload.get("is_pinned") else ""

        for user in active_users:
            service.create_notification(
                user_id=user.id,
                notification_type=NotificationType.ANNOUNCEMENT,
                title="New Announcement",
                message=f"New announcement posted: {payload['title']}{pin_flag}",
                related_entity_type="announcement",
                related_entity_id=payload["announcement_id"],
            )

        logger.info(f"Created notifications for {len(active_users)} users about announcement {payload['announcement_id']}")
    except Exception as e:
        logger.error(f"Error creating notifications for AnnouncementCreated: {e}")
    finally:
        db.close()


# Initialize all subscribers when module is imported
logger.info("Notification event subscribers initialized")
