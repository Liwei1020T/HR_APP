"""
FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router
from app.modules.channels.router import router as channels_router
from app.modules.memberships.router import router as memberships_router
from app.modules.feedback.router import router as feedback_router
from app.modules.notifications.router import router as notifications_router
from app.modules.announcements.router import router as announcements_router
from app.modules.files.router import router as files_router
from app.modules.admin.router import router as admin_router

# Import subscribers to register event handlers
import app.modules.notifications.subscribers  # noqa: F401

app = FastAPI(
    title="HR App API",
    description="Modular monolith HR management system",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "HR App API is running"}


@app.get("/health")
def health():
    """Detailed health check."""
    return {"status": "healthy", "version": "0.1.0"}


# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/v1/users", tags=["users"])
app.include_router(channels_router, prefix="/api/v1/channels", tags=["channels"])
app.include_router(memberships_router, prefix="/api/v1/memberships", tags=["memberships"])
app.include_router(feedback_router, prefix="/api/v1/feedback", tags=["feedback"])
app.include_router(notifications_router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(announcements_router, prefix="/api/v1/announcements", tags=["announcements"])
app.include_router(files_router, prefix="/api/v1/files", tags=["files"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["admin"])
