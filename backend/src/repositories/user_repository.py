"""User repository for database operations."""
from typing import Optional, List
from uuid import UUID
from datetime import datetime
import logging
from supabase import Client
from ..models.database import UserDB, UserCreate, UserUpdate
from ..core.supabase import get_supabase

logger = logging.getLogger(__name__)


class UserRepository:
    """Repository for user database operations."""
    
    def __init__(self, supabase_client: Optional[Client] = None):
        """Initialize repository with Supabase client."""
        self.client = supabase_client or get_supabase()
    
    async def create(self, user_data: UserCreate) -> Optional[UserDB]:
        """Create a new user in the database."""
        try:
            result = self.client.table("users").insert(user_data.model_dump()).execute()
            if result.data and len(result.data) > 0:
                return UserDB(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to create user: {e}")
            return None
    
    async def get_by_id(self, user_id: UUID) -> Optional[UserDB]:
        """Get user by ID."""
        try:
            result = self.client.table("users").select("*").eq("id", str(user_id)).execute()
            if result.data and len(result.data) > 0:
                return UserDB(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to get user by ID: {e}")
            return None
    
    async def get_by_github_id(self, github_id: int) -> Optional[UserDB]:
        """Get user by GitHub ID."""
        try:
            result = self.client.table("users").select("*").eq("github_id", github_id).execute()
            if result.data and len(result.data) > 0:
                return UserDB(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to get user by GitHub ID: {e}")
            return None
    
    async def get_by_username(self, github_username: str) -> Optional[UserDB]:
        """Get user by GitHub username."""
        try:
            result = self.client.table("users").select("*").eq("github_username", github_username).execute()
            if result.data and len(result.data) > 0:
                return UserDB(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to get user by username: {e}")
            return None
    
    async def update(self, user_id: UUID, user_data: UserUpdate) -> Optional[UserDB]:
        """Update user information."""
        try:
            update_data = user_data.model_dump(exclude_unset=True)
            result = self.client.table("users").update(update_data).eq("id", str(user_id)).execute()
            if result.data and len(result.data) > 0:
                return UserDB(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to update user: {e}")
            return None
    
    async def update_last_login(self, user_id: UUID) -> Optional[UserDB]:
        """Update user's last login timestamp."""
        try:
            result = self.client.table("users").update({
                "last_login_at": datetime.utcnow().isoformat()
            }).eq("id", str(user_id)).execute()
            if result.data and len(result.data) > 0:
                return UserDB(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to update last login: {e}")
            return None
    
    async def delete(self, user_id: UUID) -> bool:
        """Delete a user (soft delete recommended in production)."""
        try:
            result = self.client.table("users").delete().eq("id", str(user_id)).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to delete user: {e}")
            return False
    
    async def upsert(self, user_data: UserCreate) -> Optional[UserDB]:
        """Create or update user based on GitHub ID."""
        try:
            # Check if user exists
            existing = await self.get_by_github_id(user_data.github_id)
            
            if existing:
                # Update existing user
                update_data = UserUpdate(**user_data.model_dump())
                update_data.last_login_at = datetime.utcnow()
                return await self.update(existing.id, update_data)
            else:
                # Create new user
                return await self.create(user_data)
        except Exception as e:
            logger.error(f"Failed to upsert user: {e}")
            return None