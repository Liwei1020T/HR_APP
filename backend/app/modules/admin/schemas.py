"""Admin schemas for request/response validation."""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class SystemMetrics(BaseModel):
    """System-wide metrics."""
    
    total_users: int
    active_users: int
    total_channels: int
    public_channels: int
    private_channels: int
    total_feedback: int
    pending_feedback: int
    in_progress_feedback: int
    resolved_feedback: int
    total_announcements: int
    active_announcements: int
    total_notifications: int
    unread_notifications: int
    total_files: int
    storage_used_mb: float


class UserMetrics(BaseModel):
    """User-specific metrics."""
    
    user_id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    feedback_submitted: int
    feedback_assigned: int
    channels_joined: int
    files_uploaded: int
    last_login: Optional[datetime] = None


class FeedbackAssignment(BaseModel):
    """Request to assign feedback to an HR staff."""
    
    feedback_id: int = Field(..., description="Feedback ID to assign")
    assignee_id: int = Field(..., description="HR staff user ID to assign to")


class FeedbackAssignmentResponse(BaseModel):
    """Response after feedback assignment."""
    
    feedback_id: int
    assignee_id: int
    assignee_name: str
    assigned_at: datetime
    message: str


class AuditLogEntry(BaseModel):
    """Audit log entry."""
    
    id: int
    user_id: Optional[int]
    user_email: Optional[str]
    action: str
    entity_type: Optional[str]
    entity_id: Optional[int]
    details: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    
    model_config = {"from_attributes": True}


class AuditLogList(BaseModel):
    """List of audit logs."""
    
    logs: list[AuditLogEntry]
    total: int
    page: int
    page_size: int


class UserStatusUpdate(BaseModel):
    """Request to update user status."""
    
    is_active: bool = Field(..., description="Whether user should be active")


class UserRoleUpdate(BaseModel):
    """Request to update user role."""
    
    role: str = Field(..., description="New role (employee, hr, admin, superadmin)")
