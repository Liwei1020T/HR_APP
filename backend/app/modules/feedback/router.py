"""
Feedback routes for employee feedback and HR review system.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user, require_roles
from app.modules.users.models import User, UserRole
from app.modules.feedback.schemas import (
    FeedbackCreateRequest,
    FeedbackUpdateRequest,
    FeedbackStatusUpdateRequest,
    FeedbackResponse,
    FeedbackDetailResponse,
    FeedbackListResponse,
    FeedbackCommentCreateRequest,
    FeedbackCommentResponse,
)
from app.modules.feedback.service import FeedbackService
from app.modules.feedback.models import FeedbackStatus

router = APIRouter()


@router.post("", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def create_feedback(
    feedback_data: FeedbackCreateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Create new feedback (any authenticated user)."""
    service = FeedbackService(db)

    feedback = service.create_feedback(
        user_id=current_user.id,
        title=feedback_data.title,
        content=feedback_data.content,
        category=feedback_data.category.value,
        is_anonymous=feedback_data.is_anonymous,
        submitter_name=current_user.name,
    )

    response = FeedbackResponse.model_validate(feedback)
    # Handle anonymous feedback display
    if feedback.is_anonymous and feedback.submitted_by != current_user.id:
        response.submitter_name = "Anonymous"
    else:
        response.submitter_name = current_user.name

    response.assignee_name = None

    return response


@router.get("", response_model=FeedbackListResponse)
def list_feedback(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    status_filter: FeedbackStatus | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
):
    """
    List feedback.
    - Employees see only their own feedback
    - HR/Admin see all feedback
    """
    service = FeedbackService(db)

    feedback_list, total = service.get_all_feedback(
        user_id=current_user.id,
        user_role=current_user.role,
        status=status_filter,
        skip=skip,
        limit=limit,
    )

    # Build response with proper name handling
    from app.modules.users.models import User as UserModel
    responses = []
    for feedback in feedback_list:
        response = FeedbackResponse.model_validate(feedback)

        # Handle anonymous feedback display
        if feedback.is_anonymous and feedback.submitted_by != current_user.id:
            response.submitter_name = "Anonymous"
        else:
            submitter = db.query(UserModel).filter(UserModel.id == feedback.submitted_by).first()
            response.submitter_name = submitter.name if submitter else None

        if feedback.assigned_to:
            assignee = db.query(UserModel).filter(UserModel.id == feedback.assigned_to).first()
            response.assignee_name = assignee.name if assignee else None
        else:
            response.assignee_name = None

        responses.append(response)

    return FeedbackListResponse(feedback=responses, total=total)


@router.get("/{feedback_id}", response_model=FeedbackDetailResponse)
def get_feedback(
    feedback_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get feedback details with comments."""
    service = FeedbackService(db)

    feedback = service.get_feedback(feedback_id, load_comments=False)
    if not feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")

    # Check access permission
    if not service.can_user_access(feedback, current_user.id, current_user.role):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Get comments (filtered by user role)
    comments = service.get_comments(feedback_id, current_user.role)

    # Build response
    response = FeedbackDetailResponse.model_validate(feedback)

    # Handle anonymous feedback display
    if feedback.is_anonymous and feedback.submitted_by != current_user.id:
        response.submitter_name = "Anonymous"
    else:
        # Eagerly load submitter
        from app.modules.users.models import User
        submitter = db.query(User).filter(User.id == feedback.submitted_by).first()
        response.submitter_name = submitter.name if submitter else None

    # Eagerly load assignee if exists
    if feedback.assigned_to:
        from app.modules.users.models import User
        assignee = db.query(User).filter(User.id == feedback.assigned_to).first()
        response.assignee_name = assignee.name if assignee else None
    else:
        response.assignee_name = None

    # Build comment responses
    from app.modules.users.models import User
    response.comments = []
    for comment in comments:
        user = db.query(User).filter(User.id == comment.user_id).first()
        response.comments.append(
            FeedbackCommentResponse(
                **comment.__dict__,
                user_name=user.name if user else None,
            )
        )
    response.comment_count = len(comments)

    return response


@router.patch("/{feedback_id}", response_model=FeedbackResponse)
def update_feedback(
    feedback_id: int,
    update_data: FeedbackUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Update feedback (owner only, before review)."""
    service = FeedbackService(db)

    feedback = service.get_feedback(feedback_id)
    if not feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")

    # Check if user can modify
    if not service.can_user_modify(feedback, current_user.id, current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify feedback that has been reviewed",
        )

    try:
        updated_feedback = service.update_feedback(
            feedback,
            title=update_data.title,
            content=update_data.content,
            category=update_data.category.value if update_data.category else None,
        )

        from app.modules.users.models import User as UserModel
        response = FeedbackResponse.model_validate(updated_feedback)
        submitter = db.query(UserModel).filter(UserModel.id == updated_feedback.submitted_by).first()
        response.submitter_name = submitter.name if submitter else None
        
        if updated_feedback.assigned_to:
            assignee = db.query(UserModel).filter(UserModel.id == updated_feedback.assigned_to).first()
            response.assignee_name = assignee.name if assignee else None
        else:
            response.assignee_name = None

        return response
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{feedback_id}/status", response_model=FeedbackResponse)
def update_feedback_status(
    feedback_id: int,
    status_data: FeedbackStatusUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_roles(UserRole.HR, UserRole.ADMIN, UserRole.SUPERADMIN))],
):
    """Update feedback status (HR/Admin only)."""
    service = FeedbackService(db)

    feedback = service.get_feedback(feedback_id)
    if not feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")

    updated_feedback = service.update_status(
        feedback, status=status_data.status, assigned_to=status_data.assigned_to
    )

    from app.modules.users.models import User as UserModel
    response = FeedbackResponse.model_validate(updated_feedback)
    
    if updated_feedback.is_anonymous and updated_feedback.submitted_by != current_user.id:
        response.submitter_name = "Anonymous"
    else:
        submitter = db.query(UserModel).filter(UserModel.id == updated_feedback.submitted_by).first()
        response.submitter_name = submitter.name if submitter else None
    
    if updated_feedback.assigned_to:
        assignee = db.query(UserModel).filter(UserModel.id == updated_feedback.assigned_to).first()
        response.assignee_name = assignee.name if assignee else None
    else:
        response.assignee_name = None

    return response


@router.delete("/{feedback_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feedback(
    feedback_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Delete feedback (owner or admin)."""
    service = FeedbackService(db)

    feedback = service.get_feedback(feedback_id)
    if not feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")

    # Check permission: owner or admin
    is_owner = feedback.submitted_by == current_user.id
    is_admin = current_user.role in [UserRole.ADMIN, UserRole.SUPERADMIN]

    if not (is_owner or is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    service.delete_feedback(feedback)


# Comment endpoints
@router.post("/{feedback_id}/comments", response_model=FeedbackCommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    feedback_id: int,
    comment_data: FeedbackCommentCreateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Add a comment to feedback."""
    service = FeedbackService(db)

    feedback = service.get_feedback(feedback_id)
    if not feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")

    # Check access permission
    if not service.can_user_access(feedback, current_user.id, current_user.role):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Only HR can create internal comments
    is_internal = comment_data.is_internal
    if is_internal and current_user.role not in [UserRole.HR, UserRole.ADMIN, UserRole.SUPERADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR can create internal comments",
        )

    comment = service.add_comment(
        feedback_id=feedback_id,
        user_id=current_user.id,
        content=comment_data.content,
        is_internal=is_internal,
        commenter_name=current_user.name,
        submitter_id=feedback.submitted_by,
        feedback_title=feedback.title,
    )

    return FeedbackCommentResponse(
        **comment.__dict__,
        user_name=current_user.name,
    )


@router.get("/{feedback_id}/comments", response_model=list[FeedbackCommentResponse])
def list_comments(
    feedback_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """List comments for feedback."""
    service = FeedbackService(db)

    feedback = service.get_feedback(feedback_id)
    if not feedback:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")

    # Check access permission
    if not service.can_user_access(feedback, current_user.id, current_user.role):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    comments = service.get_comments(feedback_id, current_user.role)

    return [
        FeedbackCommentResponse(
            **comment.__dict__,
            user_name=comment.user.name if comment.user else None,
        )
        for comment in comments
    ]
