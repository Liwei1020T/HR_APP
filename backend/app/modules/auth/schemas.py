"""
Authentication schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    """Schema for login request."""

    email: EmailStr
    password: str = Field(..., min_length=1)


class TokenResponse(BaseModel):
    """Schema for token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """Schema for refresh token request."""

    refresh_token: str


class AccessTokenResponse(BaseModel):
    """Schema for access token response."""

    access_token: str
    token_type: str = "bearer"
