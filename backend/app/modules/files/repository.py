"""File repository for database operations."""
from typing import Optional
from sqlalchemy.orm import Session
from app.modules.files.models import File


class FileRepository:
    """Repository for file database operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(
        self,
        filename: str,
        original_filename: str,
        content_type: str,
        size: int,
        storage_path: str,
        uploaded_by: int,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None
    ) -> File:
        """Create a new file record.
        
        Args:
            filename: Unique filename in storage
            original_filename: Original filename from upload
            content_type: MIME type
            size: File size in bytes
            storage_path: Relative path in storage
            uploaded_by: User ID who uploaded
            entity_type: Optional entity type
            entity_id: Optional entity ID
            
        Returns:
            Created file record
        """
        file_obj = File(
            filename=filename,
            original_filename=original_filename,
            content_type=content_type,
            size=size,
            storage_path=storage_path,
            uploaded_by=uploaded_by,
            entity_type=entity_type,
            entity_id=entity_id
        )
        self.db.add(file_obj)
        self.db.commit()
        self.db.refresh(file_obj)
        return file_obj
    
    def get_by_id(self, file_id: int) -> Optional[File]:
        """Get file by ID.
        
        Args:
            file_id: File ID
            
        Returns:
            File or None
        """
        return self.db.query(File).filter(File.id == file_id).first()
    
    def get_by_entity(self, entity_type: str, entity_id: int) -> list[File]:
        """Get files attached to an entity.
        
        Args:
            entity_type: Entity type
            entity_id: Entity ID
            
        Returns:
            List of files
        """
        return (
            self.db.query(File)
            .filter(File.entity_type == entity_type, File.entity_id == entity_id)
            .order_by(File.uploaded_at.desc())
            .all()
        )
    
    def get_by_uploader(self, user_id: int, skip: int = 0, limit: int = 100) -> list[File]:
        """Get files uploaded by a user.
        
        Args:
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of files
        """
        return (
            self.db.query(File)
            .filter(File.uploaded_by == user_id)
            .order_by(File.uploaded_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def delete(self, file_id: int) -> bool:
        """Delete file record.
        
        Args:
            file_id: File ID
            
        Returns:
            True if deleted, False if not found
        """
        file_obj = self.get_by_id(file_id)
        if file_obj:
            self.db.delete(file_obj)
            self.db.commit()
            return True
        return False
    
    def update_entity(self, file_id: int, entity_type: str, entity_id: int) -> Optional[File]:
        """Attach file to an entity.
        
        Args:
            file_id: File ID
            entity_type: Entity type
            entity_id: Entity ID
            
        Returns:
            Updated file or None
        """
        file_obj = self.get_by_id(file_id)
        if file_obj:
            file_obj.entity_type = entity_type
            file_obj.entity_id = entity_id
            self.db.commit()
            self.db.refresh(file_obj)
        return file_obj
