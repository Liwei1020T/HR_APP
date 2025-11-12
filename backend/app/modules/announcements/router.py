"""
Announcement routes for company-wide announcements.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user, require_roles
from app.modules.users.models import User, UserRole
from app.modules.announcements.schemas import (
    AnnouncementCreateRequest,
    AnnouncementUpdateRequest,
    AnnouncementResponse,
    AnnouncementListResponse,
    AnnouncementStatsResponse,
)
from app.modules.announcements.service import AnnouncementService

router = APIRouter()


@router.post("", response_model=AnnouncementResponse, status_code=status.HTTP_201_CREATED)
def create_announcement(
    announcement_data: AnnouncementCreateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(UserRole.HR, UserRole.ADMIN, UserRole.SUPERADMIN))],
):
    """Create new announcement (HR+ only)."""
    service = AnnouncementService(db)

    announcement = service.create_announcement(
        user_id=current_user.id,
        title=announcement_data.title,
        content=announcement_data.content,
        category=announcement_data.category.value,
        is_pinned=announcement_data.is_pinned,
        expires_at=announcement_data.expires_at,
    )

    response = AnnouncementResponse.model_validate(announcement)
    response.creator_name = current_user.name

    return response


@router.get("", response_model=AnnouncementListResponse)
def list_announcements(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    category: str | None = None,
    is_pinned: bool | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
):
    """List all active announcements (all authenticated users)."""
    service = AnnouncementService(db)

    announcements, total, pinned_count = service.get_all_announcements(
        category=category,
        is_pinned=is_pinned,
        active_only=True,
        skip=skip,
        limit=limit,
    )

    # Build response with creator names
    from app.modules.users.models import User as UserModel
    responses = []
    for announcement in announcements:
        response = AnnouncementResponse.model_validate(announcement)
        creator = db.query(UserModel).filter(UserModel.id == announcement.created_by).first()
        response.creator_name = creator.name if creator else None
        responses.append(response)

    return AnnouncementListResponse(
        announcements=responses,
        total=total,
        pinned_count=pinned_count,
    )


@router.get("/stats", response_model=AnnouncementStatsResponse)
def get_announcement_stats(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(UserRole.HR, UserRole.ADMIN, UserRole.SUPERADMIN))],
):
    """Get announcement statistics (HR+ only)."""
    service = AnnouncementService(db)
    stats = service.get_stats()

    return AnnouncementStatsResponse(**stats)


@router.get("/{announcement_id}", response_model=AnnouncementResponse)
def get_announcement(
    announcement_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get announcement details."""
    service = AnnouncementService(db)

    announcement = service.get_announcement(announcement_id)
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found",
        )

    # Check if announcement is active (unless user is HR+)
    if not announcement.is_active:
        is_hr = current_user.role in [UserRole.HR, UserRole.ADMIN, UserRole.SUPERADMIN]
        if not is_hr:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Announcement not found",
            )

    from app.modules.users.models import User as UserModel
    response = AnnouncementResponse.model_validate(announcement)
    creator = db.query(UserModel).filter(UserModel.id == announcement.created_by).first()
    response.creator_name = creator.name if creator else None

    return response


@router.patch("/{announcement_id}", response_model=AnnouncementResponse)
def update_announcement(
    announcement_id: int,
    update_data: AnnouncementUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(UserRole.HR, UserRole.ADMIN, UserRole.SUPERADMIN))],
):
    """Update announcement (HR+ only, creator or admin)."""
    service = AnnouncementService(db)

    announcement = service.get_announcement(announcement_id)
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found",
        )

    # Check permission
    if not service.can_user_modify(announcement, current_user.id, current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only modify your own announcements",
        )

    updated = service.update_announcement(
        announcement,
        title=update_data.title,
        content=update_data.content,
        category=update_data.category.value if update_data.category else None,
        is_pinned=update_data.is_pinned,
        is_active=update_data.is_active,
        expires_at=update_data.expires_at,
    )

    from app.modules.users.models import User as UserModel
    response = AnnouncementResponse.model_validate(updated)
    creator = db.query(UserModel).filter(UserModel.id == updated.created_by).first()
    response.creator_name = creator.name if creator else None

    return response


@router.delete("/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_announcement(
    announcement_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(UserRole.ADMIN, UserRole.SUPERADMIN))],
):
    """Delete announcement (Admin+ only)."""
    service = AnnouncementService(db)

    announcement = service.get_announcement(announcement_id)
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found",
        )

    service.delete_announcement(announcement)
