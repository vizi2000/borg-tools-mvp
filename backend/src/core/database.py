"""Database initialization and health checks."""
import logging
from typing import Optional
from supabase import Client
from .supabase import get_supabase

logger = logging.getLogger(__name__)


async def check_database_connection() -> bool:
    """Check if database connection is working."""
    try:
        client = get_supabase()
        
        # Simple query to test connection
        result = client.table("users").select("count", count="exact").limit(0).execute()
        
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


async def initialize_database() -> bool:
    """Initialize database on startup."""
    try:
        logger.info("Initializing database connection...")
        
        # Check connection
        if not await check_database_connection():
            logger.error("Failed to connect to database")
            return False
        
        logger.info("Database initialized successfully")
        return True
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        return False


async def cleanup_expired_sessions() -> int:
    """Clean up expired auth sessions."""
    try:
        from ..repositories import AuthSessionRepository
        auth_repo = AuthSessionRepository()
        
        deleted_count = await auth_repo.delete_expired_sessions()
        
        if deleted_count > 0:
            logger.info(f"Cleaned up {deleted_count} expired sessions")
        
        return deleted_count
        
    except Exception as e:
        logger.error(f"Failed to cleanup expired sessions: {e}")
        return 0