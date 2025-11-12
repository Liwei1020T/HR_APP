"""
Membership repository for database operations.
"""
from typing import List
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.modules.channels.models import ChannelMember


class MembershipRepository:
    """Repository for ChannelMember database operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, membership_id: int) -> ChannelMember | None:
        """Get membership by ID."""
        return self.db.execute(
            select(ChannelMember).where(ChannelMember.id == membership_id)
        ).scalar_one_or_none()

    def get_by_user_and_channel(self, user_id: int, channel_id: int) -> ChannelMember | None:
        """Get membership by user and channel."""
        return self.db.execute(
            select(ChannelMember)
            .where(ChannelMember.user_id == user_id)
            .where(ChannelMember.channel_id == channel_id)
        ).scalar_one_or_none()

    def get_user_memberships(
        self, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[ChannelMember]:
        """Get all memberships for a user."""
        query = (
            select(ChannelMember)
            .where(ChannelMember.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(ChannelMember.joined_at.desc())
        )
        return list(self.db.execute(query).scalars().all())

    def get_channel_members(
        self, channel_id: int, skip: int = 0, limit: int = 100
    ) -> List[ChannelMember]:
        """Get all members of a channel."""
        query = (
            select(ChannelMember)
            .where(ChannelMember.channel_id == channel_id)
            .offset(skip)
            .limit(limit)
            .order_by(ChannelMember.joined_at.desc())
        )
        return list(self.db.execute(query).scalars().all())

    def count_user_memberships(self, user_id: int) -> int:
        """Count memberships for a user."""
        return (
            self.db.execute(
                select(func.count(ChannelMember.id)).where(ChannelMember.user_id == user_id)
            ).scalar()
            or 0
        )

    def count_channel_members(self, channel_id: int) -> int:
        """Count members of a channel."""
        return (
            self.db.execute(
                select(func.count(ChannelMember.id)).where(ChannelMember.channel_id == channel_id)
            ).scalar()
            or 0
        )

    def create(self, membership: ChannelMember) -> ChannelMember:
        """Create a new membership."""
        self.db.add(membership)
        self.db.commit()
        self.db.refresh(membership)
        return membership

    def delete(self, membership: ChannelMember) -> None:
        """Delete a membership."""
        self.db.delete(membership)
        self.db.commit()
