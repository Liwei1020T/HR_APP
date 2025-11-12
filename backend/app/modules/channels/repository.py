"""
Channel repository for database operations.
"""
from typing import List
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.modules.channels.models import Channel, ChannelMember


class ChannelRepository:
    """Repository for Channel database operations."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, channel_id: int) -> Channel | None:
        """Get channel by ID."""
        return self.db.execute(
            select(Channel).where(Channel.id == channel_id)
        ).scalar_one_or_none()

    def get_by_name(self, name: str) -> Channel | None:
        """Get channel by name."""
        return self.db.execute(select(Channel).where(Channel.name == name)).scalar_one_or_none()

    def get_all(
        self, skip: int = 0, limit: int = 100, is_public: bool | None = None
    ) -> List[Channel]:
        """Get all channels with optional filters."""
        query = select(Channel)

        if is_public is not None:
            query = query.where(Channel.is_public == is_public)

        query = query.offset(skip).limit(limit).order_by(Channel.created_at.desc())
        return list(self.db.execute(query).scalars().all())

    def count(self, is_public: bool | None = None) -> int:
        """Count channels with optional filters."""
        query = select(func.count(Channel.id))

        if is_public is not None:
            query = query.where(Channel.is_public == is_public)

        return self.db.execute(query).scalar() or 0

    def create(self, channel: Channel) -> Channel:
        """Create a new channel."""
        self.db.add(channel)
        self.db.commit()
        self.db.refresh(channel)
        return channel

    def update(self, channel: Channel) -> Channel:
        """Update a channel."""
        self.db.commit()
        self.db.refresh(channel)
        return channel

    def delete(self, channel: Channel) -> None:
        """Delete a channel."""
        self.db.delete(channel)
        self.db.commit()

    def get_member_count(self, channel_id: int) -> int:
        """Get member count for a channel."""
        return (
            self.db.execute(
                select(func.count(ChannelMember.id)).where(ChannelMember.channel_id == channel_id)
            ).scalar()
            or 0
        )

    def is_member(self, channel_id: int, user_id: int) -> bool:
        """Check if user is a member of the channel."""
        result = self.db.execute(
            select(ChannelMember)
            .where(ChannelMember.channel_id == channel_id)
            .where(ChannelMember.user_id == user_id)
        ).scalar_one_or_none()
        return result is not None
