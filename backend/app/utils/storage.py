"""Local file storage service."""
import os
import uuid
from pathlib import Path
from typing import BinaryIO
from fastapi import UploadFile


class LocalStorageService:
    """Service for storing files locally."""
    
    def __init__(self, base_path: str = "uploads"):
        """Initialize storage service.
        
        Args:
            base_path: Base directory for storing files
        """
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    def save_file(self, file: UploadFile) -> tuple[str, str]:
        """Save uploaded file to local storage.
        
        Args:
            file: The uploaded file
            
        Returns:
            Tuple of (unique_filename, relative_storage_path)
        """
        # Generate unique filename
        file_ext = Path(file.filename or "file").suffix
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        
        # Create storage path (organize by year/month)
        from datetime import datetime
        now = datetime.utcnow()
        storage_dir = self.base_path / str(now.year) / f"{now.month:02d}"
        storage_dir.mkdir(parents=True, exist_ok=True)
        
        # Full file path
        file_path = storage_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            content = file.file.read()
            buffer.write(content)
        
        # Return relative path from base_path
        relative_path = str(file_path.relative_to(self.base_path))
        
        return unique_filename, relative_path
    
    def get_file_path(self, storage_path: str) -> Path:
        """Get absolute file path from storage path.
        
        Args:
            storage_path: Relative storage path
            
        Returns:
            Absolute file path
        """
        return self.base_path / storage_path
    
    def delete_file(self, storage_path: str) -> bool:
        """Delete file from storage.
        
        Args:
            storage_path: Relative storage path
            
        Returns:
            True if deleted, False if not found
        """
        file_path = self.get_file_path(storage_path)
        if file_path.exists():
            file_path.unlink()
            return True
        return False
    
    def file_exists(self, storage_path: str) -> bool:
        """Check if file exists in storage.
        
        Args:
            storage_path: Relative storage path
            
        Returns:
            True if exists, False otherwise
        """
        return self.get_file_path(storage_path).exists()


# Global storage service instance
storage_service = LocalStorageService()
