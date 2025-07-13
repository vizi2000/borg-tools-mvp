"""
Main API router for v1 endpoints.
"""

from fastapi import APIRouter

from src.api.v1.endpoints import auth, cv, users, webhooks

# Create API router
api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/v1/auth", tags=["authentication"])
api_router.include_router(cv.router, prefix="/v1/cv", tags=["cv"])
api_router.include_router(users.router, prefix="/v1/users", tags=["users"])
api_router.include_router(webhooks.router, prefix="/v1/webhooks", tags=["webhooks"])