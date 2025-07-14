"""User service for business logic and operations."""
from typing import Optional, List
from uuid import UUID
import logging

from ..repositories import UserRepository, CVGenerationRepository
from ..models.database import UserDB, UserCreate, UserUpdate

logger = logging.getLogger(__name__)


class UserService:
    """Service layer for user operations."""
    
    def __init__(self):
        """Initialize service with repositories."""
        self.user_repo = UserRepository()
        self.cv_repo = CVGenerationRepository()
    
    async def get_user_profile(self, user_id: UUID) -> Optional[UserDB]:
        """Get complete user profile by ID."""
        try:
            return await self.user_repo.get_by_id(user_id)
        except Exception as e:
            logger.error(f"Failed to get user profile: {e}")
            return None
    
    async def get_user_by_github_id(self, github_id: int) -> Optional[UserDB]:
        """Get user by GitHub ID."""
        try:
            return await self.user_repo.get_by_github_id(github_id)
        except Exception as e:
            logger.error(f"Failed to get user by GitHub ID: {e}")
            return None
    
    async def create_or_update_user(self, user_data: UserCreate) -> Optional[UserDB]:
        """Create new user or update existing user."""
        try:
            return await self.user_repo.upsert(user_data)
        except Exception as e:
            logger.error(f"Failed to create/update user: {e}")
            return None
    
    async def update_user_profile(self, user_id: UUID, user_data: UserUpdate) -> Optional[UserDB]:
        """Update user profile information."""
        try:
            return await self.user_repo.update(user_id, user_data)
        except Exception as e:
            logger.error(f"Failed to update user profile: {e}")
            return None
    
    async def get_user_stats(self, user_id: UUID) -> dict:
        """Get user statistics including CV count, etc."""
        try:
            user = await self.user_repo.get_by_id(user_id)
            if not user:
                return {}
            
            # Get CV generation count
            cv_list = await self.cv_repo.get_by_user_id(user_id, limit=100)
            cv_count = len(cv_list)
            completed_cvs = len([cv for cv in cv_list if cv.status == 'completed'])
            
            return {
                "user_id": str(user_id),
                "username": user.github_username,
                "email": user.email,
                "full_name": user.full_name,
                "avatar_url": user.avatar_url,
                "created_at": user.created_at,
                "last_login_at": user.last_login_at,
                "total_cvs": cv_count,
                "completed_cvs": completed_cvs,
                "success_rate": (completed_cvs / cv_count * 100) if cv_count > 0 else 0
            }
        except Exception as e:
            logger.error(f"Failed to get user stats: {e}")
            return {}
    
    async def delete_user_account(self, user_id: UUID) -> bool:
        """Delete user account and all associated data."""
        try:
            # This is a soft delete in production
            # For now, we'll just mark as deleted or actually delete
            # You might want to anonymize data instead
            
            # Get all user's CV generations
            cv_list = await self.cv_repo.get_by_user_id(user_id, limit=1000)
            
            # Delete all CV generations
            for cv in cv_list:
                await self.cv_repo.delete(cv.id)
            
            # Delete user
            return await self.user_repo.delete(user_id)
        except Exception as e:
            logger.error(f"Failed to delete user account: {e}")
            return False