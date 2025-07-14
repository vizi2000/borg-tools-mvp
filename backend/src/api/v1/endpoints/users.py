"""
User management endpoints.
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from src.core.logging import get_logger
from src.services.user_service import UserService
from src.models.database import UserUpdate
from .auth import verify_jwt_token

logger = get_logger(__name__)
router = APIRouter()


class UserProfile(BaseModel):
    """User profile model."""
    id: str
    github_id: int
    github_username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    company: Optional[str] = None
    blog: Optional[str] = None
    github_profile_url: Optional[str] = None
    created_at: str
    last_login_at: str
    stats: Optional[dict] = None


class UserUpdateRequest(BaseModel):
    """User profile update request."""
    full_name: Optional[str] = Field(default=None, max_length=100)
    email: Optional[str] = Field(default=None)
    bio: Optional[str] = Field(default=None, max_length=500)
    location: Optional[str] = Field(default=None, max_length=100)
    company: Optional[str] = Field(default=None, max_length=100)
    blog: Optional[str] = Field(default=None)


class UsageStats(BaseModel):
    """User usage statistics."""
    monthly_limit: int
    current_usage: int
    reset_date: str
    plan: str


@router.get("/me", response_model=UserProfile)
async def get_current_user(current_user: dict = Depends(verify_jwt_token)):
    """Get current user profile."""
    try:
        user_service = UserService()
        user_id = UUID(current_user["sub"])
        
        # Get user profile
        user = await user_service.get_user_profile(user_id)
        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )
        
        # Get user stats
        stats = await user_service.get_user_stats(user_id)
        
        logger.info("User profile retrieved", user_id=str(user_id))
        
        return UserProfile(
            id=str(user.id),
            github_id=user.github_id,
            github_username=user.github_username,
            email=user.email,
            full_name=user.full_name,
            avatar_url=user.avatar_url,
            bio=user.bio,
            location=user.location,
            company=user.company,
            blog=user.blog,
            github_profile_url=user.github_profile_url,
            created_at=user.created_at.isoformat(),
            last_login_at=user.last_login_at.isoformat(),
            stats=stats
        )
        
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid user ID format"
        )
    except Exception as e:
        logger.error("Failed to get user profile", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve user profile"
        )


@router.put("/me", response_model=UserProfile)
async def update_current_user(
    request: UserUpdateRequest,
    current_user: dict = Depends(verify_jwt_token)
):
    """Update current user profile."""
    try:
        user_service = UserService()
        user_id = UUID(current_user["sub"])
        
        # Convert request to UserUpdate model
        update_data = UserUpdate(**request.model_dump(exclude_unset=True))
        
        # Update user profile
        updated_user = await user_service.update_user_profile(user_id, update_data)
        if not updated_user:
            raise HTTPException(
                status_code=404,
                detail="User not found or update failed"
            )
        
        # Get updated stats
        stats = await user_service.get_user_stats(user_id)
        
        logger.info("User profile updated", user_id=str(user_id), update_data=request.model_dump(exclude_none=True))
        
        return UserProfile(
            id=str(updated_user.id),
            github_id=updated_user.github_id,
            github_username=updated_user.github_username,
            email=updated_user.email,
            full_name=updated_user.full_name,
            avatar_url=updated_user.avatar_url,
            bio=updated_user.bio,
            location=updated_user.location,
            company=updated_user.company,
            blog=updated_user.blog,
            github_profile_url=updated_user.github_profile_url,
            created_at=updated_user.created_at.isoformat(),
            last_login_at=updated_user.last_login_at.isoformat(),
            stats=stats
        )
        
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid user ID format"
        )
    except Exception as e:
        logger.error("Failed to update user profile", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to update user profile"
        )


@router.get("/me/usage", response_model=UsageStats)
async def get_user_usage(current_user: dict = Depends(verify_jwt_token)):
    """Get user usage statistics."""
    try:
        user_service = UserService()
        user_id = UUID(current_user["sub"])
        
        # Get user stats which includes CV counts
        stats = await user_service.get_user_stats(user_id)
        
        # For now, using simple limits
        # In production, this would be based on subscription tier
        monthly_limit = 10  # Free tier limit
        current_usage = stats.get("total_cvs", 0)
        
        return UsageStats(
            monthly_limit=monthly_limit,
            current_usage=current_usage,
            reset_date="2025-02-01T00:00:00Z",
            plan="free"
        )
        
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid user ID format"
        )
    except Exception as e:
        logger.error("Failed to get user usage", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve usage statistics"
        )


@router.delete("/me")
async def delete_current_user(current_user: dict = Depends(verify_jwt_token)):
    """Delete current user account."""
    try:
        user_service = UserService()
        user_id = UUID(current_user["sub"])
        
        # Delete user account and all associated data
        success = await user_service.delete_user_account(user_id)
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete user account"
            )
        
        logger.info("User account deleted", user_id=str(user_id))
        
        return {"message": "Account deleted successfully"}
        
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid user ID format"
        )
    except Exception as e:
        logger.error("Failed to delete user account", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to delete user account"
        )