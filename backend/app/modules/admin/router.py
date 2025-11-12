"""Admin router for administrative endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user, require_roles
from app.modules.users.models import User
from app.modules.users.schemas import UserResponse
from app.modules.admin.service import AdminService
from app.modules.admin.schemas import (
    SystemMetrics, UserMetrics, FeedbackAssignment, FeedbackAssignmentResponse,
    AuditLogList, UserStatusUpdate, UserRoleUpdate
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/metrics/system", response_model=SystemMetrics)
def get_system_metrics(
    current_user: User = Depends(require_roles(["hr", "admin", "superadmin"])),
    db: Session = Depends(get_db)
):
    """Get system-wide metrics.
    
    Requires: HR, Admin, or Superadmin role
    
    Returns comprehensive system statistics including:
    - User counts
    - Channel statistics
    - Feedback status breakdown
    - Announcement and notification counts
    - File storage usage
    """
    service = AdminService(db)
    return service.get_system_metrics()


@router.get("/metrics/users", response_model=list[UserMetrics])
def get_user_metrics(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(require_roles(["admin", "superadmin"])),
    db: Session = Depends(get_db)
):
    """Get per-user metrics and activity.
    
    Requires: Admin or Superadmin role
    
    Returns detailed metrics for each user including:
    - Feedback submitted and assigned
    - Channels joined
    - Files uploaded
    """
    service = AdminService(db)
    return service.get_user_metrics(skip, limit)


@router.post("/feedback/assign", response_model=FeedbackAssignmentResponse)
def assign_feedback(
    assignment: FeedbackAssignment,
    current_user: User = Depends(require_roles(["hr", "admin", "superadmin"])),
    db: Session = Depends(get_db)
):
    """Assign feedback to an HR staff member.
    
    Requires: HR, Admin, or Superadmin role
    
    - **feedback_id**: ID of the feedback to assign
    - **assignee_id**: User ID of HR staff to assign to
    
    Automatically changes feedback status from PENDING to IN_PROGRESS.
    Creates an audit log entry for the assignment.
    """
    service = AdminService(db)
    return service.assign_feedback(
        assignment.feedback_id,
        assignment.assignee_id,
        current_user.id
    )


@router.patch("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    status_update: UserStatusUpdate,
    current_user: User = Depends(require_roles(["admin", "superadmin"])),
    db: Session = Depends(get_db)
):
    """Activate or deactivate a user.
    
    Requires: Admin or Superadmin role
    
    - **is_active**: Set to true to activate, false to deactivate
    
    Deactivated users cannot log in or perform any actions.
    Creates an audit log entry for the status change.
    """
    service = AdminService(db)
    user = service.update_user_status(user_id, status_update, current_user.id)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at
    )


@router.patch("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    current_user: User = Depends(require_roles(["superadmin"])),
    db: Session = Depends(get_db)
):
    """Update a user's role.
    
    Requires: Superadmin role only
    
    - **role**: New role (employee, hr, admin, superadmin)
    
    Role hierarchy:
    - employee: Basic access
    - hr: Can manage feedback, create announcements
    - admin: All HR permissions + user management
    - superadmin: Full system access
    
    Creates an audit log entry for the role change.
    """
    service = AdminService(db)
    user = service.update_user_role(user_id, role_update, current_user.id)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at
    )


@router.get("/audit-logs", response_model=AuditLogList)
def get_audit_logs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    current_user: User = Depends(require_roles(["admin", "superadmin"])),
    db: Session = Depends(get_db)
):
    """Get audit logs with filtering and pagination.
    
    Requires: Admin or Superadmin role
    
    Audit logs track all administrative actions including:
    - User status/role changes
    - Feedback assignments
    - System configuration changes
    
    Supports filtering by user, action type, and entity type.
    """
    service = AdminService(db)
    logs, total = service.get_audit_logs(
        page=page,
        page_size=page_size,
        user_id=user_id,
        action=action,
        entity_type=entity_type
    )
    
    return AuditLogList(
        logs=logs,
        total=total,
        page=page,
        page_size=page_size
    )
