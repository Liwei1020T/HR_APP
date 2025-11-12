"""File service for business logic."""
from typing import Optional
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from app.modules.files.repository import FileRepository
from app.modules.files.models import File
from app.utils.storage import storage_service


class FileService:
    """Service for file operations."""
    
    # File size limit: 10MB
    MAX_FILE_SIZE = 10 * 1024 * 1024
    
    # Allowed file types
    ALLOWED_CONTENT_TYPES = {
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "text/csv",
    }
    
    def __init__(self, db: Session):
        self.repo = FileRepository(db)
    
    def upload_file(
        self,
        file: UploadFile,
        uploaded_by: int,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None
    ) -> File:
        """Upload a file.
        
        Args:
            file: Uploaded file
            uploaded_by: User ID who uploaded
            entity_type: Optional entity type to attach to
            entity_id: Optional entity ID to attach to
            
        Returns:
            Created file record
            
        Raises:
            HTTPException: If file validation fails
        """
        # Validate content type
        if file.content_type not in self.ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {file.content_type} not allowed"
            )
        
        # Read file to check size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()
        file.file.seek(0)  # Reset to beginning
        
        if file_size > self.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum of {self.MAX_FILE_SIZE / (1024*1024)}MB"
            )
        
        # Save to storage
        unique_filename, storage_path = storage_service.save_file(file)
        
        # Create database record
        file_record = self.repo.create(
            filename=unique_filename,
            original_filename=file.filename or "unnamed",
            content_type=file.content_type or "application/octet-stream",
            size=file_size,
            storage_path=storage_path,
            uploaded_by=uploaded_by,
            entity_type=entity_type,
            entity_id=entity_id
        )
        
        return file_record
    
    def get_file(self, file_id: int) -> Optional[File]:
        """Get file by ID.
        
        Args:
            file_id: File ID
            
        Returns:
            File or None
        """
        return self.repo.get_by_id(file_id)
    
    def get_files_by_entity(self, entity_type: str, entity_id: int) -> list[File]:
        """Get files attached to an entity.
        
        Args:
            entity_type: Entity type
            entity_id: Entity ID
            
        Returns:
            List of files
        """
        return self.repo.get_by_entity(entity_type, entity_id)
    
    def get_user_files(self, user_id: int, skip: int = 0, limit: int = 100) -> list[File]:
        """Get files uploaded by a user.
        
        Args:
            user_id: User ID
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of files
        """
        return self.repo.get_by_uploader(user_id, skip, limit)
    
    def delete_file(self, file_id: int, user_id: int, is_admin: bool = False) -> bool:
        """Delete a file.
        
        Args:
            file_id: File ID
            user_id: User ID requesting deletion
            is_admin: Whether user is admin
            
        Returns:
            True if deleted
            
        Raises:
            HTTPException: If not authorized or file not found
        """
        file_obj = self.repo.get_by_id(file_id)
        
        if not file_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Only uploader or admin can delete
        if file_obj.uploaded_by != user_id and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own files"
            )
        
        # Delete from storage
        storage_service.delete_file(file_obj.storage_path)
        
        # Delete from database
        self.repo.delete(file_id)
        
        return True
    
    def attach_to_entity(
        self,
        file_id: int,
        entity_type: str,
        entity_id: int,
        user_id: int
    ) -> File:
        """Attach file to an entity.
        
        Args:
            file_id: File ID
            entity_type: Entity type
            entity_id: Entity ID
            user_id: User ID making the request
            
        Returns:
            Updated file
            
        Raises:
            HTTPException: If not authorized or file not found
        """
        file_obj = self.repo.get_by_id(file_id)
        
        if not file_obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        # Only uploader can attach file
        if file_obj.uploaded_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only attach your own files"
            )
        
        updated_file = self.repo.update_entity(file_id, entity_type, entity_id)
        
        if not updated_file:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        return updated_file
