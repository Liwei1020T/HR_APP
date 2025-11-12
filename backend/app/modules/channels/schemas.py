"""
Channel schemas for request/response validation.
"""
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# Base schemas
class ChannelBase(BaseModel):
    """Base channel schema."""

    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    is_public: bool = True


# Request schemas
class ChannelCreate(ChannelBase):
    """Schema for creating a channel."""

    pass


class ChannelUpdate(BaseModel):
    """Schema for updating a channel."""

    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    is_public: bool | None = None


# Response schemas
class ChannelResponse(ChannelBase):
    """Schema for channel response."""

    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChannelListResponse(BaseModel):
    """Schema for channel list response."""

    channels: list[ChannelResponse]
    total: int


class ChannelDetailResponse(ChannelResponse):
    """Schema for detailed channel response with member count."""

    member_count: int = 0
    is_member: bool = False
