"""Audit log model for tracking system actions."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base import Base


class AuditLog(Base):
    """Audit log for tracking user actions."""
    
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # User who performed the action (nullable for system actions)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Action details
    action = Column(String, nullable=False)  # e.g., "user.created", "feedback.updated"
    entity_type = Column(String, nullable=True)  # e.g., "user", "feedback", "channel"
    entity_id = Column(Integer, nullable=True)  # ID of the affected entity
    details = Column(Text, nullable=True)  # JSON or text details
    
    # Request metadata
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, user_id={self.user_id})>"
