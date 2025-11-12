"""
Announcement schemas for request/response validation.
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.modules.announcements.models import AnnouncementCategory


# Request schemas
class AnnouncementCreateRequest(BaseModel):
    """Schema for creating announcement."""

    title: str = Field(..., min_length=3, max_length=255)
    content: str = Field(..., min_length=10)
    category: AnnouncementCategory
    is_pinned: bool = False
    expires_at: datetime | None = None


class AnnouncementUpdateRequest(BaseModel):
    """Schema for updating announcement."""

    title: str | None = Field(None, min_length=3, max_length=255)
    content: str | None = Field(None, min_length=10)
    category: AnnouncementCategory | None = None
    is_pinned: bool | None = None
    is_active: bool | None = None
    expires_at: datetime | None = None


# Response schemas
class AnnouncementResponse(BaseModel):
    """Schema for announcement response."""

    id: int
    title: str
    content: str
    category: str
    is_pinned: bool
    is_active: bool
    expires_at: datetime | None
    created_by: int
    creator_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnnouncementListResponse(BaseModel):
    """Schema for announcement list response."""

    announcements: list[AnnouncementResponse]
    total: int
    pinned_count: int


class AnnouncementStatsResponse(BaseModel):
    """Schema for announcement statistics."""

    total: int
    active: int
    pinned: int
    by_category: dict[str, int]
