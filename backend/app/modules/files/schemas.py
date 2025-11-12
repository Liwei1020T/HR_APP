"""File schemas for request/response validation."""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class FileUploadResponse(BaseModel):
    """Response after file upload."""
    
    id: int
    filename: str
    original_filename: str
    content_type: str
    size: int
    storage_path: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    uploaded_by: int
    uploaded_at: datetime
    uploader_name: str
    
    model_config = {"from_attributes": True}


class FileListResponse(BaseModel):
    """Response for listing files."""
    
    files: list[FileUploadResponse]
    total: int


class FileMetadata(BaseModel):
    """File metadata for attaching to entities."""
    
    entity_type: str = Field(..., description="Type of entity (feedback, announcement)")
    entity_id: int = Field(..., description="ID of the entity")
