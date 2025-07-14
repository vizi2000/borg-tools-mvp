"""CV Generation repository for database operations."""
from typing import Optional, List
from uuid import UUID
from datetime import datetime, timedelta
import logging
from supabase import Client
from ..models.database import CVGenerationDB, CVGenerationCreate, CVGenerationUpdate
from ..core.supabase import get_supabase

logger = logging.getLogger(__name__)


class CVGenerationRepository:
    """Repository for CV generation database operations."""
    
    def __init__(self, supabase_client: Optional[Client] = None):
        """Initialize repository with Supabase client."""
        self.client = supabase_client or get_supabase()
    
    async def create(self, cv_data: CVGenerationCreate) -> Optional[CVGenerationDB]:
        """Create a new CV generation record."""
        try:
            result = self.client.table("cv_generations").insert(cv_data.model_dump()).execute()
            if result.data and len(result.data) > 0:
                return CVGenerationDB(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to create CV generation: {e}")
            return None
    
    async def get_by_id(self, cv_id: UUID) -> Optional[CVGenerationDB]:
        """Get CV generation by ID."""
        try:
            result = self.client.table("cv_generations").select("*").eq("id", str(cv_id)).execute()
            if result.data and len(result.data) > 0:
                return CVGenerationDB(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to get CV generation by ID: {e}")
            return None
    
    async def get_by_user_id(self, user_id: UUID, limit: int = 10) -> List[CVGenerationDB]:
        """Get CV generations for a user."""
        try:
            result = self.client.table("cv_generations").select("*").eq(
                "user_id", str(user_id)
            ).order("created_at", desc=True).limit(limit).execute()
            
            if result.data:
                return [CVGenerationDB(**cv) for cv in result.data]
            return []
        except Exception as e:
            logger.error(f"Failed to get CV generations by user ID: {e}")
            return []
    
    async def update(self, cv_id: UUID, cv_data: CVGenerationUpdate) -> Optional[CVGenerationDB]:
        """Update CV generation record."""
        try:
            update_data = cv_data.model_dump(exclude_unset=True)
            result = self.client.table("cv_generations").update(update_data).eq(
                "id", str(cv_id)
            ).execute()
            if result.data and len(result.data) > 0:
                return CVGenerationDB(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to update CV generation: {e}")
            return None
    
    async def update_status(self, cv_id: UUID, status: str, pdf_url: Optional[str] = None) -> Optional[CVGenerationDB]:
        """Update CV generation status and optionally PDF URL."""
        try:
            update_data = {"status": status}
            
            if status == "completed":
                update_data["completed_at"] = datetime.utcnow().isoformat()
                # Set expiration to 24 hours from now
                update_data["expires_at"] = (datetime.utcnow() + timedelta(hours=24)).isoformat()
            
            if pdf_url:
                update_data["pdf_url"] = pdf_url
            
            result = self.client.table("cv_generations").update(update_data).eq(
                "id", str(cv_id)
            ).execute()
            
            if result.data and len(result.data) > 0:
                return CVGenerationDB(**result.data[0])
            return None
        except Exception as e:
            logger.error(f"Failed to update CV status: {e}")
            return None
    
    async def delete(self, cv_id: UUID) -> bool:
        """Delete a CV generation record."""
        try:
            result = self.client.table("cv_generations").delete().eq("id", str(cv_id)).execute()
            return True
        except Exception as e:
            logger.error(f"Failed to delete CV generation: {e}")
            return False
    
    async def get_active_generations(self, user_id: UUID) -> List[CVGenerationDB]:
        """Get active (non-expired) CV generations for a user."""
        try:
            result = self.client.table("cv_generations").select("*").eq(
                "user_id", str(user_id)
            ).gt("expires_at", datetime.utcnow().isoformat()).order(
                "created_at", desc=True
            ).execute()
            
            if result.data:
                return [CVGenerationDB(**cv) for cv in result.data]
            return []
        except Exception as e:
            logger.error(f"Failed to get active CV generations: {e}")
            return []