"""Admin repository for database operations."""
from typing import Optional
from sqlalchemy import func, case
from sqlalchemy.orm import Session
from app.modules.admin.models import AuditLog
from app.modules.users.models import User
from app.modules.channels.models import Channel
from app.modules.feedback.models import Feedback, FeedbackStatus
from app.modules.announcements.models import Announcement
from app.modules.notifications.models import Notification
from app.modules.files.models import File
from datetime import datetime


class AdminRepository:
    """Repository for admin operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_system_metrics(self) -> dict:
        """Get system-wide metrics.
        
        Returns:
            Dictionary of metrics
        """
        # User metrics
        total_users = self.db.query(User).count()
        active_users = self.db.query(User).filter(User.is_active == True).count()
        
        # Channel metrics
        total_channels = self.db.query(Channel).count()
        public_channels = self.db.query(Channel).filter(Channel.is_private == False).count()
        private_channels = self.db.query(Channel).filter(Channel.is_private == True).count()
        
        # Feedback metrics
        total_feedback = self.db.query(Feedback).count()
        pending_feedback = self.db.query(Feedback).filter(
            Feedback.status == FeedbackStatus.PENDING
        ).count()
        in_progress_feedback = self.db.query(Feedback).filter(
            Feedback.status == FeedbackStatus.IN_PROGRESS
        ).count()
        resolved_feedback = self.db.query(Feedback).filter(
            Feedback.status == FeedbackStatus.RESOLVED
        ).count()
        
        # Announcement metrics
        total_announcements = self.db.query(Announcement).count()
        active_announcements = self.db.query(Announcement).filter(
            Announcement.is_active == True
        ).count()
        
        # Notification metrics
        total_notifications = self.db.query(Notification).count()
        unread_notifications = self.db.query(Notification).filter(
            Notification.is_read == False
        ).count()
        
        # File metrics
        total_files = self.db.query(File).count()
        storage_used = self.db.query(func.sum(File.size)).scalar() or 0
        storage_used_mb = storage_used / (1024 * 1024)
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "total_channels": total_channels,
            "public_channels": public_channels,
            "private_channels": private_channels,
            "total_feedback": total_feedback,
            "pending_feedback": pending_feedback,
            "in_progress_feedback": in_progress_feedback,
            "resolved_feedback": resolved_feedback,
            "total_announcements": total_announcements,
            "active_announcements": active_announcements,
            "total_notifications": total_notifications,
            "unread_notifications": unread_notifications,
            "total_files": total_files,
            "storage_used_mb": round(storage_used_mb, 2)
        }
    
    def get_user_metrics(self, skip: int = 0, limit: int = 100) -> list[dict]:
        """Get per-user metrics.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List of user metrics
        """
        users = self.db.query(User).offset(skip).limit(limit).all()
        
        metrics = []
        for user in users:
            # Count feedback submitted
            feedback_submitted = self.db.query(Feedback).filter(
                Feedback.submitted_by == user.id
            ).count()
            
            # Count feedback assigned
            feedback_assigned = self.db.query(Feedback).filter(
                Feedback.assigned_to == user.id
            ).count()
            
            # Count channels joined
            from app.modules.memberships.models import ChannelMember
            channels_joined = self.db.query(ChannelMember).filter(
                ChannelMember.user_id == user.id
            ).count()
            
            # Count files uploaded
            files_uploaded = self.db.query(File).filter(
                File.uploaded_by == user.id
            ).count()
            
            metrics.append({
                "user_id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": user.created_at,
                "feedback_submitted": feedback_submitted,
                "feedback_assigned": feedback_assigned,
                "channels_joined": channels_joined,
                "files_uploaded": files_uploaded,
                "last_login": None  # TODO: Track last login in auth
            })
        
        return metrics
    
    def create_audit_log(
        self,
        action: str,
        user_id: Optional[int] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        details: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> AuditLog:
        """Create an audit log entry.
        
        Args:
            action: Action performed
            user_id: User who performed action
            entity_type: Type of entity affected
            entity_id: ID of entity affected
            details: Additional details
            ip_address: IP address of request
            user_agent: User agent string
            
        Returns:
            Created audit log
        """
        log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log
    
    def get_audit_logs(
        self,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None
    ) -> tuple[list[AuditLog], int]:
        """Get audit logs with filtering.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records
            user_id: Filter by user
            action: Filter by action
            entity_type: Filter by entity type
            
        Returns:
            Tuple of (logs, total_count)
        """
        query = self.db.query(AuditLog)
        
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        if action:
            query = query.filter(AuditLog.action == action)
        if entity_type:
            query = query.filter(AuditLog.entity_type == entity_type)
        
        total = query.count()
        logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
        
        return logs, total
