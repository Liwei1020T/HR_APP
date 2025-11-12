"""
Channel service for business logic.
"""
from typing import List

from sqlalchemy.orm import Session

from app.modules.channels.models import Channel
from app.modules.channels.repository import ChannelRepository
from app.modules.channels.schemas import ChannelCreate, ChannelUpdate


class ChannelService:
    """Service for channel business logic."""

    def __init__(self, db: Session):
        self.repo = ChannelRepository(db)

    def get_channel_by_id(self, channel_id: int) -> Channel | None:
        """Get channel by ID."""
        return self.repo.get_by_id(channel_id)

    def get_channels(
        self, skip: int = 0, limit: int = 100, is_public: bool | None = None
    ) -> tuple[List[Channel], int]:
        """Get channels with pagination and filters."""
        channels = self.repo.get_all(skip=skip, limit=limit, is_public=is_public)
        total = self.repo.count(is_public=is_public)
        return channels, total

    def create_channel(self, channel_data: ChannelCreate, created_by: int) -> Channel:
        """Create a new channel."""
        # Check if channel name already exists
        existing = self.repo.get_by_name(channel_data.name)
        if existing:
            raise ValueError(f"Channel with name '{channel_data.name}' already exists")

        channel = Channel(
            name=channel_data.name,
            description=channel_data.description,
            is_public=channel_data.is_public,
            created_by=created_by,
        )

        return self.repo.create(channel)

    def update_channel(self, channel: Channel, update_data: ChannelUpdate) -> Channel:
        """Update a channel."""
        if update_data.name is not None:
            # Check if new name conflicts with existing channel
            existing = self.repo.get_by_name(update_data.name)
            if existing and existing.id != channel.id:
                raise ValueError(f"Channel with name '{update_data.name}' already exists")
            channel.name = update_data.name

        if update_data.description is not None:
            channel.description = update_data.description

        if update_data.is_public is not None:
            channel.is_public = update_data.is_public

        return self.repo.update(channel)

    def delete_channel(self, channel: Channel) -> None:
        """Delete a channel."""
        self.repo.delete(channel)

    def get_member_count(self, channel_id: int) -> int:
        """Get member count for a channel."""
        return self.repo.get_member_count(channel_id)

    def is_member(self, channel_id: int, user_id: int) -> bool:
        """Check if user is a member of the channel."""
        return self.repo.is_member(channel_id, user_id)
