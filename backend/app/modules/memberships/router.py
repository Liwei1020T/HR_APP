"""
Membership routes for channel membership management.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.memberships.schemas import (
    MembershipResponse,
    MembershipListResponse,
    MembershipJoinRequest,
    MembershipLeaveRequest,
)
from app.modules.memberships.service import MembershipService

router = APIRouter()


@router.post("/join", response_model=MembershipResponse, status_code=status.HTTP_201_CREATED)
def join_channel(
    join_data: MembershipJoinRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Join a channel."""
    service = MembershipService(db)

    try:
        membership = service.join_channel(current_user.id, join_data.channel_id)
        return membership
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_channel(
    leave_data: MembershipLeaveRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Leave a channel."""
    service = MembershipService(db)

    try:
        service.leave_channel(current_user.id, leave_data.channel_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=MembershipListResponse)
def get_memberships(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    channel_id: int | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
):
    """
    Get memberships.
    - If channel_id is provided: get members of that channel
    - Otherwise: get current user's memberships
    """
    service = MembershipService(db)

    if channel_id:
        memberships, total = service.get_channel_members(
            channel_id, skip=skip, limit=limit
        )
    else:
        memberships, total = service.get_user_memberships(
            current_user.id, skip=skip, limit=limit
        )

    return MembershipListResponse(memberships=memberships, total=total)
