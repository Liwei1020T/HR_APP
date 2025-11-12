"""
Authentication routes for login, refresh, and logout.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.users.schemas import UserResponse
from app.modules.auth.schemas import (
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    AccessTokenResponse,
)
from app.modules.auth.service import AuthService

router = APIRouter()


@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Login with email and password.
    Returns access and refresh tokens.
    """
    service = AuthService(db)

    # Authenticate user
    user = service.authenticate_user(login_data.email, login_data.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create tokens
    access_token, refresh_token = service.create_tokens(user)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=AccessTokenResponse)
def refresh_token(
    refresh_data: RefreshRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Refresh access token using refresh token.
    Returns new access token.
    """
    service = AuthService(db)

    # Get user from refresh token
    user = service.get_user_from_refresh_token(refresh_data.refresh_token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create new access token
    access_token, _ = service.create_tokens(user)

    return AccessTokenResponse(access_token=access_token)


@router.post("/logout")
def logout(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Logout (client should discard tokens).
    This is a placeholder - actual token invalidation would require a blacklist.
    """
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get current authenticated user."""
    return current_user
