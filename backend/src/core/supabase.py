"""Supabase client configuration and initialization."""
from typing import Optional
from supabase import create_client, Client
from .config import settings
import logging

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Singleton Supabase client."""
    
    _instance: Optional['SupabaseClient'] = None
    _client: Optional[Client] = None
    
    def __new__(cls) -> 'SupabaseClient':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize Supabase client if not already initialized."""
        if self._client is None:
            # Use mock client for testing when Supabase is not configured
            if not settings.SUPABASE_URL or settings.SUPABASE_URL.startswith("https://test."):
                from .supabase_mock import MockSupabaseClient
                self._client = MockSupabaseClient()
                logger.info("Using mock Supabase client for testing")
            elif settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
                try:
                    self._client = create_client(
                        settings.SUPABASE_URL,
                        settings.SUPABASE_SERVICE_ROLE_KEY
                    )
                    logger.info("Supabase client initialized successfully")
                except Exception as e:
                    logger.error(f"Failed to initialize Supabase client: {e}")
                    # Fall back to mock client
                    from .supabase_mock import MockSupabaseClient
                    self._client = MockSupabaseClient()
                    logger.warning("Falling back to mock Supabase client")
    
    @property
    def client(self) -> Client:
        """Get the Supabase client instance."""
        if self._client is None:
            raise RuntimeError("Supabase client not initialized. Check your environment variables.")
        return self._client


# Global instance - initialize lazily
supabase_client: Optional[SupabaseClient] = None

def _get_or_create_client() -> SupabaseClient:
    """Get or create the Supabase client instance."""
    global supabase_client
    if supabase_client is None:
        supabase_client = SupabaseClient()
    return supabase_client


def get_supabase() -> Client:
    """Get Supabase client for dependency injection."""
    client = _get_or_create_client()
    return client.client