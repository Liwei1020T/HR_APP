"""
Authentication service for business logic.
"""
from sqlalchemy.orm import Session

from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.modules.users.repository import UserRepository
from app.modules.users.models import User


class AuthService:
    """Service for authentication business logic."""

    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def authenticate_user(self, email: str, password: str) -> User | None:
        """
        Authenticate user with email and password.
        Returns user if valid, None otherwise.
        """
        user = self.user_repo.get_by_email(email)

        if not user:
            return None

        if not user.is_active:
            return None

        if not verify_password(password, user.password_hash):
            return None

        return user

    def create_tokens(self, user: User) -> tuple[str, str]:
        """
        Create access and refresh tokens for user.
        Returns (access_token, refresh_token).
        """
        token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}

        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        return access_token, refresh_token

    def verify_refresh_token(self, token: str) -> dict | None:
        """
        Verify refresh token and return payload.
        Returns payload dict if valid, None otherwise.
        """
        payload = decode_token(token)

        if not payload or payload.get("type") != "refresh":
            return None

        return payload

    def get_user_from_refresh_token(self, token: str) -> User | None:
        """
        Get user from refresh token.
        Returns user if valid, None otherwise.
        """
        payload = self.verify_refresh_token(token)

        if not payload:
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        user = self.user_repo.get_by_id(int(user_id))

        if not user or not user.is_active:
            return None

        return user
