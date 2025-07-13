"""
Application configuration settings.
"""

import os
from typing import List, Optional

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Environment
    ENVIRONMENT: str = Field(default="development")
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Borg-Tools API"
    
    # Security
    SECRET_KEY: str = Field(..., description="Secret key for JWT tokens")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    ALLOWED_HOSTS: List[str] = Field(
        default=["localhost", "127.0.0.1", "0.0.0.0"]
    )
    
    # Database
    DATABASE_URL: str = Field(..., description="PostgreSQL database URL")
    
    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379")
    
    # GitHub OAuth
    GITHUB_CLIENT_ID: str = Field(..., description="GitHub OAuth client ID")
    GITHUB_CLIENT_SECRET: str = Field(..., description="GitHub OAuth client secret")
    
    # AI APIs
    ANTHROPIC_API_KEY: str = Field(..., description="Anthropic API key")
    OPENAI_API_KEY: str = Field(..., description="OpenAI API key")
    
    # Supabase
    SUPABASE_URL: str = Field(..., description="Supabase project URL")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(..., description="Supabase service role key")
    SUPABASE_BUCKET_NAME: str = Field(default="cv-pdfs")
    
    # Monitoring
    SENTRY_DSN: Optional[str] = Field(default=None)
    LANGFUSE_SECRET_KEY: Optional[str] = Field(default=None)
    LANGFUSE_PUBLIC_KEY: Optional[str] = Field(default=None)
    
    # Rate Limiting
    RATE_LIMIT_PER_HOUR: int = Field(default=100)
    RATE_LIMIT_PER_DAY: int = Field(default=1000)
    
    # Feature Flags
    FEATURE_CV_SEARCH: bool = Field(default=False)
    FEATURE_AI_SUGGESTIONS: bool = Field(default=False)
    FEATURE_RECRUITER_MODE: bool = Field(default=False)
    FEATURE_API_ACCESS: bool = Field(default=False)
    FEATURE_BUDDY_INTEGRATION: bool = Field(default=True)
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str]:
        """Parse CORS origins from string or list."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @field_validator("ALLOWED_HOSTS", mode="before")
    @classmethod
    def assemble_allowed_hosts(cls, v: str | List[str]) -> List[str]:
        """Parse allowed hosts from string or list."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()