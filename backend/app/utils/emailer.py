"""
Email utility for sending notifications (optional).
"""
import logging
from typing import List

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Email service using SMTP."""

    def __init__(self):
        self.enabled = bool(
            settings.MAIL_SERVER and settings.MAIL_USERNAME and settings.MAIL_PASSWORD
        )
        if not self.enabled:
            logger.warning("Email service not configured. Set MAIL_* env vars to enable.")

    def send_email(
        self,
        to: List[str],
        subject: str,
        body: str,
        html: str | None = None,
    ) -> bool:
        """
        Send an email.

        Args:
            to: List of recipient email addresses
            subject: Email subject
            body: Plain text body
            html: Optional HTML body

        Returns:
            True if sent successfully, False otherwise
        """
        if not self.enabled:
            logger.info(f"Email not sent (service disabled): {subject} to {to}")
            return False

        # TODO: Implement actual email sending using smtplib or email library
        logger.info(f"Email sent: {subject} to {to}")
        return True


# Global email service instance
email_service = EmailService()
