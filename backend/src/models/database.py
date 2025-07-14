"""Database models for Supabase tables."""
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, HttpUrl, Field


class UserDB(BaseModel):
    """User model for database operations."""
    id: UUID
    github_id: int
    github_username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    avatar_url: Optional[HttpUrl] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    company: Optional[str] = None
    blog: Optional[str] = None
    github_profile_url: Optional[HttpUrl] = None
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime


class UserCreate(BaseModel):
    """Model for creating a new user."""
    github_id: int
    github_username: str
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    avatar_url: Optional[HttpUrl] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    company: Optional[str] = None
    blog: Optional[str] = None
    github_profile_url: Optional[HttpUrl] = None


class UserUpdate(BaseModel):
    """Model for updating user information."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    avatar_url: Optional[HttpUrl] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    company: Optional[str] = None
    blog: Optional[str] = None
    github_profile_url: Optional[HttpUrl] = None
    last_login_at: Optional[datetime] = None


class CVGenerationDB(BaseModel):
    """CV Generation model for database operations."""
    id: UUID
    user_id: UUID
    status: str = Field(default="pending", pattern="^(pending|processing|completed|failed)$")
    pdf_url: Optional[HttpUrl] = None
    github_data: Optional[Dict[str, Any]] = None
    linkedin_data: Optional[Dict[str, Any]] = None
    ai_summary: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class CVGenerationCreate(BaseModel):
    """Model for creating a new CV generation."""
    user_id: UUID
    github_data: Optional[Dict[str, Any]] = None
    linkedin_data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class CVGenerationUpdate(BaseModel):
    """Model for updating CV generation."""
    status: Optional[str] = Field(None, pattern="^(pending|processing|completed|failed)$")
    pdf_url: Optional[HttpUrl] = None
    github_data: Optional[Dict[str, Any]] = None
    linkedin_data: Optional[Dict[str, Any]] = None
    ai_summary: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    completed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None


class AuthSessionDB(BaseModel):
    """Auth Session model for database operations."""
    id: UUID
    user_id: UUID
    access_token: str
    refresh_token: Optional[str] = None
    expires_at: datetime
    created_at: datetime
    last_used_at: datetime


class AuthSessionCreate(BaseModel):
    """Model for creating a new auth session."""
    user_id: UUID
    access_token: str
    refresh_token: Optional[str] = None
    expires_at: datetime


class UsageStatDB(BaseModel):
    """Usage statistics model for database operations."""
    id: UUID
    user_id: UUID
    endpoint: str
    method: str
    status_code: Optional[int] = None
    response_time_ms: Optional[int] = None
    created_at: datetime


class UsageStatCreate(BaseModel):
    """Model for creating usage statistics."""
    user_id: UUID
    endpoint: str
    method: str
    status_code: Optional[int] = None
    response_time_ms: Optional[int] = None