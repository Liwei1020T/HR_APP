"""File router for file upload/download endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.files.service import FileService
from app.modules.files.schemas import FileUploadResponse, FileListResponse, FileMetadata
from app.utils.storage import storage_service

router = APIRouter(prefix="/files", tags=["files"])


@router.post("", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_file(
    file: UploadFile = FastAPIFile(...),
    entity_type: Optional[str] = Query(None, description="Entity type to attach to"),
    entity_id: Optional[int] = Query(None, description="Entity ID to attach to"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file.
    
    - **file**: File to upload (max 10MB)
    - **entity_type**: Optional entity type (e.g., "feedback", "announcement")
    - **entity_id**: Optional entity ID
    
    Allowed file types: images (jpg, png, gif, webp), PDF, Word, Excel, text, CSV
    """
    service = FileService(db)
    file_obj = service.upload_file(file, current_user.id, entity_type, entity_id)
    
    # Get uploader name
    return FileUploadResponse(
        id=file_obj.id,
        filename=file_obj.filename,
        original_filename=file_obj.original_filename,
        content_type=file_obj.content_type,
        size=file_obj.size,
        storage_path=file_obj.storage_path,
        entity_type=file_obj.entity_type,
        entity_id=file_obj.entity_id,
        uploaded_by=file_obj.uploaded_by,
        uploaded_at=file_obj.uploaded_at,
        uploader_name=file_obj.uploader.full_name
    )


@router.get("/me", response_model=FileListResponse)
def get_my_files(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get files uploaded by current user."""
    service = FileService(db)
    files = service.get_user_files(current_user.id, skip, limit)
    
    return FileListResponse(
        files=[
            FileUploadResponse(
                id=f.id,
                filename=f.filename,
                original_filename=f.original_filename,
                content_type=f.content_type,
                size=f.size,
                storage_path=f.storage_path,
                entity_type=f.entity_type,
                entity_id=f.entity_id,
                uploaded_by=f.uploaded_by,
                uploaded_at=f.uploaded_at,
                uploader_name=f.uploader.full_name
            )
            for f in files
        ],
        total=len(files)
    )


@router.get("/{file_id}", response_class=FileResponse)
def download_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a file by ID."""
    service = FileService(db)
    file_obj = service.get_file(file_id)
    
    if not file_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Get file path from storage
    file_path = storage_service.get_file_path(file_obj.storage_path)
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found in storage"
        )
    
    return FileResponse(
        path=file_path,
        media_type=file_obj.content_type,
        filename=file_obj.original_filename
    )


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a file. Only uploader or admin can delete."""
    service = FileService(db)
    is_admin = current_user.role in ["admin", "superadmin"]
    service.delete_file(file_id, current_user.id, is_admin)
    return None


@router.patch("/{file_id}/attach", response_model=FileUploadResponse)
def attach_file_to_entity(
    file_id: int,
    metadata: FileMetadata,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Attach a file to an entity (feedback, announcement, etc.)."""
    service = FileService(db)
    file_obj = service.attach_to_entity(
        file_id,
        metadata.entity_type,
        metadata.entity_id,
        current_user.id
    )
    
    return FileUploadResponse(
        id=file_obj.id,
        filename=file_obj.filename,
        original_filename=file_obj.original_filename,
        content_type=file_obj.content_type,
        size=file_obj.size,
        storage_path=file_obj.storage_path,
        entity_type=file_obj.entity_type,
        entity_id=file_obj.entity_id,
        uploaded_by=file_obj.uploaded_by,
        uploaded_at=file_obj.uploaded_at,
        uploader_name=file_obj.uploader.full_name
    )


@router.get("/entity/{entity_type}/{entity_id}", response_model=FileListResponse)
def get_entity_files(
    entity_type: str,
    entity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all files attached to an entity."""
    service = FileService(db)
    files = service.get_files_by_entity(entity_type, entity_id)
    
    return FileListResponse(
        files=[
            FileUploadResponse(
                id=f.id,
                filename=f.filename,
                original_filename=f.original_filename,
                content_type=f.content_type,
                size=f.size,
                storage_path=f.storage_path,
                entity_type=f.entity_type,
                entity_id=f.entity_id,
                uploaded_by=f.uploaded_by,
                uploaded_at=f.uploaded_at,
                uploader_name=f.uploader.full_name
            )
            for f in files
        ],
        total=len(files)
    )
