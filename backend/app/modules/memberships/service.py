"""
Membership service for business logic.
"""
from typing import List

from sqlalchemy.orm import Session

from app.modules.channels.models import ChannelMember, MemberRole
from app.modules.memberships.repository import MembershipRepository
from app.modules.channels.repository import ChannelRepository


class MembershipService:
    """Service for membership business logic."""

    def __init__(self, db: Session):
        self.repo = MembershipRepository(db)
        self.channel_repo = ChannelRepository(db)

    def join_channel(self, user_id: int, channel_id: int) -> ChannelMember:
        """Join a channel."""
        # Check if channel exists
        channel = self.channel_repo.get_by_id(channel_id)
        if not channel:
            raise ValueError("Channel not found")

        # Check if already a member
        existing = self.repo.get_by_user_and_channel(user_id, channel_id)
        if existing:
            raise ValueError("Already a member of this channel")

        # Create membership
        membership = ChannelMember(
            user_id=user_id, channel_id=channel_id, role=MemberRole.MEMBER
        )

        return self.repo.create(membership)

    def leave_channel(self, user_id: int, channel_id: int) -> None:
        """Leave a channel."""
        membership = self.repo.get_by_user_and_channel(user_id, channel_id)

        if not membership:
            raise ValueError("Not a member of this channel")

        self.repo.delete(membership)

    def get_user_memberships(
        self, user_id: int, skip: int = 0, limit: int = 100
    ) -> tuple[List[ChannelMember], int]:
        """Get user memberships with pagination."""
        memberships = self.repo.get_user_memberships(user_id, skip=skip, limit=limit)
        total = self.repo.count_user_memberships(user_id)
        return memberships, total

    def get_channel_members(
        self, channel_id: int, skip: int = 0, limit: int = 100
    ) -> tuple[List[ChannelMember], int]:
        """Get channel members with pagination."""
        memberships = self.repo.get_channel_members(channel_id, skip=skip, limit=limit)
        total = self.repo.count_channel_members(channel_id)
        return memberships, total

    def is_member(self, user_id: int, channel_id: int) -> bool:
        """Check if user is a member of the channel."""
        membership = self.repo.get_by_user_and_channel(user_id, channel_id)
        return membership is not None
