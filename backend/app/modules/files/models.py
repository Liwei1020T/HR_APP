"""File model for tracking uploaded files."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger
from sqlalchemy.orm import relationship
from app.db.base import Base


class File(Base):
    """File model for tracking uploaded files."""
    
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    size = Column(BigInteger, nullable=False)  # File size in bytes
    storage_path = Column(String, nullable=False)  # Relative path in storage
    
    # Track what the file is attached to
    entity_type = Column(String, nullable=True)  # e.g., "feedback", "announcement"
    entity_id = Column(Integer, nullable=True)  # ID of the entity
    
    # Audit fields
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    uploader = relationship("User", foreign_keys=[uploaded_by])
    
    def __repr__(self):
        return f"<File(id={self.id}, filename={self.filename}, size={self.size})>"
