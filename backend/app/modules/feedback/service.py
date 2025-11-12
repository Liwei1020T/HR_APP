"""
Feedback service for business logic.
"""
from typing import List

from sqlalchemy.orm import Session

from app.modules.feedback.models import Feedback, FeedbackComment, FeedbackStatus
from app.modules.feedback.repository import FeedbackRepository, FeedbackCommentRepository
from app.modules.users.models import UserRole
from app.core.events import publish


class FeedbackService:
    """Service for feedback business logic."""

    def __init__(self, db: Session):
        self.repo = FeedbackRepository(db)
        self.comment_repo = FeedbackCommentRepository(db)
        self.db = db

    def create_feedback(
        self, user_id: int, title: str, content: str, category: str, is_anonymous: bool, submitter_name: str = None
    ) -> Feedback:
        """Create new feedback."""
        feedback = Feedback(
            title=title,
            content=content,
            category=category,
            is_anonymous=is_anonymous,
            submitted_by=user_id,
            status=FeedbackStatus.PENDING,
        )
        created_feedback = self.repo.create(feedback)
        
        # Publish event for notifications
        publish("FeedbackCreated", {
            "feedback_id": created_feedback.id,
            "user_id": user_id,
            "title": title,
            "is_anonymous": is_anonymous,
            "submitter_name": submitter_name,
        })
        
        return created_feedback

    def get_feedback(self, feedback_id: int, load_comments: bool = False) -> Feedback | None:
        """Get feedback by ID."""
        return self.repo.get_by_id(feedback_id, load_comments=load_comments)

    def get_all_feedback(
        self,
        user_id: int,
        user_role: UserRole,
        status: FeedbackStatus | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> tuple[List[Feedback], int]:
        """Get all feedback based on user role."""
        is_hr = user_role in [UserRole.HR, UserRole.ADMIN, UserRole.SUPERADMIN]

        feedback_list = self.repo.get_all(
            user_id=user_id if not is_hr else None,
            is_hr=is_hr,
            status=status,
            skip=skip,
            limit=limit,
        )

        total = self.repo.count(
            user_id=user_id if not is_hr else None,
            is_hr=is_hr,
            status=status,
        )

        return feedback_list, total

    def update_feedback(
        self, feedback: Feedback, title: str | None, content: str | None, category: str | None
    ) -> Feedback:
        """Update feedback details (employee only, before HR review)."""
        if feedback.status != FeedbackStatus.PENDING:
            raise ValueError("Cannot update feedback that has been reviewed")

        if title:
            feedback.title = title
        if content:
            feedback.content = content
        if category:
            feedback.category = category

        return self.repo.update(feedback)

    def update_status(
        self, feedback: Feedback, status: FeedbackStatus, assigned_to: int | None = None
    ) -> Feedback:
        """Update feedback status (HR/Admin only)."""
        old_status = feedback.status
        old_assigned_to = feedback.assigned_to
        
        feedback.status = status
        if assigned_to is not None:
            feedback.assigned_to = assigned_to

        updated_feedback = self.repo.update(feedback)
        
        # Publish status change event
        if old_status != status:
            publish("FeedbackStatusUpdated", {
                "feedback_id": feedback.id,
                "user_id": feedback.submitted_by,
                "old_status": old_status.value,
                "new_status": status.value,
                "title": feedback.title,
            })
        
        # Publish assignment event
        if assigned_to is not None and assigned_to != old_assigned_to:
            publish("FeedbackAssigned", {
                "feedback_id": feedback.id,
                "assigned_to": assigned_to,
                "title": feedback.title,
            })
        
        return updated_feedback

    def delete_feedback(self, feedback: Feedback) -> None:
        """Delete feedback."""
        self.repo.delete(feedback)

    def can_user_access(self, feedback: Feedback, user_id: int, user_role: UserRole) -> bool:
        """Check if user can access this feedback."""
        # HR/Admin can access all feedback
        if user_role in [UserRole.HR, UserRole.ADMIN, UserRole.SUPERADMIN]:
            return True

        # User can access their own feedback
        return feedback.submitted_by == user_id

    def can_user_modify(self, feedback: Feedback, user_id: int, user_role: UserRole) -> bool:
        """Check if user can modify this feedback."""
        # Only the submitter can modify their own pending feedback
        return feedback.submitted_by == user_id and feedback.status == FeedbackStatus.PENDING

    # Comment methods
    def add_comment(
        self, feedback_id: int, user_id: int, content: str, is_internal: bool = False,
        commenter_name: str = None, submitter_id: int = None, feedback_title: str = None
    ) -> FeedbackComment:
        """Add a comment to feedback."""
        comment = FeedbackComment(
            feedback_id=feedback_id,
            user_id=user_id,
            content=content,
            is_internal=is_internal,
        )
        created_comment = self.comment_repo.create(comment)
        
        # Publish event for notifications
        if commenter_name and submitter_id and feedback_title:
            publish("FeedbackCommentAdded", {
                "feedback_id": feedback_id,
                "comment_id": created_comment.id,
                "commenter_id": user_id,
                "commenter_name": commenter_name,
                "submitter_id": submitter_id,
                "title": feedback_title,
                "is_internal": is_internal,
            })
        
        return created_comment

    def get_comments(
        self, feedback_id: int, user_role: UserRole
    ) -> List[FeedbackComment]:
        """Get comments for feedback."""
        include_internal = user_role in [UserRole.HR, UserRole.ADMIN, UserRole.SUPERADMIN]
        return self.comment_repo.get_by_feedback_id(feedback_id, include_internal=include_internal)

    def delete_comment(self, comment: FeedbackComment) -> None:
        """Delete a comment."""
        self.comment_repo.delete(comment)
