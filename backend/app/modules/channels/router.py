"""
Channel routes for channel management.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user, require_roles
from app.modules.users.models import User
from app.modules.channels.schemas import (
    ChannelResponse,
    ChannelListResponse,
    ChannelCreate,
    ChannelUpdate,
    ChannelDetailResponse,
)
from app.modules.channels.service import ChannelService

router = APIRouter()


@router.get("", response_model=ChannelListResponse)
def get_channels(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_public: bool | None = None,
):
    """Get all channels with optional filters."""
    service = ChannelService(db)
    channels, total = service.get_channels(skip=skip, limit=limit, is_public=is_public)
    return ChannelListResponse(channels=channels, total=total)


@router.post("", response_model=ChannelResponse, status_code=status.HTTP_201_CREATED)
def create_channel(
    channel_data: ChannelCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles("hr", "admin", "superadmin"))],
):
    """Create a new channel (HR/Admin/Superadmin only)."""
    service = ChannelService(db)

    try:
        channel = service.create_channel(channel_data, created_by=current_user.id)
        return channel
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{channel_id}", response_model=ChannelDetailResponse)
def get_channel_by_id(
    channel_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get channel by ID with member info."""
    service = ChannelService(db)
    channel = service.get_channel_by_id(channel_id)

    if not channel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")

    # Get additional info
    member_count = service.get_member_count(channel_id)
    is_member = service.is_member(channel_id, current_user.id)

    return ChannelDetailResponse(
        **channel.__dict__, member_count=member_count, is_member=is_member
    )


@router.patch("/{channel_id}", response_model=ChannelResponse)
def update_channel(
    channel_id: int,
    update_data: ChannelUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Update a channel (owner, HR, Admin, Superadmin only)."""
    service = ChannelService(db)
    channel = service.get_channel_by_id(channel_id)

    if not channel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")

    # Check permissions: owner or hr/admin/superadmin
    is_owner = channel.created_by == current_user.id
    is_admin = current_user.role.value in ["hr", "admin", "superadmin"]

    if not (is_owner or is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only channel owner or admins can update this channel",
        )

    try:
        updated_channel = service.update_channel(channel, update_data)
        return updated_channel
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_channel(
    channel_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles("admin", "superadmin"))],
):
    """Delete a channel (Admin/Superadmin only)."""
    service = ChannelService(db)
    channel = service.get_channel_by_id(channel_id)

    if not channel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")

    service.delete_channel(channel)
