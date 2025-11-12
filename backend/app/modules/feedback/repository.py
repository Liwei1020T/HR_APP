"""
Feedback repository for database operations.
"""
from typing import List
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, joinedload

from app.modules.feedback.models import Feedback, FeedbackComment, FeedbackStatus


class FeedbackRepository:
    """Repository for Feedback database operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, feedback_id: int, load_comments: bool = False) -> Feedback | None:
        """Get feedback by ID, optionally with comments."""
        query = select(Feedback).where(Feedback.id == feedback_id)
        if load_comments:
            query = query.options(joinedload(Feedback.comments))
        return self.db.execute(query).scalar_one_or_none()

    def get_all(
        self,
        user_id: int | None = None,
        is_hr: bool = False,
        status: FeedbackStatus | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Feedback]:
        """
        Get all feedback with filters.
        - If user_id is provided and is_hr is False: only show user's own feedback
        - If is_hr is True: show all feedback
        """
        query = select(Feedback)

        if not is_hr and user_id:
            # Regular users only see their own feedback
            query = query.where(Feedback.submitted_by == user_id)
        
        if status:
            query = query.where(Feedback.status == status)

        query = (
            query.offset(skip)
            .limit(limit)
            .order_by(Feedback.created_at.desc())
        )

        return list(self.db.execute(query).scalars().all())

    def count(
        self,
        user_id: int | None = None,
        is_hr: bool = False,
        status: FeedbackStatus | None = None,
    ) -> int:
        """Count feedback with filters."""
        query = select(func.count(Feedback.id))

        if not is_hr and user_id:
            query = query.where(Feedback.submitted_by == user_id)
        
        if status:
            query = query.where(Feedback.status == status)

        return self.db.execute(query).scalar() or 0

    def create(self, feedback: Feedback) -> Feedback:
        """Create new feedback."""
        self.db.add(feedback)
        self.db.commit()
        self.db.refresh(feedback)
        return feedback

    def update(self, feedback: Feedback) -> Feedback:
        """Update feedback."""
        self.db.commit()
        self.db.refresh(feedback)
        return feedback

    def delete(self, feedback: Feedback) -> None:
        """Delete feedback."""
        self.db.delete(feedback)
        self.db.commit()


class FeedbackCommentRepository:
    """Repository for FeedbackComment database operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, comment_id: int) -> FeedbackComment | None:
        """Get comment by ID."""
        return self.db.execute(
            select(FeedbackComment).where(FeedbackComment.id == comment_id)
        ).scalar_one_or_none()

    def get_by_feedback_id(
        self, feedback_id: int, include_internal: bool = False
    ) -> List[FeedbackComment]:
        """Get all comments for a feedback, optionally including internal comments."""
        query = select(FeedbackComment).where(FeedbackComment.feedback_id == feedback_id)

        if not include_internal:
            query = query.where(FeedbackComment.is_internal == False)

        query = query.order_by(FeedbackComment.created_at.asc())

        return list(self.db.execute(query).scalars().all())

    def count_by_feedback_id(self, feedback_id: int) -> int:
        """Count comments for a feedback."""
        return (
            self.db.execute(
                select(func.count(FeedbackComment.id)).where(
                    FeedbackComment.feedback_id == feedback_id
                )
            ).scalar()
            or 0
        )

    def create(self, comment: FeedbackComment) -> FeedbackComment:
        """Create new comment."""
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)
        return comment

    def delete(self, comment: FeedbackComment) -> None:
        """Delete comment."""
        self.db.delete(comment)
        self.db.commit()
