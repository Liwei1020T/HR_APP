"""Admin service for business logic."""
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.modules.admin.repository import AdminRepository
from app.modules.admin.schemas import (
    SystemMetrics, UserMetrics, FeedbackAssignmentResponse,
    AuditLogEntry, UserStatusUpdate, UserRoleUpdate
)
from app.modules.users.models import User, UserRole
from app.modules.feedback.models import Feedback, FeedbackStatus
from datetime import datetime


class AdminService:
    """Service for admin operations."""
    
    def __init__(self, db: Session):
        self.repo = AdminRepository(db)
        self.db = db
    
    def get_system_metrics(self) -> SystemMetrics:
        """Get system-wide metrics.
        
        Returns:
            System metrics
        """
        metrics = self.repo.get_system_metrics()
        return SystemMetrics(**metrics)
    
    def get_user_metrics(self, skip: int = 0, limit: int = 100) -> list[UserMetrics]:
        """Get per-user metrics.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of user metrics
        """
        metrics = self.repo.get_user_metrics(skip, limit)
        return [UserMetrics(**m) for m in metrics]
    
    def assign_feedback(
        self,
        feedback_id: int,
        assignee_id: int,
        admin_id: int
    ) -> FeedbackAssignmentResponse:
        """Assign feedback to an HR staff member.
        
        Args:
            feedback_id: Feedback to assign
            assignee_id: HR staff to assign to
            admin_id: Admin making the assignment
            
        Returns:
            Assignment response
            
        Raises:
            HTTPException: If validation fails
        """
        # Get feedback
        feedback = self.db.query(Feedback).filter(Feedback.id == feedback_id).first()
        if not feedback:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feedback not found"
            )
        
        # Get assignee
        assignee = self.db.query(User).filter(User.id == assignee_id).first()
        if not assignee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignee not found"
            )
        
        # Verify assignee is HR or above
        if assignee.role not in ["hr", "admin", "superadmin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only assign to HR staff or admins"
            )
        
        # Update feedback
        feedback.assigned_to = assignee_id
        if feedback.status == FeedbackStatus.PENDING:
            feedback.status = FeedbackStatus.IN_PROGRESS
        
        self.db.commit()
        
        # Log the assignment
        self.repo.create_audit_log(
            action="feedback.assigned",
            user_id=admin_id,
            entity_type="feedback",
            entity_id=feedback_id,
            details=f"Assigned to user {assignee_id} ({assignee.full_name})"
        )
        
        return FeedbackAssignmentResponse(
            feedback_id=feedback_id,
            assignee_id=assignee_id,
            assignee_name=assignee.full_name,
            assigned_at=datetime.utcnow(),
            message=f"Feedback assigned to {assignee.full_name}"
        )
    
    def update_user_status(
        self,
        user_id: int,
        status_update: UserStatusUpdate,
        admin_id: int
    ) -> User:
        """Update user active status.
        
        Args:
            user_id: User to update
            status_update: Status update
            admin_id: Admin making the change
            
        Returns:
            Updated user
            
        Raises:
            HTTPException: If user not found
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        old_status = user.is_active
        user.is_active = status_update.is_active
        self.db.commit()
        self.db.refresh(user)
        
        # Log the change
        self.repo.create_audit_log(
            action="user.status_updated",
            user_id=admin_id,
            entity_type="user",
            entity_id=user_id,
            details=f"Status changed from {old_status} to {status_update.is_active}"
        )
        
        return user
    
    def update_user_role(
        self,
        user_id: int,
        role_update: UserRoleUpdate,
        admin_id: int
    ) -> User:
        """Update user role.
        
        Args:
            user_id: User to update
            role_update: Role update
            admin_id: Admin making the change
            
        Returns:
            Updated user
            
        Raises:
            HTTPException: If validation fails
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Validate role
        try:
            new_role = UserRole(role_update.role)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role: {role_update.role}"
            )
        
        old_role = user.role
        user.role = new_role.value
        self.db.commit()
        self.db.refresh(user)
        
        # Log the change
        self.repo.create_audit_log(
            action="user.role_updated",
            user_id=admin_id,
            entity_type="user",
            entity_id=user_id,
            details=f"Role changed from {old_role} to {new_role.value}"
        )
        
        return user
    
    def get_audit_logs(
        self,
        page: int = 1,
        page_size: int = 50,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None
    ) -> tuple[list[AuditLogEntry], int]:
        """Get audit logs with pagination.
        
        Args:
            page: Page number (1-indexed)
            page_size: Items per page
            user_id: Filter by user
            action: Filter by action
            entity_type: Filter by entity type
            
        Returns:
            Tuple of (logs, total_count)
        """
        skip = (page - 1) * page_size
        logs, total = self.repo.get_audit_logs(
            skip=skip,
            limit=page_size,
            user_id=user_id,
            action=action,
            entity_type=entity_type
        )
        
        # Convert to response models
        log_entries = []
        for log in logs:
            log_entries.append(AuditLogEntry(
                id=log.id,
                user_id=log.user_id,
                user_email=log.user.email if log.user else None,
                action=log.action,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                details=log.details,
                ip_address=log.ip_address,
                created_at=log.created_at
            ))
        
        return log_entries, total
