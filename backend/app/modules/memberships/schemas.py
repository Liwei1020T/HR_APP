"""
Membership schemas for request/response validation.
"""
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.modules.channels.models import MemberRole


# Request schemas
class MembershipJoinRequest(BaseModel):
    """Schema for joining a channel."""

    channel_id: int


class MembershipLeaveRequest(BaseModel):
    """Schema for leaving a channel."""

    channel_id: int


# Response schemas
class MembershipResponse(BaseModel):
    """Schema for membership response."""

    id: int
    user_id: int
    channel_id: int
    role: MemberRole
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MembershipListResponse(BaseModel):
    """Schema for membership list response."""

    memberships: list[MembershipResponse]
    total: int


class MembershipWithUserResponse(MembershipResponse):
    """Schema for membership with user details."""

    user_name: str
    user_email: str
