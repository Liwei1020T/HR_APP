"""
Feedback schemas for request/response validation.
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.modules.feedback.models import FeedbackStatus, FeedbackCategory


# Request schemas
class FeedbackCreateRequest(BaseModel):
    """Schema for creating feedback."""

    title: str = Field(..., min_length=3, max_length=255)
    content: str = Field(..., min_length=10)
    category: FeedbackCategory
    is_anonymous: bool = False


class FeedbackUpdateRequest(BaseModel):
    """Schema for updating feedback (employee)."""

    title: str | None = Field(None, min_length=3, max_length=255)
    content: str | None = Field(None, min_length=10)
    category: FeedbackCategory | None = None


class FeedbackStatusUpdateRequest(BaseModel):
    """Schema for updating feedback status (HR/Admin)."""

    status: FeedbackStatus
    assigned_to: int | None = None


class FeedbackCommentCreateRequest(BaseModel):
    """Schema for creating a comment."""

    content: str = Field(..., min_length=1)
    is_internal: bool = False  # HR can mark comments as internal (not visible to employee)


# Response schemas
class FeedbackCommentResponse(BaseModel):
    """Schema for feedback comment response."""

    id: int
    content: str
    is_internal: bool
    user_id: int
    user_name: str | None = None
    feedback_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FeedbackResponse(BaseModel):
    """Schema for feedback response."""

    id: int
    title: str
    content: str
    category: str
    status: str
    is_anonymous: bool
    submitted_by: int
    submitter_name: str | None = None  # Hidden if anonymous and viewed by non-submitter
    assigned_to: int | None
    assignee_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FeedbackDetailResponse(FeedbackResponse):
    """Schema for detailed feedback with comments."""

    comments: list[FeedbackCommentResponse] = []
    comment_count: int = 0


class FeedbackListResponse(BaseModel):
    """Schema for feedback list response."""

    feedback: list[FeedbackResponse]
    total: int
