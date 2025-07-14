"""Auth Session repository for database operations."""
from typing import Optional, List
from uuid import UUID
from datetime import datetime
import logging
from supabase import Client
from ..models.database import AuthSessionDB, AuthSessionCreate
from ..core.supabase import get_supabase

logger = logging.getLogger(__name__)


class AuthSessionRepository:
    """Repository for auth session database operations."""
    
    def __init__(self, supabase_client: Optional[Client] = None):
        """Initialize repository with Supabase client."""
        self.client = supabase_client or get_supabase()
    
    async def create(self, session_data: AuthSessionCreate) -> Optional[AuthSessionDB]:
        """Create a new auth session."""
        try:
            result = self.client.table("auth_sessions").insert(session_data.model_dump()).execute()
            if result.data and len(result.data) > 0:
                return AuthSessionDB(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to create auth session: {e}")
            return None
    
    async def get_by_id(self, session_id: UUID) -> Optional[AuthSessionDB]:
        """Get auth session by ID."""
        try:
            result = self.client.table("auth_sessions").select("*").eq("id", str(session_id)).execute()
            if result.data and len(result.data) > 0:
                return AuthSessionDB(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to get auth session by ID: {e}")
            return None
    
    async def get_by_access_token(self, access_token: str) -> Optional[AuthSessionDB]:
        """Get auth session by access token."""
        try:
            result = self.client.table("auth_sessions").select("*").eq("access_token", access_token).execute()
            if result.data and len(result.data) > 0:
                return AuthSessionDB(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to get auth session by token: {e}")
            return None
    
    async def get_active_sessions(self, user_id: UUID) -> List[AuthSessionDB]:
        """Get active sessions for a user."""
        try:
            result = self.client.table("auth_sessions").select("*").eq(
                "user_id", str(user_id)
            ).gt("expires_at", datetime.utcnow().isoformat()).execute()
            
            if result.data:
                return [AuthSessionDB(**session) for session in result.data]
            return []
        except Exception as e:
            logger.error(f"Failed to get active sessions: {e}")
            return []
    
    async def update_last_used(self, session_id: UUID) -> Optional[AuthSessionDB]:
        """Update session's last used timestamp."""
        try:
            result = self.client.table("auth_sessions").update({
                "last_used_at": datetime.utcnow().isoformat()
            }).eq("id", str(session_id)).execute()
            
            if result.data and len(result.data) > 0:
                return AuthSessionDB(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to update session last used: {e}")
            return None
    
    async def delete(self, session_id: UUID) -> bool:
        """Delete an auth session."""
        try:
            result = self.client.table("auth_sessions").delete().eq("id", str(session_id)).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to delete auth session: {e}")
            return False
    
    async def delete_user_sessions(self, user_id: UUID) -> bool:
        """Delete all sessions for a user."""
        try:
            result = self.client.table("auth_sessions").delete().eq("user_id", str(user_id)).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to delete user sessions: {e}")
            return False
    
    async def delete_expired_sessions(self) -> int:
        """Delete all expired sessions."""
        try:
            result = self.client.table("auth_sessions").delete().lt(
                "expires_at", datetime.utcnow().isoformat()
            ).execute()
            return len(result.data) if result.data else 0
        except Exception as e:
            logger.error(f"Failed to delete expired sessions: {e}")
            return 0